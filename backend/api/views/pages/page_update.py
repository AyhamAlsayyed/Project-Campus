from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_page_profile(request):
    user = request.user
    page = getattr(user, "page_profile", None)

    if not page:
        return Response(
            {"error": "User is not associated with a page"},
            status=status.HTTP_400_BAD_REQUEST,
        )

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

    if "avatar" in request.FILES:
        page.profile_image = request.FILES["avatar"]
    if "cover" in request.FILES:
        page.banner_image = request.FILES["cover"]

    page.save()

    return Response(
        {"message": "Page profile updated successfully"},
        status=status.HTTP_200_OK,
    )
