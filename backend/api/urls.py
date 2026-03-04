from django.urls import path

from .views.auth.login import login
from .views.auth.me import me
from .views.auth.signup.send_code import send_code
from .views.auth.signup.signup import signup
from .views.auth.signup.verify_code import verify_code
from .views.posts import feed

urlpatterns = [
    path("auth/send_code/", send_code),
    path("auth/verify_code/", verify_code),
    path("auth/signup/", signup),
    path("auth/login/", login),
    path("auth/me/", me),
    path("posts/feed/", feed, name="posts_feed"),
]
