import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Trash2, MoreHorizontal, Bookmark, Check, X } from "lucide-react";
import styles from "./posts.module.css";
import ReportModal from "./ReportModal";

// Icons
import Like from '../../Assets/icons/like.png';
import LikeActive from '../../Assets/icons/like-active.png';
import Share from '../../Assets/icons/share.png';
import Pin from '../../Assets/icons/pin.png';
import GoodReview from '../../Assets/icons/good-review.png';
import BadReview from '../../Assets/icons/bad-review.png';
import NatrualReview from '../../Assets/icons/neutral-review.png';
import ArrowRight from '../../Assets/icons/arrow-right.png';
import ArrowLeft from '../../Assets/icons/arrow-left.png';
import XIcon from '../../Assets/icons/x.png';
import BinIcon from '../../Assets/icons/bin.png';
import LeaveIcon from '../../Assets/icons/leave.png';
import InfoIcon from '../../Assets/icons/info.png';
import HighLight from '../../Assets/icons/star.png';
import DeletePost from '../../Assets/icons/bin.png';
import Block from '../../Assets/icons/block.png';
import Report from '../../Assets/icons/info.png';
import SaveIcon from '../../Assets/icons/save-icon.png';
import BellOn from '../../Assets/icons/notifications.png';
import SearchIcon from '../../Assets/icons/search.png';
import BellOff from '../../Assets/icons/mute.png';

