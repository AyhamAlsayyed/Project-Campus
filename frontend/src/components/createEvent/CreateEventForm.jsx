import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './createEvent.module.css';
import ArrowLeft from '../../Assets/icons/arrow-left.png';
import HelpIcon from '../../Assets/icons/help.png';
import CameraIcon from '../../Assets/icons/camera.png';
import DefaultCommunityImg from '../../Assets/Pictures/default-community-banner.png';

export default function CreateEventForm({
    eventName, setEventName,
    description, setDescription,
    bannerFile, setBannerFile,
    bannerPreview, setBannerPreview,
    isFormValid, onBack,
    onSubmit, isSubmitting, submitError
}) {
    const navigate = useNavigate();
    const descLimit = 150;
    const fileInputRef = useRef(null);

    const handleDescChange = (e) => {
        if (e.target.value.length <= descLimit) {
            setDescription(e.target.value);
        }
    };

    const handleBannerClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate image type
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            return;
        }

        // Validate size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be under 5MB.');
            return;
        }

        setBannerFile(file);
        const objectUrl = URL.createObjectURL(file);
        setBannerPreview(objectUrl);
    };

    return (
        <div className={styles.createEventPageLayout}>
            <div className={styles.createEventMiddleContainer}>

                {/* Header Row */}
                <div className={styles.eventFormHeader}>
                    <div className={styles.eventHeaderLeft}>
                        <button className={styles.formBackBtn} onClick={onBack} disabled={isSubmitting}>
                            <img src={ArrowLeft} alt="back" className={styles.backArrowImg} />
                        </button>
                        <h2 className={styles.formMainHeaderTitle}>Create Event</h2>
                    </div>

                    <div className={styles.eventHeaderRight}>
                        <button
                            className={isFormValid && !isSubmitting ? styles.gradientCreateBtn : styles.disabledCreateBtn}
                            disabled={!isFormValid || isSubmitting}
                            onClick={onSubmit}
                        >
                            {isSubmitting ? 'Creating...' : 'Create'}
                        </button>
                        <button className={styles.formHelpBtn} onClick={() => navigate('/help')}>
                            <img src={HelpIcon} alt="help" className={styles.helpIconImg} />
                        </button>
                    </div>
                </div>

              

                {/* 75% Upper Line Divider */}
                <div className={styles.divider75} />

                {/* Form Fields Area */}
                <div className={styles.formInnerBody}>

                    {/* Banner Section */}
                    <div className={styles.formFieldGroup}>
                        <div className={styles.labelWithStarRow}>
                            <label className={styles.formLabelField}>Banner</label>
                            <span className={styles.formRequiredStarField}>*</span>
                            <p className={styles.formHintSubtitle}>
                                Make sure to give your Event a unique banner that suits its topic, use high resolution pictures!
                            </p>
                        </div>

                        <div className={styles.bannerUploadPreviewWrapper}>
                            <img
                                src={bannerPreview || DefaultCommunityImg}
                                alt="Banner Preview"
                                className={styles.bannerImageDisplay}
                            />
                            {/* Hidden real file input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                            />
                            <button
                                className={styles.cameraTriggerFloatingBtn}
                                onClick={handleBannerClick}
                                type="button"
                                title="Upload banner image"
                            >
                                <img src={CameraIcon} alt="Upload" className={styles.cameraIconImg} />
                            </button>
                        </div>

                    
                    </div>

                    {/* 75% Mid-Line Divider */}
                    <div className={styles.divider75} />

                    {/* Event Name Input */}
                    <div className={styles.formFieldGroup}>
                        <div className={styles.labelWithStarRow} style={{ marginBottom: '0px' }}>
                            <label className={styles.formLabelField}>Event name</label>
                            <span className={styles.formRequiredStarField}>*</span>
                        </div>
                        <p className={styles.formHintSubtitle}>Make sure to give it a good name.</p>
                        <input
                            type="text"
                            className={styles.eventTextInputMiddle}
                            placeholder="Enter event name..."
                            value={eventName}
                            onChange={(e) => setEventName(e.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Event Description Textarea */}
                    <div className={styles.formFieldGroup} style={{ marginTop: '12px' }}>
                        <div className={styles.labelWithStarRow} style={{ marginBottom: '0px' }}>
                            <label className={styles.formLabelField}>Event description</label>
                            <span className={styles.formRequiredStarField}>*</span>
                        </div>
                        <p className={styles.formHintSubtitle}>
                            Give your event a relatable description that is related to its topic.
                        </p>
                        <div className={styles.textareaCounterWrapperBlock}>
                            <textarea
                                className={styles.eventTextAreaMiddle}
                                placeholder="Describe your event details..."
                                value={description}
                                onChange={handleDescChange}
                                disabled={isSubmitting}
                            />
                            <span className={styles.floatingCharCounterDisplay}>
                                {description.length}/{descLimit}
                            </span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}