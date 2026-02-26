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
                            <span className={styles.name}>{post.author_name || "User"}</span>
                            {post.tag ? <span className={styles.tag}>{post.tag}</span> : null}
                        </div>
                        <span className={styles.time}>{post.created_at || ""}</span>
                    </div>
                </div>

                <button className={styles.menuBtn} aria-label="menu">
                    •••
                </button>
            </div>

          
            {post.content ? <p className={styles.text}>{post.content}</p> : null}

         
            {post.image ? (
                <div className={styles.media}>
                    <img src={post.image} alt="" />
                 
                </div>
            ) : null}

          
            <div className={styles.actions}>
                <div className={styles.leftActions}>
                    <button className={styles.iconBtn} type="button">
                        <span className={styles.heart}>♥</span>
                        <span className={styles.count}>{post.likes_count ?? 0}</span>
                    </button>
                    {post.type == "ad" && (
                        <><span className={styles.prompt}>how do you feel about this ad?</span><div className={styles.reactions}>
                            <button className={styles.reactionBtn} type="button" aria-label="reaction">🙂</button>
                            <button className={styles.reactionBtn} type="button" aria-label="reaction">😐</button>
                            <button className={styles.reactionBtn} type="button" aria-label="reaction">🙁</button>
                        </div></>
                    )}
                    {post.type == "post" && (
                         <input className={styles.searchInput} type="text" placeholder="Add a comment..." />
                    )}


                </div>

                <button className={styles.shareBtn} type="button">
                    <Share2 /> Share
                </button>
            </div>
        </article>
    );
}