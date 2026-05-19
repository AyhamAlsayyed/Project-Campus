from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Comment, Post
from ...utils.blocked_users import get_blocked_user_sets, is_normal_post
from ...utils.notifications import send_global_notification
from ...utils.user_type import get_user_avatar


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def comment_list(request, post_id):
    user = request.user

    try:
        post = Post.objects.get(post_id=post_id)
    except Post.DoesNotExist:
        return Response({"error": "Post not found"}, status=404)

    comments = (
        Comment.objects.filter(post_id=post_id)
        .select_related(
            "author",
            "parent_comment__author",
        )
        .order_by("-created_at")
    )

    # filter comments on normal posts
    if is_normal_post(post):
        users_blocked_by_me, users_who_blocked_me = get_blocked_user_sets(user)
        all_blocked_users = users_blocked_by_me | users_who_blocked_me

        if all_blocked_users:
            comments = comments.exclude(author_id__in=all_blocked_users)

    data = []
    for c in comments:
        author = c.author
        avatar = get_user_avatar(request, author)

        replying_to, parent_id = None, None
        if c.parent_comment:
            parent = c.parent_comment
            replying_to = parent.author.username
            parent_id = parent.comment_id

        data.append(
            {
                "id": c.comment_id,
                "text": c.content,
                "user": author.username,
                "user_avatar": avatar,
                "user_id": author.id,
                "created_at": c.created_at.isoformat(),
                "parent_comment": parent_id,
                "replying_to": replying_to,
            }
        )

    return Response(data, status=200)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_comment(request, post_id):
    author = request.user
    text = request.data.get("text")
    parent_id = request.data.get("parent_comment")

    if not text:
        return Response({"error": "Text is required"}, status=400)

    try:
        post = Post.objects.get(post_id=post_id)
    except Post.DoesNotExist:
        return Response({"error": "Post not found"}, status=404)

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

    avatar = get_user_avatar(request, author)

    replying_to = None
    if parent_comment:
        replying_to = parent_comment.author.username
        parent_comment = parent_comment.comment_id

    return Response(
        {
            "id": comment.comment_id,
            "text": comment.content,
            "user": author.username,
            "user_id": author.id,
            "user_avatar": avatar,
            "created_at": comment.created_at.isoformat(),
            "parent_comment": parent_comment,
            "replying_to": replying_to,
        },
        status=201,
    )
