import { useState, useRef, useEffect, useMemo } from 'react';
import styles from './groupInfoPanel.module.css';
import {
    Camera, MoreHorizontal, MinusCircle, Edit2, FileText, Check, X
} from 'lucide-react';

// Custom Asset PNG Imports
import BackArrow from '../../Assets/icons/arrow-left.png';
import SearchIconAsset from '../../Assets/icons/search.png';
import Settings from '../../Assets/icons/setting.png';
import BellActive from '../../Assets/icons/notifications-active.png';
import BellInactive from '../../Assets/icons/notifications.png';
import Bin from '../../Assets/icons/bin.png';
import Share from '../../Assets/icons/share.png';
import AddFriend from '../../Assets/icons/add-friend.png';
import { useNavigate } from 'react-router-dom';

export default function GroupInfoPanel({
    // Base Context Props
    group = {},
    members = [],
    messages = [],
    API = '',
    token = '',
    currentUser = {},

    // Header Actions
    onBack,
    onSearchClick,
    onNotificationToggle,
    onSettingsClick,

    // Group Actions
    onUpdateGroupDetails,
    onUpdateAvatar,
    onClearChat,
    onDeleteGroup,

    // View Panel Navigation Handlers
    onViewAllMedia,
    onViewAllMembers,

    // Individual Member Row Core Dropdown Actions
    onViewMemberProfile,
    onSendMessageToMember,
    onMakeMemberAdmin,
    onRemoveMember
}) {

    // UI Local Modals States
    const [openMemberId, setOpenMemberId] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [currentMembers, setCurrentMembers] = useState(members);
    const [showShareGroupModal, setShowShareGroupModal] = useState(false);

    // Group Permissions View Toggle States
    const [showPermissions, setShowPermissions] = useState(false);
    const [showAdmins, setShowAdmins] = useState(false); // <--- Added Admin View State

    const [permissions, setPermissions] = useState({
        editSettings: true,
        sendMessages: true,
        addMembers: true,
        approveMembers: false
    });

    // Search Query Strings State
    const [memberSearch, setMemberSearch] = useState('');
    const [shareSearch, setShareSearch] = useState('');
    const [lightboxUrl, setLightboxUrl] = useState(null);

    // Clipboard State Indicator
    const [copied, setCopied] = useState(false);

    // Dynamic Database Content State
    const [friends, setFriends] = useState([]);

    // Inline Editing State Controllers
    const [editedName, setEditedName] = useState('');
    const [editedBio, setEditedBio] = useState('');
    const avatarInputRef = useRef(null);

    // Determine if this is a group or a private chat
    const isGroup = group.is_group !== false;

    // Toggle single permission switch state handler
    const togglePermission = (key) => {
        setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Sync input initializations whenever the base chat reference shifts
    useEffect(() => {
        setEditedName(group.name || '');
        setEditedBio(group.bio || group.description || '');
    }, [group]);
    useEffect(() => setCurrentMembers(members), [members]);

    // ── NATIVE INNER FETCH: Pull friends eligible to be added or shared to ──
    useEffect(() => {
        if (group.id && token) {
            const fetchInviteOptions = async () => {
                try {
                    const res = await fetch(`${API}/api/groups/${group.id}/invite-friends/`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setFriends(Array.isArray(data) ? data : []);
                    }
                } catch (err) {
                    console.error("Error fetching native friends list for group info:", err);
                }
            };

            fetchInviteOptions();
        }
    }, [group.id, token, API]);

    useEffect(() => {
        if (group.id && token) {
            fetch(`${API}/api/groups/${group.id}/members/`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            })
                .then(res => res.json())
                .then(data => {
                    const seen = new Set();
                    const unique = (Array.isArray(data) ? data : []).filter(m => {
                        if (seen.has(m.id)) return false;
                        seen.add(m.id);
                        return true;
                    });
                    setCurrentMembers(unique);
                })
                .catch(err => console.error("Error fetching sorted members:", err));
        }
    }, [group.id, token, API]);


    const admin = currentMembers.find(m => m.group_role === 'owner' || m.group_role === 'admin');
    const regularMembers = currentMembers.filter(m => m.group_role !== 'owner' && m.group_role !== 'admin');

    const allAdmins = currentMembers.filter(m => m.group_role === 'owner' || m.group_role === 'admin');
    const isInstructor = currentMembers.some(m =>
        (m.id == currentUser?.id || m.username === currentUser?.username) &&
        (m.group_role === 'owner' || m.group_role === 'admin')
    );

    const avatarSrc = group.avatar
        ? (group.avatar.startsWith('http') ? group.avatar : `${API}${group.avatar}`)
        : null;

    const groupShareUrl = `${window.location.origin}/groups/${group.id || ''}`;

    const filteredFriendsForAdd = friends.filter(f =>
        (f.name || f.username || '').toLowerCase().includes(memberSearch.toLowerCase())
    );

    const filteredFriendsForShare = friends.filter(f =>
        (f.name || f.username || '').toLowerCase().includes(shareSearch.toLowerCase())
    );

    // ── DYNAMIC MEDIA EXTRACTION ──
    const extractedMedia = useMemo(() => {
        if (!messages || !Array.isArray(messages)) return [];

        const items = [];

        messages.forEach((msg, msgIdx) => {
            if (Array.isArray(msg.media) && msg.media.length > 0) {
                msg.media.forEach((m, i) => {
                    const rawUrl = m.url || '';
                    const fullUrl = rawUrl.startsWith('http') ? rawUrl : `${API}${rawUrl}`;
                    items.push({
                        id: m.id ?? `${msgIdx}-${i}`,
                        type: /\.(pdf|doc|docx|txt)$/i.test(rawUrl) ? 'pdf' : m.type === 'video' ? 'video' : 'image',
                        url: fullUrl,
                        name: m.file_name || rawUrl.split('/').pop() || 'Attachment',
                        file_type: m.file_type,
                    });
                });
            }

            const rawUrl = msg.file || msg.image || '';
            if (rawUrl) {
                const fullUrl = rawUrl.startsWith('http') ? rawUrl : `${API}${rawUrl}`;
                items.push({
                    id: `flat-${msgIdx}`,
                    type: /\.(pdf|doc|docx|txt)$/i.test(rawUrl) ? 'pdf' : 'image',
                    url: fullUrl,
                    name: msg.file_name || rawUrl.split('/').pop() || 'Attachment',
                });
            }
        });

        return items.filter(item => item.url && item.url !== API);
    }, [messages, API]);

    // ── INTERNAL ACTIONS ──
    const handleAddMemberSubmit = async (friendId) => {
        try {
            const res = await fetch(`${API}/api/groups/${group.id}/add-member/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ user_id: friendId })
            });

            if (res.ok) {
                setFriends(prev => prev.filter(f => f.id !== friendId));
            } else {
                const errData = await res.json();
                alert(errData.error || "Failed to add member");
            }
        } catch (err) {
            console.error("Error performing inner component add:", err);
        }
    };

    const handleShareWithFriend = async (friendId) => {
        try {
            const res = await fetch(`${API}/api/groups/${group.id}/share-link/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    recipient_id: friendId,
                    link_url: groupShareUrl
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                alert(errData.error || "Failed to share link");
            }
        } catch (err) {
            console.error("Error performing inner component link dispatch:", err);
        }
    };

    const handleAvatarFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const formData = new FormData();
            formData.append("image", file);

            const res = await fetch(
                `${API}/api/groups/${group.id}/edit-image/`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.detail || "Upload failed");
            }

        } catch (err) {
            console.error(err);
        }
    };

    const handleSaveGroupDetails = async () => {
        try {
            const res = await fetch(`${API}/api/groups/${group.id}/edit-details/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: editedName,
                    description: editedBio,
                }),
            });

            if (!res.ok) {
                const errData = await res.json();
                alert(errData.error || 'Failed to update group');
                return;
            }

            const updatedGroup = await res.json();
            if (onUpdateGroupDetails) onUpdateGroupDetails(updatedGroup);
            setIsEditing(false);

        } catch (err) {
            console.error('Error updating group:', err);
            alert('Something went wrong while updating the group');
        }
    };

    const handleCancelGroupDetails = () => {
        setEditedName(group.name || '');
        setEditedBio(group.description || group.bio || '');
        setIsEditing(false);
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(groupShareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    const headerPngStyle = { width: '20px', height: '20px', objectFit: 'contain', filter: 'brightness(0) invert(0.9)' };
    const inlineButtonPngStyle = { width: '16px', height: '16px', objectFit: 'contain', filter: 'brightness(0) invert(0.9)', marginRight: '8px' };

    return (
        <div className={styles.container}>

            {showAdmins ? (

                <>
                    <div className={styles.header}>
                        <button className={styles.backBtn} onClick={() => { setShowAdmins(false); setOpenMemberId(null); }} aria-label="Return to Permissions">
                            <img src={BackArrow} alt="Back" style={headerPngStyle} />
                        </button>
                        <span className={styles.headerTitle}>Group admins</span>
                    </div>

                    <div className={styles.headerDivider} />

                    <div className={styles.body}>
                        <div className={styles.membersSection} style={{ borderTop: 'none', marginTop: 0 }}>
                            {allAdmins.map(m => (
                                <MemberRow
                                    key={m.id}
                                    member={m}
                                    isAdmin={true}
                                    openMemberId={openMemberId}
                                    setOpenMemberId={setOpenMemberId}
                                    API={API}
                                />
                            ))}
                        </div>
                    </div>
                </>

            ) : showPermissions ? (
                // ── FULL PAGE: PERMISSIONS VIEW ──
                <>
                    <div className={styles.header}>
                        <button className={styles.backBtn} onClick={() => setShowPermissions(false)} aria-label="Return to Info">
                            <img src={BackArrow} alt="Back" style={headerPngStyle} />
                        </button>
                        <span className={styles.headerTitle}>Group permissions</span>
                    </div>

                    <div className={styles.headerDivider} />

                    <div className={styles.body}>
                        <div className={styles.permissionsScroll}>
                            {/* MEMBERS CAN SECTION */}
                            <h3 className={styles.sectionHeading}>Members can:</h3>
                            <div className={styles.permissionBlock}>

                                <div className={styles.permissionItem}>
                                    <div className={styles.permissionText}>
                                        <span className={styles.permissionLabel}>Edit group settings</span>
                                        <span className={styles.permissionDesc}>This includes the name, icon, description, disappearing message timer, and keeping messages.</span>
                                    </div>
                                    <label className={styles.toggleSwitch}>
                                        <input type="checkbox" checked={permissions.editSettings} onChange={() => togglePermission('editSettings')} />
                                        <span className={styles.toggleSlider}></span>
                                    </label>
                                </div>

                                <div className={styles.permissionItem}>
                                    <div className={styles.permissionText}>
                                        <span className={styles.permissionLabel}>Send messages</span>
                                    </div>
                                    <label className={styles.toggleSwitch}>
                                        <input type="checkbox" checked={permissions.sendMessages} onChange={() => togglePermission('sendMessages')} />
                                        <span className={styles.toggleSlider}></span>
                                    </label>
                                </div>

                                <div className={styles.permissionItem}>
                                    <div className={styles.permissionText}>
                                        <span className={styles.permissionLabel}>Add other members</span>
                                    </div>
                                    <label className={styles.toggleSwitch}>
                                        <input type="checkbox" checked={permissions.addMembers} onChange={() => togglePermission('addMembers')} />
                                        <span className={styles.toggleSlider}></span>
                                    </label>
                                </div>
                            </div>

                            {/* ADMINS CAN SECTION */}
                            <h3 className={styles.sectionHeading}>Admins can:</h3>
                            <div className={styles.permissionBlock}>
                                <div className={styles.permissionItem}>
                                    <div className={styles.permissionText}>
                                        <span className={styles.permissionLabel}>Approve new members</span>
                                        <span className={styles.permissionDesc}>When turned on, admins must approve anyone who wants to join the group.</span>
                                    </div>
                                    <label className={styles.toggleSwitch}>
                                        <input type="checkbox" checked={permissions.approveMembers} onChange={() => togglePermission('approveMembers')} />
                                        <span className={styles.toggleSlider}></span>
                                    </label>
                                </div>

                                {/* ── EDIT GROUP ADMINS NAV BUTTON ── */}
                                <div
                                    className={styles.permissionItem}
                                    style={{ cursor: 'pointer', marginTop: '4px' }}
                                    onClick={() => setShowAdmins(true)}
                                >
                                    <div className={styles.permissionText}>
                                        <span className={styles.permissionLabel}>Edit group admins</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>

            ) : (
                // ── NORMAL GROUP INFO VIEW ──
                <>
                    {/* ── Header ── */}
                    <div className={styles.header}>
                        <button className={styles.backBtn} onClick={onBack} aria-label="Go back">
                            <img src={BackArrow} alt="Back" style={headerPngStyle} />
                        </button>
                        <span className={styles.headerTitle}>{isGroup ? 'Group Info' : 'User Info'}</span>
                        <div className={styles.headerIcons}>
                            <button className={styles.iconBtn} onClick={onSearchClick} aria-label="Search">
                                <img src={SearchIconAsset} alt="Search" style={headerPngStyle} />
                            </button>
                            <button className={styles.iconBtn} onClick={onNotificationToggle} aria-label="Notifications">
                                <img
                                    src={group.hasUnreadNotifications ? BellActive : BellInactive}
                                    alt="Notifications"
                                    style={headerPngStyle}
                                />
                            </button>
                            <button
                                className={styles.iconBtn}
                                onClick={() => {
                                    if (isGroup) {
                                        setShowPermissions(true);
                                    }
                                    if (onSettingsClick) onSettingsClick();
                                }}
                                aria-label="Settings"
                            >
                                <img src={Settings} alt="Settings" style={headerPngStyle} />
                            </button>
                        </div>
                    </div>

                    <div className={styles.headerDivider} />

                    {/* ── Scrollable Body ── */}
                    <div className={styles.body}>

                        {/* ── Top Identity Header Segment ── */}
                        <div className={styles.topCard}>
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
                                    {isGroup && group.type && (
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
                                                <button onClick={handleSaveGroupDetails} style={{ background: 'none', border: 'none', color: '#4ade80', cursor: 'pointer' }}>
                                                    <Check size={16} />
                                                </button>
                                                <button onClick={handleCancelGroupDetails} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button className={styles.editBtn} onClick={() => setIsEditing(true)}>
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

                            {isGroup && (
                                <div className={styles.descriptionAndButtonsWrapper}>
                                    <div className={styles.buttonsContainer}>
                                        <button className={styles.shareBtn} onClick={() => setShowShareGroupModal(true)}>
                                            <img src={Share} alt="Share" style={inlineButtonPngStyle} />
                                            <span>Share group</span>
                                        </button>
                                        <button className={styles.addMemberBtn} onClick={() => setShowAddMemberModal(true)}>
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
                                                {group.description || group.bio || 'No description added yet.'}
                                            </p>
                                        )}
                                        <span className={styles.memberCount}>
                                            {group.member_count ?? currentMembers.length}/{group.member_limit ?? 150}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={styles.sectionDivider} />

                        {/* ── Subtitle Info Block ── */}
                        <div className={styles.detailsHeading}>
                            <span className={styles.sectionTitle}>{isGroup ? 'Group details' : 'User details'}</span>
                            <span className={styles.sectionSub}>
                                {isGroup ? "In this section you'll get to see more details from this group, like media share, members and more!" : "View shared media, links, and documents with this user."}
                            </span>
                        </div>

                        {/* ── Media Cards Tray ── */}
                        <div className={styles.mediaCard}>
                            <div className={styles.mediaCardHeader}>
                                <span className={styles.mediaCardTitle}>Media, links and docs</span>
                                <div className={styles.mediaHeaderLine} />
                            </div>

                            <div className={styles.mediaGrid}>
                                {extractedMedia.slice(0, 3).map((item) => {
                                    if (item.type === 'pdf') {
                                        return (
                                            <div key={item.id} className={styles.pdfTile}>
                                                <FileText size={28} color="#E53935" />
                                                <strong className={styles.pdfName}>{item.name || 'Document'}</strong>
                                                <span className={styles.pdfMeta}>
                                                    {item.pages || '1'} pages · pdf · {item.size || ''}
                                                </span>
                                            </div>
                                        );
                                    }
                                    return (
                                        <div key={item.id} className={styles.imageTile} onClick={() => setLightboxUrl(item.url)}>
                                            <img
                                                src={item.url}
                                                alt="media"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit', display: 'block', cursor: 'pointer' }}
                                                onError={e => { e.currentTarget.style.display = 'none'; }}
                                            />
                                        </div>
                                    );
                                })}
                                {extractedMedia.length === 0 && (
                                    <div className={styles.emptyMediaMsg}>No media shared yet.</div>
                                )}

                                {extractedMedia.length > 0 && (
                                    <button className={styles.viewAllTile} onClick={onViewAllMedia}>
                                        View all {extractedMedia.length}+
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* ── Group Members Roster ── */}
                        {isGroup && (
                            <div className={styles.membersSection}>
                                <div className={styles.membersSectionHeader}>
                                    <div className={styles.membersSectionLeft}>
                                        <span className={styles.sectionTitle}>Group members</span>
                                        <span className={styles.memberDot} />
                                        <span className={styles.memberCountLabel}>{currentMembers.length} members</span>
                                    </div>
                                    <button className={styles.viewAllBtn} onClick={onViewAllMembers}>View all</button>
                                </div>

                                {allAdmins.map(m => (
                                    <MemberRow
                                        key={m.id}
                                        member={m}
                                        isAdmin={true}
                                        onBack={onBack}
                                        token={token}
                                        currentUser={currentUser}
                                        canManage={isInstructor}
                                        openMemberId={openMemberId}
                                        setOpenMemberId={setOpenMemberId}
                                        API={API}
                                    />
                                ))}
                                {regularMembers.map(m => (
                                    <MemberRow
                                        key={m.id}
                                        member={m}
                                        token={token}
                                        onBack={onBack}
                                        openMemberId={openMemberId}
                                        canManage={isInstructor}
                                        setOpenMemberId={setOpenMemberId}
                                        onViewProfile={onViewMemberProfile}
                                        currentUser={currentUser}
                                        onSendMessage={onSendMessageToMember}
                                        onMakeAdmin={onMakeMemberAdmin}
                                        onRemove={onRemoveMember}
                                        API={API}
                                    />
                                ))}
                            </div>
                        )}

                        <div className={styles.otherSection}>
                            <span className={styles.sectionTitle}>Other</span>
                            <button className={styles.otherBtn} onClick={onClearChat}>
                                <MinusCircle size={18} className={styles.otherIcon} />
                                <span>Clear chat</span>
                            </button>
                            <button className={`${styles.otherBtn} ${styles.destructiveBtn}`} onClick={onDeleteGroup}>
                                <img src={Bin} alt="Delete" style={inlineButtonPngStyle} />
                                <span>{isGroup ? 'Delete group' : 'Delete chat'}</span>
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* ── POPUP MODAL COMPONENT: ADD MEMBER ── */}
            {showAddMemberModal && (
                <div className={styles.modalOverlay} onClick={() => setShowAddMemberModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>Add Group Member</h3>
                            <button className={styles.modalCloseBtn} onClick={() => setShowAddMemberModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className={styles.contactWrapper}>
                            <div className={styles.searchContactWrap}>
                                <div className={styles.searchIcon}>
                                    <img src={SearchIconAsset} alt="Search" style={{ width: '16px', height: '16px', filter: 'brightness(0) invert(0.65)' }} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search friends..."
                                    className={styles.searchInput}
                                    value={memberSearch}
                                    onChange={(e) => setMemberSearch(e.target.value)}
                                />
                            </div>

                            <div className={styles.popupScrollList}>
                                {filteredFriendsForAdd.map(friend => {
                                    const friendAvatar = friend.avatar ? (friend.avatar.startsWith('http') ? friend.avatar : `${API}${friend.avatar}`) : null;
                                    return (
                                        <div key={friend.id} className={styles.popupItemRow}>
                                            <div className={styles.popupItemLeft}>
                                                <div className={styles.popupItemAvatar}>
                                                    {friendAvatar ? (
                                                        <img src={friendAvatar} alt={friend.name} />
                                                    ) : (
                                                        <span>{friend.name?.slice(0, 2).toUpperCase() || friend.username?.slice(0, 2).toUpperCase()}</span>
                                                    )}
                                                </div>
                                                <span className={styles.popupItemName}>{friend.name || friend.username}</span>
                                            </div>
                                            <button
                                                className={styles.popupActionButton}
                                                onClick={() => {
                                                    handleAddMemberSubmit(friend.id);
                                                    setShowAddMemberModal(false);
                                                }}
                                            >
                                                Add
                                            </button>
                                        </div>
                                    );
                                })}
                                {filteredFriendsForAdd.length === 0 && (
                                    <div className={styles.popupEmptyState}>No matching friends found</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── POPUP MODAL COMPONENT: SHARE GROUP LINK ── */}
            {showShareGroupModal && (
                <div className={styles.modalOverlay} onClick={() => setShowShareGroupModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>Share Group</h3>
                            <button className={styles.modalCloseBtn} onClick={() => setShowShareGroupModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className={styles.copyWidgetContainer}>
                            <input
                                type="text"
                                readOnly
                                value={groupShareUrl}
                                className={styles.copyWidgetInput}
                            />
                            <button className={styles.copyWidgetBtn} onClick={handleCopyLink}>
                                {copied ? 'Copied!' : 'Copy Link'}
                            </button>
                        </div>

                        <div className={styles.contactWrapper}>
                            <div className={styles.searchContactWrap}>
                                <div className={styles.searchIcon}>
                                    <img src={SearchIconAsset} alt="Search" style={{ width: '16px', height: '16px', filter: 'brightness(0) invert(0.65)' }} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search friends to send link..."
                                    className={styles.searchInput}
                                    value={shareSearch}
                                    onChange={(e) => setShareSearch(e.target.value)}
                                />
                            </div>

                            <div className={styles.popupScrollList}>
                                {filteredFriendsForShare.map(friend => {
                                    const friendAvatar = friend.avatar ? (friend.avatar.startsWith('http') ? friend.avatar : `${API}${friend.avatar}`) : null;
                                    return (
                                        <div key={friend.id} className={styles.popupItemRow}>
                                            <div className={styles.popupItemLeft}>
                                                <div className={styles.popupItemAvatar}>
                                                    {friendAvatar ? (
                                                        <img src={friendAvatar} alt={friend.name} />
                                                    ) : (
                                                        <span>{friend.name?.slice(0, 2).toUpperCase() || friend.username?.slice(0, 2).toUpperCase()}</span>
                                                    )}
                                                </div>
                                                <span className={styles.popupItemName}>{friend.name || friend.username}</span>
                                            </div>
                                            <button
                                                className={styles.popupActionButton}
                                                style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
                                                onClick={() => {
                                                    handleShareWithFriend(friend.id);
                                                    setShowShareGroupModal(false);
                                                }}
                                            >
                                                Send
                                            </button>
                                        </div>
                                    );
                                })}
                                {filteredFriendsForShare.length === 0 && (
                                    <div className={styles.popupEmptyState}>No matching friends found</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {lightboxUrl && (
                <div
                    onClick={() => setLightboxUrl(null)}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        background: 'rgba(0,0,0,0.92)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'zoom-out',
                    }}
                >
                    <img
                        src={lightboxUrl}
                        alt="full"
                        onClick={e => e.stopPropagation()}
                        style={{
                            maxWidth: '90vw', maxHeight: '90vh',
                            borderRadius: 12, objectFit: 'contain',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
                        }}
                    />
                    <button
                        onClick={() => setLightboxUrl(null)}
                        style={{
                            position: 'absolute', top: 20, right: 24,
                            background: 'rgba(255,255,255,0.1)', border: 'none',
                            borderRadius: '50%', width: 40, height: 40,
                            color: '#fff', fontSize: '1.2rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        ✕
                    </button>
                </div>
            )}
        </div>
    );
}

function MemberRow({
    member,
    isAdmin,
    openMemberId,
    token,
    setOpenMemberId,
    canManage,
    onBack,
    onViewProfile,
    onSendMessage,
    currentUser,
    onMakeAdmin,
    onRemove,
    API
}) {

    const avatarSrc = member.avatar
        ? (member.avatar.startsWith('http') ? member.avatar : `${API}${member.avatar}`)
        : null;
    const isOpen = openMemberId === member.id;
    const isSelf = member.id == currentUser?.id || member.username === currentUser?.username;
    const isAlreadyAdmin = member.group_role === 'owner' || member.group_role === 'admin';
    const navigate = useNavigate();

    return (
        <div className={styles.memberRow}>
            <div className={styles.memberAvatar}>
                {avatarSrc
                    ? <img src={avatarSrc} alt={member.name} className={styles.memberAvatarImg} />
                    : <span className={styles.memberInitials}>{member.initials || member.name?.slice(0, 2).toUpperCase()}</span>
                }
            </div>
            <div className={styles.memberInfo}>
                <span className={
                    member.group_role === 'owner' || member.group_role === 'admin'
                        ? styles.adminBadge
                        : styles.memberBadge
                }>
                    {member.group_role === 'owner'
                        ? 'Group creator'
                        : member.group_role === 'admin'
                            ? 'Group admin'
                            : 'Member'}
                </span>
                <div className={styles.memberNameRow}>
                    <span className={
                        (member.group_role === 'owner' || member.group_role === 'admin')
                            ? styles.adminName
                            : styles.memberName
                    } style={{ fontSize: "1.1rem" }}>
                        {member.name || member.username}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#999999', marginLeft: '6px', textTransform: 'capitalize' }}>
                        {member.role}
                    </span>
                </div>
            </div>

            {canManage && !isSelf && (
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
                            <button className={styles.memberMenuItem} onClick={() => {
                                navigate(`/profile/${member.id}`);
                                setOpenMemberId(null);
                            }}>
                                View profile
                            </button>
                            <button className={styles.memberMenuItem} onClick={async () => {
                                setOpenMemberId(null);
                                onBack?.();
                                // Always use create_dm — it returns existing DM if already exists
                                const res = await fetch(`${API}/api/conversations/create/${member.id}/`, {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${token}`,
                                        'Content-Type': 'application/json'
                                    }
                                });
                                const data = await res.json();
                                if (data.id) navigate(`/chats/${data.id}`);
                            }}>
                                Send message
                            </button>
                            {isAlreadyAdmin ? (
                                <button className={styles.memberMenuItem} onClick={() => { onMakeAdmin?.(member); setOpenMemberId(null); }}>
                                    Remove admin
                                </button>
                            ) : (
                                <button className={styles.memberMenuItem} onClick={() => { onMakeAdmin?.(member); setOpenMemberId(null); }}>
                                    Make admin
                                </button>
                            )}
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