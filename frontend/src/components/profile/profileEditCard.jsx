import {
    User, UserPlus, Bell, Users, Settings,
    Languages, Home, HelpCircle, MessageSquare,
    Menu, X, Search, Check, MoreHorizontal,
    Volume2, Calendar, Heart, ChevronLeft,
    Upload, Trash2, Mail, Phone, Edit2, Camera
} from "lucide-react";
import { useState } from "react";
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const firstDay = (y, m) => new Date(y, m, 1).getDay();

// Update the function signature to accept setIsEditing:
export default function ProfileEditCard({ styles, edit, setIsEditing }) {
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, target: null });
    const handleConfirmDelete = () => {
        if (deleteConfirm.target === 'avatar') {
            setAvatarFile(null);
            setAvatarPreview(null);
        } else if (deleteConfirm.target === 'cover') {
            setCoverFile(null);
            setCoverPreview(null);
            setShowCoverDropdown(false);
        }
        // Close the modal after deleting
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
    } = edit;

    // Paste the entire desktop editCard JSX here
    return (
        <div className={styles.editCard}>

            {/* ── Header ── */}
            <div className={styles.editHeader}>
                <div className={styles.flexAlign}>
                    <button className={styles.backBtn} onClick={() => setIsEditing(false)}>
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className={styles.whiteHeaderText}>Edit Your Profile</h1>
                </div>
                <div className={styles.editActions}>
                    <button className={styles.cancelLink} onClick={handleEditCancel}>
                        Cancel
                    </button>
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
                            {avatarPreview
                                ? <img src={avatarPreview} alt="avatar" />
                                : <User size={70} color="#888" />
                            }
                        </div>
                        <div style={{ display: "flex", gap: 16 }} onClick={e => e.stopPropagation()}>
                            <button
                                className={`${styles.mediaTextBtn} ${styles.deleteText}`}
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevents triggering the parent upload click
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

                        {/* Camera button — BOTTOM RIGHT of the cover */}
                        <button
                            className={styles.centeredCameraBtn}
                            style={{ position: "absolute", bottom: 10, right: 10, top: "auto", left: "auto", transform: "none" }}
                            onClick={() => setShowCoverDropdown(p => !p)}
                        >
                            <Camera size={16} />
                        </button>

                        {/* Dropdown — anchored bottom-right */}
                        {showCoverDropdown && (
                            <div className={styles.coverActionsDropdown}
                                style={{ position: "absolute", bottom: 50, right: 10, top: "auto", left: "auto", transform: "none" }}>
                                <button onClick={() => coverInputRef.current?.click()}>
                                    <Upload size={14} /> Upload
                                </button>
                                <button
                                    className={styles.deleteText}
                                    onClick={() => setDeleteConfirm({ isOpen: true, target: 'cover' })}
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                            </div>
                        )}
                        <input hidden ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverChange} />
                    </div>
                </div>
            </div>

            {/* ── Form ── */}
            <div className={styles.editForm} style={{ padding: "20px 24px 24px" }}>

                {/* Input grid + Bio */}
                <div style={{ display: "flex", gap: 16, marginBottom: 4, alignItems: "stretch" }}>
                    {/* Left: 2×2 inputs */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                        <div style={{ display: "flex", gap: 12 }}>
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                                <input
                                    className={`${styles.inputPairRow} ${usernameError ? styles.invalidInput : ''}`}
                                    style={{
                                        width: "100%", background: "#262626",
                                        border: `1px solid ${usernameError ? '#ff4b4b' : '#444'}`,
                                        borderRadius: 24, padding: "14px 16px",
                                        color: "white", outline: "none", fontSize: 14, boxSizing: "border-box"
                                    }}
                                    type="text"
                                    value={formData.username}
                                    placeholder="Username"
                                    onChange={e => handleUsernameChange(e.target.value)}
                                />
                            </div>
                            <input
                                style={{
                                    flex: 1, background: "#262626", border: "1px solid #444",
                                    borderRadius: 24, padding: "14px 16px", color: "white",
                                    outline: "none", fontSize: 14, boxSizing: "border-box"
                                }}
                                type="text"
                                value={formData.fullName}
                                placeholder="Real Name"
                                onChange={e => setFormData(p => ({ ...p, fullName: e.target.value }))}
                            />
                        </div>
                        <div style={{ display: "flex", gap: 12 }}>
                            <input
                                readOnly
                                style={{
                                    flex: 1, background: "#262626", border: "1px solid #444",
                                    borderRadius: 24, padding: "14px 16px", color: "white",
                                    outline: "none", fontSize: 14, boxSizing: "border-box", opacity: 0.4,
                                    cursor: "not-allowed",
                                }}
                                type="text"
                                value={formData.university}
                                placeholder="University"
                                onChange={e => setFormData(p => ({ ...p, university: e.target.value }))}
                            />
                            <input
                                style={{
                                    flex: 1, background: "#262626", border: "1px solid #444",
                                    borderRadius: 24, padding: "14px 16px", color: "white",
                                    outline: "none", fontSize: 14, boxSizing: "border-box"
                                }}
                                type="text"
                                value={formData.major}
                                placeholder="Major"
                                onChange={e => setFormData(p => ({ ...p, major: e.target.value }))}
                            />
                        </div>
                    </div>

                    {/* Right: Bio */}
                    <div style={{
                        flex: 1, background: "#262626", borderRadius: 16,
                        border: "1px solid #2a2a2a", padding: 16, display: "flex"
                    }}>
                        <textarea
                            value={formData.bio}
                            placeholder="Bio..."
                            onChange={e => setFormData(p => ({ ...p, bio: e.target.value }))}
                            style={{
                                flex: 1, background: "transparent", border: "none",
                                color: "white", width: "100%", outline: "none",
                                resize: "none", fontSize: 14, lineHeight: 1.5, fontFamily: "inherit"
                            }}
                        />
                    </div>
                </div>

                {/* Username error — only shows when there's actually an error */}
                {usernameError && (
                    <p style={{ color: "#ff4b4b", fontSize: 11, margin: "4px 0 0 4px", lineHeight: 1.4 }}>
                        {usernameError}
                    </p>
                )}

                <div style={{ borderTop: "1px solid #2a2a2a", margin: "20px 0 24px" }} />

                {/* Details header */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 24, marginBottom: 24 }}>
                    <h2 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: "white", width: 110, flexShrink: 0 }}>Details</h2>
                    <p style={{ color: "#888", fontSize: 13, lineHeight: 1.5, flex: 1, margin: "4px 0 0" }}>
                        Please provide accurate profile information, as errors may affect your account. You can adjust your privacy
                        settings to control profile visibility.
                    </p>
                </div>

                {/* Inset fields panel */}
                <div className={styles.insetFieldsPanel}>

                    {/* Contact Info */}
                    <div className={styles.sectionLabelDivider}>
                        <span>Contact Info</span>
                        <div className={styles.dividerLine} />
                    </div>

                    {/* Email row */}
                    <div className={styles.detailFieldItem}>
                        <span><Mail size={16} /> Email</span>
                        <span className={styles.fieldValueText}>{formData.primaryEmail || 'username@gmail.com'}</span>
                        <Edit2 size={16} className={styles.fieldEditIcon} onClick={() => setEditView("email")} />
                    </div>

                    {/* Phone row */}
                    <div className={styles.detailFieldItem}>
                        <span><Phone size={16} /> Phone</span>
                        <span className={styles.fieldValueText}>{formData.primaryPhone || '—'}</span>
                        <Edit2 size={16} className={styles.fieldEditIcon} onClick={() => setEditView("phone")} />
                    </div>

                    {/* Personal Details */}
                    <div className={styles.sectionLabelDivider}>
                        <span>Personal Details</span>
                        <div className={styles.dividerLine} />
                    </div>

                    {/* Birthday row */}
                    <div className={styles.detailFieldItem} style={{ position: "relative" }}>
                        <span>🎂 Birthday</span>
                        <div className={styles.birthdayInputsGroup}>
                            <input
                                type="text" maxLength={2} placeholder="MM"
                                value={formData.birthday.month}
                                className={styles.bInput}
                                onChange={e => setFormData(p => ({ ...p, birthday: { ...p.birthday, month: e.target.value } }))}
                            /> /
                            <input
                                type="text" maxLength={2} placeholder="DD"
                                value={formData.birthday.day}
                                className={styles.bInput}
                                onChange={e => setFormData(p => ({ ...p, birthday: { ...p.birthday, day: e.target.value } }))}
                            /> /
                            <input
                                type="text" maxLength={4} placeholder="YYYY"
                                value={formData.birthday.year}
                                className={styles.bInput} style={{ width: 44 }}
                                onChange={e => setFormData(p => ({ ...p, birthday: { ...p.birthday, year: e.target.value } }))}
                            />
                        </div>
                        {/* Calendar icon opens picker */}
                        <Calendar
                            size={18}
                            className={styles.fieldEditIcon}
                            onClick={() => setShowCalendar(p => !p)}
                        />
                        {/* Calendar dropdown */}
                        {showCalendar && (
                            <div style={{
                                position: "absolute", bottom: "calc(100% + 8px)", right: 0,
                                width: 260, background: "#252525",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: 16, padding: 14, zIndex: 50,
                                boxShadow: "0 16px 40px rgba(0,0,0,0.6)"
                            }}>
                                {/* Month nav */}
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                                    <button onClick={() => setCalViewDate(new Date(calViewDate.getFullYear(), calViewDate.getMonth() - 1, 1))}
                                        style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", fontSize: "1.2rem", cursor: "pointer", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
                                    <span style={{ color: "#fff", fontWeight: 600, fontSize: "0.88rem" }}>
                                        {MONTHS_LONG[calViewDate.getMonth()]} {calViewDate.getFullYear()}
                                    </span>
                                    <button onClick={() => setCalViewDate(new Date(calViewDate.getFullYear(), calViewDate.getMonth() + 1, 1))}
                                        style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", fontSize: "1.2rem", cursor: "pointer", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
                                </div>
                                {/* Day headers */}
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 6 }}>
                                    {DAYS_SHORT.map(d => (
                                        <span key={d} style={{ textAlign: "center", fontSize: "0.7rem", fontWeight: 600, color: "rgba(255,255,255,0.35)", padding: "2px 0" }}>{d}</span>
                                    ))}
                                </div>
                                {/* Day grid */}
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
                                    {Array.from({ length: firstDay(calViewDate.getFullYear(), calViewDate.getMonth()) }).map((_, i) => (
                                        <span key={`e${i}`} />
                                    ))}
                                    {Array.from({ length: daysInMonth(calViewDate.getFullYear(), calViewDate.getMonth()) }).map((_, i) => {
                                        const day = i + 1;
                                        const isSelected =
                                            Number(formData.birthday.year) === calViewDate.getFullYear() &&
                                            Number(formData.birthday.month) === calViewDate.getMonth() + 1 &&
                                            Number(formData.birthday.day) === day;
                                        return (
                                            <button
                                                key={day}
                                                onClick={() => {
                                                    setFormData(p => ({
                                                        ...p,
                                                        birthday: {
                                                            year: String(calViewDate.getFullYear()),
                                                            month: String(calViewDate.getMonth() + 1).padStart(2, '0'),
                                                            day: String(day).padStart(2, '0'),
                                                        }
                                                    }));
                                                    setShowCalendar(false);
                                                }}
                                                style={{
                                                    aspectRatio: "1", display: "flex", alignItems: "center",
                                                    justifyContent: "center", background: isSelected
                                                        ? "linear-gradient(-90deg, rgba(166,39,156,0.9), rgba(49,32,169,0.9))"
                                                        : "transparent",
                                                    border: "none", borderRadius: "50%",
                                                    color: isSelected ? "#fff" : "rgba(255,255,255,0.8)",
                                                    fontSize: "0.8rem", cursor: "pointer",
                                                    fontWeight: isSelected ? 700 : 400,
                                                }}
                                            >
                                                {day}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════
        PHONE EDIT POPUP
    ══════════════════════════════════════ */}
            {editView === "phone" && (
                <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} onClick={() => setEditView("main")} />
                    <div style={{
                        position: "relative", background: "#1e1e1e", borderRadius: 20,
                        padding: 28, width: 380, boxShadow: "0 20px 50px rgba(0,0,0,0.7)",
                        border: "1px solid rgba(255,255,255,0.08)"
                    }}>
                        {/* Header */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <Phone size={20} color="white" />
                                <h3 style={{ margin: 0, color: "white", fontWeight: 700, fontSize: "1.1rem" }}>Phone</h3>
                            </div>
                            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                                <button onClick={() => setEditView("main")} style={{ background: "none", border: "none", color: "#e91e63", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" }}>Discard</button>
                                <button onClick={() => setEditView("main")} style={{ background: "none", border: "1px solid #444", color: "white", borderRadius: 20, padding: "6px 20px", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" }}>Save</button>
                            </div>
                        </div>
                        <div style={{ height: 1, background: "#2a2a2a", marginBottom: 20 }} />

                        {/* Primary phone */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ color: "#888", fontSize: "0.85rem", display: "block", marginBottom: 8 }}>Primary</label>
                            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                <input
                                    type="text"
                                    value={formData.primaryPhone}
                                    placeholder="Primary phone number"
                                    onChange={e => setFormData(p => ({ ...p, primaryPhone: e.target.value }))}
                                    style={{ flex: 1, background: "#252525", border: "1px solid #333", borderRadius: 12, padding: "11px 14px", color: "white", outline: "none", fontSize: "0.9rem" }}
                                />
                                <button
                                    onClick={() => handleSendOtp(formData.primaryPhone)}
                                    style={{ background: "rgba(139,45,255,0.15)", border: "1px solid rgba(139,45,255,0.4)", color: "#c084fc", borderRadius: 10, padding: "10px 16px", fontWeight: 600, cursor: "pointer", fontSize: "0.85rem", whiteSpace: "nowrap" }}
                                >
                                    Update
                                </button>
                            </div>
                        </div>

                        {/* Secondary phone */}
                        <div>
                            <label style={{ color: "#888", fontSize: "0.85rem", display: "block", marginBottom: 8 }}>Secondary</label>
                            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                <input
                                    type="text"
                                    value={formData.secondaryPhone}
                                    placeholder="Add secondary number"
                                    onChange={e => setFormData(p => ({ ...p, secondaryPhone: e.target.value }))}
                                    style={{ flex: 1, background: "#252525", border: "1px solid #333", borderRadius: 12, padding: "11px 14px", color: "white", outline: "none", fontSize: "0.9rem" }}
                                />
                                <button
                                    onClick={() => handleSendOtp(formData.secondaryPhone)}
                                    style={{ background: "rgba(139,45,255,0.15)", border: "1px solid rgba(139,45,255,0.4)", color: "#c084fc", borderRadius: 10, padding: "10px 16px", fontWeight: 600, cursor: "pointer", fontSize: "0.85rem", whiteSpace: "nowrap" }}
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
                        position: "relative", background: "#1e1e1e", borderRadius: 20,
                        padding: 28, width: 400, boxShadow: "0 20px 50px rgba(0,0,0,0.7)",
                        border: "1px solid rgba(255,255,255,0.08)"
                    }}>
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
                        <div style={{ height: 1, background: "#2a2a2a", marginBottom: 20 }} />

                        {/* Academic email — read-only, clearly labelled */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ color: "#888", fontSize: "0.85rem", display: "block", marginBottom: 8 }}>
                                Primary <span style={{ color: "rgba(139,45,255,0.85)", fontSize: "0.72rem", background: "rgba(139,45,255,0.12)", border: "1px solid rgba(139,45,255,0.3)", borderRadius: 6, padding: "1px 6px", marginLeft: 6 }}>Academic · Read-only</span>
                            </label>
                            <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: "11px 14px", color: "rgba(255,255,255,0.45)", fontSize: "0.9rem" }}>
                                {formData.primaryEmail || 'username@university.edu'}
                            </div>
                        </div>

                        {/* Personal email — editable */}
                        <div>
                            <label style={{ color: "#888", fontSize: "0.85rem", display: "block", marginBottom: 8 }}>Personal (optional)</label>
                            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                <input
                                    type="email"
                                    value={formData.secondaryEmail}
                                    placeholder="Add personal email"
                                    onChange={e => setFormData(p => ({ ...p, secondaryEmail: e.target.value }))}
                                    style={{ flex: 1, background: "#252525", border: "1px solid #333", borderRadius: 12, padding: "11px 14px", color: "white", outline: "none", fontSize: "0.9rem" }}
                                />
                                {formData.secondaryEmail && (
                                    <button
                                        onClick={() => setFormData(p => ({ ...p, secondaryEmail: '' }))}
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

                        {/* 6 OTP boxes */}
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
                                        width: 52, height: 56, background: d ? "rgba(139,45,255,0.12)" : "transparent",
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
            {deleteConfirm.isOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.confirmModal}>
                        <h3 style={{ margin: "0 0 10px 0", color: "white", fontSize: "18px" }}>Remove Image</h3>
                        <p style={{ margin: "0 0 20px 0", color: "#aaa", fontSize: "14px", lineHeight: "1.4" }}>
                            Are you sure you want to remove your {deleteConfirm.target === 'avatar' ? 'profile picture' : 'banner'}? This cannot be undone.
                        </p>
                        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                            <button
                                className={styles.modalCancelBtn}
                                onClick={() => setDeleteConfirm({ isOpen: false, target: null })}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.modalConfirmBtn}
                                onClick={handleConfirmDelete}
                            >
                                Yes, remove it
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}