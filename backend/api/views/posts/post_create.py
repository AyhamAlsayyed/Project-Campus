from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Community, Post, PostMedia
from ...serializers import PostSerializer


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_post(request):
    user = request.user
    content = request.data.get("content", "")
    images = request.FILES.getlist("images")
    files = request.FILES.getlist("files")
    community_id = request.data.get("community")
    community = None
    if community_id:
        try:
            community = Community.objects.get(pk=community_id)
        except Community.DoesNotExist:
            return Response({"error": "Community not found"}, status=status.HTTP_400_BAD_REQUEST)

    post = Post.objects.create(content_text=content, author_user=user, community=community)

    i = 0
    for img in images:
        PostMedia.objects.create(post=post, media_type=PostMedia.MediaType.IMAGE, media_file=img, order_index=i)
        i = i + 1

    z = 0
    for file in files:
        PostMedia.objects.create(post=post, media_type=PostMedia.MediaType.FILE, media_file=file, order_index=z)
        z = z + 1

    serializer = PostSerializer(post)
    return Response(serializer.data, status=status.HTTP_201_CREATED)
