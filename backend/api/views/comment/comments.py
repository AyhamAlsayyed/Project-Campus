from django.contrib.contenttypes.models import ContentType
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Comment, Notification, Page, Post
from ...utils.blocked_users import get_blocked_user_sets


def get_comment_author_data(request, c):
    if c.author_user:
        user = c.author_user
        profile = getattr(user, "profile", None)

        avatar = None
        if profile and getattr(profile, "profile_image", None):
            avatar = request.build_absolute_uri(profile.profile_image.url)

        return {
            "id": user.id,
            "type": "user",
            "username": user.username,
            "avatar": avatar,
        }

    elif c.author_page:
        page = c.author_page

        avatar = None
        if getattr(page, "profile_image", None):
            avatar = request.build_absolute_uri(page.profile_image.url)

        return {
            "id": page.page_id,
            "type": "page",
            "username": page.page_name,
            "avatar": avatar,
            "tag": page.page_type,
        }

    return None


def handle_comment_notification(comment, parent_comment, actor_user, actor_page):
    post = comment.post

    # if parent_comment then its a replay to a comment if not it a comment on a post
    if parent_comment:
        receiver_user = parent_comment.author_user
        receiver_page = parent_comment.author_page
    else:
        receiver_user = post.author_user
        receiver_page = post.author_page

    # dont send if the user commented on his own post or comment
    if actor_user and receiver_user and actor_user == receiver_user:
        return

    if actor_page and receiver_page and actor_page == receiver_page:
        return

    actor_name = actor_user.username if actor_user else actor_page.page_name

    if parent_comment:
        text = f"{actor_name} replied to your comment"
    else:
        text = f"{actor_name} commented on your post"

    Notification.objects.create(
        receiver_user=receiver_user,
        receiver_page=receiver_page,
        actor_user=actor_user,
        actor_page=actor_page,
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
            "author_page",
            "parent_comment__author_user",
            "parent_comment__author_page",
        )
        .order_by("-created_at")
    )

    # Filter out comments from blocked users (only if post is NOT in a community)
    if not post.community_id:
        users_blocked_by_me, users_who_blocked_me = get_blocked_user_sets(user)
        all_blocked_users = users_blocked_by_me | users_who_blocked_me

        if all_blocked_users:
            comments = comments.exclude(author_user_id__in=all_blocked_users)

    data = []
    for c in comments:
        author = get_comment_author_data(request, c)

        # derive replying_to from parent_comment
        replying_to = None
        if c.parent_comment:
            parent = c.parent_comment
            if parent.author_user:
                replying_to = parent.author_user.username
            elif parent.author_page:
                replying_to = parent.author_page.page_name

        data.append(
            {
                "id": c.comment_id,
                "text": c.content,
                "user": author["username"],
                "user_avatar": author["avatar"],
                "user_id": author["id"],
                "created_at": c.created_at.isoformat(),
                "parent_comment": c.parent_comment_id,
                "replying_to": replying_to,
            }
        )

    return Response(data, status=200)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_comment(request, post_id):
    text = request.data.get("text")
    parent_id = request.data.get("parent_comment")
    page_id = request.data.get("page_id")

    if not text:
        return Response({"error": "Text is required"}, status=400)

    parent_comment = None
    if parent_id:
        parent_comment = Comment.objects.filter(comment_id=parent_id, post_id=post_id).first()

    author_user = None
    author_page = None

    if page_id:
        try:
            author_page = Page.objects.get(page_id=page_id)
        except Page.DoesNotExist:
            return Response({"error": "Page not found"}, status=404)
    else:
        author_user = request.user

    comment = Comment.objects.create(
        post_id=post_id,
        author_user=author_user,
        author_page=author_page,
        content=text,
        parent_comment=parent_comment,
    )

    handle_comment_notification(
        comment=comment,
        parent_comment=parent_comment,
        actor_user=author_user,
        actor_page=author_page,
    )

    author = get_comment_author_data(request, comment)

    replying_to = None
    if parent_comment:
        if parent_comment.author_user:
            replying_to = parent_comment.author_user.username
        elif parent_comment.author_page:
            replying_to = parent_comment.author_page.page_name

    return Response(
        {
            "id": comment.comment_id,
            "text": comment.content,
            "user": author["username"],
            "user_id": author["id"],
            "user_avatar": author["avatar"],
            "type": author["type"],
            "created_at": comment.created_at.isoformat(),
            "parent_comment": comment.parent_comment_id,
            "replying_to": replying_to,
        },
        status=201,
    )
