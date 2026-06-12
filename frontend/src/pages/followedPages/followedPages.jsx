import styles from './followedPages.module.css'
import { useState, useEffect, useRef } from 'react'
import Header from '../../components/pagelayout/header/header'
import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav'
import PostCard from '../../components/posts/postCard'
import { useNavigate } from 'react-router-dom';
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight } from 'lucide-react'
import CommentsModal from '../../components/comments/commentsModal'
import Search from '../../Assets/icons/search.png';
import VerifiedBadge from '../../Assets/icons/verified-mark.png';
import X from '../../Assets/icons/x.png';
import Info from '../../Assets/icons/info.png';
import { useParams } from "react-router-dom";
import Block from '../../Assets/icons/block.png';
import ReportModal from '../../components/posts/ReportModal';

export default function FollowedPages() {
    const navigate = useNavigate();
    const [theme, setTheme] = useState('dark');
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedPostId, setSelectedPostId] = useState(null)
    const [showAllPopup, setShowAllPopup] = useState(false);
    const [popupSearchTerm, setPopupSearchTerm] = useState("");
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const { userId } = useParams();
    const [reportTargetId, setReportTargetId] = useState(null);


    const [userError, setUserError] = useState("");
    const [userLoading, setUserLoading] = useState(true);
    const token = localStorage.getItem("access");
    const [showAllRec, setShowAllRec] = useState(false);

    const [posts, setPosts] = useState([]);

    const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 });

    const [pages, setPages] = useState([]);
    const [recommendedPages, setRecommendedPages] = useState([]);
    const [currentSlide, setCurrentSlide] = useState(0);

    const handleOpenComments = (postObject) => {
        setSelectedPost(postObject);
        setIsCommentsOpen(true);
    };


    const handleToggleMenu = (e, menuId) => {
        e.stopPropagation();

        if (activeMenuId === menuId) {
            setActiveMenuId(null);
        } else {
            // Grab the dimensions of the exact 3-dot button that was clicked
            const rect = e.currentTarget.getBoundingClientRect();

            setMenuCoords({
                top: rect.bottom + window.scrollY + 4, // Handles modal/page scrolling offsets
                left: rect.right + window.scrollX - 140 // Aligns cleanly with a 140px dropdown width
            });
            setActiveMenuId(menuId);
        }
    };

    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    }

    useEffect(() => {
        const handleGlobalClick = () => {
            setActiveMenuId(null);
        };
        window.addEventListener('click', handleGlobalClick);
        return () => {
            window.removeEventListener('click', handleGlobalClick);
        };
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem("access");
                if (!token) return;

                // 1. User
                const userRes = await fetch("http://localhost:8000/api/auth/me/", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const userData = await userRes.json();


                if (userData.role === 'university' || localStorage.getItem('user_type') === 'university') {
                    const pageRes = await fetch("http://localhost:8000/api/pages/${userData.id}/", {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (pageRes.ok) {
                        const pageData = await pageRes.json();
                        userData.avatar = pageData.profile_image;
                    }
                }

                setCurrentUser(userData);
                // 2. Fetch followed pages + posts
                const [pagesRes, postsRes] = await Promise.all([
                    fetch("http://localhost:8000/api/pages/followed/", {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    fetch("http://localhost:8000/api/posts/feed/", {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                ]);

                const pagesData = await pagesRes.json();
                const postsData = await postsRes.json();

                const formattedPages = pagesData.map(p => ({
                    ...p,
                    id: p.page_id,
                    name: p.page_full_name || p.page_name || "Unknown Page",
                    avatar: p.profile_image
                        ? (p.profile_image.startsWith("http")
                            ? p.profile_image
                            : `http://localhost:8000${p.profile_image}`)
                        : "/default-avatar.png",
                    category: p.page_type || "Page"
                }));

                setPages(formattedPages);

                const pageIds = formattedPages.map(p => p.id);

                const pagePosts = postsData.filter(post =>
                    post.author &&
                    post.author.type === "page" &&
                    pageIds.includes(post.author.id)
                );

                const fixedPosts = pagePosts.map(post => ({
                    ...post,
                    author_avatar: post.author?.profile_image || post.author_avatar,
                    media: post.media?.map(m => ({
                        ...m,
                        url: m.url?.startsWith("http")
                            ? m.url
                            : `http://localhost:8000${m.url}`
                    })) || []
                }));

                setPosts(fixedPosts);

            } catch (err) {
                console.error(err);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const fetchRecommended = async () => {
            try {
                const token = localStorage.getItem("access");
                if (!token) return;

                const res = await fetch("http://localhost:8000/api/pages/recommended/", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) throw new Error("Failed to fetch recommendations");

                const data = await res.json();
                const formatted = data.map(p => ({
                    ...p,
                    id: p.page_id,
                    avatar: p.profile_image
                        ? (p.profile_image.startsWith("http") ? p.profile_image : `http://localhost:8000${p.profile_image}`)
                        : "/default-avatar.png",
                    name: p.page_full_name || p.page_name || "Unknown Page",
                    category: p.page_type || "Page"
                }));

                setRecommendedPages(formatted);
            } catch (err) {
                console.error("Error fetching recommended pages:", err);
                setRecommendedPages([]);
            }
        };

        fetchRecommended();
    }, []);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem("access");
                if (!token) return;

                const res = await fetch("http://localhost:8000/api/auth/me/", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!res.ok) throw new Error("Failed to fetch user");

                const data = await res.json();
                setCurrentUser(data);
            } catch (err) {
                console.error(err);
                setUserError("Failed to load user");
            } finally {
                setUserLoading(false);
            }
        };

        fetchUser();
    }, []);

    const handleNextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % recommendedPages.length);
    };

    const handlePrevSlide = () => {
        setCurrentSlide((prev) => (prev === 0 ? recommendedPages.length - 1 : prev - 1));
    };

    return (
        <div className={styles.darkContainer}>
            <div className={`${styles.header} ${styles.page}`}>
                <Header theme={theme} toggleTheme={toggleTheme} user={currentUser} />
            </div>
            <div className={`${styles.page} ${styles.content}`}>
                <SideBarNav
                    variant={userId ? "profile" : "default"}
                    currentUser={currentUser}
                />
                <div className={styles.followedPagesPosts}>


                    <div className={styles.recommendedHeaderRow}>
                        <div className={styles.recommendedTitle}>
                            <span className={styles.highlightText}>Recommended</span>
                            <span className={styles.normalText}> pages</span>
                        </div>
                        <button
                            className={styles.viewAllBtn}
                            onClick={() => setShowAllRec(prev => !prev)}
                        >
                            {showAllRec ? 'Show less' : 'View all'}
                        </button>
                    </div>

                    {recommendedPages.length > 0 && (
                        <div className={styles.recCardsContainer}>
                            {(showAllRec ? recommendedPages : recommendedPages.slice(0, 3)).map(page => (
                                <div
                                    key={page.id}
                                    className={styles.recCard}
                                    onClick={() => navigate(`/page/${page.id}`)}
                                >
                                    <img
                                        src={page.avatar}
                                        alt={page.name}
                                        className={styles.recCardImg}
                                    />
                                    <div className={styles.recCardInfo}>
                                        <span className={styles.recCardName}>
                                            {page.name || page.page_name}
                                        </span>
                                        <img
                                            src={VerifiedBadge}
                                            alt="Verified"
                                            className={styles.verifiedIcon}
                                            style={{
                                                filter: "invert(87%) sepia(5%) saturate(297%) hue-rotate(185deg) brightness(96%) contrast(85%)"
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Section Divider ── */}
                    <div className={styles.sectionDivider}></div>

                    {/* ── Posts ── */}
                    {posts.length > 0 ? (
                        <div className={styles.postContainer}>
                            <div className={styles.innerContainer}>
                                {posts.map(post => (
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        isOwnProfile={false}
                                        openComments={() => handleOpenComments(post)}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIconWrapper}>
                                <span className={styles.emptyIcon}>📭</span>
                            </div>
                            <h2 className={styles.emptyTitle}>No posts yet</h2>
                            <p className={styles.emptySubtitle}>Pages you follow haven't posted anything yet.</p>
                        </div>
                    )}
                </div>

                {/* ── Right Section ── */}
                <div className={styles.rightSection}>

                    {/* YOU FOLLOW block */}
                    <div className={styles.rightSectionWrapper}>
                        <div className={styles.pill}>FOLLOWED PAGES</div>

                        <div className={styles.rightCard}>
                            <div className={styles.followedHeaderRow} style={{ marginBottom: '12px' }}>


                                <div className={styles.searchContactWrap}>
                                    <img src={Search} alt="Search" className={styles.searchIcon} />

                                    <input
                                        type="text"
                                        placeholder="Search followed pages..."
                                        className={styles.searchInput}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <button
                                    className={styles.viewAllBtn}
                                    style={{ marginBottom: "20px", padding: "13px 30px" }}
                                    onClick={() => setShowAllPopup(true)}
                                >
                                    View All
                                </button>


                            </div>


                            <div className={styles.rightList}>
                                {pages
                                    .filter(page =>
                                        (page.name || "")
                                            .toLowerCase()
                                            .includes(searchTerm.toLowerCase())
                                    )
                                    .map((page, index) => (
                                        <div key={page.id} className={styles.pageWrapper}>
                                            <div className={styles.pageItemRow}>
                                                <div
                                                    className={styles.pageItemLeft}
                                                    onClick={() => navigate(`/page/${page.id}`)}
                                                >
                                                    <div className={styles.pageAvatarWrapper}>
                                                        <img
                                                            src={page.avatar}
                                                            alt={page.name}
                                                            className={styles.pageAvatar}
                                                        />
                                                    </div>

                                                    <div className={styles.pageInfo}>
                                                        <div className={styles.pageName}>
                                                            {page.name}
                                                        </div>
                                                        <div className={styles.pageCategory}>
                                                            {page.category || "Page"}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className={styles.pageActions}>
                                                    <div className={styles.dropdownContainer}>

                                                        <button
                                                            className={styles.actionBtn}
                                                            onClick={(e) => handleToggleMenu(e, page.id)}
                                                        >
                                                            •••
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {index !== pages.length - 1 && (
                                                <div className={styles.divider}></div>
                                            )}
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>


                </div>
            </div>

            {/* VIEW ALL POPUP MODAL */}
            {showAllPopup && (
                <div
                    className={styles.popupOverlay}
                    onClick={() => setShowAllPopup(false)}
                >
                    <div
                        className={styles.popupContent}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={styles.popupHeader}>
                            <h3>All Followed Pages</h3>
                            <button
                                className={styles.closePopupBtn}
                                onClick={() => setShowAllPopup(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className={styles.searchContactWrap}>
                            <img src={Search} alt="Search" className={styles.searchIcon} />
                            <input
                                type="text"
                                placeholder="Searching for a page?"
                                className={styles.searchInput}
                                value={popupSearchTerm}
                                onChange={(e) => setPopupSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className={styles.popupList}>
                            {pages
                                .filter(page =>
                                    page.name.toLowerCase().includes(popupSearchTerm.toLowerCase())
                                )
                                .map(page => (
                                    <div
                                        key={`popup-${page.id}`}
                                        className={styles.popupPageWrapper}
                                    >
                                        <div className={styles.pageItemRow}>
                                            <div
                                                className={styles.pageItemLeft}
                                                onClick={() => {
                                                    navigate(`/page/${page.id}`);
                                                    setShowAllPopup(false);
                                                }}
                                            >
                                                <div className={styles.pageAvatarWrapper}>
                                                    <img
                                                        src={page.avatar}
                                                        alt={page.name}
                                                        className={styles.pageAvatar}
                                                    />
                                                </div>

                                                <div className={styles.pageInfo}>
                                                    <div className={styles.pageName}>
                                                        {page.name}
                                                    </div>
                                                    <div className={styles.pageCategory}>
                                                        {page.category || "Page"}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={styles.pageActions}>
                                                <div className={styles.dropdownContainer}>
                                                    <button
                                                        className={styles.actionBtn}
                                                        onClick={(e) => handleToggleMenu(e, `popup-${page.id}`)}
                                                    >
                                                        •••
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            )}


            {activeMenuId && createPortal(
                <div
                    className={styles.dropdownMenu}
                    style={{ top: `${menuCoords.top}px`, left: `${menuCoords.left}px` }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button onClick={() => setActiveMenuId(null)}>
                        <img src={X} alt="Unfollow" style={{
                            filter: "invert(87%) sepia(5%) saturate(297%) hue-rotate(185deg) brightness(96%) contrast(85%)"
                        }} className={styles.dropdownIcon} />
                        Unfollow
                    </button>

                    <div className={styles.dropdownDivider} />

                    <button onClick={() => {
                        const id = Number(String(activeMenuId).replace('popup-', ''));
                        setReportTargetId(id);
                        setActiveMenuId(null);
                    }}>
                        <img src={Info} alt="Report" style={{
                            filter: "invert(87%) sepia(5%) saturate(297%) hue-rotate(185deg) brightness(96%) contrast(85%)"
                        }} className={styles.dropdownIcon} />
                        Report
                    </button>

                    <div className={styles.dropdownDivider} />

                    <button className={styles.blockBtn} onClick={() => setActiveMenuId(null)}>
                        <img src={Block} alt="Block" style={{
                            filter: "invert(27%) sepia(90%) saturate(700%) hue-rotate(330deg) brightness(110%) contrast(120%)"
                        }} className={styles.dropdownIcon} />
                        Block
                    </button>
                </div>,
                document.body
            )}

            {isCommentsOpen && selectedPost && (
                <CommentsModal
                    post={selectedPost}
                    currentUser={currentUser}
                    onClose={() => {
                        setIsCommentsOpen(false);
                        setSelectedPost(null);
                    }}
                />
            )}
            {reportTargetId && (
                <ReportModal
                    contentId={reportTargetId}
                    contentType="page"
                    onClose={() => setReportTargetId(null)}
                />
            )}
        </div>
    )
}