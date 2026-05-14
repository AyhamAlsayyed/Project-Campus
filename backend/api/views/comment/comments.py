from django.contrib.contenttypes.models import ContentType
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Comment, Notification, Post
from ...utils.blocked_users import get_blocked_user_sets, is_normal_post
from ...utils.user_type import get_user_avatar


def handle_comment_notification(comment, parent_comment, actor):
    post = comment.post

    # if parent_comment then its a replay to a comment if not it a comment on a post
    if parent_comment:
        receiver = parent_comment.author
    else:
        receiver = post.author

    # dont send if the user commented on his own post or comment
    if actor and receiver and actor == receiver:
        return

    actor_name = actor.username

    if parent_comment:
        text = f"{actor_name} replied to your comment"
    else:
        text = f"{actor_name} commented on your post"

    Notification.objects.create(
        receiver=receiver,
        actor=actor,
        type=Notification.Type.COMMENT,
        content=text,
        content_type=ContentType.objects.get_for_model(comment),
        object_id=comment.comment_id,
    )


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
            "author_user",
            "parent_comment__author",
        )
        .order_by("-created_at")
    )

    # filter comments on normal posts
    if is_normal_post(post):
        users_blocked_by_me, users_who_blocked_me = get_blocked_user_sets(user)
        all_blocked_users = users_blocked_by_me | users_who_blocked_me

        if all_blocked_users:
            comments = comments.exclude(author_user_id__in=all_blocked_users)

    data = []
    for c in comments:
        author = c.author
        avatar = get_user_avatar(request, author)

        # derive replying_to from parent_comment
        replying_to, parent = None, None
        if c.parent_comment:
            parent = c.parent_comment
            replying_to = parent.author.username

        data.append(
            {
                "id": c.comment_id,
                "text": c.content,
                "user": author.username,
                "user_avatar": avatar,
                "user_id": author.id,
                "created_at": c.created_at.isoformat(),
                "parent_comment": parent.id,
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

    parent_comment = None
    if parent_id:
        parent_comment = Comment.objects.filter(comment_id=parent_id, post_id=post_id).first()

    comment = Comment.objects.create(
        post_id=post_id,
        author=author,
        content=text,
        parent_comment=parent_comment,
    )

    handle_comment_notification(
        comment=comment,
        parent_comment=parent_comment,
        actor=author,
    )

    avatar = get_user_avatar(request, comment)

    replying_to = None
    if parent_comment:
        replying_to = parent_comment.author.username

    return Response(
        {
            "id": comment.comment_id,
            "text": comment.content,
            "user": author.username,
            "user_id": author.id,
            "user_avatar": avatar,
            "created_at": comment.created_at.isoformat(),
            "parent_comment": parent_comment.comment_id,
            "replying_to": replying_to,
        },
        status=201,
    )
