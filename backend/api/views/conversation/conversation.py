from django.contrib.contenttypes.models import ContentType
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import ConversationMember, Message, Notification
from ...serializers import PostSerializer


def get_actor(request):
    user = request.user
    page_id = request.headers.get("X-Page-Id")

    if page_id:
        from ...models import Page

        try:
            page = Page.objects.get(id=page_id)
            return None, page
        except Page.DoesNotExist:
            return None, None

    return user, None


def notify_other_members(conversation, sent_message, actor_user, actor_page):
    """Notify all other members in the conversation that a new message was sent."""
    actor_name = actor_user.username if actor_user else actor_page.page_name

    # get all members except the sender
    other_members = (
        ConversationMember.objects.filter(conversation=conversation)
        .select_related("user", "page")
        .exclude(user=actor_user if actor_user else None)
    )

    if actor_page:
        other_members = other_members.exclude(page=actor_page)

    notifications = []
    for member in other_members:
        if not member.user and not member.page:
            continue

        # skip if muted
        if member.is_muted:
            continue

        notifications.append(
            Notification(
                receiver_user=member.user if member.user else None,
                receiver_page=member.page if member.page else None,
                actor_user=actor_user,
                actor_page=actor_page,
                type=Notification.Type.MESSAGE,
                content=f"{actor_name} sent a message",
                content_type=ContentType.objects.get_for_model(sent_message),
                object_id=sent_message.message_id,
            )
        )

    Notification.objects.bulk_create(notifications)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_conversations(request):
    user, page = get_actor(request)

    if user:
        memberships = ConversationMember.objects.filter(user=user)
    else:
        memberships = ConversationMember.objects.filter(page=page)

    memberships = memberships.select_related("conversation", "conversation__last_message").prefetch_related(
        "conversation__members__user__profile"
    )

    data = []

    for member in memberships:
        conv = member.conversation
        last_msg = conv.last_message
        conversation_owner = None

        if conv.is_group:
            name = conv.name or "Group"
            avatar = conv.image.url if conv.image else ""
            conversation_owner = conv.created_by_user.username
        else:
            other = conv.members.exclude(id=member.id).first()
            name = "Unknown"
            avatar = ""

            if other:
                if other.user:
                    name = other.user.username
                    if hasattr(other.user, "profile") and other.user.profile.profile_image:
                        avatar = other.user.profile.profile_image.url
                elif other.page:
                    name = other.page.page_name
                    if other.page.profile_image:
                        avatar = other.page.profile_image.url

        if member.last_read_at:
            unread_count = Message.objects.filter(conversation=conv, sent_at__gt=member.last_read_at).count()
        else:
            unread_count = Message.objects.filter(conversation=conv).count()

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
    user, page = get_actor(request)

    try:
        if user:
            member = ConversationMember.objects.get(conversation_id=conversation_id, user=user)
        else:
            member = ConversationMember.objects.get(conversation_id=conversation_id, page=page)
    except ConversationMember.DoesNotExist:
        return Response({"error": "Not allowed"}, status=403)

    messages = (
        Message.objects.filter(conversation_id=conversation_id)
        .select_related(
            "sender_user", "sender_page", "shared_post", "shared_post__author_user", "shared_post__author_page"
        )
        .order_by("sent_at")
    )

    data = []

    for msg in messages:
        sender_name = "Unknown"
        sender_id = "other"
        avatar = ""

        if msg.sender_user:
            sender_name = msg.sender_user.username
            if user and msg.sender_user == user:
                sender_id = "me"
            if hasattr(msg.sender_user, "profile") and msg.sender_user.profile.profile_image:
                avatar = msg.sender_user.profile.profile_image.url

        elif msg.sender_page:
            sender_name = msg.sender_page.page_name
            if page and msg.sender_page == page:
                sender_id = "me"
            if msg.sender_page.profile_image:
                avatar = msg.sender_page.profile_image.url

        message_data = {
            "id": msg.message_id,
            "text": msg.content,
            "type": "text",
            "time": msg.sent_at.strftime("%H:%M"),
            "sender": sender_name,
            "senderId": sender_id,
            "avatar": avatar,
            "reply_to_details": (
                {
                    "id": msg.parent_message.message_id,
                    "text": msg.parent_message.content,
                    "sender_name": (
                        msg.parent_message.sender_user.username if msg.parent_message.sender_user else "Unknown"
                    ),
                }
                if msg.parent_message
                else None
            ),
            "post": None,
        }

        if msg.shared_post:
            message_data["post"] = PostSerializer(msg.shared_post, context={"request": request}).data
        data.append(message_data)

    from django.utils import timezone

    member.last_read_at = timezone.now()
    member.save(update_fields=["last_read_at"])

    return Response(data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_message(request, conversation_id):
    user, page = get_actor(request)
    text = request.data.get("text")
    reply_to_id = request.data.get("reply_to")
    parent_message = None

    if reply_to_id:
        try:
            parent_message = Message.objects.get(message_id=reply_to_id)
        except Message.DoesNotExist:
            parent_message = None

    if not text:
        return Response({"error": "Empty"}, status=400)

    try:
        if user:
            ConversationMember.objects.get(conversation_id=conversation_id, user=user)
        else:
            ConversationMember.objects.get(conversation_id=conversation_id, page=page)
    except ConversationMember.DoesNotExist:
        return Response({"error": "Not allowed"}, status=403)

    msg = Message.objects.create(
        conversation_id=conversation_id,
        content=text,
        sender_user=user if user else None,
        sender_page=page if page else None,
        parent_message=parent_message,
    )
    """
    c
    # ---- notification ----
    conversation = Conversation.objects.get(conversation_id=conversation_id)
    notify_other_members(
        conversation=conversation,
        sent_message=msg,
        actor_user=user,
        actor_page=page,
    )
    """
    return Response(
        {
            "id": msg.message_id,
            "text": msg.content,
            "time": msg.sent_at.strftime("%H:%M"),
            "senderId": "me",
            "reply_to_details": (
                {
                    "id": parent_message.message_id,
                    "text": parent_message.content,
                    "sender_name": parent_message.sender_user.username if parent_message.sender_user else "Unknown",
                }
                if parent_message
                else None
            ),
        }
    )
