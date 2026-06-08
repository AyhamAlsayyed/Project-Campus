from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Comment, Post
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
        notification_type="comment_reply" if parent_comment else "post_comment",
        target_object=comment,
    )

    serializer = CommentSerializer(comment, context={"request": request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)
