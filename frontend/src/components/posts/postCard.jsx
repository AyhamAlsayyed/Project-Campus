import styles from "./posts.module.css";
import { Share2 } from "lucide-react";
import { useState } from "react";

export default function PostCard({ post }) {
  const [current, setCurrent] = useState(0);
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

        <button className={styles.menuBtn} aria-label="menu">
          •••
        </button>
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
