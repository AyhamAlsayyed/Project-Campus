import styles from './eventsPage.module.css';
import Header from '../../components/pagelayout/header/header';
import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav';
import { useState } from 'react';

export default function EventsPage() {
    const [user, setUser] = useState(null);
    const [theme, setTheme] = useState("dark");
    const toggleTheme = () => setTheme(prev => prev === "light" ? "dark" : "light");

    const events = [
        {
            id: 1,
            orgName: "Palestine Technical University - Kadoorie",
            // Using a specific library/student photo to match your reference image
            avatar: "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?q=80&w=200&h=200&auto=format&fit=crop",
            banner: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop",
            isFollowed: true,
            startDate: "11/12/2025",
            endDate: "13/12/2025"
        },
        {
            id: 2,
            orgName: "TechnoPark - Palestine",
            avatar: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?q=80&w=200&h=200&auto=format&fit=crop",
            banner: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop",
            isFollowed: false,
            startDate: "07/12/2025 - 3:00 PM",
            endDate: "07/12/2025 - 6:00 PM"
        }
    ];
    const recommendedEvents = [
        {
            id: 1,
            orgName: "Juhoud",
            avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=100",
            banner: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=600",
            isFollowed: false,
        },
        {
            id: 2,
            orgName: "An-Najah National University",
            avatar: "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?auto=format&fit=crop&q=80&w=100",
            banner: "https://images.unsplash.com/photo-1541339907198-e08759dfc3ef?auto=format&fit=crop&q=80&w=600",
            isFollowed: false,
        },
        {
            id: 3,
            orgName: "Coffee Lab",
            avatar: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=100",
            banner: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=600",
            isFollowed: false,
        }
    ];

    return (
        <div className={styles.darkContainer}>
            <div className={`${styles.header} ${styles.page}`}>
                <Header theme={theme} toggleTheme={toggleTheme} user={user} />
            </div>
            <div className={`${styles.content} ${styles.page}`}>
                <SideBarNav />
                <div className={styles.mainContent}>
                    <h1 className={styles.title}>
                        Looking for - <br /> <span className={styles.highlight}>EVENTS</span> to participate in?
                    </h1>

                    <div className={styles.eventsContainer}>
                        {events.map((event) => (
                            <div key={event.id} className={styles.eventCard}>

                                <div className={styles.cardHeader}>
                                    <div className={styles.orgInfo}>
                                        <img src={event.avatar} alt="Logo" className={styles.avatar} />
                                        <div className={styles.orgText}>
                                            <div className={styles.orgNameRow}>
                                                <h3>{event.orgName}</h3>
                                                <span className={styles.verifyBadge}>✓</span>
                                            </div>
                                            <p>consectetuer adipiscing elit, sed diam nonummy nibh!</p>
                                        </div>
                                    </div>
                                    <div className={styles.headerActions}>
                                        <button className={styles.bellBtn}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                                        </button>
                                        <button className={event.isFollowed ? styles.followedBtn : styles.followBtn}>
                                            {event.isFollowed ? 'Followed' : 'Follow'}
                                        </button>
                                    </div>
                                </div>

                                {/* BOTTOM SECTION: Large Image with Overlays */}
                                <div className={styles.bannerContainer}>
                                    <img src={event.banner} className={styles.bannerImg} alt="Event Background" />

                                    {/* Date Widget (Top Right) */}
                                    <div className={styles.dateWidget}>
                                        <div className={styles.dateText}>
                                            <p>Starts {event.startDate}</p>
                                            <p>Ends - {event.endDate}</p>
                                        </div>
                                        <button className={styles.reminderBtn}>Set reminder</button>
                                    </div>

                                    {/* Text Overlay (Bottom) */}
                                    <div className={styles.bannerOverlay}>
                                        <div className={styles.bannerContent}>
                                            <h2>Lorem ipsum</h2>
                                            <p>Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet</p>
                                        </div>
                                        <span className={styles.readMore}>read more</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.rightSection}>
                    <div className={styles.pill}>RECOMMENDED</div>
                    <div className={styles.rightCard}>
                        <div className={styles.rightList}>
                            {recommendedEvents.map((rec, index) => (
                                <div key={rec.id} className={styles.recItemWrapper}>
                                    <div className={styles.recCard}>
                                        <img src={rec.banner} className={styles.recBanner} alt="" />
                                        <div className={styles.recOverlay}>
                                            {/* Header: Org Info + Follow */}
                                            <div className={styles.recHeader}>
                                                <div className={styles.recOrgInfo}>
                                                    <img src={rec.avatar} className={styles.recAvatar} alt="" />
                                                    <div className={styles.recOrgText}>
                                                        <div className={styles.recNameRow}>
                                                            <h4>{rec.orgName}</h4>
                                                            <span className={styles.verifyBadgeSmall}>✓</span>
                                                        </div>
                                                        <p>consectetuer adipiscing elit...</p>
                                                    </div>
                                                </div>
                                                <button className={rec.isFollowed ? styles.followedBtnSmall : styles.followBtnSmall}>
                                                    {rec.isFollowed ? 'Followed' : 'Follow'}
                                                </button>
                                            </div>

                                            {/* Body: Title + Read More */}
                                            <div className={styles.recBody}>
                                                <div>
                                                    <h5>Lorem ipsum</h5>
                                                    <p>Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh</p>
                                                </div>
                                                <span className={styles.readMoreSmall}>read more</span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Only show separator if it's not the last item */}
                                    {index !== recommendedEvents.length - 1 && <div className={styles.separator} />}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}