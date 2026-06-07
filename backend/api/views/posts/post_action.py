from django.contrib.contenttypes.models import ContentType
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Community, Message, Notification, Post, PostReaction, SavedPost
from ...utils.community import ensure_community_admin
from ...utils.notifications import send_global_notification


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_like(request, post_id):
    user = request.user

    try:
        post = Post.objects.get(post_id=post_id)
    except Post.DoesNotExist:
        return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)

    existing = PostReaction.objects.filter(post=post, user=user).first()

    if existing:
        existing.delete()
        liked = False

        post_content_type = ContentType.objects.get_for_model(post)
        Notification.objects.filter(
            receiver=post.author,
            actor=user,
            content_type=post_content_type,
            object_id=post.post_id,
            type=Notification.Type.COMMENT,
        ).delete()

    else:
        PostReaction.objects.create(post=post, user=user)
        liked = True

        send_global_notification(
            sender=user, receiver=post.author, notification_type="post_reaction", target_object=post
        )

    likes_count = PostReaction.objects.filter(post=post, user__isnull=False).count()

    return Response({"liked": liked, "likes_count": likes_count}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def save_post(request, post_id):
    user = request.user

    try:
        post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist:
        return Response({"error": "Post not found"}, status=status.HTTP_444_NOT_FOUND)

    saved = SavedPost.objects.filter(user=user, post=post).first()

    if saved:
        saved.delete()
        return Response({"saved": False, "message": "Post unsaved"}, status=status.HTTP_200_OK)
    else:
        SavedPost.objects.create(user=user, post=post)
        return Response({"saved": True, "message": "Post saved"}, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_pin_post(request, post_id):
    user = request.user
    try:
        post = Post.objects.get(pk=post_id, author=user)
    except Post.DoesNotExist:
        return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)

    if post.is_pinned:
        post.is_pinned = False
    else:
        Post.objects.filter(author=user).update(is_pinned=False)
        post.is_pinned = True

    post.save(update_fields=["is_pinned"])

    return Response({"is_pinned": post.is_pinned}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_post(request):
    user = request.user
    text = request.data.get("text", "")
    post_id = request.data.get("post_id")

    shared_post = None
    if post_id:
        try:
            shared_post = Post.objects.get(post_id=post_id)
            if not text:
                text = "Shared a post"
        except Post.DoesNotExist:
            return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)

    if not text and not shared_post:
        return Response({"error": "Empty message"}, status=status.HTTP_400_BAD_REQUEST)

    msg = Message.objects.create(
        conversation_id=request.data["recipient_id"],
        content=text,
        sender=user,
        shared_post=shared_post,
        parent_message=None,
    )

    return Response(
        {
            "id": msg.message_id,
            "text": msg.content,
            "type": "post" if shared_post else "text",
            "shared_post_id": post_id,
            "time": msg.sent_at.strftime("%H:%M"),
            "senderId": "me",
        },
        status=status.HTTP_200_OK,
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_post(post_id):
    try:
        post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist:
        return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)
    post.delete()
    return Response({"message": "Post deleted"}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_community_highlight(request, post_id):
    print(request.data)
    community_id = request.data["community_id"]
    ensure_community_admin(request.user, community_id)

    community = get_object_or_404(Community, pk=community_id)
    post = get_object_or_404(Post, pk=post_id)

    if post.community_id != community.pk:
        return Response(
            {"error": "You can only highlight posts that were published inside this community."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if post.is_highlighted:
        post.is_highlighted = False
        post.highlighted_at = None
        post.save(update_fields=["is_highlighted", "highlighted_at"])

        return Response(
            {"is_highlighted": False, "message": "Post successfully removed from community highlights."},
            status=status.HTTP_200_OK,
        )
    else:
        post.is_highlighted = True
        post.highlighted_at = timezone.now()
        post.save(update_fields=["is_highlighted", "highlighted_at"])

        return Response(
            {"is_highlighted": True, "message": "Post successfully added to community highlights."},
            status=status.HTTP_200_OK,
        )
