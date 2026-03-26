import styles from './communityCard.module.css'
import { useState } from 'react';

export default function CommunityCard({ community, variant = "large" }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const handleToggle =(e) =>{
        e.preventDefault()
        setIsExpanded(!isExpanded)
    }
    return (
        <div
            className={`${styles.communityItem} ${variant === "small" ? styles.small : ""
                }`}
            style={{ backgroundImage: `url(${community.image})` }}
        >
            <div className={styles.overlay} />

            <div className={styles.content}>
                <div className={styles.left}>
                    <h3>
                        {community.name}
                        {community.isVerified && (
                            <span className={styles.verified}>✔</span>
                        )}
                    </h3>
                    <div className={styles.description}>
                       <p className={!isExpanded ? styles.description : styles.fullText}>
                        {community.description}
                         <span className={styles.readMore} onClick={handleToggle}>
                        {isExpanded ? "show less" : "read more"}
                    </span>
                    </p>


                    </div>


                </div>

                <button
                    className={`${styles.btn} ${community.isJoined ? styles.view : styles.join
                        }`}
                >
                    {community.isJoined ? "View" : "Join"}
                </button>
            </div>
        </div>
    );
}
