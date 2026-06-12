import json
import re

from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models import EventReminder, UserDegree
from ...serializers import PageSerializer, TeachingPosition, UserSerializer


def get_user_academic_info(user):
    result = {}

    def extract_page_data(profile):
        if profile and profile.university_page:
            page = profile.university_page
            return {
                "university_page_name": page.user.username if page.user else None,
                "university_page_full_name": page.page_full_name,
            }
        return {"university_page_name": None, "university_page_full_name": None}

    student = getattr(user, "student_profile", None)
    if student:
        result["role"] = "student"
        result["major"] = student.major
        result.update(extract_page_data(student))
        return result

    instructor = getattr(user, "instructor_profile", None)
    if instructor:
        result["role"] = "instructor"
        result["department"] = instructor.department
        result.update(extract_page_data(instructor))
        return result

    result["role"] = "admin" if getattr(user, "admin_profile", None) else "unknown"
    return result


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    if hasattr(user, "page") and user.page is not None:
        serializer = PageSerializer(user.page, context={"request": request})
    else:
        serializer = UserSerializer(request.user, context={"request": request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_events(request):
    reminders_qs = EventReminder.objects.filter(user=request.user).select_related("event", "event__page")

    reminders_list = []

    for r in reminders_qs:
        event = r.event
        page = event.page

        reminders_list.append(
            {
                "id": event.event_id,
                "title": event.title,
                "description": event.description,
                "start_date": event.start_date,
                "location": event.location,
                "banner": request.build_absolute_uri(event.image.url) if event.image else None,
                "page": {
                    "name": page.page_full_name,
                    "page_id": page.user.id,
                    "avatar": request.build_absolute_uri(page.profile_image.url) if page.profile_image else None,
                    "is_verified": getattr(page, "verified", False),  # Using getattr as a safety check
                },
            }
        )

    return Response(reminders_list, status=status.HTTP_200_OK)


User = get_user_model()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def profile_view(request, user_id):
    try:
        user = (
            User.objects.select_related(
                "profile",
                "student_profile__university_page__user",
                "instructor_profile__university_page__user",
                "admin_profile",
            )
            .prefetch_related("degrees")
            .get(id=user_id)
        )
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    serializer = UserSerializer(user, context={"request": request})
    return Response(serializer.data, status=status.HTTP_200_OK)


# this is the data for update profile
"""
<QueryDict:
    {
    'username': [''],
    'full_name': [''],
    'major': [''],
    'bio': [''],
    'personal_email': ['ahmed@gmail.com'],
    'primary_phone': [''],
    'secondary_phone': [''],
    'birthday': ['1963-05-06'],
    'degrees': ['[
        {"id":3,"degree_type":"PhD","major":"CS","institution":""},
        {"id":4,"degree_type":"Master","major":"eng","institution":""},
        {"id":5,"degree_type":"Bachelor","major":"Graphic","institution":""}
    ]'],
    'teaching_positions': ['[
        {"institution":"asd","type":"primary"}
        ]']
    }
>
"""


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_profile(request):
    user = request.user
    profile = getattr(user, "profile", None)

    username = request.data["username"] if "username" in request.data else None
    if username != user.username:
        username = request.data["username"]
        if not re.fullmatch(r"[a-z]+", username):
            return Response(
                {"message": "Username must contain only lowercase letters"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # enforce username uniqueness
        if User.objects.filter(username__iexact=username).exists():
            return Response({"message": "Username already taken"}, status=status.HTTP_400_BAD_REQUEST)
        user.username = request.data["username"]

    if "personal_email" in request.data:
        user.email = request.data["personal_email"]

    if profile:
        if "full_name" in request.data:
            profile.full_name = request.data["full_name"]
        if "bio" in request.data:
            profile.bio = request.data["bio"]
        if "primary_phone" in request.data:
            profile.primary_phone = request.data["primary_phone"]
        if "secondary_phone" in request.data:
            profile.secondary_phone = request.data["secondary_phone"]
        if "birthday" in request.data:
            profile.birth_date = request.data["birthday"]

        if "avatar" in request.FILES:
            profile.profile_image = request.FILES["avatar"]
        if "cover" in request.FILES:
            profile.banner_image = request.FILES["cover"]

        profile.save()

    if "degrees" in request.data:
        try:
            degrees_raw = request.data.get("degrees")
            if isinstance(degrees_raw, str):
                degrees_data = json.loads(degrees_raw)
            else:
                degrees_data = request.data.getlist("degrees") if hasattr(request.data, "getlist") else degrees_raw

            existing_degree_ids = set(user.degrees.values_list("id", flat=True))
            provided_degree_ids = []

            with transaction.atomic():
                for degree_item in degrees_data:
                    if isinstance(degree_item, str):
                        degree_item = json.loads(degree_item)

                    degree_id = degree_item.get("id")

                    if degree_id and int(degree_id) in existing_degree_ids:
                        dg = UserDegree.objects.get(id=degree_id, user=user)
                        dg.degree_type = degree_item.get("degree_type", dg.degree_type)
                        dg.major = degree_item.get("major", dg.major)
                        dg.institution = degree_item.get("institution", dg.institution)
                        dg.save()
                        provided_degree_ids.append(int(degree_id))
                    else:
                        new_dg = UserDegree.objects.create(
                            user=user,
                            degree_type=degree_item.get("degree_type"),
                            major=degree_item.get("major", ""),
                            institution=degree_item.get("institution", ""),
                        )
                        provided_degree_ids.append(new_dg.id)

                UserDegree.objects.filter(user=user).exclude(id__in=provided_degree_ids).delete()

        except Exception as e:
            return Response({"error": f"Failed to update degrees: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

    if hasattr(user, "instructor_profile") and "teaching_positions" in request.data:
        try:
            instructor = user.instructor_profile
            positions_raw = request.data.get("teaching_positions")

            if isinstance(positions_raw, str):
                positions = json.loads(positions_raw)
            else:
                positions = (
                    request.data.getlist("teaching_positions") if hasattr(request.data, "getlist") else positions_raw
                )

            existing_position_ids = set(instructor.teaching_positions.values_list("position_id", flat=True))
            provided_position_ids = []

            with transaction.atomic():
                for position in positions:
                    if isinstance(position, str):
                        position = json.loads(position)

                    position_id = position.get("id") or position.get("position_id")

                    institution = position.get("institution") or ""

                    employment_type = position.get("type") or "primary"

                    if position_id and int(position_id) in existing_position_ids:
                        tp = TeachingPosition.objects.get(position_id=position_id, instructor=instructor)
                        tp.institution_name = institution
                        tp.employment_type = employment_type
                        tp.save()
                        provided_position_ids.append(int(position_id))
                    else:
                        new_tp = TeachingPosition.objects.create(
                            instructor=instructor, institution_name=institution, employment_type=employment_type
                        )
                        provided_position_ids.append(new_tp.position_id)

                instructor.teaching_positions.exclude(position_id__in=provided_position_ids).delete()
        except Exception as e:
            return Response(
                {"error": f"Failed to update teaching positions: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST
            )

    if hasattr(user, "student_profile") and "major" in request.data:
        user.student_profile.major = request.data["major"]
        user.student_profile.save()

    user.save()
    return Response({"message": "Profile updated successfully"}, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def check_username(request):
    username = request.query_params.get("username", "").strip()
    if User.objects.filter(username__iexact=username).exists():
        return Response({"message": "Username already taken"}, status=status.HTTP_400_BAD_REQUEST)
    return Response({"message": "Username is valid"}, status=status.HTTP_200_OK)
