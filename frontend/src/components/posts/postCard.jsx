import styles from "./posts.module.css";
import { useState, useRef, useEffect } from "react";
import { Trash2, MoreHorizontal, Bookmark, Ban, Flag } from "lucide-react";
import { Link } from "react-router-dom";
import Like from '../../Assets/icons/like.png';
import LikeActive from '../../Assets/icons/like-active.png'
import Share from '../../Assets/icons/share.png';
import Pin from '../../Assets/icons/pin.png'
import GoodReview from '../../Assets/icons/good-review.png';
import BadReview from '../../Assets/icons/bad-review.png';
import NatrualReview from '../../Assets/icons/neutral-review.png';
import ReportModal from "./ReportModal";
import { createPortal } from "react-dom";

export default function PostCard({ post, openComments, isOwnProfile }) {
  const [current, setCurrent] = useState(0);
  const [isLiked, setIsLiked] = useState(post?.is_liked || post?.has_liked || false);
  const [isSaved, setIsSaved] = useState(post?.is_saved || false);
  const [likesCount, setLikesCount] = useState(post?.likes_count || 0);
  const [showMenu, setShowMenu] = useState(false);
  const [isPinned, setIsPinned] = useState(!!post?.is_pinned);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [shareSearch, setShareSearch] = useState("");
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareTargets, setShareTargets] = useState([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const shareMenuRef = useRef(null);
  const menuRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const [isBlocked, setIsBlocked] = useState(post?.author?.is_blocked || false);
  const [adReaction, setAdReaction] = useState(post?.ad_reaction || null);
  const [showReport, setShowReport] = useState(false);
  const [commenterAvatars, setCommenterAvatars] = useState([]);

  const CHAR_LIMIT = 150;
  useEffect(() => {
    const fetchCommenters = async () => {
      const token = localStorage.getItem("access");
      const postId = post.id || post.post_id;
      console.log("fetching comments for post:", postId);
      if (!postId || !token) return;
      try {
        const res = await fetch(`http://localhost:8000/api/posts/${postId}/comments/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          console.log("comments data:", data);
          const comments = Array.isArray(data) ? data : (data.results || []);
          console.log("first comment:", comments[0]);
          const seen = new Set();
          const avatars = [];
          for (const comment of comments) {
            const authorId = comment.user_id;
            const avatar = comment.user_avatar;
            if (authorId && !seen.has(authorId) && avatar) {
              seen.add(authorId);
              avatars.push(avatar.startsWith("http") ? avatar : `http://localhost:8000${avatar}`);
            }
            if (avatars.length === 3) break;
          }
          console.log("final avatars:", avatars);
          setCommenterAvatars(avatars);
        }
      } catch (e) { console.error(e); }
    };
    fetchCommenters();
  }, [post.id, post.post_id]);

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
      // Empty line = paragraph break
      if (line.trim() === '') {
        return <br key={i} />;
      }
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

    // Toggle off if same reaction clicked again
    const newReaction = adReaction === reaction ? null : reaction;
    setAdReaction(newReaction);

    try {
      const res = await fetch(`http://localhost:8000/api/posts/${postId}/react/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reaction: newReaction }),
      });
      if (!res.ok) setAdReaction(prev); // revert on fail
    } catch { setAdReaction(prev); }
  };

  // Close menus on clicking outside
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
    window.addEventListener("scroll", handleScroll, true); // true = capture phase catches all scroll events
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [showMenu]);

  // Fetch actual chats dynamically when the share dropdown is opened
  useEffect(() => {
    if (!showShareMenu) return;

    const fetchActiveChats = async () => {
      const token = localStorage.getItem("access");
      if (!token) return;

      setIsLoadingChats(true);
      try {
        // Replace this URL endpoint with your exact backend endpoint for fetching recent chat/room threads
        const res = await fetch("http://localhost:8000/api/chats/", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
        });
        if (res.ok) {
          const data = await res.json();
          const formatted = data.map(chat => ({
            ...chat,
            avatar: chat.avatar
              ? chat.avatar.startsWith("http")
                ? chat.avatar
                : `http://localhost:8000${chat.avatar}`
              : "/default-avatar.png"
          }));
          setShareTargets(formatted);
        } else {
          console.error("Failed to retrieve chat target threads.");
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

  if (!post || !post.author) {
    return null;
  }

  const handleMenuAction = async (actionType) => {
    const token = localStorage.getItem("access");
    if (actionType === 'block') {
      const postId = post.id || post.post_id;
      const newBlocked = !isBlocked;
      setIsBlocked(newBlocked);  // update state FIRST
      setShowMenu(false);        // THEN close
      try {
        await fetch(`http://localhost:8000/api/posts/${postId}/block/`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) { setIsBlocked(!newBlocked); } // revert on fail
      return;
    }
    setShowMenu(false);


    if (actionType === 'delete') {
      setShowDeleteConfirm(true);
      return;
    }


    if (actionType === 'pin') {
      try {
        const postId = post.id || post.post_id;

        const res = await fetch(
          `http://localhost:8000/api/posts/${postId}/pin/`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (res.ok) {
          const data = await res.json();

          setIsPinned(Boolean(data.is_pinned));
        }
      } catch (err) {
        console.error("Failed to pin post");
      }

      return;
    }

    if (actionType === 'save') setIsSaved(prev => !prev);

    try {
      const postId = post.id || post.post_id;
      const res = await fetch(`http://localhost:8000/api/posts/${postId}/${actionType}/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok && actionType === 'pin') {

      } else if (!res.ok) {

        if (actionType === 'pin') setIsPinned(prev => !prev);
        if (actionType === 'save') setIsSaved(prev => !prev);
      }
    } catch (err) {
      console.error(`Failed to ${actionType} post`);
    }
  };
  const confirmDelete = async () => {
    const token = localStorage.getItem("access");
    const postId = post.id || post.post_id;  // ← add fallback
    try {
      const res = await fetch(`http://localhost:8000/api/posts/${postId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) window.location.reload();
    } catch (err) {
      console.error("Delete failed", err);
    }
    setShowDeleteConfirm(false);
  };

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

  const handleShareToTarget = async (targetId) => {
    const token = localStorage.getItem("access");
    if (!token) return;

    setIsSharing(true);
    try {
      const res = await fetch(`http://localhost:8000/api/messages/send/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
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

      if (res.ok) {
        setShowShareMenu(false);
      } else {
        console.error("Failed to distribute share context payload");
      }
    } catch (err) {
      console.error("Error during share processing step:", err);
    } finally {
      setIsSharing(false);
    }
  };



  return (
    <article className={styles.card}>
      {showDeleteConfirm && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteConfirm(false)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalContent}>
              <h3 className={styles.modalTitle}>Delete this post?</h3>
              <p className={styles.modalText}>
                Once you delete this post, it can't be restored.
              </p>
            </div>

            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className={styles.deleteConfirmBtn}
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      <div className={styles.topRow}>
        <div className={styles.user}>
          <Link to={(post.author?.id || post.author_id) ?
            post.author?.type === 'page'
              ? `/page/${post.author?.id || post.author_id}`
              : `/profile/${post.author?.id || post.author_id}`
            : "#"
          }>
            <img className={styles.avatar} src={post.author?.avatar || "/default-avatar.png"} alt="" />
          </Link>
          <div className={styles.userMeta}>
            <div className={styles.nameLine}>
              <span className={styles.name}>{post.author?.username || "User"}</span>
              {post.tag && <span className={styles.tag}>{post.tag}</span>}
            </div>
            <span className={styles.time}>{formatTimeAgo(post.created_at)}</span>
            {isPinned && isOwnProfile && (
              <>
                <img src={Pin} alt="pinned" width={14} height={14} style={{ filter: 'brightness(0) invert(1)' }} className={styles.pinIcon} />
                <p style={{ color: "white" }}>Pinned</p>
              </>
            )}
          </div>
        </div>

        <div className={styles.menuContainer} ref={menuRef}>
          <button
            className={styles.menuBtn}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setMenuPosition({
                top: rect.bottom + 6,
                right: window.innerWidth - rect.right
              });
              setShowMenu(prev => !prev);
            }}
            aria-label="menu"
          >
            <MoreHorizontal size={20} />
          </button>

          {showMenu && createPortal(
            <div
              style={{
                position: "fixed",
                top: menuPosition.top,
                right: menuPosition.right,
                zIndex: 9999,
                background: "#2a2a2a",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 14,
                padding: "6px 0",
                minWidth: 160,
                boxShadow: "0 8px 24px rgba(0,0,0,0.6)"
              }}
              ref={menuRef}
            >
              {/* WHITE ACTIONS */}
              <div className={styles.menuSection}>
                {isOwnProfile && (
                  <button className={styles.menuItem} onClick={() => handleMenuAction('pin')}>
                    <img src={Pin} width={16} alt="" className={styles.pinMenuIcon} />
                    {isPinned ? "Unpin Post" : "Pin Post"}
                  </button>
                )}
                <button className={styles.menuItem} onClick={() => handleMenuAction('save')}>
                  <Bookmark size={16} fill={isSaved ? "currentColor" : "none"} />
                  {isSaved ? "Unsave" : "Save"}
                </button>
              </div>

              <div className={styles.menuDivider} />

              {/* RED ACTIONS */}
              <div className={styles.menuSection}>
                {isOwnProfile ? (
                  <button className={`${styles.menuItem} ${styles.danger}`} onClick={() => handleMenuAction('delete')}>
                    <Trash2 size={16} /> Delete Post
                  </button>
                ) : (
                  <>
                    <button className={`${styles.menuItem} ${styles.danger}`} onClick={() => { setShowMenu(false); setShowReport(true); }}>
                      <Flag size={16} /> Report
                    </button>
                    <button
                      className={`${styles.menuItem} ${styles.danger}`}
                      onClick={() => handleMenuAction('block')}
                    >
                      <Ban size={16} />
                      {isBlocked ? "Unblock" : "Block"}
                    </button>
                  </>
                )}
              </div>
            </div>,
            document.body
          )}
        </div>
      </div>

      {post.content_text && (
        <p className={styles.text}>
          {post.content_text.length > CHAR_LIMIT && !isExpanded
            ? <>
              {formatText(post.content_text.substring(0, CHAR_LIMIT))}...{' '}
              <span className={styles.readMore} onClick={() => setIsExpanded(true)}>
                read more
              </span>
            </>
            : <>
              {formatText(post.content_text)}
              {post.content_text.length > CHAR_LIMIT && (
                <span className={styles.readMore} onClick={() => setIsExpanded(false)} style={{ marginLeft: 6 }}>
                  show less
                </span>
              )}
            </>
          }
        </p>
      )}

      {validMedia.length > 0 && validMedia[current]?.type !== "file" && (
        <div className={styles.media}>
          {validMedia.length > 1 && <button className={styles.leftArrow} onClick={prevSlide}>◀</button>}
          {validMedia[current]?.type === "image" && (
            <img src={validMedia[current].url} alt="" className={styles.mediaItem} />
          )}
          {validMedia[current]?.type === "video" && (
            <video controls className={styles.mediaItem}>
              <source src={validMedia[current].url} type="video/mp4" />
            </video>
          )}
          {validMedia.length > 1 && <button className={styles.rightArrow} onClick={nextSlide}>▶</button>}
          {validMedia.length > 1 && (
            <div className={styles.dots}>
              {validMedia.map((_, index) => (
                <span key={index} className={`${styles.dot} ${index === current ? styles.activeDot : ""}`} />
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

      {post.poll_options && post.poll_options.length > 0 && (
        <div className={styles.pollBox}>
          {post.poll_options.map((opt, i) => (
            <button key={i} className={styles.pollOption}>{opt}</button>
          ))}
        </div>
      )}

      <div className={styles.actions}>
       
        <button
          className={`${styles.iconBtn} ${isLiked ? styles.liked : ""}`}
          onClick={handleLike}
          type="button"
        >
          <span className={styles.heart}>
            {isLiked
              ? <img src={LikeActive} alt="liked" className={styles.likeActive} width={22} height={22} />
              : <img src={Like} alt="like" className={styles.like} width={22} height={22} />
            }
          </span>
          {likesCount > 0 && <span className={styles.count}>{likesCount}</span>}
        </button>


        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {post.post_type === "advertisement" ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className={styles.prompt}>how do you feel about this ad?</span>
              <div className={styles.reactions}>
                <button
                  className={styles.reactionBtn}
                  onClick={() => handleAdReaction('good')}
                  style={{
                    transform: adReaction === 'good' ? 'scale(1.25)' : 'scale(1)',
                    filter: adReaction && adReaction !== 'good' ? 'grayscale(1) opacity(0.4)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  <img src={GoodReview} alt="good" width={28} height={28} />
                </button>
                <button
                  className={styles.reactionBtn}
                  onClick={() => handleAdReaction('neutral')}
                  style={{
                    transform: adReaction === 'neutral' ? 'scale(1.25)' : 'scale(1)',
                    filter: adReaction && adReaction !== 'neutral' ? 'grayscale(1) opacity(0.4)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  <img src={NatrualReview} alt="neutral" width={28} height={28} />
                </button>
                <button
                  className={styles.reactionBtn}
                  onClick={() => handleAdReaction('bad')}
                  style={{
                    transform: adReaction === 'bad' ? 'scale(1.25)' : 'scale(1)',
                    filter: adReaction && adReaction !== 'bad' ? 'grayscale(1) opacity(0.4)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  <img src={BadReview} alt="bad" width={28} height={28} />
                </button>
              </div>
            </div>) : (
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
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "2px solid #262626",
                        marginLeft: i === 0 ? 0 : -10,
                        zIndex: 3 - i,
                        position: "relative"
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right — share button */}
        <div className={styles.shareContainer} ref={shareMenuRef} style={{ position: 'relative' }}>
          <button
            className={styles.shareBtn}
            type="button"
            onClick={() => setShowShareMenu(!showShareMenu)}
          >
            <img src={Share} alt="share" width={18} height={18} className={styles.shareIcon} />
            <span className={styles.shareText}>Share</span>
          </button>

          {showShareMenu && createPortal(
            <div className={styles.shareOverlay} onClick={() => { setShowShareMenu(false); setShareSearch(""); }}>
              <div className={styles.shareModal} onClick={e => e.stopPropagation()} ref={shareMenuRef}>

                <div className={styles.shareHeader}>
                  <h3 className={styles.shareTitle}>Share Post</h3>
                  <button
                    className={styles.closeBtn}
                    onClick={() => { setShowShareMenu(false); setShareSearch(""); }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className={styles.shareSearchWrapper}>
                  <div className={styles.shareSearchInner}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.searchIcon}>
                      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                      autoFocus
                      placeholder="Search people or groups..."
                      value={shareSearch}
                      onChange={e => setShareSearch(e.target.value)}
                      className={styles.shareInput}
                    />
                  </div>
                </div>

                <div className={styles.shareListContainer}>
                  {isLoadingChats ? (
                    <div className={styles.shareStatus}>Loading conversations...</div>
                  ) : (() => {
                    const filtered = shareTargets.filter(t =>
                      (t.name || t.username || "").toLowerCase().includes(shareSearch.toLowerCase())
                    );
                    const groups = filtered.filter(t => t.is_group || t.isGroup);
                    const directs = filtered.filter(t => !t.is_group && !t.isGroup);

                    if (filtered.length === 0) return (
                      <div className={styles.shareStatus}>No chats found</div>
                    );

                    const renderItem = (target) => (
                      <button
                        key={target.id}
                        disabled={isSharing}
                        onClick={() => handleShareToTarget(target.id)}
                        className={styles.shareItem}
                      >
                        <div className={styles.shareAvatarWrapper}>
                          {target.is_group || target.isGroup ? (
                            <div className={styles.groupIconPlaceholder}>👥</div>
                          ) : (
                            <img src={target.avatar || "/default-avatar.png"} alt="" className={styles.shareAvatarImg} />
                          )}
                        </div>
                        <span className={styles.targetName}>
                          {target.name || target.username}
                        </span>
                        <div className={styles.sendLabel}>{isSharing ? "..." : "Send"}</div>
                      </button>
                    );

                    return (
                      <>
                        {groups.length > 0 && (
                          <div className={styles.sectionSection}>
                            <div className={styles.sectionHeader}>Group Chats</div>
                            {groups.map(renderItem)}
                          </div>
                        )}
                        {directs.length > 0 && (
                          <div className={styles.sectionSection}>
                            <div className={styles.sectionHeader}>Direct Messages</div>
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
        </div>
        {showReport && (
          <ReportModal
            contentId={post.id || post.post_id}
            contentType="post"
            onClose={() => setShowReport(false)}
          />
        )}
      </div>
    </article>
  );
}
