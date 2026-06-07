from datetime import timedelta

from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.db.models import (
    Case,
    Count,
    Exists,
    F,
    IntegerField,
    OuterRef,
    Q,
    Value,
    When,
)
from django.db.models.functions import Now
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import (
    Community,
    CommunityMember,
    CommunityRequest,
    Friendship,
    Post,
    Report,
    Subscription,
)
from ...serializers import CommunitySerializer, PostSerializer
from ...utils.community import ensure_community_admin
from ...utils.feed import base_annotations
from ...utils.notifications import send_global_notification


def file_url(request, f):
    if not f:
        return None
    if isinstance(f, str):
        return request.build_absolute_uri(f) if f.startswith("/") else f
    try:
        return request.build_absolute_uri(f.url)
    except Exception:
        return None


def notify_community_admins(community, actor, text):

    admins = CommunityMember.objects.filter(
        community=community,
        role__in=[CommunityMember.Role.OWNER, CommunityMember.Role.ADMIN],
        status=CommunityMember.Status.APPROVED,
    ).select_related("user")

    for member in admins:
        send_global_notification(
            sender=actor,
            receiver=member.user,
            notification_type="community_admin_alert",
            target_object=community,
            custom_text=text,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def communities(request):
    user = request.user
    filter_type = request.query_params.get("filter", "recommended")

    membership_qs = CommunityMember.objects.filter(
        user=user,
        community_id=OuterRef("community_id"),
    )

    friends_id = (
        Friendship.objects.filter(
            Q(user1=user) | Q(user2=user),
            status=Friendship.Status.ACCEPTED,
        )
        .annotate(
            friend_id=Case(
                When(user1=user, then=F("user2_id")),
                When(user2=user, then=F("user1_id")),
                output_field=IntegerField(),
            )
        )
        .values_list("friend_id", flat=True)
    )

    qs = Community.objects.all().annotate(
        is_joined=Exists(membership_qs.filter(status="approved")),
        request_sent=Exists(membership_qs.filter(status="pending")),
        members_count=Count(
            "memberships",
            filter=Q(memberships__status="approved"),
            distinct=True,
        ),
        friends_count=Count(
            "memberships",
            filter=Q(memberships__user__id__in=friends_id, memberships__status="approved"),
            distinct=True,
        ),
    )

    if filter_type == "owned":
        qs = (
            qs.filter(
                is_joined=True,
                memberships__user=user,
                memberships__role="owner",
            )
            .distinct()
            .order_by("-created_at")
        )

    elif filter_type == "joined":
        qs = qs.filter(is_joined=True).order_by("-created_at")

    elif filter_type == "popular":
        qs = qs.order_by("-members_count", "-created_at")

    elif filter_type == "trending":
        qs = qs.annotate(
            recent_members=Count(
                "memberships",
                filter=Q(memberships__joined_at__gte=Now() - timedelta(days=3), memberships__status="approved"),
                distinct=True,
            )
        ).order_by("-recent_members", "-members_count")

    elif filter_type == "friends_related":
        final_communities = []
        priority_1_qs = qs.filter(friends_count__gt=0, is_joined=False).order_by("-friends_count", "-members_count")[:5]

        final_communities.extend(list(priority_1_qs))
        needed_slots = 5 - len(final_communities)
        if needed_slots > 0:
            already_included_ids = [c.community_id for c in final_communities]

            priority_2_qs = (
                qs.filter(is_joined=False)
                .exclude(community_id__in=already_included_ids)
                .order_by("-members_count")[:needed_slots]
            )

            final_communities.extend(list(priority_2_qs))

        serializer = CommunitySerializer(final_communities, many=True, context={"request": request})
        return Response(serializer.data)

    else:  # default
        community_ids = CommunityMember.objects.filter(user=user).values("community_id")

        qs = (
            qs.annotate(
                p_joined=Case(
                    When(community_id__in=community_ids, then=Value(50)),
                    default=Value(0),
                    output_field=IntegerField(),
                ),
                p_popularity=F("members_count"),
                p_fresh=Case(
                    When(created_at__gte=Now() - timedelta(days=3), then=Value(20)),
                    default=Value(0),
                    output_field=IntegerField(),
                ),
            )
            .annotate(score=F("p_joined") + F("p_popularity") + F("p_fresh"))
            .order_by("-score")
        )

    serializer = CommunitySerializer(qs, many=True, context={"request": request})

    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def community_detail(request, community_id):
    try:
        c = Community.objects.get(community_id=community_id)
    except Community.DoesNotExist:
        return Response({"error": "Community not found"}, status=status.HTTP_404_NOT_FOUND)

    is_muted = False
    user_role = None
    user = request.user

    if user and user.is_authenticated:
        is_muted = CommunityMember.objects.filter(community=c, user=user, is_muted=True).exists()

        membership = CommunityMember.objects.filter(community=c, user=user, status="approved").first()
        if membership:
            user_role = membership.role

    return Response(
        {
            "id": c.community_id,
            "name": c.name,
            "description": c.description,
            "is_private": c.privacy == "private",
            "is_muted": is_muted,
            "user_role": user_role,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def community_post_settings(request, community_id):
    ensure_community_admin(request.user, community_id)
    community = get_object_or_404(Community, pk=community_id)

    if request.method == "POST":
        requires_approval = request.data.get("requires_post_approval")
        if requires_approval is not None:
            community.requires_post_approval = bool(requires_approval)
            community.save(update_fields=["requires_post_approval"])
            return Response(
                {
                    "message": "Settings updated successfully.",
                    "requires_post_approval": community.requires_post_approval,
                },
                status=status.HTTP_200_OK,
            )

        return Response({"error": "Missing requires_post_approval parameter."}, status=status.HTTP_400_BAD_REQUEST)

    return Response({"requires_post_approval": community.requires_post_approval}, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def fetch_community_highlights(request, community_id):
    user = request.user

    community = get_object_or_404(Community, community_id=community_id)

    posts = (
        Post.objects.filter(community=community, is_highlighted=True)
        .annotate(**base_annotations(user))
        .select_related("author__profile")
        .prefetch_related("media")
        .order_by("-highlighted_at")[:5]
    )

    serializer = PostSerializer(posts, many=True, context={"request": request})
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def join_community(request, community_id):
    user = request.user

    try:
        community = Community.objects.get(community_id=community_id)
    except Community.DoesNotExist:
        return Response({"error": "Community not found"}, status=404)

    _, created = CommunityMember.objects.get_or_create(
        user=user,
        community=community,
        defaults={"status": CommunityMember.Status.APPROVED, "role": CommunityMember.Role.MEMBER},
    )

    if created:
        notify_community_admins(
            community=community,
            actor=user,
            text=f"{user.username} joined {community.name}",
        )

    return Response({"message": "Joined successfully"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def request_join_community(request, community_id):
    user = request.user

    try:
        community = Community.objects.get(community_id=community_id)
    except Community.DoesNotExist:
        return Response({"error": "Community not found"}, status=404)

    _, created = CommunityMember.objects.get_or_create(
        user=user,
        community=community,
        defaults={"status": CommunityMember.Status.PENDING, "role": CommunityMember.Role.MEMBER},
    )

    if created:
        notify_community_admins(
            community=community,
            actor=user,
            text=f"{user.username} requested to join {community.name}",
        )

    return Response({"message": "Request sent"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_reported_posts(request, community_id):
    ensure_community_admin(request.user, community_id)

    post_content_type = ContentType.objects.get_for_model(Post)

    reported_post_ids = Report.objects.filter(
        content_type_obj=post_content_type, final_action="", university_page_id=id
    ).values_list("object_id", flat=True)

    reported_posts = Post.objects.filter(pk__in=reported_post_ids, community_id=id).distinct().select_related("author")

    serializer = PostSerializer(reported_posts, many=True, context={"request": request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_community_or_request(request):
    user = request.user

    name = request.data.get("name")
    description = request.data.get("description", "").strip()
    privacy_raw = request.data.get("privacy", "public")

    if name:
        name = name.strip()
    privacy = privacy_raw.lower() if isinstance(privacy_raw, str) else "public"

    if not name or not description:
        return Response(
            {"error": "Community name and description fields are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    can_bypass = False
    try:
        if hasattr(user, "page") and user.page:
            if hasattr(user.page, "subscription") and user.page.subscription.is_active:
                if user.page.subscription.tier in [
                    Subscription.Tier.PREMIUM,
                    Subscription.Tier.UNIVERSITY,
                ]:
                    can_bypass = True
    except Exception:
        pass

    if can_bypass:
        banner_image = request.FILES.get("banner_image")
        can_pages = request.data.get("can_pages_post", True)
        can_instructors = request.data.get("can_instructors_post", True)
        can_students = request.data.get("can_students_post", True)

        privacy = privacy_raw.lower() if isinstance(privacy_raw, str) else "public"

        if not name or not description:
            return Response({"error": "Fields are required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            with transaction.atomic():
                community = Community.objects.create(
                    name=name,
                    description=description,
                    privacy=privacy,
                    banner_image=banner_image,
                    can_pages_post=can_pages,
                    can_instructors_post=can_instructors,
                    can_students_post=can_students,
                )
                CommunityMember.objects.create(
                    community=community,
                    user=user,
                    role="owner",
                    status="approved",
                )
        except Exception:
            return Response(
                {"error": "An unexpected database error occurred. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        image_url = None
        if community.banner_image:
            try:
                image_url = request.build_absolute_uri(community.banner_image.url)
            except Exception:
                image_url = None

        return Response(
            {
                "community": {
                    "id": community.community_id,
                    "name": community.name,
                    "description": community.description,
                    "image": image_url,
                    "is_private": community.privacy == "private",
                    "is_verified": getattr(community, "verified", False),
                    "is_joined": True,
                    "is_muted": False,
                    "request_sent": False,
                    "members_count": 1,
                    "friends_count": 0,
                    "sample_members": [],
                    "user_role": "owner",
                },
            },
            status=status.HTTP_201_CREATED,
        )

    else:
        justification = request.data.get("justification")

        if not justification or not justification.strip():
            return Response(
                {"justification": ["This field is required for standard community requests."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        has_pending_request = CommunityRequest.objects.filter(user=user, status="pending").exists()

        if has_pending_request:
            return Response(
                {
                    "error": "You already have an active pending community request. "
                    "You must wait for admins to review it before submitting another."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            community_request = CommunityRequest.objects.create(
                user=user,
                name=name,
                description=description,
                privacy=privacy,
                purpose_statement=justification.strip(),
                status="pending",
            )
        except Exception:
            return Response(
                {"error": "An unexpected error occurred while saving your request. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                "action": "requested",
                "detail": "Your request has been successfully submitted to campus admins for approval.",
                "request": {
                    "request_id": community_request.request_id,
                    "name": community_request.name,
                    "description": community_request.description,
                    "privacy": community_request.privacy.capitalize(),
                    "justification": community_request.purpose_statement,
                    "status": "pending",
                    "created_at": community_request.created_at,
                },
            },
            status=status.HTTP_202_ACCEPTED,
        )


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_community_info(request, community_id):
    user = request.user
    try:
        community = Community.objects.get(pk=community_id)
    except Community.DoesNotExist:
        return Response({"error": "Community not found"}, status=status.HTTP_404_NOT_FOUND)

    ensure_community_admin(user, community_id)

    description = request.data.get("description")
    is_public_raw = request.data.get("is_public")
    banner_image = request.FILES.get("banner")

    if description is not None:
        community.description = description.strip()

    if is_public_raw is not None:
        if is_public_raw.lower() == "true":
            community.privacy = Community.Privacy.PUBLIC
        elif is_public_raw.lower() == "false":
            community.privacy = Community.Privacy.PRIVATE

    if banner_image is not None:
        community.banner_image = banner_image

    try:
        community.save()
    except Exception:
        return Response(
            {"error": "An error occurred while saving your changes."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    updated_banner_url = ""
    if community.banner_image:
        try:
            updated_banner_url = request.build_absolute_uri(community.banner_image.url)
        except Exception:
            updated_banner_url = ""

    return Response(
        {
            "message": "Changes saved successfully!",
            "community": {
                "id": community.community_id,
                "description": community.description,
                "privacy": community.privacy,
                "is_private": community.privacy == Community.Privacy.PRIVATE,
                "banner_url": updated_banner_url,
            },
        },
        status=status.HTTP_200_OK,
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_community(request, community_id):
    member = ensure_community_admin(request.user, community_id)
    if member.role != CommunityMember.Role.OWNER:
        raise PermissionDenied("Only the community owner can delete this community.")

    community = get_object_or_404(Community, pk=community_id)

    community.delete()

    return Response({"message": "Community has been successfully and permanently deleted."}, status=status.HTTP_200_OK)
