import styles from './profilepage.module.css';
import Header from '../../components/pagelayout/header/header';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import PostCard from '../../components/posts/postCard';
import UserDetails from '../../components/userDetails/userDetails';
import CommentModal from '../../components/comments/commentsModal';
import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav'
import FriendsSuggestion from '../../components/recentlycontacted/recentlyContacted';
import {
    User,
    UserPlus,
    Bell,
    Users,
    Settings,
    Languages,
    HelpCircle,
    MessageSquare
} from "lucide-react";


export default function ProfilePage() {
    const [theme, setTheme] = useState("dark");
    const [user, setUser] = useState(null);
    const [friendStatus, setFriendStatus] = useState("none");
    const [currentUser, setCurrentUser] = useState(null);
    const token = localStorage.getItem("access");
    const [userLoading, setUserLoading] = useState(true);
    const [userError, setUserError] = useState("");
    const [selectedPost, setSelectedPost] = useState(null);
    const [posts, setPosts] = useState([]);
    const [friends, setFriends] = useState([]);
    const [friendsLoading, setFriendsLoading] = useState(false);
    const [postsLoading, setPostsLoading] = useState(true);
    const [postsError, setPostsError] = useState("");
    const [activeTab, setActiveTab] = useState("Photos");
    const { pathname } = useLocation();
    const { userId } = useParams();
    const navigate = useNavigate();

    const isActive = (path) => pathname === path || pathname.startsWith(path + "/");


    const loadCurrentUser = async () => {
        try {
            const res = await fetch("http://localhost:8000/api/auth/me/", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setCurrentUser(data);
        } catch (e) {
            console.error(e);
        }
    };

    const loadProfileUser = async () => {
        try {
            const res = await fetch(`http://localhost:8000/api/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            let data;
            try {
                data = await res.json();
            } catch (err) {
                setUserError("API Error: Backend returned HTML. Check server endpoint.");
                setUser(null);
                setUserLoading(false);
                return;
            }

            if (!res.ok) {
                setUserError(data?.message || "Failed to load user");
                setUser(null);
                return;
            }

            setUser(data);
            setFriendStatus(data.friend_status);
            if (data?.id) loadPosts(data.id);
        } catch (e) {
            setUser(null);
            setUserError(e?.message || "Something went wrong");
        } finally {
            setUserLoading(false);
        }
    };
    const handleAddFriend = async () => {
        try {
            const res = await fetch(`http://localhost:8000/api/friends/request/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ to_user: userId }),
            });

            if (res.ok) {
                setFriendStatus("sent");
            }
        } catch (e) {
            console.error(e);
        }
    };
    const loadFriends = async (userId) => {
        try {
            setFriendsLoading(true);

            const res = await fetch(`http://localhost:8000/api/users/${userId}/friends/`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("access")}`,
                },
            });

            const data = await res.json();
            console.log("FRIENDS:", data);

            setFriends(data);
        } catch (err) {
            console.error("Failed to load friends:", err);
        } finally {
            setFriendsLoading(false);
        }
    };
    const handleAccept = async () => {
        const res = await fetch(`/api/friends/accept/`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ user_id: userId }),
        });

        if (res.ok) {
            setFriendStatus("friends");
        }
    };

    const loadPosts = async (id) => {
        try {
            const res = await fetch(`http://localhost:8000/api/posts?user=${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            let data;
            try {
                data = await res.json();
            } catch (err) {
                setPostsError("Invalid server response.");
                setPosts([]);
                setPostsLoading(false);
                return;
            }

            if (!res.ok) {
                setPostsError(data?.message || "Failed to load posts");
                setPosts([]);
                return;
            }
            setPosts(Array.isArray(data) ? data : []);
        } catch (e) {
            setPostsError(e?.message || "Something went wrong");
            setPosts([]);
        } finally {
            setPostsLoading(false);
        }
    }

    useEffect(() => {
        loadCurrentUser();
        loadProfileUser();
        loadFriends(userId);
    }, [userId]);



    const handleMessage = () => {
        navigate(`/messages/${userId}`);
    };

    const toggleTheme = () => setTheme((p) => (p === "light" ? "dark" : "light"));
    const openComments = (post) => setSelectedPost(post);
    const closeComments = () => setSelectedPost(null);
    const photoPosts = posts.filter(post => {
        const fileUrl = post.image || post.image_url || (Array.isArray(post.media) && post.media[0]?.url);
        if (!fileUrl || typeof fileUrl !== 'string') return false;
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'];
        return imageExtensions.some(ext => fileUrl.toLowerCase().endsWith(ext));
    });

    const isOwnProfile = currentUser?.id === Number(userId);
    const username = user?.username || "Username";
    const role = user?.role || "Role";
    const fullName = user?.full_name || user?.fullName || "Full name";
    const university = user?.university || "University";
    const major = user?.major || "Major";
    const bio = user?.bio;
    const avatarUrl = user?.avatar_url || user?.avatar || "";
    const coverUrl = user?.cover_url || user?.cover || "";

    return (
        <div className={styles.darkContainer}>
            <div className={`${styles.header} ${styles.page}`}>
                <Header theme={theme} toggleTheme={toggleTheme} user={currentUser} />
            </div>

            <div className={`${styles.page} ${styles.content}`}>

                <SideBarNav
                    variant={isOwnProfile ? "profile" : "default"}
                    currentUser={currentUser}
                />
                <div className={styles.profileContent}>
                    {userLoading && <div className={styles.notice}>Loading profile...</div>}


                    <div className={styles.profileCard}>
                        <div className={styles.coverWrap}>
                            {coverUrl ? <img className={styles.coverImage} src={coverUrl} alt="cover" /> : <div className={styles.coverPlaceholder} />}
                            {isOwnProfile && <button className={styles.editCoverBtn}>Edit ✎</button>}
                        </div>

                        <div className={styles.profileHeaderRow}>
                            <div className={styles.avatarWrap}>
                                <div className={styles.avatarCircle}>
                                    {avatarUrl ? <img className={styles.avatarImage} src={avatarUrl} alt="avatar" /> : <User size={52} />}
                                </div>
                            </div>

                            <div className={styles.profileMeta}>
                                <div className={styles.nameRow}>
                                    <h2 className={styles.username}>{username}</h2>
                                    <span className={styles.role}>/{role}</span>
                                </div>
                                <div className={styles.subRow}>
                                    <span className={styles.fullName}>{fullName}</span>
                                    <span className={styles.dot} />
                                    {!isOwnProfile && (
                                        <>
                                            <span>{user?.friends_count || 0} friends</span>
                                            <span className={styles.dot} />
                                        </>
                                    )}
                                    <span className={styles.uni}>{university} - {major}</span>
                                </div>
                                <p className={styles.bio}>{bio}</p>
                            </div>

                            {/* Positioned on the Right */}
                            {!isOwnProfile && (
                                <div className={styles.profileActions}>

                                    <button className={styles.messageBtn} onClick={handleMessage}>
                                        <MessageSquare size={18} />
                                    </button>

                                    {friendStatus === "none" && (
                                        <button className={styles.addFriendBtn} onClick={handleAddFriend}>
                                            <UserPlus size={18} />
                                            Add friend
                                        </button>
                                    )}

                                    {friendStatus === "sent" && (
                                        <button className={styles.pendingBtn}>
                                            ⏳ Request Sent
                                        </button>
                                    )}

                                    {friendStatus === "received" && (
                                        <>
                                            <button className={styles.acceptBtn} onClick={handleAccept}>
                                                ✅ Accept
                                            </button>
                                            <button className={styles.declineBtn}>
                                                ❌ Decline
                                            </button>
                                        </>
                                    )}

                                    {friendStatus === "friends" && (
                                        <button className={styles.friendsBtn}>
                                            👥 Friends
                                        </button>
                                    )}

                                </div>
                            )}
                        </div>

                        <div className={styles.hr} />

                        <div className={styles.tabs}>
                            {['Posts', 'Photos', 'Friends'].map(tab => (
                                <button
                                    key={tab}
                                    className={`${styles.tabBtn} ${activeTab === tab ? styles.tabActive : ''}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {activeTab === 'Posts' && (
                            <div className={styles.postsSection}>
                                {postsLoading ? <div className={styles.notice}>Loading...</div> :
                                    posts.map(post => <PostCard key={post.id} post={post} openComments={openComments} />)}
                            </div>
                        )}

                        {activeTab === 'Photos' && (
                            <div className={styles.photosGrid}>
                                {photoPosts.length > 0 ? photoPosts.map((post, idx) => (
                                    <img
                                        key={post.id}
    
                                        className={`${styles.photoItem} ${idx === 0 ? styles.photoLarge : ''}`}
                                        src={post.image || post.image_url || post.media?.[0]?.url}
                                        alt="Latest user content"
                                        onClick={() => openComments(post)}
                                    />
                                )) : <div className={styles.notice}>No photos found.</div>}
                            </div>
                        )}

                        {activeTab === 'Friends' && <div className={styles.notice}>{friendsLoading ? (
                            <p>Loading friends...</p>
                        ) : friends.length === 0 ? (
                            <p>No friends yet.</p>
                        ) : (
                            <div className={styles.friendsGrid}>
                                {friends.map((f) => (
                                    <div
                                        key={f.id}
                                        className={styles.friendCard}
                                        onClick={() => navigate(`/profile/${f.id}`)}
                                    >
                                        <img
                                            src={
                                                f.avatar?.startsWith("http")
                                                    ? f.avatar
                                                    : `http://localhost:8000${f.avatar}`
                                            }
                                            alt={f.username}
                                            className={styles.friendAvatar}
                                        />
                                        <span>{f.username}</span>
                                    </div>
                                ))}
                            </div>
                        )}</div>}
                    </div>
                </div>

                <div className={styles.rightSection}>
                    {isOwnProfile ? (
                        <FriendsSuggestion />
                    ) : (
                        <UserDetails user={user} />
                    )}
                </div>
            </div>

            {selectedPost && (
                <CommentModal
                    post={selectedPost}
                    onClose={closeComments}
                    currentUser={currentUser}
                />
            )}
        </div>
    )
}