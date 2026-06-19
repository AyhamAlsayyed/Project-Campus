from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Conversation, ConversationMember, Friendship

User = get_user_model()


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
    current_user = get_object_or_404(User, id=request.user.id)
    member = get_object_or_404(
        ConversationMember.objects.select_related("conversation"),
        conversation_id=conversation_id,
        user=request.user,
    )

    conversation = member.conversation

    if conversation.is_academic and conversation.created_by_id == current_user.id:
        return Response(
            {"error": "The owner of an academic group cannot leave."},
            status=status.HTTP_403_FORBIDDEN,
        )

    was_admin = member.role == ConversationMember.Role.ADMIN
    is_group = conversation.is_group

    with transaction.atomic():
        member.delete()

        if is_group and was_admin:
            other_admins_exist = ConversationMember.objects.filter(
                conversation_id=conversation_id, role=ConversationMember.Role.ADMIN
            ).exists()

            if not other_admins_exist:
                oldest_member = (
                    ConversationMember.objects.filter(conversation_id=conversation_id)
                    .order_by("joined_at")
                    .select_for_update()
                    .first()
                )

                if oldest_member:
                    oldest_member.role = ConversationMember.Role.ADMIN
                    oldest_member.save(update_fields=["role"])

    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def soft_leave_group(request, conversation_id):
    """Leave a group but keep the chat visible (read-only, messages up to left_at)."""
    member = get_object_or_404(
        ConversationMember.objects.select_related("conversation"),
        conversation_id=conversation_id,
        user=request.user,
    )
    conversation = member.conversation
    if not conversation.is_group:
        return Response({"error": "Not a group."}, status=status.HTTP_400_BAD_REQUEST)
    if conversation.is_academic and conversation.created_by_id == request.user.id:
        return Response({"error": "Owner cannot leave."}, status=status.HTTP_403_FORBIDDEN)

    member.left_at = timezone.now()
    member.save(update_fields=["left_at"])
    return Response({"left_at": member.left_at.isoformat()}, status=status.HTTP_200_OK)


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
        is_blocked = Friendship.objects.filter(
            Q(user1=user, user2=sender_user) | Q(user1=sender_user, user2=user), status=Friendship.Status.BLOCKED
        ).exists()

        if is_blocked:
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
