
import styles from './communities.module.css';
import Header from '../../components/pagelayout/header/header'
import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav';
import CommunityCard from '../../components/communityCard/communityCard'
import { useState , useEffect } from 'react';


export default function Community() {
    const [theme, setTheme] = useState('dark');
    const [loading , setLoading] = useState(true)
    const [user, setUser] = useState(null)
    const [communities, setCommunities] = useState([]);
    useEffect(() => {
        const fetchCommunities = async () => {
            try {
                const res = await fetch("http://localhost:8000/api/communities/");
                const data = await res.json();

                // optional mapping (if using Django snake_case)
                const formatted = data.map(c => ({
                    ...c,
                    isJoined: c.is_joined,
                    isVerified: c.is_verified
                }));

                setCommunities(formatted);
            } catch (err) {
                console.error("Error fetching communities:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCommunities();
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
                    <div className={styles.communitiesContainer}>
                        <div className={styles.innerContainer}>
                            {communities.map((community, index) => (
                                <div key={index} className={styles.itemWrapper}>
                                    <CommunityCard community={community} />
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
