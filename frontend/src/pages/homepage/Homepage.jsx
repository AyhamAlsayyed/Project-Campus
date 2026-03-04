
import styles from './Homepage.module.css'
import darkModeIcon from '../../Assets/Pictures/LogoDarkMode.png'

import ThemeToggler from '../../components/pagelayout/themeToggle';
import { useState, useEffect } from 'react';
import { MessageSquare, Bell, UserCircle, Search } from "lucide-react"
import PostCard from '../../components/posts/postCard'
import WeeklyNews from '../../components/weeklynews/weeklynews';
import {
    Home,
    Users,
    GraduationCap,
    Calendar,
    Info,
    FileText,
    HelpCircle
} from "lucide-react";


export default function Homepage() {
    const [theme, setTheme] = useState("dark");
    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
    };
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [user, setUser] = useState(null);
    const [userError, setUserError] = useState("");
    const [userLoading, setUserLoading] = useState(true);
    const [isPollOpen, setIsPollOpen] = useState(false);
    const [pollOptions, setPollOptions] = useState(["", ""])
    const loadUser = async () => {
        setUserLoading(true);
        setUserError("");
        try {
            const res = await fetch("http://localhost:8000/api/auth/me/", {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) {
                setUserError("Failed to load user");
                setUser(null)
                return;
            }
            setUser(data);

        } catch (e) {
            setUserError(e?.message || "Something went wrong")
        }
        finally {
            setUserLoading(false);
        }

    }

    const loadPosts = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("http://localhost:8000/api/posts/")
            const data = await res.json().catch(() => [])
            if (!res.ok) {
                setError(data?.message || "Failed to load posts");
            }
            setPosts(Array.isArray(data) ? data : [])
        } catch (e) {
            setError(e?.message || "Something went wrong")
            setPosts([]);
        } finally {
            setLoading(false)
        }
    }
    const handleMediaUpload = (e) => {
        const file = e.target.files[0];
    }
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
    }
    useEffect(() => {
        loadPosts();
        loadUser();
    }, [])
    return (



        <div className={styles.darkContainer}>
            <div className={`${styles.header} ${styles.page}`}>
                <div className={styles.headerInner}>
                    <div className={styles.headerLeft}>
                        <img src={darkModeIcon} alt="Dark Mode Icon" className={styles.darkModeIcon} />
                        <h1 className={styles.title}>CAMPUS</h1>
                    </div>
                    <div className={styles.headerCenter}>
                        <div className={styles.searchWrap}>
                            <Search className={styles.searchIcon} size={24} color="#333" />
                            <input className={styles.searchInput} type="text" placeholder="What are you looking for?" />
                        </div>

                    </div>

                    <div className={styles.headerRight}>
                        <ThemeToggler theme={theme} toggleTheme={toggleTheme} />
                        <button className={styles.iconButton}><MessageSquare size={24} color="#333" /></button>
                        <button className={styles.iconButton}><Bell size={24} color="#333" /></button>
                        <button className={styles.iconButton}><img
                            src={
                                user?.avatar
                                    ? `http://localhost:8000${user.avatar}`
                                    : "/default-avatar.png"
                            }
                            alt="Profile"
                            className={styles.userProfilePicture}
                        /></button>
                    </div>

                </div>
            </div>
            <div className={`${styles.content} ${styles.page}`}>
                <div className={styles.sideBarNav}>
                    <button className={`${styles.sideBarButton} ${styles.active}`}><Home size={24} />Home page</button>
                    <button className={styles.sideBarButton}><Users size={24} color="#808080" /> Communities</button>
                    <button className={styles.sideBarButton}><GraduationCap size={24} color="#808080" /> Universities</button>
                    <button className={styles.sideBarButton}><Calendar size={24} color="#808080" />Events</button>
                    <div className={styles.divider}></div>
                    <button className={styles.sideBarButton}><Info size={24} color="#808080" />About us</button>
                    <button className={styles.sideBarButton}><FileText size={24} color="#808080" />Privacy Policy</button>
                    <button className={styles.sideBarButton}><HelpCircle size={24} color="#808080" />Help</button>
                    <span className={styles.copyright}>© 2024 Project Campus. All rights reserved.</span>

                </div>
                <div className={styles.postContainer}>
                    <div className={styles.innerContainer}>
                        {error ? (
                            <div className={styles.errorBox}><p className={styles.errorText}>{error}</p></div>
                        ) : posts.length === 0 ? (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}>📰</div>
                                <h2 className={styles.emptyTitle}>No posts yet</h2>

                            </div>

                        ) : (
                            <div className={styles.feed}>
                                {posts.map((post) => {
                                    return <PostCard key={post.id} post={post} />
                                })}

                            </div>
                        )}


                    </div>

                </div>
                <div className={styles.rightSection}>
                    <div className={styles.createPostSection}>
                        <div className={styles.topRow}>
                            <div className={styles.leftSide}>
                                <img
                                    src={
                                        user?.avatar
                                            ? `http://localhost:8000${user.avatar}`
                                            : "/default-avatar.png"
                                    }
                                    alt="Profile"
                                    className={styles.userProfilePicture}
                                />

                                <div>
                                    <p className={styles.greeting}>
                                        Good morning, {user?.full_name || user?.username || "User"}!
                                    </p>
                                    <p className={styles.question}>What’s on your mind?</p>
                                </div>
                            </div>
                            <div className={styles.weather}>
                                <span className={styles.weatherIcon}>🌤</span>
                                <span>19°C</span>
                            </div>
                        </div>
                        <div className={styles.actionsRow}>
                            <label className={styles.actionButton}>
                                📷 Media
                                <input
                                    type="file"
                                    accept="image/*,video/*"
                                    hidden
                                    onChange={(e) => handleMediaUpload(e)}
                                />
                            </label>
                            <label className={styles.actionButton}>
                                📁 File
                                <input
                                    type="file"
                                    hidden
                                    onChange={(e) => handleFileUpload(e)}
                                />
                            </label>
                            <button
                                type="button"
                                className={styles.actionButton}
                                onClick={() => {
                                    console.log("clicked")
                                    setIsPollOpen((prev) => !prev)
                                }}
                            >
                                📊 Poll
                            </button>

                        </div>
                        {isPollOpen && (
                            <div className={styles.pollContainer}>
                                {pollOptions.map((option, index) => (
                                    <input
                                        key={index}
                                        type="text"
                                        placeholder={`Option ${index + 1}`}
                                        value={option}
                                        onChange={(e) => {
                                            const updated = [...pollOptions];
                                            updated[index] = e.target.value;
                                            setPollOptions(updated);
                                        }}
                                        className={styles.pollInput}
                                    />
                                ))}

                                <button
                                    type="button"
                                    onClick={() => setPollOptions([...pollOptions, ""])}
                                    className={styles.addOption}
                                >
                                    + Add Option
                                </button>
                            </div>
                        )}
                        <input
                            type="text"
                            placeholder="What did you learn today?..."
                            className={styles.postInput}
                        />
                    </div>
                    <WeeklyNews />
                    

                </div>

            </div>


        </div >

    );
}
