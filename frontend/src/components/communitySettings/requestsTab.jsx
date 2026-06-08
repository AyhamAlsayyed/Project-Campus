import React, { useState, useEffect, useRef  } from 'react';
import styles from './requestsTab.module.css';
import PostCard from '../posts/postCard';
import { useNavigate } from 'react-router-dom';
import ArrowLeft from '../../Assets/icons/arrow-left.png';
import SortIcon from '../../Assets/icons/sort.png';
import DefaultPfp from '../../Assets/icons/default-pfp.png';
import BlockIcon from '../../Assets/icons/block.png';
import InfoIcon from '../../Assets/icons/info.png';
import HelpIcon from '../../Assets/icons/help.png';

export default function RequestsTab({ communityId, token, onBack, isPublic = false }) {
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
    const actionMenuRef = useRef(null);

    const API = 'http://localhost:8000';
    const navigate = useNavigate();
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (actionMenuRef.current && !actionMenuRef.current.contains(e.target)) {
                setOpenActionMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    // ── FETCH: Post requests ──
    useEffect(() => {
        if (!communityId || !token) return;
        setIsLoadingPosts(true);
        fetch(`${API}/api/communities/${communityId}/post-requests/`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.ok ? res.json() : [])
            .then(data => setPostRequests(Array.isArray(data) ? data : []))
            .catch(err => console.error('Error fetching post requests:', err))
            .finally(() => setIsLoadingPosts(false));
    }, [communityId, token]);
    // ── FETCH: Join requests ──
    useEffect(() => {
        console.log('communityId:', communityId);
        console.log('token:', token);
        if (!communityId || !token) return;
        setIsLoadingJoins(true);
        fetch(`${API}/api/communities/${communityId}/join-requests/`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => {
                console.log('Status:', res.status);
                return res.json();
            })
            .then(data => {
                console.log('Raw data:', data);  // what does it actually return?
                console.log('Is array:', Array.isArray(data));
                console.log('First item:', data[0]);  // does it have a .user field?
                setJoinRequests(Array.isArray(data) ? data : []);
            })
            .catch(err => console.error('Error:', err))
            .finally(() => setIsLoadingJoins(false));
    }, [communityId, token]);

    // ── ACTION: Accept post ──
    const handleAcceptPost = async (postId) => {
        try {
            const res = await fetch(`${API}/api/communities/${communityId}/process_post-requests/${postId}/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'approve' })
            });

            if (res.ok) setPostRequests(prev => prev.filter(p => (p.id || p.post_id) !== postId));
        } catch (err) { console.error('Error accepting post:', err); }
    };

    // ── ACTION: Reject post ──
    const handleRejectPost = async (postId) => {
        try {
            const res = await fetch(`${API}/api/communities/${communityId}/process_post-requests/${postId}/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reject' })
            });
            if (res.ok) setPostRequests(prev => prev.filter(p => (p.id || p.post_id) !== postId));
        } catch (err) { console.error('Error rejecting post:', err); }
    };

    // ── ACTION: Accept join request ──
    const handleAcceptJoin = async (userId) => {
        try {
            const res = await fetch(`${API}/api/communities/${communityId}/process_join_request/${userId}/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, action: 'approve' })
            });
            if (res.ok) setJoinRequests(prev => prev.filter(u => u.id !== userId));
        } catch (err) { console.error('Error accepting join:', err); }
    };

    // ── ACTION: Reject join request ──
    const handleRejectJoin = async (userId) => {
        try {
            const res = await fetch(`${API}/api/communities/${communityId}/process_join_request/${userId}/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, action: 'reject' })
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
                                <div className={styles.dropdownItem} onClick={() => setIsSortOpen(false)}>
                                    Newest first
                                </div>
                                <div className={styles.dropdownItem} onClick={() => setIsSortOpen(false)}>
                                    Oldest first
                                </div>
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
                    ) : joinRequests.map((member) => {
                        if (!member) return null;
                        const isSelected = selectedItemIds.includes(member.id);
                        const avatarSrc = member.avatar
                            ? (member.avatar.startsWith('http') ? member.avatar : `${API}${member.avatar}`)
                            : DefaultPfp;

                        return (
                            <React.Fragment key={member.id}>
                                <div className={styles.selectionRowWrapper}>
                                    {isSelectMode && (
                                        <div
                                            onClick={() => handleToggleSelectId(member.id)}
                                            className={`${styles.rowSelectCircle} ${isSelected ? styles.rowSelectCircleActive : ''}`}
                                        />
                                    )}
                                    <div className={`${styles.selectableWrapper} ${isSelected ? styles.selectableWrapperHighlighted : ''}`}>
                                        <div className={styles.memberItem}>
                                            <div className={styles.memberInfoLeft}>
                                                <img src={avatarSrc} alt={member.username} className={styles.avatar} />
                                                <div className={styles.memberDetails}>
                                                    <div className={styles.nameRow}>
                                                        <h3 className={styles.memberName}>{member.username}</h3>
                                                        <span className={styles.userType}>{member.profile_role || 'Student'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={styles.memberActionGroup}>
                                                <button className={styles.acceptBtn} onClick={() => handleAcceptJoin(member.id)}>Accept</button>
                                                <button className={styles.rejectBtn} onClick={() => handleRejectJoin(member.id)}>Reject</button>
                                                <div className={styles.actionBtnWrapper} ref={actionMenuRef}>
                                                    <button
                                                        className={styles.dotsBtn}
                                                        onClick={() => setOpenActionMenuId(openActionMenuId === member.id ? null : member.id)}
                                                    >
                                                        <div className={styles.dot} />
                                                        <div className={styles.dot} />
                                                        <div className={styles.dot} />
                                                    </button>
                                                    {openActionMenuId === member.id && (
                                                        <div className={styles.dropdownMenu}>
                                                            <div className={styles.dropdownItem} onClick={() => navigate(`/profile/${member.id}`)}>
                                                                {renderIcon(DefaultPfp, '#E6E6E6', '18px', '18px')}
                                                                View profile
                                                            </div>
                                                            <div className={styles.dropdownDivider} />
                                                            <div className={styles.dropdownItemDanger} onClick={() => handleReport(member.id)}>
                                                                {renderIcon(InfoIcon, '#e53e3e', '18px', '18px')}
                                                                Report
                                                            </div>
                                                            <div className={styles.dropdownDivider} />
                                                            <div className={styles.dropdownItemDanger} onClick={() => handleBlock(member.id)}>
                                                                {renderIcon(BlockIcon, '#e53e3e', '18px', '18px')}
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