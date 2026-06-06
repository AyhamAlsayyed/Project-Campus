import React, { useState, useRef } from 'react';
import styles from './communities.module.css';
import ArrowLeftIcon from '../../Assets/icons/arrow-left.png';
import InfoIcon from '../../Assets/icons/help.png';
import DefaultBanner from '../../Assets/Pictures/default-community-banner.png';
import CameraIcon from '../../Assets/icons/camera.png';
import ArrowDown from '../../Assets/icons/arrow-left.png';

export default function CreateCommunity({ onBack }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [privacy, setPrivacy] = useState('Public');
    const [isPrivacyDropdownOpen, setIsPrivacyDropdownOpen] = useState(false);

    const renderIcon = (src, color, width, height, style = {}) => (
        <img src={src} alt="" style={{ width, height, filter: 'brightness(0) saturate(100%) invert(1)', ...style }} />
    );
    // File Upload State
    const [bannerImage, setBannerImage] = useState(DefaultBanner);
    const fileInputRef = useRef(null);

    const charLimit = 150;
    const isFormValid = name.trim().length > 0 && description.trim().length > 0;

    const handleCameraClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setBannerImage(imageUrl);
        }
    };

    return (
        <div className={styles.createCommunityCard}>
            {/* HEADER */}
            <div className={styles.ccHeader}>
                <div className={styles.ccHeaderLeft}>
                    <img
                        src={ArrowLeftIcon}
                        className={styles.ccIcon}
                        alt="Back"
                        onClick={onBack}
                        style={{ cursor: 'pointer' }}
                    />
                    <h2 className={styles.ccTitle}>Create Community</h2>
                </div>
                <div className={styles.ccHeaderRight}>
                    <button
                        className={`${styles.createBtn} ${isFormValid ? styles.createBtnActive : ''}`}
                        disabled={!isFormValid}
                    >
                        Create
                    </button>
                    <img src={InfoIcon} className={styles.ccIcon} alt="Info" />
                </div>
            </div>

            <div className={styles.ccDivider}></div>

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
                    {/* Hidden File Input */}
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                </div>
            </div>

            <div className={styles.ccDivider}></div>

            {/* NAME SECTION */}
            <div className={styles.ccSection}>
                <div className={styles.ccTitleRow}>
                    <h3 className={styles.sectionLabel}>Community name <span className={styles.star}>*</span></h3>
                </div>
                <p className={styles.smallTextAlt}>Make sure to give it a good unique name</p>
                <input
                    type="text"
                    className={styles.ccInput}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter name..."
                />
            </div>

            {/* DESCRIPTION SECTION */}
            <div className={styles.ccSection} style={{ marginTop: '15px' }}>
                <div className={styles.ccTitleRow}>
                    <h3 className={styles.sectionLabel}>Community description <span className={styles.star}>*</span></h3>
                </div>
                <p className={styles.smallTextAlt}>Give your community a relatable description that is related to its topic</p>
                <div className={styles.textareaWrapper}>
                    <textarea
                        className={styles.ccTextarea}
                        maxLength={charLimit}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <span className={styles.charCounter}>{description.length}/{charLimit}</span>
                </div>
            </div>

            <div className={styles.ccDivider}></div>

            {/* PRIVACY SECTION */}
            <div className={styles.ccSection}>
                <div className={styles.ccPrivacyRow}>
                    <div className={styles.inlineTitleRow}>
                        <h3 className={styles.sectionLabel}>Privacy</h3>
                        <p className={styles.smallTextInline}>
                            Public communities are open to everyone. Private communities require approval to join
                        </p>
                    </div>

                    <div className={styles.privacySelectorWrapper}>
                        <div
                            className={styles.privacySelector}
                            onClick={() => setIsPrivacyDropdownOpen(p => !p)}
                        >
                            <div className={styles.privacyBtn}>{privacy}</div>
                            {renderIcon(ArrowLeftIcon, '#E6E6E6', '16px', '16px', {
                                transform: isPrivacyDropdownOpen ? 'rotate(90deg)' : 'rotate(270deg)',
                                transition: 'transform 0.2s ease',
                            })}
                        </div>

                        {isPrivacyDropdownOpen && (
                            <div className={styles.privacyDropdown}>
                                {['Public', 'Private'].map((option) => (
                                    <div
                                        key={option}
                                        className={styles.dropdownItem}
                                        onClick={() => {
                                            setPrivacy(option);
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