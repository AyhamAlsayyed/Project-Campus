from datetime import timedelta

from django.db.models import Case, Count, F, IntegerField, Value, When
from django.db.models.expressions import ExpressionWrapper
from django.db.models.functions import Now
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import CommunityMember, FollowPage, Post


def _get_user_university_page_id(user):
    student = getattr(user, "student_profile", None)
    if student and student.university_page_id:
        return student.university_page_id

    instructor = getattr(user, "instructor_profile", None)
    if instructor and instructor.university_page_id:
        return instructor.university_page_id

    return None


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
def feed(request):
    limit = int(request.query_params.get("limit") or 20)
    limit = max(1, min(limit, 50))

    user = request.user

    community_ids = list(CommunityMember.objects.filter(user=user).values_list("community_id", flat=True))
    followed_page_ids = list(FollowPage.objects.filter(user=user).values_list("page_id", flat=True))
    uni_page_id = _get_user_university_page_id(user)

    qs = (
        Post.objects.all()
        .annotate(
            reactions_count=Count("reactions", distinct=True),
            comments_count=Count("comments", distinct=True),
            p_university=Case(
                When(author_page_id=uni_page_id, then=Value(50)),
                default=Value(0),
                output_field=IntegerField(),
            ),
            p_community=Case(
                When(community_id__in=community_ids, then=Value(30)),
                default=Value(0),
                output_field=IntegerField(),
            ),
            p_following=Case(
                When(author_page_id__in=followed_page_ids, then=Value(20)),
                default=Value(0),
                output_field=IntegerField(),
            ),
            p_engagement=ExpressionWrapper(
                (F("reactions_count") * Value(2)) + F("comments_count"),
                output_field=IntegerField(),
            ),
        )
        .annotate(
            p_engagement_capped=Case(
                When(p_engagement__gte=20, then=Value(20)),
                default=F("p_engagement"),
                output_field=IntegerField(),
            ),
            p_fresh=Case(
                When(created_at__gte=Now() - timedelta(hours=6), then=Value(20)),
                When(created_at__gte=Now() - timedelta(hours=24), then=Value(10)),
                When(created_at__gte=Now() - timedelta(days=3), then=Value(5)),
                default=Value(0),
                output_field=IntegerField(),
            ),
        )
        .annotate(
            score=F("p_university") + F("p_community") + F("p_following") + F("p_engagement_capped") + F("p_fresh")
        )
        .order_by("-score", "-created_at")
        .select_related("author_user", "author_page", "community")
        .prefetch_related("media")
    )[:limit]

    data = []
    for p in qs:
        author_avatar = None
        author_username = None
        author_tag = None

        if p.author_user_id:
            author_username = p.author_user.username
            profile = getattr(p.author_user, "profile", None)
            if profile and getattr(profile, "profile_image", None):
                author_avatar = file_url(request, getattr(profile, "profile_image", None))

        if p.author_page_id:
            author_username = p.author_page.page_name
            author_tag = p.author_page.page_type
            author_avatar = file_url(request, getattr(p.author_page, "profile_image", None))

        media_items = []
        for m in p.media.all().order_by("order_index"):
            media_items.append(
                {
                    "type": (m.media_type or "").lower(),
                    "url": file_url(request, m.media_file) or file_url(request, m.media_url),
                }
            )

        data.append(
            {
                "id": p.post_id,
                "content": p.content_text,
                "post_type": p.post_type,
                "created_at": p.created_at.isoformat(),
                "author_username": author_username,
                "author_avatar": author_avatar,
                "tag": author_tag,
                "media": media_items,
                "likes_count": p.reactions_count,
                "comments_count": p.comments_count,
            }
        )

    return Response(data, status=200)
