from django.db.models import OuterRef, Q, Subquery
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import ConversationMember, Message
from ...serializers import ConversationMemberSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def recently_contacted(request):
    user = request.user

    last_message_qs_time = (
        Message.objects.filter(conversation=OuterRef("conversation_id")).order_by("-sent_at").values("sent_at")[:1]
    )

    inbox_visibility_filter = Q(conversation__status="accepted") | Q(
        conversation__status="pending", conversation__created_by=user
    )

    memberships = (
        ConversationMember.objects.filter(
            inbox_visibility_filter,
            user=user,
        )
        .select_related("conversation", "conversation__last_message", "conversation__created_by")
        .prefetch_related("conversation__members__user__profile")
        .annotate(last_msg_time=Subquery(last_message_qs_time))
        .order_by("-last_msg_time", "-conversation__created_at")
    )

    serializer = ConversationMemberSerializer(memberships, many=True, context={"request": request})

    return Response(serializer.data)
