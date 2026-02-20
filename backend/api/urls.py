from django.urls import path

from .views.auth_view import LoginView, LogoutView, SignupView

urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/signup/", SignupView.as_view(), name="signup"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
]
