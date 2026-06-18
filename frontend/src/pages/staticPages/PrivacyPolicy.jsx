import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './staticPages.module.css';
import Header from '../../components/pagelayout/header/header';
import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav';
import MobileHeader from '../../components/mobileHeader/mobileHeader';
import darkModeIcon from '../../Assets/Pictures/LogoDarkMode.png';
import { X as XIcon } from 'lucide-react';
import useTheme from '../../hooks/useTheme';
import API from '../../config';

export default function PrivacyPolicy() {
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const mobileMenuRef = useRef(null);

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
    useEffect(() => {
        const token = localStorage.getItem('access');
        if (!token) return;
        fetch(`${API}/api/auth/me/`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : null).then(d => { if (d) setUser(d); });
    }, []);

    const avatarSrc = user?.profile?.avatar
        ? (user.profile.avatar.startsWith('http') ? user.profile.avatar : `${API}${user.profile.avatar}`)
        : null;

    return (
        <div className={styles.darkContainer} data-theme={theme}>
            {isMobile && (
                <MobileHeader avatarSrc={avatarSrc} user={user} setMobileMenuOpen={setMobileMenuOpen} token={localStorage.getItem('access')} API={API} />
            )}
            {isMobile && mobileMenuOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setMobileMenuOpen(false)} />
                    <div ref={mobileMenuRef} style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '75vw', maxWidth: 350, background: 'linear-gradient(315deg, var(--bg-main), var(--bg-secondary))', borderRight: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '4px 0 30px rgba(0,0,0,0.6)' }} onClick={e => e.stopPropagation()}>
                        <button style={{ position: 'absolute', top: 14, right: 14, zIndex: 10, width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => setMobileMenuOpen(false)}>
                            <XIcon size={16} color="white" />
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            <img src={darkModeIcon} alt="Logo" style={{ height: 40 }} />
                            <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.3rem', letterSpacing: 1, cursor: 'pointer' }} onClick={() => navigate('/home')}>CAMPUS</span>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto' }}><SideBarNav onClose={() => setMobileMenuOpen(false)} /></div>
                    </div>
                </div>
            )}
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
