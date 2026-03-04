import { useState, useEffect } from "react";
import styles from "./weeklynews.module.css";

export default function WeeklyNews() {
    const [items, setItems] = useState([]);
    const [idx, setIdx] = useState(0);
    useEffect(() => {
        setItems([
            {
                title: "Palestinian Medical Institution",
                description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed diam nonummy nibh",
                image_url: "https://images.unsplash.com/photo-1581093588401-22b42b7f5f13",
                start_date: "12/12/2025",
                end_date: "01/01/2026"
            },
            {
                title: "Engineering Career Fair",
                description: "Meet top companies and explore internship opportunities.",
                image_url: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d",
                start_date: "02/02/2026",
                end_date: "05/02/2026"
            },
           
        ]);
    }, [])
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