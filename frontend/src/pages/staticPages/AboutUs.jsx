import { useState, useEffect } from 'react';
import styles from './staticPages.module.css';
import Header from '../../components/pagelayout/header/header';
import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav';
import MobileHeader from '../../components/mobileHeader/mobileHeader';
import MobileDrawer from '../../components/mobileDrawer/MobileDrawer';
import useTheme from '../../hooks/useTheme';
import API from '../../config';
import { useUser } from '../../context/UserContext';

export default function AboutUs() {
    const { theme, toggleTheme } = useTheme();
    const { user, avatarSrc } = useUser();
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);
    useEffect(() => {
        document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileMenuOpen]);

    return (
        <div className={styles.darkContainer} data-theme={theme}>
            {isMobile && (
                <MobileHeader avatarSrc={avatarSrc} user={user} setMobileMenuOpen={setMobileMenuOpen} token={localStorage.getItem('access')} API={API} />
            )}
            <MobileDrawer isOpen={isMobile && mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} theme={theme} toggleTheme={toggleTheme} />
            {!isMobile && (
                <div className={`${styles.header} ${styles.page}`}>
                    <Header theme={theme} toggleTheme={toggleTheme} user={user} />
                </div>
            )}

            <div className={`${styles.content} ${styles.page}`}>
                {!isMobile && <SideBarNav />}
                <main className={styles.mainColumn}>
                    <h1 className={styles.pageTitle}>About <span className={styles.highlight}>Us</span></h1>
                    <p className={styles.subtitle}>Learn who we are, what we build, and why it matters.</p>

                    <div className={styles.outerContainer}>
                        <div className={styles.innerContainer}>
                            <div className={styles.section}>
                                <p className={styles.sectionTitle}>Our Mission</p>
                                <p className={styles.sectionText}>Campus is a platform built to connect university students, instructors, and communities in one place. We believe that meaningful academic and social connection shouldn't require jumping between a dozen apps.</p>
                                <p className={styles.sectionText}>Our goal is to give every student a space to discover events, join communities, follow pages from their university, and stay informed — all within a single, focused environment.</p>
                            </div>

                            <div className={styles.section}>
                                <p className={styles.sectionTitle}>What We Offer</p>
                                <ul className={styles.list}>
                                    <li className={styles.listItem}>Community spaces for academic clubs, study groups, and student organizations</li>
                                    <li className={styles.listItem}>University pages with announcements, news, and event listings</li>
                                    <li className={styles.listItem}>A social feed to share posts, media, and updates with your network</li>
                                    <li className={styles.listItem}>Real-time chat with friends and community members</li>
                                    <li className={styles.listItem}>Promotion tools for pages and universities to reach their audience</li>
                                    <li className={styles.listItem}>Subscriptions that unlock advanced features for power users</li>
                                </ul>
                            </div>

                            <div className={styles.section}>
                                <p className={styles.sectionTitle}>Our Values</p>
                                <ul className={styles.list}>
                                    <li className={styles.listItem}><strong>Privacy first</strong> — we don't sell your data or track you across the web</li>
                                    <li className={styles.listItem}><strong>Community-driven</strong> — features are shaped by how students actually use the platform</li>
                                    <li className={styles.listItem}><strong>Accessible</strong> — designed to work on any device, for any student</li>
                                    <li className={styles.listItem}><strong>Transparent</strong> — we're upfront about how the platform works and how decisions are made</li>
                                </ul>
                            </div>

                            <div className={styles.section}>
                                <p className={styles.sectionTitle}>Get in Touch</p>
                                <p className={styles.sectionText}>Have a question, a partnership idea, or just want to say hello? We'd love to hear from you.</p>
                                <div className={styles.ctaRow}>
                                    <a href="mailto:support@projectcampus.app" className={styles.ctaBtn}>Contact Us</a>
                                    <span className={styles.ctaSecondary}>support@projectcampus.app</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
