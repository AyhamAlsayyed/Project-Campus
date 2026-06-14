import styles from './joinedCommunties.module.css'
import { useEffect, useState } from 'react'
import Header from '../../components/pagelayout/header/header';
import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav'
import { useNavigate } from "react-router-dom";
import CommunityCard from '../../components/communityCard/communityCard'
import API from '../../config';
import useTheme from '../../hooks/useTheme'
export default function FollowedCommunities() {
    const { theme, toggleTheme } = useTheme();
    const [searchTerm, setSearchTerm] = useState('');
  
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

                const headers = { Authorization: `Bearer ${token}` };

                const [userRes, joinedRes, recommendedRes] = await Promise.all([
                    fetch(`${API}/api/auth/me/`, { headers }),
                    fetch(`${API}/api/communities/?filter=joined`, { headers }),
                    fetch(`${API}/api/communities/?filter=recommended`, { headers })
                ]);

                if (userRes.ok) setCurrentUser(await userRes.json());

                if (joinedRes.ok) {
                    const joinedData = await joinedRes.json();
                    setCommunities(joinedData.map(c => ({ ...c, bgImage: c.image })));
                }

                if (recommendedRes.ok) {
                    const recData = await recommendedRes.json();

                    /* Optional: Filter out communities the user is already in 
                       from the recommended list so they don't see duplicates.
                    */
                    const filteredRecs = recData
                        .filter(c => !c.is_joined)
                        .map(c => ({ ...c, bgImage: c.image }));

                    setRecommended(filteredRecs);
                }

            } catch (err) {
                console.error("Fetch Error:", err);
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

                const res = await fetch(`${API}/api/auth/me/`, {
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
                    {communities.length > 0 ? (
                        <div className={styles.postContainer}>
                            <div className={styles.innerContainer}>
                                {communities.map((community, index) => (
                                    <div key={community.id} className={styles.itemWrapper}>
                                        <CommunityCard
                                            community={community}
                                            variant="large"
                                            setCommunities={setCommunities}
                                        />
                                        {index !== communities.length - 1 && (
                                            <div className={styles.dividerOne} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <span className={styles.emptyIcon}>🏘️</span>
                            <h2 className={styles.emptyTitle}>No communities yet</h2>
                            <p className={styles.emptySubtitle}>You haven't joined any communities yet.</p>
                        </div>
                    )}
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


                                            <CommunityCard
                                                community={community}
                                                variant="small"
                                                setCommunities={setCommunities}
                                            />

                                            {index !== arr.length - 1 && (
                                                <div className={styles.dividerTwo} />
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