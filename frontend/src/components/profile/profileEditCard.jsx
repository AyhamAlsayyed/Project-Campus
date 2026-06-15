import {
    User, UserPlus, Bell, Users, Settings,
    Languages, Home, HelpCircle, MessageSquare,
    Menu, X, Search, Check, MoreHorizontal,
    Volume2, Calendar, Heart, ChevronLeft,
    Upload, Trash2, Mail, Phone, Edit2
} from "lucide-react";
import { useState } from "react";
import BackBtn from '../../Assets/icons/arrow-left.png'
import { useRef, useEffect } from "react";
import Camera from '../../Assets/icons/camera.png'
import MailIcon from '../../Assets/icons/mail.png'
import EditIcon from '../../Assets/icons/edit.png'
import BirthdayIcon from '../../Assets/icons/cake.png'
import PhoneIcon from '../../Assets/icons/phone.png'
import EducationIcon from '../../Assets/icons/education.png'
import ProfilePicture from '../../Assets/icons/default-pfp.png';


const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const firstDay = (y, m) => new Date(y, m, 1).getDay();

const SubLabel = ({ children, topPad = true }) => (
    <div style={{
        padding: topPad ? '10px 0 4px' : '4px 0 4px',
        color: '#666', fontSize: 11, fontWeight: 600,
        letterSpacing: '0.06em', textTransform: 'uppercase'
    }}>
        {children}
    </div>
);

