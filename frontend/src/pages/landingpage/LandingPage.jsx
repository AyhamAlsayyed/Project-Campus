import styles from './LandingPage.module.css';
import ThemeToggle from '../../components/pagelayout/themeToggle'
import LanguageDropDown from '../../components/pagelayout/languageDrop';
import { TEXT } from '../../i18n';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useTheme from '../../hooks/useTheme';
import { X, ChevronDown, Copy, Check } from 'lucide-react';

// ── FAQ data ──────────────────────────────────────────────────────────────────
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

const EMAIL = 'support@projectcampus.app';

function ContactEmail({ isLight }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(EMAIL).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 12, padding: '10px 16px',
            width: 'fit-content',
        }}>
            <span style={{ color: isLight ? '#333' : 'rgba(255,255,255,0.75)', fontSize: '0.9rem' }}>
                {EMAIL}
            </span>
            <button
                onClick={copy}
                title={copied ? 'Copied!' : 'Copy email'}
                style={{
                    background: copied
                        ? 'linear-gradient(-90deg, rgba(166,39,156,0.9), rgba(49,32,169,0.9))'
                        : isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)',
                    border: 'none', borderRadius: 8,
                    padding: '5px 10px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 5,
                    color: copied ? '#fff' : isLight ? '#333' : 'rgba(255,255,255,0.7)',
                    fontSize: '0.8rem', fontWeight: 600,
                    transition: 'all 0.2s',
                    flexShrink: 0,
                }}
            >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copied!' : 'Copy'}
            </button>
        </div>
    );
}

function AccordionItem({ q, a, isLight }) {
    const [open, setOpen] = useState(false);
    return (
        <div style={{
            borderBottom: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
        }}>
            <button
                onClick={() => setOpen(p => !p)}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', gap: 12,
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '14px 0', textAlign: 'left',
                    color: isLight ? '#1a1a1a' : '#fff',
                    fontSize: '0.95rem', fontWeight: 500,
                }}
            >
                {q}
                <ChevronDown
                    size={16}
                    style={{
                        flexShrink: 0,
                        transition: 'transform 0.2s',
                        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                        color: isLight ? '#662D91' : 'rgba(255,255,255,0.5)',
                    }}
                />
            </button>
            {open && (
                <p style={{
                    margin: '0 0 14px', padding: '0',
                    color: isLight ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)',
                    fontSize: '0.88rem', lineHeight: 1.6,
                }}>
                    {a}
                </p>
            )}
        </div>
    );
}

