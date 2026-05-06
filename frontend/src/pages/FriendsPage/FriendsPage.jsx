import styles from './FriendsPage.module.css'
import Header from '../../components/pagelayout/header/header'
import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav'
import { useState, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Posts from '../../components/posts/postCard';

export default function FriendsPage() {
    const [theme, setTheme] = useState('dark')
    const [currentUser, setCurrentUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [friends, setFriends] = useState([]);
    const [posts, setPosts] = useState([]);
    const [userError, setUserError] = useState("");
    const [userLoading, setUserLoading] = useState(true);
    const token = localStorage.getItem("access");
    const navigate = useNavigate();

    const handleFriendClick = (friendId) => {
        navigate(`/profile/${friendId}`);
    };
    const { userId } = useParams();
    const isOwnProfile = currentUser?.id === Number(userId);

    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    };
    const filteredFriends = friends.filter(friend =>
        friend.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (friend.major && friend.major.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    useEffect(() => {
        const fetchPageData = async () => {
            setUserLoading(true);
            try {
                const token = localStorage.getItem("access");
                if (!token) {
                    setUserLoading(false);
                    return;
                }


                const userRes = await fetch("http://localhost:8000/api/auth/me/", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!userRes.ok) throw new Error("User fetch failed");
                const userData = await userRes.json();
                setCurrentUser(userData);

                const [friendsRes, postsRes] = await Promise.all([
                    fetch(`http://localhost:8000/api/users/${userData.id}/friends/`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    fetch(`http://localhost:8000/api/posts/feed/?filter=friends`, {
                        headers: { Authorization: `Bearer ${token}` },
                    })
                ]);
                if (friendsRes.ok && postsRes.ok) {
                    if (friendsRes.ok && postsRes.ok) {
                        const friendsData = await friendsRes.json();
                        const postsData = await postsRes.json();

                        // 1. Access the 'all' array from your response object
                        // 2. The objects are already "flattened" friend profiles, not "friendship" bridge objects
                        const formattedFriends = (friendsData.all || []).map(f => {
                            return {
                                id: f.id,
                                username: f.username,
                                // Your API uses 'avatar_url', not 'avatar'
                                avatar: f.avatar_url
                                    ? (f.avatar_url.startsWith("http")
                                        ? f.avatar_url
                                        : `http://localhost:8000${f.avatar_url}`)
                                    : "/default-avatar.png",
                                major: f.major || "No Major Set",
                                is_online: f.is_online || false
                            };
                        });

                        // 3. Handle posts (in case your backend wraps them in 'results' or 'posts')
                        const actualPosts = Array.isArray(postsData)
                            ? postsData
                            : (postsData.results || postsData.posts || []);

                        setFriends(formattedFriends);
                        setPosts(actualPosts);
                    }
                }

            } catch (error) {
                console.error("FriendsPage Error:", error);
                setUserError("Could not load your feed.");
            } finally {
                setUserLoading(false);
            }
        };

        fetchPageData();
    }, [token]);

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
                <div className={styles.friendsPostsSection}>
                    <h1 className={styles.title}>
                        <span className={styles.highlight}>Friends</span> posts
                    </h1>
                    <div className={styles.postContainer}>
                        <div className={styles.innerContainer}>
                            {userLoading ? (
                                <p style={{ color: '#888', textAlign: 'center', marginTop: '20px' }}>Loading posts...</p>
                            ) : posts.length > 0 ? (
                                <Posts posts={posts} />
                            ) : (
                                <p style={{ color: '#888', textAlign: 'center', marginTop: '20px' }}>No recent posts from friends.</p>
                            )}

                        </div>

                    </div>


                </div>
                <div className={styles.rightSection}>
                    <div className={styles.pill}>FRIENDS LIST</div>
                    <div className={styles.rightCard}>
                        <div className={styles.searchContainer}>
                            <input
                                type="text"
                                placeholder="Search friends..."
                                className={styles.searchBar}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className={styles.rightList}>
                            {filteredFriends.length > 0 ? (
                                filteredFriends.map((friend, index) => (
                                    <div key={friend.id} className={styles.friendWrapper}>
                                        <div className={styles.friendItem} onClick={() => handleFriendClick(friend.id)}>
                                            <div className={styles.friendAvatarWrapper}>
                                                <img
                                                    src={friend.avatar || "/default-avatar.png"}
                                                    alt={friend.username}
                                                    className={styles.friendAvatar}
                                                />
                                                <div className={`${styles.statusDot} ${friend.is_online ? styles.online : styles.offline}`}></div>
                                            </div>
                                            <div className={styles.friendInfo}>
                                                <div className={styles.friendName}>{friend.username}</div>
                                                <div className={styles.friendMajor}>{friend.major || "No Major Set"}</div>
                                            </div>
                                        </div>

                                        {index !== filteredFriends.length - 1 && (
                                            <div className={styles.divider}></div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className={styles.noDataText}>
                                    {searchTerm ? "No friends match your search." : "No friends yet."}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

            </div>

        </div>
    )
}