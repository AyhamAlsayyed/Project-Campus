from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Subscription
from ...serializers import CurrentSubscriptionSerializer


def _get_user_page_or_raise_error(user):
    if not hasattr(user, "page") or user.page is None:
        return None
    return user.page


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_current_subscription(request):
    page = _get_user_page_or_raise_error(request.user)
    if not page:
        return Response(
            {"detail": "Only Page accounts possess subscription attributes."}, status=status.HTTP_403_FORBIDDEN
        )

    subscription = Subscription.objects.filter(page=page, is_active=True).first()
    if not subscription:
        return Response(None, status=status.HTTP_204_NO_CONTENT)

    if subscription.end_date and subscription.end_date < timezone.now():
        subscription.is_active = False
        subscription.save(update_fields=["is_active"])
        return Response(None, status=status.HTTP_204_NO_CONTENT)

    serializer = CurrentSubscriptionSerializer(subscription, context={"request": request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def subscribe_to_plan(request):
    page = _get_user_page_or_raise_error(request.user)
    if not page:
        return Response({"detail": "Subscriptions are restricted to platform pages."}, status=status.HTTP_403_FORBIDDEN)

    plan_requested = request.data.get("plan")
    if plan_requested not in [Subscription.Tier.BASIC, Subscription.Tier.PREMIUM]:
        return Response(
            {"error": "Invalid plan choice specified. Choose 'basic' or 'premium'."}, status=status.HTTP_400_BAD_REQUEST
        )

    price_map = {Subscription.Tier.BASIC: 14.99, Subscription.Tier.PREMIUM: 24.99}

    subscription, created = Subscription.objects.get_or_create(
        page=page,
        defaults={
            "tier": plan_requested,
            "price": price_map[plan_requested],
            "is_active": True,
            "start_date": timezone.now(),
            "end_date": timezone.now() + timedelta(days=30),
        },
    )

    if not created:
        subscription.tier = plan_requested
        subscription.price = price_map[plan_requested]
        subscription.is_active = True
        subscription.start_date = timezone.now()
        subscription.end_date = timezone.now() + timedelta(days=30)
        subscription.save()

    serializer = CurrentSubscriptionSerializer(subscription, context={"request": request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def cancel_subscription(request):
    page = _get_user_page_or_raise_error(request.user)
    if not page:
        return Response({"detail": "Action unauthorized."}, status=status.HTTP_403_FORBIDDEN)

    subscription = Subscription.objects.filter(page=page, is_active=True).first()
    if not subscription:
        return Response(
            {"error": "No active subscription matches found to terminate."}, status=status.HTTP_400_BAD_REQUEST
        )

    subscription.is_active = False
    subscription.save(update_fields=["is_active"])

    return Response({"message": "Subscription canceled successfully."}, status=status.HTTP_200_OK)
