import styles from './universities.module.css'
import Header from '../../components/pagelayout/header/header'
import SidebarNav from '../../components/pagelayout/sidebarnav/sideBarNav'

import { Search, ChevronRight, ChevronLeft, Calendar, MoreHorizontal, Clock } from 'lucide-react'
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
  
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef(null);

    const isUniversity = localStorage.getItem("user_type") === "uni";

    const durationSteps = [
        { label: "1 week", addedText: "0 months & 12 days", dateStr: "Friday - 24/6/2026" },
        { label: "1 month", addedText: "1 month & 5 days", dateStr: "Friday - 17/7/2026" },
        { label: "3 months", addedText: "3 months & 5 days", dateStr: "Thursday - 17/9/2026" },
        { label: "6 months", addedText: "6 months & 5 days", dateStr: "Thursday - 17/12/2026" },
        { label: "1 year", addedText: "12 months & 5 days", dateStr: "Thursday - 17/6/2027" }
    ];

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem("access");
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

                console.log("univRes status:", univRes.status, univJson);
                console.log("newsRes status:", newsRes.status, newsJson);
                console.log("doctorsRes status:", doctorsRes.status, doctorsJson);

                if (univJson) setUnivData(univJson);
                if (newsJson) setNews(newsJson);
                if (eventsRes.ok) setEvents(await eventsRes.json());
                if (doctorsJson) setDoctors(doctorsJson);
                if (userRes.ok) setUser(await userRes.json());

            } catch (err) {
                console.error("Network or parsing error on Universities page:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

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
        const token = localStorage.getItem("access");
        try {
            const res = await fetch(`${API}/api/university/news/${item.id}/`, {
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
    }, [API]);

    // ── Save extended duration ──
    const handleSaveExtend = useCallback(async () => {
        if (!extendItem) return;
        const token = localStorage.getItem("access");
        const chosenStep = durationSteps[sliderStep];
        try {
            const res = await fetch(`${API}/api/university/news/${extendItem.id}/extend/`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    extend_by: chosenStep.label,
                    new_end_date: chosenStep.dateStr
                })
            });
            if (res.ok) {
                // Optimistically update the displayed end date in local state
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
    }, [extendItem, sliderStep, durationSteps, API]);

    // ── Remove a doctor ──
    const handleRemoveDoctor = useCallback(async (doc) => {
        const token = localStorage.getItem("access");
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
    }, [API]);

    // ── Send invite ──
    const handleSendInvite = useCallback(async () => {
        if (!inviteEmail.trim()) return;
        const token = localStorage.getItem("access");
        setInviteStatus(null);
        try {
            const res = await fetch(`${API}/api/university/doctors/invite/`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email: inviteEmail.trim() })
            });
            setInviteStatus(res.ok ? 'success' : 'error');
            if (res.ok) setInviteEmail('');
        } catch (err) {
            console.error("Invite error:", err);
            setInviteStatus('error');
        }
    }, [inviteEmail, API]);

    const currentNews = news[newsIndex];
    const currentEvent = events[eventIndex];

    const filteredDoctors = doctors.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

   

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

                                                        {/* ── More Menu ── */}
                                                        <div
                                                            className={styles.moreMenuWrapper}
                                                            ref={openNewsDropdown === index ? dropdownRef : null}
                                                        >
                                                            <MoreHorizontal
                                                                size={32}
                                                                strokeWidth={3}
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
                                                                            setSliderStep(2); // reset slider each time
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
                                                        <span>
                                                            {item.end_date
                                                                ? `ends at ${item.end_date}`
                                                                : "ends in 5 days at 17/6/2026"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            {index < news.length - 1 && <div className={styles.newsDivider} />}
                                        </div>
                                    ))}
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
                                            <a className={styles.readMore}
                                                onClick={(e) => { e.preventDefault(); setPopupItem({ title: currentNews.title, description: currentNews.desc }); }}
                                                style={{ cursor: "pointer" }}>read more</a>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {(!isUniversity && news.length > 1) && (
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
                    <div className={styles.rightCardWrapper}>
                        <div className={styles.pill}>Doctors and Teachers</div>
                        <div className={styles.rightCard} style={{ minHeight: isUniversity ? "570px" : "200px" }}>
                            <div className={styles.rightCardHeader}>
                                <div className={styles.searchContainer} style={{ width: isUniversity ? "60%" : "100%" }}>
                                    <Search size={16} className={styles.searchIcon} />
                                    <input
                                        type="text"
                                        placeholder="Searching for someone?"
                                        className={styles.searchBar}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                {isUniversity && (
                                    <button className={styles.manageBtn} onClick={() => {
                                        setManageDoctorsSearch('');
                                        setIsManageDoctorsOpen(true);
                                    }}>
                                        Manage
                                    </button>
                                )}
                            </div>

                            <div className={styles.scrollableList}>
                                {filteredDoctors.map((doc, index) => (
                                    <div key={doc.id} className={styles.doctorItemWrapper}>
                                        <div
                                            className={styles.doctorItem}
                                            onClick={() => navigate(`/profile/${doc.id}`)}
                                        >
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
                                                <div className={styles.docNameRow}>
                                                    <h4>{doc.name}</h4>
                                                </div>
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
                                                src={ArrowRight}
                                                alt=""
                                                height={12}
                                                width={12}
                                                className={styles.arrowBtn}
                                                style={{ filter: 'brightness(0) invert(95%)' }}
                                            />
                                        </div>
                                        {(isUniversity && index < filteredDoctors.length - 1) && (
                                            <div className={styles.docDivider} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {!isUniversity && (
                        <div className={styles.rightCardWrapper}>
                            <div className={styles.rightCard} style={{marginTop:0}}>
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
                        </div>
                    )}
                </div>
            </div>

            {/* ══════════════════════════════════════════
                PORTAL: DELETE CONFIRMATION
            ══════════════════════════════════════════ */}
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

            {/* ══════════════════════════════════════════
                PORTAL: EXTEND DURATION
            ══════════════════════════════════════════ */}
            {extendItem && createPortal(
                <div className={styles.extendModalOverlay} onClick={() => setExtendItem(null)}>
                    <div className={styles.extendModalContent} onClick={(e) => e.stopPropagation()}>

                        <div className={styles.extendHeader}>
                            <div className={styles.extendHeaderLeft}>
                                <img
                                    src={ArrowLeft}
                                    alt="Back"
                                    className={styles.extendBackBtn}
                                    onClick={() => setExtendItem(null)}
                                />
                                <Clock size={20} className={styles.extendTimeIcon} />
                                <span className={styles.extendHeaderText}>Extend Duration</span>
                            </div>
                            <div className={styles.extendHeaderActions}>
                                <button className={styles.extendCancelBtn} onClick={() => setExtendItem(null)}>Cancel</button>
                                {/* Save now calls handleSaveExtend which fires the PATCH and closes */}
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
                                    type="range"
                                    min="0"
                                    max="4"
                                    value={sliderStep}
                                    onChange={(e) => setSliderStep(parseInt(e.target.value))}
                                    className={styles.customRangeInput}
                                />
                                <div className={styles.visualTrackBase} />
                                <div
                                    className={styles.visualTrackProgress}
                                    style={{ width: `${(sliderStep / 4) * 100}%` }}
                                />
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

            {/* ══════════════════════════════════════════
                PORTAL: READ MORE
            ══════════════════════════════════════════ */}
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

            {/* ══════════════════════════════════════════
                PORTAL: MANAGE DOCTORS
            ══════════════════════════════════════════ */}
            {isManageDoctorsOpen && createPortal(
                <div className={styles.manageModalOverlay} onClick={() => setIsManageDoctorsOpen(false)}>
                    <div className={styles.manageModalContent} onClick={e => e.stopPropagation()}>

                        <div className={styles.manageModalHeader}>
                            <img
                                src={ArrowLeft} alt="Back"
                                className={styles.manageBackIcon}
                                onClick={() => setIsManageDoctorsOpen(false)}
                                style={{ width: 18, height: 18, filter: "brightness(0) invert(1)", cursor: "pointer" }}
                            />
                            <h2>Manage Doctors and Teachers</h2>
                            <span className={styles.manageCounter}>{doctors.length} Members</span>
                        </div>

                        <div className={styles.manageDivider} />

                        <div className={styles.manageControls}>
                            <div className={styles.manageSearchInputWrapper}>
                                <Search size={18} color="#808080" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={manageDoctorsSearch}
                                    onChange={(e) => setManageDoctorsSearch(e.target.value)}
                                />
                            </div>
                            {/* Invite button now opens the invite sub-modal */}
                            <button className={styles.manageInviteBtn} onClick={() => { setInviteStatus(null); setIsInviteOpen(true); }}>
                                <img src={AddFriendIcon} alt="Invite" className={styles.inviteIcon} />
                                Invite
                            </button>
                        </div>

                        <div className={styles.notifList}>
                            {doctors
                                .filter(doc => doc.name.toLowerCase().includes(manageDoctorsSearch.toLowerCase()))
                                .map((doc, idx, arr) => (
                                    <div key={doc.id} className={styles.doctorRowWrapper}>
                                        <div className={styles.manageListItem}>
                                            <img
                                                src={
                                                    doc.avatar
                                                        ? (doc.avatar.startsWith("http") ? doc.avatar : `${API}${doc.avatar}`)
                                                        : DefaultPicture
                                                }
                                                alt={doc.name}
                                                className={styles.manageListAvatar}
                                            />
                                            <div className={styles.manageListInfo}>
                                                <span className={styles.manageListName}>{doc.name}</span>
                                                <span className={styles.manageListDesc}>{doc.desc} • {doc.type || "Full Time"}</span>
                                            </div>
                                            <div className={styles.manageListActions}>
                                                {/* Remove: confirms via a small inline confirm, then calls API */}
                                                <img
                                                    src={RemovePersonIcon}
                                                    alt="Remove"
                                                    className={styles.actionRemove}
                                                    title="Remove from university"
                                                    style={{
                                                        cursor: "pointer",
                                                        opacity: removingDoctorId === doc.id ? 0.4 : 1
                                                    }}
                                                    onClick={() => {
                                                        if (window.confirm(`Remove ${doc.name} from the university?`)) {
                                                            handleRemoveDoctor(doc);
                                                        }
                                                    }}
                                                />
                                                {/* Message: navigates to messages with this doctor */}
                                                <img
                                                    src={MessagesIcon}
                                                    alt="Message"
                                                    className={styles.actionMessage}
                                                    title="Send message"
                                                    style={{ cursor: "pointer" }}
                                                    onClick={() => {
                                                        setIsManageDoctorsOpen(false);
                                                        navigate(`/messages/${doc.id}`);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        {idx < arr.length - 1 && <div className={styles.listItemDivider} />}
                                    </div>
                                ))}
                        </div>

                    </div>
                </div>,
                document.body
            )}

            {/* ══════════════════════════════════════════
                PORTAL: INVITE DOCTOR
            ══════════════════════════════════════════ */}
            {isInviteOpen && createPortal(
                <div
                    style={{
                        position: "fixed", inset: 0, zIndex: 10000,
                        background: "rgba(0,0,0,0.65)", display: "flex",
                        alignItems: "center", justifyContent: "center"
                    }}
                    onClick={() => setIsInviteOpen(false)}
                >
                    <div
                        style={{
                            background: "#2a2a2a", borderRadius: 16, padding: "28px 28px 24px",
                            maxWidth: 400, width: "90%", position: "relative",
                            border: "1px solid rgba(255,255,255,0.1)"
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setIsInviteOpen(false)}
                            style={{
                                position: "absolute", top: 14, right: 14,
                                background: "none", border: "none", color: "white",
                                fontSize: "1.1rem", cursor: "pointer"
                            }}
                        >✕</button>
                        <h3 style={{ color: "white", margin: "0 0 6px", fontSize: "1.05rem" }}>Invite Doctor / Teacher</h3>
                        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.82rem", margin: "0 0 18px" }}>
                            Enter their email address — they'll receive an invitation link.
                        </p>
                        <input
                            type="email"
                            placeholder="Email address..."
                            value={inviteEmail}
                            onChange={e => { setInviteEmail(e.target.value); setInviteStatus(null); }}
                            style={{
                                width: "100%", boxSizing: "border-box",
                                background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
                                borderRadius: 8, padding: "10px 14px", color: "white",
                                fontSize: "0.9rem", outline: "none", marginBottom: 12
                            }}
                        />
                        {inviteStatus === 'success' && (
                            <p style={{ color: "#5fcf80", fontSize: "0.85rem", margin: "0 0 12px" }}>
                                ✓ Invitation sent successfully!
                            </p>
                        )}
                        {inviteStatus === 'error' && (
                            <p style={{ color: "#e05252", fontSize: "0.85rem", margin: "0 0 12px" }}>
                                ✕ Failed to send. Please try again.
                            </p>
                        )}
                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                            <button
                                onClick={() => setIsInviteOpen(false)}
                                style={{
                                    background: "rgba(255,255,255,0.08)", border: "none", color: "white",
                                    padding: "8px 20px", borderRadius: 8, cursor: "pointer", fontSize: "0.9rem"
                                }}
                            >Cancel</button>
                            <button
                                onClick={handleSendInvite}
                                disabled={!inviteEmail.trim()}
                                style={{
                                    background: inviteEmail.trim() ? "#4a7fe0" : "rgba(74,127,224,0.35)",
                                    border: "none", color: "white",
                                    padding: "8px 20px", borderRadius: 8,
                                    cursor: inviteEmail.trim() ? "pointer" : "not-allowed",
                                    fontSize: "0.9rem", fontWeight: 600,
                                    transition: "background 0.2s"
                                }}
                            >Send Invite</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}