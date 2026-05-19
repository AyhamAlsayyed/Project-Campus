from django.contrib.auth import get_user_model
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Conversation, ConversationMember, Message, MessageMedia
from ...serializers import PostSerializer
from ...utils.notifications import send_global_notification
from ...utils.user_type import get_user_avatar

User = get_user_model()


def notify_other_members(conversation, sent_message, actor):
    other_members = (
        ConversationMember.objects.filter(conversation=conversation).select_related("user").exclude(user=actor)
    )

    for member in other_members:
        if not member or not member.user:
            continue

        if member.is_muted:
            continue

        if conversation.is_group:
            notification_type = "group_chat"
            preview_content = sent_message.content or "Sent a media attachment"
            custom_text = f"New message in group '{conversation.name or 'Group'}'. {actor.username}: {preview_content}"
        else:
            has_replied = Message.objects.filter(conversation=conversation, sender=member.user).exists()
            notification_type = "dm_existing" if has_replied else "dm_request"
            preview_content = sent_message.content or "Sent a media attachment"
            custom_text = f"{actor.username}: {preview_content}"

        send_global_notification(
            sender=actor,
            receiver=member.user,
            notification_type=notification_type,
            target_object=sent_message,
            custom_text=custom_text,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_conversations(request):
    user = request.user

    memberships = (
        ConversationMember.objects.filter(user=user)
        .filter(Q(conversation__status="accepted") | Q(conversation__created_by=user))
        .select_related("conversation", "conversation__last_message", "conversation__created_by")
        .prefetch_related("conversation__members__user__profile")
    )

    data = []

    for member in memberships:
        conv = member.conversation
        last_msg = conv.last_message
        conversation_owner = ""
        avatar = ""

        if conv.is_group:
            name = conv.name or "Group"
            if conv.image:
                avatar = request.build_absolute_uri(conv.image.url)
            if conv.created_by:
                conversation_owner = conv.created_by.username
        else:
            other_member_obj = conv.members.exclude(user=user).first()
            name = "Unknown"

            if other_member_obj:
                other_user = other_member_obj.user
                if other_user:
                    name = other_user.username
                    avatar = get_user_avatar(request, other_user)
                else:
                    name = "Deleted Account"

        msg_query = Message.objects.filter(conversation=conv)
        if member.last_read_at:
            msg_query = msg_query.filter(sent_at__gt=member.last_read_at)
        if member.cleared_at:
            msg_query = msg_query.filter(sent_at__gt=member.cleared_at)

        unread_count = msg_query.count()

        data.append(
            {
                "id": conv.conversation_id,
                "name": name,
                "avatar": avatar,
                "preview": last_msg.content if last_msg else "",
                "time": last_msg.sent_at.strftime("%H:%M") if last_msg else "",
                "last_message_time": last_msg.sent_at if last_msg else None,
                "unread_count": unread_count,
                "is_pinned": member.is_pinned,
                "is_group": conv.is_group,
                "conversations_owner": conversation_owner,
            }
        )
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_messages(request, conversation_id):
    user = request.user

    member = get_object_or_404(
        ConversationMember,
        conversation_id=conversation_id,
        user=user,
    )

    query = Message.objects.filter(conversation_id=conversation_id)

    if member.cleared_at:
        query = query.filter(sent_at__gt=member.cleared_at)

    messages = (
        query.select_related("sender", "parent_message", "parent_message__sender")
        .prefetch_related("media")
        .order_by("sent_at")
    )

    data = []

    for msg in messages:
        if msg.sender:
            sender_name = msg.sender.username
            avatar = get_user_avatar(request, msg.sender)
            sender_id = "me" if msg.sender == user else msg.sender.id
        else:
            sender_name = "System"
            avatar = None
            sender_id = "system"

        reply_to = None
        if msg.parent_message:
            parent_sender_name = getattr(msg.parent_message.sender, "username", "Unknown User")

            reply_to = {
                "id": msg.parent_message.message_id,
                "text": msg.parent_message.content,
                "sender_name": parent_sender_name,
            }

        media_list = []
        for item in msg.media.all():
            file_url = None
            if item.media_file:
                file_url = request.build_absolute_uri(item.media_file.url)
            elif item.media_url:
                file_url = item.media_url

            media_list.append(
                {"id": item.media_id, "type": item.media_type, "url": file_url, "order_index": item.order_index}
            )

        message_data = {
            "id": msg.message_id,
            "text": msg.content,
            "type": "text" if not media_list else "media",
            "time": msg.sent_at.strftime("%H:%M"),
            "sender": sender_name,
            "senderId": sender_id,
            "avatar": avatar,
            "reply_to_details": reply_to,
            "media": media_list,
        }

        if msg.shared_post:
            message_data["post"] = PostSerializer(msg.shared_post, context={"request": request}).data

        data.append(message_data)

    member.last_read_at = timezone.now()
    member.save(update_fields=["last_read_at"])

    return Response(data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_message(request, conversation_id):
    user = request.user
    text = request.data.get("text", "").strip()
    reply_to_id = request.data.get("reply_to")
    parent_message = None

    uploaded_files = request.FILES.getlist("images")

    if not text and not uploaded_files:
        return Response({"error": "Cannot send an empty message"}, status=status.HTTP_400_BAD_REQUEST)

    if reply_to_id:
        try:
            parent_message = Message.objects.get(message_id=reply_to_id)
        except Message.DoesNotExist:
            parent_message = None

    try:
        ConversationMember.objects.get(conversation_id=conversation_id, user=user)
    except ConversationMember.DoesNotExist:
        return Response({"error": "You are not a member!"}, status=status.HTTP_403_FORBIDDEN)

    msg = Message.objects.create(
        conversation_id=conversation_id,
        content=text if text else None,
        sender=user,
        parent_message=parent_message,
    )

    media_data_response = []
    media_index = 0

    for file_obj in uploaded_files:
        content_type = getattr(file_obj, "content_type", "")

        media_type = MessageMedia.MediaType.FILE

        if content_type.startswith("image/"):
            media_type = MessageMedia.MediaType.IMAGE
        elif content_type.startswith("video/"):
            media_type = MessageMedia.MediaType.VIDEO
        elif content_type.startswith("audio/"):
            media_type = MessageMedia.MediaType.AUDIO

        media_instance = MessageMedia.objects.create(
            message=msg, media_type=media_type, media_file=file_obj, order_index=media_index
        )

        media_data_response.append(
            {
                "id": media_instance.media_id,
                "type": media_instance.media_type,
                "url": request.build_absolute_uri(media_instance.media_file.url),
                "order_index": media_index,
            }
        )
        media_index += 1

    conversation = Conversation.objects.get(conversation_id=conversation_id)
    notify_other_members(
        conversation=conversation,
        sent_message=msg,
        actor=user,
    )

    return Response(
        {
            "id": msg.message_id,
            "text": msg.content,
            "type": "text" if not media_data_response else "media",
            "time": msg.sent_at.strftime("%H:%M"),
            "senderId": "me",
            "media": media_data_response,
            "reply_to_details": (
                {
                    "id": parent_message.message_id,
                    "text": parent_message.content,
                    "sender_name": parent_message.sender.username if parent_message.sender else "Unknown",
                }
                if parent_message
                else None
            ),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_dm(request, user_id):
    current_user = request.user
    target_user = User.objects.get(id=user_id)
    existing = request.data.get("conversation_id")

    if existing:
        return Response({"id": existing})

    new_conv = Conversation.objects.create(is_group=False, created_by=current_user)
    ConversationMember.objects.create(conversation=new_conv, user=current_user)
    ConversationMember.objects.create(conversation=new_conv, user=target_user)

    send_global_notification(
        sender=current_user,
        receiver=target_user,
        notification_type="dm-request",
        target_object=new_conv,
        custom_text=f"{current_user.username} wants to start a conversation with you.",
    )
    return Response({"id": new_conv.conversation_id}, status=201)
