from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


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
    if profile and getattr(profile, "profile_image", None):
        avatar = request.build_absolute_uri(profile.profile_image.url)

    cover = None
    if profile and getattr(profile, "banner_image", None):
        cover = request.build_absolute_uri(profile.banner_image.url)

    user_info = get_user_academic_info(user)

    current_user = request.user
    friend_status = "none"

    if current_user == user:
        friend_status = "self"
    else:
        if current_user.following.filter(following=user).exists():
            friend_status = "friends"

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
        },
        status=status.HTTP_200_OK,
    )
