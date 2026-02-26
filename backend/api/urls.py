from django.urls import path

from .views.auth.login import login
from .views.auth.signup.send_code import send_code
from .views.auth.signup.signup import signup
from .views.auth.signup.verify_code import verify_code

urlpatterns = [
    path("auth/send_code", send_code, name="send_code"),
    path("auth/verify_code", verify_code, name="verify_code"),
    path("auth/signup", signup, name="signup"),
    path("auth/login", login, name="login"),
]