export default function ProfileEditCard({ styles, edit, setIsEditing, user, API, token, theme }) {
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, target: null });

    // Degrees
    const [showAddDegree, setShowAddDegree] = useState(false);
    const [newDegree, setNewDegree] = useState({ title: '', field: '' });
    const [editingDegreeIdx, setEditingDegreeIdx] = useState(null);
    const [editingDegree, setEditingDegree] = useState({ title: '', field: '', institution: '' });

    // Education (instructor only)
    const [showAddEducation, setShowAddEducation] = useState(false);
    const [newEducation, setNewEducation] = useState({ institution: '', degree: '' });


    const [showAddPosition, setShowAddPosition] = useState(false);
    const [newPosition, setNewPosition] = useState({ institution: '', type: 'parttime' });

    const isInstructor = user?.role === 'instructor';
    const cameraButtonRef = useRef(null);
    const [coverDropdownPos, setCoverDropdownPos] = useState({ top: 0, left: 0 });
    const [showPicksModal, setShowPicksModal] = useState(false);
    const [joinedCommunities, setJoinedCommunities] = useState([]);
    const [picksLoading, setPicksLoading] = useState(false);
    const [showTitleDropdown, setShowTitleDropdown] = useState(false);
    const [titleDropdownPos, setTitleDropdownPos] = useState({ top: 0, left: 0 });
    const titleBtnRef = useRef(null);
    // Add these state variables near your other edit states
    const [secondaryEmailOtpSent, setSecondaryEmailOtpSent] = useState(false);
    const [secondaryEmailOtp, setSecondaryEmailOtp] = useState('');
    const [secondaryEmailOtpStatus, setSecondaryEmailOtpStatus] = useState(null); // 'success' | 'error' | null
    const [secondaryEmailVerified, setSecondaryEmailVerified] = useState(false);
    const [secondaryEmailOtpLoading, setSecondaryEmailOtpLoading] = useState(false);

    const handleSendSecondaryEmailCode = async () => {
        if (!formData.secondaryEmail?.trim()) return;
        setSecondaryEmailOtpLoading(true);
        setSecondaryEmailOtpStatus(null);
        try {
            const res = await fetch(`${API}/api/auth/send_code/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    
                    personalEmail: formData.secondaryEmail.trim(),
                })
            });
            if (res.ok) {
                setSecondaryEmailOtpSent(true);
            } else {
                const data = await res.json();
                setSecondaryEmailOtpStatus('error');
                console.error(data.message);
            }
        } catch (e) { console.error(e); setSecondaryEmailOtpStatus('error'); }
        finally { setSecondaryEmailOtpLoading(false); }
    };

    const handleVerifySecondaryEmailCode = async () => {
        if (!secondaryEmailOtp.trim()) return;
        setSecondaryEmailOtpLoading(true);
        try {
            const res = await fetch(`${API}/api/auth/verify_code/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    personalEmail: formData.secondaryEmail.trim(),
                    code: secondaryEmailOtp.trim(),
                })
            });
            if (res.ok) {
                setSecondaryEmailVerified(true);
                setSecondaryEmailOtpStatus('success');
                setSecondaryEmailOtpSent(false);
            } else {
                setSecondaryEmailOtpStatus('error');
            }
        } catch (e) { setSecondaryEmailOtpStatus('error'); }
        finally { setSecondaryEmailOtpLoading(false); }
    };
    const isLight = theme === 'light';
    useEffect(() => {
        if (!showTitleDropdown) return;
        const close = () => setShowTitleDropdown(false);
        document.addEventListener('mousedown', close);
        document.addEventListener('scroll', close, true);
        return () => {
            document.removeEventListener('mousedown', close);
            document.removeEventListener('scroll', close, true);
        };
    }, [showTitleDropdown]);




    const handleConfirmDelete = () => {
        if (deleteConfirm.target === 'avatar') {
            setAvatarFile(null);
            setAvatarPreview(null);
        } else if (deleteConfirm.target === 'cover') {
            setCoverFile(null);
            setCoverPreview(null);
            setShowCoverDropdown(false);
        }
        setDeleteConfirm({ isOpen: false, target: null });
    };

    const {
        formData, setFormData, usernameError,
        avatarPreview, setAvatarFile, setAvatarPreview,
        coverPreview, setCoverFile, setCoverPreview,
        showCoverDropdown, setShowCoverDropdown,
        showCalendar, setShowCalendar,
        calViewDate, setCalViewDate,
        editView, setEditView, editSaving,
        avatarInputRef, coverInputRef, otpRefs,
        verifyTarget, otpDigits, otpError, otpLoading,
        handleUsernameChange, handleAvatarChange, handleCoverChange,
        handleSendOtp, handleOtpChange, handleOtpKeyDown, handleCheckOtp,
        handleEditSave, handleEditCancel,
        usernameChecking,
    } = edit;
    useEffect(() => {
        if (!showCoverDropdown) return;
        const close = () => setShowCoverDropdown(false);
        document.addEventListener('mousedown', close);
        document.addEventListener('scroll', close, true); // ← true catches scroll on any element
        return () => {
            document.removeEventListener('mousedown', close);
            document.removeEventListener('scroll', close, true);
        };
    }, [showCoverDropdown]);

    // Shared input style


    return (
        <div className={styles.editCard}>

            {/* ── Header ── */}
            <div className={styles.editHeader}>
                <div className={styles.flexAlign}>
                    <button className={styles.backBtn} onClick={() => setIsEditing(false)}>
                        <img
                            src={BackBtn}
                            alt="back"
                            style={{ filter: 'brightness(0) invert(0.9)', width: 22, height: 22 }}
                        />
                    </button>
                    <h1 className={styles.whiteHeaderText}>Edit Your Profile</h1>
                </div>
                <div className={styles.editActions}>
                    <button className={styles.cancelLink} onClick={handleEditCancel}>Cancel</button>
                    <button className={styles.savePill} onClick={handleEditSave} disabled={!!usernameError || editSaving}>
                        {editSaving ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </div>

            {/* ── Media Area ── */}
            <div style={{ display: "flex", gap: 20, alignItems: "stretch", padding: "0 24px", maxHeight: 210, marginBottom: 0 }}>

                {/* Avatar column */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <div className={styles.avatarEditGroup} onClick={() => avatarInputRef.current?.click()}>
                        <div className={styles.editAvatarCircle} style={{ width: 130, height: 130 }}>
                            <img
                                src={avatarPreview || ProfilePicture}
                                alt="avatar"
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                onError={e => { e.currentTarget.src = ProfilePicture; }}
                            />
                        </div>
                        <div style={{ display: "flex", gap: 16 }} onClick={e => e.stopPropagation()}>
                            <button
                                className={`${styles.mediaTextBtn} ${styles.deleteText}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirm({ isOpen: true, target: 'avatar' });
                                }}
                            >
                                <Trash2 size={14} /> Delete
                            </button>
                            <button className={styles.mediaTextBtn} onClick={() => avatarInputRef.current?.click()}>
                                <Upload size={14} /> Upload
                            </button>
                            <input hidden ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} />
                        </div>
                    </div>
                </div>

                {/* Cover */}
                {/* Cover */}
                <div style={{ flex: 1, position: "relative" }}>
                    <div style={{
                        width: "100%", minHeight: 180, height: "100%",
                        background: "#2a2a2a", borderRadius: 16,
                        overflow: "hidden", position: "relative"
                    }}>
                        {coverPreview && (
                            <img src={coverPreview} alt="cover"
                                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        )}
                        <button
                            ref={cameraButtonRef}
                            className={styles.centeredCameraBtn}
                            style={{ position: "absolute", bottom: 10, right: 10, top: "auto", left: "auto", transform: "none" }}
                            onClick={(e) => {
                                e.stopPropagation();
                                const rect = cameraButtonRef.current.getBoundingClientRect();
                                setCoverDropdownPos({
                                    top: rect.bottom + 8,
                                    left: rect.right,
                                });
                                setShowCoverDropdown(p => !p);
                            }}
                        >
                            <img
                                src={Camera}
                                alt="back"
                                style={{ filter: 'brightness(0) invert(0.9)', width: 22, height: 22 }}
                            />
                        </button>

                        <input hidden ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverChange} />
                    </div>

                    {/* Fixed dropdown — never moves on scroll */}
                    {showCoverDropdown && (
                        <div
                            onMouseDown={e => e.stopPropagation()}
                            style={{
                                position: "fixed",
                                top: coverDropdownPos.top,
                                left: coverDropdownPos.left,
                                transform: "translateX(-100%)",
                                background: "#333333",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: 15, padding: "6px 0",
                                minWidth: 140, zIndex: 9999,
                                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                            }}
                        >
                            <button
                                onClick={() => { coverInputRef.current?.click(); setShowCoverDropdown(false); }}
                                style={{
                                    display: "flex", alignItems: "center", gap: 10,
                                    width: "100%", padding: "10px 16px",
                                    background: "transparent", border: "none",
                                    color: "rgba(255,255,255,0.85)", fontSize: "0.88rem",
                                    fontWeight: 500, cursor: "pointer",
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                            >
                                <Upload size={14} /> Upload
                            </button>
                            <div style={{ height: 1, width: "60%", background: '#4D4D4D', margin: '4px auto' }} />
                            <button
                                onClick={() => { setDeleteConfirm({ isOpen: true, target: 'cover' }); setShowCoverDropdown(false); }}
                                style={{
                                    display: "flex", alignItems: "center", gap: 10,
                                    width: "100%", padding: "10px 16px",
                                    background: "transparent", border: "none",
                                    color: "#e91e63", fontSize: "0.88rem",
                                    fontWeight: 500, cursor: "pointer",
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(233,30,99,0.08)"}
                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                            >
                                <Trash2 size={14} /> Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Form ── */}
            <div className={styles.editForm} style={{ padding: "20px 24px 24px" }}>

                {/* Input grid + Bio */}
                <div style={{ display: "flex", gap: 16, marginBottom: 4, alignItems: "stretch" }}>
                    {/* Left: 2×2 inputs */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>

                        {isInstructor ? (
                            <>

                                <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>

                                    {/* Title button */}
                                    <button
                                        ref={titleBtnRef}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const rect = titleBtnRef.current.getBoundingClientRect();
                                            setTitleDropdownPos({ top: rect.bottom + 8, left: rect.left });
                                            setShowTitleDropdown(p => !p);
                                        }}
                                        style={{
                                            background: "#262626", border: "1px solid #444",
                                            borderRadius: 24, padding: "14px 40px 14px 15px", color: "white",
                                            outline: "none", fontSize: 14, boxSizing: "border-box",
                                            cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                                            display: "flex", justifyContent: "flex-start"
                                        }}
                                    >
                                        {formData.title || 'Title'}
                                    </button>

                                    {/* Arrow — sits between title and username */}
                                    <img
                                        src={BackBtn}
                                        alt=""
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const rect = titleBtnRef.current.getBoundingClientRect();
                                            setTitleDropdownPos({ top: rect.bottom + 8, left: rect.left });
                                            setShowTitleDropdown(p => !p);
                                        }}
                                        style={{
                                            width: 14, height: 14,
                                            filter: 'brightness(0) invert(0.6)',
                                            transform: 'rotate(-90deg)',
                                            cursor: 'pointer',
                                            flexShrink: 0,
                                            alignSelf: 'center'
                                        }}
                                    />

                                    {/* Title dropdown — fixed, anchored to title button */}
                                    {showTitleDropdown && (
                                        <div
                                            onMouseDown={e => e.stopPropagation()}
                                            style={{
                                                position: "fixed",
                                                top: titleDropdownPos.top,
                                                left: titleDropdownPos.left,
                                                background: "#2c2c2c",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                borderRadius: 12, padding: "6px 0",
                                                minWidth: 120, zIndex: 9999,
                                                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                                            }}
                                        >
                                            {['Mr.', 'Mrs.', 'Dr.', 'Prof.'].map((t, i, arr) => (
                                                <div key={t}>
                                                    <button
                                                        onClick={() => {
                                                            setFormData(p => ({ ...p, title: t }));
                                                            setShowTitleDropdown(false);
                                                        }}
                                                        className={styles.editFormInput}
                                                        style={{ borderRadius: 24, padding: "14px 40px 14px 15px", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, display: "flex", justifyContent: "flex-start" }}
                                                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                                                        onMouseLeave={e => e.currentTarget.style.background = formData.title === t ? "rgba(255,255,255,0.06)" : "transparent"}
                                                    >
                                                        {t}
                                                    </button>
                                                    {i < arr.length - 1 && (
                                                        <div style={{ height: 1, width: "50%", background: '#4D4D4D', margin: '2px auto' }} />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Username */}
                                    <input
                                        className={`${styles.editFormInput} ${usernameError ? styles.editFormInputError : (!usernameChecking && formData.username && formData.username !== user?.username ? styles.editFormInputValid : '')}`}
                                        style={{ flex: 1 }}
                                        type="text"
                                        value={formData.username}
                                        placeholder="Username"
                                        onChange={e => handleUsernameChange(e.target.value)}
                                    />
                                </div>

                                {/* Row 2: Full name — matches full width of row above */}
                                <input
                                    className={styles.editFormInput}
                                    type="text"
                                    value={formData.fullName}
                                    placeholder="Full Name"
                                    onChange={e => setFormData(p => ({ ...p, fullName: e.target.value }))}
                                />

                                {/* Row 3: University (read-only) + Major */}
                                <div style={{ display: "flex", gap: 12 }}>
                                    <input
                                        readOnly
                                        className={styles.editFormInputReadOnly}
                                        type="text"
                                        value={formData.university}
                                        placeholder="University"
                                    />
                                    <input
                                        className={styles.editFormInput}
                                        type="text"
                                        value={formData.major}
                                        placeholder="Major"
                                        onChange={e => setFormData(p => ({ ...p, major: e.target.value }))}
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Student layout — original 2x2 */}
                                <div style={{ display: "flex", gap: 12 }}>
                                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                                        <input
                                            className={`${styles.editFormInput} ${usernameError ? styles.editFormInputError : ''}`}
                                            type="text"
                                            value={formData.username}
                                            placeholder="Username"
                                            onChange={e => handleUsernameChange(e.target.value)}
                                        />
                                    </div>
                                    <input
                                        className={styles.editFormInput}
                                        style={{ flex: 1 }}
                                        type="text"
                                        value={formData.fullName}
                                        placeholder="Real Name"
                                        onChange={e => setFormData(p => ({ ...p, fullName: e.target.value }))}
                                    />
                                </div>
                                <div style={{ display: "flex", gap: 12 }}>
                                    <input
                                        readOnly
                                        className={styles.editFormInputReadOnly}
                                        style={{ opacity: 0.4 }}
                                        type="text"
                                        value={formData.university}
                                        placeholder="University"
                                    />
                                    <input
                                        className={styles.editFormInput}
                                        style={{ flex: 1 }}
                                        type="text"
                                        value={formData.major}
                                        placeholder="Major"
                                        onChange={e => setFormData(p => ({ ...p, major: e.target.value }))}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {/* Right: Bio */}
                    <div className={styles.editFormBioWrap}>
                        <textarea
                            value={formData.bio}
                            placeholder="Bio..."
                            onChange={e => setFormData(p => ({ ...p, bio: e.target.value }))}
                            className={styles.editFormBioTextarea}
                        />
                    </div>
                </div>

                {usernameError && (
                    <p style={{ color: "#ff4b4b", fontSize: 11, margin: "4px 0 0 4px", lineHeight: 1.4 }}>
                        {usernameError}
                    </p>
                )}

                <div className={styles.editFormDividerLine} />




                {/* Details header */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 24, marginBottom: 24 }}>
                    <h2 className={styles.detailsTitleMain}>Details</h2>
                    <p className={styles.detailsSubtextHeader}>
                        Please provide accurate profile information, as errors may affect your account. You can adjust your privacy
                        settings to control profile visibility.
                    </p>
                </div>

                {/* Inset fields panel */}
                <div className={styles.insetFieldsPanel}>

                    {/* ── Contact Info ── */}
                    <div className={styles.sectionLabelDivider}>
                        <span>Contact Info</span>
                        <div className={styles.dividerLine} />
                    </div>

                    <div className={styles.detailFieldItem}>
                        <span>
                            <img src={MailIcon} alt="" style={{ width: 20, height: 20, filter: 'brightness(0) invert(0.53)' }} />
                            Primary Email
                        </span>
                        <span className={styles.fieldValueText}>{formData.primaryEmail || 'username@gmail.com'}</span>
                        <img src={EditIcon} alt="edit" style={{ width: 20, height: 20, filter: 'brightness(0) invert(0.7)', cursor: 'pointer' }} onClick={() => setEditView("email")} />
                    </div>

                    <div className={styles.detailFieldItem}>
                        <span>
                            <img src={MailIcon} alt="" style={{ width: 20, height: 20, filter: 'brightness(0) invert(0.53)' }} />
                            Personal Email
                        </span>
                        <span className={styles.fieldValueText}>{formData.secondaryEmail}</span>
                        <img src={EditIcon} alt="edit" style={{ width: 20, height: 20, filter: 'brightness(0) invert(0.7)', cursor: 'pointer' }} onClick={() => setEditView("email")} />
                    </div>

                    <div className={styles.detailFieldItem}>
                        <span>
                            <img src={PhoneIcon} alt="" style={{ width: 20, height: 20, filter: 'brightness(0) invert(0.53)' }} />
                            Primary Phone
                        </span>
                        <span className={styles.fieldValueText}>{formData.primaryPhone || '—'}</span>
                        <img src={EditIcon} alt="edit" style={{ width: 20, height: 20, filter: 'brightness(0) invert(0.7)', cursor: 'pointer' }} onClick={() => setEditView("phone")} />
                    </div>

                    {formData.secondaryPhone && (
                        <div className={styles.detailFieldItem}>
                            <span>
                                <img src={PhoneIcon} alt="" style={{ width: 20, height: 20, filter: 'brightness(0) invert(0.53)' }} />
                                Secondary Phone
                            </span>
                            <span className={styles.fieldValueText}>{formData.secondaryPhone}</span>
                            <img src={EditIcon} alt="edit" style={{ width: 20, height: 20, filter: 'brightness(0) invert(0.7)', cursor: 'pointer' }} onClick={() => setEditView("phone")} />
                        </div>
                    )}
                    {/* ── Personal Details ── */}
                    <div className={styles.sectionLabelDivider}>
                        <span>Personal Details</span>
                        <div className={styles.dividerLine} />
                    </div>

                    {/* Birthday */}
                    <div className={styles.detailFieldItem}>
                        <span>
                            <img src={BirthdayIcon} alt="" style={{ width: 20, height: 20, filter: 'brightness(0) invert(0.7)' }} />
                            Birthday
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: "40%" }}>
                            <input
                                type="text"
                                maxLength={2}
                                placeholder="MM"
                                value={formData.birthday.month}
                                onChange={e => setFormData(p => ({ ...p, birthday: { ...p.birthday, month: e.target.value } }))}
                                className={styles.editFormBirthdayInput} style={{ width: 48 }}
                            />
                            <span className={styles.editFormBirthdaySep}>/</span>
                            <input
                                type="text"
                                maxLength={2}
                                placeholder="DD"
                                value={formData.birthday.day}
                                onChange={e => setFormData(p => ({ ...p, birthday: { ...p.birthday, day: e.target.value } }))}
                                className={styles.editFormBirthdayInput} style={{ width: 48 }}
                            />
                            <span className={styles.editFormBirthdaySep}>/</span>
                            <input
                                type="text"
                                maxLength={4}
                                placeholder="YYYY"
                                value={formData.birthday.year}
                                onChange={e => setFormData(p => ({ ...p, birthday: { ...p.birthday, year: e.target.value } }))}
                                className={styles.editFormBirthdayInput} style={{ width: 64 }}
                            />
                        </div>
                    </div>
                    {/* ── Degrees (students only) ── */}
                    {!isInstructor && (
                        <>
                            <SubLabel>Degrees</SubLabel>
                            {(formData.degrees || []).map((deg, i) => (
                                <div key={i}>
                                    {editingDegreeIdx === i ? (
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 0', flexWrap: 'wrap' }}>
                                            <select
                                                value={editingDegree.title}
                                                onChange={e => setEditingDegree(p => ({ ...p, title: e.target.value }))}
                                                className={styles.editFormInlineInput} style={{ flex: 1 }}
                                            >
                                                <option value="">Degree type</option>
                                                <option value="High School Diploma">Diploma</option>
                                                <option value="Bachelor's">Bachelor's</option>
                                                <option value="Master's">Master's</option>
                                                <option value="PhD">PhD</option>
                                            </select>
                                            <input
                                                placeholder="Field e.g. Computer Science"
                                                value={editingDegree.field}
                                                onChange={e => setEditingDegree(p => ({ ...p, field: e.target.value }))}
                                                className={styles.editFormInlineInput} style={{ flex: 1.5 }}
                                            />
                                            <input
                                                placeholder="Institution e.g. Harvard University"
                                                value={editingDegree.institution}
                                                onChange={e => setEditingDegree(p => ({ ...p, institution: e.target.value }))}
                                                className={styles.editFormInlineInput} style={{ flex: 1.5 }}

                                            />
                                            <button
                                                className={styles.editFormAddBtn}
                                                onClick={() => {
                                                    if (!editingDegree.title.trim()) return;
                                                    setFormData(p => ({
                                                        ...p,
                                                        degrees: p.degrees.map((d, idx) => idx === i ? editingDegree : d)
                                                    }));
                                                    setEditingDegreeIdx(null);
                                                }}
                                            >
                                                Save
                                            </button>
                                            <button className={styles.editFormCancelIconBtn} onClick={() => setEditingDegreeIdx(null)}>
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div key={i} className={styles.detailFieldItem}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: 16 }}>🎓</span>
                                                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
                                                    {deg.title}{deg.field ? ` — ${deg.field}` : ''}{deg.institution ? ` · ${deg.institution}` : ''}
                                                </span>
                                            </span>
                                            <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
                                                <button
                                                    style={{ background: 'transparent', border: 'none', color: '#c084fc', cursor: 'pointer', padding: 4 }}
                                                    onClick={() => { setEditingDegreeIdx(i); setEditingDegree(deg); }}
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    className={styles.editFormTrashBtn}
                                                    onClick={() => setFormData(p => ({ ...p, degrees: p.degrees.filter((_, idx) => idx !== i) }))}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {showAddDegree ? (
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 0', flexWrap: 'wrap' }}>
                                    <select
                                        value={newDegree.title}
                                        onChange={e => setNewDegree(p => ({ ...p, title: e.target.value }))}
                                        className={styles.editFormInlineInput} style={{ flex: 1 }}

                                    >
                                        <option value="">Degree type</option>
                                        <option value="High School Diploma">Diploma</option>
                                        <option value="Bachelor's">Bachelor's</option>
                                        <option value="Master's">Master's</option>
                                        <option value="PhD">PhD</option>
                                    </select>
                                    <input
                                        placeholder="Field e.g. Computer Science"
                                        value={newDegree.field}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setNewDegree(p => ({ ...p, field: val.charAt(0).toUpperCase() + val.slice(1) }));
                                        }}
                                        className={styles.editFormInlineInput} style={{ flex: 1.5 }}

                                    />
                                    <input
                                        placeholder="Institution e.g. Harvard University"
                                        value={newDegree.institution}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setNewDegree(p => ({ ...p, institution: val.charAt(0).toUpperCase() + val.slice(1) }));
                                        }}
                                        className={styles.editFormInlineInput} style={{ flex: 1.5 }}

                                    />
                                    <button
                                        className={styles.editFormAddBtn}
                                        onClick={() => {
                                            if (!newDegree.title.trim()) return;
                                            setFormData(p => ({ ...p, degrees: [...(p.degrees || []), newDegree] }));
                                            setNewDegree({ title: '', field: '', institution: '' });
                                            setShowAddDegree(false);
                                        }}
                                    >
                                        Add
                                    </button>
                                    <button className={styles.editFormCancelIconBtn} onClick={() => { setShowAddDegree(false); setNewDegree({ title: '', field: '', institution: '' }); }}>
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <button className={styles.editFormDashedBtn} onClick={() => setShowAddDegree(true)}>
                                    + Add Degree
                                </button>
                            )}
                        </>
                    )}

                    {/* ── Instructor only: Teaching Positions + Education ── */}
                    {isInstructor && (
                        <>
                            {/* Teaching Positions */}
                            <SubLabel>Teaching Positions</SubLabel>

                            {(formData.teachingPositions || []).map((pos, i) => (
                                <div key={i} className={styles.detailFieldItem}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: 16 }}>🏛️</span>
                                        <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
                                            {pos.institution_name || pos.institution}
                                        </span>
                                        <span style={{
                                            fontSize: 11, fontWeight: 600,
                                            background: (pos.employment_type || pos.type) === 'primary' ? 'rgba(139,45,255,0.15)' : 'rgba(255,180,0,0.12)',
                                            color: (pos.employment_type || pos.type) === 'primary' ? '#c084fc' : '#f59e0b',
                                            border: `1px solid ${(pos.employment_type || pos.type) === 'primary' ? 'rgba(139,45,255,0.3)' : 'rgba(245,158,11,0.3)'}`,
                                            borderRadius: 6, padding: '1px 7px'
                                        }}>
                                            {(pos.employment_type || pos.type) === 'primary' ? 'Primary' : 'Part-time'}
                                        </span>
                                    </span>
                                    <button
                                        className={styles.editFormTrashBtn}
                                        onClick={() => setFormData(p => ({ ...p, teachingPositions: p.teachingPositions.filter((_, idx) => idx !== i) }))}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}

                            {showAddPosition ? (
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 0', flexWrap: 'wrap' }}>
                                    <input
                                        placeholder="Institution name"
                                        value={newPosition.institution}
                                        onChange={e => setNewPosition(p => ({ ...p, institution: e.target.value }))}
                                        className={styles.editFormInlineInput} style={{ flex: 2 }}
                                    />
                                    <select
                                        value={newPosition.type}
                                        onChange={e => setNewPosition(p => ({ ...p, type: e.target.value }))}
                                        className={styles.editFormSelect} style={{ flex: 1 }}
                                    >
                                        <option value="primary">Primary</option>
                                        <option value="parttime">Part-time</option>
                                    </select>
                                    <button
                                        className={styles.editFormAddBtn}
                                        onClick={() => {
                                            if (!newPosition.institution.trim()) return;
                                            setFormData(p => ({ ...p, teachingPositions: [...(p.teachingPositions || []), newPosition] }));
                                            setNewPosition({ institution: '', type: 'parttime' });
                                            setShowAddPosition(false);
                                        }}
                                    >
                                        Add
                                    </button>
                                    <button className={styles.editFormCancelIconBtn} onClick={() => { setShowAddPosition(false); setNewPosition({ institution: '', type: 'parttime' }); }}>
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <button className={styles.editFormDashedBtn} onClick={() => setShowAddPosition(true)}>
                                    + Add Teaching Position
                                </button>
                            )}

                            {/* Education */}
                            <SubLabel>Education</SubLabel>

                            {(formData.degrees || []).map((deg, i) => (
                                <div key={i} className={styles.detailFieldItem}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: 16 }}> <img src={EducationIcon} style={{ width: 20, height: 20, filter: 'brightness(0) invert(0.53)' }} /></span>
                                        <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
                                            {deg.university || deg.institution}
                                        </span>
                                    </span>
                                    <button
                                        className={styles.editFormTrashBtn}
                                        onClick={() => setFormData(p => ({ ...p, degrees: p.degrees.filter((_, idx) => idx !== i) }))}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}

                            {showAddEducation ? (
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 0' }}>
                                    <input
                                        placeholder="Institution"
                                        value={newEducation.institution}
                                        onChange={e => setNewEducation(p => ({ ...p, institution: e.target.value }))}
                                        className={styles.editFormInlineInput} style={{ flex: 1.5 }}
                                    />
                                    <input
                                        placeholder="Degree obtained"
                                        value={newEducation.degree}
                                        onChange={e => setNewEducation(p => ({ ...p, degree: e.target.value }))}
                                        className={styles.editFormInlineInput} style={{ flex: 1 }}

                                    />
                                    <button
                                        className={styles.editFormAddBtn}
                                        onClick={() => {
                                            if (!newEducation.institution.trim()) return;
                                            setFormData(p => ({ ...p, educationEntries: [...(p.educationEntries || []), newEducation] }));
                                            setNewEducation({ institution: '', degree: '' });
                                            setShowAddEducation(false);
                                        }}
                                    >
                                        Add
                                    </button>
                                    <button className={styles.editFormCancelIconBtn} onClick={() => { setShowAddEducation(false); setNewEducation({ institution: '', degree: '' }); }}>
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <button className={styles.editFormDashedBtn} onClick={() => setShowAddEducation(true)}>
                                    + Add Education
                                </button>
                            )}
                        </>
                    )}

                </div>{/* end insetFieldsPanel */}
            </div>{/* end editForm */}

            {/* ══════════════════════════════════════
                PHONE EDIT POPUP
            ══════════════════════════════════════ */}
            {editView === "phone" && (
                <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} onClick={() => setEditView("main")} />
                    <div style={{
                        position: "relative", background: "#333333", borderRadius: 20,
                        padding: 28, width: 380, boxShadow: "0 20px 50px rgba(0,0,0,0.7)",
                        border: "1px solid rgba(255,255,255,0.08)"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <img src={PhoneIcon} alt="" style={{ width: 20, height: 20, filter: 'brightness(0) invert(0.53)' }} />                                <h3 style={{ margin: 0, color: "white", fontWeight: 700, fontSize: "1.1rem" }}>Phone</h3>
                            </div>
                            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                                <button onClick={() => setEditView("main")} style={{ background: "none", border: "none", color: "#e91e63", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" }}>Discard</button>
                                <button onClick={() => setEditView("main")} style={{ background: "none", border: "1px solid #444", color: "white", borderRadius: 20, padding: "6px 20px", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" }}>Save</button>
                            </div>
                        </div>
                        <div style={{ height: 1, background: "#4D4D4D", marginBottom: 20 }} />
                        <div style={{ marginBottom: 16, display: "flex", flexDirection: "row", alignItems: "center", gap: "15px" }}>
                            <label style={{ color: "#888", fontSize: "0.85rem", display: "block", marginBottom: 8 }}>Primary</label>
                            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                <input
                                    type="text"
                                    value={formData.primaryPhone}
                                    placeholder="Primary phone number"
                                    onChange={e => setFormData(p => ({ ...p, primaryPhone: e.target.value }))}
                                    style={{ flex: 1, background: "#262626", border: "1px solid #333", borderRadius: 25, padding: "11px 14px", color: "white", outline: "none", fontSize: "0.9rem" }}
                                />
                                <button
                                    onClick={() => handleSendOtp(formData.primaryPhone)}
                                    style={{ background: "#4D4D4D", color: "#D1D1D1", border: "none", borderRadius: 25, padding: "10px 16px", fontWeight: 600, cursor: "pointer", fontSize: "0.85rem", whiteSpace: "nowrap" }}
                                >
                                    Update
                                </button>
                            </div>
                        </div>
                        <div style={{ height: 1, background: "#4D4D4D", margin: "0 auto 20px auto", width: "50%" }} />
                        <div style={{ marginBottom: 16, display: "flex", flexDirection: "row", alignItems: "center", gap: "15px" }}>
                            <label style={{ color: "#888", fontSize: "0.85rem", display: "block", marginBottom: 8 }}>Secondary</label>
                            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                <input
                                    type="text"
                                    value={formData.secondaryPhone}
                                    placeholder="Add secondary number"
                                    onChange={e => setFormData(p => ({ ...p, secondaryPhone: e.target.value }))}
                                    style={{ flex: 1, background: "#262626", border: "1px solid #333", borderRadius: 25, padding: "11px 14px", color: "white", outline: "none", fontSize: "0.9rem" }}
                                />
                                <button
                                    onClick={() => handleSendOtp(formData.secondaryPhone)}
                                    style={{ background: "#4D4D4D", color: "#D1D1D1", border: "none", borderRadius: 25, padding: "10px 16px", fontWeight: 600, cursor: "pointer", fontSize: "0.85rem", whiteSpace: "nowrap" }}
                                >
                                    Verify
                                </button>
                                {formData.secondaryPhone && (
                                    <button
                                        onClick={() => setFormData(p => ({ ...p, secondaryPhone: '' }))}
                                        style={{ background: "transparent", border: "none", color: "#e91e63", cursor: "pointer", padding: 4 }}
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════
                EMAIL EDIT POPUP
            ══════════════════════════════════════ */}
            {editView === "email" && (
                <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} onClick={() => setEditView("main")} />
                    <div style={{
                        position: "relative", background: "#333333", borderRadius: 20,
                        padding: 28, width: 400, boxShadow: "0 20px 50px rgba(0,0,0,0.7)",
                        border: "1px solid rgba(255,255,255,0.08)"
                    }}>
                        {/* Header */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <Mail size={20} color="white" />
                                <h3 style={{ margin: 0, color: "white", fontWeight: 700, fontSize: "1.1rem" }}>Email</h3>
                            </div>
                            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                                <button onClick={() => setEditView("main")} style={{ background: "none", border: "none", color: "#e91e63", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" }}>Discard</button>
                                <button onClick={() => setEditView("main")} style={{ background: "none", border: "1px solid #444", color: "white", borderRadius: 20, padding: "6px 20px", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" }}>Save</button>
                            </div>
                        </div>
                        <div style={{ height: 1, background: "#4D4D4D", marginBottom: 20 }} />

                        {/* Academic Email — read only */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ color: "#888", fontSize: "0.85rem", display: "block", marginBottom: 8 }}>
                                Academic Email
                                <span style={{ color: "rgba(139,45,255,0.85)", fontSize: "0.72rem", background: "rgba(139,45,255,0.12)", border: "1px solid rgba(139,45,255,0.3)", borderRadius: 6, padding: "1px 6px", marginLeft: 6 }}>Read-only</span>
                            </label>
                            <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: "11px 14px", color: "rgba(255,255,255,0.45)", fontSize: "0.9rem" }}>
                                {formData.primaryEmail || 'username@university.edu'}
                            </div>
                        </div>

                        <div style={{ height: 1, background: "#4D4D4D", margin: "0 auto 20px auto", width: "50%" }} />

                        {/* Personal Email */}
                        <div>
                            <label style={{ color: "#888", fontSize: "0.85rem", display: "block", marginBottom: 8 }}>
                                Personal Email <span style={{ color: "#666", fontSize: "0.72rem" }}>(optional)</span>
                            </label>
                            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                <input
                                    type="email"
                                    value={formData.secondaryEmail}
                                    placeholder="Add personal email"
                                    onChange={e => {
                                        setFormData(p => ({ ...p, secondaryEmail: e.target.value }));
                                        setSecondaryEmailVerified(false);
                                        setSecondaryEmailOtpSent(false);
                                        setSecondaryEmailOtpStatus(null);
                                        setSecondaryEmailOtp('');
                                    }}
                                    style={{ flex: 1, background: "#262626", border: "1px solid #333", borderRadius: 25, padding: "11px 14px", color: "white", outline: "none", fontSize: "0.9rem" }}
                                />
                                {formData.secondaryEmail && !secondaryEmailVerified && (
                                    <button
                                        onClick={handleSendSecondaryEmailCode}
                                        disabled={secondaryEmailOtpLoading}
                                        style={{ background: "#4D4D4D", color: "#D1D1D1", border: "none", borderRadius: 25, padding: "10px 16px", fontWeight: 600, cursor: "pointer", fontSize: "0.85rem", whiteSpace: "nowrap", opacity: secondaryEmailOtpLoading ? 0.6 : 1 }}
                                    >
                                        {secondaryEmailOtpSent ? 'Resend' : 'Update'}
                                    </button>
                                )}
                                {secondaryEmailVerified && (
                                    <span style={{ color: "#4caf50", fontSize: "0.8rem", whiteSpace: "nowrap", fontWeight: 600 }}>✓ Verified</span>
                                )}
                                <button
                                    onClick={() => {
                                        setFormData(p => ({ ...p, secondaryEmail: '' }));
                                        setSecondaryEmailVerified(false);
                                        setSecondaryEmailOtpSent(false);
                                        setSecondaryEmailOtp('');
                                        setSecondaryEmailOtpStatus(null);
                                    }}
                                    style={{ background: "transparent", border: "none", color: "#e91e63", cursor: "pointer", padding: 4, opacity: formData.secondaryEmail ? 1 : 0, pointerEvents: formData.secondaryEmail ? 'auto' : 'none' }}
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════
    EMAIL OTP VERIFY POPUP
══════════════════════════════════════ */}
            {secondaryEmailOtpSent && editView === "email" && (
                <div style={{ position: "fixed", inset: 0, zIndex: 1001, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} onClick={() => setSecondaryEmailOtpSent(false)} />
                    <div style={{
                        position: "relative", background: "#1e1e1e", borderRadius: 20,
                        padding: 32, width: 420, boxShadow: "0 20px 50px rgba(0,0,0,0.7)",
                        border: "1px solid rgba(255,255,255,0.08)"
                    }}>
                        <h3 style={{ margin: "0 0 8px", color: "white", fontWeight: 700, fontSize: "1.05rem" }}>
                            Verifying email{" "}
                            <span style={{ color: "#c084fc" }}>
                                {formData.secondaryEmail?.replace(/(.{2}).*(@.*)/, '$1***$2')}
                            </span>
                        </h3>
                        <p style={{ margin: "0 0 24px", color: "#777", fontSize: "0.85rem", lineHeight: 1.5 }}>
                            A verification code was sent to your email. Do not share that code with anyone!
                        </p>

                        {/* 6 digit OTP boxes — same style as phone OTP */}
                        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 16 }}>
                            {secondaryEmailOtp.padEnd(6, ' ').split('').map((d, i) => (
                                <input
                                    key={i}
                                    type="text"
                                    maxLength={1}
                                    inputMode="numeric"
                                    value={secondaryEmailOtp[i] || ''}
                                    onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        const arr = secondaryEmailOtp.split('');
                                        arr[i] = val;
                                        const next = arr.join('').slice(0, 6);
                                        setSecondaryEmailOtp(next);
                                        setSecondaryEmailOtpStatus(null);
                                        // auto-focus next
                                        if (val && i < 5) {
                                            const inputs = e.target.closest('div').querySelectorAll('input');
                                            inputs[i + 1]?.focus();
                                        }
                                    }}
                                    onKeyDown={e => {
                                        if (e.key === 'Backspace' && !secondaryEmailOtp[i] && i > 0) {
                                            const inputs = e.target.closest('div').querySelectorAll('input');
                                            inputs[i - 1]?.focus();
                                        }
                                    }}
                                    style={{
                                        width: 52, height: 56,
                                        background: secondaryEmailOtp[i] ? "rgba(139,45,255,0.12)" : "transparent",
                                        border: `2px solid ${secondaryEmailOtp[i] ? "rgba(139,45,255,0.7)" : "rgba(139,45,255,0.45)"}`,
                                        borderRadius: 12, color: "white", fontSize: "1.3rem",
                                        fontWeight: 700, textAlign: "center", outline: "none",
                                        transition: "border-color 0.15s, background 0.15s"
                                    }}
                                />
                            ))}
                        </div>

                        {secondaryEmailOtpStatus === 'error' && (
                            <p style={{ color: "#ff4b4b", fontSize: "0.8rem", textAlign: "center", margin: "0 0 12px" }}>
                                Invalid code. Please try again.
                            </p>
                        )}

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                            <button
                                onClick={handleSendSecondaryEmailCode}
                                disabled={secondaryEmailOtpLoading}
                                style={{ background: "none", border: "none", color: "#888", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" }}
                            >
                                Resend
                            </button>
                            <button
                                onClick={handleVerifySecondaryEmailCode}
                                disabled={secondaryEmailOtpLoading || secondaryEmailOtp.length < 6}
                                style={{
                                    background: "linear-gradient(30deg, #5E23A4, #9C269D)",
                                    border: "none", color: "white", borderRadius: 20,
                                    padding: "10px 36px", fontWeight: 600,
                                    cursor: secondaryEmailOtp.length < 6 ? "not-allowed" : "pointer",
                                    fontSize: "0.9rem", opacity: (secondaryEmailOtpLoading || secondaryEmailOtp.length < 6) ? 0.6 : 1
                                }}
                            >
                                {secondaryEmailOtpLoading ? '…' : 'Verify'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════
                OTP VERIFICATION POPUP
            ══════════════════════════════════════ */}
            {editView === "verify" && (
                <div style={{ position: "fixed", inset: 0, zIndex: 1001, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} onClick={() => setEditView("phone")} />
                    <div style={{
                        position: "relative", background: "#1e1e1e", borderRadius: 20,
                        padding: 32, width: 420, boxShadow: "0 20px 50px rgba(0,0,0,0.7)",
                        border: "1px solid rgba(255,255,255,0.08)"
                    }}>
                        <h3 style={{ margin: "0 0 8px", color: "white", fontWeight: 700, fontSize: "1.05rem" }}>
                            Verifying number{" "}
                            <span style={{ color: "#c084fc" }}>
                                {verifyTarget.replace(/^(\d{3})(\d+)(\d{2})$/, '$1***$3')}
                            </span>
                        </h3>
                        <p style={{ margin: "0 0 24px", color: "#777", fontSize: "0.85rem", lineHeight: 1.5 }}>
                            A verification code was sent via SMS, check your messages. Do not share that code with anyone!
                        </p>
                        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 16 }}>
                            {otpDigits.map((d, i) => (
                                <input
                                    key={i}
                                    ref={otpRefs[i]}
                                    type="text"
                                    maxLength={1}
                                    inputMode="numeric"
                                    value={d}
                                    onChange={e => handleOtpChange(i, e.target.value)}
                                    onKeyDown={e => handleOtpKeyDown(i, e)}
                                    style={{
                                        width: 52, height: 56,
                                        background: d ? "rgba(139,45,255,0.12)" : "transparent",
                                        border: `2px solid ${d ? "rgba(139,45,255,0.7)" : "rgba(139,45,255,0.45)"}`,
                                        borderRadius: 12, color: "white", fontSize: "1.3rem",
                                        fontWeight: 700, textAlign: "center", outline: "none",
                                        transition: "border-color 0.15s, background 0.15s"
                                    }}
                                />
                            ))}
                        </div>
                        {otpError && <p style={{ color: "#ff4b4b", fontSize: "0.8rem", textAlign: "center", margin: "0 0 12px" }}>{otpError}</p>}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                            <button
                                onClick={() => handleSendOtp(verifyTarget)}
                                style={{ background: "none", border: "none", color: "#888", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" }}
                            >
                                Resend
                            </button>
                            <button
                                onClick={handleCheckOtp}
                                disabled={otpLoading}
                                style={{
                                    background: "linear-gradient(30deg, #5E23A4, #9C269D)",
                                    border: "none", color: "white", borderRadius: 20,
                                    padding: "10px 36px", fontWeight: 600,
                                    cursor: otpLoading ? "not-allowed" : "pointer",
                                    fontSize: "0.9rem", opacity: otpLoading ? 0.6 : 1
                                }}
                            >
                                {otpLoading ? '…' : 'Check'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════
                DELETE CONFIRM MODAL
            ══════════════════════════════════════ */}
            {deleteConfirm.isOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.confirmModal}>
                        <h3 style={{ margin: "0 0 10px 0", color: "white", fontSize: "18px" }}>Remove Image</h3>
                        <p style={{ margin: "0 0 20px 0", color: "#aaa", fontSize: "14px", lineHeight: "1.4" }}>
                            Are you sure you want to remove your {deleteConfirm.target === 'avatar' ? 'profile picture' : 'banner'}? This cannot be undone.
                        </p>
                        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                            <button className={styles.modalCancelBtn} onClick={() => setDeleteConfirm({ isOpen: false, target: null })}>
                                Cancel
                            </button>
                            <button className={styles.modalConfirmBtn} onClick={handleConfirmDelete}>
                                Yes, remove it
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ══════════════════════════════════════
    COMMUNITY PICKS MODAL
══════════════════════════════════════ */}
            {showPicksModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'
                }}
                    onClick={() => setShowPicksModal(false)}
                >
                    <div style={{
                        position: 'relative', background: '#333333', borderRadius: 24,
                        padding: 32, width: '90%', maxWidth: 650,
                        maxHeight: '80vh', display: 'flex', flexDirection: 'column',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)', boxSizing: 'border-box'
                    }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', marginBottom: 24,
                            paddingBottom: 16, borderBottom: '1px solid #4D4D4D'
                        }}>
                            <div>
                                <h2 style={{ margin: 0, color: '#E6E6E6', fontSize: '1.4rem', fontWeight: 600 }}>
                                    Community Picks
                                </h2>
                                <p style={{ margin: '4px 0 0', color: '#808080', fontSize: '0.8rem' }}>
                                    Select up to 3 communities to feature on your profile
                                </p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <span style={{ color: '#B3B3B3', fontSize: '0.9rem', fontWeight: 500 }}>
                                    {(formData.communityPicks || []).length}/3
                                </span>
                                <button
                                    onClick={() => setShowPicksModal(false)}
                                    style={{
                                        background: 'none', border: 'none',
                                        color: '#808080', fontSize: '1.5rem',
                                        cursor: 'pointer', lineHeight: 1, padding: 0
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* List */}
                        <div style={{
                            flex: 1, overflowY: 'auto',
                            display: 'flex', flexDirection: 'column', gap: 12,
                            paddingRight: 8
                        }}>
                            {picksLoading ? (
                                <p style={{ color: '#808080', textAlign: 'center', marginTop: 40 }}>Loading...</p>
                            ) : joinedCommunities.length === 0 ? (
                                <p style={{ color: '#808080', textAlign: 'center', marginTop: 40 }}>
                                    You haven't joined any communities yet.
                                </p>
                            ) : joinedCommunities.map(community => {
                                const isPicked = (formData.communityPicks || []).some(p => p.id === community.id);
                                const atLimit = (formData.communityPicks || []).length >= 3;

                                return (
                                    <div key={community.id} style={{ position: 'relative' }}>
                                        {/* CommunityCard with Pick button overlay */}
                                        <div style={{
                                            borderRadius: 16, overflow: 'hidden',
                                            backgroundImage: `linear-gradient(to right, rgba(25,25,25,0.95) 10%, rgba(25,25,25,0.7) 40%, rgba(25,25,25,0.2) 100%), url(${community.image})`,
                                            backgroundSize: 'cover', backgroundPosition: 'center',
                                            padding: '16px 20px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            border: isPicked ? '1px solid rgba(139,45,255,0.5)' : '1px solid transparent',
                                        }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <h3 style={{
                                                    margin: '0 0 4px', color: 'white',
                                                    fontSize: '0.95rem', fontWeight: 700,
                                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                                }}>
                                                    {community.name}
                                                </h3>
                                                <p style={{
                                                    margin: 0, color: 'rgba(255,255,255,0.55)',
                                                    fontSize: '0.78rem', lineHeight: 1.4,
                                                    display: '-webkit-box', WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical', overflow: 'hidden'
                                                }}>
                                                    {community.description || 'No description available.'}
                                                </p>
                                            </div>

                                            <button
                                                onClick={() => {
                                                    setFormData(p => {
                                                        const picks = p.communityPicks || [];
                                                        if (isPicked) {
                                                            return { ...p, communityPicks: picks.filter(c => c.id !== community.id) };
                                                        }
                                                        if (picks.length >= 3) return p;
                                                        return { ...p, communityPicks: [...picks, community] };
                                                    });
                                                }}
                                                disabled={!isPicked && atLimit}
                                                style={{
                                                    flexShrink: 0, marginLeft: 16,
                                                    padding: '8px 20px', borderRadius: 20,
                                                    fontWeight: 600, fontSize: '0.85rem',
                                                    cursor: (!isPicked && atLimit) ? 'not-allowed' : 'pointer',
                                                    border: 'none',
                                                    background: isPicked
                                                        ? 'rgba(139,45,255,0.3)'
                                                        : (!isPicked && atLimit)
                                                            ? 'rgba(255,255,255,0.05)'
                                                            : 'linear-gradient(-90deg, rgba(166,39,156,0.9), rgba(49,32,169,0.9))',
                                                    color: (!isPicked && atLimit) ? 'rgba(255,255,255,0.3)' : 'white',
                                                    transition: 'all 0.15s'
                                                }}
                                            >
                                                {isPicked ? 'Unpick' : 'Pick'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}