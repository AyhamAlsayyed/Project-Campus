from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Post, PostReaction


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_like(request, post_id):
    user = request.user

    try:
        post = Post.objects.get(post_id=post_id)
    except Post.DoesNotExist:
        return Response({"error": "Post not found"}, status=404)

    existing = PostReaction.objects.filter(post=post, user=user).first()

    if existing:
        existing.delete()
        liked = False
    else:
        PostReaction.objects.create(post=post, user=user)
        liked = True

    likes_count = PostReaction.objects.filter(post=post, user__isnull=False).count()

    return Response({"liked": liked, "likes_count": likes_count}, status=200)
