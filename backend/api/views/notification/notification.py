from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Notification
from ...serializers import NotificationSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_notifications(request):
    notifications = (
        Notification.objects.filter(receiver=request.user).select_related("actor__profile").order_by("-created_at")
    )

    serializer = NotificationSerializer(notifications, many=True, context={"request": request})
    return Response(serializer.data)


@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def notification_delete_mark(request, notification_id):
    try:
        notif = Notification.objects.get(notification_id=notification_id, receiver=request.user)
    except Notification.DoesNotExist:
        return Response(status=404)

    if request.method == "PATCH":
        notif.is_read = request.data.get("is_read", True)
        notif.save()
        return Response({"success": True})

    if request.method == "DELETE":
        notif.delete()
        return Response(status=204)
    return None
