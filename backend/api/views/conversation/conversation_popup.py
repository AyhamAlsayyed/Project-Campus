from django.db.models import Q
from django.utils.timezone import localtime
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Conversation


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def chat_list_popup(request):
    user = request.user

    conversations = (
        Conversation.objects.filter(members__user=user)
        .prefetch_related("members__user__profile", "messages")
        .distinct()
    )

    data = []

    for convo in conversations:
        members = convo.members.all()

        # get the other user (1-1 chat)
        other_user = None
        member = None

        for m in members:
            if m.user == user:
                member = m
                continue
            if m.user:
                other_user = m.user

        if not other_user:
            continue

        profile = getattr(other_user, "profile", None)

        avatar = None
        if profile and profile.profile_image:
            avatar = request.build_absolute_uri(profile.profile_image.url)

        # last message
        last_message = convo.messages.order_by("-sent_at").first()

        message_text = last_message.content if last_message else ""
        message_time = localtime(last_message.sent_at).strftime("%H:%M") if last_message else ""

        if not member or not member.last_read_at:
            unread_count = convo.messages.exclude(sender_user=user).count()
        else:
            unread_count = convo.messages.filter(~Q(sender_user=user), sent_at__gt=member.last_read_at).count()

        data.append(
            {
                "id": convo.conversation_id,
                "name": other_user.username,
                "avatar": avatar,
                "message": message_text,
                "time": message_time,
                "unread": unread_count,
                "dotStyle": profile.status if profile else "offline",
            }
        )

    return Response(data)
