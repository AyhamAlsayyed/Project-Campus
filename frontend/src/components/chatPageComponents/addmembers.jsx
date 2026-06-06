import React, { useState, useEffect } from 'react';
import styles from './addmembers.module.css';

import Help from '../../Assets/icons/help.png';
import BackButton from '../../Assets/icons/arrow-left.png';
import SearchIcon from '../../Assets/icons/search.png';
import Share from '../../Assets/icons/share.png';


export default function AddMembers({
    onBack,
    onDone,
    API = '',
    token = '',
    group = {},
    createMode = false,
    isCreating = false,
    createError = '',
}) {
    
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [isCopied, setIsCopied] = useState(false);
    const [contacts, setContacts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const groupInviteLink = `${window.location.origin}/groups/${group.id || ''}`;
    useEffect(() => {
        if (!createMode && !group.id) return;
        if (!token) return;

        console.log('Fetching friends, createMode:', createMode, 'group.id:', group.id); // 👈

        const fetchInviteOptions = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const url = createMode
                    ? `${API}/api/groups/invite-friends/`
                    : `${API}/api/groups/${group.id}/invite-friends/`;

                console.log('URL:', url); // 👈

                const res = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const data = await res.json();
              

                setContacts(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error(err);
                setError('Could not load contacts. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchInviteOptions();
    }, [group.id, token, API, createMode]);

    const handleToggleMember = (contact) => {
        if (contact.role === 'instructor' || contact.isInstructor) return;

        setSelectedMembers(prev =>
            prev.includes(contact.id)
                ? prev.filter(id => id !== contact.id)
                : [...prev, contact.id]
        );
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(groupInviteLink);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy link:', err);
        }
    };


    const handleDone = async () => {
        if (!selectedMembers.length) return;
        if (createMode) {
            onDone(selectedMembers);
            return;
        }

        setIsSubmitting(true);
        const results = { success: [], failed: [] };

        try {
            await Promise.all(
                selectedMembers.map(async (memberId) => {
                    try {
                        const res = await fetch(`${API}/api/groups/${group.id}/add-member/`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ user_id: memberId })
                        });

                        if (res.ok) {
                            results.success.push(memberId);
                        } else {
                            const errData = await res.json();
                            console.error(`Failed to add member ${memberId}:`, errData.error);
                            results.failed.push(memberId);
                        }
                    } catch (err) {
                        console.error(`Error adding member ${memberId}:`, err);
                        results.failed.push(memberId);
                    }
                })
            );

            // Remove successfully added members from the list
            setContacts(prev => prev.filter(c => !results.success.includes(c.id)));
            setSelectedMembers([]);

            if (results.failed.length > 0) {
                setError(`${results.failed.length} member(s) could not be added. Please try again.`);
            }

            // Bubble up to parent with the successfully added IDs
            if (onDone) onDone(results.success);

        } catch (err) {
            console.error('Unexpected error during member add:', err);
            setError('Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredContacts = contacts.filter(contact =>
        (contact.name || contact.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (contact.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isDoneEnabled = selectedMembers.length > 0 && !isSubmitting && !isCreating;

    return (
        <div className={styles.pageContainer}>
            <div className={styles.createGroupCard}>

                {/* --- HEADER --- */}
                <div className={styles.header}>
                    <button className={styles.iconBtn} onClick={onBack}>
                        <img src={BackButton} alt="Back" className={styles.backIconAsset} />
                    </button>

                    <div className={styles.headerTitleContainer}>
                        <h1 className={styles.headerTitle}>Add Members</h1>
                        <p className={styles.headerSubtitle}>
                            <span className={styles.starPrefix}>*</span> Select users to invite to the group
                        </p>
                    </div>

                    <div className={styles.headerRight}>
                        {selectedMembers.length > 0 && (
                            <span className={styles.selectionCount}>
                                {selectedMembers.length} Selected
                            </span>
                        )}
                        <button
                            className={`${styles.doneBtn} ${isDoneEnabled ? styles.doneBtnActive : ''}`}
                            disabled={!isDoneEnabled}
                            onClick={handleDone}
                        >
                            {isCreating ? 'Creating...' : isSubmitting ? 'Adding...' : 'Done'}
                        </button>
                        <img src={Help} alt="Help" className={styles.helpIconAsset} />
                    </div>
                </div>

                <div className={styles.sectionDivider} />

                {/* --- SEARCH BAR & SHARE BUTTON ROW --- */}
                <div className={styles.searchAndShareRow}>
                    <div className={styles.searchContactWrap}>
                        <img src={SearchIcon} alt="Search" className={styles.searchIconAsset} />
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Searching for someone?"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <button className={styles.shareBtn} onClick={handleCopyLink}>
                        <img src={Share} alt="Share Link" className={styles.shareIconAsset} />
                        <span className={styles.shareBtnText}>{isCopied ? 'Copied!' : 'Share link'}</span>
                    </button>
                </div>

                {/* --- ERROR BANNER --- */}
                {error && (
                    <div className={styles.errorBanner}>
                        {error}
                    </div>
                )}

                {/* --- CONTACTS LIST --- */}
                <div className={styles.contactsSection}>
                    {isLoading ? (
                        <div className={styles.loadingState}>Loading contacts...</div>
                    ) : filteredContacts.length === 0 ? (
                        <div className={styles.emptyState}>
                            {searchQuery ? 'No contacts match your search.' : 'No eligible members to add.'}
                        </div>
                    ) : (
                        filteredContacts.map((contact, index) => {
                            const isSelected = selectedMembers.includes(contact.id);
                            const isInstructor = contact.role === 'instructor' || contact.isInstructor;
                            const isLast = index === filteredContacts.length - 1;

                            // Resolve avatar the same way GroupInfoPanel does
                            const avatarSrc = contact.avatar
                                ? (contact.avatar.startsWith('http') ? contact.avatar : `${API}${contact.avatar}`)
                                : null;

                            return (
                                <React.Fragment key={contact.id}>
                                    <div
                                        className={`${styles.contactRow} ${isInstructor ? styles.instructorRow : ''}`}
                                        onClick={() => handleToggleMember(contact)}
                                    >
                                        <div className={styles.contactLeftBlock}>
                                            <div className={styles.avatarWrapper}>
                                                {avatarSrc ? (
                                                    <img src={avatarSrc} alt={contact.name || contact.username} className={styles.avatarImage} />
                                                ) : (
                                                    <span className={styles.avatarInitials}>
                                                        {(contact.name || contact.username || '').slice(0, 2).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <div className={styles.contactDetails}>
                                                <span className={styles.roleLabel}>
                                                    {isInstructor ? 'Instructor' : 'Student'}
                                                </span>
                                                <span className={styles.contactName}>
                                                    {contact.name || contact.username}
                                                </span>
                                                {contact.email && (
                                                    <span className={styles.contactEmail}>{contact.email}</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className={styles.selectionWrapper}>
                                            {isInstructor ? (
                                                <div className={styles.instructorCircle} />
                                            ) : (
                                                <div className={`${styles.checkCircle} ${isSelected ? styles.checkCircleSelected : ''}`} />
                                            )}
                                        </div>
                                    </div>
                                    {!isLast && <div className={styles.contactDivider} />}
                                </React.Fragment>
                            );
                        })
                    )}
                </div>

            </div>
        </div>
    );
}