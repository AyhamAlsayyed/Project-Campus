import styles from './Homepage.module.css'
import darkModeIcon from '../../Assets/Pictures/LogoDarkMode.png'
import Header from '../../components/pagelayout/header/header';
import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav';
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
} from "lucide-react"

export default function Homepage() {

    const [theme, setTheme] = useState("dark")
    const toggleTheme = () => setTheme(prev => prev === "light" ? "dark" : "light")

    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    const [user, setUser] = useState(null)
    const [userError, setUserError] = useState("")
    const [userLoading, setUserLoading] = useState(true)

    const [isPollOpen, setIsPollOpen] = useState(false)
    const [pollOptions, setPollOptions] = useState(["", ""])

    const API = "http://localhost:8000"
    const token = localStorage.getItem("access")

  
    const loadUser = async () => {

        if (!token) {
            setUserLoading(false)
            setUserError("No token found")
            return
        }

        try {
            const res = await fetch(`${API}/api/auth/me/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            const data = await res.json().catch(() => ({}))

            if (!res.ok) {
                setUserError("Failed to load user")
                setUser(null)
                return
            }

            setUser(data)

        } catch (e) {
            setUserError("Something went wrong")
        } finally {
            setUserLoading(false)
        }
    }

  
    const loadPosts = async () => {
        if (!token) {
            setLoading(false)
            setError("No token found")
            return
        }

        try {
            const res = await fetch(`${API}/api/posts/feed/?limit=20`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            const data = await res.json().catch(() => [])

            if (!res.ok) {
                setError(data?.message || "Failed to load posts")
                setPosts([])
                return
            }

            setPosts(Array.isArray(data) ? data : [])
        } catch {
            setError("Something went wrong")
            setPosts([])
        } finally {
            setLoading(false)
        }
    }


    const handleMediaUpload = (e) => {
        const file = e.target.files[0]
    }

    const handleFileUpload = (e) => {
        const file = e.target.files[0]
    }
    useEffect(() => {
        loadPosts();
        loadUser();
    }, [])
    return (



        <div className={styles.darkContainer}>

            {/* HEADER */}
            <div className={`${styles.header} ${styles.page}`}>
                <Header theme={theme} toggleTheme={toggleTheme} user={user} onTitleClick={loadPosts} />

            </div>

            <div className={`${styles.content} ${styles.page}`}>
                <SideBarNav />

                <div className={styles.postContainer}>
                    <div className={styles.innerContainer}>

                        {error ? (
                            <div className={styles.errorBox}><p>{error}</p></div>
                        ) : loading ? (
                            <p>Loading...</p>
                        ) : posts.length === 0 ? (
                            <div className={styles.emptyState}>
                                <div>📰</div>
                                <h2>No posts yet</h2>
                            </div>
                        ) : (
                            <div className={styles.feed}>
                                {posts.map(post => (
                                    <PostCard key={post.id} post={post} />
                                ))}
                            </div>
                        )}

                    </div>
                </div>

                {/* RIGHT */}
                <div className={styles.rightSection}>
                    <div className={styles.createPostSection}>

                        <div className={styles.topRow}>
                            <div className={styles.leftSide}>

                                <img
                                    src={user?.avatar || "/default-avatar.png"}
                                    alt=""
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
                                🌤 19°C
                            </div>
                        </div>

                        <div className={styles.actionsRow}>
                            <label className={styles.actionButton}>
                                📷 Media
                                <input hidden type="file" onChange={handleMediaUpload} />
                            </label>

                            <label className={styles.actionButton}>
                                📁 File
                                <input hidden type="file" onChange={handleFileUpload} />
                            </label>

                            <button
                                type="button"
                                className={styles.actionButton}
                                onClick={() => setIsPollOpen(prev => !prev)}
                            >
                                📊 Poll
                            </button>
                        </div>

                        {isPollOpen && (
                            <div className={styles.pollContainer}>
                                {pollOptions.map((option, i) => (
                                    <input
                                        key={i}
                                        value={option}
                                        onChange={(e) => {
                                            const updated = [...pollOptions]
                                            updated[i] = e.target.value
                                            setPollOptions(updated)
                                        }}
                                        placeholder={`Option ${i + 1}`}
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

        </div>
       
    )
}
