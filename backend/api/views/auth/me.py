from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    profile = getattr(user, "profile", None)

    return Response(
        {
            "id": user.id,
            "username": user.username,
            "avatar": getattr(profile, "profile_image", None) if profile else None,
            "full_name": getattr(profile, "full_name", "") if profile else "",
        },
        status=status.HTTP_200_OK,
    )
