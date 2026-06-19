from django.db.models import Case, F, IntegerField, Q, Value, When
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import (
    Comment,
    Community,
    CommunityMember,
    Friendship,
    Post,
    PostReaction,
    SavedPost,
)
from ...serializers import PostSerializer
from ...utils.blocked_users import get_blocked_user_sets
from ...utils.feed import base_annotations, engagement_annotations
from ...utils.uni_page import get_user_university


def get_friendship_sets(user):
    friendships = Friendship.objects.filter(
        Q(user1=user) | Q(user2=user), relation_type=Friendship.RelationType.USER_TO_USER
    ).values("user1_id", "user2_id", "status")

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
    page_id = request.GET.get("page")
    filter_type = request.GET.get("filter", "recommended")

    qs = Post.objects.all().annotate(**base_annotations(user))

    # get blocked users
    users_blocked_by_me, users_who_blocked_me = get_blocked_user_sets(user)
    all_blocked_users = users_blocked_by_me | users_who_blocked_me

    # user profile feed
    if user_id:
        if int(user_id) == user.id:
            qs = qs.filter(author_id=user_id)
        else:
            qs = qs.filter(author_id=user_id, is_approved=True)

        qs = qs.order_by("-is_pinned", "-created_at")

    # page profile feed
    elif page_id:
        if int(page_id) == user.id:
            qs = qs.filter(author_id=page_id)
        else:
            qs = qs.filter(author_id=page_id, is_approved=True)

        qs = qs.order_by("-created_at")

    # friends feed
    elif filter_type == "friends":
        accepted_users, _ = get_friendship_sets(user)
        if not accepted_users:
            qs = Post.objects.none()
        else:
            qs = qs.filter(author_id__in=accepted_users, is_approved=True).order_by("-created_at")

    # followed feed
    elif filter_type == "follow_page":
        followed_user_ids = Friendship.objects.filter(
            user1=user, status=Friendship.Status.FOLLOWING, relation_type=Friendship.RelationType.USER_TO_PAGE
        ).values_list("user2_id", flat=True)
        if not followed_user_ids:
            qs = Post.objects.none()
        else:
            qs = qs.filter(author_id__in=followed_user_ids, is_approved=True).order_by("-created_at")

    # community feed
    elif community_id:
        qs = qs.filter(community_id=community_id)

        is_privileged_moderator = False
        try:
            community_obj = Community.objects.get(pk=community_id)
            if community_obj.owner == user:
                is_privileged_moderator = True
            else:
                is_privileged_moderator = CommunityMember.objects.filter(
                    community_id=community_id,
                    user=user,
                    status=CommunityMember.Status.APPROVED,
                    role__in=[CommunityMember.Role.OWNER, CommunityMember.Role.ADMIN],
                ).exists()
        except Community.DoesNotExist:
            return Response({"error": "Community not found"}, status=status.HTTP_404_NOT_FOUND)

        if filter_type == "pending":
            if not is_privileged_moderator:
                return Response(
                    {"error": "You do not have administrative permissions to view pending posts."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            qs = qs.filter(is_approved=False)

        elif filter_type == "my_pending":
            qs = qs.filter(author=user, is_approved=False)

        # my approved community posts filter
        elif filter_type == "my_approved":
            qs = qs.filter(author=user, is_approved=True)

        else:
            qs = qs.filter(is_approved=True)

        if filter_type in ["recommended", "popular", "trending"]:
            qs = qs.annotate(**engagement_annotations())

        if filter_type in ["recent", "pending", "my_pending", "my_approved"]:
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
        qs = qs.filter(is_approved=True)

        community_ids = CommunityMember.objects.filter(user=user).values_list("community_id", flat=True)
        followed_user_ids = Friendship.objects.filter(
            user1=user, status=Friendship.Status.FOLLOWING, relation_type=Friendship.RelationType.USER_TO_PAGE
        ).values_list("user2_id", flat=True)
        accepted_users, blocked_users = get_friendship_sets(user)
        uni_page = get_user_university(user)
        if uni_page is not None:
            uni_page_user_id = uni_page.user.id
        else:
            uni_page_user_id = None

        # exclude own and blocked users posts
        qs = qs.exclude(author_id=user.id)
        if all_blocked_users:
            qs = qs.exclude(Q(community__isnull=True) & Q(author_id__in=all_blocked_users))

        if filter_type != "latest":
            qs = qs.annotate(**engagement_annotations())

            qs = (
                qs.annotate(
                    p_university=Case(
                        When(author_id=uni_page_user_id, then=Value(50)),
                        default=Value(0),
                        output_field=IntegerField(),
                    ),
                    p_community=Case(
                        When(community_id__in=community_ids, then=Value(30)),
                        default=Value(0),
                        output_field=IntegerField(),
                    ),
                    p_following=Case(
                        When(author_id__in=followed_user_ids, then=Value(20)),
                        default=Value(0),
                        output_field=IntegerField(),
                    ),
                    p_friendship=Case(
                        When(author_id__in=accepted_users, then=Value(30)),
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

    qs = qs.select_related("author__profile", "author__page", "community").prefetch_related("media", "poll_options__votes__user__profile")[:limit]

    serializer = PostSerializer(qs, many=True, context={"request": request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_saved_posts(request):
    user = request.user

    users_blocked_by_me, users_who_blocked_me = get_blocked_user_sets(user)
    all_blocked_users = users_blocked_by_me | users_who_blocked_me

    saved = SavedPost.objects.filter(user=user).order_by("-created_at")

    post_ids = [s.post.post_id for s in saved]

    posts_qs = Post.objects.filter(post_id__in=post_ids).annotate(**base_annotations(user))

    # exclude normal posts
    if all_blocked_users:
        posts_qs = posts_qs.exclude(Q(community__isnull=True) & Q(author_id__in=all_blocked_users))

    posts_qs = posts_qs.select_related("author__profile", "author__page").prefetch_related("media", "poll_options__votes__user__profile")

    serializer = PostSerializer(posts_qs, many=True, context={"request": request})
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_activity_posts(request):
    """Activity posts - exclude posts from blocked users (normal posts only)"""
    user = request.user

    users_blocked_by_me, users_who_blocked_me = get_blocked_user_sets(user)
    all_blocked_users = users_blocked_by_me | users_who_blocked_me

    liked_ids = PostReaction.objects.filter(user=user).values_list("post_id", flat=True)
    commented_ids = Comment.objects.filter(author=user).values_list("post_id", flat=True)

    posts = (
        Post.objects.filter(Q(post_id__in=liked_ids) | Q(post_id__in=commented_ids))
        .annotate(**base_annotations(user))
        .select_related("author__profile", "author__page")
        .prefetch_related("media", "poll_options__votes__user__profile")
        .order_by("-created_at")
        .distinct()
    )

    # filter out normal posts from blocked users in activity
    if all_blocked_users:
        posts = posts.exclude(Q(community__isnull=True) & Q(author_id__in=all_blocked_users))

    serializer = PostSerializer(posts, many=True, context={"request": request})
    return Response(serializer.data)
