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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def comment_list(request, post_id):
    comments = (
        Comment.objects.filter(post_id=post_id).select_related("author_user", "author_page").order_by("-created_at")
    )

    data = []
    for c in comments:
        author = get_comment_author_data(request, c)

        data.append(
            {
                "id": c.comment_id,
                "text": c.content,
                "user": author["username"],
                "user_avatar": author["avatar"],
                "created_at": c.created_at.isoformat(),
                "parent_comment": c.parent_comment_id,
            }
        )

    return Response(data, status=200)
