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
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Community, CommunityMember


def file_url(request, f):
    if not f:
        return None
    if isinstance(f, str):
        return request.build_absolute_uri(f) if f.startswith("/") else f
    try:
        return request.build_absolute_uri(f.url)
    except Exception:
        return None


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def communities(request):
    user = request.user
    filter = request.query_params.get("filter", "recommended")

    membership_qs = CommunityMember.objects.filter(
        user=user,
        community_id=OuterRef("community_id"),
    )

    qs = Community.objects.all().annotate(
        is_joined=Exists(membership_qs.filter(status="approved")),
        request_sent=Exists(membership_qs.filter(status="pending")),
        members_count=Count("memberships", distinct=True),
    )

    # filterING LOGIC

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

    data = []
    for c in qs:
        data.append(
            {
                "id": c.community_id,
                "name": c.name,
                "description": c.description,
                "image": file_url(request, c.banner_image),
                "is_private": c.privacy == "private",
                "is_verified": False,
                "is_joined": c.is_joined,
                "request_sent": c.request_sent,
                "members_count": c.members_count,
            }
        )

    return Response(data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def join_community(request, community_id):
    user = request.user

    CommunityMember.objects.get_or_create(user=user, community_id=community_id, defaults={"status": "approved"})

    return Response({"message": "Joined successfully"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def request_join_community(request, community_id):
    user = request.user

    CommunityMember.objects.get_or_create(user=user, community_id=community_id, defaults={"status": "pending"})

    return Response({"message": "Request sent"})


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
