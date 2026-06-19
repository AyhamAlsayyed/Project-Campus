from django.contrib.auth import get_user_model
from django.db.models import Exists, OuterRef, Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Community, CommunityMember, Page, Post
from ...serializers import CommunitySerializer, PageSerializer, PostSerializer, UserSerializer
from ...utils.feed import base_annotations

User = get_user_model()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def search(request):
    user = request.user
    query = request.query_params.get("q", "").strip()
    is_dropdown = request.query_params.get("dropdown", "false").lower() == "true"

    if not query:
        return Response({"people": [], "communities": [], "pages": [], "posts": []})

    # Dropdown: 3 results each, no posts
    # Full page: 20 results each, includes posts
    limit = 3 if is_dropdown else 20

    # ── People ──
    users = (
        User.objects.filter(
            Q(username__icontains=query) | Q(profile__full_name__icontains=query),
            page__isnull=True,
        )
        .select_related("profile")
        .exclude(id=user.id)
        .distinct()[:limit]
    )

    # ── Communities ──
    membership_qs = CommunityMember.objects.filter(
        user=user,
        community_id=OuterRef("pk"),
    )
    communities = (
        Community.objects.filter(Q(name__icontains=query) | Q(description__icontains=query))
        .annotate(
            is_joined=Exists(membership_qs.filter(status="approved")),
            request_sent=Exists(membership_qs.filter(status="pending")),
        )
        [:limit]
    )

    # ── Pages ──
    pages = Page.objects.filter(
        Q(page_full_name__icontains=query) | Q(description__icontains=query)
    )[:limit]

    result = {
        "people": UserSerializer(users, many=True, context={"request": request}).data,
        "communities": CommunitySerializer(communities, many=True, context={"request": request}).data,
        "pages": PageSerializer(pages, many=True, context={"request": request}).data,
        "posts": [],
    }

    # Posts only on the full search page
    if not is_dropdown:
        posts = (
            Post.objects.filter(
                Q(content_text__icontains=query) | Q(title__icontains=query),
                is_approved=True,
            )
            .annotate(**base_annotations(user))
            .select_related("author__profile")
            .prefetch_related("media", "poll_options__votes__user__profile")
            .order_by("-created_at")
            [:limit]
        )
        result["posts"] = PostSerializer(posts, many=True, context={"request": request}).data

    return Response(result)
