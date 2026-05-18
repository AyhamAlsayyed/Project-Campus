import styles from './communityCard.module.css'
import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { createPortal } from 'react-dom';
export default function CommunityCard({ community, variant = "large", setCommunities }) {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const navigate = useNavigate();
    const handleReadMoreClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsPopupOpen(true);
    };

    const closePopup = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsPopupOpen(false);
    };
    const handleAction = async () => {
        const token = localStorage.getItem("access");
        if (community.is_joined) {
            navigate(`/communities/${community.id}`);
            return;
        }

        try {
            let url = "";
            if (community.is_private) {
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
            setCommunities(prev =>
                prev.map(c =>
                    c.id === community.id
                        ? {
                            ...c,
                            is_joined: !c.is_private,
                            request_sent: c.is_private
                        }
                        : c
                )
            );

        } catch (err) {
            console.error("Action failed");
        }
    };
    const descriptionText = community.description || "No description available.";
    const maxLength = 55;
    const shouldTruncate = descriptionText.length > maxLength;
    const displayedText = shouldTruncate
        ? `${descriptionText.substring(0, maxLength)} `
        : descriptionText;
    return (
        <>
            <div
                className={`${styles.communityItem} ${variant === "small" ? styles.small : ""}`}
                style={{
                    backgroundImage: `linear-gradient(to right, rgba(25, 25, 25, 0.95) 10%, rgba(25, 25, 25, 0.7) 40%, rgba(25, 25, 25, 0.2) 100%), url(${community.image})`
                }}
            >
                <div className={styles.content}>
                    <div className={styles.left}>
                        <h3 className={styles.communityName}>
                            {community.name}
                            {community.is_verified && (
                                <svg className={styles.verifiedIcon} viewBox="0 0 24 24">
                                    <path fill="#fff" d="M12 2l2.4 2.2 3.2-.8.9 3.2 2.9 1.7-1.4 3 1.4 3-2.9 1.7-.9 3.2-3.2-.8L12 22l-2.4-2.2-3.2.8-.9-3.2-2.9-1.7 1.4-3-1.4-3 2.9-1.7.9-3.2 3.2.8L12 2z" />
                                    <path fill="#1a1a1a" d="M10.5 16.5l-4-4 1.4-1.4 2.6 2.6 6.6-6.6 1.4 1.4z" />
                                </svg>
                            )}
                        </h3>
                        <p className={`${styles.descriptionText} ${variant === "small" ? styles.truncated : ""}`}>
                            {displayedText}
                            {shouldTruncate && (
                                <span className={styles.readMore} onClick={handleReadMoreClick}>
                                    read more
                                </span>
                            )}
                        </p>
                    </div>
                    <button
                        className={`${styles.actionBtn} ${community.is_joined || community.request_sent ? styles.viewBtn : styles.joinBtn} ${community.request_sent ? styles.requestedDisabled : ''}`}
                        disabled={community.is_requested}
                        onClick={() => !community.is_requested && handleAction(community)}
                    >
                        {community.is_joined ? "View" : community.request_sent ? "Requested" : "Join"}
                    </button>
                </div>
            </div>


            {variant === "small" && community.friends_joined?.length > 0 && (
                <div style={{ padding: '6px 4px 0' }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                        <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Joined by: </span>
                        {community.friends_joined.map(f => f.username).join(', ')}
                        {community.friends_count > community.friends_joined.length
                            ? ` and ${community.friends_count - community.friends_joined.length} others.`
                            : '.'}
                    </span>
                </div>
            )}

            {isPopupOpen && createPortal(
                <div className={styles.popupOverlay} onClick={closePopup}>
                    <div className={styles.popupContent} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.closeBtn} onClick={closePopup}>✕</button>
                        <h3 className={styles.popupTitle}>{community.name}</h3>
                        <p className={styles.popupDescription}>{community.description}</p>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
