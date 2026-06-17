// src/hooks/useProfileEdit.js
import { useState, useRef } from 'react';

export function useProfileEdit({ user, token, API, onSaved }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editView, setEditView] = useState('main');
    const [editSaving, setEditSaving] = useState(false);
    const [usernameError, setUsernameError] = useState('');
    const [usernameChecking, setUsernameChecking] = useState(false);
    const [showCoverDropdown, setShowCoverDropdown] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [calViewDate, setCalViewDate] = useState(new Date());
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [coverFile, setCoverFile] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);
    const [verifyTarget, setVerifyTarget] = useState('');
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
    const [otpError, setOtpError] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);

    const avatarInputRef = useRef();
    const coverInputRef = useRef();
    const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
    const usernameTimer = useRef();

    const parseBirthday = (str) => {
        if (!str) return { day: '', month: '', year: '' };
        const [year, month, day] = str.split('-');
        return { year: year || '', month: month || '', day: day || '' };
    };
    const userType = localStorage.getItem('user_type');
    const isPageOrUni = userType === 'page' || userType === 'university';
    const birthParts = user?.profile?.birth_date?.split('-') || [];

    const [formData, setFormData] = useState(isPageOrUni ? {
        // ── PAGE / UNIVERSITY ──
        username: user?.page_name || '',
        fullName: user?.page_full_name || '',
        category: user?.page_type || '',
        bio: user?.description || '',
        pagePhone: user?.phone || '',
        pageEmail: user?.email || '',
        pageAddress: user?.location || '',
        pageWebsite: user?.link || '',
    } : {
        // ── STUDENT / INSTRUCTOR ──
        username: user?.username || '',
        fullName: user?.profile?.full_name || '',
        bio: user?.profile?.bio || '',
        university: user?.university_full_name || '',
        major: user?.major || '',
        title: user?.academic_title || '',

        // Contact
        primaryEmail: user?.profile?.academic_email || '',
        secondaryEmail: user?.personal_email || '',
        primaryPhone: user?.profile?.primary_phone || '',
        secondaryPhone: user?.profile?.secondary_phone || '',

        // Birthday — parsed from "YYYY-MM-DD"
        birthday: {
            year: birthParts[0] || '',
            month: birthParts[1] || '',
            day: birthParts[2] || '',
        },

        // Arrays
        degrees: user?.degrees || [],
        teachingPositions: user?.teaching_positions || [],
        communityPicks: [],
    });
    const syncFromUser = (u) => {
        if (!u) return;

        if (isPageOrUni) {
            const rawAvatar = u?.profile_image;
            const rawCover = u?.banner_image;
            setAvatarPreview(rawAvatar ? (rawAvatar.startsWith('http') ? rawAvatar : `${API}${rawAvatar}`) : null);
            setCoverPreview(rawCover ? (rawCover.startsWith('http') ? rawCover : `${API}${rawCover}`) : null);
            setFormData({
                username: u?.page_name || '',
                fullName: u?.page_full_name || '',
                category: u?.page_type || '',
                bio: u?.description || '',
                pagePhone: u?.phone || '',
                pageEmail: u?.email || '',
                pageAddress: u?.location || '',
                pageWebsite: u?.link || '',
            });
            return;
        }

        // existing student/instructor logic unchanged below
        const rawAvatar = u?.profile?.avatar || u?.avatar;
        const rawCover = u?.profile?.cover || u?.cover;
        setAvatarPreview(rawAvatar ? (rawAvatar.startsWith('http') ? rawAvatar : `${API}${rawAvatar}`) : null);
        setCoverPreview(rawCover ? (rawCover.startsWith('http') ? rawCover : `${API}${rawCover}`) : null);
        setFormData({
            username: u.username || '',
            fullName: u.profile?.full_name || '',
            university: u.university_full_name || '',
            major: u.major || '',
            bio: u.profile?.bio || '',
            primaryEmail: u.profile?.academic_email || '',
            secondaryEmail: u.personal_email || '',
            primaryPhone: u.profile?.primary_phone || '',
            secondaryPhone: u.profile?.secondary_phone || '',
            birthday: parseBirthday(u.profile?.birth_date),
            degrees: (u.degrees || []).map(deg => ({
                id: deg.id,
                title: deg.degree_type,
                field: deg.major,
                institution: deg.institution,
            })),
            educationEntries: u?.education || [],
            teachingPositions: u?.teaching_positions || [],
        });
    };

    const handleUsernameChange = (val) => {
        setFormData(p => ({ ...p, username: val }));
        setUsernameError('');
        clearTimeout(usernameTimer.current);
        if (!val.trim()) { setUsernameError('Username is required.'); return; }
        if (/[A-Z]/.test(val)) { setUsernameError('Username must be lowercase only — no capital letters.'); return; }
        if (/[^a-z0-9]/.test(val)) { setUsernameError('Username must only contain small letters, numbers, or underscores. Special characters like @, #, $, %, !, -, +, =,_ are not allowed.'); return; }
        if (val.length > 50) { setUsernameError('Max 50 characters.'); return; }
        usernameTimer.current = setTimeout(async () => {
            if (val === user?.username) return;
            setUsernameChecking(true);
            try {
                const res = await fetch(`${API}/api/auth/check-username/?username=${encodeURIComponent(val)}`, { headers: { Authorization: `Bearer ${token}` } });
                if (!res.ok) setUsernameError('Username unavailable.');
            } catch { }
            finally { setUsernameChecking(false); }
        }, 600);
    };

    const handleAvatarChange = (e) => {
        const f = e.target.files[0]; if (!f) return;
        setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f));
    };

    const handleCoverChange = (e) => {
        const f = e.target.files[0]; if (!f) return;
        setCoverFile(f); setCoverPreview(URL.createObjectURL(f));
        setShowCoverDropdown(false);
    };

    const handleSendOtp = async (phone) => {
        setVerifyTarget(phone);
        try {
            await fetch(`${API}/api/auth/send-otp/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone }),
            });
        } catch { }
        setOtpDigits(['', '', '', '', '', '']);
        setOtpError('');
        setEditView('verify');
        setTimeout(() => otpRefs[0].current?.focus(), 100);
    };

    const handleOtpChange = (i, v) => {
        if (!/^\d?$/.test(v)) return;
        const next = [...otpDigits]; next[i] = v; setOtpDigits(next);
        if (v && i < 5) otpRefs[i + 1].current?.focus();
    };

    const handleOtpKeyDown = (i, e) => {
        if (e.key === 'Backspace' && !otpDigits[i] && i > 0) otpRefs[i - 1].current?.focus();
    };

    const handleCheckOtp = async () => {
        const code = otpDigits.join('');
        if (code.length < 6) { setOtpError('Enter all 6 digits.'); return; }
        setOtpLoading(true);
        try {
            const res = await fetch(`${API}/api/auth/verify-otp/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: verifyTarget, code }),
            });
            if (res.ok) { setFormData(p => ({ ...p, secondaryPhone: verifyTarget })); setEditView('phone'); }
            else setOtpError('Invalid code.');
        } catch { setOtpError('Something went wrong.'); }
        finally { setOtpLoading(false); }
    };

    const handleEditSave = async () => {
        const userType = localStorage.getItem('user_type');
        if (userType === 'page' || userType === 'university') {
            const fd = new FormData();
            if (avatarFile) fd.append('profile_image', avatarFile);
            if (coverFile) fd.append('banner_image', coverFile);     
            fd.append('description', formData.bio || '');      
            fd.append('phone', formData.pagePhone || '');
            fd.append('email', formData.pageEmail || '');
            fd.append('location', formData.pageAddress || '');     
            fd.append('link', formData.pageWebsite || '');     

            await fetch(`${API}/api/page/profile/update/`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            setIsEditing(false);
            return;
        }
        if (usernameError) return;
        setEditSaving(true);
        try {
            const fd = new FormData();
            fd.append('username', formData.username);
            fd.append('full_name', formData.fullName);
            fd.append('major', formData.major);
            fd.append('bio', formData.bio);
            fd.append('personal_email', formData.secondaryEmail);
            fd.append('primary_phone', formData.primaryPhone);
            fd.append('secondary_phone', formData.secondaryPhone);

            const { day, month, year } = formData.birthday;
            if (day && month && year) fd.append('birthday', `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);

            if (avatarFile) fd.append('avatar', avatarFile);
            if (coverFile) fd.append('cover', coverFile);

            fd.append('degrees', JSON.stringify(
                (formData.degrees || []).map(d => ({
                    id: d.id || null,
                    degree_type: d.title,
                    major: d.field,
                    institution: d.institution,
                }))
            ));
            if (formData.teachingPositions?.length) {
                fd.append('teaching_positions', JSON.stringify(formData.teachingPositions));
            }
            if (formData.educationEntries?.length) {
                fd.append('education', JSON.stringify(formData.educationEntries));
            }

            const res = await fetch(`${API}/api/auth/profile/update/`, {
                method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: fd,
            });
            if (res.ok) { setIsEditing(false); onSaved?.(); }
        } catch { }
        finally { setEditSaving(false); }
    };
    const handleEditCancel = () => {
        syncFromUser(user);
        setUsernameError('');
        setEditView('main');
        setShowCalendar(false);
        setIsEditing(false);
    };

    return {
        isEditing, setIsEditing,
        editView, setEditView,
        editSaving, usernameError, usernameChecking,
        showCoverDropdown, setShowCoverDropdown,
        showCalendar, setShowCalendar,
        calViewDate, setCalViewDate,
        avatarFile, setAvatarFile,
        avatarPreview, setAvatarPreview,
        coverFile, setCoverFile,
        coverPreview, setCoverPreview,
        verifyTarget, otpDigits, otpError, otpLoading,
        avatarInputRef, coverInputRef, otpRefs,
        formData, setFormData,
        syncFromUser,
        handleUsernameChange,
        handleAvatarChange, handleCoverChange,
        handleSendOtp, handleOtpChange, handleOtpKeyDown, handleCheckOtp,
        handleEditSave, handleEditCancel,
    };
}