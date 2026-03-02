from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import Post


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_posts(request):
    qs = Post.objects.select_related("author_user", "author_page").order_by("-created_at")[:50]

    data = []
    for p in qs:
        # author (user or page)
        author = None
        if p.author_user_id:
            profile = getattr(p.author_user, "profile", None)
            author = {
                "type": "user",
                "id": p.author_user_id,
                "username": p.author_user.username,
                "avatar": getattr(profile, "profile_image", None) if profile else None,
            }
        else:
            author = {
                "type": "page",
                "id": p.author_page_id,
                "name": p.author_page.page_name,
            }

        data.append(
            {
                "id": p.post_id,
                "contentText": p.content_text,
                "postType": p.post_type,
                "createdAt": p.created_at,
                "author": author,
            }
        )

    return Response(data, status=status.HTTP_200_OK)
