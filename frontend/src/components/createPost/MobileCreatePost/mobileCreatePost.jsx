import React from 'react';
import { BarChart2 } from 'lucide-react';
import styles from './mobileCreatePost.module.css';
import ProfilePicture from '../../../Assets/icons/default-pfp.png';
import MediaIcon from '../../../Assets/icons/media.png';
import DocumentIcon from '../../../Assets/icons/document.png';

export default function MobileCreatePost({
    avatarSrc,
    setIsModalOpen,
    handleMediaUpload,
    handleFileUpload,
    setIsPollOpen
}) {
    return (
        <div
            className={styles.createPostSection}
            onClick={() => setIsModalOpen(true)}
            style={{ margin: "0 auto", boxSizing: "border-box", width: "100%", maxWidth: "450px" }}
        >
            <div className={styles.topRow}>
                <img
                    src={avatarSrc || ProfilePicture}
                    alt="User Avatar"
                    className={styles.userProfilePicture}
                    onError={e => { e.currentTarget.src = ProfilePicture; }}
                />
                <input
                    type="text"
                    placeholder="What's on your mind?"
                    className={styles.postInput}
                    onFocus={() => setIsModalOpen(true)}
                    readOnly
                />
                <div className={styles.actionButtons} onClick={e => e.stopPropagation()}>
                    <label className={styles.actionBtn} onClick={() => setIsModalOpen(true)}>
                        <img src={MediaIcon} alt="Media" className={styles.actionIcon} />
                        <input hidden type="file" accept="image/*,video/*" multiple onChange={handleMediaUpload} />
                    </label>
                    <label className={styles.actionBtn} onClick={() => setIsModalOpen(true)}>
                        <img src={DocumentIcon} alt="File" className={styles.actionIcon} />
                        <input hidden type="file" multiple onChange={handleFileUpload} />
                    </label>
                    <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={e => { e.stopPropagation(); setIsPollOpen(prev => !prev); setIsModalOpen(true); }}
                    >
                        <BarChart2 size={18} className={styles.actionIconSvg} />
                    </button>
                </div>
            </div>
        </div>
    );
}
