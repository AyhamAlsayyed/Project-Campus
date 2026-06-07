import styles from './eventsPage.module.css';
import { useCreateEvent } from '../../components/createEvent/useCreateEvent';
import CreateEventForm from '../../components/createEvent/CreateEventForm';
import CreateEventRightSidebar from '../../components/createEvent/CreateEventRightSidebar';
import Bin from '../../Assets/icons/bin.png';
import EditIcon from '../../Assets/icons/edit.png';
import Header from '../../components/pagelayout/header/header';
import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import VerifiedBadge from '../../Assets/icons/verified-mark.png';
import BellOn from '../../Assets/icons/notifications.png';
import BellOff from '../../Assets/icons/mute.png';
import ArrowLeftIcon from '../../Assets/icons/arrow-left.png';
import AdIcon from '../../Assets/icons/ad.png';
import { createPortal } from 'react-dom';

export default function EventsPage() {
    const API = "http://localhost:8000";
    const [user, setUser] = useState(null);
    const [theme, setTheme] = useState("dark");
    const toggleTheme = () => setTheme(prev => prev === "light" ? "dark" : "light");
    const [events, setEvents] = useState([]);
    const [recommendedEvents, setRecommendedEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reminders, setReminders] = useState({});
    const [popupEvent, setPopupEvent] = useState(null);
    const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
    const [promoDurationIdx, setPromoDurationIdx] = useState(2);
    const [showManageEvents, setShowManageEvents] = useState(false);
    const [activeEventTab, setActiveEventTab] = useState('upcoming');
    const [manageEventsDate, setManageEventsDate] = useState(new Date());
    const [showManageMonthPicker, setShowManageMonthPicker] = useState(false);
    const [ownPageEvents, setOwnPageEvents] = useState([]);
    const [editingEventId, setEditingEventId] = useState(null);
    const [editEventData, setEditEventData] = useState({
        title: '', description: '',
        startDay: '', startMonth: '', startYear: '',
        startHour: '', startMinute: '', startPeriod: 'AM',
        endDay: '', endMonth: '', endYear: '',
        endHour: '', endMinute: '', endPeriod: 'AM',
    });
    const [deleteEventPopup, setDeleteEventPopup] = useState(null);
    const [showCreateEvent, setShowCreateEvent] = useState(false);

    const createEvent = useCreateEvent({
        onSuccess: (eventId) => {
            setShowCreateEvent(false);
            setHighlightId(eventId);
        }
    });

    const location = useLocation();
    const navigate = useNavigate();
    const [pageNotifyStatus, setPageNotifyStatus] = useState({});
    const [highlightId, setHighlightId] = useState(location.state?.highlightId || null);

    const durationOptions = [
        { label: '1 week', cost: 4.99 },
        { label: '1 month', cost: 9.99 },
        { label: '3 months', cost: 14.99 },
        { label: '6 months', cost: 24.99 },
        { label: '1 year', cost: 49.99 }
    ];
    const loadOwnPageEvents = async () => {
        const token = localStorage.getItem("access");
        try {
            const res = await fetch(`${API}/api/pages/${user?.id}/events/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setOwnPageEvents(Array.isArray(data) ? data : []);
            }
        } catch (e) { console.error(e); }
    };

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
            if (!res.ok) {
                setReminders(prev => ({ ...prev, [eventId]: isSet }));
            }
        } catch {
            setReminders(prev => ({ ...prev, [eventId]: isSet }));
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem("access");
            const headers = {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            };

            try {
                const [eventsRes, userRes] = await Promise.all([
                    fetch(`${API}/api/events/`, { headers }),
                    fetch(`${API}/api/auth/me/`, { headers })
                ]);

                if (userRes.ok) {
                    const userData = await userRes.json();


                    if (userData.role === 'university' || localStorage.getItem('user_type') === 'university') {
                        const pageRes = await fetch(`${API}/api/pages/${userData.id}/`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        if (pageRes.ok) {
                            const pageData = await pageRes.json();
                            userData.avatar = pageData.profile_image;
                        }
                    }

                    setUser(userData);
                    if (userData.role === 'university' || localStorage.getItem('user_type') === 'university' || localStorage.getItem('user_type') === 'page') {
                        const evRes = await fetch(`${API}/api/pages/${userData.id}/events/`, {
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
                        banner: event.banner
                            ? (event.banner.startsWith("http") ? event.banner : `${API}${event.banner}`)
                            : "",
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

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const handleFollow = async (eventId, pageId) => {
        const token = localStorage.getItem("access");
        const event = events.find(e => e.id === eventId) || recommendedEvents.find(e => e.id === eventId);
        if (!event) return;
        const wasFollowed = event.isFollowed;

        setEvents(prev => prev.map(e =>
            e.id === eventId ? { ...e, isFollowed: !e.isFollowed } : e
        ));
        setRecommendedEvents(prev => prev.map(e =>
            e.id === eventId ? { ...e, isFollowed: !e.isFollowed } : e
        ));

        try {
            const res = await fetch(`${API}/api/pages/${pageId}/follow/`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) {
                setEvents(prev => prev.map(e =>
                    e.id === eventId ? { ...e, isFollowed: wasFollowed } : e
                ));
                setRecommendedEvents(prev => prev.map(e =>
                    e.id === eventId ? { ...e, isFollowed: wasFollowed } : e
                ));
            }
        } catch {
            setEvents(prev => prev.map(e =>
                e.id === eventId ? { ...e, isFollowed: wasFollowed } : e
            ));
        }
    };

    const isUserPage = localStorage.getItem("user_type") === "page";

    return (
        <div className={styles.darkContainer}>
            <div className={`${styles.header} ${styles.page}`}>
                <Header theme={theme} toggleTheme={toggleTheme} user={user} />
            </div>
            <div className={`${styles.content} ${styles.page}`}>
                <SideBarNav />
                {showCreateEvent ? (

                    <div className={styles.createEventContent}>
                        <div className={styles.createEventProfileContent}>
                            <div className={styles.createEventProfileCard}>
                                <CreateEventForm
                                    {...createEvent.formProps}
                                    onBack={() => setShowCreateEvent(false)}
                                />
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
                                            {events.slice(0, 2).map((event) => (
                                                <div key={event.id} className={styles.yourEventCardWrapper}>
                                                    <img
                                                        src={event.banner || event.avatar}
                                                        className={styles.yourEventBannerImg}
                                                        alt="Event Banner"
                                                    />
                                                    <div className={styles.yourEventDateBadge}>
                                                        <p>Starts {formatDate(event.startDate)}</p>
                                                        <p>Ends {formatDate(event.endDate)}</p>
                                                    </div>
                                                    <div className={styles.yourEventBottomOverlay}>
                                                        <h3>{event.title}</h3>
                                                        <p>
                                                            {event.description?.substring(0, 80)}
                                                            {event.description?.length > 80 && (
                                                                <span className={styles.yourEventReadMore} onClick={() => setPopupEvent(event)}>
                                                                    {' '}read more
                                                                </span>
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
                                            <div
                                                className={styles.orgInfo}
                                                onClick={() => navigate(`/page/${event.pageId}`)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <img src={event.avatar} alt="Logo" className={styles.avatar} />
                                                <div className={styles.orgText}>
                                                    <div className={styles.orgNameRow}>
                                                        <h3>{event.orgName}</h3>
                                                        <img
                                                            src={VerifiedBadge}
                                                            alt="verified"
                                                            style={{ width: 18, height: 18, filter: 'brightness(0) invert(1)', marginLeft: 3 }}
                                                        />
                                                    </div>
                                                    <p>{event.pageType}</p>
                                                </div>
                                            </div>
                                            <div className={styles.headerActions}>
                                                {event.isFollowed && (
                                                    <button
                                                        className={styles.bellBtn}
                                                        onClick={() => handlePageNotification(event.pageId)}
                                                    >
                                                        <img
                                                            src={pageNotifyStatus[event.pageId] ? BellOn : BellOff}
                                                            alt="notifications"
                                                            width={pageNotifyStatus[event.pageId] ? 20 : 20}
                                                            height={pageNotifyStatus[event.pageId] ? 24 : 20}
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
                                                <img
                                                    src={event.banner}
                                                    className={styles.bannerImg}
                                                    alt="Event Banner"
                                                />
                                                <div className={styles.dateWidget}>
                                                    <div className={styles.dateText}>
                                                        <p>Starts {formatDate(event.startDate)}</p>
                                                        <p>Ends — {formatDate(event.endDate)}</p>
                                                    </div>
                                                    <button
                                                        className={styles.reminderBtn}
                                                        onClick={() => handleReminder(event.id)}
                                                        style={{
                                                            background: reminders[event.id]
                                                                ? "rgba(255,255,255,0.2)"
                                                                : "#7b1fa2",
                                                            transition: "background 0.2s"
                                                        }}
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
                                        <div className={styles.pendingText}>1 Pending checkout</div>
                                        <div className={styles.onHoldDivider}></div>

                                        <div className={styles.checkoutList}>
                                            {events.slice(0, 2).map(item => (
                                                <div key={item.id} className={styles.checkoutItemWrap}>
                                                    <div className={styles.checkoutCard}>
                                                        <img
                                                            src={item.banner || item.avatar}
                                                            alt={item.title}
                                                            className={styles.checkoutBannerImg}
                                                        />
                                                        <div className={styles.checkoutOverlay}>
                                                            <div className={styles.checkoutOverlayLeft}>
                                                                <h4 className={styles.checkoutTitle}>{item.title}</h4>
                                                                <p className={styles.checkoutDesc}>
                                                                    {item.description?.substring(0, 50)}...
                                                                </p>
                                                            </div>
                                                            <button className={styles.detailsBtn}>Details</button>
                                                        </div>
                                                    </div>
                                                    <div className={styles.checkoutSubInfo}>
                                                        <span>Details: 3 months promotion plan</span>
                                                        <span>Price: $14.99</span>
                                                    </div>
                                                    <div className={styles.onHoldDivider}></div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className={styles.checkoutBottom}>
                                            <span className={styles.totalText}>Total: $14.99</span>
                                            <button className={styles.proceedBtn}>Proceed to check-out</button>
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
                                    <div className={styles.pill} style={{left:"60px"}}>RECOMMENDED</div>
                                    <div className={styles.rightCard}>
                                        <div className={styles.rightList}>
                                            {recommendedEvents.map((rec, index) => (
                                                <div key={rec.id} className={styles.recItemWrapper}>
                                                    <div className={styles.recCard}>
                                                        <img src={rec.banner} className={styles.recBanner} alt="" />
                                                        <div className={styles.recOverlay}>
                                                            <div className={styles.recHeader}>
                                                                <div className={styles.recOrgInfo}
                                                                    onClick={() => navigate(`/profile/${rec.pageId}`)}
                                                                    style={{ cursor: 'pointer' }}
                                                                >
                                                                    <img src={rec.avatar} className={styles.recAvatar} alt="" />
                                                                    <div className={styles.recOrgText}>
                                                                        <div className={styles.recNameRow}>
                                                                            <h4>{rec.orgName}</h4>
                                                                            <img
                                                                                src={VerifiedBadge}
                                                                                alt="verified"
                                                                                style={{ width: 18, height: 18, filter: 'brightness(0) invert(1)', marginLeft: 3 }}
                                                                            />
                                                                        </div>
                                                                        <p>{rec.pageType}</p>
                                                                    </div>
                                                                </div>

                                                                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                                                    {rec.isFollowed && (
                                                                        <button
                                                                            className={styles.bellBtn}
                                                                            onClick={() => handlePageNotification(rec.pageId)}
                                                                            style={{ width: 28, height: 28 }}
                                                                        >
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
                                                                        className={rec.isFollowed ? styles.followedBtnSmall : styles.followBtnSmall}
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
                                                                            <span style={{
                                                                                display: "inline-block",
                                                                                whiteSpace: "nowrap",
                                                                                animation: "marquee 8s linear infinite",
                                                                                color: "white",
                                                                                fontSize: "1.1rem",
                                                                                fontWeight: 700
                                                                            }}>{rec.title}</span>
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

            {/* Existing Generic Popup */}
            {popupEvent && createPortal(
                <div
                    style={{
                        position: "fixed", inset: 0, zIndex: 9999,
                        background: "rgba(0,0,0,0.6)", display: "flex",
                        alignItems: "center", justifyContent: "center"
                    }}
                    onClick={() => setPopupEvent(null)}
                >
                    <div
                        style={{
                            background: "#2a2a2a", borderRadius: 20, padding: 28,
                            maxWidth: 480, width: "90%", position: "relative",
                            border: "1px solid rgba(255,255,255,0.08)"
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setPopupEvent(null)}
                            style={{
                                position: "absolute", top: 14, right: 14,
                                background: "none", border: "none", color: "white",
                                fontSize: "1.1rem", cursor: "pointer"
                            }}
                        >✕</button>
                        <h3 style={{ color: "white", margin: "0 0 12px" }}>{popupEvent.title}</h3>
                        <p style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.6, margin: 0 }}>
                            {popupEvent.description}
                        </p>
                    </div>
                </div>,
                document.body
            )}

            {/* Events Promotion Modal */}
            {isPromoModalOpen && createPortal(
                <div className={styles.promoModalOverlay} onClick={() => setIsPromoModalOpen(false)}>
                    <div className={styles.promoModalContent} onClick={e => e.stopPropagation()}>

                        {/* Header */}
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
                                <button className={styles.pmDoneBtn} onClick={() => setIsPromoModalOpen(false)}>Done</button>
                            </div>
                        </div>

                        {/* Middle Content */}
                        <div className={styles.pmBody}>
                            <div className={styles.pmDividerSection}>
                                <div className={styles.pmDivider}></div>
                                <p className={styles.pmSubText}>
                                    Choose a promotion for your community ad by that, your community will start to appear more for users!
                                </p>
                            </div>

                            <h3 className={styles.pmSectionTitle}>Select duration</h3>

                            {/* Draggable/Clickable Stepped Slider */}
                            <div className={styles.pmSliderWrapper}>
                                <input
                                    type="range"
                                    min="0"
                                    max={durationOptions.length - 1}
                                    step="1"
                                    value={promoDurationIdx}
                                    onChange={(e) => setPromoDurationIdx(Number(e.target.value))}
                                    className={styles.pmInvisibleSlider}
                                />
                                <div className={styles.pmSliderTrack}>
                                    <div
                                        className={styles.pmSliderFill}
                                        style={{ width: `${(promoDurationIdx / (durationOptions.length - 1)) * 100}%` }}
                                    ></div>
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

                            {/* Total Cost */}
                            <div className={styles.pmTotalCost}>
                                Total cost: <span className={styles.pmCostValue}>${durationOptions[promoDurationIdx].cost.toFixed(2)}</span>
                            </div>
                        </div>

                    </div>
                </div>,
                document.body
            )}

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
                                    const filtered = ownPageEvents.filter(e => {
                                        const d = new Date(e.start_date);
                                        const eventDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                                        const sameMonth = d.getFullYear() === manageEventsDate.getFullYear() && d.getMonth() === manageEventsDate.getMonth();
                                        return sameMonth && (activeEventTab === 'upcoming' ? eventDay >= today : eventDay < today);
                                    });
                                    if (filtered.length === 0) return <p className={styles.noEventsText}>No {activeEventTab} events for {manageEventsDate.toLocaleString('default', { month: 'long' })} {manageEventsDate.getFullYear()}.</p>;

                                    const fmt = (d) => { if (!d) return ''; const dt = new Date(d); return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`; };
                                    const fmtT = (d) => { if (!d) return ''; const dt = new Date(d); let h = dt.getHours(), m = dt.getMinutes(); const p = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${h}:${String(m).padStart(2, '0')} ${p}`; };

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
                                                                        const res = await fetch(`${API}/api/events/${event.id}/update/`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ title: editEventData.title, description: editEventData.description, start_date: toISO(editEventData.startDay, editEventData.startMonth, editEventData.startYear, editEventData.startHour, editEventData.startMinute, editEventData.startPeriod), end_date: toISO(editEventData.endDay, editEventData.endMonth, editEventData.endYear, editEventData.endHour, editEventData.endMinute, editEventData.endPeriod) }) });
                                                                        if (res.ok) { const updated = await res.json(); setOwnPageEvents(prev => prev.map(e => e.id === event.id ? { ...e, ...updated } : e)); setEditingEventId(null); }
                                                                    } catch (e) { console.error(e); }
                                                                }}>Save</button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className={styles.manageActionsRow} style={activeEventTab === 'history' ? { justifyContent: 'center' } : {}}>
                                                        <button className={styles.manageActionBtnDelete} onClick={() => setDeleteEventPopup(event)}>
                                                            <img src={Bin} alt="delete" className={`${styles.manageActionIcon} ${styles.iconRed}`} /> Delete
                                                        </button>
                                                        {activeEventTab === 'upcoming' && (<>
                                                            <div className={styles.manageVerticalLine} />
                                                            <button className={styles.manageActionBtnUpdate} disabled={isToday} style={isToday ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                                                                onClick={() => {
                                                                    if (isToday) return;
                                                                    const seg = (iso) => { if (!iso) return { d: '', mo: '', y: '', h: '', mi: '', p: 'AM' }; const dt = new Date(iso); let h = dt.getHours(); const p = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return { d: String(dt.getDate()).padStart(2, '0'), mo: String(dt.getMonth() + 1).padStart(2, '0'), y: String(dt.getFullYear()), h: String(h).padStart(2, '0'), mi: String(dt.getMinutes()).padStart(2, '0'), p }; };
                                                                    const s = seg(event.start_date), e = seg(event.end_date);
                                                                    setEditingEventId(event.id);
                                                                    setEditEventData({ title: event.title || '', description: event.description || '', startDay: s.d, startMonth: s.mo, startYear: s.y, startHour: s.h, startMinute: s.mi, startPeriod: s.p, endDay: e.d, endMonth: e.mo, endYear: e.y, endHour: e.h, endMinute: e.mi, endPeriod: e.p });
                                                                }}>
                                                                <img src={EditIcon} alt="update" className={`${styles.manageActionIcon} ${styles.iconWhite}`} />
                                                                {isToday ? "Today's event" : "Update"}
                                                            </button>
                                                        </>)}
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
        </div>
    );
}