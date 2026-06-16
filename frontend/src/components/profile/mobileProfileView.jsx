import { useState } from 'react';
import PostCard from "../posts/postCard";
import UserDetails from "../rightPanel/userDetails/userDetails";
import FriendsTab from "../rightPanel/FriendsTab/FriendsTab";
import MessagesIcon from '../../Assets/icons/messages.png';
import { User, UserPlus, Users } from "lucide-react";
import SaveIcon from '../../Assets/icons/save-icon.png';
import CommentIcon from '../../Assets/icons/comment.png';
import LikeIcon from '../../Assets/icons/like.png';
import EventsIcon from '../../Assets/icons/event.png';
import BellOn from '../../Assets/icons/notifications-active.png';
import BellOff from '../../Assets/icons/notifications.png';
import VerifiedBadge from '../../Assets/icons/verified-mark.png';
import StarIcon from '../../Assets/icons/star.png';

const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const firstDay = (y, m) => new Date(y, m, 1).getDay();

export default function MobileProfileView({
    styles, user, currentUser, isOwnProfile,
    friendStatus, posts, photoPosts, friends,
    activityPosts, savedPosts, communityPicks,
    activeTab, setActiveTab, picksSlide, setPicksSlide,
    postsLoading, activitiesLoading, savedLoading,
    openComments, handleMessage, handleAddFriend,
    handleAccept, handleDecline,
    onEditClick, edit,
    activitiesFilter = 'likes',
    setActivitiesFilter,
    filteredActivityPosts = [],
    loadActivities,
    loadSavedPosts,
    reminders = [],
    remindersMonth,
    setRemindersMonth,
    setRemindersPopup,
    isFollowing,
    handleFollow,
    followersCount = 0,
    eventsTabNotify,
    handleEventsTabNotify,
    pageEvents = [],
    loadPageEvents,
    eventsTabReminders = {},
    handleEventsTabReminder,
    handleReview,
    reviewRating = 0,
    ...rest
}) {
    const [showCalendarMonthPicker, setShowCalendarMonthPicker] = useState(false);

    const username = user?.username || "Username";
    const role = user?.role || "Role";
    const fullName = user?.full_name || user?.fullName || "Full name";
    const university = user?.university || "University";
    const major = user?.major || "Major";
    const bio = user?.bio;
    const avatarUrl = user?.avatar_url || user?.avatar || "";
    const coverUrl = user?.cover_url || user?.cover || "";

    // ── Calendar ──
    const calMonth = remindersMonth || new Date();
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const monthName = MONTHS_LONG[month];
    const totalDays = daysInMonth(year, month);
    const startDay = firstDay(year, month);
    const eventDays = new Set((reminders || []).map(e => {
        const d = new Date(e.start_date || e.date || e.event_date);
        return (d.getFullYear() === year && d.getMonth() === month) ? d.getDate() : null;
    }).filter(Boolean));
    const cells = [...Array(startDay).fill(null), ...Array.from({ length: totalDays }, (_, i) => i + 1)];

    const ownTabs = ['Posts', 'Activities', 'About', 'Calendar'];
    const otherTabs = user?.type === 'page'
        ? ['Posts', 'Photos', 'Events', 'Info']
        : ['Posts', 'Photos', 'Friends', 'Details'];

    return (
        <div className={styles.mobileRoot}>

            {/* ── Cover ── */}
            <div className={styles.mobileCoverWrap}>
                {coverUrl && <img src={coverUrl} alt="cover" className={styles.mobileCoverImg} />}
            </div>

            {/* ── Avatar + Name ── */}
            <div className={styles.mobileProfileHeaderWrap}>
                <div className={styles.mobileAvatarNameRow}>

                 
                    <div className={styles.mobileAvatarCircle}>
                        {avatarUrl
                            ? <img src={avatarUrl} alt="avatar" className={styles.mobileAvatarImg} />
                            : <User size={36} color="white" />}
                    </div>

                    {/* Name block */}
                    <div className={styles.mobileNameBlock}>
                        {user?.type === 'page' ? (
                            <>
                                <div className={styles.mobileUsernameRow}>
                                    <h2 className={styles.mobileUsername}>{username}</h2>
                                    {user?.is_verified && (
                                        <img src={VerifiedBadge} alt="verified" className={styles.mobileVerifiedBadge} />
                                    )}
                                </div>
                                <div className={styles.mobileMetaRow}>
                                    {user?.category && <span>{user.category}</span>}
                                    {user?.category && <span>•</span>}
                                    <span>{followersCount.toLocaleString()} followers</span>
                                </div>
                                {bio && <p className={styles.mobileBio}>{bio}</p>}
                            </>
                        ) : user?.role === 'instructor' ? (
                            <>
                                <h2 className={styles.mobileUsername}>{username}</h2>
                                <div className={styles.mobileMetaRowWrap}>
                                    {user?.department && <span>{user.department}</span>}
                                    {user?.employment_type && <><span>·</span><span>{user.employment_type}</span></>}
                                </div>
                                {bio && <p className={styles.mobileBio}>{bio}</p>}
                            </>
                        ) : (
                            <>
                                <div className={styles.mobileUsernameBaselineRow}>
                                    <h2 className={styles.mobileUsername}>{username}</h2>
                                    <span className={styles.mobileRoleText}>/{role}</span>
                                </div>
                                <div className={styles.mobileFullName}>{fullName}</div>
                                <div className={styles.mobileUniMajor}>{university} — {major}</div>
                            </>
                        )}
                    </div>

                    {/* Action buttons */}
                    {!isOwnProfile ? (
                        <div className={styles.mobileActionBtns}>
                            <button className={styles.messageBtn} onClick={handleMessage} style={{ width: 36, height: 36 }}>
                               <img src={MessagesIcon} alt="message" width={18} height={18} className={styles.iconMsg} />
                            </button>
                            {user?.type === 'page' ? (
                                <>
                                    {isFollowing && (
                                        <button onClick={handleEventsTabNotify} className={styles.messageBtn} style={{ width: 36, height: 36 }}>
                                            <img src={eventsTabNotify ? BellOn : BellOff} width={16} height={16} className={styles.iconBell} />
                                        </button>
                                    )}
                                    <button onClick={handleFollow}
                                        className={isFollowing ? styles.friendsBtn : styles.addFriendBtn}
                                        style={{ padding: '6px 16px', fontSize: '0.8rem' }}>
                                        {isFollowing ? 'Followed' : 'Follow'}
                                    </button>
                                </>
                            ) : (
                                <>
                                    {friendStatus === "none" && <button className={styles.addFriendBtn} onClick={handleAddFriend} style={{ padding: '6px 12px', fontSize: '0.8rem' }}><UserPlus size={14} />Add</button>}
                                    {friendStatus === "sent" && <button className={styles.pendingBtn} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>⏳ Sent</button>}
                                    {friendStatus === "received" && (<><button className={styles.acceptBtn} onClick={handleAccept} style={{ padding: '6px 10px', fontSize: '0.8rem' }}>✅</button><button className={styles.declineBtn} onClick={handleDecline} style={{ padding: '6px 10px', fontSize: '0.8rem' }}>❌</button></>)}
                                    {friendStatus === "friends" && <button className={styles.friendsBtn} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>👥 Friends</button>}
                                </>
                            )}
                        </div>
                    ) : (
                        <button className={styles.mobileEditBtn} onClick={onEditClick}>Edit ✎</button>
                    )}
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className={styles.mobileTabBar}>
                {(isOwnProfile ? ownTabs : otherTabs).map(tab => (
                    <button
                        key={tab}
                        onClick={() => {
                            setActiveTab(tab);
                            if (tab === 'Activities') loadActivities?.();
                            if (tab === 'Events') loadPageEvents?.();
                        }}
                        className={`${styles.mobileTabBtn} ${activeTab === tab ? styles.mobileTabBtnActive : ''}`}
                    >{tab}</button>
                ))}
            </div>

            {/* ── Activities filter pills ── */}
            {isOwnProfile && activeTab === 'Activities' && (
                <div className={styles.mobileActivityPillsWrap}>
                    {[
                        { key: 'likes', label: 'Likes', icon: LikeIcon },
                        { key: 'comments', label: 'Comments', icon: CommentIcon },
                        { key: 'saves', label: 'Saves', icon: SaveIcon },
                    ].map(({ key, label, icon }) => (
                        <button
                            key={key}
                            onClick={() => { setActivitiesFilter?.(key); if (key === 'saves') loadSavedPosts?.(); }}
                            className={`${styles.mobileActivityPill} ${activitiesFilter === key ? styles.mobileActivityPillActive : ''}`}
                        >
                            <img src={icon} alt={label}
                                className={activitiesFilter === key ? styles.mobileActivityPillIconActive : styles.mobileActivityPillIcon} />
                            {label}
                        </button>
                    ))}
                </div>
            )}

            {/* ── Tab content ── */}
            <div className={styles.mobileTabContent}>

                {/* Posts */}
                {activeTab === 'Posts' && (
                    postsLoading
                        ? <div className={styles.notice}>Loading...</div>
                        : posts.length === 0
                            ? <div className={styles.notice}>No posts yet.</div>
                            : posts.map(post => <PostCard key={post.id} post={post} openComments={openComments} />)
                )}

                {/* Photos */}
                {activeTab === 'Photos' && (
                    <div className={styles.mobilePhotosGrid}>
                        {photoPosts.length > 0 ? photoPosts.map((post, idx) => (
                            <img key={post.id}
                                src={post.image || post.image_url || post.media?.[0]?.url} alt=""
                                onClick={() => openComments(post)}
                                className={`${styles.mobilePhotoItem} ${idx === 0 ? styles.mobilePhotoItemFirst : ''}`}
                            />
                        )) : <div className={styles.notice} style={{ gridColumn: 'span 3' }}>No photos found.</div>}
                    </div>
                )}

                {/* Friends */}
                {activeTab === 'Friends' && (
                    <div className={styles.friendsTabContent}>
                        <FriendsTab friends={friends} />
                    </div>
                )}

                {/* Details — visitor view */}
                {activeTab === 'Details' && (
                    <UserDetails user={user} hidePill />
                )}

                {/* About — own profile */}
                {activeTab === 'About' && (
                    <UserDetails user={user} hidePill darker noBorder />
                )}

                {/* Activities */}
                {activeTab === 'Activities' && (
                    activitiesLoading
                        ? <div className={styles.notice}>Loading activities...</div>
                        : (() => {
                            const postsToShow = activitiesFilter === 'saves' ? savedPosts : filteredActivityPosts;
                            return postsToShow.length > 0
                                ? postsToShow.map(post => <PostCard key={post.id} post={post} openComments={openComments} />)
                                : <div className={styles.notice}>
                                    No {activitiesFilter === 'saves' ? 'saved' : activitiesFilter === 'likes' ? 'liked' : 'commented'} posts yet.
                                </div>;
                        })()
                )}

                {/* Info — page viewer */}
                {activeTab === 'Info' && user?.type === 'page' && (
                    <div className={styles.mobileInfoWrap}>
                        <UserDetails user={user} hidePill />
                        <div className={styles.mobileReviewCard}>
                            <div className={styles.mobileReviewHeader}>
                                <div className={styles.mobileReviewStarIcon}
                                    style={{ maskImage: `url(${StarIcon})`, WebkitMaskImage: `url(${StarIcon})` }} />
                                <span className={styles.mobileReviewTitle}>Add a Review</span>
                            </div>
                            <div className={styles.mobileStarsRow}>
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button key={star} className={styles.mobileStarBtn} onClick={() => handleReview?.(star)}>
                                        <div className={star <= reviewRating ? styles.mobileStarActive : styles.mobileStarInactive}
                                            style={{ maskImage: `url(${StarIcon})`, WebkitMaskImage: `url(${StarIcon})` }} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Events */}
                {activeTab === 'Events' && (
                    pageEvents.length === 0
                        ? <div className={styles.notice}>No events yet.</div>
                        : pageEvents.map(event => {
                            const bannerSrc = event.image
                                ? (event.image.startsWith('http') ? event.image : `http://localhost:8000${event.image}`)
                                : '';
                            const avatarSrc = event.avatar
                                ? (event.avatar.startsWith('http') ? event.avatar : `http://localhost:8000${event.avatar}`)
                                : '';
                            return (
                                <div key={event.id} className={styles.mobileEventCard}>
                                    <div className={styles.mobileEventCardHeader}>
                                        <div className={styles.mobileEventCardLeft}>
                                            {avatarSrc && <img src={avatarSrc} alt="" className={styles.mobileEventCardAvatar} />}
                                            <div>
                                                <div className={styles.mobileUsernameRow}>
                                                    <span className={styles.mobileEventCardOrgName}>{event.organization_name || username}</span>
                                                    {user?.is_verified && <img src={VerifiedBadge} alt="" className={styles.mobileVerifiedBadge} />}
                                                </div>
                                                <p className={styles.mobileEventCardPageType}>{event.page_type || user?.category}</p>
                                            </div>
                                        </div>
                                        <div className={styles.mobileEventCardRight}>
                                            {isFollowing && (
                                                <button onClick={handleEventsTabNotify} className={styles.mobileEventNotifyBtn}>
                                                    <img src={eventsTabNotify ? BellOn : BellOff} alt="" width={16} height={16}
                                                        style={{ filter: 'brightness(0) saturate(100%) invert(85%)' }} />
                                                </button>
                                            )}
                                            <button onClick={handleFollow}
                                                className={isFollowing ? styles.mobileEventFollowedBtn : styles.mobileEventFollowBtn}>
                                                {isFollowing ? 'Followed' : 'Follow'}
                                            </button>
                                        </div>
                                    </div>
                                    {bannerSrc && (
                                        <div className={styles.mobileEventBannerWrap}>
                                            <img src={bannerSrc} alt="" className={styles.mobileEventBannerImg} />
                                            <div className={styles.mobileEventDateWidget}>
                                                <div>
                                                    <p className={styles.mobileEventDateText}>Starts {new Date(event.start_date).toLocaleDateString()}</p>
                                                    <p className={styles.mobileEventDateText}>Ends — {new Date(event.end_date).toLocaleDateString()}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleEventsTabReminder?.(event.id)}
                                                    className={`${styles.mobileEventRemindBtn} ${eventsTabReminders[event.id] ? styles.mobileEventRemindBtnActive : ''}`}>
                                                    {eventsTabReminders[event.id] ? '✓ Set' : 'Remind'}
                                                </button>
                                            </div>
                                            <div className={styles.mobileEventOverlay}>
                                                <h2 className={styles.mobileEventTitle}>{event.title}</h2>
                                                {event.description && (
                                                    <p className={styles.mobileEventDesc}>
                                                        {event.description.length > 80 ? `${event.description.substring(0, 80)}...` : event.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                )}

                {/* Calendar */}
                {activeTab === 'Calendar' && (
                    <div className={styles.mobileCalendarWrap}>
                        {/* Header */}
                        <div className={styles.mobileCalendarHeader}>
                            <img src={EventsIcon} alt="events" className={styles.mobileCalendarIcon} />
                            <span className={styles.mobileCalendarTitle}>Reminders</span>
                            <button className={styles.mobileCalendarMonthToggle}
                                onClick={() => setShowCalendarMonthPicker(p => !p)}>
                                {monthName} {year}
                            </button>
                        </div>

                        {/* Month picker */}
                        {showCalendarMonthPicker && (
                            <div className={styles.mobileMonthPickerWrap}>
                                <div className={styles.mobileMonthPickerNav}>
                                    <button className={styles.mobileMonthPickerNavBtn}
                                        onClick={() => setRemindersMonth?.(new Date(year - 1, month, 1))}>‹</button>
                                    <span className={styles.mobileMonthPickerYear}>{year}</span>
                                    <button className={styles.mobileMonthPickerNavBtn}
                                        onClick={() => setRemindersMonth?.(new Date(year + 1, month, 1))}>›</button>
                                </div>
                                <div className={styles.mobileMonthGrid}>
                                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                                        <button key={m}
                                            onClick={() => { setRemindersMonth?.(new Date(year, i, 1)); setShowCalendarMonthPicker(false); }}
                                            className={`${styles.mobileMonthBtn} ${i === month ? styles.mobileMonthBtnActive : ''}`}
                                        >{m}</button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Day labels */}
                        <div className={styles.mobileCalendarDayLabels}>
                            {DAYS_SHORT.map(d => (
                                <div key={d} className={styles.mobileCalendarDayLabel}>{d}</div>
                            ))}
                        </div>

                        {/* Day cells */}
                        <div className={styles.mobileCalendarDays}>
                            {cells.map((day, i) => {
                                const hasEvent = day && eventDays.has(day);
                                return (
                                    <div key={i}
                                        onClick={() => {
                                            if (!hasEvent) return;
                                            setRemindersPopup?.({
                                                day, monthName,
                                                events: reminders.filter(e => {
                                                    const d = new Date(e.start_date || e.date || e.event_date);
                                                    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
                                                })
                                            });
                                        }}
                                        className={`${styles.mobileCalendarDay} ${!day ? styles.mobileCalendarDayEmpty : hasEvent ? styles.mobileCalendarDayEvent : ''}`}
                                    >
                                        {day || ""}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Community picks (visitor) */}
                {!isOwnProfile && activeTab !== 'Details' && communityPicks.length > 0 && (
                    <div className={styles.picksCard} style={{ marginTop: 8 }}>
                        <div className={styles.picksHeader}>
                            <Users size={18} />
                            <span className={styles.picksTitle}>{user?.username?.split(' ')[0]}'s Picks</span>
                        </div>
                        <div className={styles.picksSliderWrapper}>
                            <button className={styles.picksArrow} onClick={() => setPicksSlide(p => Math.max(0, p - 1))} disabled={picksSlide === 0}>‹</button>
                            <div className={styles.picksSlide}>
                                {communityPicks[picksSlide] && (() => {
                                    const pick = communityPicks[picksSlide];
                                    return (
                                        <div className={styles.pickItem}>
                                            {pick.cover_image && <img src={pick.cover_image} alt={pick.name} className={styles.pickCoverImage} />}
                                            <div className={styles.pickInfo}>
                                                <div className={styles.pickNameRow}>
                                                    <span className={styles.pickName}>{pick.name}</span>
                                                    <button className={styles.pickViewBtn}>View</button>
                                                </div>
                                                <p className={styles.pickDescription}>{pick.description}</p>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                            <button className={styles.picksArrow} onClick={() => setPicksSlide(p => Math.min(communityPicks.length - 1, p + 1))} disabled={picksSlide === communityPicks.length - 1}>›</button>
                        </div>
                        {communityPicks.length > 1 && (
                            <div className={styles.picksDots}>
                                {communityPicks.map((_, i) => (
                                    <button key={i} className={`${styles.picksDot} ${i === picksSlide ? styles.picksDotActive : ''}`} onClick={() => setPicksSlide(i)} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}