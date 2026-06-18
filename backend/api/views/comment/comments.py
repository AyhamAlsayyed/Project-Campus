from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Comment, CommentReaction, Post
from ...serializers import CommentSerializer
from ...utils.blocked_users import get_blocked_user_sets, is_normal_post
from ...utils.notifications import send_global_notification


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def comment_list(request, post_id):
    user = request.user

    try:
        post = Post.objects.get(post_id=post_id)
    except Post.DoesNotExist:
        return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)

    comments = (
        Comment.objects.filter(post_id=post_id)
        .select_related("author__profile", "parent_comment__author")
        .order_by("-created_at")
    )

    if is_normal_post(post):
        users_blocked_by_me, users_who_blocked_me = get_blocked_user_sets(user)
        all_blocked_users = users_blocked_by_me | users_who_blocked_me

        if all_blocked_users:
            comments = comments.exclude(author_id__in=all_blocked_users)

    serializer = CommentSerializer(comments, many=True, context={"request": request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_comment(request, post_id):
    author = request.user
    text = request.data.get("text")
    parent_id = request.data.get("parent_comment")

    if not text:
        return Response({"error": "Text is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        post = Post.objects.get(post_id=post_id)
    except Post.DoesNotExist:
        return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)

    parent_comment = None
    if parent_id:
        parent_comment = Comment.objects.filter(comment_id=parent_id, post_id=post_id).first()

    comment = Comment.objects.create(
        post_id=post_id,
        author=author,
        content=text,
        parent_comment=parent_comment,
    )

    send_global_notification(
        sender=author,
        receiver=parent_comment.author if parent_comment else post.author,
        notification_type="COMMENT" if parent_comment else "COMMENTED ON YOUR POST",
        target_object=comment,
    )

    serializer = CommentSerializer(comment, context={"request": request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def edit_comment(request, comment_id):
    user = request.user
    new_text = request.data.get("text", "").strip()

    if not new_text:
        return Response({"error": "Comment text cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

    comment = get_object_or_404(Comment, comment_id=comment_id)

    if comment.author != user:
        return Response(
            {"detail": "You do not have permission to edit this comment."}, status=status.HTTP_403_FORBIDDEN
        )

    comment.content = new_text
    comment.save(update_fields=["content"])

    serializer = CommentSerializer(comment, context={"request": request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_comment(request, comment_id):
    """
    Deletes a comment.
    Allows deletion if the requesting user is the comment author OR the post owner.
    """
    comment = get_object_or_404(Comment, comment_id=comment_id)

    is_comment_author = comment.author == request.user
    is_post_owner = comment.post.author == request.user

    if not (is_comment_author or is_post_owner):
        return Response(
            {"detail": "You do not have permission to delete this comment."}, status=status.HTTP_403_FORBIDDEN
        )

    comment.delete()

    return Response(
        {"message": "Comment and all its nested replies were successfully deleted."}, status=status.HTTP_200_OK
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_comment_like(request, comment_id):
    """
    Toggles a like reaction on a specific comment for the authenticated user.
    If the reaction already exists, it unlikes it (deletes the record).
    """
    user = request.user
    comment = get_object_or_404(Comment, pk=comment_id)

    existing_reaction = CommentReaction.objects.filter(comment=comment, user=user).first()

    if existing_reaction:
        existing_reaction.delete()
        return Response({"message": "Comment unliked successfully.", "is_liked": False}, status=status.HTTP_200_OK)
    else:
        CommentReaction.objects.create(comment=comment, user=user)
        return Response({"message": "Comment liked successfully.", "is_liked": True}, status=status.HTTP_201_CREATED)
