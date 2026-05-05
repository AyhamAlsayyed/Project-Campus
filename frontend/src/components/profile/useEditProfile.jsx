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
    const [otpDigits, setOtpDigits] = useState(['','','','','','']);
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

    const [formData, setFormData] = useState({
        username: '', fullName: '', university: '', major: '', bio: '',
        primaryEmail: '', secondaryEmail: '', primaryPhone: '', secondaryPhone: '',
        birthday: { day: '', month: '', year: '' }
    });

    const syncFromUser = (u) => {
        if (!u) return;
        setAvatarPreview(u.avatar?.startsWith('http') ? u.avatar : u.avatar ? `${API}${u.avatar}` : null);
        setCoverPreview(u.cover?.startsWith('http') ? u.cover : u.cover ? `${API}${u.cover}` : null);
        setFormData({
            username: u.username || '',
            fullName: u.full_name || '',
            university: u.university || '',
            major: u.major || '',
            bio: u.bio || '',
            primaryEmail: u.academic_email || u.email || '',
            secondaryEmail: u.personal_email || '',
            primaryPhone: u.primary_phone || '',
            secondaryPhone: u.secondary_phone || '',
            birthday: parseBirthday(u.birthday),
        });
    };

    const handleUsernameChange = (val) => {
        setFormData(p => ({ ...p, username: val }));
        setUsernameError('');
        clearTimeout(usernameTimer.current);
        if (!val.trim()) { setUsernameError('Username is required.'); return; }
        if (/[^a-zA-Z0-9_]/.test(val)) { setUsernameError('No spaces or special characters.'); return; }
        if (val.length > 50) { setUsernameError('Max 50 characters.'); return; }
        usernameTimer.current = setTimeout(async () => {
            if (val === user?.username) return;
            setUsernameChecking(true);
            try {
                const res = await fetch(`${API}/api/auth/check-username/?username=${encodeURIComponent(val)}`, { headers: { Authorization: `Bearer ${token}` } });
                const data = await res.json();
                if (!data.available) setUsernameError('Username unavailable.');
            } catch {}
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
        } catch {}
        setOtpDigits(['','','','','','']);
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
            if (day && month && year) fd.append('birthday', `${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`);
            if (avatarFile) fd.append('avatar', avatarFile);
            if (coverFile) fd.append('cover', coverFile);
            const res = await fetch(`${API}/api/auth/profile/update/`, {
                method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: fd,
            });
            if (res.ok) { setIsEditing(false); onSaved?.(); }
        } catch {}
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