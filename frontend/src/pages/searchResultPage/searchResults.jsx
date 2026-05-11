import Header from "../../components/pagelayout/header/header"
import SidebarNav from "../../components/pagelayout/sidebarnav/sideBarNav"
import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import PostCard from '../../components/posts/postCard'
import styles from './searchResults.module.css'
import CommunityCard from '../../components/communityCard/communityCard'

const API = "http://localhost:8000";

export default function SearchResults() {
    const [theme, setTheme] = useState('dark');
    const [user, setUser] = useState(null);
    const [filter, setFilter] = useState("All");
    const [results, setResults] = useState({ people: [], communities: [], posts: [], pages: [] });
    const [loading, setLoading] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);

    const [searchParams] = useSearchParams();
    const query = searchParams.get("q") || "";
    const navigate = useNavigate();

    const toggleTheme = () => setTheme(p => p === 'dark' ? 'light' : 'dark');

    const filters = [
        { key: "All", label: "All" },
        { key: "Posts", label: "Posts" },
        { key: "Communities", label: "Communities" },
        { key: "Pages", label: "Pages" },
        { key: "People", label: "People" },
    ];

    // Fetch current user
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem("access");
                const res = await fetch(`${API}/api/auth/me/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) setUser(await res.json());
            } catch (e) { console.error(e); }
        };
        fetchUser();
    }, []);

    // Fetch search results whenever query changes
    useEffect(() => {
        if (!query.trim()) return;
        const fetchResults = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem("access");
                const res = await fetch(
                    `${API}/api/search/?q=${encodeURIComponent(query)}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (res.ok) setResults(await res.json());
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchResults();
    }, [query]);

    // What to show based on active filter
    const visiblePeople = (filter === "All" || filter === "People") ? (results.people || []) : [];
    const visibleCommunities = (filter === "All" || filter === "Communities") ? (results.communities || []) : [];
    const visiblePages = (filter === "All" || filter === "Pages") ? (results.pages || []) : [];
    const visiblePosts = (filter === "All" || filter === "Posts") ? (results.posts || []) : [];

    const totalCount = visiblePeople.length + visibleCommunities.length + visiblePages.length + visiblePosts.length;

    const avatarUrl = (url) => url
        ? url.startsWith("http") ? url : `${API}${url}`
        : "/default-avatar.png";

    return (
        <div className={styles.darkContainer}>
            <div className={`${styles.header} ${styles.page}`}>
                <Header theme={theme} toggleTheme={toggleTheme} user={user} />
            </div>

            <div className={`${styles.content} ${styles.page}`}>
                <SidebarNav />

                <div className={styles.resultsContainer}>
                    <h1 className={styles.title}>
                        <span className={styles.highlight}>Search</span> Results for "{query}"
                    </h1>

                    {/* Filters */}
                    <div className={styles.filters}>
                        {filters.map(f => (
                            <button
                                key={f.key}
                                className={`${styles.filterBtn} ${filter === f.key ? styles.active : ""}`}
                                onClick={() => setFilter(f.key)}
                            >
                                {f.label}
                                {/* Count badge per filter */}
                                {f.key !== "All" && (() => {
                                    const count =
                                        f.key === "People" ? results.people?.length :
                                            f.key === "Communities" ? results.communities?.length :
                                                f.key === "Pages" ? results.pages?.length :
                                                    f.key === "Posts" ? results.posts?.length : 0;
                                    return count > 0
                                        ? <span className={styles.filterCount}>{count}</span>
                                        : null;
                                })()}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className={styles.notice}>Searching...</div>
                    ) : !query.trim() ? (
                        <div className={styles.notice}>Enter a search term to see results.</div>
                    ) : totalCount === 0 ? (
                        <div className={styles.notice}>No results found for "{query}"</div>
                    ) : (
                        <div className={styles.results}>

                            <div className={styles.innerContainer}>


                                {visiblePeople.length > 0 && (
                                    <section className={styles.section}>
                                        {(filter === "All") && <h2 className={styles.sectionTitle}>People</h2>}
                                        <div className={styles.cardGrid}>
                                            {visiblePeople.map(person => (
                                                <div
                                                    key={person.id}
                                                    className={styles.personCard}
                                                    onClick={() => navigate(`/profile/${person.id}`)}
                                                >
                                                    <img src={(() => {
                                                        const av = person.profile?.profile_image || person.avatar_url || person.avatar;
                                                        if (!av) return "/default-avatar.png";
                                                        return av.startsWith("http") ? av : `${API}${av}`;
                                                    })()} alt="" className={styles.personAvatar} />
                                                    <div className={styles.personName}>{person.full_name || person.username}</div>
                                                    <div className={styles.personSub}>@{person.username}</div>
                                                    {person.university && <div className={styles.personSub}>{person.university}</div>}
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* ── Communities ── */}
                                {visibleCommunities.length > 0 && (
                                    <section className={styles.section}>
                                        {(filter === "All") && <h2 className={styles.sectionTitle}>Communities</h2>}
                                        <div className={styles.listStack}>
                                            {visibleCommunities.map(c => (
                                                <CommunityCard
                                                    key={c.id}
                                                    community={c}
                                                    variant="large"
                                                    setCommunities={(updater) => {
                                                        setResults(prev => ({
                                                            ...prev,
                                                            communities: typeof updater === 'function'
                                                                ? updater(prev.communities)
                                                                : updater
                                                        }));
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* ── Pages ── */}
                                {visiblePages.length > 0 && (
                                    <section className={styles.section}>
                                        {filter === "All" && <h2 className={styles.sectionTitle}>Pages</h2>}

                                        <div className={styles.listStack}>
                                            {visiblePages.map(p => (
                                                <div
                                                    key={p.id}
                                                    className={styles.listItem}
                                                    onClick={() => navigate(`/profile/${p.id}`)}
                                                >
                                                    {/* Use profile_image from your backend */}
                                                    {p.profile_image ? (
                                                        <img
                                                            src={p.profile_image} // No need for avatarUrl() if the backend provides the full http://localhost link
                                                            alt={p.page_full_name}
                                                            className={styles.listAvatar}
                                                            style={{ borderRadius: 10, objectFit: 'cover' }}
                                                        />
                                                    ) : (
                                                        <div className={styles.listAvatarPlaceholder}>📄</div>
                                                    )}

                                                    <div className={styles.listInfo}>
                                                        {/* Use page_full_name for the correct display name */}
                                                        <div className={styles.listName}>{p.page_full_name}</div>

                                                        {/* Use page_type for the category/subtitle */}
                                                        <div className={styles.listSub}>
                                                            Page{p.page_type ? ` · ${p.page_type}` : ""}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}
                                {/* ── Posts ── */}
                                {visiblePosts.length > 0 && (
                                    <section className={styles.section}>
                                        {(filter === "All") && <h2 className={styles.sectionTitle}>Posts</h2>}
                                        <div className={styles.postsStack}>
                                            {visiblePosts.map(post => (
                                                <PostCard
                                                    key={post.id}
                                                    post={post}
                                                    openComments={setSelectedPost}
                                                    isOwnProfile={false}
                                                />
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </div>
                        </div>

                    )}
                </div>
            </div>
        </div>
    );
}