import styles from './eventsPage.module.css';
import Header from '../../components/pagelayout/header/header';
import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav';
import { useState, useEffect } from 'react';
import VerifiedBadge from '../../Assets/icons/verified-mark.png';
import EventsIcon from '../../Assets/icons/event.png';
import { createPortal } from 'react-dom';
import API from '../../config';
import useTheme from '../../hooks/useTheme';
import DefaultBanner from '../../Assets/Pictures/default-community-banner.png';

export default function PageEventsPage() {
    const { theme, toggleTheme } = useTheme();

    const [currentUser, setCurrentUser] = useState(null);
    const [pageEvents, setPageEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [popupEvent, setPopupEvent] = useState(null);
    const [highlightId, setHighlightId] = useState(null);

    // Calendar state
    const [eventsMonth, setEventsMonth] = useState(new Date());
    const [showMonthPicker, setShowMonthPicker] = useState(false);

    const token = localStorage.getItem('access');

    // ─── data loading ────────────────────────────────────────────────────────

    useEffect(() => {
        const fetchData = async () => {
            try {
                const headers = { Authorization: `Bearer ${token}` };
                const userRes = await fetch(`${API}/api/auth/me/`, { headers });
                if (!userRes.ok) return;
                const userData = await userRes.json();
                setCurrentUser(userData);

                const pageId = userData.page_id;
                if (!pageId) return;

                const evRes = await fetch(`${API}/api/pages/${pageId}/events/`, { headers });
                if (evRes.ok) {
                    const evData = await evRes.json();
                    const now = new Date();
                    const sorted = (Array.isArray(evData) ? evData : []).sort((a, b) => {
                        const aDate = new Date(a.start_date);
                        const bDate = new Date(b.start_date);
                        const aUp = aDate >= now;
                        const bUp = bDate >= now;
                        if (aUp && !bUp) return -1;
                        if (!aUp && bUp) return 1;
                        return aDate - bDate;
                    });
                    setPageEvents(sorted);
                }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchData();
    }, []);

    // ─── highlight scroll ────────────────────────────────────────────────────

    useEffect(() => {
        if (!highlightId || pageEvents.length === 0) return;
        const el = document.getElementById(`event-${highlightId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add(styles.highlighted);
            setTimeout(() => {
                el.classList.remove(styles.highlighted);
                setHighlightId(null);
            }, 2000);
        }
    }, [highlightId, pageEvents]);

    // ─── helpers ─────────────────────────────────────────────────────────────

    const resolveImg = (url) =>
        !url ? DefaultBanner : url.startsWith('http') ? url : `${API}${url}`;

    const fmtDate = (d) => {
        if (!d) return '';
        const dt = new Date(d);
        return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
    };

    // ─── calendar derived ────────────────────────────────────────────────────

    const year = eventsMonth.getFullYear();
    const month = eventsMonth.getMonth();
    const monthName = eventsMonth.toLocaleString('default', { month: 'long' });
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const eventDays = new Set(
        pageEvents
            .map(e => {
                const d = new Date(e.start_date);
                return d.getFullYear() === year && d.getMonth() === month ? d.getDate() : null;
            })
            .filter(Boolean)
    );

    const cells = [
        ...Array(firstDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    // ─── render ──────────────────────────────────────────────────────────────

    return (
        <div className={styles.darkContainer}>
            {/* Header */}
            <div className={`${styles.header} ${styles.page}`}>
                <Header theme={theme} toggleTheme={toggleTheme} user={currentUser} />
            </div>

            <div className={`${styles.content} ${styles.page}`}>
                <SideBarNav variant="profile" currentUser={currentUser} />

                {/* ── Main content ── */}
                <div className={styles.mainContent}>
                    <h1 className={styles.title}>
                        Your <span className={styles.highlight}>EVENTS</span>
                    </h1>

                    {loading ? (
                        <p className={styles.emptyText}>Loading...</p>
                    ) : pageEvents.length === 0 ? (
                        <p className={styles.emptyText}>
                            No events yet. Head to the Events page to create one.
                        </p>
                    ) : (
                        <div className={styles.eventsContainer}>
                            {pageEvents.map(event => {
                                const bannerSrc = resolveImg(event.image || event.banner);
                                const avatarSrc = resolveImg(event.avatar);

                                return (
                                    <div
                                        key={event.id}
                                        id={`event-${event.id}`}
                                        className={styles.eventCard}
                                    >
                                        {/* Card header */}
                                        <div className={styles.cardHeader}>
                                            <div className={styles.orgInfo}>
                                                <img
                                                    src={avatarSrc}
                                                    alt="Logo"
                                                    className={styles.avatar}
                                                    onError={e => { e.currentTarget.src = DefaultBanner; }}
                                                />
                                                <div className={styles.orgText}>
                                                    <div className={styles.orgNameRow}>
                                                        <h3>{event.organization_name || currentUser?.username}</h3>
                                                        <img
                                                            src={VerifiedBadge}
                                                            alt="verified"
                                                            className={styles.verifiedIcon}
                                                            style={{ width: 18, height: 18, marginLeft: 3 }}
                                                        />
                                                    </div>
                                                    <p>{event.page_type}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Banner */}
                                        <div className={styles.bannerContainer}>
                                            <img
                                                src={bannerSrc}
                                                className={styles.bannerImg}
                                                alt="Event Banner"
                                                onError={e => { e.currentTarget.src = DefaultBanner; }}
                                            />

                                            {/* Date widget — no reminder button since it's the owner */}
                                            <div className={styles.dateWidget}>
                                                <div className={styles.dateText}>
                                                    <p>Starts {fmtDate(event.start_date)}</p>
                                                    <p>Ends — {fmtDate(event.end_date)}</p>
                                                </div>
                                            </div>

                                            {/* Overlay */}
                                            <div className={styles.bannerOverlay} style={{ pointerEvents: 'none' }}>
                                                <div className={styles.bannerContent} style={{ pointerEvents: 'auto' }}>
                                                    {event.title?.length > 20 ? (
                                                        <div className={styles.titleMarqueeWrapper}>
                                                            <span className={styles.titleMarquee}>{event.title}</span>
                                                        </div>
                                                    ) : (
                                                        <h2>{event.title}</h2>
                                                    )}
                                                    <p>
                                                        {event.description?.length > 80
                                                            ? <>
                                                                {event.description.substring(0, 80)}...{' '}
                                                                <span
                                                                    className={styles.readMore}
                                                                    onClick={e => { e.stopPropagation(); setPopupEvent(event); }}
                                                                    style={{ cursor: 'pointer' }}
                                                                >
                                                                    read more
                                                                </span>
                                                              </>
                                                            : event.description
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── Right section — Calendar ── */}
                <div className={styles.rightSection}>
                    <div className={styles.calendarWidget}>
                        <div className={styles.calendarWidgetHeader}>
                            <img src={EventsIcon} alt="events" className={styles.calendarWidgetIcon} />
                            <span className={styles.calendarWidgetTitle}>Your Events</span>
                            <span
                                onClick={() => setShowMonthPicker(p => !p)}
                                className={styles.monthToggle}
                            >
                                {monthName} {year}
                            </span>
                        </div>

                        {showMonthPicker && (
                            <div className={styles.monthPickerDropdown}>
                                <div className={styles.monthPickerNav}>
                                    <button
                                        onClick={() => setEventsMonth(new Date(year - 1, month, 1))}
                                        className={styles.monthPickerNavBtn}
                                    >‹</button>
                                    <span className={styles.monthPickerYear}>{year}</span>
                                    <button
                                        onClick={() => setEventsMonth(new Date(year + 1, month, 1))}
                                        className={styles.monthPickerNavBtn}
                                    >›</button>
                                </div>
                                <div className={styles.monthGrid}>
                                    {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                                        <button
                                            key={m}
                                            onClick={() => { setEventsMonth(new Date(year, i, 1)); setShowMonthPicker(false); }}
                                            className={`${styles.monthBtn} ${i === month ? styles.monthBtnActive : styles.monthBtnInactive}`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Day-of-week labels */}
                        <div className={styles.calendarDayLabels}>
                            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                                <span key={d} className={styles.calendarDayLabel}>{d}</span>
                            ))}
                        </div>

                        <div className={styles.calendarGrid}>
                            {cells.map((day, i) => {
                                const hasEvent = day && eventDays.has(day);
                                return (
                                    <div
                                        key={i}
                                        onClick={() => {
                                            if (!hasEvent) return;
                                            const ev = pageEvents.find(e => {
                                                const d = new Date(e.start_date);
                                                return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
                                            });
                                            if (ev) setHighlightId(ev.id);
                                        }}
                                        className={`${styles.calendarDay} ${
                                            !day
                                                ? styles.calendarDayEmpty
                                                : hasEvent
                                                    ? styles.calendarDayEvent
                                                    : styles.calendarDayNormal
                                        }`}
                                    >
                                        {day || ''}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Description popup */}
            {popupEvent && createPortal(
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => setPopupEvent(null)}
                >
                    <div
                        style={{ background: '#2a2a2a', borderRadius: 20, padding: 28, maxWidth: 480, width: '90%', position: 'relative', border: '1px solid rgba(255,255,255,0.08)' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button onClick={() => setPopupEvent(null)} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', color: 'white', fontSize: '1.1rem', cursor: 'pointer' }}>✕</button>
                        <h3 style={{ color: 'white', margin: '0 0 12px' }}>{popupEvent.title}</h3>
                        <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: 0 }}>{popupEvent.description}</p>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}