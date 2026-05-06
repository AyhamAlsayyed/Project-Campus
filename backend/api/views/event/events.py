from django.db.models import Exists, OuterRef
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Event, EventReminder, FollowPage
from ...serializers import EventSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def events(request):
    user = request.user

    follow_qs = FollowPage.objects.filter(user=user, page_id=OuterRef("page_id"))

    qs = Event.objects.select_related("page").annotate(is_followed=Exists(follow_qs)).order_by("-start_date")

    serializer = EventSerializer(qs, many=True, context={"request": request})
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_event_reminder(request, event_id):
    user = request.user
    event = get_object_or_404(Event, pk=event_id)

    reminder = EventReminder.objects.filter(event=event, user=user).first()

    if reminder:
        reminder.delete()
        return Response({"message": "Reminder removed"})

    EventReminder.objects.create(event=event, user=user)
    return Response({"message": "Reminder set"})
