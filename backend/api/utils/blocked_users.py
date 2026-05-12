from django.db.models import Q

from ..models import Friendship


def get_blocked_user_sets(user):
    """
    Returns two sets:
    - users_blocked_by_me: Users I have blocked
    - users_who_blocked_me: Users who have blocked me
    """
    if not user or not user.is_authenticated:
        return set(), set()

    friendships = Friendship.objects.filter(Q(user1=user) | Q(user2=user), status=Friendship.Status.BLOCKED).values(
        "user1_id", "user2_id"
    )

    users_blocked_by_me = set()
    users_who_blocked_me = set()

    for f in friendships:
        if f["user1_id"] == user.id:
            users_blocked_by_me.add(f["user2_id"])
        else:
            users_who_blocked_me.add(f["user1_id"])

    return users_blocked_by_me, users_who_blocked_me


def get_all_blocked_relationships():
    """
    Returns a dict mapping user_id -> set of all users they have a block relationship with
    (bidirectional - if A blocks B, both A and B are in each other's sets)
    """
    friendships = Friendship.objects.filter(status=Friendship.Status.BLOCKED).values("user1_id", "user2_id")

    blocked_map = {}

    for f in friendships:
        user1_id = f["user1_id"]
        user2_id = f["user2_id"]

        if user1_id not in blocked_map:
            blocked_map[user1_id] = set()
        if user2_id not in blocked_map:
            blocked_map[user2_id] = set()

        blocked_map[user1_id].add(user2_id)
        blocked_map[user2_id].add(user1_id)

    return blocked_map


def is_normal_post(post):
    """Check if a post is a normal post (not in a community)"""
    return post.community_id is None
