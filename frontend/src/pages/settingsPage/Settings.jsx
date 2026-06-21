import styles from './Settings.module.css';
import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav';
import Header from '../../components/pagelayout/header/header';
import MobileHeader from '../../components/mobileHeader/mobileHeader';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Setting from '../../Assets/icons/setting.png';
import MobileDrawer from '../../components/mobileDrawer/MobileDrawer';
import useTheme from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import API from '../../config';
import { X as XIcon } from 'lucide-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';

const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('access')}`
});

// ── Custom Dropdown ──────────────────────────────────────────────────────────
const CustomSelect = ({ options, value, onChange, disabled, minWidth = '250px' }) => {

    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);
    const toggle = () => { if (!disabled) setIsOpen(o => !o); };
    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);
    return (
        <div className={styles.customDropdownContainer} ref={ref}>
            <div className={styles.customDropdownOuter}>
                <div className={`${styles.customDropdownValueBox} ${disabled ? styles.disabledElement : ''}`} style={{ minWidth }} onClick={toggle}>{value}</div>
                <div className={`${styles.customDropdownArrow} ${isOpen ? styles.customDropdownArrowOpen : ''} ${disabled ? styles.disabledElement : ''}`} onClick={toggle} />
            </div>
            {isOpen && !disabled && (
                <div className={styles.customDropdownMenu}>
                    {options.map((opt, i) => (
                        <div key={opt}>
                            <div className={styles.customDropdownOption} onClick={() => { onChange(opt); setIsOpen(false); }}>{opt}</div>
                            {i < options.length - 1 && <div className={styles.customDropdownDivider} />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => {
    useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
    return (
        <div style={{
            position: 'fixed', bottom: '28px', right: '28px', zIndex: 9999,
            background: type === 'error' ? '#D4145A' : '#2e7d32',
            color: '#fff', padding: '12px 20px', borderRadius: '10px',
            fontWeight: 600, fontSize: '0.9rem', boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
        }}>{message}</div>
    );
};

// ── Main Component ───────────────────────────────────────────────────────────
export default function Settings() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const { theme, toggleTheme } = useTheme();
    const { user: currentUser, avatarSrc } = useUser();
    const [appearanceTheme, setAppearanceTheme] = useState(theme);
    const [activeTab, _setActiveTab] = useState(
        searchParams.get('tab') || location.state?.tab || 'Account'
    );
    const setActiveTab = useCallback((tab) => {
        _setActiveTab(tab);
        setSearchParams(tab !== 'Account' ? { tab } : {}, { replace: true });
    }, [setSearchParams]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const token = localStorage.getItem("access");
    const [twoFAMethod, setTwoFAMethod] = useState('email');
    const [twoFAInput, setTwoFAInput] = useState('');
    const [twoFACode, setTwoFACode] = useState('');
    const [twoFAStep, setTwoFAStep] = useState(1);
    const [twoFAEnabled, setTwoFAEnabled] = useState(false);


    const showToast = useCallback((message, type = 'success') => setToast({ message, type }), []);

    // ── Notification state ───────────────────────────────────────────────────
    const [masterNotif, setMasterNotif] = useState(true);
    const [notifState, setNotifState] = useState({
        friend_request: true,
        someoneReacted: true, someoneCommented: true, someoneReplied: true,
        newPostCommunity: true, joinRequestStatus: true,
        eventStartingSoon: true, eventDaysBefore: '1 Day before',
        eventUpdatedCancelled: true, eventHasStarted: true,
        pageAnnouncement: true, dmExisting: true, dmRequest: true,
        courseGroupChat: true, passwordChangedSuccess: true, emailUpdatedSuccess: true
    });

    // ── Privacy state ────────────────────────────────────────────────────────
    const [accountPrivacy, setAccountPrivacy] = useState('Public');
    const [whoCanMessage, setWhoCanMessage] = useState('Everyone');
    const [whoCanSeeFriends, setWhoCanSeeFriends] = useState('Everyone');
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [blockedSearch, setBlockedSearch] = useState('');

    // ── Modal state ──────────────────────────────────────────────────────────
    const [activeModal, setActiveModal] = useState(null);
    const [newEmail, setNewEmail] = useState('');
    const [emailStep, setEmailStep] = useState(1);
    const [verificationCode, setVerificationCode] = useState('');
    const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
    const [passwordStrength, setPasswordStrength] = useState('');
    const [deactivatePassword, setDeactivatePassword] = useState('');
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deletePassword, setDeletePassword] = useState('');

    // ── Misc state ───────────────────────────────────────────────────────────
    const [contactForm, setContactForm] = useState({ subject: 'Technical Issue', message: '', screenshot: null });
    const [contactSubmitted, setContactSubmitted] = useState(false);
    const [bugForm, setBugForm] = useState({ subject: 'Bug Report', message: '', actionTrack: '', screenshot: null });
    const [bugSubmitted, setBugSubmitted] = useState(false);
    const [cacheSize, setCacheSize] = useState('...');
    const [showCacheConfirm, setShowCacheConfirm] = useState(false);
    const [autoplayMedia, setAutoplayMedia] = useState('Always');
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    // ── Fetch settings on tab change ─────────────────────────────────────────
    useEffect(() => {
        const fetchTabData = async () => {
            try {
                if (activeTab === 'Privacy') {
                    const res = await fetch(`${API}/api/settings/privacy/`, { headers: authHeaders() });
                    if (res.ok) {
                        const d = await res.json();
                        setAccountPrivacy(d.account_privacy === 'private' ? 'Private' : 'Public');
                        setWhoCanMessage(d.who_can_message || 'Everyone');
                        setWhoCanSeeFriends(d.who_can_see_friends || 'Everyone');
                    }
                }
                if (activeTab === 'Privacy') {
                    const res = await fetch(`${API}/api/settings/blocked/`, { headers: authHeaders() });
                    if (res.ok) {
                        const d = await res.json();
                        const list = Array.isArray(d) ? d : (d.results || []);
                        setBlockedUsers(list.map(u => ({
                            id: u.id,
                            username: u.username,
                            university: u.university || '',
                            pfp: u.avatar || u.profile_picture || '/default-avatar.png'
                        })));
                    }
                }
                if (activeTab === 'Notifications') {
                    const res = await fetch(`${API}/api/settings/notifications/`, { headers: authHeaders() });
                    if (res.ok) {
                        const d = await res.json();
                        setMasterNotif(d.master_enabled ?? true);
                        setNotifState(prev => ({ ...prev, ...d }));
                    }
                }
                if (activeTab === 'Appearance') {
                    const res = await fetch(`${API}/api/settings/appearance/`, { headers: authHeaders() });
                    if (res.ok) {
                        const d = await res.json();
                        if (d.theme) setAppearanceTheme(d.theme);
                    }
                }
                if (activeTab === 'Data & Storage') {
                    await estimateCacheSize();
                }
            } catch (err) { console.error(err); }
        };
        fetchTabData();
    }, [activeTab]);

    // ── Password strength ────────────────────────────────────────────────────
    useEffect(() => {
        if (!passwordForm.new) { setPasswordStrength(''); return; }
        if (passwordForm.new.length < 6) setPasswordStrength('Weak');
        else if (passwordForm.new.length < 10 || !/[A-Z]/.test(passwordForm.new) || !/[0-9]/.test(passwordForm.new)) setPasswordStrength('Medium');
        else setPasswordStrength('Strong');
    }, [passwordForm.new]);

    const handleNotificationChange = (key, value) => setNotifState(prev => ({ ...prev, [key]: value }));

    // ── Save helpers ─────────────────────────────────────────────────────────
    const savePrivacy = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/settings/privacy/`, {
                method: 'PATCH', headers: authHeaders(),
                body: JSON.stringify({
                    account_privacy: accountPrivacy.toLowerCase(),
                    who_can_message: whoCanMessage,
                    who_can_see_friends: whoCanSeeFriends
                })
            });
            if (res.ok) showToast('Privacy settings saved.');
            else showToast('Failed to save privacy settings.', 'error');
        } catch { showToast('Network error.', 'error'); }
        setLoading(false);
    };

    const saveNotifications = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/settings/notifications/`, {
                method: 'PATCH', headers: authHeaders(),
                body: JSON.stringify({ master_enabled: masterNotif, ...notifState })
            });
            if (res.ok) showToast('Notification preferences saved.');
            else showToast('Failed to save notifications.', 'error');
        } catch { showToast('Network error.', 'error'); }
        setLoading(false);
    };

    const saveAppearance = () => {
        document.documentElement.setAttribute('data-theme', appearanceTheme);
        localStorage.setItem('theme', appearanceTheme);
        showToast('Appearance saved.');
    };

    const saveStorage = async () => {
        localStorage.setItem('autoplay_media', autoplayMedia.toLowerCase());
        showToast('Storage preferences saved.');
    };

    const handleLogout = () => {
        // Fire backend logout in background — don't await it
        const refreshToken = localStorage.getItem('refresh');
        fetch(`${API}/api/auth/logout/`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ refresh: refreshToken })
        }).catch(() => {});

        window.dispatchEvent(new Event('auth:logout'));
        localStorage.clear();
        window.location.href = '/';
    };

    // ── Account modals ───────────────────────────────────────────────────────
    const handleSendEmailCode = async () => {
        if (!newEmail) return;
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/auth/send_code/`, {
                method: 'POST', headers: authHeaders(),
                body: JSON.stringify({
                    academicEmail: newEmail,
                    username: currentUser?.username,
                    academicLevel: currentUser?.profile?.academic_level,
                    major: currentUser?.profile?.major,
                    signup: false,
                })

            });
            if (res.ok) { setEmailStep(2); showToast('Verification code sent.'); }
            else { const d = await res.json(); showToast(d.detail || 'Failed to send code.', 'error'); }
        } catch { showToast('Network error.', 'error'); }
        setLoading(false);
    };

    const handleVerifyEmail = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/auth/verify_code/`, {
                method: 'POST', headers: authHeaders(),
                body: JSON.stringify({ email: newEmail, code: verificationCode })
            });
            if (res.ok) { showToast('Email updated successfully.'); setActiveModal(null); }
            else { const d = await res.json(); showToast(d.detail || 'Invalid code.', 'error'); }
        } catch { showToast('Network error.', 'error'); }
        setLoading(false);
    };

    const handleChangePassword = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/settings/password/`, {
                method: 'POST', headers: authHeaders(),
                body: JSON.stringify({ current_password: passwordForm.current, new_password: passwordForm.new })
            });
            if (res.ok) { showToast('Password changed successfully.'); setActiveModal(null); }
            else { const d = await res.json(); showToast(d.detail || 'Incorrect current password.', 'error'); }
        } catch { showToast('Network error.', 'error'); }
        setLoading(false);
    };

    const handleDeactivate = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/settings/deactivate/`, {
                method: 'POST', headers: authHeaders(),
                body: JSON.stringify({ password: deactivatePassword })
            });
            if (res.ok) {
                showToast('Account deactivated. Logging out...');
                setTimeout(() => { localStorage.clear(); window.location.href = '/'; }, 2000);
            } else { const d = await res.json(); showToast(d.detail || 'Incorrect password.', 'error'); }
        } catch { showToast('Network error.', 'error'); }
        setLoading(false);
    };

    const handleDeleteAccount = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/settings/delete/`, {
                method: 'DELETE', headers: authHeaders(),
                body: JSON.stringify({ password: deletePassword })
            });
            if (res.ok) {
                showToast('Account deletion initiated. Check your email.');
                setTimeout(() => { localStorage.clear(); window.location.href = '/'; }, 2500);
            } else { const d = await res.json(); showToast(d.detail || 'Incorrect password.', 'error'); }
        } catch { showToast('Network error.', 'error'); }
        setLoading(false);
    };

    const handleUnblock = async (userId) => {
        try {
            const res = await fetch(`${API}/api/users/${userId}/block/`, {
                method: 'POST', headers: authHeaders()
            });
            if (res.ok) {
                setBlockedUsers(prev => prev.filter(u => u.id !== userId));
                showToast('User unblocked.');
            } else showToast('Failed to unblock.', 'error');
        } catch { showToast('Network error.', 'error'); }
    };

    const estimateCacheSize = async () => {
        try {
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                const { usage } = await navigator.storage.estimate();
                const mb = (usage / (1024 * 1024)).toFixed(1);
                setCacheSize(`${mb} MB`);
            } else {
                let total = 0;
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    total += (localStorage.getItem(key) || '').length * 2;
                }
                setCacheSize(`${(total / (1024 * 1024)).toFixed(1)} MB`);
            }
        } catch { setCacheSize('Unknown'); }
    };

    const handleClearCache = async () => {
        const keysToKeep = ['access', 'refresh', 'login_user', 'user_type', 'theme'];
        const saved = {};
        keysToKeep.forEach(k => { const v = localStorage.getItem(k); if (v) saved[k] = v; });
        localStorage.clear();
        keysToKeep.forEach(k => { if (saved[k]) localStorage.setItem(k, saved[k]); });
        sessionStorage.clear();
        if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map(k => caches.delete(k)));
        }
        await estimateCacheSize();
        setShowCacheConfirm(false);
        showToast('Cache cleared successfully.');
    };

    const handleContactSubmit = async () => {
        setLoading(true);
        try {
            const form = new FormData();
            form.append('subject', contactForm.subject);
            form.append('message', contactForm.message);
            if (contactForm.screenshot) form.append('screenshot', contactForm.screenshot);
            const res = await fetch(`${API}/api/support/contact/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${localStorage.getItem('access')}` },
                body: form
            });
            if (res.ok) setContactSubmitted(true);
            else showToast('Failed to submit ticket.', 'error');
        } catch { showToast('Network error.', 'error'); }
        setLoading(false);
    };

    const handleBugSubmit = async () => {
        setLoading(true);
        try {
            const form = new FormData();
            form.append('message', bugForm.message);
            form.append('action_track', bugForm.actionTrack);
            if (bugForm.screenshot) form.append('screenshot', bugForm.screenshot);
            const res = await fetch(`${API}/api/support/bug/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${localStorage.getItem('access')}` },
                body: form
            });
            if (res.ok) setBugSubmitted(true);
            else showToast('Failed to submit bug report.', 'error');
        } catch { showToast('Network error.', 'error'); }
        setLoading(false);
    };


    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    useEffect(() => {
        document.body.style.overflow = (mobileMenuOpen || mobileNavOpen) ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileMenuOpen, mobileNavOpen]);



    const navItems = [
        { key: 'Account', label: 'Account' },
        { key: 'Privacy', label: 'Privacy' },
        { key: 'Notifications', label: 'Notifications' },
        { key: 'Appearance', label: 'Appearance' },
        { key: 'Security', label: 'Security' },
        { key: 'Help & Support', label: 'Help & Support' },
        { key: 'Data & Storage', label: 'Data & Storage' }
    ];

    const renderSolidIcon = (src, color, width = '20px', height = '20px') => (
        <div style={{
            width, height, backgroundColor: color,
            maskImage: `url(${src})`, WebkitMaskImage: `url(${src})`,
            maskSize: 'contain', WebkitMaskSize: 'contain',
            maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
            maskPosition: 'center', WebkitMaskPosition: 'center',
            display: 'inline-block'
        }} />
    );

    const SaveBar = ({ onSave }) => (
        <div style={{ position: 'absolute', top: '24px', right: '32px', zIndex: 10 }}>
            <button className={styles.primaryBtn} onClick={onSave} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
            </button>
        </div>
    );

    return (
        <div className={styles.darkContainer} data-theme={theme}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {showCacheConfirm && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }} onClick={() => setShowCacheConfirm(false)}>
                    <div style={{
                        background: '#2a2a2a', borderRadius: 20, padding: '32px 28px',
                        width: '90%', maxWidth: 400, border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ fontSize: '2rem', marginBottom: 12, textAlign: 'center' }}>🗑️</div>
                        <h3 style={{ color: '#fff', margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 700, textAlign: 'center' }}>
                            Clear Cache?
                        </h3>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', textAlign: 'center', margin: '0 0 24px', lineHeight: 1.5 }}>
                            This will clear locally cached media and data ({cacheSize}). Your account and settings will not be affected.
                        </p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <button onClick={() => setShowCacheConfirm(false)} style={{
                                background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 12,
                                color: 'rgba(255,255,255,0.7)', padding: '10px 24px', fontSize: '0.9rem',
                                fontWeight: 600, cursor: 'pointer',
                            }}>Cancel</button>
                            <button onClick={handleClearCache} style={{
                                background: 'linear-gradient(to right, #622598, #942892)', border: 'none',
                                borderRadius: 12, color: '#fff', padding: '10px 24px', fontSize: '0.9rem',
                                fontWeight: 600, cursor: 'pointer',
                            }}>Clear Cache</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Mobile Header ── */}
            {isMobile && (
                <MobileHeader
                    avatarSrc={avatarSrc}
                    user={currentUser}
                    setMobileMenuOpen={setMobileMenuOpen}
                    token={token}
                    API={API}
                    homeMode={true}
                />
            )}

            {/* ── Mobile side-drawer (hamburger) ── */}
            <MobileDrawer isOpen={isMobile && mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} theme={theme} toggleTheme={toggleTheme} variant="profile" currentUser={currentUser} />

            {/* ── Mobile settings-nav drawer ── */}
            {isMobile && mobileNavOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9997 }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }} onClick={() => setMobileNavOpen(false)} />
                    <div style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: '75vw', maxWidth: 300, background: theme === 'light' ? '#ffffff' : '#1e1e1e', borderLeft: `1px solid ${theme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`, display: 'flex', flexDirection: 'column', overflowY: 'auto', boxShadow: '-4px 0 30px rgba(0,0,0,0.3)', padding: '24px 20px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                            <span style={{ color: theme === 'light' ? '#1a1a1a' : '#fff', fontWeight: 700, fontSize: '1.2rem' }}>Settings</span>
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme === 'light' ? '#74419B' : 'white' }} onClick={() => setMobileNavOpen(false)}><XIcon size={18} /></button>
                        </div>
                        {navItems.map(item => {
                            const active = activeTab === item.key;
                            return (
                                <div key={item.key} onClick={() => { setActiveTab(item.key); setMobileNavOpen(false); }} style={{ padding: '14px 12px', borderRadius: 12, marginBottom: 4, background: active ? (theme === 'light' ? 'rgba(116,65,155,0.1)' : 'linear-gradient(90deg,rgba(134,37,160,0.25),rgba(160,39,157,0.1))') : 'transparent', borderLeft: active ? `3px solid ${theme === 'light' ? '#74419B' : '#A6279C'}` : '3px solid transparent', cursor: 'pointer', color: active ? (theme === 'light' ? '#74419B' : '#fff') : (theme === 'light' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)'), fontWeight: active ? 700 : 400, fontSize: '0.95rem' }}>
                                    {item.label}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Desktop Header ── */}
            {!isMobile && (
                <div className={`${styles.header} ${styles.page}`}>
                    <Header theme={theme} toggleTheme={toggleTheme} user={currentUser} />
                </div>
            )}

            <div className={`${styles.page} ${styles.content}`} style={isMobile ? { width: '100%', margin: 0, padding: '8px 10px 0', boxSizing: 'border-box', flexDirection: 'column' } : {}}>
                {!isMobile && <SideBarNav variant="profile" currentUser={currentUser} />}

                <div className={styles.settingsMainContainer} style={isMobile ? { minWidth: 0, width: '100%', margin: 0, borderRadius: '20px 20px 0 0' } : {}}>
                    <div className={styles.innerContainer}>
                        {/* Mobile: tab selector bar */}
                        {isMobile && (
                            <button onClick={() => setMobileNavOpen(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px', marginBottom: 24, cursor: 'pointer', color: '#fff', fontSize: '0.95rem', fontWeight: 600 }}>
                                <span>{activeTab}</span>
                                <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>▼</span>
                            </button>
                        )}
                        <h1 className={styles.sectionHeading}>{activeTab}</h1>

                        {/* SECTION 1: ACCOUNT */}

                        {activeTab === 'Account' && (
                            <div className={styles.settingsFormGroup}>
                                <div className={styles.settingRow}>
                                    <div>
                                        <label className={styles.settingLabel}>Email Address</label>
                                        <p className={styles.settingDescription}>
                                            {currentUser?.profile?.academic_email
                                                ? currentUser.profile.academic_email.replace(/(.{2})(.*)(@)/, '$1***$3')
                                                : '—'}
                                        </p>
                                    </div>
                                    <button className={styles.settingActionBtn} onClick={() => { setEmailStep(1); setNewEmail(''); setVerificationCode(''); setActiveModal('email'); }}>Update</button>
                                </div>
                                <div className={styles.settingRow}>
                                    <div>
                                        <label className={styles.settingLabel}>Password</label>
                                        <p className={styles.settingDescription}>••••••••••••</p>
                                    </div>
                                    <button className={styles.settingActionBtn} onClick={() => { setPasswordForm({ current: '', new: '', confirm: '' }); setActiveModal('password'); }}>Change</button>
                                </div>
                                <div className={styles.settingRow}>
                                    <div>
                                        <label className={styles.settingLabel}>Deactivate Account</label>
                                        <p className={styles.settingDescription}>Hide your account and pause all activity. Reactivate anytime within 30 days.</p>
                                    </div>
                                    <button className={styles.settingActionBtn} onClick={() => { setDeactivatePassword(''); setActiveModal('deactivate'); }}>Deactivate</button>
                                </div>

                                {/* Logout Row - Styled exactly like Delete Account */}
                                <div className={`${styles.settingRow} ${styles.destructiveRow}`}>
                                    <div>
                                        <label className={styles.settingLabelDestructive}>Logout</label>
                                        <p className={styles.settingDescription}>Log out of your account on this device and clear local session data.</p>
                                    </div>
                                    <button className={styles.deleteBtn} onClick={handleLogout}>
                                        Logout
                                    </button>
                                </div>

                                <div className={`${styles.settingRow} ${styles.destructiveRow}`}>
                                    <div>
                                        <label className={styles.settingLabelDestructive}>Delete Account</label>
                                        <p className={styles.settingDescription}>Permanently remove all posts, messages, and data. Irreversible.</p>
                                    </div>
                                    <button className={styles.deleteBtn} onClick={() => { setDeleteConfirmText(''); setDeletePassword(''); setActiveModal('delete'); }}>Delete</button>
                                </div>
                            </div>
                        )}

                        {/* SECTION 2: PRIVACY */}
                        {activeTab === 'Privacy' && (
                            <div className={styles.settingsFormGroup}>
                                <div className={styles.settingRowColumn}>
                                    <label className={styles.settingLabel}>Account Privacy</label>
                                    <div className={styles.segmentedSelector}>
                                        <button className={accountPrivacy === 'Public' ? styles.segmentedOptionActive : styles.segmentedOption} onClick={() => setAccountPrivacy('Public')}>Public</button>
                                        <button className={accountPrivacy === 'Private' ? styles.segmentedOptionActive : styles.segmentedOption} onClick={() => {
                                            setAccountPrivacy('Private');
                                            if (whoCanMessage === 'Everyone') setWhoCanMessage('Friends Only');
                                            if (whoCanSeeFriends === 'Everyone') setWhoCanSeeFriends('Friends Only');
                                        }}>Private</button>
                                    </div>
                                    <p className={styles.contextualNote}>
                                        {accountPrivacy === 'Public'
                                            ? 'Any registered Campus user can view your profile and posts.'
                                            : 'Only friends can see your full profile and posts.'}
                                    </p>
                                </div>
                                <div className={styles.settingRowColumn}>
                                    <label className={styles.settingLabel}>Who Can Message You</label>
                                    <CustomSelect
                                        options={accountPrivacy === 'Private' ? ['Friends Only', 'Nobody'] : ['Everyone', 'Friends Only', 'Nobody']}
                                        value={whoCanMessage}
                                        onChange={setWhoCanMessage}
                                    />
                                </div>
                                <div className={styles.settingRowColumn}>
                                    <label className={styles.settingLabel}>Who Can See Your Friends List</label>
                                    <CustomSelect
                                        options={accountPrivacy === 'Private' ? ['Friends Only', 'Only Me'] : ['Everyone', 'Friends Only', 'Only Me']}
                                        value={accountPrivacy === 'Private' && whoCanSeeFriends === 'Everyone' ? 'Friends Only' : whoCanSeeFriends}
                                        onChange={(val) => {
                                            if (accountPrivacy === 'Private' && val === 'Everyone') return;
                                            setWhoCanSeeFriends(val);
                                        }}
                                    />
                                </div>
                                <div className={styles.settingRow}>
                                    <div>
                                        <label className={styles.settingLabel}>Blocked Accounts</label>
                                        <p className={styles.settingDescription}>{blockedUsers.length} users currently blocked.</p>
                                    </div>
                                    <button className={styles.settingActionBtn} onClick={() => setActiveModal('blocked')}>Manage</button>
                                </div>
                                <SaveBar onSave={savePrivacy} />
                            </div>
                        )}

                        {/* SECTION 3: NOTIFICATIONS */}
                        {activeTab === 'Notifications' && (
                            <div className={styles.settingsFormGroup}>
                                <div className={styles.toggleRowMaster}>
                                    <div>
                                        <label className={styles.settingLabelMaster}>Enable All Notifications</label>
                                        <p className={styles.settingDescription}>Turns all notifications on or off at once.</p>
                                    </div>
                                    <label className={styles.switchContainer}>
                                        <input type="checkbox" checked={masterNotif} onChange={(e) => setMasterNotif(e.target.checked)} />
                                        <span className={styles.switchSlider}></span>
                                    </label>
                                </div>
                                <div className={styles.nestedNotificationGrid}>
                                    {[
                                        {
                                            header: 'Social', items: [
                                                ['friend_request', 'Friend request notifications'],
                                                ['someoneReacted', 'Someone reacted to your post'],
                                                ['someoneCommented', 'Someone commented on your post'],
                                                ['someoneReplied', 'Someone replied to your comment'],
                                            ]
                                        },
                                        {
                                            header: 'Communities', items: [
                                                ['newPostCommunity', 'New post in a community you follow'],
                                                ['joinRequestStatus', 'Your community join request was approved or rejected'],
                                            ]
                                        },
                                        {
                                            header: 'Announcements', items: [
                                                ['pageAnnouncement', 'New announcement from a Page you follow'],
                                            ]
                                        },
                                        {
                                            header: 'Messages', items: [
                                                ['dmExisting', 'New direct message (existing conversations)'],
                                                ['dmRequest', 'New message requests'],
                                                ['courseGroupChat', 'New message in a course group chat'],
                                            ]
                                        },
                                        {
                                            header: 'Account & Security', items: [
                                                ['passwordChangedSuccess', 'Password changed successfully'],
                                                ['emailUpdatedSuccess', 'Email address updated'],
                                            ]
                                        },
                                    ].map(({ header, items }) => (
                                        <div key={header}>
                                            <h3 className={styles.subGridHeader}>{header}</h3>
                                            {items.map(([key, label]) => (
                                                <div key={key} className={styles.toggleRow}>
                                                    <span className={styles.toggleText}>{label}</span>
                                                    <label className={styles.switchContainer}>
                                                        <input type="checkbox" disabled={!masterNotif} checked={masterNotif && notifState[key]} onChange={(e) => handleNotificationChange(key, e.target.checked)} />
                                                        <span className={styles.switchSlider}></span>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    ))}

                                    <h3 className={styles.subGridHeader}>Events</h3>

                                    {[
                                        ['eventUpdatedCancelled', 'An event you follow has been updated or cancelled'],
                                    ].map(([key, label]) => (
                                        <div key={key} className={styles.toggleRow}>
                                            <span className={styles.toggleText}>{label}</span>
                                            <label className={styles.switchContainer}>
                                                <input type="checkbox" disabled={!masterNotif} checked={masterNotif && notifState[key]} onChange={(e) => handleNotificationChange(key, e.target.checked)} />
                                                <span className={styles.switchSlider}></span>
                                            </label>
                                        </div>
                                    ))}

                                    <div className={styles.toggleRow} style={{ marginTop: '12px' }}>
                                        <span className={styles.toggleText}>New official announcement from your university (Mandatory)</span>
                                        <input type="checkbox" className={styles.uiCheckbox} checked readOnly disabled />
                                    </div>
                                </div>
                                <SaveBar onSave={saveNotifications} />
                            </div>
                        )}

                        {/* SECTION 4: APPEARANCE */}
                        {activeTab === 'Appearance' && (
                            <div className={styles.settingsFormGroup}>
                                <label className={styles.settingLabel}>Theme Preference</label>
                                <div className={styles.radioGroup}>
                                    {['dark', 'light', 'system'].map((t) => (
                                        <label key={t} className={styles.radioOption}>
                                            <input type="radio" name="theme" value={t} checked={appearanceTheme === t} onChange={() => {
                                                setAppearanceTheme(t);
                                                document.documentElement.setAttribute('data-theme', t);
                                                localStorage.setItem('theme', t);
                                            }} />
                                            <div className={styles.radioCircle} />
                                            <span className={styles.radioLabel}>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
                                        </label>
                                    ))}
                                </div>
                                <SaveBar onSave={saveAppearance} />
                            </div>
                        )}


                        {/* SECTION 6: SECURITY */}
                        {activeTab === 'Security' && (
                            <div className={styles.settingsFormGroup}>
                                <div className={styles.settingRowColumn}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                        <div>
                                            <label className={styles.settingLabel}>Two-Factor Authentication (2FA)</label>
                                            <p className={styles.settingDescription}>
                                                {twoFAEnabled ? '✓ 2FA is active on your account.' : 'Keep your account completely safe and secure.'}
                                            </p>
                                        </div>
                                        <button className={styles.settingActionBtn} onClick={() => { setTwoFAStep(1); setTwoFAInput(''); setTwoFACode(''); setActiveModal('2fa'); }}>
                                            {twoFAEnabled ? 'Reconfigure' : 'Configure'}
                                        </button>
                                    </div>

                                    <div className={styles.verificationRequirementBox}>
                                        <p style={{ margin: 0, fontWeight: 500, color: '#E6E6E6', fontSize: '0.9rem' }}>Requirement Checklist:</p>
                                        <p className={styles.settingDescription} style={{ marginTop: '4px' }}>
                                            A verified phone number or secondary email must be linked.
                                        </p>

                                        {/* Secondary Email status */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                                            <span style={{
                                                width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                                                backgroundColor: currentUser?.personal_email ? '#4caf50' : '#666'
                                            }} />
                                            <span style={{ fontSize: '0.85rem', color: currentUser?.personal_email ? '#E6E6E6' : '#888' }}>
                                                Secondary Email:&nbsp;
                                                {currentUser?.personal_email
                                                    ? <strong>{currentUser.personal_email.replace(/(.{2})(.*)(@)/, '$1***$3')}</strong>
                                                    : <span style={{ color: '#888' }}>Not linked</span>}
                                            </span>
                                        </div>

                                        {/* Phone status */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                                            <span style={{
                                                width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                                                backgroundColor: currentUser?.profile?.secondary_phone ? '#4caf50' : '#666'
                                            }} />
                                            <span style={{ fontSize: '0.85rem', color: currentUser?.profile?.secondary_phone ? '#E6E6E6' : '#888' }}>
                                                Phone Number:&nbsp;
                                                {currentUser?.profile?.secondary_phone
                                                    ? <strong>{currentUser.profile.secondary_phone.replace(/.(?=.{2})/g, '*')}</strong>
                                                    : <span style={{ color: '#888' }}>Not linked</span>}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SECTION 7: HELP & SUPPORT */}
                        {activeTab === 'Help & Support' && (
                            <div className={styles.settingsFormGroup}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <label className={styles.settingLabel}>Frequently Asked Questions</label>
                                    <button className={styles.settingActionBtn} onClick={() => navigate('/help')}>Go to Help Page</button>
                                </div>
                                {[
                                    ['How do I join a community?', 'Navigate to the Communities tab and click "Join" on your preferred group.'],
                                    ['How do I report a post?', 'Click the three dots on the top right of any post and select "Report".'],
                                    ['How do I change my university?', 'University affiliations are synced through registration. Contact your registrar to update.'],
                                ].map(([q, a]) => (
                                    <details key={q} className={styles.faqAccordion}>
                                        <summary>{q}</summary>
                                        <p>{a}</p>
                                    </details>
                                ))}

                                <hr style={{ border: 'none', height: '1px', backgroundColor: '#4D4D4D', margin: '20px 0' }} />

                                <div className={styles.settingRowColumn}>
                                    <label className={styles.settingLabel}>Contact Us</label>
                                    {contactSubmitted ? (
                                        <div className={styles.formSuccessState}>
                                            <p>Your support ticket has been submitted successfully!</p>
                                            <button className={styles.settingActionBtn} onClick={() => { setContactSubmitted(false); setContactForm({ subject: 'Technical Issue', message: '', screenshot: null }); }}>Submit Another Ticket</button>
                                        </div>
                                    ) : (
                                        <>
                                            <CustomSelect options={['Technical Issue', 'Account Problem', 'Report Abuse', 'Other']} value={contactForm.subject} onChange={(val) => setContactForm({ ...contactForm, subject: val })} />
                                            <textarea className={styles.supportTextArea} placeholder="Describe your issue (max 500 characters)..." maxLength={500} value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} />
                                            <div className={styles.formFooterActions}>
                                                <label className={styles.fileUploadLabel}>
                                                    Upload Screenshot
                                                    <input type="file" accept="image/*" className={styles.hiddenFileInput} onChange={(e) => setContactForm({ ...contactForm, screenshot: e.target.files[0] })} />
                                                </label>
                                                {contactForm.screenshot && <span className={styles.fileNameText}>{contactForm.screenshot.name}</span>}
                                                <button className={styles.primaryBtn} onClick={handleContactSubmit} disabled={loading || !contactForm.message.trim()}>
                                                    {loading ? 'Sending...' : 'Send Ticket'}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className={styles.settingRowColumn}>
                                    <label className={styles.settingLabel}>Report a Bug</label>
                                    {bugSubmitted ? (
                                        <div className={styles.formSuccessState}>
                                            <p>Bug report submitted. Thank you!</p>
                                            <button className={styles.settingActionBtn} onClick={() => { setBugSubmitted(false); setBugForm({ subject: 'Bug Report', message: '', actionTrack: '', screenshot: null }); }}>Log Another Bug</button>
                                        </div>
                                    ) : (
                                        <>
                                            <CustomSelect options={['Bug Report']} value={bugForm.subject} onChange={() => { }} disabled />
                                            <textarea className={styles.supportTextArea} placeholder="Describe the bug in detail (max 500 characters)..." maxLength={500} value={bugForm.message} onChange={(e) => setBugForm({ ...bugForm, message: e.target.value })} />
                                            <textarea className={styles.supportTextArea} style={{ height: '70px' }} placeholder="What were you doing when this happened? (Optional)" value={bugForm.actionTrack} onChange={(e) => setBugForm({ ...bugForm, actionTrack: e.target.value })} />
                                            <div className={styles.formFooterActions}>
                                                <label className={styles.fileUploadLabel}>
                                                    Upload Screenshot
                                                    <input type="file" accept="image/*" className={styles.hiddenFileInput} onChange={(e) => setBugForm({ ...bugForm, screenshot: e.target.files[0] })} />
                                                </label>
                                                {bugForm.screenshot && <span className={styles.fileNameText}>{bugForm.screenshot.name}</span>}
                                                <button className={styles.primaryBtn} onClick={handleBugSubmit} disabled={loading || !bugForm.message.trim()}>
                                                    {loading ? 'Sending...' : 'Send Bug Report'}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className={styles.aboutPlatformBox}>
                                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '10px' }}>
                                        <a href="/privacy" className={styles.policyLink}>Privacy Policy</a>
                                        <span style={{ color: '#4D4D4D' }}>|</span>
                                        <a href="/about" className={styles.policyLink}>About us</a>
                                    </div>
                                    <p style={{ marginTop: '10px' }}><strong>Project Campus™</strong> Version 1.0.0</p>
                                    <p className={styles.tagline}>Released: June 2026 • "A Unified Academic Social Platform."</p>
                                </div>
                            </div>
                        )}

                        {/* SECTION 8: DATA & STORAGE */}
                        {activeTab === 'Data & Storage' && (
                            <div className={styles.settingsFormGroup}>
                                <div className={styles.settingRow}>
                                    <div>
                                        <label className={styles.settingLabel}>Clear Cache</label>
                                        <p className={styles.settingDescription}>Estimated storage size: <strong>{cacheSize}</strong></p>
                                    </div>
                                    <button className={styles.settingActionBtn} onClick={() => setShowCacheConfirm(true)}>Clear Cache</button>
                                </div>
                                <div className={styles.settingRowColumn}>
                                    <label className={styles.settingLabel}>Auto-Play Media</label>
                                    <p className={styles.settingDescription} style={{ marginBottom: '4px' }}>Controls whether videos auto-play while scrolling.</p>
                                    <CustomSelect options={['Always', 'Never']} value={autoplayMedia} onChange={setAutoplayMedia} />
                                </div>
                                <SaveBar onSave={saveStorage} />
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT NAV — desktop only */}
                {!isMobile && <div className={styles.rightSection}>
                    <div className={styles.settingsNavContainer}>
                        <div className={styles.settingsNavHeader}>
                            {renderSolidIcon(Setting, theme === 'light' ? '#74419B' : '#E6E6E6', '25px', '25px')}
                            <h2 className={styles.settingsNavTitle}>Settings</h2>
                        </div>
                        <div className={styles.centeredDivider} />
                        <div className={styles.settingsNavList}>
                            {navItems.map((item) => {
                                const active = activeTab === item.key;
                                return (
                                    <div key={item.key} onClick={() => setActiveTab(item.key)} className={`${styles.settingsNavItem} ${active ? styles.settingsNavItemActive : ''}`}>
                                        {active && <div className={styles.activeArrowWrapper}><div className={styles.activeGradientArrow} /></div>}
                                        <span className={`${styles.settingsNavText} ${active ? styles.navTextActive : styles.navTextDefault}`}>{item.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>}
            </div>

            {/* MODALS */}
            {activeModal === 'email' && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h3>Update Email</h3>
                        {emailStep === 1 ? (
                            <>
                                <p className={styles.settingDescription} style={{ marginBottom: '14px' }}>
                                    Enter your new academic email address.
                                    {currentUser?.profile?.academic_email && (
                                        <span style={{ color: '#888', fontSize: '0.8rem', display: 'block', marginTop: 4 }}>
                                            Current: {currentUser.profile.academic_email}
                                        </span>
                                    )}
                                </p>
                                <input type="email" placeholder="e.g. username@ptuk.edu.ps" className={styles.modalInput} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                                <div className={styles.modalActions}>
                                    <button className={styles.settingActionBtn} onClick={() => setActiveModal(null)}>Cancel</button>
                                    <button className={styles.primaryBtn} onClick={handleSendEmailCode} disabled={loading || !newEmail}>{loading ? 'Sending...' : 'Send Verification Code'}</button>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className={styles.settingDescription} style={{ marginBottom: '14px' }}>A code was sent to <strong>{newEmail}</strong></p>
                                <input type="text" placeholder="Enter code" className={styles.modalInput} value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} />
                                <div className={styles.modalActions}>
                                    <button className={styles.settingActionBtn} onClick={() => setEmailStep(1)}>Back</button>
                                    <button className={styles.primaryBtn} onClick={handleVerifyEmail} disabled={loading || !verificationCode}>{loading ? 'Verifying...' : 'Confirm Code'}</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {activeModal === 'password' && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h3>Change Password</h3>
                        {['current', 'new', 'confirm'].map((field) => (
                            <div key={field}>
                                <label className={styles.modalLabel}>{field === 'current' ? 'Current Password' : field === 'new' ? 'New Password' : 'Confirm New Password'}</label>
                                <input type="password" className={styles.modalInput} value={passwordForm[field]} onChange={(e) => setPasswordForm({ ...passwordForm, [field]: e.target.value })} />
                                {field === 'new' && passwordStrength && (
                                    <div className={styles.strengthIndicatorContainer}>
                                        <span>Strength: </span>
                                        <span className={`${styles.strengthLabel} ${styles['strength' + passwordStrength]}`}>{passwordStrength}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                        <div className={styles.modalActions} style={{ marginTop: '20px' }}>
                            <button className={styles.settingActionBtn} onClick={() => setActiveModal(null)}>Cancel</button>
                            <button className={styles.primaryBtn} disabled={loading || !passwordForm.current || !passwordForm.new || passwordForm.new !== passwordForm.confirm} onClick={handleChangePassword}>{loading ? 'Updating...' : 'Update Password'}</button>
                        </div>
                    </div>
                </div>
            )}

            {activeModal === 'deactivate' && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h3>Deactivate Account</h3>
                        <p className={styles.settingDescription}>Your account will be hidden. You can reactivate by logging back in within 30 days.</p>
                        <label className={styles.modalLabel}>Confirm Password</label>
                        <input type="password" className={styles.modalInput} value={deactivatePassword} onChange={(e) => setDeactivatePassword(e.target.value)} />
                        <div className={styles.modalActions} style={{ marginTop: '20px' }}>
                            <button className={styles.settingActionBtn} onClick={() => setActiveModal(null)}>Cancel</button>
                            <button className={styles.primaryBtn} disabled={loading || !deactivatePassword} onClick={handleDeactivate}>{loading ? 'Deactivating...' : 'Deactivate'}</button>
                        </div>
                    </div>
                </div>
            )}

            {activeModal === 'delete' && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent} style={{ borderColor: '#D4145A' }}>
                        <h3 style={{ color: '#D4145A' }}>Delete Account</h3>
                        <p className={styles.settingDescription}>This permanently deletes all your data. This cannot be undone.</p>
                        <label className={styles.modalLabel}>Type "DELETE" to confirm</label>
                        <input type="text" className={styles.modalInput} placeholder="DELETE" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} />
                        <label className={styles.modalLabel}>Confirm Password</label>
                        <input type="password" className={styles.modalInput} value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} />
                        <div className={styles.modalActions} style={{ marginTop: '20px' }}>
                            <button className={styles.settingActionBtn} onClick={() => setActiveModal(null)}>Abort</button>
                            <button className={styles.deleteBtn} disabled={loading || deleteConfirmText !== 'DELETE' || !deletePassword} onClick={handleDeleteAccount}>{loading ? 'Processing...' : 'Permanently Delete Account'}</button>
                        </div>
                    </div>
                </div>
            )}

            {activeModal === 'blocked' && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent} style={{ maxWidth: '500px', width: '90%' }}>
                        <h3>Manage Blocked Accounts</h3>
                        <input type="text" placeholder="Search by username..." className={styles.modalInput} value={blockedSearch} onChange={(e) => setBlockedSearch(e.target.value)} />
                        <div className={styles.blockedListContainer}>
                            {blockedUsers.filter(u => u.username.toLowerCase().includes(blockedSearch.toLowerCase())).length === 0 ? (
                                <p className={styles.emptyStateText}>No blocked users found.</p>
                            ) : (
                                blockedUsers.filter(u => u.username.toLowerCase().includes(blockedSearch.toLowerCase())).map(user => (
                                    <div key={user.id} className={styles.blockedUserRow}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <img src={user.pfp} alt={user.username} className={styles.blockedPfp} />
                                            <div>
                                                <p style={{ margin: 0, fontWeight: 600, color: '#fff' }}>@{user.username}</p>
                                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#B3B3B3' }}>{user.university}</p>
                                            </div>
                                        </div>
                                        <button className={styles.settingActionBtn} style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={() => handleUnblock(user.id)}>Unblock</button>
                                    </div>
                                ))
                            )}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                            <button className={styles.primaryBtn} onClick={() => setActiveModal(null)}>Done</button>
                        </div>
                    </div>
                </div>
            )}
            {activeModal === '2fa' && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h3>Two-Factor Authentication</h3>

                        {twoFAStep === 1 && (
                            <>
                                <p className={styles.settingDescription} style={{ marginBottom: '14px' }}>
                                    Choose a verification method to secure your account.
                                </p>

                                {/* Linked status banner */}
                                {currentUser?.personal_email && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1a2e1a', border: '1px solid #2e7d32', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px' }}>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4caf50', flexShrink: 0 }} />
                                        <span style={{ fontSize: '0.83rem', color: '#a5d6a7' }}>
                                            Linked: <strong>{currentUser.personal_email.replace(/(.{2})(.*)(@)/, '$1***$3')}</strong> — you can use this or enter a new one below.
                                        </span>
                                    </div>
                                )}
                                {!currentUser?.personal_email && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#2a1f1f', border: '1px solid #5a3030', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px' }}>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef5350', flexShrink: 0 }} />
                                        <span style={{ fontSize: '0.83rem', color: '#ef9a9a' }}>No secondary email linked. Enter one below.</span>
                                    </div>
                                )}

                                <label className={styles.modalLabel}>Secondary Email Address</label>
                                <input
                                    type="email"
                                    placeholder="e.g. yourname@gmail.com"
                                    className={styles.modalInput}
                                    value={twoFAInput}
                                    onChange={(e) => setTwoFAInput(e.target.value)}
                                />

                                <div className={styles.modalActions} style={{ marginTop: '20px' }}>
                                    <button className={styles.settingActionBtn} onClick={() => setActiveModal(null)}>Cancel</button>
                                    <button
                                        className={styles.primaryBtn}
                                        disabled={loading || !twoFAInput}
                                        onClick={async () => {
                                            setLoading(true);
                                            try {
                                                const body = twoFAMethod === 'email'
                                                    ? { personalEmail: twoFAInput, username: currentUser?.username }
                                                    : { phone: twoFAInput, username: currentUser?.username };

                                                const res = await fetch(`${API}/api/auth/2fa/send/`, {
                                                    method: 'POST', headers: authHeaders(),
                                                    body: JSON.stringify(body)
                                                });
                                                if (res.ok) { setTwoFAStep(2); showToast('Verification code sent.'); }
                                                else { const d = await res.json(); showToast(d.message || 'Failed to send code.', 'error'); }
                                            } catch { showToast('Network error.', 'error'); }
                                            setLoading(false);
                                        }}>
                                        {loading ? 'Sending...' : 'Send Code'}
                                    </button>
                                </div>
                            </>
                        )}

                        {twoFAStep === 2 && (
                            <>
                                <p className={styles.settingDescription} style={{ marginBottom: '14px' }}>
                                    Enter the code sent to <strong>{twoFAInput}</strong>
                                </p>
                                <input
                                    type="text"
                                    placeholder="6-digit code"
                                    className={styles.modalInput}
                                    value={twoFACode}
                                    onChange={(e) => setTwoFACode(e.target.value)}
                                />
                                <div className={styles.modalActions} style={{ marginTop: '20px' }}>
                                    <button className={styles.settingActionBtn} onClick={() => {
                                        setTwoFAStep(1);
                                        setTwoFAInput(currentUser?.personal_email);
                                        setTwoFACode('');
                                        setActiveModal('2fa');
                                    }}>Back</button>
                                    <button
                                        className={styles.primaryBtn}
                                        disabled={loading || !twoFACode}
                                        onClick={async () => {
                                            setLoading(true);
                                            try {
                                                const body = twoFAMethod === 'email'
                                                    ? { personalEmail: twoFAInput, username: currentUser?.username, code: twoFACode }
                                                    : { phone: twoFAInput, username: currentUser?.username, code: twoFACode };

                                                const res = await fetch(`${API}/api/auth/2fa/verify/`, {
                                                    method: 'POST', headers: authHeaders(),
                                                    body: JSON.stringify(body)
                                                });
                                                if (res.ok) {
                                                    setTwoFAEnabled(true);
                                                    showToast('2FA enabled successfully.');
                                                    setActiveModal(null);
                                                } else { const d = await res.json(); showToast(d.message || 'Invalid code.', 'error'); }
                                            } catch { showToast('Network error.', 'error'); }
                                            setLoading(false);
                                        }}>
                                        {loading ? 'Verifying...' : 'Enable 2FA'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
