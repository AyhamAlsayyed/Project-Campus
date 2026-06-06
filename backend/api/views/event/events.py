import datetime

from django.contrib.contenttypes.models import ContentType
from django.db.models import Case, Count, Exists, IntegerField, OuterRef, Value, When
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import (
    Event,
    EventReminder,
    Friendship,
    Notification,
    NotificationSetting,
    Page,
)
from ...serializers import EventSerializer
from ...utils.notifications import send_global_notification


def notify_page_and_event_followers(event, custom_text):
    recipients = set()

    page_user = event.page.user

    if page_user:
        page_followers = Friendship.objects.filter(
            user2=page_user, relation_type=Friendship.RelationType.USER_TO_PAGE, status=Friendship.Status.FOLLOWING
        ).select_related("user1")

        for f in page_followers:
            recipients.add(f.user1)

    event_reminders = EventReminder.objects.filter(event=event).select_related("user")
    for r in event_reminders:
        recipients.add(r.user)

    for user in recipients:
        send_global_notification(
            sender=page_user,
            receiver=user,
            notification_type="event_update",
            target_object=event,
            custom_text=custom_text,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def events(request):
    user = request.user
    now = timezone.now()
    one_week_ago = now - datetime.timedelta(days=7)

    follow_qs = Friendship.objects.filter(
        user1=user,
        user2_id=OuterRef("page__user_id"),
        status=Friendship.Status.FOLLOWING,
        relation_type=Friendship.RelationType.USER_TO_PAGE,
    )

    recommended_qs = (
        Event.objects.filter(start_date__gte=one_week_ago)
        .annotate(is_followed=Exists(follow_qs), attendees_count=Count("reminders"))
        .order_by("-attendees_count", "-start_date")[:5]
    )

    body_qs = (
        Event.objects.select_related("page")
        .annotate(
            is_followed=Exists(follow_qs),
            attendees_count=Count("reminders"),
            relevance_score=Case(
                When(page__page_type=Page.PageType.UNIVERSITY, then=Value(3)),
                When(is_followed=True, then=Value(2)),
                default=Value(1),
                output_field=IntegerField(),
            ),
        )
        .order_by("-relevance_score", "-start_date")
    )

    recommended_serializer = EventSerializer(recommended_qs, many=True, context={"request": request})
    body_serializer = EventSerializer(body_qs, many=True, context={"request": request})

    return Response(
        {"recommended": recommended_serializer.data, "body": body_serializer.data}, status=status.HTTP_200_OK
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_event(request):
    user = request.user

    try:
        page = user.page
    except Page.DoesNotExist:
        return Response({"error": "Only profiles with an associated Page can create events."}, status=403)

    title = request.data.get("title")
    description = request.data.get("description")
    start_date = request.data.get("start_date")
    end_date = request.data.get("end_date")
    location = request.data.get("location", "")
    image = request.FILES.get("image")

    if not image:
        return Response({"error": "The image is required."}, status=400)

    if not title or not description:
        return Response({"error": "Title and description are required fields."}, status=400)

    if not start_date or not end_date:
        return Response({"error": "start_date and end_date are required fields."}, status=400)

    if not location:
        return Response({"error": "The address is required."}, status=400)

    event = Event.objects.create(
        page=page,
        title=title,
        description=description,
        start_date=start_date,
        end_date=end_date,
        location=location,
        image=image,
    )

    page_user = page.user

    if page_user:
        page_followers = Friendship.objects.filter(
            user2=page_user, relation_type=Friendship.RelationType.USER_TO_PAGE, status=Friendship.Status.FOLLOWING
        ).select_related("user1")

        follower_users = [f.user1 for f in page_followers if f.user1 != user]

        if follower_users:
            follower_ids = [u.id for u in follower_users]
            settings_lookup = {
                setting.user_id: setting for setting in NotificationSetting.objects.filter(user_id__in=follower_ids)
            }

            eligible_notifications = []
            content_type = ContentType.objects.get_for_model(event)
            notification_text = f"New Event: '{page.page_full_name}' posted a new event: '{event.title}'."

            for follower in follower_users:
                profile = settings_lookup.get(follower.id)

                if profile:
                    if not profile.enable_all or not profile.new_event:
                        continue

                eligible_notifications.append(
                    Notification(
                        receiver=follower,
                        actor=user,
                        type=Notification.Type.SYSTEM,
                        content=notification_text,
                        content_type=content_type,
                        object_id=event.event_id,
                    )
                )

            if eligible_notifications:
                Notification.objects.bulk_create(eligible_notifications)

    return Response({"message": "Event created successfully", "event_id": event.event_id}, status=201)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def edit_event(request, event_id):
    user = request.user
    event = get_object_or_404(Event, event_id=event_id)

    if not hasattr(user, "page") or event.page != user.page:
        return Response({"error": "You do not have permission to modify this event."}, status=403)

    title_changed = "title" in request.data and request.data.get("title") != event.title
    location_changed = "location" in request.data and request.data.get("location") != event.location

    event.title = request.data.get("title", event.title)
    event.description = request.data.get("description", event.description)
    event.start_date = request.data.get("start_date", event.start_date)
    event.end_date = request.data.get("end_date", event.end_date)
    event.location = request.data.get("location", event.location)

    if "image" in request.FILES:
        event.image = request.FILES["image"]

    event.save()

    change_msg = f"The event '{event.title}' hosted by {event.page.page_full_name} has updated details."
    if title_changed:
        change_msg = f"Event '{event.title}' has been changed to '{event.title}'."

    if location_changed:
        change_msg = f"Location change: '{event.title}' is now at {event.location}."

    notify_page_and_event_followers(event=event, custom_text=change_msg)

    return Response({"message": "Event updated and followers notified."})


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def cancel_event(request, event_id):
    user = request.user
    event = get_object_or_404(Event, event_id=event_id)

    if not hasattr(user, "page") or event.page != user.page:
        return Response({"error": "You do not have permission to cancel this event."}, status=403)

    notify_page_and_event_followers(
        event=event, custom_text=f"Notice: The event '{event.title}' has been cancelled by {event.page.page_full_name}."
    )

    event.delete()
    return Response({"message": "Event cancelled successfully."}, status=204)
