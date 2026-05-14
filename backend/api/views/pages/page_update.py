from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Page


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_page_profile(request):
    """Update page profile"""
    user = request.user
    page = getattr(user, "page_profile", None)

    if not page:
        return Response(
            {"error": "User is not associated with a page"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Update fields
    if "page_full_name" in request.data:
        page.page_full_name = request.data["page_full_name"]
    if "page_name" in request.data:
        page.page_name = request.data["page_name"]
    if "page_type" in request.data:
        page.page_type = request.data["page_type"]
    if "description" in request.data:
        page.description = request.data["description"]
    if "phone" in request.data:
        page.phone = request.data["phone"]
    if "email" in request.data:
        page.email = request.data["email"]
    if "location" in request.data:
        page.location = request.data["location"]
    if "link" in request.data:
        page.link = request.data["link"]

    # Handle file uploads
    if "avatar" in request.FILES:
        page.profile_image = request.FILES["avatar"]
    if "cover" in request.FILES:
        page.banner_image = request.FILES["cover"]

    page.save()

    return Response(
        {"message": "Page profile updated successfully"},
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_page_profile(request, page_id):
    """Get page profile by ID"""
    try:
        page = Page.objects.get(page_id=page_id)
    except Page.DoesNotExist:
        return Response(
            {"error": "Page not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    avatar = None
    if page.profile_image:
        try:
            avatar = request.build_absolute_uri(page.profile_image.url)
        except Exception:
            avatar = None

    cover = None
    if page.banner_image:
        try:
            cover = request.build_absolute_uri(page.banner_image.url)
        except Exception:
            cover = None

    return Response(
        {
            "page_id": page.page_id,
            "username": page.user.username if page.user else None,
            "page_full_name": page.page_full_name,
            "page_name": page.page_name,
            "page_type": page.page_type,
            "email": page.email,
            "phone": page.phone,
            "location": page.location,
            "description": page.description,
            "avatar": avatar,
            "cover": cover,
            "verified": page.verified,
            "average_rating": page.average_rating,
            "total_ratings": page.total_ratings,
            "created_at": page.created_at.isoformat(),
        },
        status=status.HTTP_200_OK,
    )
