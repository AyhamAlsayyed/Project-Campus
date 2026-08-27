import { useState, useEffect } from "react";
import styles from "./weeklynews.module.css";
import ArrowLeft from '../../../Assets/icons/arrow-left.png'
import ArrowRight from '../../../Assets/icons/arrow-right.png'
import NeutralReview from '../../../Assets/icons/neutral-review.png'
import API from "../../../config";
export default function WeeklyNews({ communityId, useHighlights, isMobile }) {
    const [items, setItems] = useState([]);
    const [idx, setIdx] = useState(0);
    const [news, setNews] = useState([]);
    const fetchNews = async () => {
        try {
            let url = "";
            if (communityId) {
                url = useHighlights
                    ? `${API}/api/communities/${communityId}/highlights/`
                    : `${API}/api/communities/${communityId}/news/`;
            } else {
                url = `${API}/api/news/`;
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
        setIdx(0);
        fetchNews();
    }, [communityId]);

    useEffect(() => {
        if (items.length <= 1) return;
        const timer = setInterval(() => {
            setIdx(prev => (prev + 1) % items.length);
        }, 60000);
        return () => clearInterval(timer);
    }, [items.length, communityId]);

    const prev = () => setIdx(p => (p - 1 + items.length) % items.length);
    const next = () => setIdx(prev => (prev + 1) % items.length);

    const handleArrowClick = () => {
        if (!current) return;

        // Weekly news: navigate to the link the backend sends
        if (!useHighlights) {
            const link = current.link;
            if (!link) return;
            if (link.startsWith('http')) {
                window.open(link, '_blank', 'noopener,noreferrer');
            } else {
                window.location.href = link;
            }
            return;
        }

        // Community highlights: scroll to the post in the feed
        const postId = current.post_id || current.id;
        if (!postId) return;
        const wrapper = document.getElementById(`post-${postId}`);
        if (!wrapper) return;
        const card = wrapper.firstElementChild || wrapper;
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.style.animation = 'none';
        card.getBoundingClientRect();
        card.style.animation = 'communityHighlightPulse 1.5s ease-out';
        setTimeout(() => { card.style.animation = ''; }, 1600);
    };

    const current = items[Math.min(idx, items.length - 1)];
    const title = current?.title || "";
    const description = current?.desc || current?.description || "";
    const imageUrl = current?.image_url || current?.media?.[0]?.url || current?.img || null;
    const endDate = current?.date || "";
    const statusMessage = current?.status_message || "";
    return (
        <div className={styles.container}>
            <div className={styles.newsWrap}>

                {!isMobile && (
                    <div className={styles.pill}>{communityId ? "HIGHLIGHTS" : "WEEKLY NEWS"}</div>
                )}
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
                                {imageUrl
                                    ? <img src={imageUrl} alt={title} className={styles.image} />
                                    : <div className={styles.imagePlaceholder} />
                                }
                                <div className={styles.bannerTint} />
                                <div className={styles.bannerText}>
                                    {title && <div className={styles.bannerTitle}>{title}</div>}
                                    <div className={styles.bannerDate}>
                                        {endDate ? `Ending ${endDate}` : ""}
                                        {statusMessage ? ` · ${statusMessage}` : ""}
                                    </div>
                                </div>
                                <button className={styles.bannerArrow} onClick={handleArrowClick} aria-label="View post">
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

                            {description && (
                                <div className={styles.descCard}>
                                    <div className={styles.descLabel}>Description</div>
                                    <div className={styles.descText}>{description}</div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {items.length > 1 && (
                    <div className={styles.paginationRow}>
                        <button className={styles.navArrow} onClick={prev} disabled={idx === 0}>
                            <img src={ArrowLeft} alt="prev" className={styles.navArrowImg} style={{ opacity: idx === 0 ? 0.3 : 1 }} />
                        </button>
                        <div className={styles.dots}>
                            {items.map((_, i) => (
                                <button
                                    key={i}
                                    className={`${styles.dot} ${i === idx ? styles.dotActive : ""}`}
                                    onClick={() => setIdx(i)}
                                    aria-label={`Highlight ${i + 1}`}
                                />
                            ))}
                        </div>
                        <button className={styles.navArrow} onClick={next} disabled={idx === items.length - 1}>
                            <img src={ArrowRight} alt="next" className={styles.navArrowImg} style={{ opacity: idx === items.length - 1 ? 0.3 : 1 }} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}