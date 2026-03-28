
import styles from './communities.module.css';
import Header from '../../components/pagelayout/header/header'
import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav';
import CommunityCard from '../../components/communityCard/communityCard'
import { useState, useEffect } from 'react';


export default function Community() {
    const [theme, setTheme] = useState('dark');
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState(null)
    const [communities, setCommunities] = useState([]);
    const [filter, setFilter] = useState("recommended");
    const loadUser = async () => {
        const token = localStorage.getItem("access");

        if (!token) return;

        try {
            const res = await fetch("http://localhost:8000/api/auth/me/", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();
            setUser(data);

        } catch (err) {
            console.error("Failed to load user");
        }
    };
    useEffect(() => {
        const fetchCommunities = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem("access");
                const res = await fetch("http://localhost:8000/api/communities/?filter=${filter}", {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    },
                });
                const data = await res.json();

                const formatted = data.map(c => ({
                    ...c,
                    isJoined: c.is_joined,
                    isVerified: c.is_verified,
                    isPrivate: c.is_private,
                    requestSent: c.request_sent
                }));

                setCommunities(formatted);
            } catch (err) {
                console.error("Error fetching communities:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCommunities();
    }, [filter]); // Re-
    useEffect(() => {
        loadUser();
    }, []);

    const toggleTheme = () => { setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light')); }
    return (
        <div className={styles.darkContainer}>
            <div className={`${styles.header} ${styles.page}`}>
                <Header theme={theme} toggleTheme={toggleTheme} user={user} />

            </div>
            <div className={`${styles.content} ${styles.page}`}>
                <SideBarNav theme={theme} toggleTheme={toggleTheme} user={user} />
                <div className={styles.mainContent}>
                    <h1 className={styles.title}>
                        Looking for - <br /> <span className={styles.highlight}>COMMUNITIES</span> to be part of?
                    </h1>
                     <div className={styles.filters}>
                        <button
                            className={`${styles.filterBtn} ${filter === "recommended" ? styles.active : ""}`}
                            onClick={() => setFilter("recommended")}
                        >
                            Recommended
                        </button>



                        <button
                            className={`${styles.filterBtn} ${filter === "popular" ? styles.active : ""}`}
                            onClick={() => setFilter("popular")}
                        >
                            Popular
                        </button>

                        <button
                            className={`${styles.filterBtn} ${filter === "trending" ? styles.active : ""}`}
                            onClick={() => setFilter("trending")}
                        >
                            Trending
                        </button>
                    </div>
                    <div className={styles.communitiesContainer}>

                        <div className={styles.innerContainer}>
                            {communities.map((community, index) => (
                                <div key={index} className={styles.itemWrapper}>
                                    <CommunityCard
                                        community={community}
                                        setCommunities={setCommunities}
                                    />
                                    {index !== communities.length - 1 && (
                                        <div className={styles.divider} />
                                    )}
                                </div>
                            ))}



                        </div>

                    </div>


                </div>
                <div className={styles.rightSection}>
                    <div className={styles.pill}>FRIENDS RELATED</div>
                    <div className={styles.rightCard}>


                        <div className={styles.rightList}>
                            {communities.map((community, index) => (
                                <CommunityCard
                                    key={index}
                                    community={community}
                                    setCommunities={setCommunities}
                                    variant="small"
                                />
                            ))}
                        </div>
                    </div>
                </div>


            </div>
        </div>
    )
}
