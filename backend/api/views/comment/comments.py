from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Comment


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


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def comment_list(request, post_id):

    if request.method == "GET":
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

    # ---------------- POST ----------------
    elif request.method == "POST":
        text = request.data.get("text")
        parent_id = request.data.get("parent_comment")

        if not text:
            return Response({"error": "Text is required"}, status=400)

        parent_comment = None
        if parent_id:
            parent_comment = Comment.objects.filter(comment_id=parent_id, post_id=post_id).first()

        comment = Comment.objects.create(
            post_id=post_id,
            author_user=request.user,
            content=text,
            parent_comment=parent_comment,
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
                "created_at": comment.created_at.isoformat(),
                "parent_comment": comment.parent_comment_id,
                "replying_to": replying_to,
            },
            status=201,
        )
