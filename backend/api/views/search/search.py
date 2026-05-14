from django.contrib.auth import get_user_model
from django.db.models import Exists, OuterRef, Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Community, CommunityMember, Page
from ...serializers import CommunitySerializer, PageSerializer, UserSerializer

User = get_user_model()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def search(request):
    user = request.user
    query = request.query_params.get("q", "").strip()

    if not query:
        return Response({"people": [], "communities": [], "pages": [], "posts": []})

    users = (
        User.objects.filter(Q(username__icontains=query) | Q(profile__full_name__icontains=query), page__isnull=True)
        .select_related("profile")
        .distinct()[:3]
    )

    communities = Community.objects.filter(Q(name__icontains=query) | Q(description__icontains=query))[:3]

    membership_qs = CommunityMember.objects.filter(
        user=user,
        community_id=OuterRef("community_id"),
    )

    communities_qs = communities.annotate(
        is_joined=Exists(membership_qs.filter(status="approved")),
        request_sent=Exists(membership_qs.filter(status="pending")),
    )

    pages = Page.objects.filter(Q(page_full_name__icontains=query) | Q(description__icontains=query))[:3]

    return Response(
        {
            "people": UserSerializer(users, many=True, context={"request": request}).data,
            "communities": CommunitySerializer(communities_qs, many=True, context={"request": request}).data,
            "pages": PageSerializer(pages, many=True, context={"request": request}).data,
        }
    )
