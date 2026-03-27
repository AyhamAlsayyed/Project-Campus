import styles from './communityCard.module.css'
import { useState } from 'react';
import { useNavigate } from "react-router-dom";
export default function CommunityCard({ community, variant = "large" ,setCommunities}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const handleToggle = (e) => {
        e.preventDefault()
        setIsExpanded(!isExpanded)
    }
    const navigate = useNavigate();
    const handleAction = async () => {
        const token = localStorage.getItem("access");

        // ✅ If already joined → go to page
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

                <button onClick={handleAction} disabled={community.requestSent}>
                    {community.isJoined
                        ? "View"
                        : community.isPrivate
                            ? (community.requestSent ? "Requested" : "Request to Join")
                            : "Join"}
                </button>
            </div>
        </div>
    );
}
