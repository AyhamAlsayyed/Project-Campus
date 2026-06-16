import { useState, useEffect } from "react";
import styles from "./weeklynews.module.css";
import { createPortal } from "react-dom";
import ArrowRight from '../../../Assets/icons/arrow-right.png'
import NeutralReview from '../../../Assets/icons/neutral-review.png'
export default function WeeklyNews({ communityId, useHighlights }) {
    const [items, setItems] = useState([]);
    const [idx, setIdx] = useState(0);
    const [news, setNews] = useState([]);
    const [showPopup, setShowPopup] = useState(false);
    const fetchNews = async () => {
        try {
            let url = "";
            if (communityId) {
                url = useHighlights
                    ? `http://localhost:8000/api/communities/${communityId}/highlights/`
                    : `http://localhost:8000/api/communities/${communityId}/news/`;
            } else {
                url = `http://localhost:8000/api/news/`;
            }

            const token = localStorage.getItem("access");
            const res = await fetch(url, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            const data = await res.json();
            setNews(data);
            setItems(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to load news");
        }
    };
    useEffect(() => {
        fetchNews();
    }, [communityId]);

    const next = () => {
        setIdx((prev) => (prev + 1) % items.length);
    };
    const current = items[Math.min(idx, items.length - 1)];
    const title = current?.title || "No Title";
    const description = current?.description || "No Description";
    const imageUrl = current?.image_url || "https://via.placeholder.com/400x200?text=No+Image";
    const start = current?.start_date || current?.startDate || "";
    const end = current?.end_date || current?.endDate || "";
    return (
        <div className={styles.container}>
            <div className={styles.newsWrap}>


                <div className={styles.pill}>{communityId ? "HIGHLIGHTS" : "WEEKLY NEWS"}</div>
                <div className={styles.card}>
                    {items.length === 0 ? (
                        <div className={styles.emptyState}>
                            <img src={NeutralReview} alt="No content" className={styles.emptyIcon} />
                            <p className={styles.emptyText}>
                                {communityId
                                    ? "No highlights have been added yet."
                                    : "No weekly news available right now."}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className={styles.banner}>
                                <img src={imageUrl} alt={title} className={styles.image} />
                                <div className={styles.bannerTint} />
                                <div className={styles.bannerText}>
                                    <div className={styles.bannerTitle}>{title}</div>
                                    <div className={styles.bannerDate}>Starting {start} - Ending {end}</div>
                                </div>
                                <button className={styles.bannerArrow} onClick={next} aria-label="Next">
                                    <img
                                        src={ArrowRight}
                                        alt="next"
                                        style={{
                                            width: 20,
                                            height: 20,
                                            filter: "brightness(0) invert(1)",
                                            display: "block"
                                        }}
                                    />
                                </button>
                            </div>

                            <div className={styles.descCard}>
                                <div className={styles.descLabel}>Description</div>
                                <div className={styles.descText}>{description}</div>
                                <button className={styles.readMore} onClick={() => setShowPopup(true)}>read more</button>
                            </div>

                            <div className={styles.dots}>
                                {items.map((_, i) => (
                                    <button
                                        key={i}
                                        className={`${styles.dot} ${i === idx ? styles.dotActive : ""}`}
                                        onClick={() => setIdx(i)}
                                        aria-label={`News ${i + 1}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
            {showPopup && createPortal(
                <div
                    style={{
                        position: "fixed", inset: 0, zIndex: 9999,
                        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(5px)",
                        display: "flex", alignItems: "center", justifyContent: "center"
                    }}
                    onClick={() => setShowPopup(false)}
                >
                    <div
                        style={{
                            background: "#1e1e1e", border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 20, padding: 32, width: "90%", maxWidth: 500,
                            position: "relative", boxShadow: "0 10px 40px rgba(0,0,0,0.5)"
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowPopup(false)}
                            style={{
                                position: "absolute", top: 16, right: 16,
                                background: "none", border: "none",
                                color: "rgba(255,255,255,0.5)", fontSize: 20, cursor: "pointer"
                            }}
                        >✕</button>
                        <h3 style={{ color: "#fff", fontSize: 24, fontWeight: 800, margin: "0 0 16px" }}>
                            {title}
                        </h3>
                        <p style={{
                            color: "rgba(255,255,255,0.85)", fontSize: 15,
                            lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word"
                        }}>
                            {description}
                        </p>
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}
