from django.urls import path
from api.views.auth.signup.send_code import send_code
from api.views.auth.signup.verify_code import verify_email as verify_code
from .views.auth_view import LoginView, LogoutView

urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),

    path("auth/send-code/", send_code, name="send-code"),
    path("auth/verify-code/", verify_code, name="verify-code"),

]