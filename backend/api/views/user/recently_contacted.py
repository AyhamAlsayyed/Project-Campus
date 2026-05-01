from django.db.models import OuterRef, Prefetch, Subquery
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Conversation, ConversationMember, Message


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def recently_contacted(request):
    user = request.user

    last_message_qs = Message.objects.filter(conversation=OuterRef("pk")).order_by("-sent_at")

    conversations = (
        Conversation.objects.filter(members__user=user)
        .annotate(
            last_message_content=Subquery(last_message_qs.values("content")[:1]),
            last_message_time=Subquery(last_message_qs.values("sent_at")[:1]),
            last_sender_id=Subquery(last_message_qs.values("sender_user_id")[:1]),
        )
        .prefetch_related(
            Prefetch(
                "members",
                queryset=ConversationMember.objects.select_related("user__profile"),
            )
        )
        .order_by("-last_message_time")
    )

    result = []

    for conv in conversations:
        members = [m.user for m in conv.members.all() if m.user]

        # GROUP
        if conv.is_group:
            name = conv.name if conv.name else f"Group ({len(members)})"
            avatar = request.build_absolute_uri(conv.image.url)
            status = None

        # DM
        else:
            other = next((u for u in members if u != user), None)
            if not other:
                continue

            profile = getattr(other, "profile", None)

            name = other.username

            avatar = None
            status = profile.status

            if profile:
                if profile.profile_image:
                    avatar = request.build_absolute_uri(profile.profile_image.url)

        result.append(
            {
                "id": conv.conversation_id,
                "name": name,
                "avatar": avatar,
                "status": status,
                "message": conv.last_message_content or "",
                "time": conv.last_message_time,
                "is_group": conv.is_group
            }
        )

    return Response(result)
