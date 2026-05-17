from django.db.models import Exists, OuterRef
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Event, Friendship
from ...serializers import EventSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def events(request):
    user = request.user

    follow_qs = Friendship.objects.filter(
        user1=user,
        user2_id=OuterRef("page__user_id"),
        status=Friendship.Status.FOLLOWING,
        relation_type=Friendship.RelationType.USER_TO_PAGE,
    )

    qs = Event.objects.select_related("page").annotate(is_followed=Exists(follow_qs)).order_by("-start_date")

    serializer = EventSerializer(qs, many=True, context={"request": request})
    return Response(serializer.data)
