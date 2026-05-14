from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import FollowPage, Page, PageRating
from ...serializers import PageSerializer


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
    pages = [follow.page for follow in follows]

    serializer = PageSerializer(pages, many=True, context={"request": request})
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def recommended_pages(request):
    user = request.user
    followed_page_ids = FollowPage.objects.filter(user=user).values_list("page_id", flat=True)

    pages = Page.objects.exclude(page_id__in=followed_page_ids).order_by("-verified")[:5]

    serializer = PageSerializer(pages, many=True, context={"request": request})
    return Response(serializer.data)


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
    page = get_object_or_404(Page, page_id=page_id)

    serializer = PageSerializer(page, context={"request": request})
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def rate_page(request, page_id):
    user = request.user
    score = request.data.get("score")

    try:
        score_int = int(score)
        if not (1 <= score_int <= 5):
            return Response({"error": "Rating must be between 1 and 5"}, status=400)
    except (ValueError, TypeError):
        return Response({"error": "Invalid score format"}, status=400)

    page = get_object_or_404(Page, page_id=page_id)

    if hasattr(page, "user") and page.user == user:
        return Response({"error": "You cannot rate your own page"}, status=400)

    rating, created = PageRating.objects.update_or_create(page=page, user=user, score=score_int)

    serializer = PageSerializer(page, context={"request": request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)
