from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import (
    Community,
    CommunityMember,
    Friendship,
    Notification,
    Post,
    PostMedia,
)
from ...serializers import PostSerializer


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_post(request):
    user = request.user
    content = request.data.get("content", "")
    images = request.FILES.getlist("images")
    files = request.FILES.getlist("files")
    community_id = request.data.get("community")
    community = None
    if community_id:
        try:
            community = Community.objects.get(pk=community_id)
        except Community.DoesNotExist:
            return Response({"error": "Community not found"}, status=status.HTTP_400_BAD_REQUEST)

    post = Post.objects.create(content_text=content, author_user=user, community=community)

    i = 0
    for img in images:
        PostMedia.objects.create(post=post, media_type=PostMedia.MediaType.IMAGE, media_file=img, order_index=i)
        i += 1

    z = 0
    for file in files:
        PostMedia.objects.create(post=post, media_type=PostMedia.MediaType.FILE, media_file=file, order_index=z)
        z += 1

    # ---- notification ----
    if community:
        # notify all community members except the post author
        members = (
            CommunityMember.objects.filter(community=community, status="approved")
            .exclude(user=user)
            .select_related("user")
        )

        notifications = [
            Notification(
                receiver=member.user,
                actor=user,
                type=Notification.Type.ANNOUNCEMENTS,
                content=f"{user.username} posted in {community.name}",
                content_type=ContentType.objects.get_for_model(post),
                object_id=post.post_id,
            )
            for member in members
            if member.user
        ]

        Notification.objects.bulk_create(notifications)
    else:
        # notify all friends
        friendships = Friendship.objects.filter(
            Q(user1=user) | Q(user2=user), status=Friendship.Status.ACCEPTED
        ).select_related("user1", "user2")

        friends = []
        for friendship in friendships:
            friend = friendship.user2 if friendship.user1 == user else friendship.user1
            if friend:
                friends.append(friend)

        notifications = [
            Notification(
                receiver=friend,
                actor=user,
                type=Notification.Type.POST_CREATED,
                content=f"{user.username} posted something new",
                content_type=ContentType.objects.get_for_model(post),
                object_id=post.post_id,
            )
            for friend in friends
        ]

        if notifications:
            Notification.objects.bulk_create(notifications)

    serializer = PostSerializer(post, context={"request": request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)
