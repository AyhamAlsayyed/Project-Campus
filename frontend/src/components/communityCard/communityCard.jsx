import styles from './communityCard.module.css'
import { useState } from 'react';
import { useNavigate } from "react-router-dom";
export default function CommunityCard({ community, variant = "large", setCommunities }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const navigate = useNavigate();

    const handleToggle = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    }
    const handleAction = async () => {
        const token = localStorage.getItem("access");


        if (community.isJoined) {
            navigate(`/communities/${community.id}`);
            return;
        }

        try {
            let url = "";

            if (community.isPrivate) {
                url = `http://localhost:8000/api/communities/${community.id}/request/`;
            } else {
                url = `http://localhost:8000/api/communities/${community.id}/join/`;
            }

            const res = await fetch(url, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) return;

            // 🔥 UPDATE UI (IMPORTANT)
            setCommunities(prev =>
                prev.map(c =>
                    c.id === community.id
                        ? {
                            ...c,
                            isJoined: !c.isPrivate,
                            requestSent: c.isPrivate ? true : false
                        }
                        : c
                )
            );

        } catch (err) {
            console.error("Action failed");
        }
    };
    const descriptionText = community.description || "No description available.";
    const shouldTruncate = descriptionText.length > 80;
    const displayedText = (shouldTruncate && !isExpanded)
        ? `${descriptionText.substring(0, 80)}...`
        : descriptionText;
    return (
        <div
            className={`${styles.communityItem} ${variant === "small" ? styles.small : ""}`}
            style={{
                backgroundImage: `linear-gradient(to right, rgba(25, 25, 25, 0.95) 10%, rgba(25, 25, 25, 0.7) 40%, rgba(25, 25, 25, 0.2) 100%), url(${community.image})`
            }}
        >
            <div className={styles.content}>
                <div className={styles.left}>
                    <h3>
                        {community.name}
                        {community.isVerified && (
                            <svg className={styles.verifiedIcon} viewBox="0 0 24 24">
                                <path fill="#fff" d="M12 2l2.4 2.2 3.2-.8.9 3.2 2.9 1.7-1.4 3 1.4 3-2.9 1.7-.9 3.2-3.2-.8L12 22l-2.4-2.2-3.2.8-.9-3.2-2.9-1.7 1.4-3-1.4-3 2.9-1.7.9-3.2 3.2.8L12 2z" />
                                <path fill="#1a1a1a" d="M10.5 16.5l-4-4 1.4-1.4 2.6 2.6 6.6-6.6 1.4 1.4z" />
                            </svg>
                        )}
                    </h3>

                    <p className={`${styles.descriptionText} ${variant === "small" && !isExpanded ? styles.truncated : ""
                        }`}>
                        {displayedText}
                        {shouldTruncate && (
                            <span className={styles.readMore} onClick={handleToggle}>
                                {isExpanded ? " show less" : " read more"}
                            </span>
                        )}
                    </p>
                </div>

                <button
                    className={`${styles.actionBtn} ${community.isJoined ? styles.viewBtn : styles.joinBtn}`}
                    onClick={handleAction}
                    disabled={community.requestSent && !community.isJoined}
                >
                    {community.isJoined ? "View" : community.requestSent ? "Requested" : "Join"}
                </button>
            </div>
        </div>
    );
}
