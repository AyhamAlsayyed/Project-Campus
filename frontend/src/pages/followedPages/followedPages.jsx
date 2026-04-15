import styles from './followedPages.module.css'
import { useState, useEffect } from 'react'
import Header from '../../components/pagelayout/header/header'
import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav'
import PostCard from '../../components/posts/postCard'
import { ChevronLeft, ChevronRight } from 'lucide-react'
export default function FollowedPages() {
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
                const formattedPages = pagesData.map(p => ({
                    ...p,
                    avatar: p.avatar
                        ? (p.avatar.startsWith("http")
                            ? p.avatar
                            : `http://localhost:8000${p.avatar}`)
                        : "/default-avatar.png"
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
                    avatar: p.avatar
                        ? (p.avatar.startsWith("http") ? p.avatar : `http://localhost:8000${p.avatar}`)
                        : "https://i.pravatar.cc/150?img=default"
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
                    <div className={styles.postContainer}>
                        <div className={styles.innerContainer}>
                            {posts.length > 0 ? (
                                posts.map(post => (
                                    <PostCard key={post.id} post={post} />
                                ))
                            ) : (
                                <p style={{ color: "#888", textAlign: "center" }}>
                                    No posts from followed pages.
                                </p>
                            )}


                        </div>

                    </div>

                </div>
                <div className={styles.rightSection}>
                    <div className={styles.rightSectionWrapper}>
                        <div className={styles.pill}>FOLLOWED PAGES</div>
                        <div className={styles.rightCard}>
                            <div className={styles.searchContainer}>
                                <input
                                    type="text"
                                    placeholder="Search followed pages..."
                                    className={styles.searchBar}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className={styles.rightList}>
                                {pages
                                    .filter(page => page.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                    .map((page, index, arr) => (
                                        <div key={page.id} className={styles.pageWrapper}>
                                            <div className={styles.pageItem}>
                                                <div className={styles.pageAvatarWrapper}>
                                                    <img src={page.avatar} alt={page.name} className={styles.pageAvatar} />
                                                </div>
                                                <div className={styles.pageInfo}>
                                                    <span className={styles.pageName}>{page.name}</span>
                                                    <span className={styles.pageCategory}>Page</span>
                                                </div>
                                            </div>
                                            {index !== arr.length - 1 && <div className={styles.divider} />}
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>


                    {recommendedPages.length > 0 && (
                        <div className={styles.recommendedContainer}>

                            {/* 1. Header INSIDE the container, not a pill */}
                            <div className={styles.recommendedHeader}>

                                <h2>Recommended Pages</h2>
                            </div>


                            <div className={styles.recommendedSliderWindow}>
                                <div
                                    className={styles.recommendedTrack}
                                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                                >
                                    {recommendedPages.map((page) => (
                                        <div key={page.id} className={styles.recommendedItem}>
                                            <img src={page.avatar} alt={page.name} className={styles.recommendedAvatar} />
                                            <span className={styles.recommendedName}>{page.name}</span>
                                            <span className={styles.recommendedCategory}>{page.category}</span>
                                            <button className={styles.recommendedFollowBtn}>Follow</button>
                                        </div>
                                    ))}
                                </div>
                            </div>


                            <div className={styles.recommendedControls}>
                                <button className={styles.recommendedArrow} onClick={handlePrevSlide}>
                                    <ChevronLeft size={20} />
                                </button>

                                <div className={styles.recommendedDotsWrapper}>
                                    {recommendedPages.map((_, index) => (
                                        <button
                                            key={index}
                                            className={`${styles.recommendedDot} ${currentSlide === index ? styles.recommendedActiveDot : ''}`}
                                            onClick={() => setCurrentSlide(index)}
                                        />
                                    ))}
                                </div>

                                <button className={styles.recommendedArrow} onClick={handleNextSlide}>
                                    <ChevronRight size={20} />
                                </button>
                            </div>

                        </div>
                    )}

                </div>
            </div>
        </div>
    )
}