import styles from './universities.module.css'
import Header from '../../components/pagelayout/header/header'
import SidebarNav from '../../components/pagelayout/sidebarnav/sideBarNav'
import MobileHeader from '../../components/mobileHeader/mobileHeader'

import { Search, ChevronRight, ChevronLeft, Calendar, MoreHorizontal, Clock, Menu } from 'lucide-react'
import MobileDrawer from '../../components/mobileDrawer/MobileDrawer';
import PtukLogo from '../../Assets/icons/Ptuk.jpg'
import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import Events from '../../Assets/icons/event.png';
import ArrowRight from '../../Assets/icons/arrow-right.png';
import ArrowLeft from '../../Assets/icons/arrow-left.png';
import DefaultPicture from '../../Assets/icons/default-pfp.png'
import BinIcon from '../../Assets/icons/bin.png'
import AddFriendIcon from '../../Assets/icons/add-friend.png';
import RemovePersonIcon from '../../Assets/icons/remove-person.png';
import MessagesIcon from '../../Assets/icons/messages.png';
import InfoIcon from '../../Assets/icons/info.png';
import EducationIcon from '../../Assets/icons/education.png';
import ProfilePicture from '../../Assets/icons/default-pfp.png';
import API from '../../config';
import useTheme from '../../hooks/useTheme'

