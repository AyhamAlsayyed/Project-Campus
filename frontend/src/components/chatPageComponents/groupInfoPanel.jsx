import { useState, useRef, useEffect } from 'react';
import styles from './groupInfoPanel.module.css';
import {
    Camera, MoreHorizontal, MinusCircle, Edit2, FileText, Check, X
} from 'lucide-react';

// Custom Asset PNG Imports
import BackArrow from '../../Assets/icons/arrow-left.png';
import Search from '../../Assets/icons/search.png';
import Settings from '../../Assets/icons/setting.png';
import BellActive from '../../Assets/icons/notifications-active.png';
import BellInactive from '../../Assets/icons/notifications.png';
import Bin from '../../Assets/icons/bin.png';
import Share from '../../Assets/icons/share.png';
import AddFriend from '../../Assets/icons/add-friend.png';

export default function GroupInfoPanel({
    // Real Data Props
    group = {},
    members = [],
    API = '',
    
    // Header Actions
    onBack,
    onSearchClick,
    onNotificationToggle,
    onSettingsClick,

    // Group Actions
    onUpdateGroupDetails, // (details) => {} e.g., details.name, details.bio
    onUpdateAvatar,       // (file) => {}
    onShareGroup,
    onAddMember,
    onClearChat,
    onDeleteGroup,

    // View Actions
    onViewAllMedia,
    onViewAllMembers,

    // Individual Member Actions
    onViewMemberProfile,  // (member) => {}
    onSendMessageToMember,// (member) => {}
    onMakeMemberAdmin,    // (member) => {}
    onRemoveMember        // (member) => {}
}) {
    // UI States
    const [openMemberId, setOpenMemberId] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    
    // Form States for Inline Editing
    const [editedName, setEditedName] = useState('');
    const [editedBio, setEditedBio] = useState('');
    const avatarInputRef = useRef(null);

    // Sync local form state when the real group data arrives/updates from the API
    useEffect(() => {
        setEditedName(group.name || '');
        setEditedBio(group.bio || '');
    }, [group]);

    // Derived Data
    const admin = members.find(m => m.role === 'Group admin');
    const regularMembers = members.filter(m => m.role !== 'Group admin');

    const avatarSrc = group.avatar
        ? (group.avatar.startsWith('http') ? group.avatar : `${API}${group.avatar}`)
        : null;

    // --- Action Handlers ---
    const handleAvatarFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file && onUpdateAvatar) {
            onUpdateAvatar(file);
        }
    };

    const handleSaveGroupDetails = () => {
        if (onUpdateGroupDetails) {
            onUpdateGroupDetails({ name: editedName, bio: editedBio });
        }
        setIsEditing(false);
    };

    const handleCancelGroupDetails = () => {
        setEditedName(group.name || '');
        setEditedBio(group.bio || '');
        setIsEditing(false);
    };

    // --- UI Styles for PNG Graphics ---
    const headerPngStyle = {
        width: '20px',
        height: '20px',
        objectFit: 'contain',
        filter: 'brightness(0) invert(0.9)'
    };

    const inlineButtonPngStyle = {
        width: '16px',
        height: '16px',
        objectFit: 'contain',
        filter: 'brightness(0) invert(0.9)',
        marginRight: '8px'
    };

    return (
        <div className={styles.container}>

            {/* ── Header ── */}
            <div className={styles.header}>
                <button className={styles.backBtn} onClick={onBack} aria-label="Go back">
                    <img src={BackArrow} alt="Back" style={headerPngStyle} />
                </button>
                <span className={styles.headerTitle}>Group Info</span>
                <div className={styles.headerIcons}>
                    <button className={styles.iconBtn} onClick={onSearchClick} aria-label="Search">
                        <img src={Search} alt="Search" style={headerPngStyle} />
                    </button>
                    <button className={styles.iconBtn} onClick={onNotificationToggle} aria-label="Notifications">
                        <img 
                            src={group.hasUnreadNotifications ? BellActive : BellInactive} 
                            alt="Notifications" 
                            style={headerPngStyle} 
                        />
                    </button>
                    <button className={styles.iconBtn} onClick={onSettingsClick} aria-label="Settings">
                        <img src={Settings} alt="Settings" style={headerPngStyle} />
                    </button>
                </div>
            </div>

            <div className={styles.headerDivider} />

            {/* ── Scrollable body ── */}
            <div className={styles.body}>

                {/* ── Top card: Flex Layout ── */}
                <div className={styles.topCard}>

                    {/* 1. Group Info and Picture Wrapper */}
                    <div className={styles.infoAndPictureWrapper}>
                        <div className={styles.avatarRing}>
                            <div className={styles.avatar}>
                                {avatarSrc
                                    ? <img src={avatarSrc} alt={group.name} className={styles.avatarImg} />
                                    : <span className={styles.avatarInitials}>{group.name?.slice(0, 2).toUpperCase() || ''}</span>
                                }
                            </div>
                            <button
                                className={styles.cameraBtn}
                                onClick={() => avatarInputRef.current?.click()}
                                aria-label="Change group photo"
                            >
                                <Camera size={13} />
                            </button>
                            <input 
                                ref={avatarInputRef} 
                                type="file" 
                                accept="image/*" 
                                style={{ display: 'none' }} 
                                onChange={handleAvatarFileChange}
                            />
                        </div>

                        <div className={styles.identityBlock}>
                            {group.type && (
                                <span className={styles.typeBadge}>{group.type}</span>
                            )}
                            <div className={styles.nameRow}>
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        value={editedName} 
                                        onChange={(e) => setEditedName(e.target.value)}
                                        className={styles.groupNameInput}
                                        style={{ background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '4px', padding: '2px 6px', fontSize: '1.1rem' }}
                                    />
                                ) : (
                                    <h2 className={styles.groupName}>{group.name}</h2>
                                )}
                                
                                {isEditing ? (
                                    <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                                        <button onClick={handleSaveGroupDetails} style={{ background: 'none', border: 'none', color: '#4ade80', cursor: 'pointer' }} aria-label="Save changes">
                                            <Check size={16} />
                                        </button>
                                        <button onClick={handleCancelGroupDetails} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }} aria-label="Cancel editing">
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <button className={styles.editBtn} onClick={() => setIsEditing(true)} aria-label="Edit">
                                        <span>Edit</span>
                                        <Edit2 size={13} />
                                    </button>
                                )}
                            </div>
                            <p className={styles.createdBy}>
                                Created by: {group.conversations_owner || group.created_by || '—'}
                                {group.created_at && <>&nbsp;&nbsp;•&nbsp;&nbsp;{group.created_at}</>}
                            </p>
                        </div>
                    </div>

                    {/* 2. Description and Buttons Wrapper */}
                    <div className={styles.descriptionAndButtonsWrapper}>
                        <div className={styles.buttonsContainer}>
                            <button className={styles.shareBtn} onClick={onShareGroup}>
                                <img src={Share} alt="Share" style={inlineButtonPngStyle} />
                                <span>Share group</span>
                            </button>
                            <button className={styles.addMemberBtn} onClick={onAddMember}>
                                <img src={AddFriend} alt="Add member" style={inlineButtonPngStyle} />
                                <span>Add member</span>
                            </button>
                        </div>

                        <div className={styles.bioBox}>
                            {isEditing ? (
                                <textarea 
                                    value={editedBio} 
                                    onChange={(e) => setEditedBio(e.target.value)}
                                    style={{ background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '4px', padding: '6px', width: '100%', minHeight: '50px', fontSize: '0.85rem', resize: 'vertical' }}
                                />
                            ) : (
                                <p className={styles.bioText}>
                                    {group.bio || 'No description added yet.'}
                                </p>
                            )}
                            <span className={styles.memberCount}>
                                {group.member_count ?? members.length}/{group.member_limit ?? 150}
                            </span>
                        </div>
                    </div>

                </div>

                <div className={styles.sectionDivider} />

                {/* ── Group details heading ── */}
                <div className={styles.detailsHeading}>
                    <span className={styles.sectionTitle}>Group details</span>
                    <span className={styles.sectionSub}>
                        In this section you'll get to see more details from this group, like media share, members and more!
                    </span>
                </div>

                {/* ── Media card ── */}
                <div className={styles.mediaCard}>
                    <div className={styles.mediaCardHeader}>
                        <span className={styles.mediaCardTitle}>Media, links and docs</span>
                        <div className={styles.mediaHeaderLine} />
                    </div>

                    <div className={styles.mediaGrid}>
                        {group.media && group.media.slice(0, 3).map((item, index) => {
                            if (item.type === 'pdf') {
                                return (
                                    <div key={item.id || index} className={styles.pdfTile}>
                                        <FileText size={28} color="#E53935" />
                                        <strong className={styles.pdfName}>{item.name || 'Document.pdf'}</strong>
                                        <span className={styles.pdfMeta}>
                                            {item.pages || '1'} pages · pdf · {item.size || '1 MB'}
                                        </span>
                                    </div>
                                );
                            }
                            return (
                                <div
                                    key={item.id || index}
                                    className={styles.imageTile}
                                    style={{ backgroundImage: `url(${item.url || item.src})` }}
                                />
                            );
                        })}
                        {(!group.media || group.media.length === 0) && (
                            <div className={styles.emptyMediaMsg}>No media shared yet.</div>
                        )}

                        {/* View all button */}
                        {(group.media?.length > 0 || group.media_total > 0) && (
                            <button className={styles.viewAllTile} onClick={onViewAllMedia}>
                                View all {group.media_total ?? group.media?.length ?? 0}+
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Group members ── */}
                <div className={styles.membersSection}>
                    <div className={styles.membersSectionHeader}>
                        <div className={styles.membersSectionLeft}>
                            <span className={styles.sectionTitle}>Group members</span>
                            <span className={styles.memberDot} />
                            <span className={styles.memberCountLabel}>{members.length} members</span>
                        </div>
                        <button className={styles.viewAllBtn} onClick={onViewAllMembers}>View all</button>
                    </div>

                    {admin && (
                        <MemberRow 
                            member={admin} 
                            isAdmin 
                            openMemberId={openMemberId} 
                            setOpenMemberId={setOpenMemberId} 
                            API={API} 
                        />
                    )}
                    {regularMembers.map(m => (
                        <MemberRow 
                            key={m.id} 
                            member={m} 
                            openMemberId={openMemberId} 
                            setOpenMemberId={setOpenMemberId} 
                            onViewProfile={onViewMemberProfile}
                            onSendMessage={onSendMessageToMember}
                            onMakeAdmin={onMakeMemberAdmin}
                            onRemove={onRemoveMember}
                            API={API} 
                        />
                    ))}
                    
                    {members.length === 0 && (
                        <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', padding: '10px 0' }}>
                            No members found.
                        </span>
                    )}
                </div>

                {/* ── Other Actions ── */}
                <div className={styles.otherSection}>
                    <span className={styles.sectionTitle}>Other</span>
                    <button className={styles.otherBtn} onClick={onClearChat}>
                        <MinusCircle size={18} className={styles.otherIcon} />
                        <span>Clear chat</span>
                    </button>
                    <button className={`${styles.otherBtn} ${styles.destructiveBtn}`} onClick={onDeleteGroup}>
                        <img src={Bin} alt="Delete" style={inlineButtonPngStyle} />
                        <span>Delete group</span>
                    </button>
                </div>

            </div>
        </div>
    );
}

