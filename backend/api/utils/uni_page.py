def get_user_university(user):
    student = getattr(user, "student_profile", None)
    if student and student.university_page:
        return student.university_page

    instructor = getattr(user, "instructor_profile", None)
    if instructor and instructor.university_page:
        return instructor.university_page

    return None