function Modal({ open, onClose, title, children, isLight }) {
    useEffect(() => {
        if (!open) return;
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '24px',
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: isLight ? '#ffffff' : '#333333',
                    border: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 20,
                    width: '100%', maxWidth: 580,
                    maxHeight: '80vh',
                    display: 'flex', flexDirection: 'column',
                    boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '20px 24px',
                    borderBottom: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                    flexShrink: 0,
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: isLight ? '#1a1a1a' : '#fff' }}>
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
                            border: 'none', borderRadius: '50%',
                            width: 34, height: 34, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: isLight ? '#333' : '#ccc',
                            flexShrink: 0,
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Scrollable body */}
                <div style={{
                    overflowY: 'auto', padding: '20px 24px', flex: 1,
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(255,255,255,0.15) transparent',
                }}>
                    {children}
                </div>
            </div>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function LandingPage() {
    const [currentIndex] = useState(() => Math.floor(Math.random() * (TEXT['en'].landing.slides?.length || 4)));
    const [language, setLanguage] = useState('en');
    const t = (TEXT[language] || TEXT.en).landing;
    const slides = t.slides || [];
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

    const [showAbout, setShowAbout] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    const isLight = theme === 'light';

    useEffect(() => {
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    }, [language]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const currentSlide = slides[currentIndex];

    const sectionTitle = (text) => (
        <p style={{
            fontSize: '1rem', fontWeight: 700, margin: '0 0 10px',
            color: isLight ? '#662D91' : 'rgba(166,39,156,0.9)',
            textTransform: 'uppercase', letterSpacing: '0.04em',
        }}>{text}</p>
    );

    const sectionText = (text) => (
        <p style={{ margin: '0 0 10px', color: isLight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: 1.65 }}>{text}</p>
    );

    const listItem = (text) => (
        <li style={{ color: isLight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: 1.65, marginBottom: 6 }}>{text}</li>
    );

    const divider = <div style={{ height: 1, background: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)', margin: '20px 0' }} />;

    return (
        <div className={`${theme === 'dark' ? styles.darkContainer : styles.lightContainer} max-lg:!px-6 max-lg:!overflow-auto max-lg:!max-h-none`}>

            {/* HEADER */}
            <div className={`${styles.headerSection} max-lg:!flex-col max-lg:!items-start max-lg:!gap-3`}>
                <div className={`${styles.leftHeader} !flex-wrap !gap-x-4 !gap-y-2`}>
                    <p className={styles.headerText}>{t.seeColleges}</p>
                    <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                </div>

                <div className={`${styles.headerRight} max-lg:!gap-4`}>
                    <button className={`hidden lg:block ${styles.navLink}`} onClick={() => setShowHelp(true)}>{t.qAndA}</button>
                    <button className={`hidden lg:block ${styles.navLink}`} onClick={() => setShowAbout(true)}>{t.about}</button>
                    <button className={`${styles.contactUs} max-lg:!text-base max-lg:!py-2 max-lg:!px-5`} onClick={() => setShowHelp(true)}>
                        {t.contactUs}
                    </button>
                </div>
            </div>

            {/* BODY */}
            <div className={`${styles.bodySection} max-lg:!mt-6`}>
                <div className={`${styles.firstHalf} !w-full lg:!w-1/2`}>
                    <p className={`${styles.bodyFirstTitle} max-lg:!text-3xl`}>{t.project}</p>
                    <p className={`${styles.bodySecondTitle} max-lg:!text-[clamp(2.5rem,11vw,4rem)] max-lg:!tracking-normal`}>
                        {t.campus}
                    </p>
                    <p key={currentIndex} className={`${styles.bodyDescription} ${styles.fade} max-lg:!text-lg`}>
                        {currentSlide.description}
                    </p>
                </div>

                <div className={`${styles.secondHalf} !hidden lg:!flex`}>
                    <img
                        key={currentIndex}
                        src={currentSlide.image}
                        alt="Slide"
                        className={styles.slideImage}
                    />
                </div>
            </div>

            <div className={`${styles.bottomSection} max-lg:!w-[calc(100%+48px)] max-lg:!ml-[-24px] max-lg:!mr-[-24px] max-lg:!h-auto max-lg:!min-h-[140px] max-lg:!mt-6`}>
                <div className={`${styles.bottomContent} max-lg:!px-6 max-lg:!py-6 max-lg:!flex-col max-lg:!items-start max-lg:!gap-3`}>
                    <button
                        className={`${styles.getStarted} max-lg:!w-auto max-lg:!text-xl max-lg:!px-6 max-lg:!py-4`}
                        onClick={() => navigate('/signup')}
                        style={{ fontWeight: '1000' }}
                    >
                        {t.getStarted}
                    </button>
                </div>
                <span className={`${styles.copyright} max-lg:!w-auto max-lg:!self-end max-lg:!pb-4 max-lg:!pr-6 max-lg:!text-xs max-lg:!mb-0`}>
                    Campus, Inc @ 2026. All rights reserved.
                </span>
            </div>

            {/* ── ABOUT MODAL ── */}
            <Modal open={showAbout} onClose={() => setShowAbout(false)} title="About Us" isLight={isLight}>
                {sectionTitle('Our Mission')}
                {sectionText("Campus is a platform built to connect university students, instructors, and communities in one place. We believe that meaningful academic and social connection shouldn't require jumping between a dozen apps.")}
                {sectionText("Our goal is to give every student a space to discover events, join communities, follow pages from their university, and stay informed — all within a single, focused environment.")}
                {divider}
                {sectionTitle('What We Offer')}
                <ul style={{ paddingLeft: 20, margin: '0 0 10px' }}>
                    {listItem('Community spaces for academic clubs, study groups, and student organizations')}
                    {listItem('University pages with announcements, news, and event listings')}
                    {listItem('A social feed to share posts, media, and updates with your network')}
                    {listItem('Real-time chat with friends and community members')}
                    {listItem('Promotion tools for pages and universities to reach their audience')}
                    {listItem('Subscriptions that unlock advanced features for power users')}
                </ul>
                {divider}
                {sectionTitle('Our Values')}
                <ul style={{ paddingLeft: 20, margin: '0 0 10px' }}>
                    {listItem(<><strong>Privacy first</strong> — we don't sell your data or track you across the web</>)}
                    {listItem(<><strong>Community-driven</strong> — features are shaped by how students actually use the platform</>)}
                    {listItem(<><strong>Accessible</strong> — designed to work on any device, for any student</>)}
                    {listItem(<><strong>Transparent</strong> — we're upfront about how the platform works and how decisions are made</>)}
                </ul>
                {divider}
                {sectionTitle('Get in Touch')}
                {sectionText("Have a question, a partnership idea, or just want to say hello? We'd love to hear from you.")}
                <ContactEmail isLight={isLight} />
            </Modal>

            {/* ── HELP MODAL ── */}
            <Modal open={showHelp} onClose={() => setShowHelp(false)} title="Help Center" isLight={isLight}>
                {sectionTitle('Frequently Asked Questions')}
                <div style={{ marginBottom: 8 }}>
                    {faqs.map((item, i) => (
                        <AccordionItem key={i} q={item.q} a={item.a} isLight={isLight} />
                    ))}
                </div>
                {divider}
                {sectionTitle('Still need help?')}
                {sectionText("Can't find what you're looking for? Our support team is available and happy to help.")}
                <a
                    href="mailto:support@projectcampus.app"
                    style={{
                        display: 'inline-block',
                        background: 'linear-gradient(-90deg, rgba(166,39,156,0.9), rgba(49,32,169,0.9))',
                        color: '#fff', textDecoration: 'none',
                        padding: '10px 22px', borderRadius: 20,
                        fontSize: '0.9rem', fontWeight: 600,
                    }}
                >
                    Contact Support
                </a>
            </Modal>
        </div>
    );
}