function MemberRow({ 
    member, 
    isAdmin, 
    openMemberId, 
    setOpenMemberId, 
    onViewProfile,
    onSendMessage,
    onMakeAdmin,
    onRemove,
    API 
}) {
    const isOpen = openMemberId === member.id;
    const avatarSrc = member.avatar
        ? (member.avatar.startsWith('http') ? member.avatar : `${API}${member.avatar}`)
        : null;

    return (
        <div className={styles.memberRow}>
            <div className={styles.memberAvatar}>
                {avatarSrc
                    ? <img src={avatarSrc} alt={member.name} className={styles.memberAvatarImg} />
                    : <span className={styles.memberInitials}>{member.initials || member.name?.slice(0, 2).toUpperCase()}</span>
                }
            </div>
            <div className={styles.memberInfo}>
                <span className={isAdmin ? styles.adminBadge : styles.memberBadge}>
                    {isAdmin ? 'Group admin' : 'member'}
                </span>
                <div className={styles.memberNameRow}>
                    <span className={isAdmin ? styles.adminName : styles.memberName}>{member.name}</span>
                    <span className={styles.memberRoleLabel}>{member.roleLabel}</span>
                </div>
            </div>

            {!isAdmin && (
                <div className={styles.memberMenuWrapper}>
                    <button
                        className={styles.memberMenuBtn}
                        onClick={() => setOpenMemberId(isOpen ? null : member.id)}
                        aria-label="Member options"
                    >
                        <MoreHorizontal size={18} />
                    </button>
                    {isOpen && (
                        <div className={styles.memberDropdown}>
                            <button className={styles.memberMenuItem} onClick={() => { onViewProfile?.(member); setOpenMemberId(null); }}>
                                View profile
                            </button>
                            <button className={styles.memberMenuItem} onClick={() => { onSendMessage?.(member); setOpenMemberId(null); }}>
                                Send message
                            </button>
                            <button className={styles.memberMenuItem} onClick={() => { onMakeAdmin?.(member); setOpenMemberId(null); }}>
                                Make admin
                            </button>
                            <div className={styles.menuDivider} />
                            <button 
                                className={`${styles.memberMenuItem} ${styles.destructiveMI}`} 
                                onClick={() => { onRemove?.(member); setOpenMemberId(null); }}
                            >
                                Remove from group
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}