import styles from './followedPages.module.css'
import { useState, useEffect } from 'react'
import Header from '../../components/pagelayout/header/header'
import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav'
import PostCard from '../../components/posts/postCard'
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Search from '../../Assets/icons/search.png';
export default function FollowedPages() {
    const navigate = useNavigate();
    const [theme, setTheme] = useState('dark');
    const [currentUser, setCurrentUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [userError, setUserError] = useState("");
    const [userLoading, setUserLoading] = useState(true);
    const token = localStorage.getItem("access");
    const [posts, setPosts] = useState([]);
    const [pages, setPages] = useState([]);
    const [recommendedPages, setRecommendedPages] = useState([]);
    const [currentSlide, setCurrentSlide] = useState(0);

    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    }
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

                // Fix pages avatars
                console.log("raw pages data:", pagesData);
                // In fetchData formattedPages
                const formattedPages = pagesData.map(p => ({
                    ...p,
                    id: p.page_id,  // 👈
                    name: p.page_full_name || p.page_name || "Unknown Page",
                    avatar: p.profile_image
                        ? (p.profile_image.startsWith("http")
                            ? p.profile_image
                            : `http://localhost:8000${p.profile_image}`)
                        : "/default-avatar.png",
                    category: p.page_type || "Page"
                }));

                setPages(formattedPages);

                // Filter posts → ONLY pages posts
                const pageIds = pagesData.map(p => p.id);

                const pagePosts = postsData.filter(post =>
                    post.page_id && pageIds.includes(post.page_id)
                );


                const fixedPosts = pagePosts.map(post => ({
                    ...post,
                    author_avatar: post.author_avatar?.startsWith("http")
                        ? post.author_avatar
                        : `http://localhost:8000${post.author_avatar}`,
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
                    id: p.page_id,  // 👈
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
                    variant="profile"
                    currentUser={currentUser}
                />
                <div className={styles.followedPagesPosts}>
                    <h1 className={styles.title}>
                        <span className={styles.highlight}>Pages</span>  You Follow
                    </h1>
                    {posts.length > 0 ? (
                        <div className={styles.postContainer}>
                            <div className={styles.innerContainer}>
                                {posts.map(post => (
                                    <PostCard key={post.id} post={post} />
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
                <div className={styles.rightSection}>

                    {/* Block 1 - Followed Pages */}
                    <div className={styles.rightSectionWrapper}>
                        <div className={styles.pill}>FOLLOWED PAGES</div>
                        <div className={styles.rightCard}>
                            <div className={styles.searchContainer}>
                                <div className={styles.searchWrapper}>
                                    <img src={Search} alt="Search" className={styles.searchIcon} />
                                    <input
                                        type="text"
                                        placeholder="Search followed pages..."
                                        className={styles.searchBar}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className={styles.rightList}>
                                {pages
                                    .filter(page => (page.name || "").toLowerCase().includes(searchTerm.toLowerCase()))
                                    .map((page, index, arr) => (
                                        <div key={page.id} className={styles.pageWrapper}>
                                            <div
                                                className={styles.pageItem}
                                                onClick={() => navigate(`/profile/${page.id}`)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <div className={styles.pageAvatarWrapper}>
                                                    <img src={page.avatar} alt={page.name} className={styles.pageAvatar} />
                                                </div>
                                                <div className={styles.pageInfo}>
                                                    <span className={styles.pageName}>{page.name}</span>
                                                    <span className={styles.pageCategory}>{page.page_type || "Page"}</span>
                                                </div>
                                            </div>
                                            {index !== arr.length - 1 && <div className={styles.divider} />}
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>

                    {/* Block 2 - Recommended Pages (separate, no pill, title inside card) */}
                    {recommendedPages.length > 0 && (
                        <div className={styles.rightSectionWrapper}>
                            <div className={styles.rightCard}>
                                <div className={styles.rightList}>
                                    <span className={styles.recommendedHeader}>Recommended Pages</span>
                                    {recommendedPages.map((page, index, arr) => (
                                        <div key={page.id} className={styles.pageWrapper}>
                                            <div
                                                className={styles.pageItem}
                                                onClick={() => navigate(`/profile/${page.id}`)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <div className={styles.pageAvatarWrapper}>
                                                    <img src={page.avatar} alt={page.name} className={styles.pageAvatar} />
                                                </div>
                                                <div className={styles.pageInfo}>
                                                    <span className={styles.pageName}>{page.page_name}</span>
                                                    <span className={styles.pageCategory}>{page.page_category}</span>
                                                </div>
                                            </div>
                                            {index !== arr.length - 1 && <div className={styles.divider} />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    )
}