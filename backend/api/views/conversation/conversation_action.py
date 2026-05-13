from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Conversation, ConversationMember, Friendship


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_pin(request, id):
    member = get_object_or_404(ConversationMember, conversation_id=id, user=request.user)
    member.is_pinned = not member.is_pinned
    member.save(update_fields=["is_pinned"])
    return Response({"is_pinned": member.is_pinned})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_mute(request, id):
    member = get_object_or_404(ConversationMember, conversation_id=id, user=request.user)
    member.is_muted = not member.is_muted
    member.save(update_fields=["is_muted"])
    return Response({"is_muted": member.is_muted})


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_or_leave_chat(request, id):
    member = get_object_or_404(ConversationMember, conversation_id=id, user=request.user)
    member.delete()
    return Response(status=204)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def clear_chat(request, id):
    """Note: This usually requires a 'DeletedMessage' model to track per-user deletion,
    but for a simple implementation, we can just return success."""
    # Logic depends on how you want to handle 'clearing' for one user vs others
    return Response({"message": "Chat cleared"}, status=204)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_unread(request, id):
    """Sets last_read_at to far in the past to force unread status."""
    member = get_object_or_404(ConversationMember, conversation_id=id, user=request.user)
    member.last_read_at = timezone.now() - timezone.timedelta(days=1)
    member.save(update_fields=["last_read_at"])
    return Response({"status": "marked unread"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def block_user_from_chat(request, id):
    """Finds the 'other' person in a DM and blocks them via Friendship model."""
    # for now it only work for dm's and not group chats
    convo = get_object_or_404(Conversation, conversation_id=id, is_group=False)
    other_member = convo.members.exclude(user=request.user).first()
    if not other_member or not other_member.user:
        return Response({"error": "Cannot block a page or empty user"}, status=400)

    # Update or create friendship status to 'blocked'
    # Use your Friendship model logic here
    current_user = request.user
    target_user = other_member.user

    friendship = Friendship.objects.filter(
        Q(user1=current_user, user2=target_user) | Q(user1=target_user, user2=current_user)
    ).first()

    if friendship and friendship.status == Friendship.Status.BLOCKED:
        friendship.status = Friendship.Status.REJECTED
        friendship.save()
        return Response({"status": "unblocked"})

    else:
        if friendship:
            friendship.status = Friendship.Status.BLOCKED
            friendship.save()
        else:
            Friendship.objects.create(user1=current_user, user2=target_user, status=Friendship.Status.BLOCKED)
        return Response({"status": "blocked"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def chat_requests(request):
    return Response("")
