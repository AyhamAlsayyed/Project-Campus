import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import MobileDrawer from '../../components/mobileDrawer/MobileDrawer';
import styles from './staticPages.module.css';
import Header from '../../components/pagelayout/header/header';
import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav';
import MobileHeader from '../../components/mobileHeader/mobileHeader';
import useTheme from '../../hooks/useTheme';
import API from '../../config';

const faqs = [
    { q: "How do I join a community?", a: "Go to the Communities page from the sidebar. Browse or search for a community, then click Join. Public communities are instant; private ones send a join request to the admin." },
    { q: "How do I follow a university or page?", a: "Visit the Universities or Pages section. Click on any card to open their profile, then press Follow. Their announcements and posts will appear in your feed." },
    { q: "How do I create a post?", a: "Click the post creation box at the top of your home feed. You can add text, images, videos, or run a poll. If you're a page or university, you can also create Announcements and promoted posts." },
    { q: "What are Subscriptions?", a: "Subscriptions unlock premium features on Campus. The Basic plan gives you access to promotion tools, event creation, and advanced community features. Manage your plan from the Subscriptions page." },
    { q: "How do promotions work?", a: "Pages and universities can promote posts, communities, or events to reach a wider audience. Choose a duration, complete checkout, and your promotion goes live immediately." },
    { q: "How do I change my password or email?", a: "Go to Settings → Account. From there you can update your email (a verification code will be sent) or change your password." },
    { q: "How do I delete my account?", a: "Go to Settings → Account and scroll to the danger zone. Account deletion is permanent and cannot be undone. All your posts, messages, and data will be removed." },
    { q: "Why are my notifications not working?", a: "Check Settings → Notifications to make sure notifications are enabled. You can also check your browser's site permission settings to allow notifications from Campus." },
    { q: "How do I report a bug or content issue?", a: "Use the Report option on any post (tap the ··· menu) or contact us directly via the support email below. We review all reports within 48 hours." },
];

function AccordionItem({ q, a }) {
    const [open, setOpen] = useState(false);
    return (
        <div className={styles.accordionItem}>
            <button className={styles.accordionHeader} onClick={() => setOpen(p => !p)}>
                {q}
                <ChevronDown size={16} className={`${styles.accordionChevron} ${open ? styles.open : ''}`} />
            </button>
            {open && <div className={styles.accordionBody}>{a}</div>}
        </div>
    );
}

export default function HelpPage() {
    const { theme, toggleTheme } = useTheme();
    const [user, setUser] = useState(null);
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
            <MobileDrawer isOpen={isMobile && mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} theme={theme} toggleTheme={toggleTheme} />
            {!isMobile && (
                <div className={`${styles.header} ${styles.page}`}>
                    <Header theme={theme} toggleTheme={toggleTheme} user={user} />
                </div>
            )}

            <div className={`${styles.content} ${styles.page}`}>
                {!isMobile && <SideBarNav />}
                <main className={styles.mainColumn}>
                    <h1 className={styles.pageTitle}><span className={styles.highlight}>Help</span> Center</h1>
                    <p className={styles.subtitle}>Find answers to common questions or get in touch with our team.</p>

                    <div className={styles.outerContainer}>
                        <div className={styles.innerContainer}>
                            <div className={styles.section}>
                                <p className={styles.sectionTitle}>Frequently Asked Questions</p>
                                <div className={styles.accordion}>
                                    {faqs.map((item, i) => (
                                        <AccordionItem key={i} q={item.q} a={item.a} />
                                    ))}
                                </div>
                            </div>

                            <div className={styles.section}>
                                <p className={styles.sectionTitle}>Still need help?</p>
                                <p className={styles.sectionText}>Can't find what you're looking for? Our support team is available and happy to help. You can also report bugs directly from any post using the ··· menu.</p>
                                <div className={styles.ctaRow}>
                                    <a href="mailto:support@projectcampus.app" className={styles.ctaBtn}>Contact Support</a>
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
