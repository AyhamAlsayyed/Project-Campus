from datetime import timedelta

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
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Community, CommunityMember, Friendship, Instructor
from ...serializers import CommunitySerializer
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

    if filter_type == "joined":
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
    user = request.user

    if user and user.is_authenticated:
        is_muted = CommunityMember.objects.filter(community=c, user=user, is_muted=True).exists()

    return Response(
        {
            "id": c.community_id,
            "name": c.name,
            "description": c.description,
            "is_private": c.privacy == "private",
            "is_muted": is_muted,
        },
        status=status.HTTP_200_OK,
    )


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


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def process_join_request(request, community_id):
    admin_user = request.user
    student_id = request.data.get("user_id")
    action = request.data.get("action")

    if action not in ["approve", "reject"]:
        return Response({"error": "Invalid action. Use 'approve' or 'reject'."}, status=400)

    try:
        community = Community.objects.get(community_id=community_id)
    except Community.DoesNotExist:
        return Response({"error": "Community not found"}, status=404)

    is_authorized = CommunityMember.objects.filter(
        community=community,
        user=admin_user,
        role__in=[CommunityMember.Role.OWNER, CommunityMember.Role.ADMIN],
        status="approved",
    ).exists()

    if not is_authorized:
        return Response({"error": "You do not have permission to manage this community."}, status=403)

    membership = (
        CommunityMember.objects.filter(community=community, user_id=student_id, status="pending")
        .select_related("user")
        .first()
    )

    if not membership:
        return Response({"error": "No pending join request found for this user."}, status=404)

    if action == "approve":
        membership.status = "approved"
        membership.save()

        send_global_notification(
            sender=admin_user,
            receiver=membership.user,
            notification_type="community_join_status",
            target_object=community,
            custom_text=f"Your request to join {community.name} was approved!",
        )
        return Response({"message": "User approved successfully."})

    else:  # action == "reject"
        membership.delete()

        send_global_notification(
            sender=admin_user,
            receiver=membership.user,
            notification_type="community_join_status",
            target_object=community,
            custom_text=f"Your request to join {community.name} was rejected.",
        )
        return Response({"message": "User request rejected."})


@api_view(["GET"])
def instructor_community_picks(request, instructor_id):
    instructor = get_object_or_404(Instructor, pk=instructor_id)
    picks = instructor.community_picks.all()

    serializer = CommunitySerializer(picks, many=True, context={"request": request})

    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_pick(request, community_id):
    instructor = request.user.instructor_profile
    community = get_object_or_404(Community, pk=community_id)

    if community in instructor.featured_communities.all():
        instructor.featured_communities.remove(community)
        return Response({"message": "Removed from picks"})
    else:
        instructor.featured_communities.add(community)
        return Response({"message": "Added to picks"})
