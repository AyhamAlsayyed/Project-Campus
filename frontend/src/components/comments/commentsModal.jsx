import { useState, useEffect } from "react";
import styles from "./commentsModal.module.css";
import Like from '../../Assets/icons/like.png';
import { X } from "lucide-react";
import LikeActive from '../../Assets/icons/like-active.png';
export default function CommentModal({ post, onClose, currentUser }) {
    const [comments, setComments] = useState(post.comments || []);
    const [newComment, setNewComment] = useState("");
    const [isLiked, setIsLiked] = useState(post.is_liked || false);
    const [likesCount, setLikesCount] = useState(post.likes_count || 0);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [expandedReplies, setExpandedReplies] = useState({})
    const [loading, setLoading] = useState(true);
    const [parentComment, setParentComment] = useState(null)
    const visualMedia = post.media?.filter(item => item.type === "image" || item.type === "video") || [];
    const files = post.media?.filter(item => item.type === "file") || [];
    const parentComments = comments.filter(c => !c.parent_comment);
    const replies = comments.filter(c => c.parent_comment);
    const toggleReplies = (commentId) => {
        setExpandedReplies((prev) => ({
            ...prev,
            [commentId]: !prev[commentId]
        }));
    };
    const getReplies = (commentId) => {
        let allReplies = [];

        const findReplies = (id) => {
            const directReplies = replies.filter(r => r.parent_comment === id);
            directReplies.forEach(r => {
                allReplies.push(r);
                findReplies(r.id);
            });
        };

        findReplies(commentId);
        return allReplies;
    };

    useEffect(() => {
        const fetchComments = async () => {
            try {
                const token = localStorage.getItem("access");
                const res = await fetch(`http://localhost:8000/api/posts/${post.id}/comments/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                setComments(data);
            } catch (err) {
                console.error("Error fetching comments:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchComments();
    }, [post.id]);

    const deleteComment = async (commentId) => {
        const token = localStorage.getItem("access");

        try {
            const res = await fetch(
                `http://localhost:8000/api/comments/${commentId}/delete/`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (res.ok) {
                setComments(prev =>
                    prev.filter(c => c.id !== commentId && c.parent_comment !== commentId)
                );
            }
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };



    const addComment = async () => {
        if (!newComment.trim()) return;
        const token = localStorage.getItem("access");

        try {
            const res = await fetch(`http://localhost:8000/api/posts/${post.id}/comments/`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    text: newComment,
                    parent_comment: parentComment ? parentComment.id : null,
                    replying_to: parentComment ? parentComment.user : null,
                }),
            });

            if (res.ok) {
                const savedComment = await res.json();
                setComments([savedComment, ...comments]);
                setNewComment("");
                setParentComment(null);
            }

        } catch (err) {
            console.error("Error saving comment:", err);
        }
    };
    const handleLikePost = async () => {
        const token = localStorage.getItem("access");
        if (!token || !post?.id) return;


        const originalLiked = isLiked;
        const originalCount = likesCount;

        setIsLiked(!isLiked);
        setLikesCount(prev => (isLiked ? prev - 1 : prev + 1));

        try {
            const res = await fetch(`http://localhost:8000/api/posts/${post.id}/like/`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            if (!res.ok) throw new Error("Failed to like");
        } catch (err) {

            setIsLiked(originalLiked);
            setLikesCount(originalCount);
            console.error("Like failed:", err);
        }
    };
    const formatTimeAgo = (dateString) => {
        const now = new Date();
        const past = new Date(dateString);

        const diffInSeconds = Math.floor((now - past) / 1000);

        const minutes = Math.floor(diffInSeconds / 60);
        const hours = Math.floor(diffInSeconds / 3600);
        const days = Math.floor(diffInSeconds / 86400);

        if (diffInSeconds < 60) return "just now";
        if (minutes < 60) return `${minutes} min ago`;
        if (hours < 24) return `${hours} hr ago`;
        if (days < 7) return `${days} d ago`;

        return past.toLocaleDateString(); // fallback
    };
    const nextSlide = (e) => {
        e.stopPropagation();
        setCurrentSlide((prev) => (prev + 1) % visualMedia.length);
    };

    const prevSlide = (e) => {
        e.stopPropagation();
        setCurrentSlide((prev) => (prev === 0 ? visualMedia.length - 1 : prev - 1));
    };

    const toggleLike = (id) => {
        setComments((prev) =>
            prev.map((c) =>
                c.id === id
                    ? {
                        ...c,
                        likes: c.isLiked ? c.likes - 1 : c.likes + 1,
                        isLiked: !c.isLiked,
                    }
                    : c
            )
        );
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

                <div className={styles.header}>
                    <h3>{post.author_username}'s Post</h3>
                    <button className={styles.closeButton} onClick={onClose}>✕</button>
                </div>

                <div className={styles.content}>
                    {/* POST HEADER */}
                    <div className={styles.postHeader}>
                        <img src={post.author_avatar || "/default-avatar.png"} className={styles.avatar} alt="" />
                        <div className={styles.authorInfo}>
                            <span className={styles.authorName}>{post.author_username}</span>
                            <span className={styles.time}>{formatTimeAgo(post.created_at)}</span>
                        </div>
                    </div>

                    {/* POST TEXT - Fixed: Ensuring this displays */}
                    {post.content && <p className={styles.postText}>{post.content}</p>}

                    {/* MEDIA CAROUSEL SECTION */}
                    {visualMedia.length > 0 && (
                        <div className={styles.media}>
                            {visualMedia.length > 1 && (
                                <>
                                    <button className={styles.leftArrow} onClick={prevSlide}>◀</button>
                                    <button className={styles.rightArrow} onClick={nextSlide}>▶</button>
                                </>
                            )}

                            {visualMedia[currentSlide]?.type === "image" ? (
                                <img
                                    src={visualMedia[currentSlide].url}
                                    className={styles.mediaItem}
                                    alt=""
                                />
                            ) : (
                                <video controls className={styles.mediaItem}>
                                    <source src={visualMedia[currentSlide].url} />
                                </video>
                            )}

                            {visualMedia.length > 1 && (
                                <div className={styles.dots}>
                                    {visualMedia.map((_, index) => (
                                        <span
                                            key={index}
                                            className={`${styles.dot} ${index === currentSlide ? styles.activeDot : ""}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    {files.length > 0 && (
                        <div className={styles.filesContainer}>
                            {files.map((file, i) => (
                                <a
                                    key={i}
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.fileItem}
                                >
                                    📁 {file.url.split("/").pop()}
                                </a>
                            ))}
                        </div>
                    )}

                    {/* STATS */}
                    <div className={styles.stats}>
                        <button
                            className={`${styles.iconBtn} ${isLiked ? styles.liked : ""}`}
                            onClick={handleLikePost}
                            type="button"
                        >
                            <span className={styles.heart}>
                                <img
                                    src={isLiked ? LikeActive : Like}
                                    alt="Like Icon"
                                    className={isLiked ? styles.likeActive : styles.like}
                                    width={22}
                                    height={22}
                                />
                            </span>
                            <span className={styles.count}>{likesCount}</span>
                        </button>
                        <span>{comments.length} comments</span>
                    </div>

                    {/* ACTIONS */}
                    <div className={styles.actions}>
                        {/* CHANGED: activePink -> liked */}
                        <div
                            className={`${styles.actionBtn} ${isLiked ? styles.liked : ""}`}
                            onClick={handleLikePost}
                        >
                            <img src={isLiked ? LikeActive : Like} width={20} alt="" />
                            <span>Like</span>
                        </div>

                        <div className={styles.actionBtn}>↗ Share</div>
                    </div>

                    {/* COMMENTS LIST */}
                    <div className={styles.commentsSection}>
                        {parentComments.map((c) => {
                            const replies = getReplies(c.id);
                            const isExpanded = expandedReplies[c.id];

                            return (
                                <div key={c.id} className={styles.commentBlock}>
                                    {/* MAIN COMMENT */}
                                    <div className={styles.commentRow}>
                                        <img src={c.user_avatar || "/default-avatar.png"} className={styles.commentAvatar} alt="" />

                                        <div className={styles.commentContent}>
                                            <div className={styles.commentBubble}>
                                                <div className={styles.commentAuthor}>{c.user}</div>
                                                <p>{c.text}</p>
                                            </div>

                                            <div className={styles.commentActions}>
                                                <span onClick={() => toggleLike(c.id)}>Like</span>
                                                <span onClick={() => setParentComment(c)}>Reply</span>

                                                {c.user === currentUser?.username && (
                                                    <span
                                                        className={styles.deleteBtn}
                                                        onClick={() => deleteComment(c.id)}
                                                    >
                                                        Delete
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 🔥 INSTAGRAM-STYLE TOGGLE BUTTON */}
                                    {replies.length > 0 && (
                                        <div
                                            className={styles.viewRepliesToggle}
                                            onClick={() => toggleReplies(c.id)}
                                        >
                                            <span className={styles.toggleLine}></span>
                                            <span>{isExpanded ? "Hide replies" : `View replies (${replies.length})`}</span>
                                        </div>
                                    )}

                                    {/* 🔥 REPLIES (Only renders if isExpanded is true) */}
                                    {isExpanded && replies.map((reply) => (
                                        <div key={reply.id} className={styles.replyRow}>
                                            <img src={reply.user_avatar || "/default-avatar.png"} className={styles.replyAvatar} alt="" />

                                            <div className={styles.replyContent}>
                                                <div className={styles.replyBubble}>
                                                    <b>{reply.user}</b>
                                                    <p>
                                                        <span className={styles.replyingTo}>
                                                            @{reply.replying_to || c.user}
                                                        </span>{" "}
                                                        {reply.text}
                                                    </p>
                                                </div>

                                                <div className={styles.commentActions}>
                                                    <div className={styles.commentActions}>
                                                        <span onClick={() => toggleLike(reply.id)}>Like</span>
                                                        <span onClick={() => setParentComment(reply || c)}>Reply</span>

                                                        {reply.user === currentUser?.username && (
                                                            <span
                                                                className={styles.deleteBtn}
                                                                onClick={() => deleteComment(reply.id)}
                                                            >
                                                                Delete
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>
                {parentComment && (
                    <div className={styles.replyBar}>
                        <span>
                            Replying to <b>{parentComment.user}</b>
                        </span>

                        <button
                            className={styles.closeReplyBtn}
                            onClick={() => setParentComment(null)}
                        >
                            ✕
                        </button>
                    </div>
                )}


                <div className={styles.inputContainer}>
                    <div className={styles.inputRow}>

                        <div className={styles.inputWrapper}>
                            <input
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && addComment()}
                                placeholder="Write a comment..."
                            />
                            <button
                                className={`${styles.sendBtn} ${newComment.trim() ? styles.active : ""}`}
                                onClick={addComment}
                            > ➢ </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

}