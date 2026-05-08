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
        setResults({
            people: [
                { id: 1, username: "ahmedkhalil", full_name: "Ahmed Khalil", avatar: null, university: "PTUK" },
                { id: 2, username: "laithh", full_name: "Laith Hassan", avatar: null, university: "Birzeit" },
                { id: 3, username: "saranasser", full_name: "Sara Nasser", avatar: null, university: "An-Najah" },
            ],
            communities: [
                { id: 1, name: "Palestine Tech Students", avatar: null, members_count: 1240, is_member: true },
                { id: 2, name: "CS Palestine Network", avatar: null, members_count: 873, is_member: false },
            ],
            pages: [
                { id: 1, name: "TechnoPark - Palestine", avatar: null, category: "Business Center" },
                { id: 2, name: "Palestine Technical University", avatar: null, category: "Education" },
            ],
            posts: [
                { id: 1, content: "Just finished my finals at PTUK — what a semester!", created_at: new Date().toISOString(), likes_count: 12, is_liked: false, is_saved: false, media: [], author: { id: 99, username: "ahmedkhalil", avatar: null } },
                { id: 2, content: "Excited to announce I'll be joining a new internship this summer!", created_at: new Date().toISOString(), likes_count: 34, is_liked: true, is_saved: false, media: [], author: { id: 98, username: "laithh", avatar: null } },
            ]
        });

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
                                                    <img src={avatarUrl(person.avatar)} alt="" className={styles.personAvatar} />
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
                                        {(filter === "All") && <h2 className={styles.sectionTitle}>Pages</h2>}
                                        <div className={styles.listStack}>
                                            {visiblePages.map(p => (
                                                <div
                                                    key={p.id}
                                                    className={styles.listItem}
                                                    onClick={() => navigate(`/profile/${p.id}`)}
                                                >
                                                    {p.avatar
                                                        ? <img src={avatarUrl(p.avatar)} alt="" className={styles.listAvatar} style={{ borderRadius: 10 }} />
                                                        : <div className={styles.listAvatarPlaceholder}>📄</div>
                                                    }
                                                    <div className={styles.listInfo}>
                                                        <div className={styles.listName}>{p.name}</div>
                                                        <div className={styles.listSub}>Page{p.category ? ` · ${p.category}` : ""}</div>
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