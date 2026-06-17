import styles from './profilepage.module.css';
import Header from '../../components/pagelayout/header/header';
import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import PostCard from '../../components/posts/postCard';
import UserDetails from '../../components/rightPanel/userDetails/userDetails';
import CommentModal from '../../components/comments/commentsModal';
import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav';
import FriendsTab from '../../components/rightPanel/FriendsTab/FriendsTab';
import FriendsSuggestion from '../../components/rightPanel/recentlycontacted/recentlyContacted';
import MobileHeader from '../../components/mobileHeader/mobileHeader';
import MobileEditView from '../../components/profile/mobileEditView';
import MobileProfileView from '../../components/profile/mobileProfileView';
import { useProfileEdit } from '../../components/profile/useEditProfile';
import ProfileEditCard from '../../components/profile/profileEditCard';
import Like from '../../Assets/icons/like.png';
import Comment from '../../Assets/icons/comment.png';
import Save from '../../Assets/icons/save-icon.png';
import Community from '../../Assets/icons/community.png';
import VerifiedBadge from '../../Assets/icons/verified-mark.png';
import Star from '../../Assets/icons/star.png';
import Events from '../../Assets/icons/event.png';
import Share from '../../Assets/icons/share.png';
import Bin from '../../Assets/icons/bin.png';
import ArrowRight from '../../Assets/icons/arrow-right.png';
import ArrowLeft from '../../Assets/icons/arrow-left.png';
import Info from '../../Assets/icons/info.png';
import ProfilePicture from '../../Assets/icons/default-pfp.png';
import MessagesIcon from '../../Assets/icons/messages.png';
import BellOn from '../../Assets/icons/notifications.png';
import BellOff from '../../Assets/icons/mute.png';
import Edit from '../../Assets/icons/edit.png';
import { useCreateEvent } from '../../components/createEvent/useCreateEvent';
import CreateEventForm from '../../components/createEvent/CreateEventForm';
import CreateEventRightSidebar from '../../components/createEvent/CreateEventRightSidebar';
import ReportModal from '../../components/posts/ReportModal';
import API from '../../config';
import { AlertCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import {
    User, UserPlus, Bell,
    X, Check, MoreHorizontal, Ban,
} from 'lucide-react';

import useTheme from '../../hooks/useTheme';

// ─── helpers ────────────────────────────────────────────────────────────────

const resolveUrl = (url) => (!url ? null : url.startsWith('http') ? url : `${API}${url}`);

const fmtDate = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
};

