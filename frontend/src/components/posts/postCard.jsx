import styles from "./posts.module.css";
import { Share2 } from "lucide-react";
import { useState } from "react";

export default function PostCard({ post }) {
  const [current, setCurrent] = useState(0);
  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % post.media.length);
  }
  const prevSlide = () => {
    setCurrent((prev) => (prev == 0 ? post.media.length - 1 : prev - 1));
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

        <button className={styles.menuBtn} aria-label="menu">
          •••
        </button>
      </div>


      {post.content && (
        <p className={styles.text}>{post.content}</p>
      )}


      {post.media?.length > 0 && (
        <div className={styles.media}>

          {post.media.length > 1 && (
            <button
              className={styles.leftArrow}
              onClick={prevSlide}
            >
              ◀
            </button>
          )}

          {post.media[current]?.type === "image" && (
            <img
              src={post.media[current].url}
              alt=""
              className={styles.mediaItem}
            />
          )}

          {post.media[current]?.type === "video" && (
            <video controls className={styles.mediaItem}>
              <source src={post.media[current].url} />
            </video>
          )}

          {post.media.length > 1 && (
            <button
              className={styles.rightArrow}
              onClick={nextSlide}
            >
              ▶
            </button>
          )}

        </div>
      )}


      <div className={styles.actions}>
        <div className={styles.leftActions}>

          <button className={styles.iconBtn} type="button">
            <span className={styles.heart}>♥</span>
            <span className={styles.count}>
              {post.likes_count ?? 0}
            </span>
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
