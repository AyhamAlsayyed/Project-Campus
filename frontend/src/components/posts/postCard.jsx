import styles from "./posts.module.css";

import { useState } from "react";
import { Share2, MoreHorizontal, Bookmark, Ban, Flag } from "lucide-react";
export default function PostCard({ post }) {
  const [current, setCurrent] = useState(0);
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [showMenu, setShowMenu] = useState(false);
  const handleLike = async () => {
    const token = localStorage.getItem("access");
    if (!token) return;


    const originalLiked = isLiked;
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

      if (!res.ok) {

        setIsLiked(originalLiked);
        setLikesCount(prev => (originalLiked ? prev + 1 : prev - 1));
      }
    } catch (err) {

      setIsLiked(originalLiked);
    }
  };
  const handleMenuAction = async (actionType) => {
    const token = localStorage.getItem("access");
    setShowMenu(false);

    try {
      const res = await fetch(`http://localhost:8000/api/posts/${post.id}/${actionType}/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        alert(`Post ${actionType}ed successfully!`);

      }
    } catch (err) {
      console.error(`Failed to ${actionType} post`);
    }
  };
  const toggleMenu = () => {
    setShowMenu(prev => !prev);
  }

  const validMedia = post.media?.filter(
    (item) => item?.url && item?.type
  ) || [];
  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % validMedia.length);
  }
  const prevSlide = () => {
    setCurrent((prev) => (prev == 0 ? validMedia.length - 1 : prev - 1));
  }


  return (
    <article className={styles.card}>

      <div className={styles.topRow}>
        <div className={styles.user}>
          <img
            className={styles.avatar}
            src={post.author_avatar || "/default-avatar.png"}
            alt=""
          />

          <div className={styles.userMeta}>
            <div className={styles.nameLine}>
              <span className={styles.name}>
                {post.author_username || "User"}
              </span>

              {post.tag && (
                <span className={styles.tag}>{post.tag}</span>
              )}
            </div>

            <span className={styles.time}>
              {post.created_at || ""}
            </span>
          </div>
        </div>


        <div className={styles.menuContainer}>
          <button className={styles.menuBtn} onClick={toggleMenu} aria-label="menu">
            <MoreHorizontal size={20} />
          </button>

          {/* This only shows when showMenu is true */}
          {showMenu && (
            <div className={styles.dropdownMenu}>
              <button className={styles.menuItem}><Bookmark size={16} onClick={() => handleMenuAction('save')} /> Save</button>
              <div className={styles.menuDivider} />
              <button className={`${styles.menuItem} ${styles.danger}`} onClick={() => handleMenuAction('block')}><Ban size={16} /> Block</button>
              <div className={styles.menuDivider} />
              <button className={`${styles.menuItem} ${styles.danger}`} onClick={() => handleMenuAction('report')}><Flag size={16} /> Report</button>
            </div>
          )}
        </div>
      </div>


      {post.content && (
        <p className={styles.text}>{post.content}</p>
      )}


      {validMedia.length > 0 && (
        <div className={styles.media}>

          {validMedia.length > 1 && (
            <button
              className={styles.leftArrow}
              onClick={prevSlide}
            >
              ◀
            </button>
          )}

          {validMedia[current]?.type === "image" && (
            <img
              src={validMedia[current].url}
              alt=""
              className={styles.mediaItem}
            />
          )}

          {validMedia[current]?.type === "video" && (
            <video controls className={styles.mediaItem}>
              <source src={validMedia[current].url} />
            </video>
          )}

          {validMedia.length > 1 && (
            <button
              className={styles.rightArrow}
              onClick={nextSlide}
            >
              ▶
            </button>
          )}
          {validMedia.length > 1 && (
            <div className={styles.dots}>
              {validMedia.map((_, index) => (
                <span
                  key={index}
                  className={`${styles.dot} ${index === current ? styles.activeDot : ""
                    }`}
                />
              ))}
            </div>
          )}

        </div>
      )}
      {post.poll_options && post.poll_options.length > 0 && (
        <div className={styles.pollBox}>
          {post.poll_options.map((opt, i) => (
            <button key={i} className={styles.pollOption}>
              {opt}
            </button>
          ))}
        </div>
      )}


      <div className={styles.actions}>
        <div className={styles.leftActions}>
          <button
            className={`${styles.iconBtn} ${isLiked ? styles.liked : ""}`}
            onClick={handleLike}
            type="button"
          >
            <span className={styles.heart}>{isLiked ? "♥" : "♡"}</span>
            <span className={styles.count}>{likesCount}</span>
          </button>

          {post.post_type === "advertisement" && (
            <>
              <span className={styles.prompt}>
                how do you feel about this ad?
              </span>

              <div className={styles.reactions}>
                <button className={styles.reactionBtn}>🙂</button>
                <button className={styles.reactionBtn}>😐</button>
                <button className={styles.reactionBtn}>🙁</button>
              </div>
            </>
          )}

          {post.post_type !== "advertisement" && (
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Add a comment..."
            />
          )}

        </div>

        <button className={styles.shareBtn} type="button">
          <Share2 /> Share
        </button>
      </div>

    </article>
  );
}