export default function PostCard({
  post, openComments, isOwnProfile, hasPinnedPost, onPinChange,
  isRequestMode, onAcceptPost, onRejectPost, isReportedMode,
  onDismiss, onReportDelete, onKick, onReportAction, isAdmin,
  communityContext, communityId
}) {
  const [current, setCurrent] = useState(0);
  const [isLiked, setIsLiked] = useState(post?.is_liked || post?.has_liked || false);
  const [isSaved, setIsSaved] = useState(post?.is_saved || false);
  const [likesCount, setLikesCount] = useState(post?.likes_count || 0);
  const [showPinConfirm, setShowPinConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isPinned, setIsPinned] = useState(!!post?.is_pinned);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [shareSearch, setShareSearch] = useState("");
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareTargets, setShareTargets] = useState([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isKicked, setIsKicked] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const [isBlocked, setIsBlocked] = useState(post?.author?.is_blocked || false);
  const [adReaction, setAdReaction] = useState(post?.ad_reaction || null);
  const [showReport, setShowReport] = useState(false);
  const [isFollowed, setIsFollowed] = useState(post?.author?.is_followed);
  const [isNotified, setIsNotified] = useState(post?.author?.is_notified || false);
  const [isHighlighted, setIsHighlighted] = useState(!!post?.is_highlighted);

  const shareMenuRef = useRef(null);
  const menuRef = useRef(null);

  const loginUserRaw = localStorage.getItem("login_user");
  const loginUserObj = loginUserRaw ? JSON.parse(loginUserRaw) : null;
  const loggedInUserId = loginUserObj?.id;
  const isOwnPost = String(post.author?.id || post.author_id) === String(loggedInUserId);
  const CHAR_LIMIT = 150;

  const [commenterAvatars, setCommenterAvatars] = useState(
    (post?.top_3comments_avatar || []).map(c => {
      const avatar = c.author_avatar || c.avatar;
      if (!avatar) return null;
      return avatar.startsWith("http") ? avatar : `http://localhost:8000${avatar}`;
    }).filter(Boolean)
  );

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

  const formatText = (text) => {
    return text.split('\n').map((line, i, arr) => {
      if (line.trim() === '') return <br key={i} />;
      return (
        <span key={i}>
          {line}
          {i < arr.length - 1 && arr[i + 1]?.trim() !== '' && <br />}
        </span>
      );
    });
  };

  const handleAdReaction = async (reaction) => {
    const token = localStorage.getItem("access");
    const postId = post.id || post.post_id;
    const prev = adReaction;
    const newReaction = adReaction === reaction ? null : reaction;
    setAdReaction(newReaction);
    try {
      const res = await fetch(`http://localhost:8000/api/posts/${postId}/react/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reaction: newReaction }),
      });
      if (!res.ok) setAdReaction(prev);
    } catch { setAdReaction(prev); }
  };

  const handleFollow = async () => {
    const token = localStorage.getItem("access");
    const prevFollowed = isFollowed;
    const prevNotified = isNotified;

    setIsFollowed(!prevFollowed);
    if (prevFollowed) setIsNotified(false);

    try {
      const res = await fetch(`http://localhost:8000/api/pages/${post.author.id}/follow/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const newFollowed = data.is_followed !== undefined ? data.is_followed : !prevFollowed;
        const newNotified = newFollowed ? isNotified : false;
        setIsFollowed(newFollowed);
        if (!newFollowed) setIsNotified(false);

        window.dispatchEvent(new CustomEvent("page-follow-changed", {
          detail: { pageId: post.author.id, is_followed: newFollowed, is_notified: newNotified }
        }));
      } else {
        setIsFollowed(prevFollowed);
        setIsNotified(prevNotified);
      }
    } catch {
      setIsFollowed(prevFollowed);
      setIsNotified(prevNotified);
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (String(e.detail.pageId) === String(post.author?.id)) {
        setIsFollowed(e.detail.is_followed);
        if (!e.detail.is_followed) setIsNotified(false);
      }
    };
    window.addEventListener("page-follow-changed", handler);
    return () => window.removeEventListener("page-follow-changed", handler);
  }, [post.author?.id]);

  const handleNotify = async () => {
    const token = localStorage.getItem("access");
    const prev = isNotified;
    setIsNotified(!prev);
    try {
      const res = await fetch(`http://localhost:8000/api/pages/${post.author.id}/notify/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) setIsNotified(prev);
    } catch { setIsNotified(prev); }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setShowMenu(false);
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target)) setShowShareMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!showMenu) return;
    const handleScroll = () => setShowMenu(false);
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [showMenu]);

  useEffect(() => {
    if (!showShareMenu) return;

    const fetchActiveChats = async () => {
      const token = localStorage.getItem("access");
      if (!token) return;

      setIsLoadingChats(true);
      try {
        const res = await fetch("http://localhost:8000/api/chats/", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });

        if (res.ok) {
          const data = await res.json();
          const deduped = data.reduce((acc, chat) => {
            const key = (chat.name || chat.username || "").toLowerCase().trim();
            const existingIndex = acc.findIndex(c => (c.name || c.username || "").toLowerCase().trim() === key);

            if (existingIndex === -1) {
              acc.push(chat);
            } else {
              const existing = acc[existingIndex];
              if (chat.last_message_time && (!existing.last_message_time || new Date(chat.last_message_time) > new Date(existing.last_message_time))) {
                acc[existingIndex] = chat;
              }
            }
            return acc;
          }, []);

          const formatted = deduped.map(chat => ({
            ...chat,
            avatar: chat.avatar ? chat.avatar.startsWith("http") ? chat.avatar : `http://localhost:8000${chat.avatar}` : "/default-avatar.png"
          }));
          setShareTargets(formatted);
        }
      } catch (err) {
        console.error("Error fetching chats:", err);
      } finally {
        setIsLoadingChats(false);
      }
    };
    fetchActiveChats();
  }, [showShareMenu]);

  const handleLike = async () => {
    const token = localStorage.getItem("access");
    if (!token) return;
    const originalLiked = isLiked;
    setIsLiked(!isLiked);
    setLikesCount(prev => (isLiked ? prev - 1 : prev + 1));
    try {
      const postId = post.id || post.post_id;
      const res = await fetch(`http://localhost:8000/api/posts/${postId}/like/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!res.ok) { setIsLiked(originalLiked); setLikesCount(prev => (originalLiked ? prev + 1 : prev - 1)); }
    } catch (err) { setIsLiked(originalLiked); }
  };

  const handleMenuAction = async (actionType) => {
    const token = localStorage.getItem("access");
    if (actionType === 'block') {
      const postId = post.id || post.post_id;
      const newBlocked = !isBlocked;
      setIsBlocked(newBlocked);
      setShowMenu(false);
      try {
        await fetch(`http://localhost:8000/api/posts/${postId}/block/`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) { setIsBlocked(!newBlocked); }
      return;
    }

    setShowMenu(false);

    if (actionType === 'delete') { setShowDeleteConfirm(true); return; }

    if (actionType === 'pin') {
      if (!isPinned && hasPinnedPost) {
        setShowMenu(false);
        setShowPinConfirm(true);
        return;
      }
      try {
        const postId = post.id || post.post_id;
        const res = await fetch(`http://localhost:8000/api/posts/${postId}/pin/`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setIsPinned(Boolean(data.is_pinned));
          if (data.is_pinned) onPinChange?.(postId);
        }
      } catch (err) { console.error("Failed to pin post"); }
      return;
    }

    if (actionType === 'save') setIsSaved(prev => !prev);
    if (actionType === 'highlight') setIsHighlighted(prev => !prev);

    try {
      const postId = post.id || post.post_id;
      const res = await fetch(`http://localhost:8000/api/posts/${postId}/${actionType}/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: actionType === 'highlight' && communityId ? JSON.stringify({ community_id: communityId }) : null,
      });
      if (!res.ok) {
        if (actionType === 'pin') setIsPinned(prev => !prev);
        if (actionType === 'save') setIsSaved(prev => !prev);
        if (actionType === 'highlight') setIsHighlighted(prev => !prev);
      }
    } catch (err) { console.error(`Failed to ${actionType} post`); }
  };

  const confirmDelete = async () => {
    const token = localStorage.getItem("access");
    const postId = post.id || post.post_id;
    try {
      const res = await fetch(`http://localhost:8000/api/posts/${postId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) window.location.reload();
    } catch (err) { console.error("Delete failed", err); }
    setShowDeleteConfirm(false);
  };

  const confirmPin = async () => {
    const token = localStorage.getItem("access");
    const postId = post.id || post.post_id;
    try {
      const res = await fetch(`http://localhost:8000/api/posts/${postId}/pin/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setIsPinned(Boolean(data.is_pinned));
        onPinChange?.(postId);
      }
    } catch (err) { console.error("Failed to pin post"); }
    setShowPinConfirm(false);
  };

  const handleShareToTarget = async (targetId) => {
    const token = localStorage.getItem("access");
    if (!token) return;
    setIsSharing(true);
    try {
      const res = await fetch(`http://localhost:8000/api/messages/send/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_id: targetId,
          post_id: post.id || post.post_id,
          content: "Shared a post",
          shared_post: {
            id: post.id || post.post_id,
            content_text: post.content_text,
            image: post.image,
            media: post.media,
            author: post.author,
            created_at: post.created_at,
            likes_count: post.likes_count,
            comments_count: post.comments_count,
            is_liked: post.is_liked,
            is_saved: post.is_saved,
          }
        }),
      });
      if (res.ok) setShowShareMenu(false);
    } catch (err) {
      console.error("Error during share processing step:", err);
    } finally {
      setIsSharing(false);
    }
  };

  if (!post || !post.author) return null;

  const validMedia = post?.media?.map((item) => {
    const url = item.url || "";
    let type = item.type?.toLowerCase();
    if (!type && url) {
      const cleanUrl = url.split(/[?#]/)[0];
      if (cleanUrl.match(/\.(mp4|webm|ogg)$/i)) type = "video";
      else if (cleanUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) type = "image";
      else type = "file";
    }
    return { ...item, type };
  }) || [];

  const files = validMedia.filter(m => m.type === "file");
  const nextSlide = () => setCurrent((prev) => (prev + 1) % validMedia.length);
  const prevSlide = () => setCurrent((prev) => (prev === 0 ? validMedia.length - 1 : prev - 1));

  const menuItemStyle = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    padding: "10px 16px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    textAlign: "left",
    transition: "background 0.15s ease",
    borderRadius: 0,
  };

  const MenuDivider = () => (
    <div className={styles.menuDividerWrap}>
      <div className={styles.menuDividerLine} />
    </div>
  );

  return (
    <article className={styles.card}>
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteConfirm(false)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalContent}>
              <h3 className={styles.modalTitle}>Delete this post?</h3>
              <p className={styles.modalText}>Once you delete this post, it can't be restored.</p>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className={styles.deleteConfirmBtn} onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Pin Confirmation Modal */}
      {showPinConfirm && (
        <div className={styles.modalOverlay} onClick={() => setShowPinConfirm(false)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalContent}>
              <h3 className={styles.modalTitle}>Replace pinned post?</h3>
              <p className={styles.modalText}>You already have a pinned post. Pinning this will unpin the other one.</p>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowPinConfirm(false)}>Cancel</button>
              <button className={styles.deleteConfirmBtn} onClick={confirmPin}>Pin anyway</button>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar: User Info & Actions */}
      {/* Top Bar: User Info & Actions */}
      <div className={styles.topRow}>
        <div className={styles.user}>
          <Link to={
            post.author?.type === 'page'
              ? `/page/${post.author?.id || post.author_id}`
              : `/profile/${post.author?.id || post.author_id}`
          }>
            <img className={styles.avatar} src={post.author?.avatar || "/default-avatar.png"} alt="" />
          </Link>

          <div className={styles.userMeta}>
            {/* Name row */}
            <div className={styles.nameLine}>
              <span className={styles.name} style={{
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                maxWidth: post.author?.type === 'page' ? '160px' : undefined
              }}>
                {post.author?.username || "User"}
              </span>
              {post.tag && <span className={styles.tag}>{post.tag}</span>}
              {isPinned && isOwnProfile && (
                <>
                  <img src={Pin} alt="pinned" width={20} height={20} className={styles.pinnedIcon} />
                  <span className={styles.pinnedText}>Pinned</span>
                </>
              )}
            </div>

            {/* Subtitle row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {post.author?.type === 'page' && (
                <span className={styles.time}>{post.author?.page_type || 'Page'}</span>
              )}
              {post.author?.type === 'page' && <span className={styles.time}>·</span>}
              <span className={styles.time}>{formatTimeAgo(post.created_at)}</span>
              {post.post_type === "academic" && <span className={styles.time}>· Educational</span>}
              {post.post_type === "announcement" && <span className={styles.time}>· Announcement</span>}
            </div>
          </div>
        </div>

        {/* Right side actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {post.author?.type === 'page' && !isOwnPost && (
            <div className={styles.headerActions}>
              {isFollowed && (
                <button className={styles.bellBtn} onClick={handleNotify}>
                  <img src={isNotified ? BellOn : BellOff} alt="notifications"
                    width={isNotified ? 16 : 20} height={isNotified ? 18 : 20}
                    className={styles.bellIcon} />
                </button>
              )}
              <button className={isFollowed ? styles.followedBtn : styles.followBtn} onClick={handleFollow}>
                {isFollowed ? 'Followed' : 'Follow'}
              </button>
            </div>
          )}

          <div className={styles.menuContainer} ref={menuRef}>
            {!isReportedMode && (
              <button
                className={styles.menuBtn}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setMenuPosition({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
                  setShowMenu(prev => !prev);
                }}
                aria-label="menu"
              >
                <MoreHorizontal size={30} strokeWidth={4} />
              </button>
            )}
            {showMenu && createPortal(/* ... unchanged ... */)}
          </div>
        </div>
      </div>

      {/* Post Text Content */}
      {post.content_text && (
        <p className={styles.text}>
          {post.content_text.length > CHAR_LIMIT && !isExpanded ? (
            <>
              {formatText(post.content_text.substring(0, CHAR_LIMIT))}...{' '}
              <span className={styles.readMore} onClick={() => setIsExpanded(true)}>read more</span>
            </>
          ) : (
            <>
              {formatText(post.content_text)}
              {post.content_text.length > CHAR_LIMIT && (
                <span className={styles.readMore} onClick={() => setIsExpanded(false)} style={{ marginLeft: 6 }}>show less</span>
              )}
            </>
          )}
        </p>
      )}

      {/* Media Rendering */}
      {validMedia.length > 0 && validMedia[current]?.type !== "file" && (
        <div className={styles.media}>
          {validMedia.length > 1 && (
            <button className={styles.leftArrow} onClick={prevSlide}>
              <img src={ArrowLeft} alt="prev" style={{ width: 18, height: 18, filter: "brightness(0) invert(1)" }} />
            </button>
          )}

          {/* ADDED: Image Ad Banner Override */}
          {validMedia[current]?.type === "image" && (
            <div className={styles.imageWrapper}>
              <img src={validMedia[current].url} alt="" className={styles.mediaItem} />
              {post.post_type === "advertisement" && (
                <a
                  href={post.ad_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.adOverlay}
                >
                  <div className={styles.adTextContent}>
                    <h3 className={styles.adTitle}>
                      {post.ad_title}
                    </h3>
                    <p className={styles.adDesc}>
                      {post.ad_description || post.content}
                    </p>
                  </div>

                  <div className={styles.adArrowWrapper}>
                    <img
                      src={ArrowRight}
                      alt="Learn more"
                      className={styles.adArrow}
                    />
                  </div>
                </a>
              )}
            </div>
          )}

          {validMedia[current]?.type === "video" && (
            <video controls className={styles.mediaItem}>
              <source src={validMedia[current].url} type="video/mp4" />
            </video>
          )}

          {validMedia.length > 1 && (
            <button className={styles.rightArrow} onClick={nextSlide}>
              <img src={ArrowRight} alt="next" style={{ width: 18, height: 18, filter: "brightness(0) invert(1)" }} />
            </button>
          )}

          {validMedia.length > 1 && (
            <div className={styles.dots}>
              {validMedia.map((_, index) => (
                <span key={index} className={`${styles.dot} ${index === current ? styles.activeDot : ""}`} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Attached Files */}
      {files.length > 0 && (
        <div className={styles.filesContainer}>
          {files.map((file, i) => (
            <a key={i} href={file.url} target="_blank" rel="noopener noreferrer" className={styles.fileItem}>
              📁 {file.url.split("/").pop()}
            </a>
          ))}
        </div>
      )}

      {/* Poll Options */}
      {post.poll_options && post.poll_options.length > 0 && (
        <div className={styles.pollBox}>
          {post.poll_options.map((opt, i) => (
            <button key={i} className={styles.pollOption}>{opt}</button>
          ))}
        </div>
      )}

      {/* Bottom Actions based on context modes */}
      {isReportedMode ? (
        <div className={styles.reportedActions}>
          <button onClick={() => onDismiss?.(post.id || post.post_id)} style={{ background: 'transparent', border: 'none', color: '#CCC', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <img src={XIcon} alt="Dismiss" style={{ width: 18, height: 18, filter: 'brightness(0) invert(0.8)' }} />
            Dismiss
          </button>
          <button onClick={() => onReportDelete?.(post.id || post.post_id)} style={{ background: 'transparent', border: 'none', color: '#CCC', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <img src={BinIcon} alt="Delete" style={{ width: 18, height: 18, filter: 'brightness(0) invert(0.8)' }} />
            Delete
          </button>
          <button onClick={() => onKick?.(post.id || post.post_id)} style={{ background: 'transparent', border: 'none', color: '#CCC', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <img src={LeaveIcon} alt="Kick" style={{ width: 18, height: 18, filter: 'brightness(0) invert(0.8)' }} />
            Kick
          </button>
          <button onClick={() => onReportAction?.(post.id || post.post_id)} style={{ background: 'transparent', border: 'none', color: '#CCC', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <img src={InfoIcon} alt="Report" style={{ width: 18, height: 18, filter: 'brightness(0) invert(0.8)' }} />
            Report
          </button>
        </div>
      ) : isRequestMode ? (
        <div className={styles.postRequestActions}>
          <button className={styles.acceptPostBtn} onClick={() => onAcceptPost?.(post.id || post.post_id)}>
            <Check size={18} strokeWidth={3} className={styles.acceptIcon} />
            Accept
          </button>
          <div className={styles.verticalDivider}></div>
          <button className={styles.rejectPostBtn} onClick={() => onRejectPost?.(post.id || post.post_id)}>
            <X size={18} strokeWidth={3} color="#D4145A" />
            Reject
          </button>
        </div>
      ) : (
        <div className={styles.actions}>
          {/* Reaction Button */}
          <button className={`${styles.iconBtn} ${isLiked ? styles.liked : ""}`} onClick={handleLike} type="button">
            <span className={styles.heart}>
              {isLiked
                ? <img src={LikeActive} alt="liked" className={styles.likeActive} width={22} height={22} />
                : <img src={Like} alt="like" className={styles.like} width={22} height={22} />
              }
            </span>
            {likesCount > 0 && <span className={styles.count}>{likesCount}</span>}
          </button>

          {/* Advertisement Sentiments / Comment Component */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {post.post_type === "advertisement" ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className={styles.prompt}>how do you feel about this ad?</span>
                <div className={styles.reactions}>
                  {[
                    { key: 'good', src: GoodReview },
                    { key: 'neutral', src: NatrualReview },
                    { key: 'bad', src: BadReview },
                  ].map(({ key, src }) => (
                    <button
                      key={key}
                      className={styles.reactionBtn}
                      onClick={() => handleAdReaction(key)}
                      style={{
                        transform: adReaction === key ? 'scale(1.25)' : 'scale(1)',
                        filter: adReaction && adReaction !== key ? 'grayscale(1) opacity(0.4)' : 'none',
                        transition: 'all 0.2s'
                      }}
                    >
                      <img src={src} alt={key} width={28} height={28} />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div
                className={styles.commentInputPill}
                style={{ maxWidth: "200px", display: "flex", alignItems: "center", padding: "0 8px 0 16px" }}
                onClick={() => openComments(post)}
              >
                <span className={styles.placeholderText}>Add a comment ...</span>
                {commenterAvatars.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", marginLeft: "auto", width: 20 }}>
                    {commenterAvatars.map((avatar, i) => (
                      <img
                        key={i}
                        src={avatar}
                        alt=""
                        style={{
                          width: 34, height: 34, borderRadius: "50%", objectFit: "cover",
                          border: "2px solid #262626",
                          marginLeft: i === 0 ? 0 : -10,
                          zIndex: 3 - i, position: "relative"
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Share Block */}
          <div className={styles.shareContainer} ref={shareMenuRef} style={{ position: 'relative' }}>
            <button className={styles.shareBtn} type="button" onClick={() => setShowShareMenu(!showShareMenu)}>
              <img src={Share} alt="share" width={18} height={18} className={styles.shareIcon} />
              <span className={styles.shareText}>Share</span>
            </button>

            {showShareMenu && createPortal(
              <div className={styles.shareOverlay} onClick={() => { setShowShareMenu(false); setShareSearch(""); }}>
                <div className={styles.shareModal} onClick={e => e.stopPropagation()} ref={shareMenuRef}>

                  <div className={styles.shareHeader}>
                    <p className={styles.shareTitle}>Share post</p>
                    <button className={styles.closeBtn} onClick={() => { setShowShareMenu(false); setShareSearch(""); }}>
                      <img src={XIcon} alt="close" width={14} height={14} style={{ filter: "brightness(0) invert(1)" }} />
                    </button>
                  </div>

                  <div className={styles.shareSearchWrapper}>
                    <div className={styles.shareSearchInner}>
                      <img src={SearchIcon} alt="" className={styles.shareSearchIcon} />
                      <input
                        className={styles.shareInput}
                        placeholder="Search people or chats..."
                        value={shareSearch}
                        onChange={e => setShareSearch(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className={styles.shareListContainer}>
                    {isLoadingChats ? (
                      <div className={styles.shareStatus}>Loading...</div>
                    ) : shareTargets.filter(t =>
                      (t.name || t.username || "").toLowerCase().includes(shareSearch.toLowerCase())
                    ).length === 0 ? (
                      <div className={styles.shareStatus}>No chats found</div>
                    ) : (
                      <>
                        <div className={styles.sectionHeader}>Chats</div>
                        {shareTargets
                          .filter(t => (t.name || t.username || "").toLowerCase().includes(shareSearch.toLowerCase()))
                          .map(target => (
                            <button
                              key={target.id}
                              className={styles.shareItem}
                              onClick={() => handleShareToTarget(target.id)}
                              disabled={isSharing}
                            >
                              <div className={styles.shareAvatarWrapper}>
                                <img
                                  src={target.avatar}
                                  alt=""
                                  className={styles.shareAvatarImg}
                                  onError={e => { e.currentTarget.src = "/default-avatar.png"; }}
                                />
                              </div>
                              <span className={styles.targetName}>
                                {target.name || target.username}
                              </span>
                              <span className={styles.sendLabel}>Send</span>
                            </button>
                          ))
                        }
                      </>
                    )}
                  </div>
                </div>
              </div>,
              document.body
            )}
          </div>
        </div>
      )}

      {showReport && (
        <ReportModal
          contentId={post.id || post.post_id}
          contentType="post"
          onClose={() => setShowReport(false)}
        />
      )}
    </article>
  );
}