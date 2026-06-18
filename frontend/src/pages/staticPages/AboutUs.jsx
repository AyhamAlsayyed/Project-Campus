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

export default function AboutUs() {
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
