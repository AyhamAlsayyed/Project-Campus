import styles from "./posts.module.css";
import { Share2 } from "lucide-react";

export default function PostCard({ post }) {

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
          {post.media.map((m, i) => {

            if (!m?.url) return null;

            if (m.type === "image") {
              return <img key={i} src={m.url} alt="" />;
            }

            if (m.type === "video") {
              return (
                <video key={i} controls>
                  <source src={m.url} />
                </video>
              );
            }

            return null;

          })}
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
