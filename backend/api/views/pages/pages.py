from django.db.models import Count
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import FollowPage, Page, Post


def file_url(request, f):
    """Build absolute URL for file fields"""
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
def followed_pages(request):
    # get all the pages that the user follows
    user = request.user

    follows = FollowPage.objects.filter(user=user).select_related("page")

    pages_data = []
    for follow in follows:
        page = follow.page
        pages_data.append(
            {
                "id": page.page_id,
                "name": page.page_name,
                "category": page.get_page_type_display(),
                "avatar": file_url(request, page.profile_image),
                "banner": file_url(request, page.banner_image),
                "verified": page.verified,
                "followed_at": follow.followed_at.isoformat(),
            }
        )

    return Response(pages_data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def recommended_pages(request):
    user = request.user

    followed_page_ids = FollowPage.objects.filter(user=user).values_list("page_id", flat=True)

    # Get pages user hasn't followed yet
    pages = Page.objects.exclude(page_id__in=followed_page_ids).annotate(
        followers_count=Count("followers", distinct=True),
        posts_count=Count("posts_as_page", distinct=True),
    )

    pages = pages.order_by("-verified", "-followers_count", "-posts_count")

    pages = pages[:5]

    recommendations = []
    for page in pages:
        recommendations.append(
            {
                "id": page.page_id,
                "name": page.page_name,
                "category": page.get_page_type_display(),
                "avatar": file_url(request, page.profile_image),
                "banner": file_url(request, page.banner_image),
                "verified": page.verified,
                "followers_count": page.followers_count,
                "posts_count": page.posts_count,
            }
        )

    return Response(recommendations)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_follow_page(request, page_id):
    user = request.user
    page = get_object_or_404(Page, page_id=page_id)

    follow_qs = FollowPage.objects.filter(user=user, page=page)

    if follow_qs.exists():
        follow_qs.delete()
        return Response({"status": "unfollowed", "is_followed": False}, status=200)

    FollowPage.objects.create(user=user, page=page)
    return Response({"status": "followed", "is_followed": True}, status=201)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def page_detail(request, page_id):
    user = request.user
    try:
        page = Page.objects.get(page_id=page_id)
    except Page.DoesNotExist:
        return Response({"error": "Page not found"}, status=404)

    is_following = FollowPage.objects.filter(user=user, page=page).exists()

    followers_count = FollowPage.objects.filter(page=page).count()
    posts_count = Post.objects.filter(author_page=page).count()

    return Response(
        {
            "id": page.page_id,
            "name": page.page_name,
            "description": page.description,
            "category": page.get_page_type_display(),
            "avatar": file_url(request, page.profile_image),
            "banner": file_url(request, page.banner_image),
            "verified": page.verified,
            "created_at": page.created_at.isoformat(),
            "is_following": is_following,
            "followers_count": followers_count,
            "posts_count": posts_count,
        }
    )
