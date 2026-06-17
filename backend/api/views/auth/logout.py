from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    """
    Logs out the user by blacklisting their refresh token.
    Clears out the active session generation chain.
    """
    try:
        refresh_token = request.data.get("refresh")

        if not refresh_token:
            return Response({"error": "Refresh token is required to log out."}, status=status.HTTP_400_BAD_REQUEST)

        token = RefreshToken(refresh_token)
        token.blacklist()

        return Response({"message": "Logout successful."}, status=status.HTTP_200_OK)

    except TokenError:
        # If the token is already expired or malformed, treat it as an optimized success
        return Response({"message": "Token already invalid or expired. Logout complete."}, status=status.HTTP_200_OK)
    except Exception:
        return Response(
            {"error": "An error occurred during logout process."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
