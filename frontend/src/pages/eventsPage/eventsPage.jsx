import styles from './eventsPage.module.css';
import { useCreateEvent } from '../../components/createEvent/useCreateEvent';
import CreateEventForm from '../../components/createEvent/CreateEventForm';
import CreateEventRightSidebar from '../../components/createEvent/CreateEventRightSidebar';
import Bin from '../../Assets/icons/bin.png';
import EditIcon from '../../Assets/icons/edit.png';
import Header from '../../components/pagelayout/header/header';
import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav';
import MobileHeader from '../../components/mobileHeader/mobileHeader';
import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import VerifiedBadge from '../../Assets/icons/verified-mark.png';
import BellOn from '../../Assets/icons/notifications.png';
import BellOff from '../../Assets/icons/mute.png';
import ArrowLeftIcon from '../../Assets/icons/arrow-left.png';
import AdIcon from '../../Assets/icons/ad.png';
import { createPortal } from 'react-dom';
import API from '../../config';
import useTheme from '../../hooks/useTheme';
import DefaultBanner from '../../Assets/Pictures/default-community-banner.png'
import { X } from 'lucide-react';
import darkModeIcon from '../../Assets/Pictures/LogoDarkMode.png';

export default function EventsPage() {
    const [user, setUser] = useState(null);
    const { theme, toggleTheme } = useTheme();

    const [events, setEvents] = useState([]);
    const [recommendedEvents, setRecommendedEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reminders, setReminders] = useState({});
    const [pageNotifyStatus, setPageNotifyStatus] = useState({});
    const [ownPageEvents, setOwnPageEvents] = useState([]);
    const [popupEvent, setPopupEvent] = useState(null);
    const [showCreateEvent, setShowCreateEvent] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const [showManageEvents, setShowManageEvents] = useState(false);
    const [activeEventTab, setActiveEventTab] = useState('upcoming');
    const [manageEventsDate, setManageEventsDate] = useState(new Date());
    const [showManageMonthPicker, setShowManageMonthPicker] = useState(false);
    const [editingEventId, setEditingEventId] = useState(null);
    const [editEventData, setEditEventData] = useState({
        title: '', description: '',
        startDay: '', startMonth: '', startYear: '',
        startHour: '', startMinute: '', startPeriod: 'AM',
        endDay: '', endMonth: '', endYear: '',
        endHour: '', endMinute: '', endPeriod: 'AM',
    });
    const [deleteEventPopup, setDeleteEventPopup] = useState(null);

    // Promo modal
    const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
    const [promoDurationIdx, setPromoDurationIdx] = useState(2);
    const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);
    const [selectedPromoEventId, setSelectedPromoEventId] = useState(null);
    const [promoCart, setPromoCart] = useState([]);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();

    const [highlightId, setHighlightId] = useState(location.state?.highlightId || null);

    const pageIdRef = useRef(null);
    const mobileMenuRef = useRef(null);

    const durationOptions = [
        { label: '1 week', cost: 4.99 },
        { label: '1 month', cost: 9.99 },
        { label: '3 months', cost: 14.99 },
        { label: '6 months', cost: 24.99 },
        { label: '1 year', cost: 49.99 }
    ];

    const isUserPage = ["page", "university"].includes(localStorage.getItem("user_type"));

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const loadOwnPageEvents = async () => {
        const token = localStorage.getItem("access");
        const pageId = pageIdRef.current;
        if (!pageId) return;
        try {
            const evRes = await fetch(`${API}/api/pages/${pageId}/events/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (evRes.ok) {
                const evData = await evRes.json();
                const now = new Date();
                const eventsArr = (Array.isArray(evData) ? evData : []).sort((a, b) => {
                    const aDate = new Date(a.start_date);
                    const bDate = new Date(b.start_date);
                    const aUpcoming = aDate >= now;
                    const bUpcoming = bDate >= now;
                    if (aUpcoming && !bUpcoming) return -1;
                    if (!aUpcoming && bUpcoming) return 1;
                    return aDate - bDate;
                });
                setOwnPageEvents(eventsArr);
            }
        } catch (e) { console.error(e); }
    };

    const createEvent = useCreateEvent({
        onSuccess: (eventId) => {
            setShowCreateEvent(false);
            setHighlightId(eventId);
            loadOwnPageEvents();
        }
    });

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem("access");
            const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

            try {
                const [eventsRes, userRes] = await Promise.all([
                    fetch(`${API}/api/events/`, { headers }),
                    fetch(`${API}/api/auth/me/`, { headers })
                ]);

                if (userRes.ok) {
                    const userData = await userRes.json();
                    setUser(userData);

                    const userType = localStorage.getItem('user_type');
                    if (userData.role === 'university' || ['university', 'uni', 'page'].includes(userType)) {
                        pageIdRef.current = userData.page_id;
                        const evRes = await fetch(`${API}/api/pages/${userData.page_id}/events/`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        if (evRes.ok) {
                            const evData = await evRes.json();
                            setOwnPageEvents(Array.isArray(evData) ? evData : []);
                        }
                    }
                }

                if (eventsRes.ok) {
                    const data = await eventsRes.json();

                    const formatEvent = (event) => ({
                        id: event.id,
                        pageId: event.page_id,
                        orgName: event.organization_name,
                        avatar: event.avatar
                            ? (event.avatar.startsWith("http") ? event.avatar : `${API}${event.avatar}`)
                            : "/default-avatar.png",
                        banner: (event.image || event.banner)
                            ? ((event.image || event.banner).startsWith("http")
                                ? (event.image || event.banner)
                                : `${API}${event.image || event.banner}`)
                            : DefaultBanner,
                        isFollowed: event.is_followed,
                        isNotified: event.is_notified || false,
                        startDate: event.start_date,
                        isReminded: event.is_reminded,
                        endDate: event.end_date,
                        title: event.title,
                        description: event.description,
                        pageType: event.page_type,
                    });

                    const formatted = (data.body || []).map(formatEvent);
                    const formattedRec = (data.recommended || []).map(formatEvent);
                    setEvents(formatted);
                    setRecommendedEvents(formattedRec);

                    const initialReminders = {};
                    const initialNotify = {};
                    [...formatted, ...formattedRec].forEach(e => {
                        initialReminders[e.id] = e.isReminded || false;
                        initialNotify[e.pageId] = e.isNotified || false;
                    });
                    setReminders(initialReminders);
                    setPageNotifyStatus(initialNotify);
                }
            } catch (err) {
                console.error("Network or parsing error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const fetchPromoCart = async () => {
            const token = localStorage.getItem("access");
            try {
                const res = await fetch(`${API}/api/events/promotions/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setPromoCart(data.map(item => {
                        const details = item.target_details || {};
                        return {
                            id: item.promotion_id,
                            eventId: item.object_id,
                            event: {
                                title: details.title || `Event #${item.object_id}`,
                                banner: details.image || null,
                                image: details.image || null,
                                description: details.description || null,
                            },
                            durationIdx: item.duration_idx ?? 2,
                            label: item.duration || 'Unknown',
                            cost: parseFloat(item.cost) || 0,
                        };
                    }));
                }
            } catch (err) { console.error("Failed to load promo cart:", err); }
        };
        fetchPromoCart();
    }, []);

    useEffect(() => {
        if (highlightId && events.length > 0) {
            const el = document.getElementById(`event-${highlightId}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add(styles.highlighted);
                setTimeout(() => {
                    el.classList.remove(styles.highlighted);
                    setHighlightId(null);
                }, 2000);
            }
        }
    }, [highlightId, events]);

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    };

    const handlePageNotification = async (pageId) => {
        const token = localStorage.getItem("access");
        const prev = pageNotifyStatus[pageId];
        setPageNotifyStatus(s => ({ ...s, [pageId]: !prev }));
        try {
            const res = await fetch(`${API}/api/pages/${pageId}/notify/`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPageNotifyStatus(s => ({ ...s, [pageId]: data.is_notified }));
            } else {
                setPageNotifyStatus(s => ({ ...s, [pageId]: prev }));
            }
        } catch {
            setPageNotifyStatus(s => ({ ...s, [pageId]: prev }));
        }
    };

    const handleReminder = async (eventId) => {
        const token = localStorage.getItem("access");
        const isSet = reminders[eventId];
        setReminders(prev => ({ ...prev, [eventId]: !isSet }));
        try {
            const res = await fetch(`${API}/api/events/${eventId}/remind/`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) setReminders(prev => ({ ...prev, [eventId]: isSet }));
        } catch {
            setReminders(prev => ({ ...prev, [eventId]: isSet }));
        }
    };

    const handleFollow = async (eventId, pageId) => {
        const token = localStorage.getItem("access");
        const event = events.find(e => e.id === eventId) || recommendedEvents.find(e => e.id === eventId);
        if (!event) return;
        const wasFollowed = event.isFollowed;

        const toggle = (list) => list.map(e => e.id === eventId ? { ...e, isFollowed: !e.isFollowed } : e);
        const revert = (list) => list.map(e => e.id === eventId ? { ...e, isFollowed: wasFollowed } : e);

        setEvents(toggle);
        setRecommendedEvents(toggle);
        try {
            const res = await fetch(`${API}/api/pages/${pageId}/follow/`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) { setEvents(revert); setRecommendedEvents(revert); }
        } catch {
            setEvents(revert);
        }
    };

    return (
        <div className={styles.darkContainer}>
            {/* Mobile Header */}
            {isMobile && (
                <MobileHeader
                    avatarSrc={user?.profile?.avatar || user?.avatar || user?.profile_image || '/default-avatar.png'}
                    user={user}
                    setMobileMenuOpen={setMobileMenuOpen}
                    token={localStorage.getItem("access")}
                    API={API}
                />
            )}

            {/* Mobile Drawer (Navigation) */}
            {isMobile && mobileMenuOpen && (
                <div style={{ position: "fixed", inset: 0, zIndex: 9998 }}>
                    <div
                        style={{
                            position: "absolute", inset: 0,
                            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)"
                        }}
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    <div
                        ref={mobileMenuRef}
                        style={{
                            position: "absolute", left: 0, top: 0,
                            height: "100%", width: "75vw", maxWidth: 350,
                            background: " linear-gradient(135deg, var(--bg-main), var(--bg-secondary))",
                            borderRight: "1px solid rgba(255,255,255,0.1)",
                            display: "flex", flexDirection: "column", overflow: "hidden",
                            boxShadow: "4px 0 30px rgba(0,0,0,0.6)"
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            style={{
                                position: "absolute", top: 14, right: 14, zIndex: 10,
                                width: 32, height: 32, borderRadius: "50%",
                                background: "rgba(255,255,255,0.1)", border: "none",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer"
                            }}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <X size={16} color="white" />
                        </button>

                        <div style={{
                            display: "flex", alignItems: "center", gap: 10,
                            padding: "20px 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)"
                        }}>
                            <img src={darkModeIcon} alt="Logo" style={{ height: 40 }} />
                            <span style={{ color: "#fff", fontWeight: 800, fontSize: "1.3rem", letterSpacing: 1 }}>
                                CAMPUS
                            </span>
                        </div>
                        <div style={{ flex: 1, overflowY: "auto" }}>
                            <SideBarNav onClose={() => setMobileMenuOpen(false)} />
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop Header */}
            {!isMobile && (
                <div className={`${styles.header} ${styles.page}`}>
                    <Header theme={theme} toggleTheme={toggleTheme} user={user} />
                </div>
            )}

            {/* Desktop Content */}
            {!isMobile && (
                <div className={`${styles.content} ${styles.page}`}>
                    <SideBarNav />
                    {showCreateEvent ? (
                        <div className={styles.createEventContent}>
                            <div className={styles.createEventProfileContent}>
                                <div className={styles.createEventProfileCard}>
                                    <CreateEventForm {...createEvent.formProps} onBack={() => setShowCreateEvent(false)} />
                                </div>
                            </div>
                            <div className={styles.rightSection}>
                                <CreateEventRightSidebar {...createEvent.sidebarProps} />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className={styles.mainContent}>
                                {isUserPage && (
                                    <>
                                        <div className={styles.yourEventsWrapper}>
                                            <div className={styles.yourEventsHeader}>
                                                <h2 className={styles.yourEventsTitleText}>
                                                    Your <span className={styles.highlight}>EVENTS</span>
                                                </h2>
                                                <div className={styles.yourEventsBtns}>
                                                    <button className={styles.manageEventsBtn} onClick={() => setShowManageEvents(true)}>Manage Events</button>
                                                    <button className={styles.createEventBtn} onClick={() => setShowCreateEvent(true)}>Create</button>
                                                </div>
                                            </div>
                                            <div className={styles.yourEventsCardsRow}>
                                                {ownPageEvents.slice(0, 2).map((event) => (
                                                    <div key={event.id} className={styles.yourEventCardWrapper}>
                                                        <img
                                                            src={event.image
                                                                ? (event.image.startsWith('http') ? event.image : `${API}${event.image}`)
                                                                : DefaultBanner}
                                                            className={styles.yourEventBannerImg}
                                                            alt="Event Banner"
                                                        />
                                                        <div className={styles.yourEventDateBadge}>
                                                            <p>Starts {formatDate(event.start_date)}</p>
                                                            <p>Ends {formatDate(event.end_date)}</p>
                                                        </div>
                                                        <div className={styles.yourEventBottomOverlay}>
                                                            <h3>{event.title}</h3>
                                                            <p>
                                                                {event.description?.substring(0, 80)}
                                                                {event.description?.length > 80 && (
                                                                    <span className={styles.yourEventReadMore} onClick={() => setPopupEvent(event)}> read more</span>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className={styles.middleDivider}></div>
                                    </>
                                )}

                                <h1 className={styles.title} style={{ marginTop: isUserPage ? '30px' : '0' }}>
                                    Looking for - <br /> <span className={styles.highlight}>EVENTS</span> to participate in?
                                </h1>

                                <div className={styles.eventsContainer}>
                                    {events.map((event) => (
                                        <div key={event.id} id={`event-${event.id}`} className={styles.eventCard}>
                                            <div className={styles.cardHeader}>
                                                <div className={styles.orgInfo} onClick={() => navigate(`/page/${event.pageId}`)} style={{ cursor: 'pointer' }}>
                                                    <img src={event.avatar} alt="Logo" className={styles.avatar} />
                                                    <div className={styles.orgText}>
                                                        <div className={styles.orgNameRow}>
                                                            <h3>{event.orgName}</h3>
                                                            <img src={VerifiedBadge} alt="verified" className={styles.verifiedIcon} style={{ width: 18, height: 18, marginLeft: 3 }} />
                                                        </div>
                                                        <p>{event.pageType}</p>
                                                    </div>
                                                </div>
                                                <div className={styles.headerActions}>
                                                    {event.isFollowed && (
                                                        <button className={styles.bellBtn} onClick={() => handlePageNotification(event.pageId)}>
                                                            <img
                                                                src={pageNotifyStatus[event.pageId] ? BellOn : BellOff}
                                                                alt="notifications" width={20} height={pageNotifyStatus[event.pageId] ? 24 : 20}
                                                                style={{ filter: 'brightness(0) saturate(100%) invert(85%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(85%)' }}
                                                            />
                                                        </button>
                                                    )}
                                                    <button
                                                        className={event.isFollowed ? styles.followedBtn : styles.followBtn}
                                                        onClick={() => handleFollow(event.id, event.pageId)}
                                                    >
                                                        {event.isFollowed ? 'Followed' : 'Follow'}
                                                    </button>
                                                </div>
                                            </div>

                                            {event.banner && (
                                                <div className={styles.bannerContainer}>
                                                    <img src={event.banner} className={styles.bannerImg} alt="Event Banner" />
                                                    <div className={styles.dateWidget}>
                                                        <div className={styles.dateText}>
                                                            <p>Starts {formatDate(event.startDate)}</p>
                                                            <p>Ends — {formatDate(event.endDate)}</p>
                                                        </div>
                                                        <button
                                                            className={`${styles.reminderBtn} ${reminders[event.id] ? styles.reminderBtnSet : ''}`}
                                                            onClick={() => handleReminder(event.id)}

                                                        >
                                                            {reminders[event.id] ? "✓ Reminder set" : "Set reminder"}
                                                        </button>
                                                    </div>
                                                    <div className={styles.bannerOverlay} style={{ pointerEvents: "none" }}>
                                                        <div className={styles.bannerContent} style={{ pointerEvents: "auto" }}>
                                                            {event.title?.length > 20 ? (
                                                                <div className={styles.titleMarqueeWrapper}>
                                                                    <span className={styles.titleMarquee}>{event.title}</span>
                                                                </div>
                                                            ) : (
                                                                <h2>{event.title}</h2>
                                                            )}
                                                            <p>
                                                                {event.description?.length > 40
                                                                    ? <>{event.description.substring(0, 80)}... <span className={styles.readMore} onClick={(e) => { e.stopPropagation(); setPopupEvent(event); }} style={{ cursor: "pointer" }}>read more</span></>
                                                                    : event.description
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.rightSection}>
                                {isUserPage ? (
                                    <>
                                        <div className={styles.pillContainer}>
                                            <div className={styles.pill}>ON-HOLD</div>
                                        </div>
                                        <div className={styles.onHoldContainer}>
                                            <div className={styles.pendingText}>{promoCart.length} Pending checkout</div>
                                            <div className={styles.onHoldDivider}></div>
                                            <div className={styles.checkoutList}>
                                                {promoCart.length === 0 ? (
                                                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem', textAlign: 'center', padding: '16px 0' }}>
                                                        No promotions queued. Use "Manage" below to add one.
                                                    </p>
                                                ) : promoCart.map(item => {
                                                    const eventData = item.event || {};
                                                    const imgSrc = eventData.banner
                                                        ? (eventData.banner.startsWith('http') ? eventData.banner : `${API}${eventData.banner}`)
                                                        : (eventData.image
                                                            ? (eventData.image.startsWith('http') ? eventData.image : `${API}${eventData.image}`)
                                                            : '/default-banner.png');
                                                    return (
                                                        <div key={item.eventId} className={styles.checkoutItemWrap}>
                                                            <div className={styles.checkoutCard}>
                                                                <img src={imgSrc} alt={item.event.title} className={styles.checkoutBannerImg} />
                                                                <div className={styles.checkoutOverlay}>
                                                                    <div className={styles.checkoutOverlayLeft}>
                                                                        <h4 className={styles.checkoutTitle}>{item.event.title}</h4>
                                                                        <p className={styles.checkoutDesc}>
                                                                            {item.event.description?.substring(0, 50)}
                                                                            {item.event.description?.length > 50 && '...'}
                                                                        </p>
                                                                    </div>
                                                                    <button className={styles.detailsBtn} onClick={async () => {
                                                                        const token = localStorage.getItem("access");
                                                                        if (item.id) {
                                                                            await fetch(`${API}/api/promotions/${item.id}/delete/`, {
                                                                                method: "DELETE",
                                                                                headers: { Authorization: `Bearer ${token}` }
                                                                            });
                                                                        }
                                                                        setPromoCart(prev => prev.filter(c => c.eventId !== item.eventId));
                                                                    }}>
                                                                        Remove
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className={styles.checkoutSubInfo}>
                                                                <span>Plan: {item.label} promotion</span>
                                                                <span>Price: ${item.cost.toFixed(2)}</span>
                                                            </div>
                                                            <div className={styles.onHoldDivider}></div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div className={styles.checkoutBottom}>
                                                <span className={styles.totalText}>
                                                    Total: ${promoCart.reduce((sum, item) => sum + item.cost, 0).toFixed(2)}
                                                </span>
                                                <button
                                                    className={styles.proceedBtn}
                                                    onClick={() => promoCart.length > 0 && setIsCheckoutModalOpen(true)}
                                                    disabled={promoCart.length === 0}
                                                    style={promoCart.length === 0 ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                                                >
                                                    Proceed to check-out
                                                </button>
                                            </div>
                                        </div>
                                        <div className={styles.promoContainer}>
                                            <div className={styles.promoHeaderContainer}>
                                                <div className={styles.promoIconColored}></div>
                                                <h3 className={styles.promoTitle}>Event Promotion</h3>
                                            </div>
                                            <div className={styles.promoBodyContainer}>
                                                <p className={styles.promoText}>Manage your promotion plan and get more users to notice your event.</p>
                                                <button className={styles.promoManageBtn} onClick={() => setIsPromoModalOpen(true)}>Manage</button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className={styles.pill} style={{ left: "20px" }}>RECOMMENDED</div>
                                        <div className={styles.rightCard}>
                                            <div className={styles.rightList}>
                                                {recommendedEvents.map((rec, index) => (
                                                    <div key={rec.id} className={styles.recItemWrapper}>
                                                        <div className={styles.recCard}>
                                                            <img src={rec.banner || DefaultBanner} className={styles.recBanner} alt="" />
                                                            <div className={styles.recOverlay}>
                                                                <div className={styles.recHeader}>
                                                                    <div className={styles.recOrgInfo} onClick={() => navigate(`/profile/${rec.pageId}`)} style={{ cursor: 'pointer' }}>
                                                                        <img src={rec.avatar} className={styles.recAvatar} alt="" />
                                                                        <div className={styles.recOrgText}>
                                                                            <div className={styles.recNameRow}>
                                                                                <h4>{rec.orgName}</h4>
                                                                                <img src={VerifiedBadge} alt="verified" style={{ width: 18, height: 18, filter: 'brightness(0) invert(1)', marginLeft: 3 }} />
                                                                            </div>
                                                                            <p>{rec.pageType}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                                                        {rec.isFollowed && (
                                                                            <button className={styles.bellBtn} onClick={() => handlePageNotification(rec.pageId)} style={{ width: 28, height: 28 }}>
                                                                                <img
                                                                                    src={pageNotifyStatus[rec.pageId] ? BellOn : BellOff}
                                                                                    alt="notifications"
                                                                                    width={pageNotifyStatus[rec.pageId] ? 15 : 16}
                                                                                    height={pageNotifyStatus[rec.pageId] ? 18 : 16}
                                                                                    style={{ filter: 'brightness(0) saturate(100%) invert(85%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(85%)' }}
                                                                                />
                                                                            </button>
                                                                        )}
                                                                        <button
                                                                            className={rec.isFollowed ? styles.followBtnSmall : styles.followBtnSmall}
                                                                            onClick={() => handleFollow(rec.id, rec.pageId)}
                                                                        >
                                                                            {rec.isFollowed ? 'Followed' : 'Follow'}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <div className={styles.recBody}>
                                                                    <div style={{ overflow: "hidden", width: "100%" }}>
                                                                        {rec.title?.length > 15 ? (
                                                                            <div className={styles.titleMarqueeWrapper}>
                                                                                <span style={{ display: "inline-block", whiteSpace: "nowrap", animation: "marquee 8s linear infinite", color: "white", fontSize: "1.1rem", fontWeight: 700 }}>
                                                                                    {rec.title}
                                                                                </span>
                                                                            </div>
                                                                        ) : (
                                                                            <h5>{rec.title}</h5>
                                                                        )}
                                                                        <p>
                                                                            {rec.description?.length > 30
                                                                                ? <>{rec.description.substring(0, 60)}... <span className={styles.readMoreSmall} onClick={(e) => { e.stopPropagation(); setPopupEvent(rec); }} style={{ cursor: "pointer" }}>read more</span></>
                                                                                : rec.description
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {index !== recommendedEvents.length - 1 && <div className={styles.separator} />}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Mobile Content */}
            {isMobile && (
                <div style={{ display: "flex", flexDirection: "column", width: "100%", boxSizing: "border-box" }}>
                    {showCreateEvent ? (
                        <div className={styles.createEventContent} style={{ display: "flex", flexDirection: "column", padding: "16px", gap: "24px" }}>
                            {/* Time section on top without the pill */}
                            <div className={styles.rightSection} style={{ width: "100%", margin: "0 0 20px 0" }}>
                                <CreateEventRightSidebar {...createEvent.sidebarProps} />
                            </div>
                            <div className={styles.createEventProfileContent} style={{ width: "100%", margin: 0 }}>
                                <div className={styles.createEventProfileCard}>
                                    <CreateEventForm {...createEvent.formProps} onBack={() => setShowCreateEvent(false)} />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {isUserPage && (
                                <>
                                    {/* ON-HOLD Section */}
                                    <div style={{ padding: "12px 16px" }}>
                                        <div style={{
                                            background: "#333333",
                                            borderRadius: 24,
                                            padding: 16,
                                            border: "1px solid rgba(255,255,255,0.08)"
                                        }}>
                                            <div style={{ marginBottom: 12 }}>
                                                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem", margin: 0, marginBottom: 8 }}>
                                                    {promoCart.length} Pending checkout
                                                </p>
                                                <div style={{ height: 1, background: "rgba(255,255,255,0.1)", marginBottom: 12 }}></div>
                                            </div>
                                            <div style={{ maxHeight: "300px", overflowY: "auto", marginBottom: 12 }}>
                                                {promoCart.length === 0 ? (
                                                    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.82rem", textAlign: "center", padding: "16px 0", margin: 0 }}>
                                                        No promotions queued.
                                                    </p>
                                                ) : (
                                                    promoCart.map((item, idx) => {
                                                        const eventData = item.event || {};
                                                        return (
                                                            <div key={item.eventId} style={{ marginBottom: idx < promoCart.length - 1 ? 12 : 0 }}>
                                                                <h4 style={{ margin: "0 0 4px", fontSize: "0.9rem", color: "white" }}>{item.event.title}</h4>
                                                                <p style={{ margin: "0 0 8px", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>
                                                                    {item.label} - ${item.cost.toFixed(2)}
                                                                </p>
                                                                {idx < promoCart.length - 1 && <div style={{ height: 1, background: "rgba(255,255,255,0.1)" }}></div>}
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                            {promoCart.length > 0 && (
                                                <>
                                                    <div style={{ height: 1, background: "rgba(255,255,255,0.1)", marginBottom: 12 }}></div>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                                        <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>
                                                            Total: ${promoCart.reduce((sum, item) => sum + item.cost, 0).toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => promoCart.length > 0 && setIsCheckoutModalOpen(true)}
                                                        style={{
                                                            width: "100%",
                                                            padding: "12px 20px",
                                                            background: "linear-gradient(to right, #622598, #942892)",
                                                            border: "none",
                                                            borderRadius: 24,
                                                            color: "white",
                                                            fontSize: "0.9rem",
                                                            cursor: "pointer",
                                                            fontWeight: 500
                                                        }}
                                                    >
                                                        Proceed to check-out
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Event Promotion Section */}
                                    <div style={{ padding: "12px 16px" }}>
                                        <div style={{
                                            background: "#333333",
                                            borderRadius: 24,
                                            padding: 16,
                                            border: "1px solid rgba(255,255,255,0.08)"
                                        }}>
                                            <h3 style={{ margin: "0 0 8px", fontSize: "0.95rem", color: "white", fontWeight: 600 }}>
                                                Event Promotion
                                            </h3>
                                            <p style={{ margin: "0 0 12px", fontSize: "0.8rem", color: "#CCCCCC", lineHeight: 1.5 }}>
                                                Manage your promotion plan and get more users to notice your event.
                                            </p>
                                            <button
                                                onClick={() => setIsPromoModalOpen(true)}
                                                style={{
                                                    width: "100%",
                                                    padding: "10px 24px",
                                                    background: "linear-gradient(to right, #5D2296, #8C2590)",
                                                    border: "none",
                                                    borderRadius: 24,
                                                    color: "white",
                                                    fontSize: "0.9rem",
                                                    cursor: "pointer",
                                                    fontWeight: 500
                                                }}
                                            >
                                                Manage
                                            </button>
                                        </div>
                                    </div>

                                    {/* Your Events Section */}
                                    <div style={{ padding: "12px 16px" }}>
                                        <h2 style={{ margin: "0 0 12px", fontSize: "1.1rem", color: "white", fontWeight: 700 }}>
                                            Your <span className={styles.highlight}>EVENTS</span>
                                        </h2>
                                        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                                            <button
                                                onClick={() => setShowManageEvents(true)}
                                                style={{
                                                    flex: 1,
                                                    padding: "12px 24px",
                                                    background: "#5F5F5F",
                                                    border: "none",
                                                    borderRadius: 25,
                                                    color: "white",
                                                    fontSize: "1rem",
                                                    fontWeight: 500,
                                                    cursor: "pointer"
                                                }}
                                            >
                                                Manage
                                            </button>
                                            <button
                                                onClick={() => setShowCreateEvent(true)}
                                                style={{
                                                    flex: 1,
                                                    padding: "12px 32px",
                                                    background: "linear-gradient(to right, #5D2296, #8C2590)",
                                                    border: "none",
                                                    borderRadius: 25,
                                                    color: "white",
                                                    fontSize: "1rem",
                                                    cursor: "pointer",
                                                    fontWeight: 500
                                                }}
                                            >
                                                Create
                                            </button>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                            {ownPageEvents.slice(0, 2).map((event) => (
                                                <div key={event.id} style={{
                                                    background: `url(${event.image
                                                        ? (event.image.startsWith('http') ? event.image : `${API}${event.image}`)
                                                        : DefaultBanner}) center/cover`,
                                                    borderRadius: 8,
                                                    height: 120,
                                                    position: "relative",
                                                    overflow: "hidden"
                                                }}>
                                                    <div style={{
                                                        position: "absolute",
                                                        inset: 0,
                                                        background: "rgba(0,0,0,0.6)",
                                                        padding: 12,
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        justifyContent: "flex-end"
                                                    }}>
                                                        <h4 style={{ margin: 0, color: "white", fontSize: "0.95rem", fontWeight: 600 }}>
                                                            {event.title}
                                                        </h4>
                                                        <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.7)", fontSize: "0.75rem" }}>
                                                            {event.start_date}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* All Events Feed */}
                            <div style={{ padding: "12px 16px 0" }}>
                                <h2 style={{ margin: "0 0 16px", fontSize: "1.1rem", color: "white", fontWeight: 700 }}>
                                    Looking for events to <span className={styles.highlight}>participate in</span>
                                </h2>
                                {events.length === 0 ? (
                                    <p style={{ color: "rgba(255,255,255,0.5)", textAlign: "center", padding: "20px 0" }}>No events yet</p>
                                ) : (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                        {events.map((event) => (
                                            <div key={event.id} style={{
                                                background: "#333333",
                                                borderRadius: 40,
                                                overflow: "hidden",
                                                border: "1px solid rgba(255,255,255,0.05)"
                                            }}>
                                                {/* Header with org info */}
                                                <div style={{ padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                                                        <img
                                                            src={event.avatar || '/default-avatar.png'}
                                                            alt={event.orgName}
                                                            style={{
                                                                width: 44,
                                                                height: 44,
                                                                borderRadius: "50%",
                                                                objectFit: "cover",
                                                                flexShrink: 0
                                                            }}
                                                        />
                                                        <div style={{ minWidth: 0 }}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                                                <h4 style={{ margin: 0, fontSize: "0.95rem", color: "white", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                                    {event.orgName}
                                                                </h4>
                                                                <img src={VerifiedBadge} alt="verified" style={{ width: 16, height: 16, flexShrink: 0, filter: 'brightness(0) invert(1)' }} />
                                                            </div>
                                                            <p style={{ margin: 0, fontSize: "0.8rem", color: "rgba(255,255,255,0.6)" }}>
                                                                {event.pageType}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                                                        {event.isFollowed && (
                                                            <button
                                                                onClick={() => handlePageNotification(event.pageId)}
                                                                style={{
                                                                    width: 44,
                                                                    height: 44,
                                                                    borderRadius: "50%",
                                                                    background: "rgba(255,255,255,0.1)",
                                                                    border: "none",
                                                                    cursor: "pointer",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    color: "white"
                                                                }}
                                                            >
                                                                <img
                                                                    src={pageNotifyStatus[event.pageId] ? BellOn : BellOff}
                                                                    alt="notifications"
                                                                    width={18}
                                                                    style={{ filter: 'brightness(0) saturate(100%) invert(85%)' }}
                                                                />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleFollow(event.id, event.pageId)}
                                                            style={{
                                                                padding: "8px 20px",
                                                                background: event.isFollowed ? "rgba(255,255,255,0.15)" : "linear-gradient(135deg, #5B2598, #962892)",
                                                                border: "none",
                                                                borderRadius: 20,
                                                                color: "white",
                                                                fontSize: "0.85rem",
                                                                fontWeight: 500,
                                                                cursor: "pointer",
                                                                whiteSpace: "nowrap",
                                                                transition: "opacity 0.2s"
                                                            }}
                                                            onMouseEnter={(e) => e.target.style.opacity = "0.85"}
                                                            onMouseLeave={(e) => e.target.style.opacity = "1"}
                                                        >
                                                            {event.isFollowed ? 'Followed' : 'Follow'}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Banner Image */}
                                                {event.banner && (
                                                    <div style={{ position: "relative" }}>
                                                        <img
                                                            src={event.banner}
                                                            alt={event.title}
                                                            style={{
                                                                width: "100%",
                                                                height: 180,
                                                                objectFit: "cover",
                                                                display: "block"
                                                            }}
                                                        />
                                                        {/* Overlay with content */}
                                                        <div style={{
                                                            position: "absolute",
                                                            inset: 0,
                                                            background: "linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.75))",
                                                            padding: 16,
                                                            display: "flex",
                                                            flexDirection: "column",
                                                            justifyContent: "space-between",
                                                            pointerEvents: "none"
                                                        }}>
                                                            {/* Title and Description */}
                                                            <div style={{ pointerEvents: "auto" }}>
                                                                {event.title?.length > 20 ? (
                                                                    <div style={{ overflow: "hidden", width: "100%" }}>
                                                                        <span style={{
                                                                            display: "inline-block",
                                                                            whiteSpace: "nowrap",
                                                                            animation: "marquee 8s linear infinite",
                                                                            color: "white",
                                                                            fontSize: "1.1rem",
                                                                            fontWeight: 800
                                                                        }}>
                                                                            {event.title}
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <h3 style={{ margin: 0, color: "white", fontSize: "1.1rem", fontWeight: 800 }}>
                                                                        {event.title}
                                                                    </h3>
                                                                )}
                                                                <p style={{ margin: "8px 0 0", color: "rgba(255,255,255,0.9)", fontSize: "0.9rem", lineHeight: 1.4 }}>
                                                                    {event.description?.length > 50
                                                                        ? <>{event.description.substring(0, 70)}... <span onClick={() => setPopupEvent(event)} style={{ cursor: "pointer", color: "rgba(255,255,255,0.6)", textDecoration: "underline" }}>read more</span></>
                                                                        : event.description
                                                                    }
                                                                </p>
                                                            </div>

                                                            {/* Date and Reminder */}
                                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, pointerEvents: "auto" }}>
                                                                <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.9)", lineHeight: 1.3 }}>
                                                                    <p style={{ margin: 0 }}>Starts {event.startDate ? new Date(event.startDate).toLocaleDateString() : "TBA"}</p>
                                                                    <p style={{ margin: "4px 0 0" }}>Ends {event.endDate ? new Date(event.endDate).toLocaleDateString() : "TBA"}</p>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleReminder(event.id)}
                                                                    style={{
                                                                        padding: "8px 18px",
                                                                        background: reminders[event.id] ? "rgba(255,255,255,0.2)" : "linear-gradient(135deg, #5B2598, #962892)",
                                                                        border: "none",
                                                                        borderRadius: 12,
                                                                        color: "white",
                                                                        fontSize: "0.75rem",
                                                                        fontWeight: 800,
                                                                        cursor: "pointer",
                                                                        whiteSpace: "nowrap",
                                                                        flexShrink: 0,
                                                                        boxShadow: "0 4px 10px rgba(0,0,0,0.3)"
                                                                    }}
                                                                >
                                                                    {reminders[event.id] ? "✓ Reminder set" : "Set reminder"}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Event description popup */}
            {popupEvent && createPortal(
                <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setPopupEvent(null)}>
                    <div style={{ background: "#2a2a2a", borderRadius: 20, padding: 28, maxWidth: 480, width: "90%", position: "relative", border: "1px solid rgba(255,255,255,0.08)" }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setPopupEvent(null)} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", color: "white", fontSize: "1.1rem", cursor: "pointer" }}>✕</button>
                        <h3 style={{ color: "white", margin: "0 0 12px" }}>{popupEvent.title}</h3>
                        <p style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.6, margin: 0 }}>{popupEvent.description}</p>
                    </div>
                </div>,
                document.body
            )}

            {/* Promo modal */}
            {isPromoModalOpen && createPortal(
                <div className={styles.promoModalOverlay} onClick={() => setIsPromoModalOpen(false)}>
                    <div className={styles.promoModalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.pmHeader}>
                            <div className={styles.pmHeaderLeft}>
                                <img src={ArrowLeftIcon} alt="Back" className={styles.pmBackIcon} onClick={() => setIsPromoModalOpen(false)} />
                                <div className={styles.pmAdIconWrapper}>
                                    <img src={AdIcon} alt="Ad" className={styles.pmAdIcon} />
                                </div>
                                <h2 className={styles.pmTitle}>Events Promotion</h2>
                            </div>
                            <div className={styles.pmHeaderRight}>
                                <span className={styles.pmCancelBtn} onClick={() => setIsPromoModalOpen(false)}>Cancel</span>
                                <button
                                    className={styles.pmDoneBtn}
                                    onClick={async () => {
                                        if (!selectedPromoEventId) { setIsPromoModalOpen(false); return; }
                                        const eventObj = ownPageEvents.find(e => e.id === selectedPromoEventId);
                                        if (!eventObj) return;
                                        const token = localStorage.getItem("access");

                                        const cartItem = {
                                            eventId: selectedPromoEventId,
                                            event: {
                                                title: eventObj.title,
                                                banner: eventObj.image || null,
                                                image: eventObj.image || null,
                                                description: eventObj.description || null,
                                            },
                                            durationIdx: promoDurationIdx,
                                            label: durationOptions[promoDurationIdx].label,
                                            cost: durationOptions[promoDurationIdx].cost,
                                        };

                                        try {
                                            const existingItem = promoCart.find(item => item.eventId === selectedPromoEventId);
                                            if (existingItem) {
                                                await fetch(`${API}/api/promotions/${existingItem.id}/delete/`, {
                                                    method: "DELETE",
                                                    headers: { Authorization: `Bearer ${token}` }
                                                });
                                            }

                                            const res = await fetch(`${API}/api/events/promotions/`, {
                                                method: "POST",
                                                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                                                body: JSON.stringify({
                                                    event_id: selectedPromoEventId,
                                                    duration: durationOptions[promoDurationIdx].label,
                                                    duration_idx: promoDurationIdx,
                                                    cost: durationOptions[promoDurationIdx].cost,
                                                })
                                            });

                                            if (res.ok) {
                                                const saved = await res.json();
                                                const newItem = { ...cartItem, id: saved.id };
                                                setPromoCart(prev => {
                                                    const filtered = prev.filter(i => i.eventId !== selectedPromoEventId);
                                                    return [...filtered, newItem];
                                                });
                                            }
                                        } catch (err) { console.error("Failed to save event promotion:", err); }

                                        setIsPromoModalOpen(false);
                                        setSelectedPromoEventId(null);
                                        setPromoDurationIdx(2);
                                    }}
                                >
                                    Done
                                </button>
                            </div>
                        </div>

                        <div className={styles.pmBody}>
                            <div className={styles.pmDividerSection}>
                                <div className={styles.pmDivider}></div>
                                <p className={styles.pmSubText}>Choose a promotion for your event — it will start appearing more for users!</p>
                            </div>

                            <h3 className={styles.pmSectionTitle}>Select event</h3>
                            {ownPageEvents.length === 0 ? (
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', margin: '0 0 18px' }}>No events found. Create an event first.</p>
                            ) : (
                                <div style={{ position: 'relative', marginBottom: 22 }}>
                                    <div
                                        onClick={() => setIsEventDropdownOpen(p => !p)}
                                        className={styles.pmDropdownTrigger}
                                    >
                                        <span className={`${styles.pmDropdownTriggerText} ${selectedPromoEventId ? styles.pmDropdownTriggerTextSelected : ''}`}>
                                            {selectedPromoEventId ? ownPageEvents.find(e => e.id === selectedPromoEventId)?.title : '— Choose an event —'}
                                        </span>
                                        <img src={ArrowLeftIcon} alt="" className={styles.pmDropdownArrow}
                                            style={{ transform: isEventDropdownOpen ? 'rotate(90deg)' : 'rotate(270deg)' }} />
                                    </div>
                                    {isEventDropdownOpen && (
                                        <div className={styles.pmDropdownList}>
                                            <div className={styles.pmDropdownScroll}>
                                                {ownPageEvents.map((ev, i) => (
                                                    <div key={ev.id}>
                                                        <div
                                                            onClick={() => {
                                                                setSelectedPromoEventId(ev.id);
                                                                const existing = promoCart.find(item => item.eventId === ev.id);
                                                                if (existing) setPromoDurationIdx(existing.durationIdx);
                                                                setIsEventDropdownOpen(false);
                                                            }}
                                                            className={`${styles.pmDropdownItem} ${selectedPromoEventId === ev.id ? styles.pmDropdownItemSelected : ''}`}
                                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                                                            onMouseLeave={e => e.currentTarget.style.background = selectedPromoEventId === ev.id ? 'rgba(255,255,255,0.07)' : 'transparent'}
                                                        >
                                                            <span>{ev.title}</span>
                                                            {promoCart.find(c => c.eventId === ev.id) && <span style={{ fontSize: '0.75rem', color: '#a855f7' }}>✓ in cart</span>}
                                                        </div>
                                                        {i !== ownPageEvents.length - 1 && <div className={styles.pmDropdownDivider} />}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <h3 className={styles.pmSectionTitle}>Select duration</h3>
                            <div className={styles.pmSliderWrapper}>
                                <input type="range" min="0" max={durationOptions.length - 1} step="1" value={promoDurationIdx} onChange={(e) => setPromoDurationIdx(Number(e.target.value))} className={styles.pmInvisibleSlider} />
                                <div className={styles.pmSliderTrack}>
                                    <div className={styles.pmSliderFill} style={{ width: `${(promoDurationIdx / (durationOptions.length - 1)) * 100}%` }}></div>
                                </div>
                                <div className={styles.pmSliderDotsContainer}>
                                    {durationOptions.map((opt, i) => {
                                        const isActive = i === promoDurationIdx;
                                        const isFilled = i <= promoDurationIdx;
                                        const leftPos = (i / (durationOptions.length - 1)) * 100;
                                        return (
                                            <div key={i} className={styles.pmDotWrapper} style={{ left: `${leftPos}%` }}>
                                                <div className={`${styles.pmDot} ${isActive ? styles.pmDotActive : isFilled ? styles.pmDotFilled : ''}`}></div>
                                                <span className={`${styles.pmDotLabel} ${isActive ? styles.pmLabelActive : ''}`}>{opt.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className={styles.pmTotalCost}>
                                Total cost: <span className={styles.pmCostValue}>${durationOptions[promoDurationIdx].cost.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Manage Events modal */}
            {showManageEvents && createPortal(
                <div className={styles.manageModalOverlay} onClick={() => setShowManageEvents(false)}>
                    <div className={styles.manageModalBox} onClick={e => e.stopPropagation()}>
                        <div className={styles.manageModalHeader}>
                            <button className={styles.manageModalBackBtn} onClick={() => setShowManageEvents(false)}>
                                <img src={ArrowLeftIcon} alt="back" className={styles.iconSmallBack} />
                            </button>
                            <div className={styles.manageHeaderTitleGroup}>
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
                                <h3 className={styles.manageEventsMonth}>Events of <strong>{manageEventsDate.toLocaleString('default', { month: 'long' }).toUpperCase()}</strong></h3>
                                <div className={styles.manageMonthPickerWrapper}>
                                    <button onClick={() => setShowManageMonthPicker(p => !p)} className={styles.manageMonthToggle}>
                                        {manageEventsDate.toLocaleString('default', { month: 'long' })} {manageEventsDate.getFullYear()} ▾
                                    </button>
                                    {showManageMonthPicker && (
                                        <div className={styles.manageMonthDropdown}>
                                            <div className={styles.manageMonthNav}>
                                                <button onClick={() => setManageEventsDate(new Date(manageEventsDate.getFullYear() - 1, manageEventsDate.getMonth(), 1))} className={styles.manageMonthNavBtn}>‹</button>
                                                <span className={styles.manageMonthYear}>{manageEventsDate.getFullYear()}</span>
                                                <button onClick={() => setManageEventsDate(new Date(manageEventsDate.getFullYear() + 1, manageEventsDate.getMonth(), 1))} className={styles.manageMonthNavBtn}>›</button>
                                            </div>
                                            <div className={styles.manageMonthGrid}>
                                                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                                                    <button key={m} onClick={() => { setManageEventsDate(new Date(manageEventsDate.getFullYear(), i, 1)); setShowManageMonthPicker(false); }}
                                                        className={`${styles.manageMonthBtn} ${i === manageEventsDate.getMonth() ? styles.manageMonthBtnActive : styles.manageMonthBtnInactive}`}>{m}</button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className={styles.manageScrollArea}>
                                {(() => {
                                    const now = new Date();
                                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                                    const fmt = (d) => { if (!d) return ''; const dt = new Date(d); return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`; };
                                    const fmtT = (d) => { if (!d) return ''; const dt = new Date(d); let h = dt.getHours(); const p = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${h}:${String(dt.getMinutes()).padStart(2, '0')} ${p}`; };

                                    const filtered = ownPageEvents.filter(e => {
                                        const d = new Date(e.start_date);
                                        const eventDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                                        const sameMonth = d.getFullYear() === manageEventsDate.getFullYear() && d.getMonth() === manageEventsDate.getMonth();
                                        return sameMonth && (activeEventTab === 'upcoming' ? eventDay >= today : eventDay < today);
                                    });

                                    if (filtered.length === 0) return <p className={styles.noEventsText}>No {activeEventTab} events for {manageEventsDate.toLocaleString('default', { month: 'long' })} {manageEventsDate.getFullYear()}.</p>;

                                    return filtered.map((event, index) => {
                                        const eventDay = new Date(new Date(event.start_date).getFullYear(), new Date(event.start_date).getMonth(), new Date(event.start_date).getDate());
                                        const isToday = eventDay.getTime() === today.getTime();
                                        const isEdit = editingEventId === event.id;
                                        const token = localStorage.getItem("access");

                                        return (
                                            <div key={event.id || index} className={styles.manageEventItemBlock}>
                                                <div className={styles.manageEventItem}>
                                                    <div className={styles.eventCardContainer}>
                                                        <div className={styles.eventCardBg} style={{ backgroundImage: `url(${event.image?.startsWith('http') ? event.image : `${API}${event.image}`})` }}>
                                                            <div className={styles.eventTimeBox}>Starts {fmt(event.start_date)} - {fmtT(event.start_date)}<br />Ends - {fmt(event.end_date)} - {fmtT(event.end_date)}</div>
                                                            <div className={styles.eventDetailsBottom}>
                                                                <div className={styles.eventTextContent}>
                                                                    <div className={styles.eventTitle}>{event.title}</div>
                                                                    <div className={styles.eventDescWrapper}><span className={styles.eventDesc}>{event.description}</span></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {isEdit && (
                                                        <div className={styles.manageEditForm}>
                                                            <input className={styles.manageEditInput} placeholder="Event title" value={editEventData.title} onChange={e => setEditEventData(p => ({ ...p, title: e.target.value }))} />
                                                            <textarea className={styles.manageEditTextarea} placeholder="Description" value={editEventData.description} onChange={e => setEditEventData(p => ({ ...p, description: e.target.value }))} />
                                                            <span className={styles.manageEditSectionLabel}>Start time</span>
                                                            <div className={styles.manageEditSegmentRow}>
                                                                {[['startDay', 31, 'DD'], ['startMonth', 12, 'MM']].map(([k, max, ph]) => (<>
                                                                    <input key={k} type="text" inputMode="numeric" placeholder={ph} maxLength="2" className={styles.manageEditSegment} value={editEventData[k]} onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v === '' || +v <= max) setEditEventData(p => ({ ...p, [k]: v })); }} />
                                                                    <span className={styles.manageEditSep}>/</span>
                                                                </>))}
                                                                <input type="text" inputMode="numeric" placeholder="YYYY" maxLength="4" className={styles.manageEditSegmentYear} value={editEventData.startYear} onChange={e => setEditEventData(p => ({ ...p, startYear: e.target.value.replace(/\D/g, '') }))} />
                                                                <span className={styles.manageEditSep}>at</span>
                                                                <input type="text" inputMode="numeric" placeholder="HH" maxLength="2" className={styles.manageEditSegment} value={editEventData.startHour} onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v === '' || +v <= 12) setEditEventData(p => ({ ...p, startHour: v })); }} />
                                                                <span className={styles.manageEditSep}>:</span>
                                                                <input type="text" inputMode="numeric" placeholder="MM" maxLength="2" className={styles.manageEditSegment} value={editEventData.startMinute} onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v === '' || +v <= 59) setEditEventData(p => ({ ...p, startMinute: v })); }} />
                                                                <div className={styles.manageEditAmPm}>
                                                                    {['AM', 'PM'].map(p => <button key={p} className={`${styles.manageEditAmPmBtn} ${editEventData.startPeriod === p ? styles.manageEditAmPmActive : ''}`} onClick={() => setEditEventData(prev => ({ ...prev, startPeriod: p }))}>{p}</button>)}
                                                                </div>
                                                            </div>
                                                            <span className={styles.manageEditSectionLabel}>End time</span>
                                                            <div className={styles.manageEditSegmentRow}>
                                                                {[['endDay', 31, 'DD'], ['endMonth', 12, 'MM']].map(([k, max, ph]) => (<>
                                                                    <input key={k} type="text" inputMode="numeric" placeholder={ph} maxLength="2" className={styles.manageEditSegment} value={editEventData[k]} onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v === '' || +v <= max) setEditEventData(p => ({ ...p, [k]: v })); }} />
                                                                    <span className={styles.manageEditSep}>/</span>
                                                                </>))}
                                                                <input type="text" inputMode="numeric" placeholder="YYYY" maxLength="4" className={styles.manageEditSegmentYear} value={editEventData.endYear} onChange={e => setEditEventData(p => ({ ...p, endYear: e.target.value.replace(/\D/g, '') }))} />
                                                                <span className={styles.manageEditSep}>at</span>
                                                                <input type="text" inputMode="numeric" placeholder="HH" maxLength="2" className={styles.manageEditSegment} value={editEventData.endHour} onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v === '' || +v <= 12) setEditEventData(p => ({ ...p, endHour: v })); }} />
                                                                <span className={styles.manageEditSep}>:</span>
                                                                <input type="text" inputMode="numeric" placeholder="MM" maxLength="2" className={styles.manageEditSegment} value={editEventData.endMinute} onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v === '' || +v <= 59) setEditEventData(p => ({ ...p, endMinute: v })); }} />
                                                                <div className={styles.manageEditAmPm}>
                                                                    {['AM', 'PM'].map(p => <button key={p} className={`${styles.manageEditAmPmBtn} ${editEventData.endPeriod === p ? styles.manageEditAmPmActive : ''}`} onClick={() => setEditEventData(prev => ({ ...prev, endPeriod: p }))}>{p}</button>)}
                                                                </div>
                                                            </div>
                                                            <div className={styles.manageEditActions}>
                                                                <button className={styles.manageEditCancelBtn} onClick={() => setEditingEventId(null)}>Cancel</button>
                                                                <button className={styles.manageEditSaveBtn} onClick={async () => {
                                                                    const toISO = (d, mo, y, h, mi, p) => { let hr = parseInt(h); if (p === 'PM' && hr !== 12) hr += 12; if (p === 'AM' && hr === 12) hr = 0; return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}T${String(hr).padStart(2, '0')}:${String(mi).padStart(2, '0')}:00`; };
                                                                    try {
                                                                        const res = await fetch(`${API}/api/events/${event.id}/update/`, {
                                                                            method: 'PATCH',
                                                                            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                                                                            body: JSON.stringify({
                                                                                title: editEventData.title,
                                                                                description: editEventData.description,
                                                                                start_date: toISO(editEventData.startDay, editEventData.startMonth, editEventData.startYear, editEventData.startHour, editEventData.startMinute, editEventData.startPeriod),
                                                                                end_date: toISO(editEventData.endDay, editEventData.endMonth, editEventData.endYear, editEventData.endHour, editEventData.endMinute, editEventData.endPeriod)
                                                                            })
                                                                        });
                                                                        if (res.ok) {
                                                                            const updated = await res.json();
                                                                            setOwnPageEvents(prev => prev.map(e => e.id === event.id ? { ...e, ...updated } : e));
                                                                            setEditingEventId(null);
                                                                        }
                                                                    } catch (e) { console.error(e); }
                                                                }}>Save</button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className={styles.manageActionsRow} style={activeEventTab === 'history' ? { justifyContent: 'center' } : {}}>
                                                        <button className={styles.manageActionBtnDelete} onClick={() => setDeleteEventPopup(event)}>
                                                            <img src={Bin} alt="delete" className={`${styles.manageActionIcon} ${styles.iconRed}`} /> Delete
                                                        </button>
                                                        {activeEventTab === 'upcoming' && (
                                                            <>
                                                                <div className={styles.manageVerticalLine} />
                                                                <button
                                                                    className={styles.manageActionBtnUpdate}
                                                                    disabled={isToday}
                                                                    style={isToday ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                                                                    onClick={() => {
                                                                        if (isToday) return;
                                                                        const seg = (iso) => { if (!iso) return { d: '', mo: '', y: '', h: '', mi: '', p: 'AM' }; const dt = new Date(iso); let h = dt.getHours(); const p = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return { d: String(dt.getDate()).padStart(2, '0'), mo: String(dt.getMonth() + 1).padStart(2, '0'), y: String(dt.getFullYear()), h: String(h).padStart(2, '0'), mi: String(dt.getMinutes()).padStart(2, '0'), p }; };
                                                                        const s = seg(event.start_date), e = seg(event.end_date);
                                                                        setEditingEventId(event.id);
                                                                        setEditEventData({ title: event.title || '', description: event.description || '', startDay: s.d, startMonth: s.mo, startYear: s.y, startHour: s.h, startMinute: s.mi, startPeriod: s.p, endDay: e.d, endMonth: e.mo, endYear: e.y, endHour: e.h, endMinute: e.mi, endPeriod: e.p });
                                                                    }}
                                                                >
                                                                    <img src={EditIcon} alt="update" className={`${styles.manageActionIcon} ${styles.iconWhite}`} />
                                                                    {isToday ? "Today's event" : "Update"}
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                {index !== filtered.length - 1 && <div className={styles.eventItemDivider} />}
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

            {/* Delete event confirmation */}
            {deleteEventPopup && createPortal(
                <div className={styles.deleteEventOverlay} onClick={() => setDeleteEventPopup(null)}>
                    <div className={styles.deleteEventModal} onClick={e => e.stopPropagation()}>
                        <h3 className={styles.deleteEventTitle}>Delete Event</h3>
                        <p className={styles.deleteEventDesc}>Are you sure you want to delete <strong>"{deleteEventPopup.title}"</strong>? This can't be undone.</p>
                        <div className={styles.deleteEventActions}>
                            <button className={styles.deleteEventCancelBtn} onClick={() => setDeleteEventPopup(null)}>Cancel</button>
                            <button className={styles.deleteEventConfirmBtn} onClick={async () => {
                                const token = localStorage.getItem("access");
                                try {
                                    const res = await fetch(`${API}/api/events/${deleteEventPopup.id}/delete/`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                                    if (res.ok) { setOwnPageEvents(prev => prev.filter(e => e.id !== deleteEventPopup.id)); setDeleteEventPopup(null); }
                                } catch (e) { console.error(e); }
                            }}>Yes, Delete</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Checkout modal */}
            {isCheckoutModalOpen && createPortal(
                <div className={styles.checkoutModalOverlay} onClick={() => setIsCheckoutModalOpen(false)}>
                    <div className={styles.checkoutModalContent} onClick={e => e.stopPropagation()}>
                        <h2 style={{ color: 'white', marginTop: 0, marginBottom: '24px', fontSize: '1.5rem' }}>Checkout</h2>
                        <div className={styles.checkoutInputGroup}>
                            <label className={styles.checkoutLabel}>Name on Card</label>
                            <input type="text" className={styles.checkoutInput} placeholder="John Doe" />
                        </div>
                        <div className={styles.checkoutInputGroup}>
                            <label className={styles.checkoutLabel}>Card Number</label>
                            <input type="text" className={styles.checkoutInput} placeholder="0000 0000 0000 0000" />
                        </div>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <div className={styles.checkoutInputGroup} style={{ flex: 1 }}>
                                <label className={styles.checkoutLabel}>Expiry Date</label>
                                <input type="text" className={styles.checkoutInput} placeholder="MM/YY" />
                            </div>
                            <div className={styles.checkoutInputGroup} style={{ flex: 1 }}>
                                <label className={styles.checkoutLabel}>CVC</label>
                                *   <input type="text" className={styles.checkoutInput} placeholder="123" />
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                            <button className={styles.checkoutCancelBtn} onClick={() => setIsCheckoutModalOpen(false)}>Cancel</button>
                            <button className={styles.checkoutSubmitBtn} onClick={async () => {
                                const token = localStorage.getItem("access");
                                try {
                                    const res = await fetch(`${API}/api/events/promotions/checkout/`, {
                                        method: "POST",
                                        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                            items: promoCart.map(item => ({
                                                event_id: item.eventId,
                                                duration: item.label,
                                                cost: item.cost,
                                            }))
                                        })
                                    });
                                    if (res.ok) {
                                        setPromoCart([]);
                                        setIsCheckoutModalOpen(false);
                                    }
                                } catch (err) { console.error("Checkout error:", err); }
                            }}>Pay Now</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}