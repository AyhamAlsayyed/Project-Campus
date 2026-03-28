import styles from './communityPage.module.css'
import Header from '../../components/pagelayout/header/header'
import WeeklyNews from '../../components/weeklynews/weeklynews';
import { useState, useEffect } from 'react'
import { useParams } from "react-router-dom";
import { X } from "lucide-react";

import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav'
import PostCard from '../../components/posts/postCard'
export default function CommunityPage() {
    const [user, setUser] = useState(null)
    const [theme, setTheme] = useState('dark');
    const [posts, setPosts] = useState([]);
    const [filter, setFilter] = useState("recommended");
    const [community, setCommunity] = useState(null);
    const { id } = useParams();
    const [content, setContent] = useState("");
    const [images, setImages] = useState([]);
    const [files, setFiles] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const toggleTheme = () => { setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light')); }
    const resetPostState = () => {
        setContent("");
        setImages([]);
        setFiles([]);
        setPollOptions(["", ""]);
        setIsPollOpen(false);
    };
    const [isPollOpen, setIsPollOpen] = useState(false);
    const [pollOptions, setPollOptions] = useState(["", ""]);
    const fetchCommunity = async () => {
        const token = localStorage.getItem("access");

        const res = await fetch(`http://localhost:8000/api/communities/${id}/`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await res.json();
        setCommunity(data);
    };
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
    const handleCreatePost = async () => {
        const token = localStorage.getItem("access");

        if (!content.trim() && !images.length && !files.length && !isPollOpen) return;

        const formData = new FormData();

        formData.append("content", content);

        // 🔥 ADD COMMUNITY ID HERE
        formData.append("community_id", id); // from useParams()

        images.forEach((img) => {
            formData.append("images", img);
        });

        files.forEach((file) => {
            formData.append("files", file);
        });

        if (isPollOpen) {
            pollOptions
                .filter(opt => opt.trim())
                .forEach((opt, index) => {
                    formData.append(`poll_options[${index}]`, opt);
                });
        }

        try {
            const res = await fetch("http://localhost:8000/api/posts/create/", {
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


            resetPostState();
            setIsModalOpen(false);


            fetchPosts();

        } catch (err) {
            console.error("Error:", err);
        }
    };
    const fetchPosts = async () => {
        const token = localStorage.getItem("access");

        const res = await fetch(
            `http://localhost:8000/api/communities/${id}/posts/?filter=${filter}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const data = await res.json();
        setPosts(data);
    };
    useEffect(() => {
        loadUser();
        fetchPosts();
        fetchCommunity();
    }, [id, filter]);
    const handleMediaUpload = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setImages(prev => [...prev, ...selectedFiles]);
    };

    const handleFileUpload = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles(prev => [...prev, ...selectedFiles]);
    };

    return (
        <div className={styles.darkContainer}>
            <div className={`${styles.header} ${styles.page}`}>
                <Header theme={theme} toggleTheme={toggleTheme} user={user} />

            </div>
            <div className={`${styles.content} ${styles.page}`}>
                <SideBarNav theme={theme} toggleTheme={toggleTheme} user={user} />
                <div className={styles.mainContent}>
                    <h1 className={styles.title}>
                        <span className={styles.highlight}>{community?.name}</span> community
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
                    <div className={styles.communityPostsContainer}>
                        <div className={styles.innerContainer}>
                            {posts.map((post) => (
                                <PostCard key={post.id} post={post} />
                            ))}

                        </div>

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
                            onClick={() => {
                                setIsModalOpen(false);
                                resetPostState();
                            }}
                        >
                            <div
                                className={styles.modal}
                                onClick={(e) => e.stopPropagation()}
                            >


                                <div className={styles.modalHeader}>
                                    <h3>Create post</h3>
                                    <button
                                        className={styles.closeButton}
                                        onClick={() => {
                                            setIsModalOpen(false);
                                            resetPostState();
                                        }}
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
                                            <div key={i} className={styles.previewWrapper}>
                                                <img
                                                    src={URL.createObjectURL(img)}
                                                    alt=""
                                                    className={styles.previewImage}
                                                />

                                                <button
                                                    className={styles.removeImage}
                                                    onClick={() =>
                                                        setImages(prev => prev.filter((_, index) => index !== i))
                                                    }
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {files.length > 0 && (
                                    <div className={styles.filePreviewContainer}>
                                        {files.map((f, i) => (
                                            <div key={i} className={styles.fileItem}>
                                                📁 {f.name}

                                                <button
                                                    className={styles.removeFile}
                                                    onClick={() =>
                                                        setFiles(prev => prev.filter((_, index) => index !== i))
                                                    }
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
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
                                <button className={styles.postButton} onClick={handleCreatePost} disabled={!content && !images.length && !files && !isPollOpen}>Post</button>

                            </div>
                        </div>
                    )}
                    <WeeklyNews communityId={id} />


                </div>



            </div>

        </div>
    )
}