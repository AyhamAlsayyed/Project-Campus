import React from 'react';
import styles from './communities.module.css';

const WHO_CAN_POST_OPTIONS = ['Everyone', 'Members only', 'Admins only'];

export default function CommunityPermissions({ postApproval, onPostApprovalChange, whoCanPost, onWhoCanPostChange, isMobile }) {
    return (
        <div style={{ width: '100%' }}>
            {!isMobile && (  
                <div className={styles.pillContainer}>
                    <div className={styles.pill}>PERMISSIONS</div>
                </div>
            )}
            <div className={styles.permissionsCard}>
                <div className={styles.permissionRow}>
                    <div className={styles.permissionInfo}>
                        <h3 className={styles.permTitle}>Post Approval</h3>
                        <p className={styles.permDescSmaller} style={{ fontSize: '0.6rem' }}>
                            Admins should accept a post before it's published in the community,
                            posts will be pending until an admin approves it.
                        </p>
                    </div>
                    <label className={styles.switch}>
                        <input
                            type="checkbox"
                            checked={postApproval}
                            onChange={() => onPostApprovalChange(!postApproval)}
                        />
                        <span className={styles.slider}></span>
                    </label>
                </div>

                <div className={styles.permDivider}></div>

                <div className={styles.permissionRow} style={{ alignItems: 'flex-start' }}>
                    <div className={styles.permissionInfo} style={{ flexDirection: 'row' }}>
                        <h3 className={styles.permTitle} style={{ width: '100%' }}>Who can post</h3>
                        <p className={styles.permDescSmaller} style={{ display: 'inline', width: '100%' }}>
                            Decide who can post in your community
                        </p>
                    </div>
                </div>

                <div className={styles.checkOptionsGroup}>
                    {WHO_CAN_POST_OPTIONS.map((opt) => (
                        <label key={opt} className={styles.checkItem}>
                            <input
                                type="checkbox"
                                checked={whoCanPost[opt]}
                                onChange={() => onWhoCanPostChange(opt)}
                                className={styles.customCheckbox}
                            />
                            <span className={styles.checkLabel}>{opt}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}