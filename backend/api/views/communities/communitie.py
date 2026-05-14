from datetime import timedelta

from django.contrib.contenttypes.models import ContentType
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
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Community, CommunityMember, Friendship, Instructor, Notification
from ...serializers import CommunitySerializer


def file_url(request, f):
    if not f:
        return None
    if isinstance(f, str):
        return request.build_absolute_uri(f) if f.startswith("/") else f
    try:
        return request.build_absolute_uri(f.url)
    except Exception:
        return None


def notify_community_admins(community, actor, notif_type, text):
    # send notification to owner and admins
    admins = CommunityMember.objects.filter(
        community=community,
        role__in=[CommunityMember.Role.OWNER, CommunityMember.Role.ADMIN],
        status="approved",
    ).select_related("user")

    notifications = [
        Notification(
            receiver=member.user,
            actor=actor,
            type=notif_type,
            content=text,
            content_type=ContentType.objects.get_for_model(community),
            object_id=community.community_id,
        )
        for member in admins
        if member.user != actor  # don't notify yourself
    ]

    Notification.objects.bulk_create(notifications)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def communities(request):
    user = request.user
    filter = request.query_params.get("filter", "recommended")

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
        members_count=Count("memberships", distinct=True),
        friends_count=Count(
            "memberships",
            filter=Q(memberships__user__id__in=friends_id),
            distinct=True,
        ),
    )

    if filter == "joined":
        qs = qs.filter(is_joined=True).order_by("-created_at")

    elif filter == "popular":
        qs = qs.order_by("-members_count", "-created_at")

    elif filter == "trending":
        qs = qs.annotate(
            recent_members=Count(
                "memberships",
                filter=Q(memberships__joined_at__gte=Now() - timedelta(days=3)),
                distinct=True,
            )
        ).order_by("-recent_members", "-members_count")
    elif filter == "friends_related":
        qs = qs.filter(friends_count__gt=0).order_by("-friends_count", "-members_count")

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
        return Response({"error": "Not found"}, status=404)

    return Response(
        {
            "id": c.community_id,
            "name": c.name,
            "description": c.description,
            "is_private": c.privacy == "private",
        }
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
        defaults={"status": "approved"},
    )

    if created:
        notify_community_admins(
            community=community,
            actor=user,
            notif_type=Notification.Type.SYSTEM,
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
        defaults={"status": "pending"},
    )

    if created:
        notify_community_admins(
            community=community,
            actor=user,
            notif_type=Notification.Type.SYSTEM,
            text=f"{user.username} requested to join {community.name}",
        )

    return Response({"message": "Request sent"})


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