export default function Universities() {
    const { theme, toggleTheme } = useTheme();
    const [user, setUser] = useState(null);
    const [userError, setUserError] = useState("");
    const [newsIndex, setNewsIndex] = useState(0);
    const [eventIndex, setEventIndex] = useState(0);
    const [searchTerm, setSearchTerm] = useState('')
    const [doctors, setDoctors] = useState([]);
    const [news, setNews] = useState([]);
    const [popupItem, setPopupItem] = useState(null);
    const [openNewsDropdown, setOpenNewsDropdown] = useState(null);
    const [extendItem, setExtendItem] = useState(null);
    const [sliderStep, setSliderStep] = useState(2);
    const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
    const navigate = useNavigate();
    const [univData, setUnivData] = useState(null);
    const [events, setEvents] = useState([]);
    const [isManageDoctorsOpen, setIsManageDoctorsOpen] = useState(false);
    const [manageDoctorsSearch, setManageDoctorsSearch] = useState('');
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteStatus, setInviteStatus] = useState(null);
    const [removingDoctorId, setRemovingDoctorId] = useState(null);
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef(null);

    const isUniversity = localStorage.getItem("user_type") === "university";
    const token = localStorage.getItem("access");

    const buildDurationSteps = () => {
        const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        const fmt = (d) => `${days[d.getDay()]} - ${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
        const add = (months, extraDays) => {
            const d = new Date();
            d.setMonth(d.getMonth() + months);
            d.setDate(d.getDate() + extraDays);
            return d;
        };
        return [
            { label: "1 week",   addedText: "7 days",         dateStr: fmt(add(0, 7))   },
            { label: "1 month",  addedText: "1 month",        dateStr: fmt(add(1, 0))   },
            { label: "3 months", addedText: "3 months",       dateStr: fmt(add(3, 0))   },
            { label: "6 months", addedText: "6 months",       dateStr: fmt(add(6, 0))   },
            { label: "1 year",   addedText: "12 months",      dateStr: fmt(add(12, 0))  },
        ];
    };
    const durationSteps = buildDurationSteps();
    const getDaysRemaining = (endDate) => {
        if (!endDate) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);
        const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
        if (diff < 0) return { label: `Expired ${Math.abs(diff)} day${Math.abs(diff) !== 1 ? 's' : ''} ago`, expired: true };
        if (diff === 0) return { label: `Expires today at ${endDate}`, expired: false };
        return { label: `ends in ${diff} day${diff !== 1 ? 's' : ''} at ${endDate}`, expired: false };
    };

    // ── Responsive check ──
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    useEffect(() => {
        document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileMenuOpen]);

    useEffect(() => {
        if (!token) return;
        const fetchData = async () => {
            const headers = {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            };

            try {
                const [newsRes, eventsRes, doctorsRes, userRes, univRes] = await Promise.all([
                    fetch(`${API}/api/university/news/`, { headers }),
                    fetch(`${API}/api/university/events/`, { headers }),
                    fetch(`${API}/api/university/doctors/`, { headers }),
                    fetch(`${API}/api/auth/me/`, { headers }),
                    fetch(`${API}/api/university/`, { headers })
                ]);
                const univJson = univRes.ok ? await univRes.json() : null;
                const newsJson = newsRes.ok ? await newsRes.json() : null;
                const doctorsJson = doctorsRes.ok ? await doctorsRes.json() : null;

                if (univJson) setUnivData(univJson);
                if (newsJson) setNews(newsJson);
                if (eventsRes.ok) setEvents(await eventsRes.json());
                if (doctorsJson) setDoctors(doctorsJson);
                if (userRes.ok) {
                    const userData = await userRes.json();
                    // resolve avatar same as communities.jsx
                    if ((userData.role === 'uni' || localStorage.getItem('user_type') === 'university') && userData.id) {
                        const pageRes = await fetch(`${API}/api/pages/${userData.id}/`, { headers });
                        if (pageRes.ok) {
                            const pageData = await pageRes.json();
                            userData.avatar = pageData.profile_image;
                        }
                    } else {
                        userData.avatar = userData.profile?.avatar || null;
                    }
                    setUser(userData);
                }
            } catch (err) {
                console.error("Network or parsing error on Universities page:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    // ── Close dropdown when clicking anywhere outside ──
    useEffect(() => {
        if (openNewsDropdown === null) return;
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpenNewsDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openNewsDropdown]);

    // ── Delete a news post ──
    const handleDeleteNews = useCallback(async (item) => {
        try {
            const res = await fetch(`${API}/api/posts/${item.id}/`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok || res.status === 204) {
                setNews(prev => prev.filter(n => n.id !== item.id));
            } else {
                console.error("Delete failed:", res.status);
            }
        } catch (err) {
            console.error("Delete error:", err);
        } finally {
            setDeleteConfirmItem(null);
            setOpenNewsDropdown(null);
        }
    }, [token]);

    // ── Save extended duration ──
    const handleSaveExtend = useCallback(async () => {
        if (!extendItem) return;
        const chosenStep = durationSteps[sliderStep];
        try {
            const res = await fetch(`${API}/api/university/news/${extendItem.id}/extend/`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ extend_by: chosenStep.label, new_end_date: chosenStep.dateStr })
            });
            if (res.ok) {
                setNews(prev => prev.map(n =>
                    n.id === extendItem.id ? { ...n, end_date: chosenStep.dateStr } : n
                ));
            } else {
                console.error("Extend failed:", res.status);
            }
        } catch (err) {
            console.error("Extend error:", err);
        } finally {
            setExtendItem(null);
        }
    }, [extendItem, sliderStep, token]);

    // ── Remove a doctor ──
    const handleRemoveDoctor = useCallback(async (doc) => {
        setRemovingDoctorId(doc.id);
        try {
            const res = await fetch(`${API}/api/university/doctors/${doc.id}/`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok || res.status === 204) {
                setDoctors(prev => prev.filter(d => d.id !== doc.id));
            } else {
                console.error("Remove failed:", res.status);
            }
        } catch (err) {
            console.error("Remove error:", err);
        } finally {
            setRemovingDoctorId(null);
        }
    }, [token]);

    // ── Send invite ──
    const handleSendInvite = useCallback(async () => {
        if (!inviteEmail.trim()) return;
        setInviteStatus(null);
        try {
            const res = await fetch(`${API}/api/university/doctors/invite/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ email: inviteEmail.trim() })
            });
            setInviteStatus(res.ok ? 'success' : 'error');
            if (res.ok) setInviteEmail('');
        } catch (err) {
            console.error("Invite error:", err);
            setInviteStatus('error');
        }
    }, [inviteEmail, token]);

    const currentNews = news[newsIndex];
    const currentEvent = events[eventIndex];

    const filteredDoctors = doctors.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const rawImage = user?.profile_image || user?.avatar;

    const avatarSrc = rawImage
        ? rawImage.startsWith("http") ? rawImage : `${API}${rawImage}`
        : ProfilePicture;
    // ── Shared doctors list (reused in both mobile and desktop) ──
    const DoctorsList = () => (
        <div className={styles.scrollableList}>
            {filteredDoctors.length === 0 && (
                <div className={styles.emptyState}>
                    <img src={EducationIcon} alt="" className={styles.emptyStateIcon} />
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                        {searchTerm.trim() ? 'No results found' : 'No doctors or teachers'}
                    </div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                        {searchTerm.trim() ? `No match for "${searchTerm.trim()}"` : 'None have been added yet.'}
                    </div>
                </div>
            )}
            {filteredDoctors.map((doc, index) => (
                <div key={doc.id} className={styles.doctorItemWrapper}>
                    <div className={styles.doctorItem} onClick={() => navigate(`/profile/${doc.id}`)}>
                        <div className={styles.docAvatar}>
                            {doc.avatar || doc.profile_picture ? (
                                <img
                                    src={(doc.avatar || doc.profile_picture).startsWith("http")
                                        ? (doc.avatar || doc.profile_picture)
                                        : `${API}${doc.avatar || doc.profile_picture}`}
                                    alt={doc.name}
                                    style={{ width: 50, height: 50, borderRadius: "50%", objectFit: "cover" }}
                                />
                            ) : (
                                <img src={DefaultPicture} alt="" width={50} height={50} />
                            )}
                        </div>
                        <div className={styles.docInfo}>
                            <div className={styles.docNameRow}><h4>{doc.name}</h4></div>
                            <div className={styles.docDescRow}>
                                <span>{doc.desc}</span>
                                {isUniversity && (
                                    <>
                                        <span className={styles.docDot}>•</span>
                                        <span className={styles.docType}>{doc.type || 'Full-time'}</span>
                                    </>
                                )}
                            </div>
                        </div>
                        <img
                            src={ArrowRight} alt=""
                            height={12} width={12} className={styles.arrowBtn}
                            style={{ filter: 'brightness(0) invert(95%)' }}
                        />
                    </div>
                    {(isUniversity && index < filteredDoctors.length - 1) && (
                        <div className={styles.docDivider} />
                    )}
                </div>
            ))}
        </div>
    );

    return (
        <div className={styles.darkContainer}>

            {/* ── MOBILE HEADER ── */}
            {isMobile && (
                <MobileHeader
                    avatarSrc={avatarSrc}
                    user={user}
                    setMobileMenuOpen={setMobileMenuOpen}
                    token={token}
                    API={API}
                />
            )}

            {/* ── MOBILE DRAWER ── */}
            <MobileDrawer isOpen={isMobile && mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} theme={theme} toggleTheme={toggleTheme} />

            {/* ── DESKTOP HEADER ── */}
            {!isMobile && (
                <div className={`${styles.header} ${styles.page}`}>
                    <Header theme={theme} toggleTheme={toggleTheme} user={user} />
                </div>
            )}

            {/* ══════════════════════════════════════
                ── MOBILE BODY ──
            ══════════════════════════════════════ */}
            {isMobile && (
                <div style={{
                    display: "flex", flexDirection: "column",
                    width: "100%", boxSizing: "border-box",
                    padding: "12px 10px 0"
                }}>
                    {/* ── University Header ── */}
                    <div className={styles.universityHeader} style={{ marginBottom: 16 }}>
                        <img
                            src={univData?.logo || PtukLogo}
                            alt="University Logo"
                            className={styles.univLogo}
                            onClick={() => navigate(`/page/${univData?.page_id}`)}
                            style={{ cursor: 'pointer' }}
                        />
                        <div className={styles.univTextContainer}>
                            <h2 className={styles.univEnglish} style={{ fontSize: 18 }}>{univData?.name || "Loading..."}</h2>
                            <h1 className={styles.univArabic} style={{ fontSize: 20 }}>{univData?.name_arabic || ""}</h1>
                            <div className={styles.branch}>
                                <span className={styles.univBranch}>{univData?.branch || "Main Branch"}</span>
                                <div className={styles.line} />
                            </div>
                        </div>
                    </div>

                    {/* ── Doctors & Teachers (mobile only, above uni name but rendered after header) ── */}
                    <div style={{
                        width: "100%", maxWidth: 480, margin: "0 auto 16px",
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-color)",
                        borderRadius: 20, overflow: "hidden",
                        boxSizing: "border-box",
                    }}>
                        {/* card header */}
                        <div style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "14px 16px 10px",
                            borderBottom: "1px solid var(--border-color)"
                        }}>
                            <span style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "0.9rem" }}>
                                Doctors &amp; Teachers
                            </span>
                            {isUniversity && (
                                <button
                                    style={{
                                        background: "linear-gradient(-90deg, rgba(166,39,156,0.9), rgba(49,32,169,0.9))",
                                        border: "none", color: "#fff",
                                        fontWeight: 700, fontSize: "0.78rem",
                                        padding: "6px 14px", borderRadius: 8, cursor: "pointer"
                                    }}
                                    onClick={() => { setManageDoctorsSearch(''); setIsManageDoctorsOpen(true); }}
                                >
                                    Manage
                                </button>
                            )}
                        </div>

                        {/* search */}
                        <div style={{
                            display: "flex", alignItems: "center", gap: 8,
                            margin: "10px 16px",
                            background: "rgba(255,255,255,0.06)",
                            borderRadius: 25, padding: "8px 12px"
                        }}>
                            <Search size={15} color="rgba(255,255,255,0.4)" style={{ flexShrink: 0 }} />
                            <input
                                type="text"
                                placeholder="Searching for someone?"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    flex: 1, background: "transparent", border: "none",
                                    outline: "none", color: "#fff", fontSize: "0.83rem"
                                }}
                            />
                        </div>

                        {/* list */}
                        <div style={{ maxHeight: 280, overflowY: "auto", paddingBottom: 8 }}>
                            <DoctorsList />
                        </div>
                    </div>

                    
                    <div style={{
                        background: "linear-gradient(-90deg, rgba(166,39,156,0.95), rgba(49,32,169,0.95))",
                        paddingTop: 6, borderRadius: "20px 20px 0 0"
                    }}>
                        <div style={{
                            background: "var(--bg-card)", borderRadius: "20px 20px 0 0",
                            padding: "20px 12px 30px"
                        }}>
                            <h2 className={styles.sectionTitle} style={{ marginBottom: 16 }}>LATEST NEWS</h2>

                            {isUniversity ? (
                                /* University POV: full announcement list stacked vertically for mobile */
                                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                    {news.length === 0 && (
                                        <div className={styles.emptyState}>
                                            <img src={InfoIcon} alt="" className={styles.emptyStateIcon} />
                                            <div style={{ fontWeight: 600, marginBottom: 4 }}>No news posted yet</div>
                                            <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Announcements you post will appear here.</div>
                                        </div>
                                    )}
                                    {news.map((item, index) => (
                                        <div key={index} className={styles.announcementWrapper}>
                                            <div
                                                className={styles.announcementItem}
                                                style={{ display: "flex", flexDirection: "column", gap: 12 }}
                                            >
                                                <img
                                                    src={item.img?.startsWith("http") ? item.img : `${API}${item.img}`}
                                                    alt="News"
                                                    className={styles.announcementImg}
                                                    style={{ width: "100%", maxHeight: "200px", objectFit: "cover", borderRadius: "12px" }}
                                                />
                                                <div
                                                    className={styles.announcementContent}
                                                    style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6 }}
                                                >
                                                    <div className={styles.announcementTopRow}>
                                                        <span className={styles.announcementDate}>
                                                            {item.date || "Saturday - 10/6/2026"}
                                                        </span>
                                                        <div
                                                            className={styles.moreMenuWrapper}
                                                            ref={openNewsDropdown === index ? dropdownRef : null}
                                                        >
                                                            <MoreHorizontal
                                                                size={32} strokeWidth={3}
                                                                className={styles.moreIcon}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setOpenNewsDropdown(prev => prev === index ? null : index);
                                                                }}
                                                            />
                                                            {openNewsDropdown === index && (
                                                                <div className={styles.dropdownMenu}>
                                                                    <div
                                                                        className={styles.dropdownItem}
                                                                        onClick={() => {
                                                                            setSliderStep(2);
                                                                            setExtendItem(item);
                                                                            setOpenNewsDropdown(null);
                                                                        }}
                                                                    >
                                                                        <Clock size={16} />
                                                                        <span>Extend duration</span>
                                                                    </div>
                                                                    <div className={styles.dropdownDivider} />
                                                                    <div
                                                                        className={`${styles.dropdownItem} ${styles.deleteItem}`}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setDeleteConfirmItem(item);
                                                                            setOpenNewsDropdown(null);
                                                                        }}
                                                                    >
                                                                        <img src={BinIcon} alt="delete" className={styles.binIcon} />
                                                                        <span>Delete post</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h3 className={styles.announcementTitle} style={{ margin: "4px 0" }}>{item.title}</h3>
                                                        <p className={styles.announcementDesc}>
                                                            {item.desc?.length > 80 ? `${item.desc.substring(0, 80)}... ` : `${item.desc} `}
                                                            <span
                                                                className={styles.readMoreText}
                                                                onClick={(e) => { e.preventDefault(); setPopupItem({ title: item.title, description: item.desc }); }}
                                                            >read more</span>
                                                        </p>
                                                    </div>
                                                    <div className={styles.timeRemainingRow}>
                                                        <Clock size={16} />
                                                        <span style={{ color: item.status_message === 'Expired' ? '#e05252' : 'inherit' }}>
                                                            {item.date ? `Ending ${item.date}` : ''}
                                                            {item.status_message ? ` · ${item.status_message}` : ''}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            {index < news.length - 1 && <div className={styles.newsDivider} style={{ margin: "16px 0 8px" }} />}
                                        </div>
                                    ))}
                                </div>
                            ) : news.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <img src={InfoIcon} alt="" className={styles.emptyStateIcon} />
                                    <div style={{ fontWeight: 600, marginBottom: 4 }}>No news yet</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Your university hasn&apos;t posted any announcements yet.</div>
                                </div>
                            ) : (
                                /* Student POV: image carousel */
                                <>
                                    <div className={styles.newsImageWrapper}>
                                        <img
                                            src={currentNews?.img?.startsWith("http") ? currentNews.img : `${API}${currentNews?.img}`}
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
                                                <a
                                                    className={styles.readMore}
                                                    onClick={(e) => { e.preventDefault(); setPopupItem({ title: currentNews.title, description: currentNews.desc }); }}
                                                    style={{ cursor: "pointer" }}
                                                >read more</a>
                                            </div>
                                        )}
                                    </div>
                                    {news.length > 1 && (
                                        <div className={styles.sliderControls} style={{ marginTop: 12 }}>
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
                                </>
                            )}
                        </div>
                    </div>
                    {/* Related events: hidden on mobile intentionally */}
                </div>
            )}

            {/* ══════════════════════════════════════
                ── DESKTOP BODY ──
            ══════════════════════════════════════ */}
            {!isMobile && (
                <div className={`${styles.content} ${styles.page} flex flex-col md:flex-row gap-4`}>
                    <SidebarNav />

                    <div className={`${styles.universityInfo} w-full md:flex-1`}>

                        {/* ── University Header ── */}
                        <div className={styles.universityHeader}>
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
                            <div className={styles.innerContainer} style={{ minHeight: isUniversity ? "530px" : "300px", borderRadius: isUniversity ? "30px 30px 0 0" : "30px" }}>
                                <h2 className={styles.sectionTitle}>LATEST NEWS</h2>

                                {isUniversity ? (
                                    <div className={styles.announcementsContainer} style={{ minHeight: "460px" }}>
                                        {news.length === 0 && (
                                            <div className={styles.emptyState}>
                                                <img src={InfoIcon} alt="" className={styles.emptyStateIcon} />
                                                <div style={{ fontWeight: 600, marginBottom: 4 }}>No news posted yet</div>
                                                <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Announcements you post will appear here.</div>
                                            </div>
                                        )}
                                        {news.map((item, index) => (
                                            <div key={index} className={styles.announcementWrapper}>
                                                <div className={styles.announcementItem}>
                                                    <img
                                                        src={item.img?.startsWith("http") ? item.img : `${API}${item.img}`}
                                                        alt="News"
                                                        className={styles.announcementImg}
                                                    />
                                                    <div className={styles.announcementContent}>
                                                        <div className={styles.announcementTopRow}>
                                                            <span className={styles.announcementDate}>
                                                                {item.date || "Saturday - 10/6/2026"}
                                                            </span>
                                                            <div
                                                                className={styles.moreMenuWrapper}
                                                                ref={openNewsDropdown === index ? dropdownRef : null}
                                                            >
                                                                <MoreHorizontal
                                                                    size={32} strokeWidth={3}
                                                                    className={styles.moreIcon}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setOpenNewsDropdown(prev => prev === index ? null : index);
                                                                    }}
                                                                />
                                                                {openNewsDropdown === index && (
                                                                    <div className={styles.dropdownMenu}>
                                                                        <div
                                                                            className={styles.dropdownItem}
                                                                            onClick={() => {
                                                                                setSliderStep(2);
                                                                                setExtendItem(item);
                                                                                setOpenNewsDropdown(null);
                                                                            }}
                                                                        >
                                                                            <Clock size={16} />
                                                                            <span>Extend duration</span>
                                                                        </div>
                                                                        <div className={styles.dropdownDivider} />
                                                                        <div
                                                                            className={`${styles.dropdownItem} ${styles.deleteItem}`}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setDeleteConfirmItem(item);
                                                                                setOpenNewsDropdown(null);
                                                                            }}
                                                                        >
                                                                            <img src={BinIcon} alt="delete" className={styles.binIcon} />
                                                                            <span>Delete post</span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h3 className={styles.announcementTitle}>{item.title}</h3>
                                                            <p className={styles.announcementDesc}>
                                                                {item.desc?.length > 80 ? `${item.desc.substring(0, 80)}... ` : `${item.desc} `}
                                                                <span
                                                                    className={styles.readMoreText}
                                                                    onClick={(e) => { e.preventDefault(); setPopupItem({ title: item.title, description: item.desc }); }}
                                                                >read more</span>
                                                            </p>
                                                        </div>
                                                        <div className={styles.timeRemainingRow}>
                                                            <Clock size={16} />
                                                            <span style={{ color: item.status_message === 'Expired' ? '#e05252' : 'inherit' }}>
                                                                {item.date ? `Ending ${item.date}` : ''}
                                                                {item.status_message ? ` · ${item.status_message}` : ''}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {index < news.length - 1 && <div className={styles.newsDivider} />}
                                            </div>
                                        ))}
                                    </div>
                                ) : news.length === 0 ? (
                                    <div className={styles.emptyState} style={{ minHeight: 200, justifyContent: 'center' }}>
                                        <img src={InfoIcon} alt="" className={styles.emptyStateIcon} />
                                        <div style={{ fontWeight: 600, marginBottom: 4 }}>No news yet</div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Your university hasn&apos;t posted any announcements yet.</div>
                                    </div>
                                ) : (
                                    <div className={styles.newsImageWrapper}>
                                        <img
                                            src={currentNews?.img?.startsWith("http") ? currentNews.img : `${API}${currentNews?.img}`}
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
                                                <a
                                                    className={styles.readMore}
                                                    onClick={(e) => { e.preventDefault(); setPopupItem({ title: currentNews.title, description: currentNews.desc }); }}
                                                    style={{ cursor: "pointer" }}
                                                >read more</a>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {(!isUniversity && news.length > 1) && (
                            <div className={styles.sliderControls} style={{ marginTop: 12 }}>
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

                    {/* ── Desktop RIGHT COLUMN ── */}
                    <div className={`${styles.rightSection} hidden md:block`}>
                        <div className={styles.rightCardWrapper}>
                            <div className={styles.pill}>Doctors and Teachers</div>
                            <div className={styles.rightCard} style={{ minHeight: isUniversity ? "570px" : "200px" }}>
                                <div className={styles.rightCardHeader}>
                                    <div className={styles.searchContainer} style={{ width: "100%" }}>
                                        <Search size={16} className={styles.searchIcon} />
                                        <input
                                            type="text"
                                            placeholder="Searching for someone?"
                                            className={styles.searchBar}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>

                                </div>
                                <DoctorsList />
                            </div>
                        </div>

                        {!isUniversity && (
                            <div className={styles.rightCardWrapper}>
                                <div className={styles.rightCard} style={{ marginTop: 0 }}>
                                    <div className={styles.relatedEventsHeader}>
                                        <img src={Events} alt="events" style={{ width: 30, height: 30 }} />
                                        <span className={styles.relatedEventsTitle}>Related events</span>
                                    </div>
                                    {events.length === 0 ? (
                                        <div className={styles.emptyState}>
                                            <img src={Events} alt="" className={styles.emptyStateIcon} />
                                            <div style={{ fontWeight: 600, marginBottom: 4 }}>No events yet</div>
                                            <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Related events will appear here.</div>
                                        </div>
                                    ) : (
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
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════
                SHARED PORTALS (work on mobile & desktop)
            ══════════════════════════════════════════ */}

            {/* DELETE CONFIRMATION */}
            {deleteConfirmItem && createPortal(
                <div
                    style={{
                        position: "fixed", inset: 0, zIndex: 9999,
                        background: "rgba(0,0,0,0.65)", display: "flex",
                        alignItems: "center", justifyContent: "center"
                    }}
                    onClick={() => setDeleteConfirmItem(null)}
                >
                    <div
                        style={{
                            background: "#2a2a2a", borderRadius: 16, padding: "28px 28px 24px",
                            maxWidth: 400, width: "90%", position: "relative",
                            border: "1px solid rgba(255,255,255,0.1)"
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 style={{ color: "white", margin: "0 0 10px", fontSize: "1.1rem" }}>Delete post?</h3>
                        <p style={{ color: "rgba(255,255,255,0.6)", margin: "0 0 24px", fontSize: "0.9rem" }}>
                            This will permanently remove <strong style={{ color: "white" }}>{deleteConfirmItem.title}</strong> from the news feed.
                        </p>
                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                            <button
                                onClick={() => setDeleteConfirmItem(null)}
                                style={{
                                    background: "rgba(255,255,255,0.08)", border: "none", color: "white",
                                    padding: "8px 20px", borderRadius: 8, cursor: "pointer", fontSize: "0.9rem"
                                }}
                            >Cancel</button>
                            <button
                                onClick={() => handleDeleteNews(deleteConfirmItem)}
                                style={{
                                    background: "#e05252", border: "none", color: "white",
                                    padding: "8px 20px", borderRadius: 8, cursor: "pointer", fontSize: "0.9rem", fontWeight: 600
                                }}
                            >Delete</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* EXTEND DURATION */}
            {extendItem && createPortal(
                <div className={styles.extendModalOverlay} onClick={() => setExtendItem(null)}>
                    <div className={styles.extendModalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.extendHeader}>
                            <div className={styles.extendHeaderLeft}>
                                <img
                                    src={ArrowLeft} alt="Back"
                                    className={styles.extendBackBtn}
                                    onClick={() => setExtendItem(null)}
                                />
                                <Clock size={20} className={styles.extendTimeIcon} />
                                <span className={styles.extendHeaderText}>Extend Duration</span>
                            </div>
                            <div className={styles.extendHeaderActions}>
                                <button className={styles.extendCancelBtn} onClick={() => setExtendItem(null)}>Cancel</button>
                                <button className={styles.extendSaveBtn} onClick={handleSaveExtend}>Save</button>
                            </div>
                        </div>
                        <div className={styles.extendMainDivider} />
                        <div className={styles.extendDetailsSection}>
                            <img
                                src={extendItem.img?.startsWith("http") ? extendItem.img : `${API}${extendItem.img}`}
                                alt="Announcement preview"
                                className={styles.extendPreviewImg}
                            />
                            <div className={styles.extendTextDetails}>
                                <h4 className={styles.extendPostTitle}>{extendItem.title || "Learn more"}</h4>
                                <p className={styles.extendPostDesc}>{extendItem.desc || "Announcement description goes here."}</p>
                            </div>
                        </div>
                        <div className={styles.extendMidDivider} />
                        <div className={styles.extendDatesLogs}>
                            <div className={styles.dateLogLine}>
                                <span className={styles.dateLogLabel}>Posted at</span>
                                <span className={styles.dateLogVal}>{extendItem.date || "Friday - 12/6/2026"}</span>
                            </div>
                            <div className={styles.dateLogLine}>
                                <span className={styles.dateLogLabel}>Ends in</span>
                                <span className={styles.dateLogVal}>
                                    {extendItem.end_date
                                        ? `at ${extendItem.end_date}`
                                        : <>5 days <span className={styles.dateLogLabel}>at</span> Wednesday - 17/6/2026</>}
                                </span>
                            </div>
                        </div>
                        <div className={styles.extendSliderContainer}>
                            <div className={styles.sliderLabelRow}>
                                <Clock size={16} />
                                <span>Extend by</span>
                            </div>
                            <div className={styles.sliderTrackWrapper}>
                                <input
                                    type="range" min="0" max="4"
                                    value={sliderStep}
                                    onChange={(e) => setSliderStep(parseInt(e.target.value))}
                                    className={styles.customRangeInput}
                                />
                                <div className={styles.visualTrackBase} />
                                <div className={styles.visualTrackProgress} style={{ width: `${(sliderStep / 4) * 100}%` }} />
                                <div className={styles.sliderNodesContainer}>
                                    {durationSteps.map((step, idx) => {
                                        const isActive = idx === sliderStep;
                                        const isPassed = idx < sliderStep;
                                        return (
                                            <div
                                                key={idx}
                                                className={`${styles.sliderStepNode} ${isActive ? styles.nodeActive : ''} ${isPassed ? styles.nodePassed : ''}`}
                                                onClick={() => setSliderStep(idx)}
                                            >
                                                <div className={styles.nodeDot} />
                                                <span className={styles.nodeLabelText}>{step.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className={styles.extendFutureOutputs}>
                            <span className={styles.dateLogLabel}>New end date</span>
                            <span className={styles.dateLogVal}> {durationSteps[sliderStep].dateStr}</span>
                            <span className={styles.dateLogLabel}> in</span>
                            <span className={styles.dateLogVal}> {durationSteps[sliderStep].addedText}</span>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* READ MORE */}
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