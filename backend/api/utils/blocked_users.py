from django.db.models import Q

from ..models import Friendship


def get_blocked_user_sets(user):
    # this returns the users who blicked me and vis versa
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


def apply_block_filters(queryset, user, is_community_feed=False):
    users_blocked_by_me, users_who_blocked_me = get_blocked_user_sets(user)

    all_blocked_users = users_blocked_by_me | users_who_blocked_me

    if not all_blocked_users:
        return queryset

    # inside community page
    if is_community_feed:
        return queryset

    # everywhere else
    return queryset.exclude(author_user_id__in=all_blocked_users)
