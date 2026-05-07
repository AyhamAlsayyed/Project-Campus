import styles from "./posts.module.css";
import { useState, useRef, useEffect } from "react";
import { Trash2, MoreHorizontal, Bookmark, Ban, Flag } from "lucide-react";
import { Link } from "react-router-dom";
import Like from '../../Assets/icons/like.png';
import LikeActive from '../../Assets/icons/like-active.png'
import Share from '../../Assets/icons/share.png';
import Pin from '../../Assets/icons/pin.png'
import { createPortal } from "react-dom";

export default function PostCard({ post, openComments, isOwnProfile }) {
  const [current, setCurrent] = useState(0);
  const [isLiked, setIsLiked] = useState(post?.is_liked || post?.has_liked || false);
  const [isSaved, setIsSaved] = useState(post?.is_saved || false);
  const [likesCount, setLikesCount] = useState(post?.likes_count || 0);
  const [showMenu, setShowMenu] = useState(false);
  const [isPinned, setIsPinned] = useState(post?.is_pinned || false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [shareSearch, setShareSearch] = useState("");



  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareTargets, setShareTargets] = useState([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const shareMenuRef = useRef(null);
  const menuRef = useRef(null);

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

  // Close menus on clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setShowMenu(false);
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target)) setShowShareMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          setShareTargets(data); // Expects an array of: { id, name, avatar, isGroup }
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
      const res = await fetch(`http://localhost:8000/api/posts/${post.id}/like/`, {
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
    setShowMenu(false);


    if (actionType === 'delete') {
      setShowDeleteConfirm(true);
      return;
    }

    if (actionType === 'pin') setIsPinned(prev => !prev);
    if (actionType === 'save') setIsSaved(prev => !prev);

    try {
      const res = await fetch(`http://localhost:8000/api/posts/${post.id}/${actionType}/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok && actionType === 'pin') {

      } else if (!res.ok) {
        // Revert UI on failure
        if (actionType === 'pin') setIsPinned(prev => !prev);
        if (actionType === 'save') setIsSaved(prev => !prev);
      }
    } catch (err) {
      console.error(`Failed to ${actionType} post`);
    }
  };
  const confirmDelete = async () => {
    const token = localStorage.getItem("access");
    try {
      const res = await fetch(`http://localhost:8000/api/posts/${post.id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        // Handle post removal from UI (e.g., refresh page or filter state)
        window.location.reload();
      }
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
          post_id: post.id,
          content: `Shared a post`,
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
        // Clicking the dark overlay now triggers cancel (closes the modal)
        <div className={styles.modalOverlay} onClick={() => setShowDeleteConfirm(false)}>
          {/* stopPropagation prevents clicking inside the white box from closing it */}
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Delete Post?</h3>
            <p className={styles.modalText}>This action cannot be undone.</p>

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
          <Link to={(post.author?.id || post.author_id) ? `/profile/${post.author?.id || post.author_id}` : "#"}>
            <img className={styles.avatar} src={post.author?.avatar || "/default-avatar.png"} alt="" />
          </Link>
          <div className={styles.userMeta}>
            <div className={styles.nameLine}>
              <span className={styles.name}>{post.author?.username || "User"}</span>
              {post.tag && <span className={styles.tag}>{post.tag}</span>}
            </div>
            <span className={styles.time}>{formatTimeAgo(post.created_at)}</span>
            {isPinned && (
              <img src={Pin} alt="pinned" width={14} height={14} className={styles.pinIcon} />
            )}
          </div>
        </div>

        <div className={styles.menuContainer} ref={menuRef}>
          <button className={styles.menuBtn} onClick={() => setShowMenu(prev => !prev)} aria-label="menu">
            <MoreHorizontal size={20} />
          </button>
          {showMenu && (
            <div className={styles.dropdownMenu}>

              {/* WHITE ACTIONS */}
              <div className={styles.menuSection}>
                {isOwnProfile && (
                  <button
                    className={styles.menuItem}
                    onClick={() => handleMenuAction('pin')}
                  >
                    <img
                      src={Pin}
                      width={16}
                      alt=""
                      className={styles.pinMenuIcon}
                    />
                    {isPinned ? "Unpin Post" : "Pin Post"}
                  </button>
                )}

                <button
                  className={styles.menuItem}
                  onClick={() => handleMenuAction('save')}
                >
                  <Bookmark size={16} fill={isSaved ? "currentColor" : "none"} />
                  {isSaved ? "Unsave" : "Save"}
                </button>
              </div>

              <div className={styles.menuDivider} />

              {/* RED ACTIONS */}
              <div className={styles.menuSection}>
                {isOwnProfile && (
                  <button
                    className={`${styles.menuItem} ${styles.danger}`}
                    onClick={() => handleMenuAction('delete')}
                  >
                    <Trash2 size={16} />
                    Delete Post
                  </button>
                )}

                <button
                  className={`${styles.menuItem} ${styles.danger}`}
                  onClick={() => handleMenuAction('report')}
                >
                  <Flag size={16} />
                  Report
                </button>

                <button
                  className={`${styles.menuItem} ${styles.danger}`}
                  onClick={() => handleMenuAction('block')}
                >
                  <Ban size={16} />
                  Block
                </button>
              </div>

            </div>
          )}
        </div>
      </div>

      {post.content && <p className={styles.text}>{post.content}</p>}

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

      <div className={`${styles.actions} flex flex-nowrap items-center justify-between gap-2`}>
        <div className={`${styles.leftActions} flex flex-nowrap items-center gap-2 flex-1 min-w-0 overflow-hidden`}
          style={{ width: "auto" }}>

          <button
            className={`${styles.iconBtn} flex-shrink-0 ${isLiked ? styles.liked : ""}`}
            onClick={handleLike}
            type="button"
          >
            <span className={styles.heart}>
              {isLiked
                ? <img src={LikeActive} alt="liked" className={styles.likeActive} width={22} height={22} />
                : <img src={Like} alt="like" className={styles.like} width={22} height={22} />
              }
            </span>
            {likesCount > 0 &&
              <span className={styles.count}>{likesCount}</span>
            }
          </button>

          {post.post_type === "advertisement" && (
            <>
              <span className={`${styles.prompt} hidden sm:inline`}>how do you feel about this ad?</span>
              <div className={styles.reactions}>
                <button className={styles.reactionBtn}>🙂</button>
                <button className={styles.reactionBtn}>😐</button>
                <button className={styles.reactionBtn}>🙁</button>
              </div>
            </>
          )}

          {post.post_type !== "advertisement" && (
            <div
              className={`${styles.commentInputPill} flex-1 min-w-0`}
              style={{ maxWidth: "200px", margin: "0 auto 0 auto" }}
              onClick={() => openComments(post)}
            >
              <span className={styles.placeholderText}>Add a comment ...</span>
            </div>
          )}
        </div>

        {/* ── Dynamic Share Popover UI Overlay ── */}
        <div className={styles.shareContainer} ref={shareMenuRef} style={{ position: 'relative' }}>
          <button
            className={`${styles.shareBtn} flex items-center gap-1.5 flex-shrink-0`}
            type="button"
            onClick={() => setShowShareMenu(!showShareMenu)}
          >
            <img src={Share} alt="share" width={18} height={18} className={styles.shareIcon} />
            <span className={styles.shareText}>Share</span>
          </button>

          {showShareMenu && createPortal(
            <div className={styles.shareOverlay} onClick={() => { setShowShareMenu(false); setShareSearch(""); }}>
              <div className={styles.shareModal} onClick={e => e.stopPropagation()} ref={shareMenuRef}>

                {/* Header */}
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

                {/* Search bar */}
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

                {/* Chat list */}
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
      </div>
    </article>
  );
}