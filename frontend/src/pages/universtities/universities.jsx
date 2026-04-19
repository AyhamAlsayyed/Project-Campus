import styles from './universities.module.css'
import Header from '../../components/pagelayout/header/header'
import SidebarNav from '../../components/pagelayout/sidebarnav/sideBarNav'
import { useState, useEffect } from 'react'
import { Search, ChevronRight, ChevronLeft, Calendar } from 'lucide-react'
import PtukLogo from '../../Assets/icons/Ptuk.jpg'
export default function Universities() {
    const [theme, setTheme] = useState("dark");
    const [user, setUser] = useState(null);
    const [userError, setUserError] = useState("");
    const [newsIndex, setNewsIndex] = useState(0);
    const [eventIndex, setEventIndex] = useState(0);
    const [searchTerm, setSearchTerm] = useState('')
    const [doctors, setDoctors] = useState([]);
    const [news, setNews] = useState([]);
    const [events, setEvents] = useState([]);
    const API = "http://localhost:8000";

    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const token = localStorage.getItem("access");

        const fetchData = async () => {
            const token = localStorage.getItem("access");

            try {
                const headers = {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                };

                const [newsRes, eventsRes, doctorsRes] = await Promise.all([
                    fetch("http://localhost:8000/api/university/news/", { headers }),
                    fetch("http://localhost:8000/api/university/events/", { headers }),
                    fetch("http://localhost:8000/api/university/doctors/", { headers })
                ]);

                const newsData = await newsRes.json();
                const eventsData = await eventsRes.json();
                const doctorsData = await doctorsRes.json();

                setNews(newsData);
                setEvents(eventsData);
                setDoctors(doctorsData);

            } catch (err) {
                console.error("Error fetching university data:", err);
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
                    <div className={styles.universityHeader}>
                        <img
                            src={PtukLogo}
                            alt="PTU Logo"
                            className={styles.univLogo}
                        />
                        <div className={styles.univTextContainer}>
                            <h2 className={styles.univEnglish}>Palestine Technical University - Kadoorie</h2>
                            <h1 className={styles.univArabic}>جامعة فلسطين التقنية خضوري</h1>
                            <div className={styles.branch}>
                                <span className={styles.univBranch}>Ramallah Branch</span>
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
                                        <a href="#readmore" className={styles.readMore}>read more</a>
                                    </div>
                                )}


                                <div className={styles.sliderControls}>
                                    <button className={styles.arrowBtn} onClick={() => setNewsIndex(p => p === 0 ? news.length - 1 : p - 1)}>
                                        <ChevronLeft size={18} />
                                    </button>
                                    <div className={styles.dots}>
                                        {news.map((_, idx) => (
                                            <span
                                                key={idx}
                                                className={`${styles.dot} ${idx === newsIndex ? styles.activeDot : ''}`}
                                                onClick={() => setNewsIndex(idx)}
                                            />
                                        ))}
                                    </div>
                                    <button className={styles.arrowBtn} onClick={() => setNewsIndex(p => (p + 1) % news.length)}>
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
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
                                    <div key={doc.id} className={styles.doctorItem}>
                                        <div className={styles.docAvatar}>
                                            <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26">
                                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                            </svg>
                                        </div>
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
                    <div className={styles.rightCardWrapper}>
                        <div className={styles.pill}>
                            <Calendar size={14} style={{ color: '#d81b60', marginRight: '6px' }} />
                            Related events
                        </div>
                        <div className={styles.rightCard}>
                            <div className={styles.eventCard}>
                                <img
                                    src={currentEvent?.img}
                                    alt="Event"
                                    className={styles.eventBg}
                                />
                                <div className={styles.eventOverlay}>
                                    <div className={styles.eventInfo}>
                                        <h4>{currentEvent?.title}</h4>
                                        <p>{currentEvent?.desc}</p>
                                    </div>
                                    <button className={styles.viewBtn}>View</button>
                                </div>
                            </div>

                            {/* Event slider controls */}
                            <div className={styles.eventSliderControls}>
                                <button className={styles.arrowBtn} onClick={() => setEventIndex(p => p === 0 ? events.length - 1 : p - 1)}>
                                    <ChevronLeft size={16} />
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
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}