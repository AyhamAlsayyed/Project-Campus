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


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def decline_friend_request(request):
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

    friendship.status = Friendship.Status.REJECTED
    friendship.save()

    return Response({"message": "Friend request rejected"}, status=200)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_friends_list(request, user_id):
    try:
        target_user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    current_user = request.user

    # all friends of target user
    target_friendships = Friendship.objects.filter(
        Q(user1=target_user) | Q(user2=target_user), status=Friendship.Status.ACCEPTED
    ).select_related("user1__profile", "user2__profile")

    # all friends of current user
    current_friendships = Friendship.objects.filter(
        Q(user1=current_user) | Q(user2=current_user), status=Friendship.Status.ACCEPTED
    )

    current_friends_ids = set()
    for f in current_friendships:
        friend = f.user2 if f.user1 == current_user else f.user1
        current_friends_ids.add(friend.id)

    all_friends = []
    mutual_friends = []

    for f in target_friendships:
        friend = f.user2 if f.user1 == target_user else f.user1
        profile = getattr(friend, "profile", None)

        avatar_url = None
        if profile and profile.profile_image:
            avatar_url = request.build_absolute_uri(profile.profile_image.url)

        friend_data = {
            "id": friend.id,
            "username": friend.username,
            "full_name": getattr(profile, "full_name", ""),
            "avatar_url": avatar_url,
            "status": profile.status if profile else "offline",
        }

        all_friends.append(friend_data)

        if friend.id in current_friends_ids and friend.id != current_user.id:
            mutual_friends.append(friend_data)

    return Response({"mutual": mutual_friends, "all": all_friends}, status=200)
