import { useState, useEffect } from 'react';
import styles from './staticPages.module.css';
import Header from '../../components/pagelayout/header/header';
import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav';
import MobileHeader from '../../components/mobileHeader/mobileHeader';
import MobileDrawer from '../../components/mobileDrawer/MobileDrawer';
import useTheme from '../../hooks/useTheme';
import API from '../../config';
import { useUser } from '../../context/UserContext';

export default function PrivacyPolicy() {
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
                    <h1 className={styles.pageTitle}>Privacy <span className={styles.highlight}>Policy</span></h1>
                    <p className={styles.subtitle}>Last updated: June 2026</p>

                    <div className={styles.outerContainer}>
                        <div className={styles.innerContainer}>
                            <div className={styles.section}>
                                <p className={styles.sectionTitle}>Introduction</p>
                                <p className={styles.sectionText}>Campus ("we", "our", or "us") is committed to protecting your personal information. This Privacy Policy explains what data we collect, how we use it, and the choices you have. By using Campus, you agree to the practices described here.</p>
                            </div>

                            <div className={styles.section}>
                                <p className={styles.sectionTitle}>Information We Collect</p>
                                <ul className={styles.list}>
                                    <li className={styles.listItem}><strong>Account data</strong> — your name, email address, username, and password when you register</li>
                                    <li className={styles.listItem}><strong>Profile data</strong> — profile picture, bio, university affiliation, and any optional details you add</li>
                                    <li className={styles.listItem}><strong>Content</strong> — posts, comments, media, and messages you create on the platform</li>
                                    <li className={styles.listItem}><strong>Usage data</strong> — pages visited, features used, and interactions within the app</li>
                                    <li className={styles.listItem}><strong>Device data</strong> — browser type, operating system, and IP address for security purposes</li>
                                </ul>
                            </div>

                            <div className={styles.section}>
                                <p className={styles.sectionTitle}>How We Use Your Data</p>
                                <ul className={styles.list}>
                                    <li className={styles.listItem}>To operate and improve the Campus platform</li>
                                    <li className={styles.listItem}>To personalize your feed, recommendations, and notifications</li>
                                    <li className={styles.listItem}>To process subscription payments and promotion checkouts</li>
                                    <li className={styles.listItem}>To send you security alerts and important account updates</li>
                                    <li className={styles.listItem}>To enforce our Terms of Service and community guidelines</li>
                                </ul>
                            </div>

                            <div className={styles.section}>
                                <p className={styles.sectionTitle}>Data Sharing</p>
                                <p className={styles.sectionText}>We do not sell your personal data to third parties. We may share limited data with trusted service providers (e.g. payment processors) only as necessary to deliver our services. All third-party providers are bound by confidentiality agreements.</p>
                            </div>

                            <div className={styles.section}>
                                <p className={styles.sectionTitle}>Your Rights</p>
                                <ul className={styles.list}>
                                    <li className={styles.listItem}>Access and download a copy of your data at any time via Settings</li>
                                    <li className={styles.listItem}>Correct inaccurate profile information</li>
                                    <li className={styles.listItem}>Delete your account and associated data</li>
                                    <li className={styles.listItem}>Opt out of non-essential communications in Notification Settings</li>
                                </ul>
                            </div>

                            <div className={styles.section}>
                                <p className={styles.sectionTitle}>Contact</p>
                                <p className={styles.sectionText}>If you have any questions about this policy or your data, please reach out to us.</p>
                                <div className={styles.ctaRow}>
                                    <a href="mailto:privacy@projectcampus.app" className={styles.ctaBtn}>Email Privacy Team</a>
                                    <span className={styles.ctaSecondary}>privacy@projectcampus.app</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
