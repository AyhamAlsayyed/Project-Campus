import React from 'react';
import styles from './mobileCreatePost.module.css'; 
import ProfilePicture from '../../../Assets/icons/default-pfp.png';
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
                <div className={styles.leftSide}>
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
                        style={{
                            flex: 1,
                            minWidth: 0,
                            maxWidth: "160px",
                            fontSize: "clamp(0.5rem, 2.5vw, 1rem)"
                        }}
                    />
                </div>
                <div className={styles.actionButtons} onClick={e => e.stopPropagation()}>
                    <label className={styles.actionButtonOne} onClick={e => e.stopPropagation()}>
                        📷
                        <input hidden type="file" accept="image/*,video/*" multiple onChange={handleMediaUpload} />
                    </label>
                    <label className={styles.actionButtonOne} onClick={e => e.stopPropagation()}>
                        📁
                        <input hidden type="file" multiple onChange={handleFileUpload} />
                    </label>
                    <button
                        type="button"
                        className={styles.actionButtonOne}
                        onClick={e => { e.stopPropagation(); setIsPollOpen(prev => !prev); }}
                    >
                        📊
                    </button>
                </div>
            </div>
        </div>
    );
}