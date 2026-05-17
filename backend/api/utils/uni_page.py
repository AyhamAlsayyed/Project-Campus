def _get_user_university(user):
    university_page_obj = None
    student = getattr(user, "student_profile", None)
    if student and student.university_page:
        university_page_obj = student.university_page
    else:
        instructor = getattr(user, "instructor_profile", None)
        if instructor and instructor.university_page:
            university_page_obj = instructor.university_page

    return university_page_obj
