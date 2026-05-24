import React, { useState } from 'react';
import styles from './DeleteCommunityModal.module.css';

const DeleteCommunityModal = ({ isOpen, onClose, onDelete }) => {
    // State to track if the user has checked the confirmation box
    const [isConfirmed, setIsConfirmed] = useState(false);

    // If modal is not open, don't render anything
    if (!isOpen) return null;

    const handleDeleteClick = () => {
        if (isConfirmed) {
            onDelete();
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                
                {/* Header */}
                <div className={styles.modalHeader}>
                    <h2 className={styles.headerTitle}>Delete Community</h2>
                    <button className={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                {/* Body */}
                <div className={styles.modalBody}>
                    <div className={styles.warningBox}>
                        <h3 className={styles.warningTitle}>⚠️ This action is permanent</h3>
                        <p className={styles.warningText}>
                            Once you delete this community, all posts, members, and data will be permanently removed. 
                            <strong> This cannot be undone.</strong>
                        </p>
                    </div>

                    {/* Confirmation Checkbox */}
                    <label className={styles.checkboxLabel}>
                        <input 
                            type="checkbox" 
                            className={styles.customCheckbox}
                            checked={isConfirmed}
                            onChange={(e) => setIsConfirmed(e.target.checked)}
                        />
                        I understand that deleting this community is permanent and cannot be undone.
                    </label>
                </div>

                {/* Footer / Actions */}
                <div className={styles.modalFooter}>
                    <button className={styles.cancelBtn} onClick={onClose}>
                        Cancel
                    </button>
                    <button 
                        className={styles.deleteBtn} 
                        onClick={handleDeleteClick}
                        disabled={!isConfirmed}
                    >
                        Delete Community
                    </button>
                </div>

            </div>
        </div>
    );
};

export default DeleteCommunityModal;