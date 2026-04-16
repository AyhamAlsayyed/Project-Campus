from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Friendship, Post, PostReaction, Report


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
        reporter_user=request.user,
        reported_content_id=post.post_id,
        content_type=Report.ContentType.SPAM_SCAMS_FRAUD,  # you can make this dynamic later
        reason=reason,
        final_action=Report.FinalAction.CONTENT_LABELING,
    )

    return Response({"message": "Post reported successfully"}, status=201)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def block_post(request, post_id):
    try:
        post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist:
        return Response({"error": "Post not found"}, status=404)

    current_user = request.user
    target_user = post.author_user

    if not target_user:
        return Response({"error": "Cannot block page authors yet"}, status=400)

    if current_user == target_user:
        return Response({"error": "You cannot block yourself"}, status=400)

    friendship = Friendship.objects.filter(
        Q(user1=current_user, user2=target_user) | Q(user1=target_user, user2=current_user)
    ).first()

    if friendship:
        friendship.status = Friendship.Status.BLOCKED
        friendship.save()
    else:
        Friendship.objects.create(user1=current_user, user2=target_user, status=Friendship.Status.BLOCKED)

    return Response({"message": "User blocked successfully"}, status=200)
