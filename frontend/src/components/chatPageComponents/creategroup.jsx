import React, { useState, useRef } from 'react';
import styles from './creategroup.module.css';
import {
    Camera,
    Edit2,
    MessageSquare,
    UserPlus,
    UserCheck
} from 'lucide-react';

// Imported asset paths
import Help from '../../Assets/icons/help.png';
import BackButton from '../../Assets/icons/arrow-left.png';
import Education from '../../Assets/icons/education.png';
import SettingsIcon from '../../Assets/icons/setting.png';
import SearchIcon from '../../Assets/icons/search.png'

// Added isInstructor to props (defaults to false)
export default function CreateGroup({ onBack, onCreate, isInstructor = false }) {
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    
    // Default states per your request
    const [isAcademic, setIsAcademic] = useState(false); // Academic off
    const [canEditSettings, setCanEditSettings] = useState(false); // Off by default
    const [canSendMessages, setCanSendMessages] = useState(true); // On by default
    const [canAddMembers, setCanAddMembers] = useState(true); // On by default
    const [requireApproval, setRequireApproval] = useState(false); // Off by default
    
    // States and refs for the group picture upload
    const [groupImage, setGroupImage] = useState(null);
    const fileInputRef = useRef(null);

    const handleImageClick = () => {
        fileInputRef.current.click();
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setGroupImage(imageUrl);
        }
    };

    // Form button validation check
    const isCreateEnabled = groupName.trim() !== '' && groupImage !== null;

    return (
        <div className={styles.pageContainer}>
            <div className={styles.createGroupCard}>
                {/* --- HEADER --- */}
                <div className={styles.header}>
                    <button className={styles.iconBtn} onClick={onBack}>
                        <img src={BackButton} alt="Back" className={styles.backIconAsset} />
                    </button>
                    <h1 className={styles.headerTitle}>Create Group</h1>
                    <div className={styles.headerRight}>
                        <button 
                            className={`${styles.createBtn} ${isCreateEnabled ? styles.createBtnActive : ''}`} 
                            disabled={!isCreateEnabled}
                            onClick={onCreate}
                        >
                            Create
                        </button>
                        <img src={Help} alt="Help" className={styles.helpIconAsset} />
                    </div>
                </div>

                <div className={styles.sectionDivider}></div>

                {/* --- DETAILS SECTION --- */}
                <div className={styles.detailsSection}>
                    <div className={styles.photoColumn}>
                        <input 
                            type="file" 
                            accept="image/*" 
                            ref={fileInputRef} 
                            onChange={handleImageChange} 
                            style={{ display: 'none' }} 
                        />
                        <div className={styles.photoCircle} onClick={handleImageClick}>
                            {groupImage ? (
                                <img src={groupImage} alt="Group" className={styles.uploadedImage} />
                            ) : (
                                <Camera size={54} color="#CCCCCC" />
                            )}
                        </div>
                        <h3 className={styles.photoTitle}>Group photo</h3>
                        <p className={styles.photoSubtext}>
                            <span className={styles.asterisk}>*</span> Try giving the group a picture that suits its subject and make it stand out among other groups!
                        </p>
                    </div>

                    <div className={styles.inputsColumn}>
                        <div className={styles.nameRow}>
                            <div className={styles.inputWrapper}>
                                <input 
                                    type="text" 
                                    className={styles.nameInput} 
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                />
                                {!groupName && (
                                    <div className={styles.placeholderOverlay}>
                                        Group name <span className={styles.asterisk}>*</span>
                                    </div>
                                )}
                            </div>
                            <p className={styles.inputHint}>
                                You should give the group a name<br />before you continue.
                            </p>
                        </div>

                        <div className={styles.textareaWrapper}>
                            <textarea 
                                className={styles.descriptionInput}
                                placeholder="Group description"
                                value={groupDescription}
                                onChange={(e) => setGroupDescription(e.target.value)}
                                maxLength={150}
                            />
                            <span className={styles.charCount}>{groupDescription.length}/150</span>
                        </div>
                    </div>
                </div>

                <div className={styles.sectionDivider}></div>

                {/* --- ACADEMIC SECTION --- */}
                <div className={styles.academicSection}>
                    <div className={styles.academicLeft}>
                        <img src={Education} alt="Academic" className={styles.academicIconAsset} />
                        <h2 className={styles.academicTitle}>Academic</h2>
                    </div>
                    <div className={styles.academicMiddle}>
                        <p>This gives the group a badge that shows it as an Academic</p>
                        <p>group it gives it priority over other normal groups!</p>
                    </div>
                    <div className={styles.academicRight}>
                        <span className={styles.instructorOnly}>Available only for<br/>Instructors!</span>
                        {/* Instructor check gates the click */}
                        <div 
                            className={`${styles.toggle} ${!isInstructor ? styles.toggleDisabled : ''} ${isAcademic ? styles.toggleActive : ''}`} 
                            onClick={() => { if (isInstructor) setIsAcademic(!isAcademic); }}
                        >
                            <div className={styles.toggleThumb}></div>
                        </div>
                    </div>
                </div>

                <div className={styles.sectionDivider}></div>

                {/* --- PERMISSIONS SECTION --- */}
                <div className={styles.permissionsSection}>
                    <div className={styles.permissionsHeader}>
                        <img src={SettingsIcon} alt="Settings" className={styles.settingsIconAsset} />
                        <h2 className={styles.permissionsTitle}>Permissions</h2>
                        <span className={styles.permissionsSubtext}>Manage member actions and admin controls for this group</span>
                    </div>

                    <div className={styles.permissionsContainer}>
                        <div className={styles.membersHeader}>
                            <h3 className={styles.membersTitle}>Members</h3>
                            <div className={styles.membersLine}></div>
                        </div>
                        <p className={styles.membersSubtext}>Manage what non-admin members can do in the group.</p>

                        <div className={styles.permissionItem}>
                            <div className={styles.permissionLabel}>
                                <Edit2 size={20} color="#CCCCCC" />
                                <span>Edit group settings</span>
                            </div>
                            <div 
                                className={`${styles.toggle} ${canEditSettings ? styles.toggleActive : ''}`} 
                                onClick={() => setCanEditSettings(!canEditSettings)}
                            >
                                <div className={styles.toggleThumb}></div>
                            </div>
                        </div>

                        <div className={styles.permissionItem}>
                            <div className={styles.permissionLabel}>
                                <MessageSquare size={20} color="#CCCCCC" />
                                <span>Send new messages</span>
                            </div>
                            <div 
                                className={`${styles.toggle} ${canSendMessages ? styles.toggleActive : ''}`} 
                                onClick={() => setCanSendMessages(!canSendMessages)}
                            >
                                <div className={styles.toggleThumb}></div>
                            </div>
                        </div>

                        <div className={styles.permissionItem}>
                            <div className={styles.permissionLabel}>
                                <UserPlus size={20} color="#CCCCCC" />
                                <span>Add other members</span>
                            </div>
                            <div 
                                className={`${styles.toggle} ${canAddMembers ? styles.toggleActive : ''}`} 
                                onClick={() => setCanAddMembers(!canAddMembers)}
                            >
                                <div className={styles.toggleThumb}></div>
                            </div>
                        </div>

                        {/* --- ADMINS ONLY SUB SECTION --- */}
                        <div className={styles.adminsCanLabel}>Admins can:</div>

                        <div className={`${styles.permissionItem} ${styles.permissionItemWithDescription}`}>
                            <div className={styles.permissionLabelBlock}>
                                <div className={styles.permissionLabel}>
                                    <UserCheck size={20} color="#CCCCCC" />
                                    <span>Approve new members</span>
                                </div>
                                <p className={styles.approvalDescriptionText}>
                                    When turned on, admins must approve anyone who wants to join the group. <a href="#learn-more" className={styles.learnMoreLink}>Learn more</a>
                                </p>
                            </div>
                            <div 
                                className={`${styles.toggle} ${requireApproval ? styles.toggleActive : ''}`} 
                                onClick={() => setRequireApproval(!requireApproval)}
                            >
                                <div className={styles.toggleThumb}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}