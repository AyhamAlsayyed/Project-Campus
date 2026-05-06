from django.urls import path

from .views.auth.login import login
from .views.auth.signup.send_code import send_code
from .views.auth.signup.signup import signup
from .views.auth.signup.verify_code import verify_code
from .views.comment.comments import comment_list, create_comment
from .views.communities.communitie import (
    communities,
    community_detail,
    instructor_community_picks,
    join_community,
    request_join_community,
    toggle_pick,
)
from .views.conversation.conversation import (
    get_conversations,
    get_messages,
    send_message,
)
from .views.event.events import events
from .views.notification.notification import get_notifications, notification_delete_mark
from .views.pages.pages import (
    follow_page,
    followed_pages,
    page_detail,
    recommended_pages,
    unfollow_page,
)
from .views.posts.post_action import block_post, report_post, save_post, toggle_like
from .views.posts.post_create import create_post
from .views.posts.posts import feed, get_activity_posts, get_saved_posts
from .views.university.university import (
    university_doctors,
    university_events,
    university_info,
    university_news,
)
from .views.user.friends import (
    accept_friend_request,
    decline_friend_request,
    send_friend_request,
    user_friends_list,
)
from .views.user.recently_contacted import recently_contacted
from .views.user.user import me, profile_view, update_profile

urlpatterns = [
    path("auth/send_code/", send_code),
    path("auth/verify_code/", verify_code),
    path("auth/signup/", signup),
    path("auth/login/", login),
    path("auth/me/", me),
    path("users/<int:user_id>/", profile_view),
    path("auth/profile/update/", update_profile),
    path("posts/feed/", feed, name="posts_feed"),
    path("posts/", feed, name="user_posts"),
    path("posts/saved/", get_saved_posts, name="posts_saved"),
    path("posts/activity/", get_activity_posts, name="posts_activity"),
    path("posts/create/", create_post, name="create_post"),
    path("posts/<int:post_id>/like/", toggle_like),
    path("posts/<int:post_id>/report/", report_post),
    path("posts/<int:post_id>/block/", block_post),
    path("posts/<int:post_id>/save/", save_post),
    path("communities/", communities),
    path("communities/<int:community_id>/join/", join_community),
    path("communities/<int:community_id>/request/", request_join_community),
    path("communities/<int:community_id>/", community_detail),
    path("users/<int:instructor_id>/community-picks/", instructor_community_picks),
    path("<int:instructor_id>/toggle_picks/", toggle_pick),
    path("communities/<int:community_id>/posts/", feed),
    path("posts/<int:post_id>/comments/", comment_list),
    path("posts/<int:post_id>/comments/create/", create_comment),
    path("friends/request/", send_friend_request),
    path("friends/accept/", accept_friend_request),
    path("friends/decline/", decline_friend_request),
    path("users/<int:user_id>/friends/", user_friends_list),
    path("friends/recently_contacted/", recently_contacted),
    path("notifications/", get_notifications),
    path("notifications/<int:notification_id>/", notification_delete_mark),
    path("chats/", get_conversations),
    path("chats/<int:conversation_id>/messages/", get_messages),
    path("chats/<int:conversation_id>/send/", send_message),
    path("university/news/", university_news),
    path("university/events/", university_events),
    path("university/doctors/", university_doctors),
    path("university/", university_info),
    path("pages/followed/", followed_pages),
    path("pages/recommended/", recommended_pages),
    path("pages/<int:page_id>/", page_detail),
    path("pages/<int:page_id>/follow/", follow_page),
    path("pages/<int:page_id>/unfollow/", unfollow_page),
    path("events/", events),
]
