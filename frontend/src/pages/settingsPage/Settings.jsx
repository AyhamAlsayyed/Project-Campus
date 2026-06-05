import styles from './settings.module.css';
import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav';
import Header from '../../components/pagelayout/header/header';
import { useState, useEffect, useRef } from 'react';
import Setting from '../../Assets/icons/setting.png';

// Fully reusable Custom Dropdown Component
const CustomSelect = ({ options, value, onChange, disabled, minWidth = '250px' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const toggle = () => {
        if (!disabled) setIsOpen(!isOpen);
    };

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className={styles.customDropdownContainer} ref={dropdownRef}>
            <div className={styles.customDropdownOuter}>
                <div
                    className={`${styles.customDropdownValueBox} ${disabled ? styles.disabledElement : ''}`}
                    style={{ minWidth }}
                    onClick={toggle}
                >
                    {value}
                </div>
                {/* Arrow perfectly positioned OUTSIDE on the right */}
                <div
                    className={`${styles.customDropdownArrow} ${isOpen ? styles.customDropdownArrowOpen : ''} ${disabled ? styles.disabledElement : ''}`}
                    onClick={toggle}
                />
            </div>

            {isOpen && !disabled && (
                <div className={styles.customDropdownMenu}>
                    {options.map((opt, index) => (
                        <div key={opt}>
                            <div
                                className={styles.customDropdownOption}
                                onClick={() => { onChange(opt); setIsOpen(false); }}
                            >
                                {opt}
                            </div>
                            {/* Exact 50% width divider between items */}
                            {index < options.length - 1 && <div className={styles.customDropdownDivider} />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default function Settings() {
    const [theme, setTheme] = useState('dark');
    const [currentUser, setCurrentUser] = useState(null);
    const [activeTab, setActiveTab] = useState('Account');

    // Section 3: Notification Toggles State
    const [masterNotif, setMasterNotif] = useState(true);
    const [notifState, setNotifState] = useState({
        friendRequestReceived: true,
        friendRequestAccepted: true,
        someoneReacted: true,
        someoneCommented: true,
        someoneReplied: true,
        newPostCommunity: true,
        joinRequestStatus: true,
        eventStartingSoon: true,
        eventDaysBefore: '1 Day before',
        eventUpdatedCancelled: true,
        eventHasStarted: true,
        pageAnnouncement: true,
        dmExisting: true,
        dmRequest: true,
        courseGroupChat: true,
        passwordChangedSuccess: true,
        emailUpdatedSuccess: true
    });

    // Section 2: Privacy States
    const [accountPrivacy, setAccountPrivacy] = useState('Public');
    const [whoCanMessage, setWhoCanMessage] = useState('Everyone');
    const [whoCanSeeFriends, setWhoCanSeeFriends] = useState('Everyone');
    const [blockedUsers, setBlockedUsers] = useState([
        { id: 1, username: 'johndoe22', university: 'PTUK', pfp: 'https://via.placeholder.com/40' },
        { id: 2, username: 'sara_smith', university: 'An-Najah', pfp: 'https://via.placeholder.com/40' }
    ]);
    const [blockedSearch, setBlockedSearch] = useState('');

    // Modal Control States
    const [activeModal, setActiveModal] = useState(null);

    // Form Input States
    const [newEmail, setNewEmail] = useState('');
    const [emailStep, setEmailStep] = useState(1);
    const [verificationCode, setVerificationCode] = useState('');

    const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
    const [passwordStrength, setPasswordStrength] = useState('');

    const [deactivatePassword, setDeactivatePassword] = useState('');
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deletePassword, setDeletePassword] = useState('');

    // Section 5: Language State
    const [language, setLanguage] = useState('English');

    // Section 7: Help & Support Form States
    const [contactForm, setContactForm] = useState({ subject: 'Technical Issue', message: '', screenshot: null });
    const [contactSubmitted, setContactSubmitted] = useState(false);
    const [bugForm, setBugForm] = useState({ subject: 'Bug Report', message: '', actionTrack: '', screenshot: null });
    const [bugSubmitted, setBugSubmitted] = useState(false);

    // Section 8: Data & Storage States
    const [cacheSize, setCacheSize] = useState('24.5 MB');
    const [autoplayMedia, setAutoplayMedia] = useState('Always');

    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem("access");
            try {
                const res = await fetch("http://localhost:8000/api/auth/me/", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (res.ok) {
                    setCurrentUser(data);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchUser();
    }, []);

    useEffect(() => {
        if (!passwordForm.new) {
            setPasswordStrength('');
            return;
        }
        if (passwordForm.new.length < 6) {
            setPasswordStrength('Weak');
        } else if (passwordForm.new.length < 10 || !/[A-Z]/.test(passwordForm.new) || !/[0-9]/.test(passwordForm.new)) {
            setPasswordStrength('Medium');
        } else {
            setPasswordStrength('Strong');
        }
    }, [passwordForm.new]);

    const handleNotificationChange = (key, value) => {
        setNotifState(prev => ({ ...prev, [key]: value }));
    };

    const handleLanguageChange = (lang) => {
        const confirmSwitch = window.confirm("Switching language will reload the page. Continue?");
        if (confirmSwitch) {
            setLanguage(lang);
        }
    };

    const handleClearCache = () => {
        const confirmClear = window.confirm("Are you sure you want to clear your locally cached media and data?");
        if (confirmClear) {
            localStorage.removeItem('cached_media');
            sessionStorage.clear();
            setCacheSize('0.0 MB');
            alert("Cache cleared successfully (Frontend only).");
        }
    };

    const navItems = [
        { key: 'Account', label: 'Account' },
        { key: 'Privacy', label: 'Privacy' },
        { key: 'Notifications', label: 'Notifications' },
        { key: 'Appearance', label: 'Appearance' },
        { key: 'Language', label: 'Language' },
        { key: 'Security', label: 'Security' },
        { key: 'Help & Support', label: 'Help & Support' },
        { key: 'Data & Storage', label: 'Data & Storage' }
    ];

    const renderSolidIcon = (src, color, width = '20px', height = '20px') => (
        <div
            style={{
                width,
                height,
                backgroundColor: color,
                maskImage: `url(${src})`,
                WebkitMaskImage: `url(${src})`,
                maskSize: 'contain',
                WebkitMaskSize: 'contain',
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskPosition: 'center',
                display: 'inline-block'
            }}
        />
    );

    return (
        <div className={styles.darkContainer}>
            <div className={`${styles.header} ${styles.page}`}>
                <Header theme={theme} toggleTheme={toggleTheme} user={currentUser} />
            </div>
            <div className={`${styles.page} ${styles.content}`}>
                <SideBarNav variant={"profile"} currentUser={currentUser} />

                <div className={styles.settingsMainContainer}>
                    <div className={styles.innerContainer}>
                        <h1 className={styles.sectionHeading}>{activeTab}</h1>

                        {/* SECTION 1: ACCOUNT */}
                        {activeTab === 'Account' && (
                            <div className={styles.settingsFormGroup}>
                                <div className={styles.settingRow}>
                                    <div>
                                        <label className={styles.settingLabel}>Email Address</label>
                                        <p className={styles.settingDescription}>ay***@ptuk.edu.ps</p>
                                    </div>
                                    <button className={styles.settingActionBtn} onClick={() => { setEmailStep(1); setActiveModal('email'); }}>Update</button>
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
                                        <button className={accountPrivacy === 'Private' ? styles.segmentedOptionActive : styles.segmentedOption} onClick={() => setAccountPrivacy('Private')}>Private</button>
                                    </div>
                                    <p className={styles.contextualNote}>
                                        {accountPrivacy === 'Public'
                                            ? "Any registered Campus user can view your profile and posts."
                                            : "Only friends can see your full profile and posts; others see only name, university, and profile picture."}
                                    </p>
                                </div>
                                <div className={styles.settingRowColumn}>
                                    <label className={styles.settingLabel}>Who Can Message You</label>
                                    <CustomSelect
                                        options={['Everyone', 'Friends Only', 'Nobody']}
                                        value={accountPrivacy === 'Private' ? 'Friends Only' : whoCanMessage}
                                        onChange={(val) => setWhoCanMessage(val)}
                                        disabled={accountPrivacy === 'Private'}
                                    />
                                    {accountPrivacy === 'Private' && <p className={styles.fieldNote}>Note: if you are in private mode, then only friends can message you.</p>}
                                    <p className={styles.fieldNote}>Note: a new messenger who's not your friend yet, would go to the request section.</p>
                                </div>
                                <div className={styles.settingRowColumn}>
                                    <label className={styles.settingLabel}>Who Can See Your Friends List</label>
                                    <CustomSelect
                                        options={['Everyone', 'Friends Only', 'Only Me']}
                                        value={whoCanSeeFriends}
                                        onChange={(val) => setWhoCanSeeFriends(val)}
                                    />
                                </div>
                                <div className={styles.settingRow}>
                                    <div>
                                        <label className={styles.settingLabel}>Blocked Accounts</label>
                                        <p className={styles.settingDescription}>{blockedUsers.length} users currently blocked. Blocked users cannot view your profile, send messages, or interact with your content.</p>
                                    </div>
                                    <button className={styles.settingActionBtn} onClick={() => setActiveModal('blocked')}>Manage</button>
                                </div>
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
                                    <h3 className={styles.subGridHeader}>Social</h3>
                                    <div className={styles.toggleRow}>
                                        <span className={styles.toggleText}>Friend request received</span>
                                        <label className={styles.switchContainer}>
                                            <input type="checkbox" disabled={!masterNotif} checked={masterNotif && notifState.friendRequestReceived} onChange={(e) => handleNotificationChange('friendRequestReceived', e.target.checked)} />
                                            <span className={styles.switchSlider}></span>
                                        </label>
                                    </div>
                                    <div className={styles.toggleRow}>
                                        <span className={styles.toggleText}>Friend request accepted</span>
                                        <label className={styles.switchContainer}>
                                            <input type="checkbox" disabled={!masterNotif} checked={masterNotif && notifState.friendRequestAccepted} onChange={(e) => handleNotificationChange('friendRequestAccepted', e.target.checked)} />
                                            <span className={styles.switchSlider}></span>
                                        </label>
                                    </div>
                                    <div className={styles.toggleRow}>
                                        <span className={styles.toggleText}>Someone reacted to your post</span>
                                        <label className={styles.switchContainer}>
                                            <input type="checkbox" disabled={!masterNotif} checked={masterNotif && notifState.someoneReacted} onChange={(e) => handleNotificationChange('someoneReacted', e.target.checked)} />
                                            <span className={styles.switchSlider}></span>
                                        </label>
                                    </div>
                                    <div className={styles.toggleRow}>
                                        <span className={styles.toggleText}>Someone commented on your post</span>
                                        <label className={styles.switchContainer}>
                                            <input type="checkbox" disabled={!masterNotif} checked={masterNotif && notifState.someoneCommented} onChange={(e) => handleNotificationChange('someoneCommented', e.target.checked)} />
                                            <span className={styles.switchSlider}></span>
                                        </label>
                                    </div>
                                    <div className={styles.toggleRow}>
                                        <span className={styles.toggleText}>Someone replied to your comment</span>
                                        <label className={styles.switchContainer}>
                                            <input type="checkbox" disabled={!masterNotif} checked={masterNotif && notifState.someoneReplied} onChange={(e) => handleNotificationChange('someoneReplied', e.target.checked)} />
                                            <span className={styles.switchSlider}></span>
                                        </label>
                                    </div>

                                    <h3 className={styles.subGridHeader}>Communities</h3>
                                    <div className={styles.toggleRow}>
                                        <span className={styles.toggleText}>New post in a community you follow</span>
                                        <label className={styles.switchContainer}>
                                            <input type="checkbox" disabled={!masterNotif} checked={masterNotif && notifState.newPostCommunity} onChange={(e) => handleNotificationChange('newPostCommunity', e.target.checked)} />
                                            <span className={styles.switchSlider}></span>
                                        </label>
                                    </div>
                                    <div className={styles.toggleRow}>
                                        <span className={styles.toggleText}>Your community join request was approved or rejected</span>
                                        <label className={styles.switchContainer}>
                                            <input type="checkbox" disabled={!masterNotif} checked={masterNotif && notifState.joinRequestStatus} onChange={(e) => handleNotificationChange('joinRequestStatus', e.target.checked)} />
                                            <span className={styles.switchSlider}></span>
                                        </label>
                                    </div>

                                    <h3 className={styles.subGridHeader}>Events</h3>
                                    <div className={styles.toggleRow}>
                                        <span className={styles.toggleText}>An event you follow is starting soon</span>
                                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                            <CustomSelect
                                                options={['1 Day before', '2 Days before', '3 Days before', '4 Days before', '5 Days before', '6 Days before', '7 Days before']}
                                                value={notifState.eventDaysBefore}
                                                onChange={(val) => handleNotificationChange('eventDaysBefore', val)}
                                                disabled={!masterNotif || !notifState.eventStartingSoon}
                                                minWidth="160px"
                                            />
                                            <label className={styles.switchContainer}>
                                                <input type="checkbox" disabled={!masterNotif} checked={masterNotif && notifState.eventStartingSoon} onChange={(e) => handleNotificationChange('eventStartingSoon', e.target.checked)} />
                                                <span className={styles.switchSlider}></span>
                                            </label>
                                        </div>
                                    </div>
                                    <div className={styles.toggleRow}>
                                        <span className={styles.toggleText}>An event you follow has been updated or cancelled</span>
                                        <label className={styles.switchContainer}>
                                            <input type="checkbox" disabled={!masterNotif} checked={masterNotif && notifState.eventUpdatedCancelled} onChange={(e) => handleNotificationChange('eventUpdatedCancelled', e.target.checked)} />
                                            <span className={styles.switchSlider}></span>
                                        </label>
                                    </div>
                                    <div className={styles.toggleRow}>
                                        <span className={styles.toggleText}>An event has started</span>
                                        <label className={styles.switchContainer}>
                                            <input type="checkbox" disabled={!masterNotif} checked={masterNotif && notifState.eventHasStarted} onChange={(e) => handleNotificationChange('eventHasStarted', e.target.checked)} />
                                            <span className={styles.switchSlider}></span>
                                        </label>
                                    </div>

                                    <h3 className={styles.subGridHeader}>Announcements</h3>
                                    <div className={styles.toggleRow}>
                                        <span className={styles.toggleText}>New official announcement from your university (Mandatory)</span>
                                        <input type="checkbox" className={styles.uiCheckbox} checked readOnly disabled />
                                    </div>
                                    <div className={styles.toggleRow}>
                                        <span className={styles.toggleText}>New announcement from a Page you follow</span>
                                        <label className={styles.switchContainer}>
                                            <input type="checkbox" disabled={!masterNotif} checked={masterNotif && notifState.pageAnnouncement} onChange={(e) => handleNotificationChange('pageAnnouncement', e.target.checked)} />
                                            <span className={styles.switchSlider}></span>
                                        </label>
                                    </div>

                                    <h3 className={styles.subGridHeader}>Messages</h3>
                                    <div className={styles.toggleRow}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span className={styles.toggleText}>New direct message received</span>
                                            <span className={styles.fieldNote} style={{ paddingLeft: 0 }}>Existing Message Conversions</span>
                                        </div>
                                        <label className={styles.switchContainer}>
                                            <input type="checkbox" disabled={!masterNotif} checked={masterNotif && notifState.dmExisting} onChange={(e) => handleNotificationChange('dmExisting', e.target.checked)} />
                                            <span className={styles.switchSlider}></span>
                                        </label>
                                    </div>
                                    <div className={styles.toggleRow}>
                                        <span className={styles.toggleText} style={{ paddingLeft: '14px', fontSize: '0.9rem', color: '#B3B3B3' }}>• New Message Requests</span>
                                        <label className={styles.switchContainer}>
                                            <input type="checkbox" disabled={!masterNotif} checked={masterNotif && notifState.dmRequest} onChange={(e) => handleNotificationChange('dmRequest', e.target.checked)} />
                                            <span className={styles.switchSlider}></span>
                                        </label>
                                    </div>
                                    <div className={styles.toggleRow}>
                                        <span className={styles.toggleText}>New message in a course group chat</span>
                                        <label className={styles.switchContainer}>
                                            <input type="checkbox" disabled={!masterNotif} checked={masterNotif && notifState.courseGroupChat} onChange={(e) => handleNotificationChange('courseGroupChat', e.target.checked)} />
                                            <span className={styles.switchSlider}></span>
                                        </label>
                                    </div>

                                    <h3 className={styles.subGridHeader}>Account & Security</h3>
                                    <div className={styles.toggleRow}>
                                        <span className={styles.toggleText}>Password changed successfully</span>
                                        <label className={styles.switchContainer}>
                                            <input type="checkbox" disabled={!masterNotif} checked={masterNotif && notifState.passwordChangedSuccess} onChange={(e) => handleNotificationChange('passwordChangedSuccess', e.target.checked)} />
                                            <span className={styles.switchSlider}></span>
                                        </label>
                                    </div>
                                    <div className={styles.toggleRow}>
                                        <span className={styles.toggleText}>Email address updated</span>
                                        <label className={styles.switchContainer}>
                                            <input type="checkbox" disabled={!masterNotif} checked={masterNotif && notifState.emailUpdatedSuccess} onChange={(e) => handleNotificationChange('emailUpdatedSuccess', e.target.checked)} />
                                            <span className={styles.switchSlider}></span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SECTION 4: APPEARANCE */}
                        {activeTab === 'Appearance' && (
                            <div className={styles.settingsFormGroup}>
                                <label className={styles.settingLabel}>Theme Preference</label>
                                <div className={styles.radioGroup}>
                                    {['dark', 'light', 'system'].map((t) => (
                                        <label key={t} className={styles.radioOption}>
                                            <input
                                                type="radio"
                                                name="theme"
                                                value={t}
                                                checked={theme === t}
                                                onChange={() => setTheme(t)}
                                            />
                                            <div className={styles.radioCircle} />
                                            <span className={styles.radioLabel}>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* SECTION 5: LANGUAGE */}
                        {activeTab === 'Language' && (
                            <div className={styles.settingsFormGroup}>
                                <label className={styles.settingLabel}>Interface Language</label>
                                <div className={styles.radioGroup}>
                                    <label className={styles.radioOption}>
                                        <input
                                            type="radio"
                                            name="lang"
                                            value="English"
                                            checked={language === 'English'}
                                            onChange={() => handleLanguageChange('English')}
                                        />
                                        <div className={styles.radioCircle} />
                                        <span className={styles.radioLabel}>English</span>
                                    </label>
                                    <label className={styles.radioOption}>
                                        <input
                                            type="radio"
                                            name="lang"
                                            value="Arabic"
                                            checked={language === 'Arabic'}
                                            onChange={() => handleLanguageChange('Arabic')}
                                        />
                                        <div className={styles.radioCircle} />
                                        <span className={styles.radioLabel}>العربية (Arabic)</span>
                                    </label>
                                </div>
                                {language === 'Arabic' && <p className={styles.fieldNote}>Layout rendering set to RTL framework structure.</p>}
                            </div>
                        )}

                        {/* SECTION 6: SECURITY */}
                        {activeTab === 'Security' && (
                            <div className={styles.settingsFormGroup}>
                                <div className={styles.settingRowColumn}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                        <div>
                                            <label className={styles.settingLabel}>Two-Factor Authentication (2FA)</label>
                                            <p className={styles.settingDescription}>Keep your account completely safe and secure from external vulnerability monitoring access activity.</p>
                                        </div>
                                        <button className={styles.settingActionBtn}>Configure</button>
                                    </div>
                                    <div className={styles.verificationRequirementBox}>
                                        <p style={{ margin: 0, fontWeight: 500, color: '#E6E6E6', fontSize: '0.9rem' }}>Requirement Checklist:</p>
                                        <p className={styles.settingDescription} style={{ marginTop: '4px' }}>A student account must have assigned at least a verified phone number or a secondary email framework linked.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SECTION 7: HELP & SUPPORT */}
                        {activeTab === 'Help & Support' && (
                            <div className={styles.settingsFormGroup}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <label className={styles.settingLabel}>Frequently Asked Questions</label>
                                    <button className={styles.settingActionBtn} onClick={() => alert("Directing to full Help Page resources...")}>Go to Help Page</button>
                                </div>
                                <details className={styles.faqAccordion}>
                                    <summary>How do I join a community?</summary>
                                    <p>Navigate to the Communities tab and click "Join" on your preferred group.</p>
                                </details>
                                <details className={styles.faqAccordion}>
                                    <summary>How do I report a post?</summary>
                                    <p>Click the three dots on the top right of any post and select "Report".</p>
                                </details>
                                <details className={styles.faqAccordion}>
                                    <summary>How do I change my university?</summary>
                                    <p>University affiliations are synchronized through registration protocols. Contact registrar support portals to address systematic mapping changes.</p>
                                </details>

                                <hr style={{ border: 'none', height: '1px', backgroundColor: '#4D4D4D', margin: '20px 0' }} />

                                {/* CONTACT US FORM */}
                                <div className={styles.settingRowColumn}>
                                    <label className={styles.settingLabel}>Contact Us</label>
                                    {contactSubmitted ? (
                                        <div className={styles.formSuccessState}>
                                            <p>Your support ticket has been submitted successfully! We will verify details and reach out.</p>
                                            <button className={styles.settingActionBtn} onClick={() => setContactSubmitted(false)}>Submit Another Ticket</button>
                                        </div>
                                    ) : (
                                        <>
                                            <CustomSelect
                                                options={['Technical Issue', 'Account Problem', 'Report Abuse', 'Other']}
                                                value={contactForm.subject}
                                                onChange={(val) => setContactForm({ ...contactForm, subject: val })}
                                            />
                                            <textarea className={styles.supportTextArea} placeholder="Describe your issue or inquiry (Max 500 characters)..." maxLength={500} value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} />
                                            <div className={styles.formFooterActions}>
                                                <label className={styles.fileUploadLabel}>
                                                    Upload Screenshot (Image Only)
                                                    <input type="file" accept="image/*" className={styles.hiddenFileInput} onChange={(e) => setContactForm({ ...contactForm, screenshot: e.target.files[0] })} />
                                                </label>
                                                {contactForm.screenshot && <span className={styles.fileNameText}>{contactForm.screenshot.name}</span>}
                                                <button className={styles.primaryBtn} onClick={() => setContactSubmitted(true)}>Send Ticket</button>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* REPORT A BUG FORM */}
                                <div className={styles.settingRowColumn}>
                                    <label className={styles.settingLabel}>Report a Bug</label>
                                    {bugSubmitted ? (
                                        <div className={styles.formSuccessState}>
                                            <p>Bug log successfully transmitted to QA engineers. Thank you for making Campus cleaner!</p>
                                            <button className={styles.settingActionBtn} onClick={() => setBugSubmitted(false)}>Log Another Bug</button>
                                        </div>
                                    ) : (
                                        <>
                                            <CustomSelect
                                                options={['Bug Report']}
                                                value={bugForm.subject}
                                                onChange={() => { }}
                                                disabled={true}
                                            />
                                            <textarea className={styles.supportTextArea} placeholder="What occurred? Describe the bug in detail (Max 500 characters)..." maxLength={500} value={bugForm.message} onChange={(e) => setBugForm({ ...bugForm, message: e.target.value })} />
                                            <textarea className={styles.supportTextArea} style={{ height: '70px' }} placeholder="What were you doing when this happened? (Optional extra context)" value={bugForm.actionTrack} onChange={(e) => setBugForm({ ...bugForm, actionTrack: e.target.value })} />
                                            <div className={styles.formFooterActions}>
                                                <label className={styles.fileUploadLabel}>
                                                    Upload Bug Proof Screenshot
                                                    <input type="file" accept="image/*" className={styles.hiddenFileInput} onChange={(e) => setBugForm({ ...bugForm, screenshot: e.target.files[0] })} />
                                                </label>
                                                {bugForm.screenshot && <span className={styles.fileNameText}>{bugForm.screenshot.name}</span>}
                                                <button className={styles.primaryBtn} onClick={() => setBugSubmitted(true)}>Send Bug Report</button>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className={styles.aboutPlatformBox}>
                                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '10px' }}>
                                        <a href="#privacy" className={styles.policyLink} onClick={() => alert("Redirecting to Privacy Policy Page...")}>Privacy Policy</a>
                                        <span style={{ color: '#4D4D4D' }}>|</span>
                                        <a href="#about" className={styles.policyLink} onClick={() => alert("Redirecting to About us Page...")}>About us</a>
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
                                        <p className={styles.settingDescription}>Locally cached media and data file assets system weight. Estimated storage size: <strong>{cacheSize}</strong></p>
                                    </div>
                                    <button className={styles.settingActionBtn} onClick={handleClearCache}>Clear Cache</button>
                                </div>
                                <div className={styles.settingRowColumn}>
                                    <label className={styles.settingLabel}>Auto-Play Media</label>
                                    <p className={styles.settingDescription} style={{ marginBottom: '4px' }}>Controls whether video blocks and animated asset contents systematically auto-play execution tracks while scrolling feeds.</p>
                                    <CustomSelect
                                        options={['Always', 'Never']}
                                        value={autoplayMedia}
                                        onChange={(val) => setAutoplayMedia(val)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: SETTINGS NAVIGATION */}
                <div className={styles.rightSection}>
                    <div className={styles.settingsNavContainer}>
                        <div className={styles.settingsNavHeader}>
                            {renderSolidIcon(Setting, '#E6E6E6', '25px', '25px')}
                            <h2 className={styles.settingsNavTitle}>Settings</h2>
                        </div>

                        <div className={styles.centeredDivider} />

                        <div className={styles.settingsNavList}>
                            {navItems.map((item) => {
                                const isActive = activeTab === item.key;
                                return (
                                    <div
                                        key={item.key}
                                        onClick={() => setActiveTab(item.key)}
                                        className={`${styles.settingsNavItem} ${isActive ? styles.settingsNavItemActive : ''}`}
                                    >
                                        {isActive && (
                                            <div className={styles.activeArrowWrapper}>
                                                <div className={styles.activeGradientArrow} />
                                            </div>
                                        )}
                                        <span className={`${styles.settingsNavText} ${isActive ? styles.navTextActive : styles.navTextDefault}`}>
                                            {item.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* INTERACTIVE SPECIFICATION MODALS */}
            {activeModal === 'email' && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h3>Update Academic Email</h3>
                        {emailStep === 1 ? (
                            <>
                                <p className={styles.settingDescription} style={{ marginBottom: '14px' }}>Enter your brand new authorized academic email domain registration marker address.</p>
                                <input type="email" placeholder="e.g. username@ptuk.edu.ps" className={styles.modalInput} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                                <div className={styles.modalActions}>
                                    <button className={styles.settingActionBtn} onClick={() => setActiveModal(null)}>Cancel</button>
                                    <button className={styles.primaryBtn} onClick={() => { if (newEmail) setEmailStep(2); }}>Send Verification Code</button>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className={styles.settingDescription} style={{ marginBottom: '14px' }}>A systematic verification security token code block has been targeted to: <strong>{newEmail}</strong></p>
                                <input type="text" placeholder="Enter Code Token" className={styles.modalInput} value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} />
                                <p className={styles.fieldNote} style={{ paddingLeft: 0, color: '#D4145A' }}>Notice: Upon completion confirmation, your previous email tracking layout receives an instant primary security system alert prompt.</p>
                                <div className={styles.modalActions}>
                                    <button className={styles.settingActionBtn} onClick={() => setEmailStep(1)}>Back</button>
                                    <button className={styles.primaryBtn} onClick={() => { alert("Email tracking successfully modified mapping updates."); setActiveModal(null); }}>Confirm Code</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {activeModal === 'password' && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h3>Change Account Password</h3>
                        <p className={styles.settingDescription}>Input current and configuration tracking parameters below to rebuild key structural security entry codes.</p>

                        <label className={styles.modalLabel}>Current Password</label>
                        <input type="password" className={styles.modalInput} value={passwordForm.current} onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })} />

                        <label className={styles.modalLabel}>New Password</label>
                        <input type="password" className={styles.modalInput} value={passwordForm.new} onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })} />

                        {passwordStrength && (
                            <div className={styles.strengthIndicatorContainer}>
                                <span>Strength Metric: </span>
                                <span className={`${styles.strengthLabel} ${styles['strength' + passwordStrength]}`}>{passwordStrength}</span>
                            </div>
                        )}

                        <label className={styles.modalLabel}>Confirm New Password</label>
                        <input type="password" className={styles.modalInput} value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} />

                        <div className={styles.modalActions} style={{ marginTop: '20px' }}>
                            <button className={styles.settingActionBtn} onClick={() => setActiveModal(null)}>Cancel</button>
                            <button className={styles.primaryBtn} disabled={!passwordForm.current || !passwordForm.new || passwordForm.new !== passwordForm.confirm} onClick={() => { alert("Account access password successfully rotated."); setActiveModal(null); }}>Update Password</button>
                        </div>
                    </div>
                </div>
            )}

            {activeModal === 'deactivate' && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h3>Deactivate Account</h3>
                        <p className={styles.settingDescription} style={{ color: '#fff', fontWeight: 500 }}>
                            Your account will be hidden and all activity paused. All posts and data are preserved but hidden during deactivation.
                        </p>
                        <p className={styles.fieldNote} style={{ paddingLeft: 0, margin: '10px 0' }}>
                            You can reactivate your account by simply logging back in within 30 days.
                        </p>

                        <label className={styles.modalLabel}>Confirm Password to Deactivate</label>
                        <input
                            type="password"
                            className={styles.modalInput}
                            value={deactivatePassword}
                            onChange={(e) => setDeactivatePassword(e.target.value)}
                        />

                        <div className={styles.modalActions} style={{ marginTop: '20px' }}>
                            <button className={styles.settingActionBtn} onClick={() => setActiveModal(null)}>Cancel</button>
                            <button
                                className={styles.primaryBtn}
                                disabled={!deactivatePassword}
                                onClick={() => { alert("Account successfully deactivated. You will now be logged out."); setActiveModal(null); }}
                            >
                                Deactivate
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeModal === 'delete' && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent} style={{ borderColor: '#D4145A' }}>
                        <h3 style={{ color: '#D4145A' }}>Irreversible Destructive Execution Warning</h3>
                        <p className={styles.settingDescription} style={{ color: '#fff', fontWeight: 500 }}>This completely deletes all account data parameters, associated posts, network configurations, and direct chat logs instantly. Data drops are permanent.</p>
                        <p className={styles.fieldNote} style={{ paddingLeft: 0, margin: '10px 0' }}>A 24-hour baseline grace window sequence security automated verification mail tracking link will trigger prior to execution.</p>

                        <label className={styles.modalLabel}>Type "DELETE" to authorize sequence tracking</label>
                        <input type="text" className={styles.modalInput} placeholder="DELETE" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} />

                        <label className={styles.modalLabel}>Confirm Accountability Password</label>
                        <input type="password" className={styles.modalInput} value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} />

                        <div className={styles.modalActions} style={{ marginTop: '20px' }}>
                            <button className={styles.settingActionBtn} onClick={() => setActiveModal(null)}>Abort</button>
                            <button className={styles.deleteBtn} disabled={deleteConfirmText !== 'DELETE' || !deletePassword} onClick={() => { alert("Destructive sequence initialized. Final 24h grace tracking check link sent via mail context registry."); setActiveModal(null); }}>Permanently Remove Account</button>
                        </div>
                    </div>
                </div>
            )}

            {activeModal === 'blocked' && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent} style={{ maxWidth: '500px', width: '90%' }}>
                        <h3>Manage Blocked Accounts</h3>
                        <p className={styles.settingDescription} style={{ marginBottom: '14px' }}>Blocked entities cannot target your view frame profiles, send chats, or review posts.</p>

                        <input type="text" placeholder="Search blocked users by username..." className={styles.modalInput} value={blockedSearch} onChange={(e) => setBlockedSearch(e.target.value)} />

                        <div className={styles.blockedListContainer}>
                            {blockedUsers.filter(u => u.username.toLowerCase().includes(blockedSearch.toLowerCase())).length === 0 ? (
                                <p className={styles.emptyStateText}>You haven't blocked anyone matching those query metrics.</p>
                            ) : (
                                blockedUsers.filter(u => u.username.toLowerCase().includes(blockedSearch.toLowerCase())).map(user => (
                                    <div key={user.id} className={styles.blockedUserRow}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <img src={user.pfp} alt={user.username} className={styles.blockedPfp} />
                                            <div>
                                                <p style={{ margin: 0, fontWeight: 600, color: '#fff' }}>@{user.username}</p>
                                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#B3B3B3' }}>{user.university} University</p>
                                            </div>
                                        </div>
                                        <button className={styles.settingActionBtn} style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={() => setBlockedUsers(blockedUsers.filter(u => u.id !== user.id))}>Unblock</button>
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
        </div>
    );
}