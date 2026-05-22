from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Event, Friendship, Page, PageRating
from ...serializers import EventSerializer, PageSerializer

User = get_user_model()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def followed_pages(request):
    user = request.user

    followed_user_ids = Friendship.objects.filter(
        user1=user, status=Friendship.Status.FOLLOWING, relation_type=Friendship.RelationType.USER_TO_PAGE
    ).values_list("user2_id", flat=True)

    pages = Page.objects.filter(user_id__in=followed_user_ids)

    serializer = PageSerializer(pages, many=True, context={"request": request})
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def recommended_pages(request):
    user = request.user

    followed_user_ids = Friendship.objects.filter(
        user1=user, status=Friendship.Status.FOLLOWING, relation_type=Friendship.RelationType.USER_TO_PAGE
    ).values_list("user2_id", flat=True)

    pages = Page.objects.exclude(user_id__in=followed_user_ids).order_by("-verified")[:5]

    serializer = PageSerializer(pages, many=True, context={"request": request})
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_follow_page(request, page_id):
    user = request.user

    page_user = get_object_or_404(User, id=page_id)

    page = get_object_or_404(Page, user_id=page_id)

    friendship = Friendship.objects.filter(
        user1=user, user2=page_user, relation_type=Friendship.RelationType.USER_TO_PAGE
    ).first()

    if friendship:
        if friendship.status == Friendship.Status.FOLLOWING:
            friendship.delete()
            is_followed = False
            response_status = status.HTTP_200_OK
        else:
            friendship.status = Friendship.Status.FOLLOWING
            friendship.save()
            is_followed = True
            response_status = status.HTTP_200_OK
    else:
        Friendship.objects.create(
            user1=user,
            user2=page_user,
            status=Friendship.Status.FOLLOWING,
            relation_type=Friendship.RelationType.USER_TO_PAGE,
        )
        is_followed = True
        response_status = status.HTTP_201_CREATED

    serializer = PageSerializer(page, context={"request": request})

    response_data = {
        "is_followed": is_followed,
        "status": "followed" if is_followed else "unfollowed",
        **serializer.data,
    }

    return Response(response_data, status=response_status)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def page_detail(request, page_id):
    page = get_object_or_404(Page, user_id=page_id)

    serializer = PageSerializer(page, context={"request": request})
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def rate_page(request, page_id):
    user = request.user
    score = request.data.get("score")

    try:
        score_int = int(score)
        if not (1 <= score_int <= 5):
            return Response({"error": "Rating must be between 1 and 5"}, status=status.HTTP_400_BAD_REQUEST)
    except (ValueError, TypeError):
        return Response({"error": "Invalid score format"}, status=status.HTTP_400_BAD_REQUEST)

    page = get_object_or_404(Page, user_id=page_id)

    if page.user == user:
        return Response({"error": "You cannot rate your own page"}, status=status.HTTP_400_BAD_REQUEST)

    PageRating.objects.update_or_create(page=page, user=user, defaults={"score": score_int})

    serializer = PageSerializer(page, context={"request": request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def page_events(request, page_id):
    page = get_object_or_404(Page, user_id=page_id)

    events = Event.objects.filter(page=page).order_by("start_date")

    serializer = EventSerializer(events, many=True, context={"request": request})

    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_page_notifications(request, page_id):
    page = get_object_or_404(User, id=page_id)

    try:
        friendship = Friendship.objects.get(
            user1=request.user,
            user2=page,
            relation_type=Friendship.RelationType.USER_TO_PAGE,
            status=Friendship.Status.FOLLOWING,
        )
    except Friendship.DoesNotExist:
        return Response(
            {"detail": "You must follow the page to toggle notification settings."}, status=status.HTTP_400_BAD_REQUEST
        )

    friendship.is_muted = not friendship.is_muted
    friendship.save(update_fields=["is_muted"])

    is_notified = not friendship.is_muted

    return Response(
        {"detail": "Notification settings updated successfully.", "is_notified": is_notified}, status=status.HTTP_200_OK
    )
