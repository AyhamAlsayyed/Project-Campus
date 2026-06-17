import styles from './communityCard.module.css'
import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { createPortal } from 'react-dom';
import Settings from '../../Assets/icons/setting.png';
import API from '../../config';
export default function CommunityCard({ community, variant = "large", setCommunities, fullWidth, isOwned, onSettingsClick }) {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const navigate = useNavigate();
    const handleReadMoreClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsPopupOpen(true);
    };
    const isLight = document.documentElement.getAttribute("data-theme") === "light";

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
                url = `${API}/api/communities/${community.id}/request/`;
            } else {
                url = `${API}/api/communities/${community.id}/join/`;
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
                className={`${styles.communityItem} ${variant === "small" ? styles.small : ""} ${fullWidth ? styles.fullWidth : ""}`}
                style={{ backgroundImage: `url(${community.image})` }}
            >
                <div className={styles.overlay} />
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
                    <div className={styles.right}>
                        <button
                            className={`${styles.actionBtn} ${community.is_joined || community.request_sent ? styles.viewBtn : styles.joinBtn} ${community.request_sent ? styles.requestedDisabled : ''}`}
                            disabled={community.is_requested}
                            onClick={() => !community.is_requested && handleAction(community)}
                        >
                            {community.is_joined ? "View" : community.request_sent ? "Requested" : "Join"}
                        </button>
                        {isOwned && (
                            <img
                                src={Settings}
                                alt="settings"
                                width={20}
                                height={20}
                                onClick={(e) => { e.stopPropagation(); onSettingsClick?.(community); }}
                                className={styles.settingsIcon}
                            />
                        )}
                    </div>

                </div>
            </div>


            {variant === "small" && community.sample_members?.length > 0 && (
                <div style={{ padding: '6px 4px 0' }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                        <span className={styles.joinedByLabel}>Joined by: </span>
                        {community.sample_members.map(f => f.username).join(', ')}
                        {community.members_count > community.sample_members.length
                            ? ` and ${community.members_count - community.sample_members.length} others.`
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
