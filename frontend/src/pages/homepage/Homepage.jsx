import styles from './Homepage.module.css'
import darkModeIcon from '../../Assets/Pictures/LogoDarkMode.png'
import Header from '../../components/pagelayout/header/header';
import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav';
import ThemeToggler from '../../components/pagelayout/themeToggle';
import { useState, useEffect } from 'react';
import { MessageSquare, Bell, UserCircle, Search } from "lucide-react"
import PostCard from '../../components/posts/postCard'
import WeeklyNews from '../../components/weeklynews/weeklynews';


export default function Homepage() {
    const [theme, setTheme] = useState("dark")
    const toggleTheme = () => setTheme(prev => prev === "light" ? "dark" : "light")
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [user, setUser] = useState(null)
    const [content, setContent] = useState("")
    const [images, setImages] = useState([]);
    const [file, setFile] = useState(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
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
        const selectedFiles = Array.from(e.target.files);
        setImages(prev => [...prev, ...selectedFiles]);
    };

    const handleFileUpload = (e) => {
        setFile(e.target.files[0]);
    };
    const handleCreatePost = async () => {
        if (!content.trim() && !images.length && !file && !isPollOpen) return;

        const formData = new FormData();

        formData.append("content", content);

        images.forEach((img) => {
            formData.append("images", img);
        });

        if (file) {
            formData.append("file", file);
        }

        if (isPollOpen) {
            pollOptions
                .filter(opt => opt.trim())
                .forEach((opt, index) => {
                    formData.append(`poll_options[${index}]`, opt);
                });
        }

        try {
            const res = await fetch(`${API}/api/posts/create/`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!res.ok) {
                console.error("Failed to create post");
                return;
            }


            setContent("");
            setImages([]);
            setFile(null);
            setPollOptions(["", ""]);
            setIsPollOpen(false);
            setIsModalOpen(false);

            loadPosts();

        } catch (err) {
            console.error("Error:", err);
        }
    };
    useEffect(() => {
        loadPosts();
        loadUser();
    }, [])
    return (



        <div className={styles.darkContainer}>

            
            <div className={`${styles.header} ${styles.page}`}>
                <Header theme={theme} toggleTheme={toggleTheme} user={user} />

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


                <div className={styles.rightSection}>
                    <div className={styles.createPostSection} onClick={() => setIsModalOpen(true)}>

                        <div className={styles.topRow}>
                            <div className={styles.leftSide}>
                                <img
                                    src={user?.avatar || "/default-avatar.png"}
                                    alt=""
                                    className={styles.userProfilePicture}
                                />

                                <input
                                    type="text"
                                    placeholder={`What did you learn?`}
                                    className={styles.postInput}
                                    onFocus={() => setIsModalOpen(true)}
                                    readOnly
                                />
                            </div>

                            {/* RIGHT SIDE BUTTONS */}
                            <div className={styles.actionButtons}>

                                <label className={styles.actionButton}>
                                    📷
                                    <input hidden type="file" onChange={handleMediaUpload} />
                                </label>

                                <label className={styles.actionButton}>
                                    📁
                                    <input hidden type="file" onChange={handleFileUpload} />
                                </label>

                                <button
                                    type="button"
                                    className={styles.actionButton}
                                    onClick={() => setIsPollOpen(prev => !prev)}
                                >
                                    📊
                                </button>

                            </div>
                        </div>

                    </div>
                    {isModalOpen && (
                        <div
                            className={styles.modalOverlay}
                            onClick={() => setIsModalOpen(false)}
                        >
                            <div
                                className={styles.modal}
                                onClick={(e) => e.stopPropagation()}
                            >


                                <div className={styles.modalHeader}>
                                    <h3>Create post</h3>
                                    <button
                                        className={styles.closeButton}
                                        onClick={() => setIsModalOpen(false)}
                                    >
                                        ✕
                                    </button>

                                </div>


                                <div className={styles.leftSide}>
                                    <img
                                        src={user?.avatar || "/default-avatar.png"}
                                        alt=""
                                        className={styles.userProfilePicture}
                                    />

                                    <strong>{user?.full_name || user?.username}</strong>
                                </div>


                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder={`What's on your mind, ${user?.username || "User"}?`}
                                    className={styles.modalInput}
                                />
                                {images.length > 0 && (
                                    <div className={styles.previewContainer}>
                                        {images.map((img, i) => (
                                            <img
                                                key={i}
                                                src={URL.createObjectURL(img)}
                                                alt=""
                                                className={styles.previewImage}
                                            />
                                        ))}
                                    </div>
                                )}


                                <div className={styles.actionsRow}>

                                    <label className={styles.actionButton}>
                                        📷 Media
                                        <input hidden type="file" onChange={handleMediaUpload} />
                                    </label>

                                    <label className={styles.actionButton}>
                                        📁 File
                                        <input hidden type="file" multiple onChange={handleFileUpload} />
                                    </label>

                                    <button
                                        type="button"
                                        className={styles.actionButton}
                                        onClick={() => {
                                            if (isPollOpen) {
                                                setIsPollOpen(false);
                                                setPollOptions(["", ""]);
                                            } else {
                                                setIsPollOpen(true);
                                            }
                                        }}
                                    >
                                        📊
                                    </button>

                                </div>
                                {isPollOpen && (
                                    <div className={styles.pollContainer}>
                                        {pollOptions.map((option, i) => (
                                            <div key={i} className={styles.pollOptionRow}>
                                                <input
                                                    value={option}
                                                    onChange={(e) => {
                                                        const updated = [...pollOptions];
                                                        updated[i] = e.target.value;
                                                        setPollOptions(updated);
                                                    }}
                                                    placeholder={`Option ${i + 1}`}
                                                    className={styles.pollInput}
                                                />


                                                {pollOptions.length > 2 && (
                                                    <button
                                                        className={styles.removeOption}
                                                        onClick={() => {
                                                            const updated = pollOptions.filter((_, index) => index !== i);
                                                            setPollOptions(updated);
                                                        }}
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
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

                                {/* POST BUTTON */}
                                <button className={styles.postButton} onClick={handleCreatePost} disabled={!content && !images.length && !file && !isPollOpen}>Post</button>

                            </div>
                        </div>
                    )}
                    <WeeklyNews />


                </div>
            </div>

        </div>

    )
}
