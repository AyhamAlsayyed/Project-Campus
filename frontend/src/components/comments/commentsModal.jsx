import { useState, useEffect } from "react";
import styles from "./commentsModal.module.css";
import Like from '../../Assets/icons/like.png';
import { X } from "lucide-react";
import { Link } from "react-router-dom";
import LikeActive from '../../Assets/icons/like-active.png';
import { useRef } from "react";
import { createPortal } from "react-dom";
import postStyles from '../posts/posts.module.css';
import Share from '../../Assets/icons/share.png';
import API from '../../config';

export default function CommentModal({ post, onClose, currentUser }) {
    const highlightCommentId = post.highlightCommentId || {};
    const [highlightedId, setHighlightedId] = useState(highlightCommentId);
    const commentRefs = useRef({});
    const commentsSectionRef = useRef(null);
    const [comments, setComments] = useState(post.comments || []);
    const [newComment, setNewComment] = useState("");
    const [isLiked, setIsLiked] = useState(post.is_liked || false);
    const [likesCount, setLikesCount] = useState(post.likes_count || 0);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [expandedReplies, setExpandedReplies] = useState({});
    const [loading, setLoading] = useState(true);
    const [parentComment, setParentComment] = useState(null);
    const [editingComment, setEditingComment] = useState(null); // Added edit state
    const visualMedia = post.media?.filter(item => item.type === "image" || item.type === "video") || [];
    const files = post.media?.filter(item => item.type === "file") || [];
    const parentComments = comments.filter(c => !c.parent_comment);
    const replies = comments.filter(c => c.parent_comment);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [shareSearch, setShareSearch] = useState("");
    const [shareTargets, setShareTargets] = useState([]);
    const [isLoadingChats, setIsLoadingChats] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const shareMenuRef = useRef(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const CHAR_LIMIT = 150;

    // Fetch share targets — deduplicated to one entry per person
    useEffect(() => {
        if (!showShareMenu) return;
        const fetchActiveChats = async () => {
            const token = localStorage.getItem("access");
            if (!token) return;
            setIsLoadingChats(true);
            try {
                const res = await fetch(`${API}/api/chats/`, {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                });
                if (res.ok) {
                    const data = await res.json();

                    // Deduplicate: one entry per unique person/group name,
                    // keeping whichever conversation has the most recent message
                    const deduped = data.reduce((acc, chat) => {
                        const key = (chat.name || chat.username || "").toLowerCase().trim();
                        const existingIndex = acc.findIndex(
                            c => (c.name || c.username || "").toLowerCase().trim() === key
                        );
                        if (existingIndex === -1) {
                            acc.push(chat);
                        } else {
                            const existing = acc[existingIndex];
                            if (
                                chat.last_message_time &&
                                (!existing.last_message_time ||
                                    new Date(chat.last_message_time) > new Date(existing.last_message_time))
                            ) {
                                acc[existingIndex] = chat;
                            }
                        }
                        return acc;
                    }, []);

                    setShareTargets(deduped.map(chat => ({
                        ...chat,
                        avatar: chat.avatar
                            ? chat.avatar.startsWith("http") ? chat.avatar : `http://localhost:8000${chat.avatar}`
                            : "/default-avatar.png"
                    })));
                }
            } catch (err) { console.error("Error fetching chats:", err); }
            finally { setIsLoadingChats(false); }
        };
        fetchActiveChats();
    }, [showShareMenu]);

    const handleShareToTarget = async (targetId) => {
        const token = localStorage.getItem("access");
        if (!token) return;
        setIsSharing(true);
        try {
            const res = await fetch(`${API}/api/messages/send/`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    recipient_id: targetId,
                    post_id: post.id || post.post_id,
                    content: `Shared a post`,
                }),
            });
            if (res.ok) { setShowShareMenu(false); setShareSearch(""); }
        } catch (err) { console.error("Error sharing:", err); }
        finally { setIsSharing(false); }
    };

    useEffect(() => {
        if (!highlightedId || comments.length === 0) return;

        const reply = comments.find(c => c.id === highlightedId && c.parent_comment);
        if (reply) {
            setExpandedReplies(prev => ({ ...prev, [reply.parent_comment]: true }));
        }

        const scrollTimer = setTimeout(() => {
            const el = commentRefs.current[highlightedId];
            const container = commentsSectionRef.current;
            if (el && container) {
                const elTop = el.offsetTop - container.offsetTop;
                container.scrollTo({ top: elTop - container.clientHeight / 2 + el.clientHeight / 2, behavior: 'smooth' });
            }
        }, 300);

        const clearTimer = setTimeout(() => setHighlightedId(null), 2400);
        return () => { clearTimeout(scrollTimer); clearTimeout(clearTimer); };
    }, [comments, highlightedId]);

    const toggleReplies = (commentId) => {
        setExpandedReplies((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
    };

    const getReplies = (commentId) => {
        let allReplies = [];
        const findReplies = (id) => {
            const directReplies = replies.filter(r => r.parent_comment === id);
            directReplies.forEach(r => { allReplies.push(r); findReplies(r.id); });
        };
        findReplies(commentId);
        return allReplies;
    };

    useEffect(() => {
        const fetchComments = async () => {
            try {
                const token = localStorage.getItem("access");
                const postId = post.id || post.post_id;
                const res = await fetch(`${API}/api/posts/${postId}/comments/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                const raw = Array.isArray(data) ? data : data.results || data.comments || [];
                const normalized = raw.map(c => ({
                    ...c,
                    text: c.text || c.content,
                    user: c.user || c.author?.username,
                    user_id: c.user_id || c.author?.id,
                    user_avatar: c.user_avatar || c.author?.avatar,
                    author: c.author || null,
                }));

                setComments(normalized);
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
            const res = await fetch(`${API}/api/comments/${commentId}/delete/`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setComments(prev => prev.filter(c => c.id !== commentId && c.parent_comment !== commentId));
            }
        } catch (err) { console.error("Delete failed:", err); }
    };

    const editComment = async () => {
        if (!newComment.trim() || !editingComment) return;
        const token = localStorage.getItem("access");
        try {
            const res = await fetch(`${API}/api/comments/${editingComment.id}/edit/`, {
                method: "PATCH", 
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ text: newComment }),
            });
            if (res.ok) {
                setComments(prev => prev.map(c => 
                    c.id === editingComment.id 
                        ? { ...c, text: newComment, content: newComment, is_edited: true } 
                        : c
                ));
                setNewComment("");
                setEditingComment(null);
            } else {
                console.error("Failed to edit comment");
            }
        } catch (err) { console.error("Error editing comment:", err); }
    };

    const addComment = async () => {
        if (!newComment.trim()) return;
        const token = localStorage.getItem("access");
        try {
            const postId = post.id || post.post_id;
            const res = await fetch(`${API}/api/posts/${postId}/comments/create/`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: newComment,
                    parent_comment: parentComment ? parentComment.id : null,
                    replying_to: parentComment ? parentComment.user : null,
                }),
            });
            if (res.ok) {
                const savedComment = await res.json();
                const normalized = {
                    ...savedComment,
                    text: savedComment.text || savedComment.content,
                    user: savedComment.user || savedComment.author?.username,
                    user_id: savedComment.user_id || savedComment.author?.id,
                    user_avatar: savedComment.user_avatar || savedComment.author?.avatar,
                    author: savedComment.author || null,
                };
                setComments(prev => [...prev, normalized]);
                setNewComment("");
                setParentComment(null);
            } else {
                const err = await res.json();
                console.error("Server error:", err);
            }
        } catch (err) { console.error("Error saving comment:", err); }
    };

    const handleCommentSubmit = () => {
        if (editingComment) {
            editComment();
        } else {
            addComment();
        }
    };

    const handleLikePost = async () => {
        const token = localStorage.getItem("access");
        const postId = post?.id || post?.post_id;
        if (!token || !postId) return;
        const originalLiked = isLiked;
        const originalCount = likesCount;
        setIsLiked(!isLiked);
        setLikesCount(prev => (isLiked ? prev - 1 : prev + 1));
        try {
            const res = await fetch(`${API}/api/posts/${postId}/like/`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
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
        return past.toLocaleDateString();
    };

    const nextSlide = (e) => { e.stopPropagation(); setCurrentSlide((prev) => (prev + 1) % visualMedia.length); };
    const prevSlide = (e) => { e.stopPropagation(); setCurrentSlide((prev) => (prev === 0 ? visualMedia.length - 1 : prev - 1)); };

    const toggleLike = (id) => {
        setComments((prev) =>
            prev.map((c) =>
                c.id === id ? { ...c, likes: c.isLiked ? c.likes - 1 : c.likes + 1, isLiked: !c.isLiked } : c
            )
        );
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

                <div className={styles.header}>
                    <h3>{(post.author?.username || post.author_username || "User")}'s Post</h3>
                    <button className={styles.closeButton} onClick={onClose}>✕</button>
                </div>

                <div className={styles.content}>
                    <div className={styles.postHeader}>
                        <Link to={post.author?.type === 'page' ? `/page/${post.author?.id}` : `/profile/${post.author?.id}`}>
                            <img
                                src={post.author?.avatar || post.author_avatar || "/default-avatar.png"}
                                className={styles.avatar}
                                alt=""
                            />
                        </Link>
                        <div className={styles.authorInfo}>
                            <span className={styles.authorName}>{post.author?.username || post.author_username}</span>
                            <span className={styles.time}>{formatTimeAgo(post.created_at)}</span>
                        </div>
                    </div>

                    {(post.content || post.content_text) && (
                        <p className={styles.postText}>
                            {(post.content || post.content_text).length > CHAR_LIMIT && !isExpanded
                                ? <>
                                    {(post.content || post.content_text).substring(0, CHAR_LIMIT)}...{' '}
                                    <span className={styles.readMore} onClick={() => setIsExpanded(true)}>read more</span>
                                </>
                                : <>
                                    {post.content || post.content_text}
                                    {(post.content || post.content_text).length > CHAR_LIMIT && (
                                        <span className={styles.readMore} onClick={() => setIsExpanded(false)} style={{ marginLeft: 6 }}>show less</span>
                                    )}
                                </>
                            }
                        </p>
                    )}

                    {visualMedia.length > 0 && (
                        <div className={styles.media}>
                            {visualMedia.length > 1 && (
                                <>
                                    <button className={styles.leftArrow} onClick={prevSlide}>◀</button>
                                    <button className={styles.rightArrow} onClick={nextSlide}>▶</button>
                                </>
                            )}
                            {visualMedia[currentSlide]?.type === "image"
                                ? <img src={visualMedia[currentSlide].url} className={styles.mediaItem} alt="" />
                                : <video controls className={styles.mediaItem}><source src={visualMedia[currentSlide].url} /></video>
                            }
                            {visualMedia.length > 1 && (
                                <div className={styles.dots}>
                                    {visualMedia.map((_, index) => (
                                        <span key={index} className={`${styles.dot} ${index === currentSlide ? styles.activeDot : ""}`} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {files.length > 0 && (
                        <div className={styles.filesContainer}>
                            {files.map((file, i) => (
                                <a key={i} href={file.url} target="_blank" rel="noopener noreferrer" className={styles.fileItem}>
                                    📁 {file.url.split("/").pop()}
                                </a>
                            ))}
                        </div>
                    )}

                    <div className={styles.actions}>
                        <div className={`${styles.actionBtn} ${isLiked ? styles.liked : ""}`} onClick={handleLikePost}>
                            <img src={isLiked ? LikeActive : Like} width={20} alt="" />
                            {likesCount > 0 && <span style={{ fontSize: "0.85rem", marginLeft: 4, opacity: 0.8 }}>{likesCount}</span>}
                        </div>

                        <div className={styles.commentsCount}>
                            <span>{post.comments_count || comments.length}</span>
                            <span>comments</span>
                        </div>

                        <div ref={shareMenuRef}>
                            <div className={styles.actionBtn} onClick={() => setShowShareMenu(!showShareMenu)}>
                                <img src={Share} width={20} alt="Share" />
                                <span>Share</span>
                            </div>
                        </div>
                    </div>

                    {showShareMenu && createPortal(
                        <div className={postStyles.shareOverlay} onClick={() => { setShowShareMenu(false); setShareSearch(""); }}>
                            <div className={postStyles.shareModal} onClick={e => e.stopPropagation()}>
                                <div className={postStyles.shareHeader}>
                                    <h3 className={postStyles.shareTitle}>Share Post</h3>
                                    <button className={postStyles.closeBtn} onClick={() => { setShowShareMenu(false); setShareSearch(""); }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                            <path d="M18 6L6 18M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <div className={postStyles.shareSearchWrapper}>
                                    <div className={postStyles.shareSearchInner}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={postStyles.searchIcon}>
                                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                                        </svg>
                                        <input
                                            autoFocus
                                            placeholder="Search people or groups..."
                                            value={shareSearch}
                                            onChange={e => setShareSearch(e.target.value)}
                                            className={postStyles.shareInput}
                                        />
                                    </div>
                                </div>
                                <div className={postStyles.shareListContainer}>
                                    {isLoadingChats ? (
                                        <div className={postStyles.shareStatus}>Loading conversations...</div>
                                    ) : (() => {
                                        const filtered = shareTargets.filter(t =>
                                            (t.name || t.username || "").toLowerCase().includes(shareSearch.toLowerCase())
                                        );
                                        const groups = filtered.filter(t => t.is_group || t.isGroup);
                                        const directs = filtered.filter(t => !t.is_group && !t.isGroup);
                                        if (filtered.length === 0) return <div className={postStyles.shareStatus}>No chats found</div>;
                                        const renderItem = (target) => (
                                            <button key={target.id} disabled={isSharing} onClick={() => handleShareToTarget(target.id)} className={postStyles.shareItem}>
                                                <div className={postStyles.shareAvatarWrapper}>
                                                    {target.is_group || target.isGroup
                                                        ? <div>👥</div>
                                                        : <img src={target.avatar || "/default-avatar.png"} alt="" className={postStyles.shareAvatarImg} />
                                                    }
                                                </div>
                                                <span className={postStyles.targetName}>{target.name || target.username}</span>
                                                <div className={postStyles.sendLabel}>{isSharing ? "..." : "Send"}</div>
                                            </button>
                                        );
                                        return (
                                            <>
                                                {groups.length > 0 && (
                                                    <div className={postStyles.sectionSection}>
                                                        <div className={postStyles.sectionHeader}>Group Chats</div>
                                                        {groups.map(renderItem)}
                                                    </div>
                                                )}
                                                {directs.length > 0 && (
                                                    <div className={postStyles.sectionSection}>
                                                        <div className={postStyles.sectionHeader}>Direct Messages</div>
                                                        {directs.map(renderItem)}
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>,
                        document.body
                    )}

                    <div className={styles.commentsSection} ref={commentsSectionRef}>
                        {parentComments.map((c) => {
                            const replies = getReplies(c.id);
                            const isExpanded = expandedReplies[c.id];

                            return (
                                <div key={c.id} className={styles.commentBlock} ref={el => commentRefs.current[c.id] = el}>
                                    <div className={styles.commentRow}>
                                        <Link to={c.author?.user_type === 'page' ? `/page/${c.user_id}` : `/profile/${c.user_id}`}>
                                            <img src={c.user_avatar || "/default-avatar.png"} className={styles.commentAvatar} alt="" />
                                        </Link>
                                        <div className={styles.commentContent}>
                                            <div className={`${styles.commentBubble} ${highlightedId === c.id ? styles.highlighted : ''}`}>
                                                <div className={styles.commentAuthor}>{c.user}</div>
                                                <p>
                                                    {c.text}
                                                    {c.is_edited && (
                                                        <span style={{ fontSize: '0.7rem', opacity: 0.7, marginLeft: '6px', fontStyle: 'italic' }}>
                                                            (edited)
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                            <div className={styles.commentActions}>
                                                <span onClick={() => toggleLike(c.id)}>Like</span>
                                                <span onClick={() => { setParentComment(c); setEditingComment(null); setNewComment(""); }}>Reply</span>
                                                {c.user === currentUser?.username && (
                                                    <>
                                                        <span className={styles.editBtn} onClick={() => { setEditingComment(c); setNewComment(c.text); setParentComment(null); }}>Edit</span>
                                                        <span className={styles.deleteBtn} onClick={() => deleteComment(c.id)}>Delete</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {replies.length > 0 && (
                                        <div className={styles.viewRepliesToggle} onClick={() => toggleReplies(c.id)}>
                                            <span className={styles.toggleLine}></span>
                                            <span>{isExpanded ? "Hide replies" : `View replies (${replies.length})`}</span>
                                        </div>
                                    )}

                                    {isExpanded && replies.map((reply) => (
                                        <div key={reply.id} className={styles.replyRow} ref={el => commentRefs.current[reply.id] = el}>
                                            <Link to={reply.author?.user_type === 'page' ? `/page/${reply.user_id}` : `/profile/${reply.user_id}`}>                                             <img src={reply.user_avatar || "/default-avatar.png"} className={styles.replyAvatar} alt="" />
                                            </Link>
                                            <div className={styles.replyContent}>
                                                <div className={`${styles.replyBubble} ${highlightedId === reply.id ? styles.highlighted : ''}`}>
                                                    <b>{reply.user}</b>
                                                    <p>
                                                        <span className={styles.replyingTo}>@{reply.replying_to || c.user}</span>{" "}
                                                        {reply.text}
                                                        {reply.is_edited && (
                                                            <span style={{ fontSize: '0.7rem', opacity: 0.7, marginLeft: '6px', fontStyle: 'italic' }}>
                                                                (edited)
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                                <div className={styles.commentActions}>
                                                    <span onClick={() => toggleLike(reply.id)}>Like</span>
                                                    <span onClick={() => { setParentComment(reply || c); setEditingComment(null); setNewComment(""); }}>Reply</span>
                                                    {reply.user === currentUser?.username && (
                                                        <>
                                                            <span className={styles.editBtn} onClick={() => { setEditingComment(reply); setNewComment(reply.text); setParentComment(null); }}>Edit</span>
                                                            <span className={styles.deleteBtn} onClick={() => deleteComment(reply.id)}>Delete</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {editingComment ? (
                    <div className={styles.replyBar}>
                        <span>Editing comment</span>
                        <button className={styles.closeReplyBtn} onClick={() => { setEditingComment(null); setNewComment(""); }}>✕</button>
                    </div>
                ) : parentComment ? (
                    <div className={styles.replyBar}>
                        <span>Replying to <b>{parentComment.user}</b></span>
                        <button className={styles.closeReplyBtn} onClick={() => setParentComment(null)}>✕</button>
                    </div>
                ) : null}

                <div className={styles.inputContainer}>
                    <div className={styles.inputRow}>
                        <div className={styles.inputWrapper}>
                            <input
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleCommentSubmit()}
                                placeholder={editingComment ? "Edit your comment..." : "Write a comment..."}
                            />
                            <button
                                className={`${styles.sendBtn} ${newComment.trim() ? styles.active : ""}`}
                                onClick={handleCommentSubmit}
                            > ➢ </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}