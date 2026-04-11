from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import Friendship


def get_user_academic_info(user):
    result = {}

    student = getattr(user, "student_profile", None)
    if student:
        result["role"] = "student"
        result["major"] = student.major
        result["academic"] = student.academic_level
        result["university_page_name"] = student.university_page.page_name
        return result

    instructor = getattr(user, "instructor_profile", None)
    if instructor:
        result["role"] = "instructor"
        result["department"] = instructor.department
        result["university_page_name"] = instructor.university_page.page_name if instructor.university_page else None
        return result

    admin = getattr(user, "admin_profile", None)
    if admin:
        result["role"] = "admin"
        return result

    result["role"] = "unknown"
    return result


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    profile = getattr(user, "profile", None)

    avatar = None
    if profile and getattr(profile, "profile_image", None):
        avatar = request.build_absolute_uri(profile.profile_image.url)

    cover = None
    if profile and getattr(profile, "banner_image", None):
        cover = request.build_absolute_uri(profile.banner_image.url)

    user_info = get_user_academic_info(user)
    return Response(
        {
            "id": user.id,
            "username": user.username,
            "full_name": getattr(profile, "full_name", ""),
            "academic_email": getattr(profile, "academic_email", ""),
            "bio": getattr(profile, "bio", ""),
            "avatar": avatar,
            "cover": cover,
            "university": user_info["university_page_name"],
            "major": user_info["major"],
            "role": user_info["role"],
        },
        status=status.HTTP_200_OK,
    )


User = get_user_model()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_profile_view(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    profile = getattr(user, "profile", None)

    avatar = None
    if profile and profile.profile_image:
        avatar = request.build_absolute_uri(profile.profile_image.url)

    cover = None
    if profile and profile.banner_image:
        cover = request.build_absolute_uri(profile.banner_image.url)

    user_info = get_user_academic_info(user)

    current_user = request.user

    if current_user == user:
        friend_status = "self"
    else:
        friendship = Friendship.objects.filter(
            Q(user1=current_user, user2=user) | Q(user1=user, user2=current_user)
        ).first()

        if not friendship:
            friend_status = "none"

        elif friendship.status == Friendship.Status.PENDING:
            if friendship.user1 == current_user:
                friend_status = "sent"
            else:
                friend_status = "received"

        elif friendship.status == Friendship.Status.ACCEPTED:
            friend_status = "friends"

        elif friendship.status == Friendship.Status.BLOCKED:
            friend_status = "blocked"

        else:
            friend_status = "none"

    friends_count = Friendship.objects.filter(Q(user1=user) | Q(user2=user), status=Friendship.Status.ACCEPTED).count()

    return Response(
        {
            "id": user.id,
            "username": user.username,
            "full_name": getattr(profile, "full_name", ""),
            "academic_email": getattr(profile, "academic_email", ""),
            "bio": getattr(profile, "bio", ""),
            "avatar": avatar,
            "cover": cover,
            "university": user_info.get("university_page_name"),
            "major": user_info.get("major"),
            "role": user_info.get("role"),
            "friend_status": friend_status,
            "friends_count": friends_count,
            "phone": "0598645517",
            "email": "wewe@wewe.wewe",
            "degree": "Pro CS",
            "hobbies": "weweing",
        },
        status=status.HTTP_200_OK,
    )
