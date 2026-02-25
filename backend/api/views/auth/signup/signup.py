"""from django.contrib.auth import get_user_model
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status

from backend.api.models import EmailVerification

@api_view(['POST'])
def signup(request):

    username = request.data.get('username')
    academic_email = request.data.get('academic_email')
    personal_email = request.data.get('personal_email')
    code = request.data.get('code')
    password = request.data.get('password')

    if not username:
        return Response(
            {'message': 'Username required'},
            status=status.HTTP_400_BAD_REQUEST
        )


    """
