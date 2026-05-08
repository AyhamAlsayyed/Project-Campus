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
from django.db.models.expressions import ExpressionWrapper
from django.db.models.functions import Now
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import (
    Comment,
    CommunityMember,
    FollowPage,
    Friendship,
    Post,
    PostReaction,
    SavedPost,
)
from ...serializers import PostSerializer
from ...utils.blocked_users import get_blocked_user_sets


def _get_user_university_page_id(user):
    student = getattr(user, "student_profile", None)
    if student and student.university_page_id:
        return student.university_page_id

    instructor = getattr(user, "instructor_profile", None)
    if instructor and instructor.university_page_id:
        return instructor.university_page_id

    return None


def base_annotations(user):
    # Get ALL blocked relationships globally
    # blocked_map = get_all_blocked_relationships()

    # For each post author, if they have block relationships, exclude those users' reactions/comments
    # This is complex, so we'll filter in Python after fetching

    return {
        "reactions_count": Count("reactions", filter=Q(reactions__user__isnull=False), distinct=True),
        "comments_count": Count("comments", distinct=True),
        "is_liked": Exists(PostReaction.objects.filter(post_id=OuterRef("post_id"), user=user)),
        "is_saved": Exists(SavedPost.objects.filter(post_id=OuterRef("post_id"), user=user)),
    }


def engagement_annotations():
    return {
        "p_engagement": ExpressionWrapper(
            (F("reactions_count") * Value(2)) + F("comments_count"),
            output_field=IntegerField(),
        ),
        "p_engagement_capped": Case(
            When(p_engagement__gte=20, then=Value(20)),
            default=F("p_engagement"),
            output_field=IntegerField(),
        ),
        "p_fresh": Case(
            When(created_at__gte=Now() - timedelta(hours=6), then=Value(20)),
            When(created_at__gte=Now() - timedelta(hours=24), then=Value(10)),
            When(created_at__gte=Now() - timedelta(days=3), then=Value(5)),
            default=Value(0),
            output_field=IntegerField(),
        ),
    }


def get_friendship_sets(user):
    friendships = Friendship.objects.filter(Q(user1=user) | Q(user2=user)).values("user1_id", "user2_id", "status")

    accepted = set()
    blocked = set()

    for f in friendships:
        other_id = f["user2_id"] if f["user1_id"] == user.id else f["user1_id"]

        if f["status"] == Friendship.Status.ACCEPTED:
            accepted.add(other_id)
        elif f["status"] == Friendship.Status.BLOCKED:
            blocked.add(other_id)

    return accepted, blocked


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def feed(request, community_id=None):
    user = request.user
    limit = min(max(int(request.query_params.get("limit", 20)), 1), 50)

    community_id = community_id or request.GET.get("community_id")
    user_id = request.GET.get("user")
    filter_type = request.GET.get("filter", "recommended")

    qs = Post.objects.all().annotate(**base_annotations(user))

    # get blocked users
    users_blocked_by_me, users_who_blocked_me = get_blocked_user_sets(user)
    all_blocked_users = users_blocked_by_me | users_who_blocked_me

    # user profile feed
    if user_id:
        qs = qs.filter(author_user_id=user_id).order_by("-is_pinned", "-created_at")
        # Don't hide blocked users' posts on their own profile

    # friends feed
    elif filter_type == "friends":
        accepted_users, _ = get_friendship_sets(user)
        if not accepted_users:
            qs = Post.objects.none()
        else:
            # Exclude blocked users from friends feed
            qs = qs.filter(author_user_id__in=accepted_users)
            if all_blocked_users:
                qs = qs.exclude(author_user_id__in=all_blocked_users)
            qs = qs.order_by("-created_at")

    elif filter_type == "follow_page":
        followed_page_ids = FollowPage.objects.filter(user=user).values_list("page_id", flat=True)
        if not followed_page_ids:
            qs = Post.objects.none()
        else:
            qs = qs.filter(author_page_id__in=followed_page_ids).order_by("-created_at")

    # community feed (inside a specific community)
    elif community_id:
        qs = qs.filter(community_id=community_id)
        # DON'T filter blocked users in community view - everyone can see everything

        if filter_type in ["recommended", "popular", "trending"]:
            qs = qs.annotate(**engagement_annotations())

        if filter_type == "recent":
            qs = qs.order_by("-created_at")
        elif filter_type == "popular":
            qs = qs.order_by("-p_engagement", "-created_at")
        elif filter_type == "trending":
            qs = qs.annotate(trending_score=F("p_engagement_capped") + (F("p_fresh") * Value(2))).order_by(
                "-trending_score", "-created_at"
            )
        elif filter_type == "recommended":
            qs = qs.annotate(score=F("p_engagement_capped") + F("p_fresh")).order_by("-score", "-created_at")
        else:
            qs = qs.order_by("-created_at")

    # home feeed
    else:
        community_ids = CommunityMember.objects.filter(user=user).values_list("community_id", flat=True)
        followed_pages = FollowPage.objects.filter(user=user).values_list("page_id", flat=True)
        accepted_users, blocked_users = get_friendship_sets(user)
        uni_page_id = _get_user_university_page_id(user)

        # Exclude own posts and blocked users' posts (INCLUDING community posts)
        qs = qs.exclude(author_user_id=user.id)
        if all_blocked_users:
            qs = qs.exclude(author_user_id__in=all_blocked_users)

        if filter_type != "latest":
            qs = qs.annotate(**engagement_annotations())

            qs = (
                qs.annotate(
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
                        When(author_page_id__in=followed_pages, then=Value(20)),
                        default=Value(0),
                        output_field=IntegerField(),
                    ),
                    p_friendship=Case(
                        When(author_user_id__in=accepted_users, then=Value(30)),
                        default=Value(0),
                        output_field=IntegerField(),
                    ),
                )
                .annotate(
                    score=F("p_university")
                    + F("p_community")
                    + F("p_following")
                    + F("p_friendship")
                    + F("p_engagement_capped")
                    + F("p_fresh")
                )
                .order_by("-score", "-created_at")
            )
        else:
            qs = qs.order_by("-created_at")

    qs = qs.select_related("author_user__profile", "author_page", "community").prefetch_related("media")[:limit]

    serializer = PostSerializer(qs, many=True, context={"request": request})
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_saved_posts(request):
    """Saved posts - show even if author is blocked (user explicitly saved it)"""
    user = request.user

    saved = SavedPost.objects.filter(user=user).order_by("-created_at")

    post_map = {
        p.post_id: p
        for p in Post.objects.filter(post_id__in=[s.post_id for s in saved])
        .annotate(**base_annotations(user))
        .select_related("author_user__profile", "author_page")
        .prefetch_related("media")
    }

    ordered_posts = [post_map[s.post_id] for s in saved if s.post_id in post_map]

    serializer = PostSerializer(ordered_posts, many=True, context={"request": request})
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_activity_posts(request):
    user = request.user

    liked_ids = PostReaction.objects.filter(user=user).values_list("post_id", flat=True)
    commented_ids = Comment.objects.filter(author_user=user).values_list("post_id", flat=True)

    posts = (
        Post.objects.filter(Q(post_id__in=liked_ids) | Q(post_id__in=commented_ids))
        .annotate(**base_annotations(user))
        .select_related("author_user__profile", "author_page")
        .prefetch_related("media")
        .order_by("-created_at")
        .distinct()
    )

    serializer = PostSerializer(posts, many=True, context={"request": request})
    return Response(serializer.data)
