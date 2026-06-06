import React, { useState } from 'react';
import styles from './communities.module.css';

export default function CommunityPermissions() {
    const [postApproval, setPostApproval] = useState(false);
    
    // Converted to an object so multiple can be checked
    const [whoCanPost, setWhoCanPost] = useState({
        'Everyone': true,
        'Members only': false,
        'Admins only': false
    });

    const options = ['Everyone', 'Members only', 'Admins only'];

    const handleCheckChange = (opt) => {
        setWhoCanPost(prev => ({
            ...prev,
            [opt]: !prev[opt]
        }));
    };

    return (
        <div style={{ width: '100%' }}>
            {/* Pill works identically to the onHoldContainer in communities.jsx */}
            <div className={styles.pillContainer}>
                <div className={styles.pill} >
                    PERMISSIONS
                </div>
            </div>

            <div className={styles.permissionsCard}>
                <div className={styles.permissionRow}>
                    <div className={styles.permissionInfo}>
                        <h3 className={styles.permTitle}>Post Approval</h3>
                        <p className={styles.permDescSmaller} style={{ fontSize: '0.6rem' }}>
                            Admins should accept a post before it's published in the community, posts will be pending until an admin approves it.
                        </p>
                    </div>
                    {/* Updated Toggle Switch */}
                    <label className={styles.switch}>
                        <input 
                            type="checkbox" 
                            checked={postApproval} 
                            onChange={() => setPostApproval(!postApproval)} 
                        />
                        <span className={styles.slider}></span>
                    </label>
                </div>

                <div className={styles.permDivider}></div>

                <div className={styles.permissionRow} style={{ alignItems: 'flex-start' }}>
                    <div className={styles.permissionInfo} style={{ flexDirection: 'row' }}>
                        <h3 className={styles.permTitle} style={{ width: '100%' }}>
                            Who can post
                        </h3>
                        <p className={styles.permDescSmaller} style={{ display: 'inline', width:"100%" }}>
                            Decide who can post in your community
                        </p>
                    </div>
                </div>

                {/* Updated to custom Checkboxes instead of Radios */}
                <div className={styles.checkOptionsGroup}>
                    {options.map((opt) => (
                        <label key={opt} className={styles.checkItem}>
                            <input 
                                type="checkbox" 
                                checked={whoCanPost[opt]}
                                onChange={() => handleCheckChange(opt)}
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