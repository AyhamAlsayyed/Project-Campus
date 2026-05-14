from django.contrib.contenttypes.models import ContentType
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Message, Notification, Post, PostReaction, Report, SavedPost


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_like(request, post_id):
    user = request.user

    try:
        post = Post.objects.get(post_id=post_id)
    except Post.DoesNotExist:
        return Response({"error": "Post not found"}, status=404)

    existing = PostReaction.objects.filter(post=post, user=user).first()

    if existing:
        existing.delete()
        liked = False
    else:
        PostReaction.objects.create(post=post, user=user)
        liked = True

        receiver = post.author

        should_notify = not (receiver == user)

        if should_notify:
            Notification.objects.create(
                receiver=receiver,
                actor_user=user,
                type=Notification.Type.LIKE,
                content=f"{user.username} liked your post",
                content_type=ContentType.objects.get_for_model(post),
                object_id=post.post_id,
            )

    likes_count = PostReaction.objects.filter(post=post, user__isnull=False).count()

    return Response({"liked": liked, "likes_count": likes_count}, status=200)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def report_post(request, post_id):
    try:
        post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist:
        return Response({"error": "Post not found"}, status=404)

    reason = request.data.get("reason", "No reason provided")

    Report.objects.create(
        reporter=request.user,
        reported_content_id=post.post_id,
        content_type=request.data["content_type"],
        reason=reason,
    )

    return Response({"message": "Post reported successfully"}, status=201)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def save_post(request, post_id):
    user = request.user

    try:
        post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist:
        return Response({"error": "Post not found"}, status=404)

    saved = SavedPost.objects.filter(user=user, post=post).first()

    if saved:
        saved.delete()
        return Response({"saved": False, "message": "Post unsaved"}, status=200)
    else:
        SavedPost.objects.create(user=user, post=post)
        return Response({"saved": True, "message": "Post saved"}, status=201)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_pin_post(request, post_id):
    user = request.user
    try:
        post = Post.objects.get(pk=post_id, author_user=user)
    except Post.DoesNotExist:
        return Response({"error": "Post not found"}, status=404)

    if post.is_pinned:
        post.is_pinned = False
    else:
        Post.objects.filter(author_user=user).update(is_pinned=False)
        post.is_pinned = True

    post.save(update_fields=["is_pinned"])

    return Response(
        {
            "is_pinned": post.is_pinned,
        }
    )


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
            return Response({"error": "Post not found"}, status=404)

    if not text and not shared_post:
        return Response({"error": "Empty message"}, status=400)

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
        }
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_post(request, post_id):
    try:
        post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist:
        return Response({"error": "Post not found"}, status=404)
    post.delete()
    return Response({"message": "Post deleted"}, status=200)
