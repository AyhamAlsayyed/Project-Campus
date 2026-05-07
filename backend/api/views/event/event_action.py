from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Event, EventReminder


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_event_reminder(request, event_id):
    user = request.user
    event = get_object_or_404(Event, event_id=event_id)

    reminder_qs = EventReminder.objects.filter(user=user, event=event)

    if reminder_qs.exists():
        reminder_qs.delete()
        return Response({"status": "removed", "is_reminded": False}, status=200)

    EventReminder.objects.create(user=user, event=event)
    return Response({"status": "set", "is_reminded": True}, status=201)
