from django.urls import path

from .views.auth.login import login
from .views.auth.logout import logout
from .views.auth.signup.send_code import send_code
from .views.auth.signup.signup import signup
from .views.auth.signup.verify_code import change_password, verify_code
from .views.auth.TFA import send_2fa_code, verify_2fa_code
from .views.comment.comments import (
    comment_list,
    create_comment,
    delete_comment,
    edit_comment,
)
from .views.communities.community import (  # delete_community,
    check_community_request_status,
    communities,
    community_detail,
    community_post_settings,
    create_community_or_request,
    fetch_community_highlights,
    get_reported_posts,
    join_community,
    request_join_community,
    update_community_info,
)
from .views.communities.community_action import (
    instructor_community_picks,
    leave_community,
    toggle_community_notifications,
    toggle_pick,
)
from .views.communities.community_admin_action import (
    delete_reported_post,
    dismiss_post_report,
    fetch_join_requests,
    fetch_post_requests,
    process_join_request,
    process_post_request,
    remove_community_highlight,
)
from .views.communities.community_member_action import (
    block_user_from_community,
    get_community_members,
    kick_community_member,
    toggle_community_admin,
)
from .views.conversation.conversation import (
    create_dm,
    create_group_conversation,
    delete_message,
    edit_message,
    get_conversations,
    get_messages,
    send_message,
)
from .views.conversation.conversation_action import (
    accept_chat_request,
    chat_requests,
    clear_chat,
    delete_or_leave_chat,
    mark_read,
    mark_unread,
    toggle_mute,
    toggle_pin,
)
from .views.conversation.conversation_info import (
    add_member_to_group,
    get_friends_to_invite,
    get_group_members,
    share_group_link,
)
from .views.conversation.conversation_member_action import (
    remove_member_from_group,
    toggle_group_admin,
)
from .views.conversation.edit_conversation import (
    edit_group_details,
    edit_group_image,
    update_group_privacy_settings,
)
from .views.event.event_action import toggle_event_reminder
from .views.event.events import create_event, delete_event, events, update_event
from .views.news.news import news_list
from .views.notification.notification import get_notifications, notification_delete_mark
from .views.pages.page_update import update_page_profile
from .views.pages.pages import (
    followed_pages,
    page_detail,
    page_events,
    rate_page,
    recommended_pages,
    toggle_follow_page,
    toggle_page_notifications,
)
from .views.pages.promotions import (
    communities_promotion_checkout,
    delete_page_promotion,
    events_promotion_checkout,
    get_page_community_promotions,
    get_page_event_promotions,
    get_page_post_promotions,
    get_page_promotions,
    posts_promotion_checkout,
)
from .views.pages.subscription import (
    cancel_subscription,
    get_current_subscription,
    subscribe_to_plan,
)
from .views.posts.post_action import (
    delete_post,
    save_post,
    send_post,
    toggle_community_highlight,
    toggle_like,
    toggle_pin_post,
    toggle_react,
)
from .views.posts.post_create import create_post
from .views.posts.posts import feed, get_activity_posts, get_saved_posts
from .views.report.report import create_report
from .views.search.search import search
from .views.university.university import (
    extend_announcement,
    university_doctors,
    university_events,
    university_info,
    university_news,
)
from .views.user.block import blocked_accounts_list, toggle_block_user
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
    deactivate_account,
    delete_account,
    get_events,
    manage_notification_settings,
    manage_privacy_settings,
    me,
    profile_view,
    update_password,
    update_profile,
)

