from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ...models import NewsItem
from ...serializers import NewsItemSerializer


@api_view(["GET"])
@permission_classes([AllowAny])
def news_list(request):
    """Returns currently global news banners."""
    queryset = NewsItem.objects.all()
    serializer = NewsItemSerializer(queryset, many=True, context={"request": request})
    return Response(serializer.data, status=status.HTTP_200_OK)
