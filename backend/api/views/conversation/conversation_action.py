from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Conversation, ConversationMember, Friendship


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_pin(request, conversation_id):
    member = get_object_or_404(ConversationMember, conversation_id=conversation_id, user=request.user)
    member.is_pinned = not member.is_pinned
    member.save(update_fields=["is_pinned"])
    return Response({"is_pinned": member.is_pinned})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_mute(request, conversation_id):
    member = get_object_or_404(ConversationMember, conversation_id=conversation_id, user=request.user)
    member.is_muted = not member.is_muted
    member.save(update_fields=["is_muted"])
    return Response({"is_muted": member.is_muted})


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_or_leave_chat(request, conversation_id):
    member = get_object_or_404(ConversationMember, conversation_id=conversation_id, user=request.user)
    member.delete()
    return Response(status=204)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def clear_chat(request, conversation_id):
    member = get_object_or_404(ConversationMember, conversation_id=conversation_id, user=request.user)

    member.cleared_at = timezone.now()
    member.save(update_fields=["cleared_at"])
    return Response({"message": "Chat cleared"}, status=204)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_read(request, conversation_id):
    member = get_object_or_404(ConversationMember, conversation_id=conversation_id, user=request.user)
    member.last_read_at = timezone.now()
    member.save(update_fields=["last_read_at"])
    return Response({"status": "marked unread"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_unread(request, conversation_id):
    member = get_object_or_404(ConversationMember, conversation_id=conversation_id, user=request.user)
    member.last_read_at = timezone.now() - timezone.timedelta(days=1)
    member.save(update_fields=["last_read_at"])
    return Response({"status": "marked unread"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def block_user_from_chat(request, conversation_id):
    """Finds the 'other' person in a DM and blocks them via Friendship model."""
    # for now it only work for dm's and not group chats
    convo = get_object_or_404(Conversation, conversation_id=conversation_id, is_group=False)
    other_member = convo.members.exclude(user=request.user).first()
    if not other_member or not other_member.user:
        return Response({"error": "Cannot block nothing"}, status=400)

    # Update or create friendship status to 'blocked'
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
    user = request.user

    pending_memberships = (
        ConversationMember.objects.filter(
            user=user,
            conversation__status=Conversation.Status.PENDING,
            conversation__is_group=False,
        )
        .exclude(conversation__created_by=user)
        .select_related("conversation", "conversation__last_message")
    )

    data = []
    for member in pending_memberships:
        conv = member.conversation
        last_msg = conv.last_message

        sender_member = conv.members.exclude(user=user).first()
        if not sender_member or not sender_member.user:
            continue

        sender_user = sender_member.user

        data.append(
            {
                "conversation_id": conv.conversation_id,
                "sender_username": sender_user.username,
                "sender_id": sender_user.id,
                "message_preview": last_msg.content if last_msg else "Sent an invite request.",
                "time": last_msg.sent_at.strftime("%H:%M") if last_msg else "",
                "date": last_msg.sent_at.isoformat() if last_msg else None,
            }
        )

    return Response(data, status=200)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def accept_chat_request(request, conversation_id):
    user = request.user

    member = get_object_or_404(ConversationMember, conversation_id=conversation_id, user=user)

    convo = member.conversation

    if convo.status == Conversation.Status.ACCEPTED:
        return Response({"message": "Conversation is already active."}, status=400)

    convo.status = Conversation.Status.ACCEPTED
    convo.save(update_fields=["status"])

    return Response({"message": "Chat request accepted successfully!"}, status=200)
