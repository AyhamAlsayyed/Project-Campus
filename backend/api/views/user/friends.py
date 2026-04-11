from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Friendship

User = get_user_model()


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_friend_request(request):
    from_user = request.user
    to_user_id = request.data.get("to_user")

    if not to_user_id:
        return Response({"error": "to_user is required"}, status=400)

    if int(to_user_id) == from_user.id:
        return Response({"error": "You cannot add yourself"}, status=400)

    try:
        to_user = User.objects.get(id=to_user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    friendship = Friendship.objects.filter(
        Q(user1=from_user, user2=to_user) | Q(user1=to_user, user2=from_user)
    ).first()

    if not friendship:
        Friendship.objects.create(user1=from_user, user2=to_user, status=Friendship.Status.PENDING)
        return Response({"message": "Request sent"}, status=201)

    if friendship.status == Friendship.Status.PENDING:
        return Response({"message": "Request already sent"}, status=400)

    if friendship.status == Friendship.Status.REJECTED:
        friendship.status = Friendship.Status.PENDING
        friendship.user1 = from_user
        friendship.user2 = to_user
        friendship.save()
        return Response({"message": "Request re-sent"}, status=200)

    if friendship.status == Friendship.Status.ACCEPTED:
        return Response({"message": "Request already accepted"}, status=400)

    if friendship.status == Friendship.Status.BLOCKED:
        return Response({"message": "You are blocked"}, status=400)

    return Response({"message": "WTF"}, status=400)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def accept_friend_request(request):
    current_user = request.user
    from_user_id = request.data.get("user_id")

    if not from_user_id:
        return Response({"error": "user_id required"}, status=400)

    try:
        from_user = User.objects.get(id=from_user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    friendship = Friendship.objects.filter(
        user1=from_user, user2=current_user, status=Friendship.Status.PENDING
    ).first()

    if not friendship:
        return Response({"error": "No pending request"}, status=400)

    friendship.status = Friendship.Status.ACCEPTED
    friendship.save()

    return Response({"message": "Friend request accepted"}, status=200)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_friends_list(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    friendships = Friendship.objects.filter(
        Q(user1=user) | Q(user2=user), status=Friendship.Status.ACCEPTED
    ).select_related("user1", "user2")

    friends = []

    for f in friendships:
        friend = f.user2 if f.user1 == user else f.user1
        profile = getattr(friend, "profile", None)

        avatar = None
        if profile and profile.profile_image:
            avatar = request.build_absolute_uri(profile.profile_image.url)

        friends.append(
            {
                "id": friend.id,
                "username": friend.username,
                "full_name": getattr(profile, "full_name", ""),
                "avatar": avatar,
            }
        )

    return Response(friends, status=200)
