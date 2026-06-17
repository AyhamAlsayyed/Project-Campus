from datetime import timedelta

from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Community, Event, Page, Post, Promotion
from ...serializers import PromotionSerializer


def get_page_user_and_content_type(user, model_class):
    """Helper function to safely fetch the logged-in user's Page and ContentType."""
    page = get_object_or_404(Page, user=user)
    content_type = ContentType.objects.get_for_model(model_class)
    return page.user, content_type


def calculate_end_date(duration_str):
    """
    Directly maps the fixed frontend slider choices to future datetime offsets.
    Handles standard timeline intervals cleanly without external dependencies.
    """
    current_time = timezone.now()

    normalized_key = duration_str.lower().strip()
    offsets = {
        "1 week": timedelta(weeks=1),
        "1 month": timedelta(days=30),
        "3 months": timedelta(days=90),
        "6 months": timedelta(days=180),
        "1 year": timedelta(days=365),
    }

    target_offset = offsets.get(normalized_key, timedelta(days=30))

    return current_time + target_offset


def create_generic_promotion(request, model_class):
    """
    Adaptive controller method to validate, calculate,
    and save polymorphic promotions.
    """
    page_user, content_type = get_page_user_and_content_type(request.user, model_class)

    model_name_lower = model_class.__name__.lower()
    target_object_id = request.data.get(f"{model_name_lower}_id") or request.data.get("object_id")

    duration_input = request.data.get("duration")

    if not target_object_id:
        return Response(
            {"error": f"Missing target content identifier: expected '{model_name_lower}_id'"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not duration_input:
        return Response(
            {"error": "The field 'duration' (e.g., '3 months') is required."}, status=status.HTTP_400_BAD_REQUEST
        )

    get_object_or_404(model_class, pk=target_object_id)

    computed_end_date = calculate_end_date(duration_input)

    cost_input = request.data.get("cost")
    duration_idx_input = request.data.get("duration_idx", 2)

    serializer = PromotionSerializer(
        data={"object_id": target_object_id, "end_date": computed_end_date}, context={"request": request}
    )

    if serializer.is_valid():
        serializer.save(
            promoted_by=page_user,
            content_type_obj=content_type,
            object_id=target_object_id,
            status=Promotion.Status.ONHOLD,
            duration=duration_input,
            duration_idx=duration_idx_input,
            cost=cost_input,
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def process_checkout_for_model(user, cart_items, model_class, id_key, item_type_name):
    """
    Reusable processor core to isolate type execution while keeping behavior identical.
    """
    if not cart_items:
        return Response(
            {"error": f"{item_type_name.capitalize()} promotion cart is empty."}, status=status.HTTP_400_BAD_REQUEST
        )

    content_type = ContentType.objects.get_for_model(model_class)
    updated_promotions = []

    with transaction.atomic():
        for item in cart_items:
            target_object_id = item.get(id_key) or item.get("object_id") or item.get("event_id")

            if not target_object_id:
                return Response(
                    {"error": f"Each checkout item requires an identifier key: '{id_key}' or 'object_id'."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            promotion = (
                Promotion.objects.filter(promoted_by=user, content_type_obj=content_type, object_id=target_object_id)
                .filter(status__in=[Promotion.Status.ONHOLD, Promotion.Status.ACTIVE])
                .first()
            )

            if not promotion:
                return Response(
                    {
                        "error": f"No pending promotion found for this {item_type_name}.",
                        "details": f"Could not find an 'ONHOLD' or 'active' promotion record for "
                        f"{item_type_name} ID {target_object_id}.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            duration_input = item.get("duration", promotion.duration)
            promotion.status = Promotion.Status.ACTIVE
            promotion.end_date = calculate_end_date(duration_input)

            if "cost" in item:
                promotion.cost = item["cost"]

            promotion.save(update_fields=["status", "end_date", "cost"])
            updated_promotions.append(promotion)

    return updated_promotions


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_page_promotions(request):
    """Returns all promotions created by the logged-in user's Page split into 3 groups."""
    page = get_object_or_404(Page, user=request.user)
    page_user = page.user

    all_promotions = Promotion.objects.filter(promoted_by=page_user).select_related("content_type_obj")
    post_type = ContentType.objects.get_for_model(Post)
    community_type = ContentType.objects.get_for_model(Community)

    try:
        event_type = ContentType.objects.get_for_model(Event)
    except NameError:
        event_type = None

    posts_promotions = []
    communities_promotions = []
    events_promotions = []

    for promo in all_promotions:
        if promo.content_type_obj_id == post_type.id:
            posts_promotions.append(promo)
        elif promo.content_type_obj_id == community_type.id:
            communities_promotions.append(promo)
        elif event_type and promo.content_type_obj_id == event_type.id:
            events_promotions.append(promo)

    return Response(
        {
            "posts": PromotionSerializer(posts_promotions, many=True).data,
            "communities": PromotionSerializer(communities_promotions, many=True).data,
            "events": PromotionSerializer(events_promotions, many=True).data,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def get_page_post_promotions(request):
    """Handles Fetching and Creating promotions for Posts."""
    if request.method == "POST":
        return create_generic_promotion(request, Post)

    page_user, post_type = get_page_user_and_content_type(request.user, Post)
    promotions = Promotion.objects.filter(promoted_by=page_user, content_type_obj=post_type)
    return Response(PromotionSerializer(promotions, many=True).data, status=status.HTTP_200_OK)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def get_page_community_promotions(request):
    """Handles Fetching and Creating promotions for Communities."""
    if request.method == "POST":
        return create_generic_promotion(request, Community)

    page_user, community_type = get_page_user_and_content_type(request.user, Community)
    promotions = Promotion.objects.filter(promoted_by=page_user, content_type_obj=community_type)

    return Response(
        PromotionSerializer(promotions, many=True, context={"request": request}).data, status=status.HTTP_200_OK
    )


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def get_page_event_promotions(request):
    """Handles Fetching and Creating promotions for Events."""
    if request.method == "POST":
        return create_generic_promotion(request, Event)

    page_user, event_type = get_page_user_and_content_type(request.user, Event)
    promotions = Promotion.objects.filter(promoted_by=page_user, content_type_obj=event_type)
    return Response(PromotionSerializer(promotions, many=True).data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def posts_promotion_checkout(request):
    """Activates pending ONHOLD promotions specifically for Posts."""
    cart_items = request.data.get("items", [])
    result = process_checkout_for_model(
        user=request.user, cart_items=cart_items, model_class=Post, id_key="post_id", item_type_name="post"
    )

    if isinstance(result, Response):
        return result

    serializer = PromotionSerializer(result, many=True, context={"request": request})
    return Response(
        {"message": "Post promotions activated successfully!", "promotions": serializer.data}, status=status.HTTP_200_OK
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def events_promotion_checkout(request):
    """Activates pending ONHOLD promotions specifically for Events."""
    cart_items = request.data.get("items", [])
    result = process_checkout_for_model(
        user=request.user, cart_items=cart_items, model_class=Event, id_key="event_id", item_type_name="event"
    )

    if isinstance(result, Response):
        return result

    serializer = PromotionSerializer(result, many=True, context={"request": request})
    return Response(
        {"message": "Event promotions activated successfully!", "promotions": serializer.data},
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def communities_promotion_checkout(request):
    """Activates pending ONHOLD promotions specifically for Communities."""
    cart_items = request.data.get("items", [])
    result = process_checkout_for_model(
        user=request.user,
        cart_items=cart_items,
        model_class=Community,
        id_key="community_id",
        item_type_name="community",
    )

    if isinstance(result, Response):
        return result

    serializer = PromotionSerializer(result, many=True, context={"request": request})
    return Response(
        {"message": "Community promotions activated successfully!", "promotions": serializer.data},
        status=status.HTTP_200_OK,
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_page_promotion(request, promotion_id):
    """
    Safely deletes a promotion if it belongs to the logged-in user's Page.
    """
    page = get_object_or_404(Page, user=request.user)
    promotion = get_object_or_404(Promotion, pk=promotion_id)

    if promotion.promoted_by != page.user:
        return Response(
            {"error": "You do not have permission to delete this promotion."}, status=status.HTTP_403_FORBIDDEN
        )
    promotion.delete()
    return Response({"message": "Promotion deleted successfully."}, status=status.HTTP_200_OK)
