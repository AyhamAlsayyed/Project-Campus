from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    profile = getattr(user, "profile", None)

    avatar = None
    if profile and getattr(profile, "profile_image", None):
        avatar = request.build_absolute_uri(profile.profile_image.url)

    cover = None
    if profile and getattr(profile, "cover_image", None):
        cover = request.build_absolute_uri(profile.cover_image.url)

    return Response(
        {
            "id": user.id,
            "username": user.username,
            "full_name": getattr(user, "full_name", ""),
            "academic_email": getattr(user, "academic_email", ""),
            "bio": getattr(profile, "bio", ""),
            "avatar": avatar,
            "cover": cover,
            "university": getattr(profile, "university", "") if profile else "",
            "major": getattr(profile, "major", "") if profile else "",
            "role": getattr(profile, "role", "") if profile else "",
        },
        status=status.HTTP_200_OK,
    )
