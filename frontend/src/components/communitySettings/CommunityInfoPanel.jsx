import React, { useState, useRef } from 'react';
import styles from './communityInfoPanel.module.css';
import Help from '../../Assets/icons/help.png';
import VerifiedBadge from '../../Assets/icons/verified-mark.png';
import EditIcon from '../../Assets/icons/edit.png';
import ArrowLeft from '../../Assets/icons/arrow-left.png';
import CameraIcon from '../../Assets/icons/camera.png';

import API from '../../config';

export default function CommunityInfoPanel({ community, onBack }) {
    console.log('community in InfoPanel:', community);
    console.log('community.image:', community?.image);
    console.log('community.banner_image:', community?.banner_image);

    const token = localStorage.getItem('access');
    const [originalDescription, setOriginalDescription] = useState(community?.description || "");
    const [originalPrivacy, setOriginalPrivacy] = useState(community?.is_private ? 'Private' : 'Public');
    const [originalBannerUrl, setOriginalBannerUrl] = useState(community?.image || null);
    const [bannerUrl, setBannerUrl] = useState(community?.image || null);

    const [description, setDescription] = useState(originalDescription);
    const [privacyType, setPrivacyType] = useState(originalPrivacy);
    const [isPrivacyDropdownOpen, setIsPrivacyDropdownOpen] = useState(false);
    const [bannerFile, setBannerFile] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const fileInputRef = useRef(null);
    const maxChars = 150;

    // ── Detect any change ──
    const hasChanges =
        description !== originalDescription ||
        privacyType !== originalPrivacy ||
        bannerFile !== null;

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // ── Banner handlers ──
    const handleCameraClick = () => fileInputRef.current?.click();

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setBannerFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setBannerUrl(ev.target.result);
        reader.readAsDataURL(file);
    };

    // ── Save handler ──
    const handleSave = async () => {
        if (!hasChanges || isSaving) return;
        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('description', description);
            formData.append('is_public', privacyType === 'Public' ? 'true' : 'false');
            if (bannerFile) formData.append('banner', bannerFile);

            const res = await fetch(`${API}/api/communities/${community?.id}/update/`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (!res.ok) throw new Error('Save failed');
            const data = await res.json();

            setOriginalDescription(description);
            setOriginalPrivacy(privacyType);
            if (data.community?.banner_url) {
                setOriginalBannerUrl(data.community.banner_url);
                setBannerUrl(data.community.banner_url);
            }
            setBannerFile(null);

        } catch (err) {
            showToast('Failed to save changes. Try again.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const communityName = community?.name || 'Programmers';
    const createdBy = community?.owner_name || 'Unknown';
    const createdDate = community?.created_at
        ? new Date(community.created_at).toLocaleDateString('en-GB')
        : '';

    return (
        <div className={`${styles.infoPanelContainer} max-sm:p-4 w-full box-border`}>

            {/* Toast */}
            {toast && (
                <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
                    {toast.message}
                </div>
            )}

            {/* ── HEADER ── */}
            <div className={`${styles.infoHeader} max-sm:flex-col max-sm:items-start max-sm:gap-4`}>
                <div className={styles.infoHeaderLeft}>
                    <button
                        onClick={onBack}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
                    >
                        <img src={ArrowLeft} className={styles.iconBack} alt="Back" />
                    </button>
                    <h2 className={styles.infoTitle}>Community Info</h2>
                </div>

                <div className={`${styles.infoHeaderRight} max-sm:w-full max-sm:justify-between`}>
                    <button
                        className={`${styles.saveBtn} ${hasChanges ? styles.saveBtnActive : ''}`}
                        onClick={handleSave}
                        disabled={!hasChanges || isSaving}
                    >
                        {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <img src={Help} className={styles.iconHelp} alt="Help" />
                </div>
            </div>

            <div className={styles.centeredDivider} />

            {/* ── BANNER ── */}
            <div className={styles.sectionWrapper}>
                <div className={`${styles.sectionHeaderBanner} max-sm:flex-col max-sm:items-start max-sm:gap-1`}>
                    <h3 className={styles.sectionTitle}>
                        Banner <span className={styles.requiredAsterisk}>*</span>
                    </h3>
                    <span className={styles.sectionHelperTextBanner}>
                        Make sure to give your community a unique banner that suits its topic, use wide high resolution pictures!
                    </span>
                </div>

                <div
                    className={`${styles.bannerContainer} max-sm:h-44`}
                    style={{
                        backgroundImage: bannerUrl ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('${bannerUrl}')` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                    <div className={styles.cameraBtn} onClick={handleCameraClick}>
                        <img src={CameraIcon} className={styles.iconCamera} alt="Camera" />
                    </div>
                </div>
            </div>

            <div className={styles.centeredDivider} />

            {/* ── NAME (read-only) ── */}
            <div className={styles.sectionWrapper}>
                <div className={`${styles.nameRow} max-sm:flex-wrap max-sm:gap-2`}>
                    <div className={styles.nameWrapper}>
                        <h1 className={styles.communityName}>{communityName}</h1>
                        <img src={VerifiedBadge} className={styles.iconVerified} alt="Verified" />
                    </div>
                    <img src={EditIcon} className={styles.iconEdit} alt="Edit" />
                </div>
                <p className={styles.communityMeta}>
                    Created by: {createdBy} &bull; {createdDate}
                </p>
            </div>

            {/* ── DESCRIPTION ── */}
            <div className={styles.sectionWrapper}>
                <div className={`${styles.sectionHeaderDescription} max-sm:flex-col max-sm:items-start max-sm:gap-1`}>
                    <h3 className={styles.sectionTitle}>Description</h3>
                    <span className={styles.sectionHelperText}>
                        Give your community a relatable description that is related to its topic
                    </span>
                </div>

                <div className={styles.descriptionInputWrapper}>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        maxLength={maxChars}
                        className={styles.descriptionTextarea}
                        placeholder="Enter a description..."
                    />
                    <span className={styles.charCounter}>
                        {description.length}/{maxChars}
                    </span>
                </div>
            </div>

            <div className={styles.centeredDivider} />

            {/* ── PRIVACY ── */}
            <div>
                <div className={`${styles.privacyContainer} max-md:flex-col max-md:items-start max-md:gap-4`}>
                    
                    {/* FIXED: Added max-md:flex-col to drop the text row down into a nice stacked left-aligned block on mobile viewports */}
                    <div className={`${styles.privacyInfo} max-md:flex-col max-md:items-start max-md:gap-1 max-md:text-left`}>
                        <h3 className={styles.privacyTitle}>Privacy</h3>
                        <span className={styles.sectionHelperText}>
                            Public communities are open to everyone. Private communities require admin approval to join.
                        </span>
                    </div>

                    <div className={`${styles.privacySelectorWrapper} max-md:w-fit`}>
                        <div
                            className={`${styles.privacySelector} max-md:w-fit max-md:justify-start max-md:gap-4`}
                            onClick={() => setIsPrivacyDropdownOpen(p => !p)}
                        >
                            <div className={styles.privacyBtn}>{privacyType}</div>
                            <img
                                src={ArrowLeft}
                                className={styles.iconArrow}
                                alt=""
                                style={{
                                    transform: isPrivacyDropdownOpen ? 'rotate(90deg)' : 'rotate(270deg)',
                                    transition: 'transform 0.2s ease',
                                }}
                            />
                        </div>

                        {isPrivacyDropdownOpen && (
                            <div className={`${styles.privacyDropdown} max-md:w-full`}>
                                {['Public', 'Private'].map((option) => (
                                    <div
                                        key={option}
                                        className={styles.dropdownItem}
                                        onClick={() => {
                                            setPrivacyType(option);
                                            setIsPrivacyDropdownOpen(false);
                                        }}
                                    >
                                        {option}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
}