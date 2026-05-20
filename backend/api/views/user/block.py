from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Friendship, Post
from ...serializers import BlockedUserListSerializer

User = get_user_model()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def blocked_accounts_list(request):
    user = request.user
    search_query = request.query_params.get("search", "").strip()

    block_queryset = Friendship.objects.filter(user1=user, status=Friendship.Status.BLOCKED).select_related(
        "user2__profile",
        "user2__student_profile__university_page__user",
        "user2__instructor_profile__university_page__user",
    )

    total_blocked_count = block_queryset.count()

    blocked_users_list = [relation.user2 for relation in block_queryset if relation.user2]

    if search_query:
        blocked_users_list = [u for u in blocked_users_list if search_query.lower() in u.username.lower()]

    serializer = BlockedUserListSerializer(blocked_users_list, many=True, context={"request": request})

    return Response({"blocked_count": total_blocked_count, "results": serializer.data}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_block_user(request, post_id=None, user_id=None):
    current_user = request.user
    target_user = ""
    if post_id:
        try:
            post = Post.objects.get(pk=post_id)
            target_user = post.author
        except Post.DoesNotExist:
            return Response({"error": "Post not found"}, status=404)

    elif user_id:
        try:
            target_user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

    if not target_user:
        return Response({"error": "Cannot block page authors yet"}, status=400)

    if current_user == target_user:
        return Response({"error": "You cannot block yourself"}, status=400)

    friendship = Friendship.objects.filter(
        Q(user1=current_user, user2=target_user) | Q(user1=target_user, user2=current_user)
    ).first()

    if friendship:
        if friendship.status == Friendship.Status.BLOCKED:
            friendship.status = Friendship.Status.REJECTED
        else:
            friendship.status = Friendship.Status.BLOCKED
        friendship.save()
    else:
        Friendship.objects.create(user1=current_user, user2=target_user, status=Friendship.Status.BLOCKED)

    return Response({"message": "User blocked successfully"}, status=200)
