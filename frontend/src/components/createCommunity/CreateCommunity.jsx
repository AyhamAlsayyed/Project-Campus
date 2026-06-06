import React, { useState, useRef } from 'react';
import styles from './communities.module.css';
import ArrowLeftIcon from '../../Assets/icons/arrow-left.png';
import InfoIcon from '../../Assets/icons/help.png';
import DefaultBanner from '../../Assets/Pictures/default-community-banner.png';
import CameraIcon from '../../Assets/icons/camera.png';
import CommunityPermissions from './CommunityPermissions';

export default function CreateCommunity({ onBack, onSuccess }) {
    // Community fields
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [privacy, setPrivacy] = useState('Public');
    const [isPrivacyDropdownOpen, setIsPrivacyDropdownOpen] = useState(false);
    const [bannerImage, setBannerImage] = useState(DefaultBanner);
    const [bannerFile, setBannerFile] = useState(null);

    // Permissions fields — owned here, passed down to CommunityPermissions
    const [postApproval, setPostApproval] = useState(false);
    const [whoCanPost, setWhoCanPost] = useState({
        'Everyone': true,
        'Members only': false,
        'Admins only': false,
    });

    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const charLimit = 150;
    const isFormValid = name.trim().length > 0 && description.trim().length > 0;

    const renderIcon = (src, width, height, style = {}) => (
        <img src={src} alt="" style={{ width, height, filter: 'brightness(0) saturate(100%) invert(1)', ...style }} />
    );

    const handleWhoCanPostChange = (opt) => {
        setWhoCanPost(prev => ({ ...prev, [opt]: !prev[opt] }));
    };

    const handleCameraClick = () => fileInputRef.current.click();

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setBannerFile(file);
            setBannerImage(URL.createObjectURL(file));
        }
    };

    const handleCreate = async () => {
        if (!isFormValid || isLoading) return;
        setIsLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('access');
            const formData = new FormData();
            formData.append('name', name.trim());
            formData.append('description', description.trim());
            formData.append('privacy', privacy.toLowerCase());
            formData.append('post_approval', postApproval);
            formData.append(
                'who_can_post',
                JSON.stringify(Object.keys(whoCanPost).filter(k => whoCanPost[k]))
            );
            if (bannerFile) formData.append('banner', bannerFile);

            const res = await fetch('http://localhost:8000/api/communities/create/', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data?.detail || data?.name?.[0] || 'Failed to create community');
            }

            const community = await res.json();
            onSuccess?.(community.id, community);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.createCommunityCard}>
            {/* HEADER */}
            <div className={styles.ccHeader}>
                <div className={styles.ccHeaderLeft}>
                    <img src={ArrowLeftIcon} className={styles.ccIcon} alt="Back"
                        onClick={onBack} style={{ cursor: 'pointer' }} />
                    <h2 className={styles.ccTitle}>Create Community</h2>
                </div>
                <div className={styles.ccHeaderRight}>
                    <button
                        className={`${styles.createBtn} ${isFormValid ? styles.createBtnActive : ''}`}
                        disabled={!isFormValid || isLoading}
                        onClick={handleCreate}
                    >
                        {isLoading ? 'Creating...' : 'Create'}
                    </button>
                    <img src={InfoIcon} className={styles.ccIcon} alt="Info" />
                </div>
            </div>

            {error && (
                <p style={{ color: '#e05c5c', fontSize: '0.75rem', padding: '4px 20px 0' }}>
                    {error}
                </p>
            )}

            <div className={styles.ccDivider}></div>

            {/* BANNER */}
            <div className={styles.ccSection}>
                <div className={styles.inlineTitleRow}>
                    <h3 className={styles.sectionLabel}>Banner <span className={styles.star}>*</span></h3>
                    <p className={styles.smallTextInline} style={{ width: 380 }}>
                        Make sure to give your community a unique banner that suits its topic, use wide high resolution pictures!
                    </p>
                </div>
                <div className={styles.bannerPreviewWrapper}>
                    <img src={bannerImage} className={styles.ccBannerImg} alt="Community Banner" />
                    <div className={styles.cameraIconContainer} onClick={handleCameraClick}>
                        <img src={CameraIcon} alt="Change Banner" className={styles.cameraIcon} />
                    </div>
                    <input type="file" accept="image/*" ref={fileInputRef}
                        onChange={handleFileChange} style={{ display: 'none' }} />
                </div>
            </div>

            <div className={styles.ccDivider}></div>

            {/* NAME */}
            <div className={styles.ccSection}>
                <div className={styles.ccTitleRow}>
                    <h3 className={styles.sectionLabel}>Community name <span className={styles.star}>*</span></h3>
                </div>
                <p className={styles.smallTextAlt}>Make sure to give it a good unique name</p>
                <input type="text" className={styles.ccInput} value={name}
                    onChange={(e) => setName(e.target.value)} placeholder="Enter name..." />
            </div>

            {/* DESCRIPTION */}
            <div className={styles.ccSection} style={{ marginTop: '15px' }}>
                <div className={styles.ccTitleRow}>
                    <h3 className={styles.sectionLabel}>Community description <span className={styles.star}>*</span></h3>
                </div>
                <p className={styles.smallTextAlt}>Give your community a relatable description related to its topic</p>
                <div className={styles.textareaWrapper}>
                    <textarea className={styles.ccTextarea} maxLength={charLimit}
                        value={description} onChange={(e) => setDescription(e.target.value)} />
                    <span className={styles.charCounter}>{description.length}/{charLimit}</span>
                </div>
            </div>

            <div className={styles.ccDivider}></div>

            {/* PRIVACY */}
            <div className={styles.ccSection}>
                <div className={styles.ccPrivacyRow}>
                    <div className={styles.inlineTitleRow}>
                        <h3 className={styles.sectionLabel}>Privacy</h3>
                        <p className={styles.smallTextInline}>
                            Public communities are open to everyone. Private communities require approval to join
                        </p>
                    </div>
                    <div className={styles.privacySelectorWrapper}>
                        <div className={styles.privacySelector}
                            onClick={() => setIsPrivacyDropdownOpen(p => !p)}>
                            <div className={styles.privacyBtn}>{privacy}</div>
                            {renderIcon(ArrowLeftIcon, '16px', '16px', {
                                transform: isPrivacyDropdownOpen ? 'rotate(90deg)' : 'rotate(270deg)',
                                transition: 'transform 0.2s ease',
                            })}
                        </div>
                        {isPrivacyDropdownOpen && (
                            <div className={styles.privacyDropdown}>
                                {['Public', 'Private'].map((option) => (
                                    <div key={option} className={styles.dropdownItem}
                                        onClick={() => { setPrivacy(option); setIsPrivacyDropdownOpen(false); }}>
                                        {option}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className={styles.ccDivider}></div>

            {/* PERMISSIONS — rendered inline as part of the form */}
            <CommunityPermissions
                postApproval={postApproval}
                onPostApprovalChange={setPostApproval}
                whoCanPost={whoCanPost}
                onWhoCanPostChange={handleWhoCanPostChange}
            />
        </div>
    );
}