const fmtTime = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    let h = dt.getHours();
    const p = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${String(dt.getMinutes()).padStart(2, '0')} ${p}`;
};

const toISO = (day, month, year, hour, minute, period) => {
    let h = parseInt(hour);
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
};

const toSegments = (iso) => {
    if (!iso) return { d: '', mo: '', y: '', h: '', mi: '', p: 'AM' };
    const dt = new Date(iso);
    let h = dt.getHours();
    const p = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return {
        d: String(dt.getDate()).padStart(2, '0'),
        mo: String(dt.getMonth() + 1).padStart(2, '0'),
        y: String(dt.getFullYear()),
        h: String(h).padStart(2, '0'),
        mi: String(dt.getMinutes()).padStart(2, '0'),
        p,
    };
};

const maskStyle = (icon, size = 20, color = '#999999') => ({
    width: size, height: size,
    backgroundColor: color,
    maskImage: `url(${icon})`,
    WebkitMaskImage: `url(${icon})`,
    maskSize: 'contain', WebkitMaskSize: 'contain',
    maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
    maskPosition: 'center', WebkitMaskPosition: 'center',
    flexShrink: 0,
});

const EDIT_EMPTY = {
    title: '', description: '',
    startDay: '', startMonth: '', startYear: '',
    startHour: '', startMinute: '', startPeriod: 'AM',
    endDay: '', endMonth: '', endYear: '',
    endHour: '', endMinute: '', endPeriod: 'AM',
};

// ─── sub-components ──────────────────────────────────────────────────────────

function AmPmToggle({ value, field, onChange }) {
    return (
        <div className={styles.manageEditAmPm}>
            {['AM', 'PM'].map(p => (
                <button
                    key={p}
                    className={`${styles.manageEditAmPmBtn} ${value === p ? styles.manageEditAmPmActive : ''}`}
                    onClick={() => onChange(field, p)}
                >{p}</button>
            ))}
        </div>
    );
}

function DateTimeSegments({ prefix, data, onChange }) {
    const num = (field, max) => (e) => {
        const v = e.target.value.replace(/\D/g, '');
        if (v === '' || +v <= max) onChange(`${prefix}${field}`, v);
    };
    return (
        <div className={styles.manageEditSegmentRow}>
            <input type="text" inputMode="numeric" placeholder="DD" maxLength="2"
                className={styles.manageEditSegment} value={data[`${prefix}Day`]} onChange={num('Day', 31)} />
            <span className={styles.manageEditSep}>/</span>
            <input type="text" inputMode="numeric" placeholder="MM" maxLength="2"
                className={styles.manageEditSegment} value={data[`${prefix}Month`]} onChange={num('Month', 12)} />
            <span className={styles.manageEditSep}>/</span>
            <input type="text" inputMode="numeric" placeholder="YYYY" maxLength="4"
                className={styles.manageEditSegmentYear} value={data[`${prefix}Year`]}
                onChange={e => onChange(`${prefix}Year`, e.target.value.replace(/\D/g, ''))} />
            <span className={styles.manageEditSep}>at</span>
            <input type="text" inputMode="numeric" placeholder="HH" maxLength="2"
                className={styles.manageEditSegment} value={data[`${prefix}Hour`]} onChange={num('Hour', 12)} />
            <span className={styles.manageEditSep}>:</span>
            <input type="text" inputMode="numeric" placeholder="MM" maxLength="2"
                className={styles.manageEditSegment} value={data[`${prefix}Minute`]} onChange={num('Minute', 59)} />
            <AmPmToggle value={data[`${prefix}Period`]} field={`${prefix}Period`} onChange={onChange} />
        </div>
    );
}

function MonthPicker({ date, setDate, onClose, events = [], activeTab }) {
    const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'monthSelect'

    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    const eventDays = new Set(events.filter(e => {
        const d = new Date(activeTab === 'history' ? e.end_date : e.start_date);
        return d.getFullYear() === year && d.getMonth() === month;
    }).map(e => new Date(activeTab === 'history' ? e.end_date : e.start_date).getDate()));

    const cells = [
        ...Array(firstDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    if (viewMode === 'monthSelect') {
        return (
            <div className={styles.manageMonthDropdown}>
                <div className={styles.manageMonthNav}>
                    <button onClick={() => setDate(new Date(year - 1, month, 1))} className={styles.manageMonthNavBtn}>‹</button>
                    <span className={styles.manageMonthYear} onClick={() => setViewMode('calendar')} style={{ cursor: 'pointer' }}>{year}</span>
                    <button onClick={() => setDate(new Date(year + 1, month, 1))} className={styles.manageMonthNavBtn}>›</button>
                </div>
                <div className={styles.manageMonthGrid}>
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                        <button key={m}
                            onClick={() => { setDate(new Date(year, i, 1)); setViewMode('calendar'); }}
                            className={`${styles.manageMonthBtn} ${i === month ? styles.manageMonthBtnActive : styles.manageMonthBtnInactive}`}
                        >{m}</button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.manageMonthDropdown} style={{ width: 280, padding: '12px 16px' }}>
            {/* Header */}
            <div className={styles.manageMonthNav}>
                <button onClick={() => setDate(new Date(year, month - 1, 1))} className={styles.manageMonthNavBtn}>‹</button>
                <span
                    className={styles.manageMonthYear}
                    onClick={() => setViewMode('monthSelect')}
                    style={{ cursor: 'pointer', fontSize: '0.95rem' }}
                >
                    {date.toLocaleString('default', { month: 'long' })} {year} ▾
                </span>
                <button onClick={() => setDate(new Date(year, month + 1, 1))} className={styles.manageMonthNavBtn}>›</button>
            </div>

            {/* Day labels */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', padding: '4px 0' }}>{d}</div>
                ))}
            </div>

            {/* Day cells */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                {cells.map((day, i) => {
                    const hasEvent = day && eventDays.has(day);
                    const isToday = day && today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
                    const isSelected = day && date.getDate() === day;

                    return (
                        <div
                            key={i}
                            onClick={() => { if (day) { setDate(new Date(year, month, day)); onClose(); } }}
                            style={{
                                textAlign: 'center',
                                padding: '6px 2px',
                                borderRadius: 8,
                                fontSize: '0.8rem',
                                cursor: day ? 'pointer' : 'default',
                                position: 'relative',
                                fontWeight: hasEvent ? 700 : 400,
                                color: !day ? 'transparent'
                                    : hasEvent ? 'white'
                                        : isToday ? '#c72cff'
                                            : 'rgba(255,255,255,0.5)',
                                background: hasEvent
                                    ? 'linear-gradient(135deg, rgba(199,44,255,0.35), rgba(139,45,255,0.35))'
                                    : isSelected ? 'rgba(255,255,255,0.08)'
                                        : 'transparent',
                                border: isToday ? '1px solid rgba(199,44,255,0.5)' : '1px solid transparent',
                                transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => { if (day) e.currentTarget.style.background = hasEvent ? 'linear-gradient(135deg, rgba(199,44,255,0.55), rgba(139,45,255,0.55))' : 'rgba(255,255,255,0.06)'; }}
                            onMouseLeave={e => { if (day) e.currentTarget.style.background = hasEvent ? 'linear-gradient(135deg, rgba(199,44,255,0.35), rgba(139,45,255,0.35))' : isSelected ? 'rgba(255,255,255,0.08)' : 'transparent'; }}
                        >
                            {day || ''}
                            {hasEvent && (
                                <div style={{
                                    position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)',
                                    width: 4, height: 4, borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #c72cff, #8b2dff)',
                                }} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
// ─── main component ──────────────────────────────────────────────────────────

export default function ProfilePage({ type }) {
    const { theme, toggleTheme } = useTheme();

    const isLight = theme === 'light';
    const [user, setUser] = useState(null);
    const [friendStatus, setFriendStatus] = useState('none');
    const [currentUser, setCurrentUser] = useState(null);

    const token = localStorage.getItem('access');
    const userType = localStorage.getItem('user_type');

    // ui state
    const [userLoading, setUserLoading] = useState(true);
    const [userError, setUserError] = useState('');
    const [selectedPost, setSelectedPost] = useState(null);
    const [posts, setPosts] = useState([]);
    const [friends, setFriends] = useState([]);
    const [friendsLoading, setFriendsLoading] = useState(false);
    const [postsLoading, setPostsLoading] = useState(true);
    const [postsError, setPostsError] = useState('');
    const [activeTab, setActiveTab] = useState('Posts');
    const [activityPosts, setActivityPosts] = useState([]);
    const [activitiesLoading, setActivitiesLoading] = useState(false);
    const [communityPicks, setCommunityPicks] = useState([]);
    const [picksSlide, setPicksSlide] = useState(0);
    const [savedPosts, setSavedPosts] = useState([]);
    const [activitiesFilter, setActivitiesFilter] = useState('likes');
    const [activitiesDropdownOpen, setActivitiesDropdownOpen] = useState(false);
    const [savedLoading, setSavedLoading] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [reviewRating, setReviewRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [pageEvents, setPageEvents] = useState([]);
    const [picksPopup, setPicksPopup] = useState(null);
    const [reminders, setReminders] = useState([]);
    const [remindersMonth, setRemindersMonth] = useState(new Date());
    const [remindersPopup, setRemindersPopup] = useState(null);
    const [eventMenuOpen, setEventMenuOpen] = useState(null);
    const [showRemindersMonthPicker, setShowRemindersMonthPicker] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [unfriendPopup, setUnfriendPopup] = useState(false);
    const [showPicksModal, setShowPicksModal] = useState(false);
    const [joinedCommunities, setJoinedCommunities] = useState([]);
    const [picksLoading, setPicksLoading] = useState(false);
    const [modalPicks, setModalPicks] = useState([]);
    const [pageFollowStatus, setPageFollowStatus] = useState({});
    const [pageNotifyStatus, setPageNotifyStatus] = useState({});
    const [reportTargetId, setReportTargetId] = useState(null);


    // events management
    const [showManageEvents, setShowManageEvents] = useState(false);
    const [activeEventTab, setActiveEventTab] = useState('upcoming');
    const [manageEventsDate, setManageEventsDate] = useState(new Date());
    const [showManageMonthPicker, setShowManageMonthPicker] = useState(false);
    const [showCreateEvent, setShowCreateEvent] = useState(false);
    const [ownPageEvents, setOwnPageEvents] = useState([]);
    const [editingEventId, setEditingEventId] = useState(null);
    const [editEventData, setEditEventData] = useState(EDIT_EMPTY);
    const [deleteEventPopup, setDeleteEventPopup] = useState(null);
    const [eventsTabNotify, setEventsTabNotify] = useState(false);
    const [eventsTabReminders, setEventsTabReminders] = useState({});
    const [eventsTabPopup, setEventsTabPopup] = useState(null);
    const [showPromotionsModal, setShowPromotionsModal] = useState(false);
    const [promotionsData, setPromotionsData] = useState({ posts: [], communities: [], events: [] });
    const [promotionsLoading, setPromotionsLoading] = useState(false);
    const [activePromoTab, setActivePromoTab] = useState('communities');
    const [activePromoStatusFilter, setActivePromoStatusFilter] = useState('ONHOLD');

    // refs
    const menuRef = useRef(null);
    const activitiesDropdownRef = useRef(null);
    const mobileMenuRef = useRef(null);
    const onSavedRef = useRef(null);

    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const { pathname } = useLocation();
    const { userId, id } = useParams();
    const profileId = userId || id;
    const navigate = useNavigate();

    const edit = useProfileEdit({ user, token, API, onSaved: () => onSavedRef.current?.() });
    const { isEditing, setIsEditing } = edit;

    const createEvent = useCreateEvent({
        onSuccess: (eventId) => {
            setShowCreateEvent(false);
            navigate('/events', { state: { highlightId: eventId } });
        }
    });

    // ─── derived ────────────────────────────────────────────────────────────

    const isOwnProfile =
        currentUser?.id === Number(profileId) ||
        currentUser?.id === Number(userId) ||
        currentUser?.page_id === Number(profileId) ||
        currentUser?.page_id === Number(userId);

    const isPageUser = isOwnProfile && (
        userType === 'page' || userType === 'university' ||
        user?.type === 'page' || user?.role === 'university'
    );

    const username = user?.username || 'Username';
    const role = user?.role || 'Role';
    const fullName = user?.full_name || user?.fullName || 'Full name';
    const university = user?.university || 'University';
    const major = user?.major || 'Major';
    const bio = user?.bio;
    const avatarUrl = user?.avatar_url || user?.avatar || '';
    const coverUrl = user?.cover_url || user?.cover || '';

    const currentAvatarSrc = currentUser?.avatar
        ? resolveUrl(currentUser.avatar)
        : ProfilePicture;

    const photoPosts = posts.filter(post => {
        const fileUrl = post.image || post.image_url || (Array.isArray(post.media) && post.media[0]?.url);
        if (!fileUrl || typeof fileUrl !== 'string') return false;
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'].some(ext => fileUrl.toLowerCase().endsWith(ext));
    });

    const filteredActivityPosts = activityPosts.filter(post => {
        if (activitiesFilter === 'saves') return post.is_saved;
        if (activitiesFilter === 'likes') return post.is_liked;
        if (activitiesFilter === 'comments') return post.is_commented;
        return true;
    });

    // ─── effects ────────────────────────────────────────────────────────────

    useEffect(() => { if (user) edit.syncFromUser(user); }, [user]);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    useEffect(() => {
        document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileMenuOpen]);

    useEffect(() => {
        const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    useEffect(() => {
        const close = (e) => { if (activitiesDropdownRef.current && !activitiesDropdownRef.current.contains(e.target)) setActivitiesDropdownOpen(false); };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    useEffect(() => {
        if (!user) return;
        setIsBlocked(user?.is_blocked || ['blocked', 'blocked_by_user'].includes(friendStatus));
    }, [user, friendStatus]);

    useEffect(() => {
        if (user?.type === 'page') {
            setIsFollowing(user?.is_following || false);
            setFollowersCount(user?.followers_count || 0);
        }
    }, [user]);

    useEffect(() => {
        loadCurrentUser();
        loadProfileUser();
    }, [userId]);

    useEffect(() => {
        if (!user || !currentUser) return;
        const isOwn =
            currentUser.id === Number(profileId) ||
            currentUser.id === Number(userId) ||
            currentUser.page_id === Number(profileId) ||
            currentUser.page_id === Number(userId);

        if (isOwn && user?.type === 'page') { loadOwnPageEvents(); return; }
        if (isOwn && user?.role === 'instructor') { loadCommunityPicks(); return; }
        if (isOwn) return;
        if (user.role === 'instructor') loadCommunityPicks();
        if (user.type !== 'page') loadFriends(userId);
    }, [user, currentUser, userId]);

    useEffect(() => {
        if (!user || !currentUser) return;
        const isOwn =
            currentUser.id === Number(profileId) ||
            currentUser.id === Number(userId) ||
            currentUser.page_id === Number(profileId) ||
            currentUser.page_id === Number(userId);

        if (isOwn && user?.type === 'page') { loadOwnPageEvents(); return; }
        if (isOwn) loadReminders();
        if (user.role === 'instructor') loadCommunityPicks();
        if (user.type !== 'page') loadFriends(userId);
    }, [user, currentUser, userId]);

    // ─── data loaders ───────────────────────────────────────────────────────

    const loadCurrentUser = async () => {
        try {
            const res = await fetch(`${API}/api/auth/me/`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.role === 'university' || localStorage.getItem('user_type') === 'university') {
                const pageRes = await fetch(`${API}/api/pages/${data.id}/`, { headers: { Authorization: `Bearer ${token}` } });
                if (pageRes.ok) {
                    const pageData = await pageRes.json();
                    data.avatar = pageData.profile_image;
                }
            }
            setCurrentUser(data);
        } catch (e) { console.error(e); }
    };
    const loadPromotions = async () => {
        setPromotionsLoading(true);
        try {
            const headers = { Authorization: `Bearer ${token}` };
            const res = await fetch(`${API}/api/promotions/`, { headers });
            const data = res.ok ? await res.json() : { posts: [], communities: [], events: [] };

            setPromotionsData({
                posts: data.posts || [],
                communities: data.communities || [],
                events: data.events || [],
            });
        } catch (e) { console.error(e); }
        finally { setPromotionsLoading(false); }
    };

    const loadProfileUser = async () => {
        try {
            let res, raw, isPageType;

            if (type === 'page') {
                res = await fetch(`${API}/api/pages/${profileId}/`, { headers: { Authorization: `Bearer ${token}` } });
                isPageType = true;
            } else if (type === 'user') {
                res = await fetch(`${API}/api/users/${profileId}/`, { headers: { Authorization: `Bearer ${token}` } });
                isPageType = false;
            } else {
                res = await fetch(`${API}/api/users/${profileId}/`, { headers: { Authorization: `Bearer ${token}` } });
                isPageType = false;
                if (!res.ok) {
                    res = await fetch(`${API}/api/pages/${profileId}/`, { headers: { Authorization: `Bearer ${token}` } });
                    isPageType = true;
                }
            }

            if (!res.ok) { setUserError('Failed'); setUser(null); return; }
            raw = await res.json();

            let data;
            if (isPageType) {
                data = {
                    ...raw,
                    id: raw.page_id,
                    type: 'page',
                    username: raw.page_full_name || raw.page_name,
                    avatar_url: resolveUrl(raw.profile_image),
                    cover_url: resolveUrl(raw.banner_image),
                    bio: raw.description || '',
                    is_verified: raw.verified,
                    is_following: raw.is_followed,
                    followers_count: raw.followers_count || 0,
                    category: raw.page_type,
                };
            } else {
                data = {
                    ...raw,
                    avatar_url: resolveUrl(raw.profile?.avatar),
                    cover_url: resolveUrl(raw.profile?.cover),
                    full_name: raw.profile?.full_name || raw.full_name || '',
                    bio: raw.profile?.bio || raw.bio || '',
                };
            }

            setUser(data);

            if (!isPageType) {
                const fs = raw.friendship_status;
                const rawStatus = typeof fs === 'object' ? fs?.status : fs;
                const sentByMe = typeof fs === 'object' ? fs?.sent_by_me : null;
                const statusMap = {
                    accepted: 'friends', pending: sentByMe ? 'sent' : 'received',
                    pending_sent: 'sent', pending_received: 'received', rejected: 'none',
                };
                setFriendStatus(statusMap[rawStatus] || rawStatus || 'none');
            }

            if (data?.id) loadPosts(data.id, data.type);
        } catch (e) {
            console.error(e);
            setUserError(e?.message || 'Something went wrong');
        } finally {
            setUserLoading(false);
        }
    };
    onSavedRef.current = loadProfileUser;

    const loadOwnPageEvents = async () => {
        const pageId = currentUser?.page_id || user?.id || profileId;
        if (!pageId) return;
        try {
            const res = await fetch(`${API}/api/pages/${pageId}/events/`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (res.ok) {
                const now = new Date();
                const events = (Array.isArray(data) ? data : []).sort((a, b) => {
                    const aDate = new Date(a.start_date);
                    const bDate = new Date(b.start_date);
                    const aUpcoming = aDate >= now;
                    const bUpcoming = bDate >= now;
                    if (aUpcoming && !bUpcoming) return -1;
                    if (!aUpcoming && bUpcoming) return 1;
                    return aDate - bDate;
                });
                setOwnPageEvents(events);
                setPageEvents(events);
                if (events.length > 0) setEventsTabNotify(events[0].is_notified || false);
                const reminderMap = {};
                events.forEach(e => { reminderMap[e.id] = e.is_reminded || false; });
                setEventsTabReminders(reminderMap);
            }
        } catch (e) { console.error(e); }
    };

    const loadPosts = async (id, type) => {
        try {
            const param = type === 'page' ? 'page' : 'user';
            const res = await fetch(`${API}/api/posts?${param}=${id}`, { headers: { Authorization: `Bearer ${token}` } });
            let data;
            try { data = await res.json(); } catch {
                setPostsError('Invalid server response.'); setPosts([]); setPostsLoading(false); return;
            }
            if (!res.ok) { setPostsError(data?.message || 'Failed to load posts'); setPosts([]); return; }
            setPosts((Array.isArray(data) ? data : []).map(p => ({ ...p, id: p.id || p.post_id })));
        } catch (e) { setPostsError(e?.message || 'Something went wrong'); setPosts([]); }
        finally { setPostsLoading(false); }
    };

    const loadActivities = async () => {
        try {
            setActivitiesLoading(true);
            const res = await fetch(`${API}/api/posts/activity/`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setActivityPosts((Array.isArray(data) ? data : []).map(post => ({
                    ...post,
                    id: post.post_id || post.id,
                    content: post.content_text || post.content,
                    author: post.author || {
                        id: post.author_user || post.author_page,
                        username: post.author_username || 'Unknown',
                        avatar: post.author_avatar || null,
                    },
                })));
            }
        } catch (e) { console.error(e); }
        finally { setActivitiesLoading(false); }
    };

    const loadSavedPosts = async () => {
        try {
            setSavedLoading(true);
            const res = await fetch(`${API}/api/posts/saved/`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) { const data = await res.json(); setSavedPosts(Array.isArray(data) ? data : []); }
        } catch (e) { console.error(e); }
        finally { setSavedLoading(false); }
    };

    const loadFriends = async (uid) => {
        try {
            setFriendsLoading(true);
            const res = await fetch(`${API}/api/users/${uid}/friends/`, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) { setFriends([]); return; }
            setFriends(await res.json());
        } catch (e) { console.error(e); }
        finally { setFriendsLoading(false); }
    };

    const loadReminders = async () => {
        try {
            const res = await fetch(`${API}/api/events/reminders/`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                const events = Array.isArray(data) ? data : [];
                setReminders(events);
                const followInit = {}, notifyInit = {};
                events.forEach(e => {
                    const pid = e.page?.page_id ?? e.page?.id;
                    if (pid) { followInit[pid] = e.page.is_followed ?? true; notifyInit[pid] = e.page.is_notified ?? false; }
                });
                setPageFollowStatus(followInit);
                setPageNotifyStatus(notifyInit);
            }
        } catch (e) { console.error(e); }
    };

    const loadCommunityPicks = async () => {
        try {
            const res = await fetch(`${API}/api/users/${userId}/community-picks/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) { const data = await res.json(); setCommunityPicks(Array.isArray(data) ? data : []); }
        } catch (e) { console.error(e); }
    };

    const loadPageEvents = async () => {
        if (!profileId) return;
        try {
            // 🎯 Fixed: Targets the current page's specific events instead of the global endpoint
            const res = await fetch(`${API}/api/pages/${profileId}/events/`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                const events = Array.isArray(data) ? data : [];
                setPageEvents(events);

                if (events.length > 0) setEventsTabNotify(events[0].is_notified || false);
                const reminderMap = {};
                events.forEach(e => { reminderMap[e.id] = e.is_reminded || false; });
                setEventsTabReminders(reminderMap);
            }
        } catch (e) { console.error(e); }
    };

    // ─── actions ────────────────────────────────────────────────────────────

    const handleBlock = async () => {
        const wasBlocked = isBlocked;
        setIsBlocked(!wasBlocked);
        try {
            const res = await fetch(`${API}/api/users/${userId}/block/`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) setIsBlocked(wasBlocked);
        } catch { setIsBlocked(wasBlocked); }
    };

    const handleEventsTabNotify = async () => {
        const prev = eventsTabNotify;
        setEventsTabNotify(!prev);
        try {
            const res = await fetch(`${API}/api/pages/${userId}/notify/`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) { const data = await res.json(); setEventsTabNotify(data.is_notified); }
            else setEventsTabNotify(prev);
        } catch { setEventsTabNotify(prev); }
    };

    const handleEventsTabReminder = async (eventId) => {
        const prev = eventsTabReminders[eventId];
        setEventsTabReminders(s => ({ ...s, [eventId]: !prev }));
        try {
            const res = await fetch(`${API}/api/events/${eventId}/remind/`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) setEventsTabReminders(s => ({ ...s, [eventId]: prev }));
        } catch { setEventsTabReminders(s => ({ ...s, [eventId]: prev })); }
    };

    const handleUnfriend = async () => {
        const res = await fetch(`${API}/api/friends/unfriend/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ user_id: userId }),
        });
        if (res.ok) setFriendStatus('none');
    };

    const handleAddFriend = async () => {
        try {
            const res = await fetch(`${API}/api/friends/request/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ to_user: userId }),
            });
            if (res.ok) setFriendStatus('sent');
        } catch (e) { console.error(e); }
    };

    const handleAccept = async () => {
        const res = await fetch(`${API}/api/friends/accept/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ user_id: userId }),
        });
        if (res.ok) setFriendStatus('friends');
    };

    const handleDecline = async () => {
        const res = await fetch(`${API}/api/friends/decline/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ user_id: userId }),
        });
        if (res.ok) setFriendStatus('none');
    };

    const handleFollow = async () => {
        try {
            const res = await fetch(`${API}/api/pages/${user.id}/follow/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            });
            if (res.ok) setIsFollowing(prev => !prev);
            else console.error('Follow failed:', await res.json());
        } catch (e) { console.error(e); }
    };

    const handleReminderPageFollow = async (pageId) => {
        const prev = pageFollowStatus[pageId];
        setPageFollowStatus(s => ({ ...s, [pageId]: !prev }));
        try {
            const res = await fetch(`${API}/api/pages/${pageId}/follow/`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) { const data = await res.json(); setPageFollowStatus(s => ({ ...s, [pageId]: data.is_followed })); }
            else setPageFollowStatus(s => ({ ...s, [pageId]: prev }));
        } catch { setPageFollowStatus(s => ({ ...s, [pageId]: prev })); }
    };

    const handleReminderPageNotify = async (pageId) => {
        const prev = pageNotifyStatus[pageId];
        setPageNotifyStatus(s => ({ ...s, [pageId]: !prev }));
        try {
            const res = await fetch(`${API}/api/pages/${pageId}/notify/`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) { const data = await res.json(); setPageNotifyStatus(s => ({ ...s, [pageId]: data.is_notified })); }
            else setPageNotifyStatus(s => ({ ...s, [pageId]: prev }));
        } catch { setPageNotifyStatus(s => ({ ...s, [pageId]: prev })); }
    };

    const handleReview = async (rating) => {
        setReviewRating(rating);
        try {
            await fetch(`${API}/api/pages/${userId}/review/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ score: rating }),
            });
        } catch (e) { console.error(e); }
    };

    const handleMessage = async () => {
        try {
            const chats = await (await fetch(`${API}/api/chats/`, { headers: { Authorization: `Bearer ${token}` } })).json();
            const existing = chats.find(c => !c.is_group && c.name === username);
            if (existing) { navigate(`/chats/${existing.id}`); return; }
            const res = await fetch(`${API}/api/conversations/create/${userId}/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ target_user: userId, type: 'user' }),
            });
            const data = await res.json();
            if (data.convention_id) navigate(`/chats/${data.convention_id}`);
        } catch (e) { console.error(e); }
    };

    const handlePinChange = (pinnedPostId) => {
        setPosts(prev => prev.map(p => ({ ...p, is_pinned: (p.id || p.post_id) === pinnedPostId })));
    };

    const setEditData = (field, value) => setEditEventData(prev => ({ ...prev, [field]: value }));

    const handleSaveEdit = async (eventId) => {
        try {
            const res = await fetch(`${API}/api/events/${eventId}/update/`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: editEventData.title,
                    description: editEventData.description,
                    start_date: toISO(editEventData.startDay, editEventData.startMonth, editEventData.startYear, editEventData.startHour, editEventData.startMinute, editEventData.startPeriod),
                    end_date: toISO(editEventData.endDay, editEventData.endMonth, editEventData.endYear, editEventData.endHour, editEventData.endMinute, editEventData.endPeriod),
                }),
            });
            if (res.ok) {
                const updated = await res.json();
                setOwnPageEvents(prev => prev.map(e => e.id === eventId ? { ...e, ...updated } : e));
                setEditingEventId(null);
            } else console.error('Update failed:', await res.json());
        } catch (e) { console.error(e); }
    };

    const handleDeleteEvent = async (event) => {
        try {
            const res = await fetch(`${API}/api/events/${event.id}/delete/`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) { setOwnPageEvents(prev => prev.filter(e => e.id !== event.id)); setDeleteEventPopup(null); }
            else console.error('Delete failed:', await res.json());
        } catch (e) { console.error(e); }
    };

    const openEditEvent = (event) => {
        const s = toSegments(event.start_date), en = toSegments(event.end_date);
        setEditingEventId(event.id);
        setEditEventData({
            title: event.title || '', description: event.description || '',
            startDay: s.d, startMonth: s.mo, startYear: s.y, startHour: s.h, startMinute: s.mi, startPeriod: s.p,
            endDay: en.d, endMonth: en.mo, endYear: en.y, endHour: en.h, endMinute: en.mi, endPeriod: en.p,
        });
    };



    // ─── render helpers ──────────────────────────────────────────────────────


    const renderManageEventsList = () => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const filtered = ownPageEvents.filter(e => {
            const d = new Date(e.start_date);
            const sameMonth = d.getFullYear() === manageEventsDate.getFullYear() && d.getMonth() === manageEventsDate.getMonth();
            const eventDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            return sameMonth && (activeEventTab === 'upcoming' ? eventDay >= today : eventDay < today);
        });

        if (filtered.length === 0) {
            return (
                <p className={styles.noEventsText}>
                    No {activeEventTab} events for {manageEventsDate.toLocaleString('default', { month: 'long' })} {manageEventsDate.getFullYear()}.
                </p>
            );
        }

        return filtered.map((event, index) => {
            const eventDay = new Date(new Date(event.start_date).getFullYear(), new Date(event.start_date).getMonth(), new Date(event.start_date).getDate());
            const isToday = eventDay.getTime() === today.getTime();
            const isEditingThis = editingEventId === event.id;
            const bannerSrc = event.image?.startsWith('http') ? event.image : `${API}${event.image}`;

            return (
                <div key={event.id || index} className={styles.manageEventItemBlock}>
                    <div className={styles.manageEventItem}>
                        <div className={styles.eventCardContainer}>
                            <div className={styles.eventCardBg} style={{ backgroundImage: `url(${bannerSrc})` }}>
                                <div className={styles.eventTimeBox}>
                                    Starts {fmtDate(event.start_date)} - {fmtTime(event.start_date)}<br />
                                    Ends - {fmtDate(event.end_date)} - {fmtTime(event.end_date)}
                                </div>
                                <div className={styles.eventDetailsBottom}>
                                    <div className={styles.eventTextContent}>
                                        <div className={styles.eventTitle}>{event.title}</div>
                                        <div className={styles.eventDescWrapper}>
                                            <span className={styles.eventDesc}>{event.description}</span>
                                            {event.description?.length > 80 && <span className={styles.readMoreText}>read more</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {isEditingThis && (
                            <div className={styles.manageEditForm}>
                                <input className={styles.manageEditInput} placeholder="Event title"
                                    value={editEventData.title} onChange={e => setEditData('title', e.target.value)} />
                                <textarea className={styles.manageEditTextarea} placeholder="Description"
                                    value={editEventData.description} onChange={e => setEditData('description', e.target.value)} />
                                <span className={styles.manageEditSectionLabel}>Start time</span>
                                <DateTimeSegments prefix="start" data={editEventData} onChange={setEditData} />
                                <span className={styles.manageEditSectionLabel}>End time</span>
                                <DateTimeSegments prefix="end" data={editEventData} onChange={setEditData} />
                                <div className={styles.manageEditActions}>
                                    <button className={styles.manageEditCancelBtn} onClick={() => setEditingEventId(null)}>Cancel</button>
                                    <button className={styles.manageEditSaveBtn} onClick={() => handleSaveEdit(event.id)}>Save</button>
                                </div>
                            </div>
                        )}

                        <div className={styles.manageActionsRow} style={activeEventTab === 'history' ? { justifyContent: 'center' } : {}}>
                            <button className={styles.manageActionBtnDelete} onClick={() => setDeleteEventPopup(event)}>
                                <img src={Bin} alt="delete" className={`${styles.manageActionIcon} ${styles.iconRed}`} />
                                Delete
                            </button>
                            {activeEventTab === 'upcoming' && (
                                <>
                                    <div className={styles.manageVerticalLine} />
                                    <button
                                        className={styles.manageActionBtnUpdate}
                                        disabled={isToday}
                                        style={isToday ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                                        onClick={() => !isToday && openEditEvent(event)}
                                    >
                                        <img src={Edit} alt="update" className={`${styles.manageActionIcon} ${styles.iconWhite}`} />
                                        {isToday ? "Today's event" : 'Update'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    {index !== filtered.length - 1 && <div className={styles.eventItemDivider} />}
                </div>
            );
        });
    };

    // ─── render ──────────────────────────────────────────────────────────────

    return (
        <div className={styles.darkContainer}>

            {/* Mobile header */}
            {isMobile && (
                <MobileHeader
                    avatarSrc={currentAvatarSrc}
                    user={currentUser}
                    setMobileMenuOpen={setMobileMenuOpen}
                    token={token}
                    API={API}
                    homeMode
                />
            )}

            {/* Mobile drawer */}
            {isMobile && mobileMenuOpen && (
                <div className={styles.mobileDrawerOverlay}>
                    <div className={styles.mobileDrawerBackdrop} onClick={() => setMobileMenuOpen(false)} />
                    <div ref={mobileMenuRef} className={styles.mobileDrawer} onClick={e => e.stopPropagation()}>
                        <button className={styles.mobileDrawerCloseBtn} onClick={() => setMobileMenuOpen(false)}>
                            <X size={16} color="white" />
                        </button>
                        <div className={styles.mobileDrawerHeader}>
                            <span className={styles.mobileDrawerTitle}>CAMPUS</span>
                        </div>
                        <div className={styles.mobileDrawerNav}>
                            <SideBarNav variant={isOwnProfile ? 'profile' : 'default'} currentUser={currentUser} onClose={() => setMobileMenuOpen(false)} />
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop header */}
            {!isMobile && (
                <div className={`${styles.header} ${styles.page}`}>
                    <Header theme={theme} toggleTheme={toggleTheme} user={currentUser} />
                </div>
            )}

            {/* Desktop layout */}
            {!isMobile && (
                <div className={`${styles.page} ${styles.content}`}>
                    <SideBarNav variant={isOwnProfile ? 'profile' : 'default'} currentUser={currentUser} />

                    <div className={styles.profileContent}>
                        {showCreateEvent ? (
                            <div className={styles.profileCard}>
                                <CreateEventForm {...createEvent.formProps} onBack={() => setShowCreateEvent(false)} />
                            </div>

                        ) : isEditing ? (
                            <ProfileEditCard styles={styles} edit={edit} setIsEditing={setIsEditing} user={user} API={API} token={token} theme={theme} />
                        ) : isBlocked ? (
                            <div className={styles.profileCard}>
                                <div className={styles.coverWrap}>
                                    <div className={`${styles.coverPlaceholder} ${styles.blockedCoverPlaceholder}`} />
                                </div>
                                <div className={styles.profileHeaderRow}>
                                    <div className={styles.avatarWrap}>
                                        <div className={styles.avatarCircle}>
                                            <img className={styles.avatarImage} src={avatarUrl || ProfilePicture} alt="avatar"
                                                onError={e => { e.currentTarget.src = ProfilePicture; }} />
                                        </div>
                                    </div>
                                    <div className={styles.profileMeta}>
                                        <div className={styles.nameRow}>
                                            <h2 className={styles.username} style={{ opacity: 0.5 }}>{username}</h2>
                                        </div>
                                        <div className={styles.blockedSubtitle} style={{ marginTop: 8, textAlign: 'left' }}>
                                            You've blocked this user. Their content is hidden.
                                        </div>
                                    </div>
                                    <div className={styles.profileActions}>
                                        <button onClick={handleBlock} className={styles.unblockBtn}>Unblock</button>
                                    </div>
                                </div>
                                <div className={styles.hr} />
                                <div className={styles.blockedBody}>
                                    <Ban size={48} className={styles.blockedIcon} />
                                    <p className={styles.blockedTitle}>This profile is blocked</p>
                                    <p className={styles.blockedSubtitle}>Unblock to see their posts, photos, and other content.</p>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.profileCard}>
                                {/* Cover */}
                                <div className={styles.coverWrap}>
                                    {coverUrl ? <img className={styles.coverImage} src={coverUrl} alt="cover" /> : <div className={styles.coverPlaceholder} />}
                                    {!isOwnProfile && (
                                        <div ref={menuRef} className={styles.coverMenuWrap}>
                                            <button onClick={() => setMenuOpen(p => !p)} className={`${styles.messageBtn} ${styles.coverMenuBtn}`}>
                                                <MoreHorizontal size={18} />
                                            </button>
                                            {menuOpen && (
                                                <div className={styles.coverDropdown}>
                                                    <button onClick={() => { handleBlock(); setMenuOpen(false); }}
                                                        className={`${styles.coverDropdownItem} ${isBlocked ? styles.coverDropdownItemDanger : styles.coverDropdownItemNormal}`}>
                                                        <Ban size={15} />{isBlocked ? 'Unblock user' : 'Block user'}
                                                    </button>
                                                    <button onClick={() => { setReportTargetId(Number(userId)); setMenuOpen(false); }}
                                                        className={`${styles.coverDropdownItem} ${styles.coverDropdownItemDanger}`}>
                                                        <AlertCircle size={15} />Report user
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Profile header row */}
                                <div className={styles.profileHeaderRow}>
                                    <div className={styles.avatarWrap}>
                                        <div className={styles.avatarCircle}>
                                            <img className={styles.avatarImage} src={avatarUrl || ProfilePicture} alt="avatar"
                                                onError={e => { e.currentTarget.src = ProfilePicture; }} />
                                        </div>
                                    </div>

                                    <div className={styles.profileMeta}>
                                        {user?.type === 'page' ? (
                                            <>
                                                <div className={`${styles.nameRow} ${styles.pageNameRow}`}>
                                                    <h2 className={styles.username} style={{ fontSize: "19px" }}>{username}</h2>
                                                    <img src={VerifiedBadge} alt="verified" className={`${styles.pageVerifiedBadge} ${styles.verifiedIconBlue}`} />
                                                </div>
                                                <div className={`${styles.subRow} ${styles.pageFollowersMeta}`}>
                                                    {user?.category && <span className={styles.department}>{user.category}</span>}
                                                    {user?.category && <span className={styles.dot} />}
                                                    <span className={styles.friendsCount}>{followersCount.toLocaleString()} followers</span>
                                                </div>
                                                {bio && <p className={styles.bio}>{bio}</p>}
                                            </>
                                        ) : user?.role === 'instructor' && isOwnProfile ? (
                                            <>
                                                <div className={styles.nameRow}>
                                                    <div className={styles.userInfo}>
                                                        <h2 className={styles.username} style={{ color: "#E043B5" }}>{username}</h2>
                                                    </div>
                                                    <button className={styles.editProfileBtn} onClick={() => setIsEditing(true)}>
                                                        <span className={styles.editText}>Edit</span>
                                                        <div style={maskStyle(Edit, 20, isLight ? '#662D91' : '#999999')} />
                                                    </button>
                                                </div>
                                                <div className={styles.subRow} style={{ gap: 10 }}>
                                                    <span className={styles.fullName}>{fullName}</span>
                                                    <span className={styles.dot} />
                                                    <span className={styles.uni}>{user?.university}</span>
                                                </div>
                                                {user?.bio && <p className={styles.bio}>{user.bio}</p>}
                                            </>
                                        ) : user?.role === 'instructor' && !isOwnProfile ? (
                                            <>
                                                <div className={styles.nameRow}>
                                                    <div className={styles.userInfo}>
                                                        <h2 className={styles.username} style={{ color: "#E043B5" }}>{username}</h2>
                                                        <span className={styles.role}>/{role}</span>
                                                    </div>
                                                </div>
                                                <div className={styles.subRow} style={{ gap: 10, marginTop: 5 }}>
                                                    {user?.department && <span className={styles.department}>{user.department}</span>}
                                                    {user?.department && user?.instructor_type && <span className={styles.dot} />}
                                                    {user?.instructor_type && <span className={styles.employmentType}>{user.instructor_type}</span>}
                                                    <span className={styles.dot} />
                                                    <span className={styles.friendsCount}>{user?.friends_count || 0} friends</span>
                                                </div>
                                                {bio && <p className={styles.bio}>{bio}</p>}
                                            </>
                                        ) : isOwnProfile ? (
                                            <>
                                                <div className={styles.info}>
                                                    <div className={styles.nameRow}>
                                                        <div className={styles.userInfo}>
                                                            <h2 className={styles.username}>{username}</h2>
                                                            <span className={styles.role}>/{user?.role}</span>
                                                        </div>
                                                        <button className={styles.editProfileBtn} onClick={() => setIsEditing(true)}>
                                                            <span className={styles.editText}>Edit</span>
                                                            <div style={maskStyle(Edit, 20, isLight ? '#662D91' : '#999999')} />
                                                        </button>
                                                    </div>
                                                    <div className={styles.subRow}>
                                                        <span className={styles.fullName}>{fullName}</span>
                                                        <div className={styles.uniInfo}>
                                                            <span className={styles.uni}>{university} - {major}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {user?.bio && <p className={styles.bio}>{user.bio}</p>}
                                            </>
                                        ) : (
                                            <>
                                                <div className={styles.info}>
                                                    <div className={styles.nameRow}>
                                                        <div className={styles.userInfo}>
                                                            <h2 className={styles.username}>{username}</h2>
                                                            <span className={styles.role}>/{role}</span>
                                                        </div>
                                                    </div>
                                                    <div className={styles.subRow} style={{ gap: '8px' }}>
                                                        <span className={styles.fullName}>{fullName}</span>
                                                        <span className={styles.dot} />
                                                        <span className={styles.friendsCount}>{user?.friends_count || 0} friends</span>
                                                    </div>
                                                    <div className={styles.uniRow}>
                                                        <span className={styles.uni}>{university} - {major}</span>
                                                    </div>
                                                </div>
                                                {user?.bio && <p className={styles.bio}>{user.bio}</p>}
                                            </>
                                        )}
                                    </div>

                                    {!isOwnProfile && (
                                        <div className={styles.profileActions}>
                                            {user?.type === 'page' ? (
                                                <>
                                                    <button className={styles.messageBtn} onClick={handleMessage}>
                                                        <img src={MessagesIcon} width={18} height={18} className={styles.iconMsg} />

                                                    </button>
                                                    <button className={styles.messageBtn} onClick={handleEventsTabNotify}>
                                                        <img src={eventsTabNotify ? BellOn : BellOff} width={18} height={18} className={styles.iconBell} />

                                                    </button>
                                                    <button className={isFollowing ? styles.friendsBtn : styles.addFriendBtn} onClick={handleFollow}>
                                                        {isFollowing ? 'Followed' : 'Follow'}
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button className={styles.messageBtn} onClick={handleMessage}><img src={MessagesIcon} alt="message" width={18} height={18} style={{ filter: 'brightness(0) invert(1)' }} /></button>
                                                    {friendStatus === 'none' && (
                                                        <button className={styles.addFriendBtn} onClick={handleAddFriend}>
                                                            <UserPlus size={18} /><span>Add friend</span>
                                                        </button>
                                                    )}
                                                    {friendStatus === 'sent' && <button className={styles.pendingBtn}>⏳ Request Sent</button>}
                                                    {friendStatus === 'received' && (
                                                        <div className={styles.friendRequestBtns}>
                                                            <button onClick={handleAccept} className={styles.acceptRequestBtn}><Check size={15} />Accept</button>
                                                            <button onClick={handleDecline} className={styles.declineRequestBtn}><X size={15} />Reject</button>
                                                        </div>
                                                    )}
                                                    {friendStatus === 'friends' && (
                                                        <button className={styles.friendsBtn} onClick={() => setUnfriendPopup(true)}>Friends</button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                    {isOwnProfile && user?.type === 'page' && (
                                        <div className={styles.profileActions}>
                                            <button className={styles.editProfileBtn} onClick={() => setIsEditing(true)}>
                                                <span className={styles.editText}>Edit</span>
                                                <div style={maskStyle(Edit)} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className={styles.hr} />

                                {/* Tabs */}
                                <div className={styles.tabs}>
                                    {(user?.type === 'page'
                                        ? (isOwnProfile ? ['Posts', 'Activities', 'About'] : ['Posts', 'Photos', 'Events'])
                                        : isOwnProfile ? ['Posts', 'Activities', 'About']
                                            : ['Posts', 'Photos', 'Friends']
                                    ).map(tab => (
                                        tab === 'Activities' && isOwnProfile ? (
                                            <div key="Activities" ref={activitiesDropdownRef} className={styles.activitiesDropdownWrap}>
                                                <button
                                                    className={`${styles.tabBtn} ${activeTab === 'Activities' ? styles.tabActive : ''}`}
                                                    onClick={() => { setActiveTab('Activities'); loadActivities(); setActivitiesDropdownOpen(p => !p); }}
                                                >
                                                    Activities
                                                </button>
                                                {activitiesDropdownOpen && activeTab === 'Activities' && (
                                                    <div className={styles.activitiesDropdown}>
                                                        {[
                                                            { key: 'saves', icon: Save, label: 'Saves' },
                                                            { key: 'comments', icon: Comment, label: 'Comments' },
                                                            { key: 'likes', icon: Like, label: 'Likes' },
                                                        ].map(({ key, icon, label }) => (
                                                            <button key={key}
                                                                onClick={() => { setActivitiesFilter(key); setActivitiesDropdownOpen(false); if (key === 'saves') loadSavedPosts(); }}
                                                                className={styles.activitiesDropdownItem}
                                                                className={`${styles.activitiesDropdownItem} ${activitiesFilter === key ? styles.activitiesItemActive : ''}`}
                                                            >
                                                                <img src={icon} alt={label} className={activitiesFilter === key ? styles.activityIconActive : styles.activityIcon} style={{ width: 18, height: 18 }} />
                                                                {label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <button key={tab}
                                                className={`${styles.tabBtn} ${activeTab === tab ? styles.tabActive : ''}`}
                                                onClick={() => { setActiveTab(tab); if (tab === 'Events') loadPageEvents(); if (tab === 'Activities') loadActivities(); }}
                                            >
                                                {tab}
                                            </button>
                                        )
                                    ))}
                                </div>

                                {/* Tab content */}
                                {activeTab === 'Posts' && (
                                    <div className={styles.postsSection}>
                                        {postsLoading ? <div className={styles.notice}>Loading...</div> : posts.map(post => (
                                            <PostCard key={post.id} post={post} openComments={setSelectedPost}
                                                isOwnProfile={isOwnProfile} hasPinnedPost={posts.some(p => p.is_pinned)} onPinChange={handlePinChange} />
                                        ))}
                                    </div>
                                )}
                                {activeTab === 'Photos' && (
                                    <div className={styles.photosGrid}>
                                        {photoPosts.length > 0 ? photoPosts.map((post, idx) => (
                                            <img key={post.id} className={`${styles.photoItem} ${idx === 0 ? styles.photoLarge : ''}`}
                                                src={post.image || post.image_url || post.media?.[0]?.url} alt=""
                                                onClick={() => setSelectedPost(post)} />
                                        )) : <div className={styles.notice}>No photos found.</div>}
                                    </div>
                                )}
                                {activeTab === 'Friends' && <div className={styles.friendsTabContent}><FriendsTab friends={friends} /></div>}
                                {activeTab === 'Activities' && (
                                    <div className={styles.postsSection}>
                                        {activitiesLoading ? <div className={styles.notice}>Loading activities...</div> : (() => {
                                            const postsToShow = activitiesFilter === 'saves' ? savedPosts : filteredActivityPosts;
                                            return postsToShow.length > 0
                                                ? postsToShow.map(post => (
                                                    <PostCard key={post.id} post={post} openComments={setSelectedPost}
                                                        isOwnProfile={currentUser?.id === (post.author?.id || post.author_id)} />
                                                ))
                                                : <div className={styles.notice}>No {activitiesFilter === 'saves' ? 'saved' : activitiesFilter === 'likes' ? 'liked' : 'commented'} posts yet.</div>;
                                        })()}
                                    </div>
                                )}
                                {activeTab === 'About' && (
                                    <div className={styles.postsSection}><UserDetails user={user} hidePill darker noBorder /></div>
                                )}
                                {activeTab === 'Events' && (
                                    <div className={styles.postsSection}>
                                        {pageEvents.length > 0 ? pageEvents.map(event => {
                                            const bannerSrc = event.image
                                                ? (event.image.startsWith('http') ? event.image : `${API}${event.image}`)
                                                : '';
                                            const avatarSrc = event.avatar
                                                ? (event.avatar.startsWith('http') ? event.avatar : `${API}${event.avatar}`)
                                                : '/default-avatar.png';
                                            return (
                                                <div key={event.id} style={{ background: '#262626', borderRadius: 40, padding: 24, width: "90%", border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', margin: "0 auto 30px auto" }}>
                                                    {/* Card header */}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, padding: '0 10px' }}>
                                                        <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
                                                            <img src={avatarSrc} alt="Logo" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
                                                            <div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#ffffff', fontWeight: 600 }}>
                                                                        {event.organization_name || user?.username}
                                                                    </h3>
                                                                    {user?.is_verified && (
                                                                        <img src={VerifiedBadge} alt="verified" className={styles.verifiedIconBlue} style={{ width: 18, height: 18, marginLeft: 3 }} />
                                                                    )}
                                                                </div>
                                                                <p style={{ margin: '2px 0 0 0', color: '#999', fontSize: '0.85rem' }}>
                                                                    {event.page_type || user?.category}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {!isOwnProfile && (
                                                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                                                {isFollowing && (
                                                                    <button
                                                                        onClick={handleEventsTabNotify}
                                                                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', width: 44, height: 44, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                    >
                                                                        <img
                                                                            src={eventsTabNotify ? BellOn : BellOff}
                                                                            alt="notifications"
                                                                            width={20} height={eventsTabNotify ? 24 : 20}
                                                                            style={{ filter: 'brightness(0) saturate(100%) invert(85%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(85%)' }}
                                                                        />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={handleFollow}
                                                                    style={isFollowing
                                                                        ? { background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', borderRadius: 20, padding: '8px 20px', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }
                                                                        : { background: 'linear-gradient(135deg, #5B2598, #962892)', color: 'white', border: 'none', borderRadius: 20, padding: '8px 20px', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }
                                                                    }
                                                                >
                                                                    {isFollowing ? 'Followed' : 'Follow'}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Banner */}
                                                    {bannerSrc && (
                                                        <div style={{ position: 'relative', width: '100%', borderRadius: 30, overflow: 'hidden' }}>
                                                            <img src={bannerSrc} alt="Event Banner" style={{ width: '100%', minHeight: 200, objectFit: 'cover', display: 'block' }} />

                                                            {/* Date + reminder widget */}
                                                            <div style={{ position: 'absolute', top: 30, right: 30, background: 'rgba(30,30,30,0.85)', backdropFilter: 'blur(10px)', padding: '15px 25px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 20, zIndex: 3, border: '1px solid rgba(255,255,255,0.1)' }}>
                                                                <div>
                                                                    <p style={{ margin: 0, color: '#fff', fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.6 }}>Starts {fmtDate(event.start_date)}</p>
                                                                    <p style={{ margin: 0, color: '#fff', fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.6 }}>Ends — {fmtDate(event.end_date)}</p>
                                                                </div>
                                                                {!isOwnProfile && (
                                                                    <button
                                                                        onClick={() => handleEventsTabReminder(event.id)}
                                                                        style={{ background: eventsTabReminders[event.id] ? 'rgba(255,255,255,0.2)' : '#7b1fa2', color: 'white', border: 'none', padding: '8px 18px', borderRadius: 12, fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}
                                                                    >
                                                                        {eventsTabReminders[event.id] ? '✓ Reminder set' : 'Set reminder'}
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {/* Title + description overlay */}
                                                            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 16, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.75))', pointerEvents: 'none' }}>
                                                                <div style={{ pointerEvents: 'auto' }}>
                                                                    {event.title?.length > 20 ? (
                                                                        <div style={{ overflow: 'hidden', position: 'relative', maxWidth: '100%' }}>
                                                                            <span className={styles.titleMarquee}>{event.title}</span>
                                                                        </div>
                                                                    ) : (
                                                                        <h2 style={{ color: 'white', margin: 0, fontSize: '2.2rem', fontWeight: 800 }}>{event.title}</h2>
                                                                    )}
                                                                    <p style={{ color: 'rgba(255,255,255,0.9)', maxWidth: 500, fontSize: '1rem', marginTop: 10, lineHeight: 1.4 }}>
                                                                        {event.description?.length > 80
                                                                            ? <>{event.description.substring(0, 80)}... <span onClick={() => setEventsTabPopup(event)} style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'underline', fontSize: '0.9rem', cursor: 'pointer' }}>read more</span></>
                                                                            : event.description
                                                                        }
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }) : <div className={styles.notice}>No events yet.</div>}
                                    </div>
                                )}
                            </div>
                        )}
                        {userLoading && <div className={styles.notice}>Loading profile...</div>}
                    </div>

                    {/* Right sidebar */}
                    <div className={styles.rightSection}>
                        {showCreateEvent ? (
                            <CreateEventRightSidebar {...createEvent.sidebarProps} />
                        ) : isOwnProfile && isPageUser ? (
                            <>
                                <div className={styles.yourEventsWidgetWrap}>
                                    <div className={styles.yourEventsPill}><p>YOUR EVENTS</p></div>
                                    <div className={styles.yourEventsWrapper}>
                                        <div className={styles.yourEventsHeader}>
                                            <div className={styles.eventsIconColored} />
                                            <span className={styles.yourEventsTitle}>
                                                Upcoming Events of <span className={styles.uppercaseText}>YOURS</span>
                                            </span>
                                        </div>
                                        <div className={styles.eventsDivider} />
                                        <div className={styles.eventCardContainer}>
                                            {ownPageEvents.length > 0 ? (() => {
                                                const next = ownPageEvents[0];
                                                return (
                                                    <div className={styles.eventCardBg} style={{ backgroundImage: `url(${resolveUrl(next.image)})` }}>
                                                        <div className={styles.eventTimeBox}>
                                                            Starts {fmtDate(next.start_date)} - {fmtTime(next.start_date)}<br />
                                                            Ends - {fmtDate(next.end_date)} - {fmtTime(next.end_date)}
                                                        </div>
                                                        <div className={styles.eventDetailsBottom}>
                                                            <div className={styles.eventTextContent}>
                                                                <div className={styles.eventTitle}>{next.title}</div>
                                                                <div className={styles.eventDescWrapper}>
                                                                    <span className={styles.eventDesc}>{next.description}</span>
                                                                    {next.description?.length > 80 && <span className={styles.readMoreText}>read more</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })() : (
                                                <div style={{ color: 'rgba(255,255,255,0.4)', padding: '20px', textAlign: 'center', fontSize: '0.85rem' }}>
                                                    No upcoming events yet.
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.eventsDivider} />
                                        <div className={styles.eventsActionRow}>
                                            <button className={styles.manageEventsBtn} onClick={() => setShowManageEvents(true)}>Manage Events</button>
                                            <button className={styles.createEventBtn} onClick={() => setShowCreateEvent(true)}>Create</button>
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.promotionsContainer}>
                                    <div className={styles.promoHeaderRow}>
                                        <div className={styles.promoIconColored} />
                                        <span className={styles.promoTitle}>Promotions</span>
                                    </div>
                                    <div className={styles.promoContentRow}>
                                        <p className={styles.promoDesc}>Track, manage, and review your active promotions and history.</p>
                                        <button className={styles.promoManageBtn} onClick={() => { loadPromotions(); setShowPromotionsModal(true); }}>Manage</button>
                                    </div>
                                </div>
                            </>
                        ) : isOwnProfile && user?.role === 'instructor' ? (
                            <>
                                <FriendsSuggestion />
                                <div className={styles.remindersWidgetInstructor}>
                                    <div className={styles.remindersWidgetHeader}>
                                        <img src={Events} alt="events" className={styles.remindersWidgetIcon} />
                                        <span className={styles.remindersWidgetTitle}>Reminders set</span>
                                        <span onClick={() => setShowRemindersMonthPicker(p => !p)} className={styles.remindersMonthToggle}>
                                            {remindersMonth.toLocaleString('default', { month: 'long' })} {remindersMonth.getFullYear()}
                                        </span>
                                    </div>
                                    <div className={styles.remindersDivider} />
                                    {(() => {
                                        const upcoming = reminders
                                            .map(e => ({ ...e, _d: new Date(e.start_date || e.date || e.event_date) }))
                                            .filter(e => e._d >= new Date())
                                            .sort((a, b) => a._d - b._d);
                                        const next = upcoming[0];
                                        const daysLeft = next ? Math.ceil((next._d - new Date()) / 86400000) : null;
                                        return (
                                            <div className={styles.remindersNextRow}>
                                                <div className={styles.remindersNextLeft}>
                                                    <span className={styles.remindersNextLabel}>
                                                        {daysLeft !== null ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left` : 'No upcoming events'}
                                                    </span>
                                                    {next && (
                                                        <span className={styles.remindersNextTitle}>
                                                            Upcoming event on {next._d.getDate()}{['st', 'nd', 'rd'][((next._d.getDate() + 90) % 100 - 10) % 10 - 1] || 'th'}
                                                        </span>
                                                    )}
                                                </div>
                                                {next && (
                                                    <div className={styles.remindersNextRight}>
                                                        <div className={styles.remindersAvatarStack}>
                                                            {upcoming.slice(0, 3).map((event, i) => {
                                                                const avatar = event.page?.avatar || event.host?.avatar;
                                                                return avatar ? (
                                                                    <img key={event.id} src={resolveUrl(avatar)} alt=""
                                                                        className={`${styles.remindersStackAvatar} ${styles[`avatarStackIndex${i}`]}`} />
                                                                ) : (
                                                                    <div key={event.id || i} className={`${styles.remindersStackPlaceholder} ${styles[`avatarStackIndex${i}`]}`}>
                                                                        <User size={18} className={styles.placeholderUserIcon} />
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                        <img src={ArrowRight} alt="" onClick={() => navigate('/events', { state: { highlightId: next.id } })} className={styles.remindersArrow} />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                                <div className={styles.picksWidgetWrap}>
                                    <div className={styles.picksWidgetHeader}>
                                        <img src={Community} alt="" className={styles.picksWidgetIcon} />
                                        <span className={styles.picksWidgetTitle}>Your Picks</span>
                                        <div className={styles.picksWidgetMeta}>
                                            <span className={styles.picksWidgetCount}>{communityPicks.length}/3</span>
                                            <button className={styles.picksManageBtn} onClick={async () => {
                                                setShowPicksModal(true);
                                                setPicksLoading(true);
                                                try {
                                                    const [communitiesRes, picksRes] = await Promise.all([
                                                        fetch(`${API}/api/communities/?filter=joined`, { headers: { Authorization: `Bearer ${token}` } }),
                                                        fetch(`${API}/api/users/${currentUser.id}/community-picks/`, { headers: { Authorization: `Bearer ${token}` } }),
                                                    ]);
                                                    if (communitiesRes.ok) {
                                                        const data = await communitiesRes.json();
                                                        setJoinedCommunities(data.map(c => ({ ...c, bgImage: c.image })));
                                                    }
                                                    if (picksRes.ok) {
                                                        const picks = await picksRes.json();
                                                        setModalPicks(Array.isArray(picks) ? picks.map(p => ({ ...p, id: p.id ?? p.community_id })) : []);
                                                    }
                                                } catch (e) { console.error(e); }
                                                finally { setPicksLoading(false); }
                                            }}>Manage</button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : isOwnProfile ? (
                            <>
                                <FriendsSuggestion />
                                {(() => {
                                    const year = remindersMonth.getFullYear();
                                    const month = remindersMonth.getMonth();
                                    const monthName = remindersMonth.toLocaleString('default', { month: 'long' });
                                    const firstDay = new Date(year, month, 1).getDay();
                                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                                    const eventDays = new Set(reminders.map(e => {
                                        const d = new Date(e.start_date || e.date || e.event_date);
                                        return (d.getFullYear() === year && d.getMonth() === month) ? d.getDate() : null;
                                    }).filter(Boolean));
                                    const cells = [
                                        ...Array(firstDay).fill(null),
                                        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
                                    ];
                                    return (
                                        <div className={styles.calendarWidget}>
                                            <div className={styles.calendarWidgetHeader}>
                                                <img src={Events} alt="events" className={styles.calendarWidgetIcon} />
                                                <span className={styles.calendarWidgetTitle}>Reminders set</span>
                                                <span onClick={() => setShowRemindersMonthPicker(p => !p)} className={styles.remindersMonthToggle}>
                                                    {monthName} {year}
                                                </span>
                                            </div>
                                            {showRemindersMonthPicker && (
                                                <div className={styles.monthPickerDropdown}>
                                                    <div className={styles.monthPickerNav}>
                                                        <button onClick={() => setRemindersMonth(new Date(year - 1, month, 1))} disabled={year <= 2026} className={styles.monthPickerNavBtn}>‹</button>
                                                        <span className={styles.monthPickerYear}>{year}</span>
                                                        <button onClick={() => setRemindersMonth(new Date(year + 1, month, 1))} disabled={year >= new Date().getFullYear() + 2} className={styles.monthPickerNavBtn}>›</button>
                                                    </div>
                                                    <div className={styles.monthGrid}>
                                                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                                                            <button key={m} onClick={() => { setRemindersMonth(new Date(year, i, 1)); setShowRemindersMonthPicker(false); }}
                                                                className={`${styles.monthBtn} ${i === month ? styles.monthBtnActive : styles.monthBtnInactive}`}>{m}</button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            <div className={styles.calendarGrid}>
                                                {cells.map((day, i) => {
                                                    const hasEvent = day && eventDays.has(day);
                                                    return (
                                                        <div key={i} onClick={() => {
                                                            if (!hasEvent) return;
                                                            setRemindersPopup({ day, monthName, events: reminders.filter(e => { const d = new Date(e.start_date || e.date || e.event_date); return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day; }) });
                                                        }} className={`${styles.calendarDay} ${!day ? styles.calendarDayEmpty : hasEvent ? styles.calendarDayEvent : styles.calendarDayNormal}`}>
                                                            {day || ''}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </>
                        ) : (
                            <>
                                <UserDetails user={user} />
                                {user?.type === 'page' && !isOwnProfile && (
                                    <div className={styles.reviewWidget}>
                                        <div className={styles.reviewWidgetHeader}>
                                            <div style={maskStyle(Star, 35, '#A6279C')} />
                                            <span className={styles.reviewWidgetTitle}>Add a Review</span>
                                        </div>
                                        <div className={styles.reviewStarsRow}>
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button key={star} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} onClick={() => handleReview(star)} className={styles.reviewStarBtn}>
                                                    <div style={maskStyle(Star, 36.8, star <= (hoverRating || reviewRating) ? '#B8B8B8' : '#575757')} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {communityPicks.length > 0 && (
                                    <>
                                        <div className={styles.picksCard}>
                                            <div className={styles.picksHeader}>
                                                <div style={maskStyle(Community, 40, '#A6279C')} />
                                                <span className={styles.picksTitle}>{user?.username?.split(' ')[0]}'s Picks</span>
                                            </div>
                                            <div className={styles.picksSlideWrapper}>
                                                {communityPicks[picksSlide] && (() => {
                                                    const pick = communityPicks[picksSlide];
                                                    return (
                                                        <div className={styles.pickItemCard}>
                                                            <img src={pick.image} alt={pick.name} className={styles.pickItemImageBg} style={{ height: '100%', width: '100%', objectFit: 'cover' }} />
                                                            <div className={styles.pickOverlay}>
                                                                <div className={styles.pickContentTop}>
                                                                    <div className={styles.pickTitleGroup}>
                                                                        <h2 className={styles.pickName}>{pick.name}</h2>
                                                                        {pick.is_verified && <img src={VerifiedBadge} alt="Verified" width={18} height={18} className={styles.verifiedBadgeIcon} />}
                                                                    </div>
                                                                    <button className={styles.pickViewBtn} onClick={() => navigate(`/communities/${pick.id}`)}>view</button>
                                                                </div>
                                                                <div className={styles.pickContentBottom}>
                                                                    <p className={styles.pickDescription}>{pick.description}</p>
                                                                    {pick.description?.length > 80 && <button className={styles.readMore} onClick={() => setPicksPopup(pick)}>read more</button>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                        <div className={styles.paginationRow}>
                                            <button className={styles.navArrow} onClick={() => setPicksSlide(p => Math.max(0, p - 1))} disabled={picksSlide === 0}>
                                                <img src={ArrowLeft} alt="prev" style={{ width: 18, height: 18, opacity: picksSlide === 0 ? 0.3 : 1, filter: 'invert(1)' }} />
                                            </button>
                                            <div className={styles.picksDots}>
                                                {communityPicks.map((_, i) => (
                                                    <button key={i} className={`${styles.picksDot} ${i === picksSlide ? styles.picksDotActive : ''}`} onClick={() => setPicksSlide(i)} />
                                                ))}
                                            </div>
                                            <button className={styles.navArrow} onClick={() => setPicksSlide(p => Math.min(communityPicks.length - 1, p + 1))} disabled={picksSlide === communityPicks.length - 1}>
                                                <img src={ArrowRight} alt="next" style={{ width: 18, height: 18, opacity: picksSlide === communityPicks.length - 1 ? 0.3 : 1, filter: 'invert(1)' }} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Mobile layout */}
            {isMobile && (
                <div className={styles.mobileWrapper}>
                    <div className={styles.mobileGradientWrap}>
                        {isEditing ? (
                            <MobileEditView styles={styles} edit={edit} setIsEditing={setIsEditing} />
                        ) : (
                            <MobileProfileView
                                styles={styles} user={user} currentUser={currentUser}
                                isOwnProfile={isOwnProfile} friendStatus={friendStatus}
                                posts={posts} photoPosts={photoPosts} friends={friends}
                                activityPosts={activityPosts} savedPosts={savedPosts}
                                communityPicks={communityPicks} activeTab={activeTab} setActiveTab={setActiveTab}
                                picksSlide={picksSlide} setPicksSlide={setPicksSlide}
                                postsLoading={postsLoading} activitiesLoading={activitiesLoading} savedLoading={savedLoading}
                                openComments={setSelectedPost} handleMessage={handleMessage}
                                handleAddFriend={handleAddFriend} handleAccept={handleAccept} handleDecline={handleDecline}
                                onEditClick={() => edit.setIsEditing(true)} edit={edit}
                                activitiesFilter={activitiesFilter}
                                setActivitiesFilter={setActivitiesFilter}
                                filteredActivityPosts={filteredActivityPosts}
                                loadActivities={loadActivities}
                                loadSavedPosts={loadSavedPosts}
                                reminders={reminders}
                                remindersMonth={remindersMonth}
                                setRemindersMonth={setRemindersMonth}
                                setRemindersPopup={setRemindersPopup}
                                isFollowing={isFollowing}
                                handleFollow={handleFollow}
                                followersCount={followersCount}
                                eventsTabNotify={eventsTabNotify}
                                handleEventsTabNotify={handleEventsTabNotify}
                                pageEvents={pageEvents}
                                loadPageEvents={loadPageEvents}
                                eventsTabReminders={eventsTabReminders}
                                handleEventsTabReminder={handleEventsTabReminder}
                                handleReview={handleReview}
                                reviewRating={reviewRating}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Modals */}
            {selectedPost && <CommentModal post={selectedPost} onClose={() => setSelectedPost(null)} currentUser={currentUser} />}

            {picksPopup && createPortal(
                <div className={styles.picksPopupOverlay} onClick={() => setPicksPopup(null)}>
                    <div className={styles.picksPopupBox} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setPicksPopup(null)} className={styles.picksPopupCloseBtn}>✕</button>
                        <h3 className={styles.picksPopupTitle}>{picksPopup.name}</h3>
                        <p className={styles.picksPopupDesc}>{picksPopup.description}</p>
                    </div>
                </div>, document.body
            )}

            {remindersPopup && createPortal(
                <div className={styles.remindersPopupOverlay} onClick={() => { setRemindersPopup(null); setEventMenuOpen(null); }}>
                    <div className={`${styles.popupScrollContainer} ${styles.remindersPopupBox}`} onClick={e => e.stopPropagation()}>
                        <div className={styles.remindersPopupHeader}>
                            <img src={Events} alt="events" className={styles.remindersPopupHeaderIcon} />
                            <h3 className={styles.remindersPopupTitle}>
                                Events on {remindersPopup.monthName} {remindersPopup.day}{[1, 21, 31].includes(remindersPopup.day) ? 'st' : [2, 22].includes(remindersPopup.day) ? 'nd' : [3, 23].includes(remindersPopup.day) ? 'rd' : 'th'}
                            </h3>
                            <button onClick={() => setRemindersPopup(null)} className={styles.remindersPopupCancelBtn}>Cancel</button>
                        </div>
                        <div className={styles.remindersPopupDivider} />
                        <div className={styles.remindersEventList}>
                            {remindersPopup.events.map((event, index) => {
                                const pid = event.page?.page_id ?? event.page?.id;
                                return (
                                    <div key={event.id}>
                                        {index > 0 && <div className={styles.remindersEventSeparator} />}
                                        <div className={styles.remindersHostRow}>
                                            {event.page?.avatar || event.host?.avatar
                                                ? <img src={resolveUrl(event.page?.avatar || event.host?.avatar)} alt="" className={styles.remindersHostAvatar} />
                                                : <div className={styles.remindersHostAvatarPlaceholder}><User size={20} color="rgba(255,255,255,0.4)" /></div>
                                            }
                                            <div className={styles.remindersHostMeta}>
                                                <div className={styles.remindersHostNameRow}>
                                                    <span className={styles.remindersHostName}>{event.page?.name || event.host?.name || event.host?.username || 'Unknown Host'}</span>
                                                    {(event.page?.is_verified || event.host?.is_verified) && <img src={VerifiedBadge} alt="verified" className={styles.remindersHostVerified} />}
                                                </div>
                                                {(event.page?.description || event.host?.bio) && (
                                                    <span className={styles.remindersHostBio}>{event.page?.description || event.host?.bio}</span>
                                                )}
                                            </div>
                                            <button onClick={() => pid && handleReminderPageNotify(pid)} className={styles.remindersBellWrap}>
                                                <img src={pageNotifyStatus[pid] ? BellOn : BellOff} alt="notifications"
                                                    width={pageNotifyStatus[pid] ? 17 : 20} height={pageNotifyStatus[pid] ? 20 : 20}
                                                    style={{ filter: 'brightness(0) saturate(100%) invert(85%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(85%)' }} />
                                            </button>
                                            <button onClick={() => pid && handleReminderPageFollow(pid)}
                                                className={pageFollowStatus[pid] ? styles.remindersFollowedBtn : styles.remindersFollowBtn}>
                                                {pageFollowStatus[pid] ? 'Followed' : 'Follow'}
                                            </button>
                                        </div>
                                        <div className={styles.remindersEventCard}>
                                            {event.banner
                                                ? <img src={resolveUrl(event.banner)} alt="" className={styles.remindersEventBanner} />
                                                : <div className={styles.remindersEventBannerPlaceholder} />
                                            }
                                            <div className={styles.remindersEventGradient} />
                                            <div className={styles.eventCardMenuWrap}>
                                                <button onClick={e => { e.stopPropagation(); setEventMenuOpen(eventMenuOpen === event.id ? null : event.id); }} className={styles.eventCardMenuBtn}>
                                                    <MoreHorizontal size={30} strokeWidth={3} />
                                                </button>
                                                {eventMenuOpen === event.id && (
                                                    <div className={styles.eventCardDropdown} onClick={e => e.stopPropagation()}>
                                                        {[
                                                            { src: Share, label: 'Share event', danger: false },
                                                            { src: Bin, label: 'Delete event', danger: true },
                                                            { src: Info, label: 'Report event', danger: true },
                                                        ].map(({ src, label, danger }, i, arr) => (
                                                            <div key={label}>
                                                                <button className={styles.eventCardDropdownItem}>
                                                                    <img src={src} alt={label} width={14} height={14}
                                                                        className={`${styles.eventCardDropdownIcon} ${danger ? styles.eventCardDropdownIconDanger : styles.eventCardDropdownIconNormal}`} />
                                                                    <span style={{ color: danger ? '#e84d70' : '#CCCCCC' }}>{label}</span>
                                                                </button>
                                                                {i < arr.length - 1 && <div className={styles.eventCardDropdownDivider}><div className={styles.eventCardDropdownDividerLine} /></div>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className={styles.remindersEventContent}>
                                                <div className={styles.remindersEventLeft}>
                                                    {event.title?.length > 20 ? (
                                                        <div className={styles.titleMarqueeWrapper}>
                                                            <span className={styles.titleMarquee} style={{ fontSize: '1.05rem' }}>{event.title}</span>
                                                        </div>
                                                    ) : (
                                                        <span className={styles.remindersEventTitle}>{event.title}</span>
                                                    )}
                                                    {event.description && <p className={styles.remindersEventDesc}>{event.description}</p>}
                                                    {event.description?.length > 80 && <button className={styles.remindersEventReadMore}>read more</button>}
                                                </div>
                                                {(event.start_date || event.location) && (
                                                    <div className={styles.remindersInfoBox}>
                                                        <span className={styles.remindersInfoLabel}>Information</span>
                                                        {event.start_date && (
                                                            <div className={styles.remindersInfoRow}>
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6823A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                                                <span className={styles.remindersInfoText}>
                                                                    {new Date(event.start_date) <= new Date() ? 'Happening Now!' : `The event starts in ${Math.ceil((new Date(event.start_date) - new Date()) / 3600000)} hours`}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {event.location && (
                                                            <div className={styles.remindersInfoRow}>
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6823A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                                                <span className={styles.remindersInfoText}>{event.location}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>, document.body
            )}

            {unfriendPopup && createPortal(
                <div className={styles.unfriendOverlay} onClick={() => setUnfriendPopup(false)}>
                    <div className={styles.unfriendModal} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setUnfriendPopup(false)} className={styles.unfriendCloseBtn}><X size={15} /></button>
                        <div className={styles.unfriendUserRow}>
                            <img src={avatarUrl || ProfilePicture} alt="" className={styles.unfriendAvatar} />
                            <div>
                                <div className={styles.unfriendUsername}>{username}</div>
                                <div className={styles.unfriendFriendsCount}>{user?.friends_count || 0} friends</div>
                            </div>
                        </div>
                        <div className={styles.unfriendWarning}>
                            <p className={styles.unfriendWarningText}>
                                Are you sure you want to unfriend <strong className={styles.unfriendWarningName}>{username}</strong>? You'll have to send a new friend request if you change your mind.
                            </p>
                        </div>
                        <div className={styles.unfriendActions}>
                            <button onClick={() => setUnfriendPopup(false)} className={styles.unfriendCancelBtn}>Cancel</button>
                            <button onClick={async () => { await handleUnfriend(); setUnfriendPopup(false); }} className={styles.unfriendConfirmBtn}>Yes, Unfriend</button>
                        </div>
                    </div>
                </div>, document.body
            )}

            {showPicksModal && createPortal(
                <div className={styles.picksModalOverlay} onClick={() => setShowPicksModal(false)}>
                    <div className={styles.picksModalBox} onClick={e => e.stopPropagation()}>
                        <div className={styles.picksModalHeader}>
                            <div>
                                <h2 className={styles.picksModalHeading}>Community Picks</h2>
                                <p className={styles.picksModalSubtext}>Select up to 3 communities to feature on your profile</p>
                            </div>
                            <div className={styles.picksModalHeaderRight}>
                                <span className={styles.picksModalCount}>{modalPicks.length}/3</span>
                                <button onClick={() => setShowPicksModal(false)} className={styles.picksModalCloseBtn}>✕</button>
                            </div>
                        </div>
                        <div className={styles.picksModalList}>
                            {picksLoading ? (
                                <p className={styles.picksModalEmptyText}>Loading...</p>
                            ) : joinedCommunities.length === 0 ? (
                                <p className={styles.picksModalEmptyText}>You haven't joined any communities yet.</p>
                            ) : joinedCommunities.map(community => {
                                const isPicked = modalPicks.some(p => p.id === community.id);
                                const atLimit = modalPicks.length >= 3;
                                return (
                                    <div key={community.id}>
                                        <div
                                            className={`${styles.picksModalCommunityCard} ${isPicked ? styles.picksModalCommunityCardPicked : styles.picksModalCommunityCardUnpicked}`}
                                            style={{ backgroundImage: `linear-gradient(to right, rgba(25,25,25,0.95) 10%, rgba(25,25,25,0.7) 40%, rgba(25,25,25,0.2) 100%), url(${community.image})` }}
                                        >
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <h3 className={styles.picksModalCommunityName}>{community.name}</h3>
                                                <p className={styles.picksModalCommunityDesc}>{community.description || 'No description available.'}</p>
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const res = await fetch(`${API}/api/${community.id}/toggle_picks/`, {
                                                            method: 'POST',
                                                            headers: { Authorization: `Bearer ${token}` },
                                                        });
                                                        if (res.ok) {
                                                            isPicked
                                                                ? setModalPicks(p => p.filter(c => c.id !== community.id))
                                                                : (!atLimit && setModalPicks(p => [...p, community]));
                                                        } else console.error('Toggle pick failed:', await res.json());
                                                    } catch (e) { console.error(e); }
                                                }}
                                                disabled={!isPicked && atLimit}
                                                className={`${styles.picksModalPickBtn} ${isPicked ? styles.picksModalPickBtnPicked : atLimit ? styles.picksModalPickBtnDisabled : styles.picksModalPickBtnNormal}`}
                                            >
                                                {isPicked ? 'Unpick' : 'Pick'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>, document.body
            )}

            {showManageEvents && createPortal(
                <div className={styles.manageModalOverlay} onClick={() => setShowManageEvents(false)}>
                    <div className={styles.manageModalBox} onClick={e => e.stopPropagation()}>
                        <div className={styles.manageModalHeader}>
                            <button className={styles.manageModalBackBtn} onClick={() => setShowManageEvents(false)}>
                                <img src={ArrowLeft} alt="back" className={styles.iconSmallBack} />
                            </button>
                            <div className={styles.manageHeaderTitleGroup}>
                                <img src={Events} alt="events" className={styles.iconBigEvents} />
                                <h2 className={styles.manageModalTitle}>Event Management</h2>
                            </div>
                        </div>
                        <div className={styles.manageModalDivider} />
                        <div className={styles.manageTabsContainer}>
                            <button className={`${styles.manageTabBtn} ${activeEventTab === 'upcoming' ? styles.manageTabActive : ''}`} onClick={() => setActiveEventTab('upcoming')}>Upcoming</button>
                            <div className={styles.manageVerticalLine} />
                            <button className={`${styles.manageTabBtn} ${activeEventTab === 'history' ? styles.manageTabActive : ''}`} onClick={() => setActiveEventTab('history')}>History</button>
                        </div>
                        <div className={styles.manageContentBody}>
                            <div className={styles.manageEventsHeaderRow}>
                                <h3 className={styles.manageEventsMonth}>
                                    Events of <strong>{manageEventsDate.toLocaleString('default', { month: 'long' }).toUpperCase()}</strong>
                                </h3>
                                <div className={styles.manageMonthPickerWrapper}>
                                    <button onClick={() => setShowManageMonthPicker(p => !p)} className={styles.manageMonthToggle}>
                                        {manageEventsDate.toLocaleString('default', { month: 'long' })} {manageEventsDate.getFullYear()} ▾
                                    </button>
                                    {showManageMonthPicker && (
                                        <MonthPicker
                                            date={manageEventsDate}
                                            setDate={setManageEventsDate}
                                            onClose={() => setShowManageMonthPicker(false)}
                                            events={ownPageEvents}
                                            activeTab={activeEventTab}
                                        />
                                    )}
                                </div>
                            </div>
                            <div className={styles.manageScrollArea}>
                                {renderManageEventsList()}
                            </div>
                        </div>
                    </div>
                </div>, document.body
            )}

            {deleteEventPopup && createPortal(
                <div className={styles.deleteEventOverlay} onClick={() => setDeleteEventPopup(null)}>
                    <div className={styles.deleteEventModal} onClick={e => e.stopPropagation()}>
                        <h3 className={styles.deleteEventTitle}>Delete Event</h3>
                        <p className={styles.deleteEventDesc}>
                            Are you sure you want to delete <strong>"{deleteEventPopup.title}"</strong>? This can't be undone.
                        </p>
                        <div className={styles.deleteEventActions}>
                            <button className={styles.deleteEventCancelBtn} onClick={() => setDeleteEventPopup(null)}>Cancel</button>
                            <button className={styles.deleteEventConfirmBtn} onClick={() => handleDeleteEvent(deleteEventPopup)}>Yes, Delete</button>
                        </div>
                    </div>
                </div>, document.body
            )}
            {reportTargetId && (
                <ReportModal
                    contentId={reportTargetId}
                    contentType="user"
                    onClose={() => setReportTargetId(null)}
                />
            )}
            {eventsTabPopup && createPortal(
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setEventsTabPopup(null)}>
                    <div style={{ background: '#2a2a2a', borderRadius: 20, padding: 28, maxWidth: 480, width: '90%', position: 'relative', border: '1px solid rgba(255,255,255,0.08)' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setEventsTabPopup(null)} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', color: 'white', fontSize: '1.1rem', cursor: 'pointer' }}>✕</button>
                        <h3 style={{ color: 'white', margin: '0 0 12px' }}>{eventsTabPopup.title}</h3>
                        <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: 0 }}>{eventsTabPopup.description}</p>
                    </div>
                </div>,
                document.body
            )}
            {showPromotionsModal && createPortal(
                <div className={styles.manageModalOverlay} onClick={() => setShowPromotionsModal(false)}>
                    <div className={styles.promoMgmtBox} onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className={styles.manageModalHeader}>
                            <button className={styles.manageModalBackBtn} onClick={() => setShowPromotionsModal(false)}>
                                <img src={ArrowLeft} alt="back" className={styles.iconSmallBack} />
                            </button>
                            <div className={styles.manageHeaderTitleGroup}>
                                <h2 className={styles.manageModalTitle}>Promotions</h2>
                            </div>
                        </div>
                        <div className={styles.manageModalDivider} />

                        {/* Type tabs */}
                        <div className={styles.manageTabsContainer}>
                            {['communities', 'events', 'posts'].map((tab, i, arr) => (
                                <div key={tab} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                    <button
                                        className={`${styles.manageTabBtn} ${activePromoTab === tab ? styles.manageTabActive : ''}`}
                                        onClick={() => setActivePromoTab(tab)}
                                        style={{ textTransform: 'capitalize', flex: 1 }}
                                    >
                                        {tab}
                                    </button>
                                    {i < arr.length - 1 && <div className={styles.manageVerticalLine} />}
                                </div>
                            ))}
                        </div>

                        <div className={styles.promoMgmtBody}>
                            {/* List */}
                            <div className={styles.promoMgmtList}>
                                {promotionsLoading ? (
                                    <p className={styles.promoMgmtEmpty}>Loading...</p>
                                ) : (() => {
                                    const items = (promotionsData[activePromoTab] || []).filter(p => p.status === activePromoStatusFilter);
                                    if (items.length === 0) return (
                                        <p className={styles.promoMgmtEmpty}>
                                            No {activePromoStatusFilter === 'ONHOLD' ? 'on-hold' : activePromoStatusFilter} {activePromoTab} promotions.
                                        </p>
                                    );
                                    return items.map((promo, index) => {
                                        const details = promo.target_details || {};
                                        const rawImg = details.image;
                                        const imgSrc = rawImg
                                            ? (rawImg.startsWith('http') ? rawImg : `${API}${rawImg}`)
                                            : null;

                                        const statusClass = {
                                            ONHOLD: styles.promoMgmtStatusOnhold,
                                            active: styles.promoMgmtStatusActive,
                                            expired: styles.promoMgmtStatusExpired,
                                            cancelled: styles.promoMgmtStatusCancelled,
                                        }[promo.status] || styles.promoMgmtStatusExpired;

                                        return (
                                            <div key={promo.promotion_id}>
                                                <div className={styles.promoMgmtItem}>
                                                    <div className={styles.promoMgmtThumb}>
                                                        {imgSrc
                                                            ? <img src={imgSrc} alt="" />
                                                            : <div className={styles.promoMgmtThumbPlaceholder} />
                                                        }
                                                    </div>

                                                    <div className={styles.promoMgmtInfo}>
                                                        <div className={styles.promoMgmtNameRow}>
                                                            <span className={styles.promoMgmtName}>
                                                                {details.name || `Item #${promo.object_id}`}
                                                            </span>
                                                            <span className={`${styles.promoMgmtStatusBadge} ${statusClass}`}>
                                                                {promo.status === 'ONHOLD' ? 'On Hold' : promo.status.charAt(0).toUpperCase() + promo.status.slice(1)}
                                                            </span>
                                                        </div>
                                                        <div className={styles.promoMgmtMeta}>
                                                            <span className={styles.promoMgmtMetaLabel}>
                                                                Plan: <span className={styles.promoMgmtMetaValue}>{promo.duration || '—'}</span>
                                                            </span>
                                                            <span className={styles.promoMgmtMetaLabel}>
                                                                Cost: <span className={styles.promoMgmtMetaValue}>${parseFloat(promo.cost || 0).toFixed(2)}</span>
                                                            </span>
                                                            <span className={styles.promoMgmtMetaLabel}>
                                                                Ends: <span className={styles.promoMgmtMetaValue}>
                                                                    {promo.end_date ? new Date(promo.end_date).toLocaleDateString() : '—'}
                                                                </span>
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {promo.status === 'ONHOLD' && (
                                                        <button
                                                            className={styles.promoMgmtRemoveBtn}
                                                            onClick={async () => {
                                                                try {
                                                                    const res = await fetch(`${API}/api/promotions/${promo.promotion_id}/delete/`, {
                                                                        method: 'DELETE',
                                                                        headers: { Authorization: `Bearer ${token}` }
                                                                    });
                                                                    if (res.ok) {
                                                                        setPromotionsData(prev => ({
                                                                            ...prev,
                                                                            [activePromoTab]: prev[activePromoTab].filter(p => p.promotion_id !== promo.promotion_id)
                                                                        }));
                                                                    }
                                                                } catch (e) { console.error(e); }
                                                            }}
                                                        >
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>
                                                {index < items.length - 1 && <div className={styles.manageModalDivider} />}
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}