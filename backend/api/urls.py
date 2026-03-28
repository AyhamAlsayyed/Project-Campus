from django.urls import path

from .views.auth.login import login
from .views.auth.me import me
from .views.auth.signup.send_code import send_code
from .views.auth.signup.signup import signup
from .views.auth.signup.verify_code import verify_code
from .views.comment.comments import comment_list
from .views.communities.communitie import communities
from .views.posts.like import toggle_like
from .views.posts.post_create import create_post
from .views.posts.posts import feed
from .views.communities.communitie import join_community, request_join_community
from .views.communities.communitie import community_detail
urlpatterns = [
    path("auth/send_code/", send_code),
    path("auth/verify_code/", verify_code),
    path("auth/signup/", signup),
    path("auth/login/", login),
    path("auth/me/", me),
    path("posts/feed/", feed, name="posts_feed"),
    path("posts/", feed, name="user_posts"),
    path("posts/create/", create_post, name="create_post"),
    path("posts/<int:post_id>/like/", toggle_like),
    path("communities/", communities),
    path("communities/<int:community_id>/join/", join_community),
    path("communities/<int:community_id>/request/", request_join_community),
    path("communities/<int:community_id>/", community_detail),

    path("posts/<int:post_id>/comments/", comment_list),
]
