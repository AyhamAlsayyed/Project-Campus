from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Notification, NotificationSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_notifications(request):
    notifications = (
        Notification.objects.filter(user=request.user).select_related("actor_user__profile").order_by("-created_at")
    )

    serializer = NotificationSerializer(notifications, many=True)
    return Response(serializer.data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def mark_notification(request, pk):
    try:
        notif = Notification.objects.get(notification_id=pk, user=request.user)
    except Notification.DoesNotExist:
        return Response(status=404)

    notif.is_read = request.data.get("is_read", True)
    notif.save()

    return Response({"success": True})


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_notification(request, pk):
    try:
        notif = Notification.objects.get(notification_id=pk, user=request.user)
    except Notification.DoesNotExist:
        return Response(status=404)

    notif.delete()
    return Response(status=204)
