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
    file = request.FILES.get("file", None)
    community_id = request.data.get("community")
    community = None
    if community_id:
        try:
            community = Community.objects.get(pk=community_id)
        except Community.DoesNotExist:
            return Response({"error": "Community not found"}, status=status.HTTP_400_BAD_REQUEST)

    post = Post.objects.create(content_text=content, author_user=user, community=community)

    for img in images:
        PostMedia.objects.create(post=post, media_type=PostMedia.MediaType.IMAGE, media_file=img)

    if file:
        PostMedia.objects.create(post=post, media_type=PostMedia.MediaType.FILE, media_file=file)

    serializer = PostSerializer(post)
    return Response(serializer.data, status=status.HTTP_201_CREATED)
