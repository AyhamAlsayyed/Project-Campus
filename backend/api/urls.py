from django.urls import path

from .views.auth.login import login
from .views.auth.page import page_login, page_logout, page_me, page_register
from .views.auth.signup.send_code import send_code
from .views.auth.signup.signup import signup
from .views.auth.signup.verify_code import verify_code
from .views.comment.comments import comment_list, create_comment
from .views.communities.community import (  # process_join_request,
    communities,
    community_detail,
    instructor_community_picks,
    join_community,
    request_join_community,
    toggle_pick,
)
from .views.communities.community_action import (
    leave_community,
    toggle_community_notifications,
)
from .views.conversation.conversation import (
    create_dm,
    get_conversations,
    get_messages,
    send_message,
)


from .views.conversation.edit_conversation import (
    edit_group_details,
    edit_group_image,
    update_group_privacy_settings
)
from .views.conversation.conversation_info import (
    get_friends_to_invite,
    add_member_to_group,
    get_sorted_group_members,
)

from .views.conversation.conversation_action import (
    accept_chat_request,
    block_user_from_chat,
    chat_requests,
    clear_chat,
    delete_or_leave_chat,
    mark_read,
    mark_unread,
    toggle_mute,
    toggle_pin,
)
from .views.event.event_action import toggle_event_reminder
from .views.event.events import events  # , cancel_event, create_event, edit_event
from .views.notification.notification import get_notifications, notification_delete_mark
from .views.pages.page_update import update_page_profile
from .views.pages.pages import (
    followed_pages,
    page_detail,
    page_events,
    rate_page,
    recommended_pages,
    toggle_follow_page,
)
from .views.posts.post_action import (
    delete_post,
    save_post,
    send_post,
    toggle_like,
    toggle_pin_post,
)
from .views.posts.post_create import create_post
from .views.posts.posts import feed, get_activity_posts, get_saved_posts
from .views.report.report import create_report
from .views.search.search import search
from .views.university.university import (
    university_doctors,
    university_events,
    university_info,
    university_news,
)
from .views.user.block import toggle_block_user  # ,blocked_accounts_list
from .views.user.friends import (
    accept_friend_request,
    decline_friend_request,
    send_friend_request,
    unfriend,
    user_friends_list,
)
from .views.user.recently_contacted import recently_contacted
from .views.user.user import (
    check_username,
    get_events,
    me,
    profile_view,
    update_profile,
)

urlpatterns = [
    path("auth/send_code/", send_code),
    path("auth/verify_code/", verify_code),
    path("auth/signup/", signup),
    path("auth/login/", login),
    path("auth/me/", me),
    path("users/<int:user_id>/", profile_view),
    path("users/<int:user_id>/block/", toggle_block_user),
    path("auth/check-username/", check_username),
    path("auth/profile/update/", update_profile),  # the front dont send the degrees
    path("posts/feed/", feed),
    path("posts/", feed),
    path("posts/saved/", get_saved_posts),
    path("posts/activity/", get_activity_posts),
    path("posts/create/", create_post),
    path("posts/<int:post_id>/like/", toggle_like),
    path("posts/<int:post_id>/block/", toggle_block_user),
    path("posts/<int:post_id>/save/", save_post),
    path("posts/<int:post_id>/pin/", toggle_pin_post),
    path("posts/<int:post_id>/", delete_post),
    path("messages/send/", send_post),
    path("communities/", communities),
    path("communities/<int:community_id>/join/", join_community),
    path("communities/<int:community_id>/request/", request_join_community),
    path("communities/<int:community_id>/", community_detail),
    path("communities/<int:pk>/notify/", toggle_community_notifications),
    path("communities/<int:pk>/leave/", leave_community),
    path("users/<int:instructor_id>/community-picks/", instructor_community_picks),
    path("<int:instructor_id>/toggle_picks/", toggle_pick),
    path("communities/<int:community_id>/posts/", feed),
    path("posts/<int:post_id>/comments/", comment_list),
    path("posts/<int:post_id>/comments/create/", create_comment),
    path("friends/request/", send_friend_request),
    path("friends/accept/", accept_friend_request),  #
    path("friends/decline/", decline_friend_request),  #
    path("friends/unfriend/", unfriend),  #
    path("users/<int:user_id>/friends/", user_friends_list),
    path("friends/recently_contacted/", recently_contacted),
    path("notifications/", get_notifications),
    path("notifications/<int:notification_id>/", notification_delete_mark),
    path("chats/", get_conversations),
    path("chats/<int:conversation_id>/messages/", get_messages),
    path("chats/<int:conversation_id>/send/", send_message),
    path("conversations/create/<int:user_id>/", create_dm),
    path("chats/<int:conversation_id>/pin/", toggle_pin),
    path("chats/<int:conversation_id>/mute/", toggle_mute),
    path("chats/<int:conversation_id>/mark-read/", mark_read),
    path("chats/<int:conversation_id>/mark-unread/", mark_unread),
    path("chats/<int:conversation_id>/", delete_or_leave_chat),
    path("chats/<int:conversation_id>/clear/", clear_chat),
    path("chats/<int:conversation_id>/block/", block_user_from_chat),
    path("chat-requests/", chat_requests),
    path("chats/<int:conversation_id>/accept/", accept_chat_request),
    path("university/news/", university_news),
    path("university/events/", university_events),
    path("university/doctors/", university_doctors),
    path("university/", university_info),
    path("pages/followed/", followed_pages),
    path("pages/recommended/", recommended_pages),
    path("pages/<int:page_id>/", page_detail),
    path("pages/<int:page_id>/follow/", toggle_follow_page),
    path("pages/<int:page_id>/review/", rate_page),
    path("pages/<int:page_id>/events/", page_events),
    path("events/", events),
    path("events/<int:event_id>/remind/", toggle_event_reminder),
    path("events/reminders/", get_events),
    path("search/", search),
    path("reports/", create_report),
    path("groups/<int:conv_id>/invite-friends/", get_friends_to_invite),
    path("groups/<int:conv_id>/members/", get_sorted_group_members),
    path("groups/<int:conv_id>/edit-details/", edit_group_details),
    path("groups/<int:conv_id>/edit-image/", edit_group_image),
]
# not yet used urls
"""
urlpatterns += [
    path("", blocked_accounts_list),
    path("", process_join_request),
    path("", create_event),
    path("", edit_event),
    path("", cancel_event),
   
    path("", update_group_privacy_settings),
    path("", get_friends_to_invite),
    path("", add_member_to_group),
    
    path("", ),
    path("", ),
    path("", ),
    path("", ),
]
"""

# not yet used urls but for the page
urlpatterns += [
    path("auth/page/register/", page_register),
    path("auth/page/login/", page_login),
    path("auth/page/logout/", page_logout),
    path("auth/page/me/", page_me),
    path("page/profile/update/", update_page_profile),
]
