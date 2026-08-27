from rest_framework.exceptions import PermissionDenied

from ..models import CommunityMember


def ensure_community_admin(user, community_id):
    member = CommunityMember.objects.filter(community_id=community_id, user=user).first()
    if not member or member.role not in [CommunityMember.Role.OWNER, CommunityMember.Role.ADMIN]:
        raise PermissionDenied("You do not have administrative privileges in this community.")
    return member