# auth
urlpatterns = [
    path("auth/send_code/", send_code),
    path("auth/verify_code/", verify_code),
    path("auth/signup/", signup),
    path("auth/login/", login),
    path("auth/logout/", logout),
    path("auth/change-password/", change_password),
    path("auth/me/", me),
]
# profile
urlpatterns += [
    # profile_owne
    path("users/<int:user_id>/", profile_view),
    path("users/<int:user_id>/block/", toggle_block_user),
    path("auth/check-username/", check_username),
    path("auth/profile/update/", update_profile),
    path("posts/saved/", get_saved_posts),
    path("posts/activity/", get_activity_posts),
    path("users/<int:user_id>/friends/", user_friends_list),
    path("friends/recently_contacted/", recently_contacted),
    path("events/reminders/", get_events),
    # profile_other
    path("friends/request/", send_friend_request),
    path("friends/accept/", accept_friend_request),  #
    path("friends/decline/", decline_friend_request),  #
    path("friends/unfriend/", unfriend),  #
    path("conversations/create/<int:user_id>/", create_dm),
    # settings
    path("settings/password/", update_password),
    path("auth/2fa/send/", send_2fa_code),
    path("auth/2fa/verify/", verify_2fa_code),
    path("settings/deactivate/", deactivate_account),
    path("settings/delete/", delete_account),
    path("settings/blocked/", blocked_accounts_list),
    path("settings/privacy/", manage_privacy_settings),
    path("settings/notifications/", manage_notification_settings),
]
# post
urlpatterns += [
    path("posts/feed/", feed),
    path("posts/", feed),
    path("posts/create/", create_post),
    path("posts/<int:post_id>/comments/", comment_list),
    path("posts/<int:post_id>/comments/create/", create_comment),
    path("comments/<int:comment_id>/delete/", delete_comment),
    path("comments/<int:comment_id>/edit/", edit_comment),
    # post share
    path("messages/send/", send_post),
    # post_action
    path("posts/<int:post_id>/like/", toggle_like),
    path("posts/<int:post_id>/react/", toggle_react),
    path("posts/<int:post_id>/save/", save_post),
    path("posts/<int:post_id>/pin/", toggle_pin_post),
    path("posts/<int:post_id>/", delete_post),
    path("posts/<int:post_id>/block/", toggle_block_user),
    path("posts/<int:post_id>/highlight/", toggle_community_highlight),
]
# community
urlpatterns += [
    path("communities/", communities),
    path("communities/<int:community_id>/", community_detail),
    path("communities/<int:community_id>/update/", update_community_info),
    # path("communities/<int:community_id>/", delete_community),
    path("communities/<int:community_id>/post-settings/", community_post_settings),
    path("communities/<int:community_id>/highlights/", fetch_community_highlights),
    path("communities/<int:community_id>/reported-posts/", get_reported_posts),
    path("communities/<int:community_id>/posts/", feed),
    path("communities/request/", create_community_or_request),
    path("communities/request/status/", check_community_request_status),
    path("communities/create/", create_community_or_request),
    # community_join
    path("communities/<int:community_id>/request/", request_join_community),
    path("communities/<int:community_id>/join/", join_community),
    # community_member_action
    path("communities/<int:community_id>/members/", get_community_members),
    path("communities/<int:community_id>/make-admin/<int:member_id>/", toggle_community_admin),
    path("communities/<int:community_id>/kick/<int:member_id>/", kick_community_member),
    path("communities/<int:community_id>/report/<int:member_id>/", create_report),
    path("communities/<int:community_id>/block/<int:member_id>/", block_user_from_community),
    # community_action
    path("users/<int:instructor_id>/community-picks/", instructor_community_picks),
    path("<int:community_id>/toggle_picks/", toggle_pick),
    path("communities/<int:pk>/notify/", toggle_community_notifications),
    path("communities/<int:pk>/leave/", leave_community),
    # community_admin_action
    path("communities/<int:community_id>/join-requests/", fetch_join_requests),
    path("communities/<int:community_id>/process_join_request/<int:member_id>/", process_join_request),
    path("communities/<int:community_id>/post-requests/", fetch_post_requests),
    path("communities/<int:community_id>/process_post-requests/<int:post_id>/", process_post_request),
    path("communities/<int:community_id>/highlights/<int:post_id>/remove/", remove_community_highlight),
    path("communities/<int:community_id>/reported-posts/<int:post_id>/dismiss/", dismiss_post_report),
    path("posts/<int:post_id>/admin_delete", delete_reported_post),
    # path("communities/<int:community_id>/kick/", ),
]
# chat / conversation
urlpatterns += [
    path("chats/", get_conversations),
    # message
    path("chats/<int:conversation_id>/messages/", get_messages),
    path("chats/<int:conversation_id>/send/", send_message),
    path("messages/<int:message_id>/delete/", delete_message),
    path("messages/<int:message_id>/edit/", edit_message),
    # chat_action
    path("chats/<int:conversation_id>/pin/", toggle_pin),
    path("chats/<int:conversation_id>/mute/", toggle_mute),
    path("chats/<int:conversation_id>/mark-read/", mark_read),
    path("chats/<int:conversation_id>/mark-unread/", mark_unread),
    path("chats/<int:conversation_id>/", delete_or_leave_chat),
    path("chats/<int:conversation_id>/clear/", clear_chat),
    path("chats/<int:conversation_id>/block/", toggle_block_user),
    # chat_dm_requests
    path("chat-requests/", chat_requests),
    path("chats/<int:conversation_id>/accept/", accept_chat_request),
    # chat_group
    path("groups/create/", create_group_conversation),
    path("groups/<int:conv_id>/members/", get_group_members),
    path("groups/<int:conv_id>/edit-details/", edit_group_details),
    path("groups/<int:conv_id>/edit-image/", edit_group_image),
    path("groups/invite-friends/", get_friends_to_invite),
    path("groups/<int:conv_id>/invite-friends/", get_friends_to_invite),
    path("groups/<int:conv_id>/share-link/", share_group_link),
    # chat_group_action
    path("groups/<int:conv_id>/add-member/", add_member_to_group),
    path("groups/<int:conv_id>/remove-member/", remove_member_from_group),
    path("groups/<int:conv_id>/toggle-admin/", toggle_group_admin),
    path("groups/<int:conv_id>/privacy-settings/", update_group_privacy_settings),
]
# page
urlpatterns += [
    path("auth/page/profile/update/", update_page_profile),
    path("pages/followed/", followed_pages),
    path("pages/recommended/", recommended_pages),
    path("pages/<int:page_id>/", page_detail),
    path("pages/<int:page_id>/follow/", toggle_follow_page),
    path("pages/<int:page_id>/review/", rate_page),
    path("pages/<int:page_id>/events/", page_events),
    path("pages/<int:page_id>/notify/", toggle_page_notifications),
    # subscriptions
    path("subscriptions/current/", get_current_subscription),
    path("subscriptions/subscribe/", subscribe_to_plan),
    path("subscriptions/cancel/", cancel_subscription),
    # promotions
    path("promotions/", get_page_promotions),
    path("posts/promotions/", get_page_post_promotions),
    path("communities/promotions/", get_page_community_promotions),
    path("events/promotions/", get_page_event_promotions),
    path("posts/promotions/checkout/", posts_promotion_checkout),
    path("events/promotions/checkout/", events_promotion_checkout),
    path("communities/promotions/checkout/", communities_promotion_checkout),
    path("promotions/<int:promotion_id>/delete/", delete_page_promotion),
    # university
    path("university/news/", university_news),
    path("university/news/<int:post_id>/extend/", extend_announcement),
    path("university/events/", university_events),
    path("university/doctors/", university_doctors),
    path("university/", university_info),
]
# event
urlpatterns += [
    path("events/", events),
    path("events/create/", create_event),
    path("events/<int:event_id>/update/", update_event),
    path("events/<int:event_id>/delete/", delete_event),
    # event_action
    path("events/<int:event_id>/remind/", toggle_event_reminder),
]
# global
urlpatterns += [
    # search
    path("search/", search),
    # report
    path("reports/", create_report),
    # notification
    path("notifications/", get_notifications),
    path("notifications/<int:notification_id>/", notification_delete_mark),
    # news
    path("news/", news_list),
]
