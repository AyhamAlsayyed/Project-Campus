import styles from './joinedCommunties.module.css'
import { useEffect, useState } from 'react'
import Header from '../../components/pagelayout/header/header';
import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav'
import { useNavigate } from "react-router-dom";
export default function FollowedCommunities() {
    const [theme, setTheme] = useState('dark');
    const [searchTerm, setSearchTerm] = useState('');
    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    }
    const [userLoading, setUserLoading] = useState(true);
    const [userError, setUserError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [communities, setCommunities] = useState([]);
    const [recommended, setRecommended] = useState([]);
    const [expandedIds, setExpandedIds] = useState({});

    const toggleExpand = (id) => {
        setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
    };
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            setUserLoading(true);

            try {
                const token = localStorage.getItem("access");
                if (!token) return;

                const headers = {
                    Authorization: `Bearer ${token}`,
                };

                const [userRes, joinedRes, recommendedRes] = await Promise.all([
                    fetch("http://localhost:8000/api/auth/me/", { headers }),
                    fetch("http://localhost:8000/api/communities/?filter=joined", { headers }),
                    fetch("http://localhost:8000/api/communities/recommended/", { headers }) // <-- you create this endpoint later
                ]);

                if (!userRes.ok) throw new Error("User fetch failed");

                const userData = await userRes.json();
                setCurrentUser(userData);


                if (joinedRes.ok) {
                    const joinedData = await joinedRes.json();

                    const formattedJoined = joinedData.map(c => ({
                        ...c,
                        avatar: c.avatar
                            ? (c.avatar.startsWith("http") ? c.avatar : `http://localhost:8000${c.avatar}`)
                            : "/default-avatar.png",

                        bgImage: c.image
                            ? (c.image.startsWith("http") ? c.image : `http://localhost:8000${c.image}`)
                            : 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80'

                    }));

                    setCommunities(formattedJoined);
                }


                if (recommendedRes.ok) {
                    const recData = await recommendedRes.json();

                    const formattedRec = recData.map(c => ({
                        ...c,
                        avatar: c.avatar
                            ? (c.avatar.startsWith("http")
                                ? c.avatar
                                : `http://localhost:8000${c.avatar}`)
                            : "/default-avatar.png"
                    }));

                    setRecommended(formattedRec);
                }

            } catch (err) {
                console.error("Communities Page Error:", err);
                setUserError("Failed to load communities.");
            } finally {
                setUserLoading(false);
            }
        };

        fetchData();
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

    return (
        <div className={styles.darkContainer}>
            <div className={`${styles.header} ${styles.page}`}>
                <Header theme={theme} toggleTheme={toggleTheme} user={currentUser} />
            </div>
            <div className={`${styles.content} ${styles.page}`}>
                <SideBarNav variant="profile" currentUser={currentUser} />
                <div className={styles.followedCommunitiesPosts}>
                    <h1 className={styles.title}>
                        <span className={styles.highlight}>Communities</span> You Joined
                    </h1>

                    <div className={styles.postContainer}>
                        <div className={styles.innerContainer}>
                            {communities.length > 0 ? (
                                communities.map((community) => {
                                    const isExpanded = expandedIds[community.id];
                                    const desc = community.description || "consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.";
                                    const isLong = desc.length > 70;

                                    return (
                                        <div
                                            key={community.id}
                                            className={styles.communityCard}
                                            style={{
                                                backgroundImage: `linear-gradient(to right, rgba(25, 25, 25, 0.95) 10%, rgba(25, 25, 25, 0.7) 40%, rgba(25, 25, 25, 0.2) 100%),  url(${community.bgImage})`
                                            }}
                                        >
                                            <div className={styles.communityContent}>
                                                <div className={styles.communityTitleRow}>
                                                    <span className={styles.communityTitle}>
                                                        {community.name}
                                                    </span>

                                                    {/* Verified Badge SVG */}
                                                    <svg className={styles.verifiedIcon} viewBox="0 0 24 24">
                                                        <path fill="#fff" d="M12 2l2.4 2.2 3.2-.8.9 3.2 2.9 1.7-1.4 3 1.4 3-2.9 1.7-.9 3.2-3.2-.8L12 22l-2.4-2.2-3.2.8-.9-3.2-2.9-1.7 1.4-3-1.4-3 2.9-1.7.9-3.2 3.2.8L12 2z" />
                                                        <path fill="#1a1a1a" d="M10.5 16.5l-4-4 1.4-1.4 2.6 2.6 6.6-6.6 1.4 1.4z" />
                                                    </svg>
                                                </div>

                                                <p className={styles.communityDesc}>
                                                    {isExpanded ? desc : `${desc.substring(0, 70)}... `}
                                                    {isLong && (
                                                        <span
                                                            className={styles.readMoreBtn}
                                                            onClick={() => toggleExpand(community.id)}
                                                        >
                                                            {isExpanded ? 'read less' : 'read more'}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>

                                            <button
                                                className={styles.viewButton}
                                                onClick={() => navigate(`/communities/${community.id}`)}
                                            >
                                                View
                                            </button>
                                        </div>
                                    );
                                })
                            ) : (
                                <p style={{ color: "#888", textAlign: "center" }}>
                                    You haven’t joined any communities yet.
                                </p>
                            )}

                        </div>
                    </div>
                </div>
                <div className={styles.rightSection}>
                    <div className={styles.rightSectionWrapper}>
                        <div className={styles.pill}>RECOMMENDED COMMUNITIES</div>
                        <div className={styles.rightCard}>

                            <div className={styles.rightList}>
                                {recommended
                                    .filter(c =>
                                        c.name.toLowerCase().includes(searchTerm.toLowerCase())
                                    )
                                    .map((community, index, arr) => (
                                        <div key={community.id} className={styles.communityWrapper}>

                                            <div className={styles.communityItem}>
                                                <div className={styles.communityAvatarWrapper}>
                                                    <img
                                                        src={community.avatar}
                                                        alt={community.name}
                                                        className={styles.communityAvatar}
                                                    />
                                                </div>

                                                <div className={styles.communityInfo}>
                                                    <span className={styles.communityName}>
                                                        {community.name}
                                                    </span>
                                                    <span className={styles.communityCategory}>
                                                        Community
                                                    </span>
                                                </div>
                                            </div>

                                            {index !== arr.length - 1 && (
                                                <div className={styles.divider} />
                                            )}

                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>

                </div>


            </div>


        </div>
    )
}