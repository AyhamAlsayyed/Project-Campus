import React, { useState, useEffect } from 'react';
import styles from './requestsTab.module.css';
import PostCard from '../posts/postCard';

import ArrowLeft from '../../Assets/icons/arrow-left.png';
import SortIcon from '../../Assets/icons/sort.png';
import DefaultPfp from '../../Assets/icons/default-pfp.png';
import BlockIcon from '../../Assets/icons/block.png';
import InfoIcon from '../../Assets/icons/info.png';
import HelpIcon from '../../Assets/icons/help.png';

export default function RequestsTab({ groupId, token, onBack, isPublic = false }) {
    const [activeTab, setActiveTab] = useState('post');
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedItemIds, setSelectedItemIds] = useState([]);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [openActionMenuId, setOpenActionMenuId] = useState(null);

    // ── DATA STATE ──
    const [postRequests, setPostRequests] = useState([]);
    const [joinRequests, setJoinRequests] = useState([]);
    const [isLoadingPosts, setIsLoadingPosts] = useState(false);
    const [isLoadingJoins, setIsLoadingJoins] = useState(false);

    const API = 'http://localhost:8000';

    // ── FETCH: Post requests ──
    useEffect(() => {
        if (!groupId || !token) return;
        setIsLoadingPosts(true);
        fetch(`${API}/api/groups/${groupId}/post-requests/`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.ok ? res.json() : [])
            .then(data => setPostRequests(Array.isArray(data) ? data : []))
            .catch(err => console.error('Error fetching post requests:', err))
            .finally(() => setIsLoadingPosts(false));
    }, [groupId, token]);

    // ── FETCH: Join requests ──
    useEffect(() => {
        if (!groupId || !token) return;
        setIsLoadingJoins(true);
        fetch(`${API}/api/groups/${groupId}/join-requests/`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.ok ? res.json() : [])
            .then(data => setJoinRequests(Array.isArray(data) ? data : []))
            .catch(err => console.error('Error fetching join requests:', err))
            .finally(() => setIsLoadingJoins(false));
    }, [groupId, token]);

    // ── ACTION: Accept post ──
    const handleAcceptPost = async (postId) => {
        try {
            const res = await fetch(`${API}/api/groups/${groupId}/post-requests/${postId}/approve/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setPostRequests(prev => prev.filter(p => (p.id || p.post_id) !== postId));
        } catch (err) { console.error('Error accepting post:', err); }
    };

    // ── ACTION: Reject post ──
    const handleRejectPost = async (postId) => {
        try {
            const res = await fetch(`${API}/api/groups/${groupId}/post-requests/${postId}/reject/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setPostRequests(prev => prev.filter(p => (p.id || p.post_id) !== postId));
        } catch (err) { console.error('Error rejecting post:', err); }
    };

    // ── ACTION: Accept join request ──
    const handleAcceptJoin = async (userId) => {
        try {
            const res = await fetch(`${API}/api/groups/${groupId}/join-requests/${userId}/approve/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setJoinRequests(prev => prev.filter(u => u.id !== userId));
        } catch (err) { console.error('Error accepting join:', err); }
    };

    // ── ACTION: Reject join request ──
    const handleRejectJoin = async (userId) => {
        try {
            const res = await fetch(`${API}/api/groups/${groupId}/join-requests/${userId}/reject/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setJoinRequests(prev => prev.filter(u => u.id !== userId));
        } catch (err) { console.error('Error rejecting join:', err); }
    };

    // ── ACTION: Report user ──
    const handleReport = async (userId) => {
        setOpenActionMenuId(null);
        try {
            await fetch(`${API}/api/users/${userId}/report/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'Reported from group join request' })
            });
        } catch (err) { console.error('Error reporting user:', err); }
    };

    // ── ACTION: Block user ──
    const handleBlock = async (userId) => {
        setOpenActionMenuId(null);
        try {
            await fetch(`${API}/api/users/${userId}/block/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            // Remove from join requests after blocking
            setJoinRequests(prev => prev.filter(u => u.id !== userId));
        } catch (err) { console.error('Error blocking user:', err); }
    };

    const handleToggleSelectId = (id) => {
        setSelectedItemIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // ── BULK ACTIONS ──
    const handleBulkAccept = async () => {
        if (activeTab === 'post') {
            await Promise.all(selectedItemIds.map(id => handleAcceptPost(id)));
        } else {
            await Promise.all(selectedItemIds.map(id => handleAcceptJoin(id)));
        }
        setSelectedItemIds([]);
    };

    const handleBulkReject = async () => {
        if (activeTab === 'post') {
            await Promise.all(selectedItemIds.map(id => handleRejectPost(id)));
        } else {
            await Promise.all(selectedItemIds.map(id => handleRejectJoin(id)));
        }
        setSelectedItemIds([]);
    };

    const renderIcon = (src, color, width = '18px', height = '18px') => (
        <div style={{
            width, height,
            backgroundColor: color,
            maskImage: `url(${src})`,
            WebkitMaskImage: `url(${src})`,
            maskSize: 'contain', WebkitMaskSize: 'contain',
            maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
            maskPosition: 'center', WebkitMaskPosition: 'center',
            display: 'inline-block', flexShrink: 0,
        }} />
    );

    return (
        <div className={styles.membersContainer}>

            {/* ── HEADER ROW ── */}
            <div className={styles.headerRow}>
                <div className={styles.headerLeft}>
                    <button className={styles.backBtn} onClick={onBack}>
                        {renderIcon(ArrowLeft, '#E6E6E6', '20px', '20px')}
                    </button>
                    <h2 className={styles.headerTitle}>Requests</h2>
                </div>
                {renderIcon(HelpIcon, '#E6E6E6', '25px', '25px')}
            </div>

            <div className={styles.centeredDivider} />

            {/* ── CONTROLS ROW ── */}
            <div className={styles.controlsRow}>
                <button
                    onClick={() => { setActiveTab('join'); setSelectedItemIds([]); }}
                    className={`${styles.joinRequestsBtn} ${activeTab === 'join' ? styles.tabBtnCustomActive : ''}`}
                >
                    Join requests
                    {joinRequests.length > 0 && (
                        <span style={{
                            background: 'linear-gradient(90deg, #612886, #892A82)',
                            color: '#fff',
                            borderRadius: '50%',
                            width: 22, height: 22,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            marginLeft: 4,
                            flexShrink: 0,
                        }}>
                            {joinRequests.length}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => { setActiveTab('post'); setSelectedItemIds([]); }}
                    className={`${styles.postRequestsBtn} ${activeTab === 'post' ? styles.tabBtnCustomActive : ''}`}
                >
                    Post requests
                    {postRequests.length > 0 && (
                        <span style={{
                            background: 'linear-gradient(90deg, #612886, #892A82)',
                            color: '#fff',
                            borderRadius: '50%',
                            width: 22, height: 22,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            marginLeft: 4,
                            flexShrink: 0,
                        }}>
                            {postRequests.length}
                        </span>
                    )}
                </button>

                <div className={styles.rightSide}>
                    {/* Bulk actions shown only in select mode with selections */}
                    {isSelectMode && selectedItemIds.length > 0 && (
                        <>
                            <button className={styles.acceptBtn} onClick={handleBulkAccept}>
                                Accept ({selectedItemIds.length})
                            </button>
                            <button className={styles.rejectBtn} onClick={handleBulkReject}>
                                Reject ({selectedItemIds.length})
                            </button>
                        </>
                    )}

                    <button
                        onClick={() => { setIsSelectMode(!isSelectMode); setSelectedItemIds([]); }}
                        className={`${styles.tabBtnCustom} ${isSelectMode ? styles.tabBtnCustomActive : ''}`}
                    >
                        <div className={`${styles.selectCircleIndicator} ${isSelectMode ? styles.selectCircleIndicatorFilled : ''}`} />
                        Select
                    </button>

                    <div className={styles.buttonWrapper}>
                        <button className={styles.sortBtn} onClick={() => setIsSortOpen(!isSortOpen)}>
                            {renderIcon(SortIcon, '#E6E6E6', '30px', '30px')}
                        </button>
                        {isSortOpen && (
                            <div className={styles.dropdownMenu}>
                                {activeTab === 'join' && (
                                    <div className={styles.memberList}>
                                        {isPublic ? (
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '12px',
                                                padding: '60px 32px',
                                                textAlign: 'center',
                                            }}>
                                                <div style={{ fontSize: '2.5rem' }}>🌐</div>
                                                <h3 style={{ margin: 0, color: '#E6E6E6', fontSize: '1.1rem', fontWeight: 600 }}>
                                                    Your community is public
                                                </h3>
                                                <p style={{ margin: 0, color: '#808080', fontSize: '0.875rem', maxWidth: '280px', lineHeight: 1.6 }}>
                                                    Anyone can join without needing approval. Switch to private if you'd like to review join requests first.
                                                </p>
                                            </div>
                                        ) : isLoadingJoins ? (
                                            <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Loading...</div>
                                        ) : joinRequests.length === 0 ? (
                                            <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>No join requests.</div>
                                        ) : joinRequests.map((user) => {
                                            const isSelected = selectedItemIds.includes(user.id);
                                            const avatarSrc = user.avatar
                                                ? (user.avatar.startsWith('http') ? user.avatar : `${API}${user.avatar}`)
                                                : DefaultPfp;

                                            return (
                                                <React.Fragment key={user.id}>
                                                    <div className={styles.selectionRowWrapper}>
                                                        {isSelectMode && (
                                                            <div
                                                                onClick={() => handleToggleSelectId(user.id)}
                                                                className={`${styles.rowSelectCircle} ${isSelected ? styles.rowSelectCircleActive : ''}`}
                                                            />
                                                        )}
                                                        <div className={`${styles.selectableWrapper} ${isSelected ? styles.selectableWrapperHighlighted : ''}`}>
                                                            <div className={styles.memberItem}>
                                                                <div className={styles.memberInfoLeft}>
                                                                    <img src={avatarSrc} alt={user.name} className={styles.avatar} />
                                                                    <div className={styles.memberDetails}>
                                                                        <div className={styles.nameRow}>
                                                                            <h3 className={styles.memberName}>{user.name || user.username}</h3>
                                                                            <span className={styles.userType}>{user.role || user.type || 'Student'}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className={styles.memberActionGroup}>
                                                                    <button className={styles.acceptBtn} onClick={() => handleAcceptJoin(user.id)}>Accept</button>
                                                                    <button className={styles.rejectBtn} onClick={() => handleRejectJoin(user.id)}>Reject</button>

                                                                    <div className={styles.actionBtnWrapper}>
                                                                        <button
                                                                            className={styles.dotsBtn}
                                                                            onClick={() => setOpenActionMenuId(openActionMenuId === user.id ? null : user.id)}
                                                                        >
                                                                            <div className={styles.dot} />
                                                                            <div className={styles.dot} />
                                                                            <div className={styles.dot} />
                                                                        </button>

                                                                        {openActionMenuId === user.id && (
                                                                            <div className={styles.dropdownMenu}>
                                                                                <div className={styles.dropdownItem} onClick={() => setOpenActionMenuId(null)}>
                                                                                    <img src={DefaultPfp} alt="" className={styles.dropdownIcon} />
                                                                                    View profile
                                                                                </div>
                                                                                <div className={styles.dropdownItemDanger} onClick={() => handleReport(user.id)}>
                                                                                    <img src={InfoIcon} alt="" className={styles.dropdownIcon}
                                                                                        style={{ filter: 'invert(25%) sepia(90%) saturate(600%) hue-rotate(330deg) brightness(90%)' }} />
                                                                                    Report
                                                                                </div>
                                                                                <div className={styles.dropdownItemDanger} onClick={() => handleBlock(user.id)}>
                                                                                    <img src={BlockIcon} alt="" className={styles.dropdownIcon}
                                                                                        style={{ filter: 'invert(25%) sepia(90%) saturate(600%) hue-rotate(330deg) brightness(90%)' }} />
                                                                                    Block
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </React.Fragment>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── POST REQUESTS TAB ── */}
            {activeTab === 'post' && (
                <div className={styles.postsContainer}>
                    {isLoadingPosts ? (
                        <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Loading...</div>
                    ) : postRequests.length === 0 ? (
                        <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>No post requests.</div>
                    ) : postRequests.map((post, index) => {
                        const isSelected = selectedItemIds.includes(post.id || post.post_id);
                        return (
                            <React.Fragment key={post.id || post.post_id}>
                                <div className={styles.selectionRowWrapper}>
                                    {isSelectMode && (
                                        <div
                                            onClick={() => handleToggleSelectId(post.id || post.post_id)}
                                            className={`${styles.rowSelectCircle} ${isSelected ? styles.rowSelectCircleActive : ''}`}
                                        />
                                    )}
                                    <div className={`${styles.selectableWrapper} ${isSelected ? styles.selectableWrapperHighlighted : ''}`}>
                                        <PostCard
                                            post={post}
                                            openComments={() => { }}
                                            isOwnProfile={false}
                                            hasPinnedPost={false}
                                            onPinChange={() => { }}
                                            isRequestMode={true}
                                            onAcceptPost={handleAcceptPost}
                                            onRejectPost={handleRejectPost}
                                        />
                                    </div>
                                </div>
                                {index < postRequests.length - 1 && <div className={styles.centeredDivider} />}
                            </React.Fragment>
                        );
                    })}
                </div>
            )}

            {/* ── JOIN REQUESTS TAB ── */}
            {activeTab === 'join' && (
                <div className={styles.memberList}>
                    {isLoadingJoins ? (
                        <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Loading...</div>
                    ) : joinRequests.length === 0 ? (
                        <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>No join requests.</div>
                    ) : joinRequests.map((user) => {
                        const isSelected = selectedItemIds.includes(user.id);
                        const avatarSrc = user.avatar
                            ? (user.avatar.startsWith('http') ? user.avatar : `${API}${user.avatar}`)
                            : DefaultPfp;

                        return (
                            <React.Fragment key={user.id}>
                                <div className={styles.selectionRowWrapper}>
                                    {isSelectMode && (
                                        <div
                                            onClick={() => handleToggleSelectId(user.id)}
                                            className={`${styles.rowSelectCircle} ${isSelected ? styles.rowSelectCircleActive : ''}`}
                                        />
                                    )}
                                    <div className={`${styles.selectableWrapper} ${isSelected ? styles.selectableWrapperHighlighted : ''}`}>
                                        <div className={styles.memberItem}>
                                            <div className={styles.memberInfoLeft}>
                                                <img src={avatarSrc} alt={user.name} className={styles.avatar} />
                                                <div className={styles.memberDetails}>
                                                    <div className={styles.nameRow}>
                                                        <h3 className={styles.memberName}>{user.name || user.username}</h3>
                                                        <span className={styles.userType}>{user.role || user.type || 'Student'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={styles.memberActionGroup}>
                                                <button className={styles.acceptBtn} onClick={() => handleAcceptJoin(user.id)}>
                                                    Accept
                                                </button>
                                                <button className={styles.rejectBtn} onClick={() => handleRejectJoin(user.id)}>
                                                    Reject
                                                </button>

                                                <div className={styles.actionBtnWrapper}>
                                                    <button
                                                        className={styles.dotsBtn}
                                                        onClick={() => setOpenActionMenuId(openActionMenuId === user.id ? null : user.id)}
                                                    >
                                                        <div className={styles.dot} />
                                                        <div className={styles.dot} />
                                                        <div className={styles.dot} />
                                                    </button>

                                                    {openActionMenuId === user.id && (
                                                        <div className={styles.dropdownMenu}>
                                                            <div className={styles.dropdownItem} onClick={() => setOpenActionMenuId(null)}>
                                                                <img src={DefaultPfp} alt="" className={styles.dropdownIcon} />
                                                                View profile
                                                            </div>
                                                            <div className={styles.dropdownItemDanger} onClick={() => handleReport(user.id)}>
                                                                <img src={InfoIcon} alt="" className={styles.dropdownIcon}
                                                                    style={{ filter: 'invert(25%) sepia(90%) saturate(600%) hue-rotate(330deg) brightness(90%)' }} />
                                                                Report
                                                            </div>
                                                            <div className={styles.dropdownItemDanger} onClick={() => handleBlock(user.id)}>
                                                                <img src={BlockIcon} alt="" className={styles.dropdownIcon}
                                                                    style={{ filter: 'invert(25%) sepia(90%) saturate(600%) hue-rotate(330deg) brightness(90%)' }} />
                                                                Block
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>
            )}
        </div>
    );
}