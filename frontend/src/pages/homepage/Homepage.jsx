
import styles from './Homepage.module.css'
import darkModeIcon from '../../Assets/Pictures/LogoDarkMode.png'

import ThemeToggler from '../../components/pagelayout/themeToggle';
import { useState, useEffect } from 'react';
import { MessageSquare, Bell, UserCircle, Search } from "lucide-react"
import PostCard from '../../components/posts/postCard'
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

    /*  const loadPosts = async () => {
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
     }*/
    useEffect(() => {
        setPosts([
            {
                id: 1,
                author_name: "ibrahem",
                content: "First post",
                likes_count: 5,
                created_at: "Just now",
                type: 'post'
            },
            {
                id: 1,
                author_name: "ibrahem",
                content: "First post",
                likes_count: 5,
                created_at: "Just now",
                type: 'ad'
            }
        ])
    }, [])
    return (
        <div className={styles.darkContainer}>
            <div className={styles.header}>
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
                        <button className={styles.iconButton}><UserCircle size={24} color="#333" /></button>
                    </div>

                </div>
            </div>
            <div className={styles.content}>
                <div className={styles.sideBarNav}>
                    <button className={styles.sideBarButton}><Home size={24} color="#808080" />Home page</button>
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
                                <p className={styles.emptySubtitle}>Be the first to post something for your campus.</p>
                                <button className={styles.emptyBtn}>Create Post</button>

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

            </div>


        </div >

    );
}
