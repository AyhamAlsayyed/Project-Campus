import styles from './universities.module.css'
import Header from '../../components/pagelayout/header/header'
import SidebarNav from '../../components/pagelayout/sidebarnav/sideBarNav'

import { Search, ChevronRight, ChevronLeft, Calendar } from 'lucide-react'
import PtukLogo from '../../Assets/icons/Ptuk.jpg'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import Events from '../../Assets/icons/event.png';
import ArrowRight from '../../Assets/icons/arrow-right.png';
import ArrowLeft from '../../Assets/icons/arrow-left.png';
export default function Universities() {
    const [theme, setTheme] = useState("dark");
    const [user, setUser] = useState(null);
    const [userError, setUserError] = useState("");
    const [newsIndex, setNewsIndex] = useState(0);
    const [eventIndex, setEventIndex] = useState(0);
    const [searchTerm, setSearchTerm] = useState('')
    const [doctors, setDoctors] = useState([]);
    const [news, setNews] = useState([]);
    const [popupItem, setPopupItem] = useState(null);
    const navigate = useNavigate();
    const [univData, setUnivData] = useState(null);
    const [events, setEvents] = useState([]);
    const API = "http://localhost:8000";

    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem("access");
            const headers = {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            };

            try {
                // We use Promise.all to fire all requests at once for better performance
                const [newsRes, eventsRes, doctorsRes, userRes, univRes] = await Promise.all([
                    fetch(`${API}/api/university/news/`, { headers }),
                    fetch(`${API}/api/university/events/`, { headers }),
                    fetch(`${API}/api/university/doctors/`, { headers }),
                    fetch(`${API}/api/auth/me/`, { headers }),
                    fetch(`${API}/api/university/`, { headers })
                ]);

                // 1. Set University Info (New)
                if (univRes.ok) {
                    const univData = await univRes.json();
                    console.log("univData:", univData);
                    setUnivData(univData);
                }

                // 2. Set News
                if (newsRes.ok) {
                    const newsData = await newsRes.json();
                    setNews(newsData);
                }

                // 3. Set Events
                if (eventsRes.ok) {
                    const eventsData = await eventsRes.json();
                    setEvents(eventsData);
                }

                // 4. Set Doctors/Teachers
                if (doctorsRes.ok) {
                    const doctorsData = await doctorsRes.json();
                    setDoctors(doctorsData);
                }

                // 5. Set User Profile
                if (userRes.ok) {
                    const userData = await userRes.json();
                    setUser(userData);
                } else {
                    console.warn("User profile could not be fetched.");
                }

            } catch (err) {
                console.error("Network or parsing error on Universities page:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);
    const currentNews = news[newsIndex];
    const currentEvent = events[eventIndex];

    const filteredDoctors = doctors.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const nextNews = () => setNewsIndex((prev) => (prev + 1) % news.length);
    const prevNews = () => setNewsIndex((prev) => (prev === 0 ? news.length - 1 : prev - 1));
    const nextEvent = () => setEventIndex((prev) => (prev + 1) % events.length);
    const toggleTheme = () => setTheme(prev => prev === "light" ? "dark" : "light")
    return (
        <div className={styles.darkContainer}>
            <div className={`${styles.header} ${styles.page}`}>
                <Header theme={theme} toggleTheme={toggleTheme} user={user} />
            </div>

            <div className={`${styles.content} ${styles.page}`}>
                <SidebarNav />

                <div className={styles.universityInfo}>

                    {/* ── University Header ── */}
                    <div
                        className={styles.universityHeader}

                    >
                        <img
                            src={univData?.logo || PtukLogo}
                            alt="University Logo"
                            className={styles.univLogo}
                            onClick={() => navigate(`/page/${univData?.page_id}`)}
                            style={{ cursor: 'pointer' }}
                        />
                        <div className={styles.univTextContainer}>
                            <h2 className={styles.univEnglish}>{univData?.name || "Loading..."}</h2>
                            <h1 className={styles.univArabic}>{univData?.name_arabic || ""}</h1>
                            <div className={styles.branch}>
                                <span className={styles.univBranch}>{univData?.branch || "Main Branch"}</span>
                                <div className={styles.line} />
                            </div>


                        </div>
                    </div>

                    {/* ── Latest News ── */}
                    <div className={styles.latestNews}>
                        <div className={styles.innerContainer}>
                            <h2 className={styles.sectionTitle}>LATEST NEWS</h2>

                            <div className={styles.newsImageWrapper}>
                                <img
                                    src={currentNews?.img?.startsWith("http")
                                        ? currentNews.img
                                        : `${API}${currentNews?.img}`
                                    }
                                    alt="University News"
                                    className={styles.newsBgImage}
                                />
                                {currentNews && (
                                    <div className={styles.newsOverlay}>
                                        <div className={styles.newsTextContent}>
                                            <p className={styles.newsDate}>{currentNews.date}</p>
                                            <h3 className={styles.newsMainTitle}>{currentNews.title}</h3>
                                            <p className={styles.newsDesc}>{currentNews.desc}</p>
                                        </div>
                                        <a className={styles.readMore}
                                            onClick={(e) => { e.preventDefault(); setPopupItem({ title: currentNews.title, description: currentNews.desc }); }}
                                            style={{ cursor: "pointer" }}>read more</a>
                                    </div>
                                )}
                            </div>



                        </div>

                    </div>
                    {news.length > 1 && (
                        <div className={styles.sliderControls} style={{ marginTop: "-50px" }}>
                            <button className={styles.arrowBtn} onClick={() => setNewsIndex(p => p === 0 ? news.length - 1 : p - 1)}>
                                <img src={ArrowLeft} alt="prev" style={{ width: 18, height: 18, filter: "brightness(0) invert(1)" }} />
                            </button>
                            <div className={styles.dots}>
                                {news.map((_, idx) => (
                                    <span key={idx} className={`${styles.dot} ${idx === newsIndex ? styles.activeDot : ''}`} onClick={() => setNewsIndex(idx)} />
                                ))}
                            </div>
                            <button className={styles.arrowBtn} onClick={() => setNewsIndex(p => (p + 1) % news.length)}>
                                <img src={ArrowRight} alt="next" style={{ width: 18, height: 18, filter: "brightness(0) invert(1)" }} />
                            </button>
                        </div>
                    )}

                </div>

                {/* ── RIGHT COLUMN ── */}
                <div className={styles.rightSection}>

                    {/* Doctors & Teachers */}
                    <div className={styles.rightCardWrapper}>
                        <div className={styles.pill}>Doctors and Teachers</div>
                        <div className={styles.rightCard}>

                            <div className={styles.searchContainer}>
                                <Search size={16} className={styles.searchIcon} />
                                <input
                                    type="text"
                                    placeholder="Searching for someone?"
                                    className={styles.searchBar}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className={styles.scrollableList}>
                                {filteredDoctors.map(doc => (
                                    <div key={doc.id}
                                        className={styles.doctorItem}
                                        onClick={() => navigate(`/profile/${doc.id}`)}
                                        style={{ cursor: "pointer" }}>
                                        <div className={styles.docAvatar}>
                                            {/* ONLY CHANGE: show real avatar if available, fallback to original SVG */}
                                            {doc.avatar || doc.profile_picture ? (
                                                <img
                                                    src={(doc.avatar || doc.profile_picture).startsWith("http")
                                                        ? (doc.avatar || doc.profile_picture)
                                                        : `${API}${doc.avatar || doc.profile_picture}`}
                                                    alt={doc.name}
                                                    style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
                                                />
                                            ) : (
                                                <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26">
                                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                                </svg>
                                            )}
                                        </div>
                                        {/* Everything below is exactly the same as before */}
                                        <div className={styles.docInfo}>
                                            <div className={styles.docNameRow}>
                                                <h4>{doc.name}</h4>
                                                {doc.tag && <span className={styles.docTag}>{doc.tag}</span>}
                                            </div>
                                            {doc.desc && <p>{doc.desc}</p>}
                                        </div>
                                        <ChevronRight size={16} className={styles.docArrow} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Related Events */}
                    {/* Related Events */}
                    <div className={styles.rightCardWrapper}>
                        <div className={styles.rightCard}>
                            {/* Header now sits INSIDE the card */}
                            <div className={styles.relatedEventsHeader}>
                                <img src={Events} alt="events" style={{ width: 30, height: 30 }} />
                                <span className={styles.relatedEventsTitle}>Related events</span>
                            </div>

                            <div className={styles.eventCard}>
                                {currentEvent?.img && (
                                    <img
                                        src={currentEvent.img.startsWith("http") ? currentEvent.img : `${API}${currentEvent.img}`}
                                        alt="Event"
                                        className={styles.eventBg}
                                    />
                                )}
                                <div className={styles.eventOverlay}>
                                    <div className={styles.eventInfo}>
                                        <h4>{currentEvent?.title || "No events yet"}</h4>
                                        {currentEvent?.date && <p style={{ fontSize: "0.75rem", opacity: 0.7 }}>{currentEvent.date}</p>}
                                        {currentEvent?.desc && (
                                            <p>
                                                {currentEvent.desc.length > 30
                                                    ? <>{currentEvent.desc.substring(0, 30)}... <span
                                                        className={styles.readMore}
                                                        onClick={() => setPopupItem({ title: currentEvent.title, description: currentEvent.desc })}
                                                    >read more</span></>
                                                    : currentEvent.desc
                                                }
                                            </p>
                                        )}
                                        {currentEvent?.location && <p>📍 {currentEvent.location}</p>}
                                    </div>
                                    {currentEvent && (
                                        <button
                                            className={styles.viewBtn}
                                            onClick={() => navigate('/events', { state: { highlightId: currentEvent.id } })}
                                        >
                                            View
                                        </button>
                                    )}
                                </div>
                            </div>


                        </div>
                        {events.length > 1 && (
                            <div className={styles.eventSliderControls}>
                                <button className={styles.arrowBtn} onClick={() => setEventIndex(p => p === 0 ? events.length - 1 : p - 1)}>
                                    <img src={ArrowLeft} alt="prev" style={{ width: 18, height: 18, filter: "brightness(0) invert(1)" }} />
                                </button>
                                <div className={styles.dots}>
                                    {events.map((_, idx) => (
                                        <span
                                            key={idx}
                                            className={`${styles.dot} ${idx === eventIndex ? styles.activeDot : ''}`}
                                            onClick={() => setEventIndex(idx)}
                                        />
                                    ))}
                                </div>
                                <button className={styles.arrowBtn} onClick={() => setEventIndex(p => (p + 1) % events.length)}>
                                    <img src={ArrowRight} alt="next" style={{ width: 18, height: 18, filter: "brightness(0) invert(1)" }} />
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            </div>
            {popupItem && createPortal(
                <div
                    style={{
                        position: "fixed", inset: 0, zIndex: 9999,
                        background: "rgba(0,0,0,0.6)", display: "flex",
                        alignItems: "center", justifyContent: "center"
                    }}
                    onClick={() => setPopupItem(null)}
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
                            onClick={() => setPopupItem(null)}
                            style={{
                                position: "absolute", top: 14, right: 14,
                                background: "none", border: "none", color: "white",
                                fontSize: "1.1rem", cursor: "pointer"
                            }}
                        >✕</button>
                        <h3 style={{ color: "white", margin: "0 0 12px" }}>{popupItem.title}</h3>
                        <p style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.6, margin: 0 }}>
                            {popupItem.description}
                        </p>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}