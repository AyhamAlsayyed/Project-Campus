import styles from './profilepage.module.css';
import Header from '../../components/pagelayout/header/header';
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom';
import PostCard from '../../components/posts/postCard';
import FriendsSuggestion from '../../components/recentlycontacted/recentlyContacted'
import {
    User,
    UserPlus,
    Bell,
    Users,
    Settings,
    Languages,
    HelpCircle
} from "lucide-react";

export default function ProfilePage() {
    const [theme, setTheme] = useState("dark");
    const [user, setUser] = useState(null);
    const [userLoading, setUserLoading] = useState(true);
    const [userError, setUserError] = useState("");
    const [posts, setPosts] = useState([]);
    const [postsLoading, setPostsLoading] = useState(true);
    const [postsError, setPostsError] = useState("");
    const { pathname } = useLocation();
    const navigate = useNavigate();
  


    const isActive = (path) => pathname === path || pathname.startsWith(path + "/");

    const mainItems = [
        { label: "Profile", path: "/profile", Icon: User },
        { label: "Friends", path: "/friends", Icon: UserPlus },
        { label: "Pages", path: "/pages", Icon: Bell },
        { label: "Communities", path: "/communities", Icon: Users },
    ];

    const footerItems = [
        { label: "Settings", path: "/settings", Icon: Settings },
        { label: "Language", path: "/language", Icon: Languages },
        { label: "Help", path: "/help", Icon: HelpCircle },
    ];
    const loadUser = async () => {
        try {
            const res = await fetch("http://localhost:8000/api/auth/me/", {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            })
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setUserError("Failed to load user");
                setUser(null);
                return;
            }
            setUser(data);
            if (data?.id) {
                loadPosts(data.id);
            }
        } catch (e) {
            setUser(null);
            setUserError(e?.message || "Something went wrong");

        } finally {
            setUserLoading(false);
        }

    }
    const loadPosts = async (userId) => {
        try {
            const res = await fetch(`http://localhost:8000/api/posts/user=${user?.id}`, {
                credentials: "include",
            })
            const data = await res.json().catch(() => [])
            if (!res.ok) {
                setPostsError(data?.message || "Failed to load posts");
                setPosts([]);
                return;
            }
            setPosts(Array.isArray(data) ? data : [])

        } catch (e) {
            setPostsError(e?.message || "Something went wrong");
            setPosts([]);
        } finally {
            setPostsLoading(false);
        }
    }
    useEffect(() => {
        loadUser();

    }, [])
    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
    };
    const username = user?.username || "Username";
    const role = user?.role || "/student";
    const fullName = user?.full_name || user?.fullName || "Full real name";
    const university = user?.university || "University";
    const major = user?.major || "Major";
    const bio = user?.bio || "No bio yet.";


    const avatarUrl =
        user?.avatar_url ||
        user?.avatar ||
        user?.profile_picture ||
        user?.profilePicture ||
        "";
    const coverUrl = user?.cover_url || user?.cover || "";

    return (
        <div className={styles.darkContainer}>
            <div className={`${styles.header} ${styles.page}`}>
                <Header theme={theme} toggleTheme={toggleTheme} />
            </div>
            <div className={`${styles.page} ${styles.content}`}>
                <nav className={styles.sideBarNav}>
                    {mainItems.map(({ label, path, Icon }) => (
                        <button
                            key={path}
                            type="button"
                            onClick={() => navigate(path)}
                            className={`${styles.sideBarButton} ${isActive(path) ? styles.active : ""}`}
                        >
                            <Icon size={22} />
                            {label}
                        </button>
                    ))}

                    <div className={styles.divider} />

                    {footerItems.map(({ label, path, Icon }) => (
                        <button
                            key={path}
                            type="button"
                            onClick={() => navigate(path)}
                            className={`${styles.sideBarButton} ${isActive(path) ? styles.active : ""}`}
                        >
                            <Icon size={22} />
                            {label}
                        </button>
                    ))}

                    <span className={styles.copyright}>
                        © 2024 Project Campus. All rights reserved.
                    </span>
                </nav>
                <div className={styles.profileContent}>

                    {userLoading ? (
                        <div className={styles.notice}>Loading profile...</div>
                    ) : userError ? (
                        <div className={styles.noticeError}>{userError}</div>
                    ) : null}

                    <div className={styles.profileCard}>


                        <div className={styles.coverWrap}>
                            {coverUrl ? (
                                <img className={styles.coverImage} src={coverUrl} alt="cover" />
                            ) : (
                                <div className={styles.coverPlaceholder} />
                            )}

                            <button className={styles.editCoverBtn} type="button">
                                Edit ✎
                            </button>
                        </div>

                        <div className={styles.profileHeaderRow}>
                            <div className={styles.avatarWrap}>
                                <div className={styles.avatarCircle}>
                                    {avatarUrl ? (
                                        <img
                                            className={styles.avatarImage}
                                            src={avatarUrl}
                                            alt="avatar"
                                        />
                                    ) : (
                                        <User size={52} />
                                    )}
                                </div>
                            </div>

                            <div className={styles.profileMeta}>
                                <div className={styles.nameRow}>
                                    <h2 className={styles.username}>{username}</h2>
                                    <span className={styles.role}>{role}</span>
                                </div>

                                <div className={styles.subRow}>
                                    <span className={styles.fullName}>{fullName}</span>
                                    <span className={styles.dot} />
                                    <span className={styles.uni}>
                                        {university} - {major}
                                    </span>
                                </div>

                                <p className={styles.bio}>{bio}</p>
                            </div>
                        </div>




                        <div className={styles.hr} />



                        <div className={styles.tabs}>
                            <button className={`${styles.tabBtn} ${styles.tabActive}`} type="button">
                                Posts
                            </button>
                            <button className={styles.tabBtn} type="button">
                                Activities
                            </button>
                            <button className={styles.tabBtn} type="button">
                                About
                            </button>
                        </div>



                        <div className={styles.postsSection}>
                            {postsLoading ? (
                                <div className={styles.notice}>Loading posts...</div>
                            ) : postsError ? (
                                <div className={styles.noticeError}>{postsError}</div>
                            ) : posts.length === 0 ? (
                                <div className={styles.notice}>No posts yet.</div>
                            ) : (
                                posts.map((post) => <PostCard key={post.id} post={post} />)
                            )}
                        </div>
                    </div>



                </div>
                <div className={styles.rightSection}>
                    <FriendsSuggestion />
                </div>
            </div>

        </div>


    )
}