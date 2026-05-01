import { useState, useEffect } from "react";
import styles from "./weeklynews.module.css";

export default function WeeklyNews({ communityId }) {
    const [items, setItems] = useState([]);
    const [idx, setIdx] = useState(0);
    const [news, setNews] = useState([]);
 
    const fetchNews = async () => {
        try {
            let url = "";

            if (communityId) {
          
                url = `http://localhost:8000/api/communities/${communityId}/news/`;
            } else {
           
                url = `http://localhost:8000/api/news/`;
            }

            const res = await fetch(url);
            const data = await res.json();

            setNews(data);

        } catch (err) {
            console.error("Failed to load news");
        }
    };
    useEffect(() => {
        fetchNews();
    }, [communityId]);
    if (!items.length) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    Loading...

                </div>

            </div>
        )
    }
    const next = () => {
        setIdx((prev) => (prev + 1) % items.length);
    };
    const current = items[Math.min(idx, items.length - 1)];
    const title = current.title || "No Title";
    const description = current.description || "No Description";
    const imageUrl = current.image_url || "https://via.placeholder.com/400x200?text=No+Image";
    const start = current.start_date || current.startDate;
    const end = current.end_date || current.endDate;
    return (
        <div className={styles.container}>
            <div className={styles.newsWrap}>


                <div className={styles.pill}>WEEKLY NEWS</div>
                <div className={styles.card}>


                    <div className={styles.banner}>
                        <img src={imageUrl} alt={title} className={styles.image} />
                        <div className={styles.bannerTint} />
                        <div className={styles.bannerText}>
                            <div className={styles.bannerTitle}>{title}</div>
                            <div className={styles.bannerDate}>Starting {start} - Ending {end}</div>
                        </div>
                        <button className={styles.bannerArrow} onClick={next} aria-label="Next">
                            ❯
                        </button>

                    </div>
                    <div className={styles.descCard}>
                        <div className={styles.descLabel}>Description</div>
                        <div className={styles.descText}>{description}</div>
                        <button className={styles.readMore}>read more</button>
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
                </div>
            </div>
        </div>
    )
}
