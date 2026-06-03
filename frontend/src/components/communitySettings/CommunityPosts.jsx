import React, { useState, useEffect } from 'react';
import styles from './CommunityPosts.module.css';
import arrowLeft from '../../Assets/icons/arrow-left.png';
import helpIcon from '../../Assets/icons/help.png';
import PostCard from '../posts/postCard';

const API = 'http://localhost:8000';

const CommunityPosts = ({ onBack, communityId }) => {
    const token = localStorage.getItem('access');

    // ── SETTINGS STATE ──
    const [postApproval, setPostApproval] = useState(true);
    const [canPost, setCanPost] = useState({
        admins: true,
        instructors: true,
        students: true,
    });

    // ── MODAL STATE ──
    const [showManageModal, setShowManageModal] = useState(false);
    const [showReportedModal, setShowReportedModal] = useState(false);

    // ── DATA STATE ──
    const [highlights, setHighlights] = useState([]);
    const [reportedPosts, setReportedPosts] = useState([]);
    const [highlightLimit, setHighlightLimit] = useState(5);
    const [isLoadingHighlights, setIsLoadingHighlights] = useState(false);
    const [isLoadingReported, setIsLoadingReported] = useState(false);

    // ── FETCH: Post settings on mount ──
    useEffect(() => {
        if (!communityId || !token) return;
        fetch(`${API}/api/communities/${communityId}/post-settings/`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (!data) return;
                setPostApproval(data.post_approval ?? true);
                setCanPost({
                    admins: data.can_post_admins ?? true,
                    instructors: data.can_post_instructors ?? true,
                    students: data.can_post_students ?? true,
                });
                setHighlightLimit(data.highlight_limit ?? 5);
            })
            .catch(err => console.error('Error fetching post settings:', err));
    }, [communityId, token]);

    // ── FETCH: Highlights when modal opens ──
    useEffect(() => {
        if (!showManageModal || !communityId) return;
        setIsLoadingHighlights(true);
        fetch(`${API}/api/communities/${communityId}/highlights/`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.ok ? res.json() : [])
            .then(data => {
                const posts = Array.isArray(data) ? data : (data.results ?? data.posts ?? []);
                setHighlights(normalizePostList(posts));
            })
            .catch(err => console.error('Error fetching highlights:', err))
            .finally(() => setIsLoadingHighlights(false));
    }, [showManageModal, communityId]);

    // ── FETCH: Reported posts when modal opens ──
    useEffect(() => {
        if (!showReportedModal || !communityId) return;
        setIsLoadingReported(true);
        fetch(`${API}/api/communities/${communityId}/reported-posts/`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.ok ? res.json() : [])
            .then(data => {
                const posts = Array.isArray(data) ? data : (data.results ?? data.posts ?? []);
                setReportedPosts(normalizePostList(posts));
            })
            .catch(err => console.error('Error fetching reported posts:', err))
            .finally(() => setIsLoadingReported(false));
    }, [showReportedModal, communityId]);

    // Normalize any post shape into what PostCard expects
    const normalizePostList = (posts) =>
        posts.map(p => ({
            ...p,
            author: p.author ?? {
                id: p.author_id,
                username: p.author_name || p.username || 'User',
                avatar: p.author_avatar
                    ? (p.author_avatar.startsWith('http') ? p.author_avatar : `${API}${p.author_avatar}`)
                    : '/default-avatar.png',
                type: 'user',
            }
        }));

    // ── SAVE: Post approval toggle ──
    const handleToggleApproval = async (val) => {
        setPostApproval(val);
        try {
            await fetch(`${API}/api/communities/${communityId}/post-settings/`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ post_approval: val })
            });
        } catch (err) {
            console.error('Error saving post approval:', err);
            setPostApproval(!val); // revert on failure
        }
    };

    // ── SAVE: Who can post checkboxes ──
    const handleCheckboxChange = async (role) => {
        const updated = { ...canPost, [role]: !canPost[role] };
        setCanPost(updated);
        try {
            await fetch(`${API}/api/communities/${communityId}/post-settings/`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    can_post_admins: updated.admins,
                    can_post_instructors: updated.instructors,
                    can_post_students: updated.students,
                })
            });
        } catch (err) {
            console.error('Error saving who can post:', err);
            setCanPost(canPost); // revert
        }
    };

    // ── REPORTED ACTIONS ──
    const handleDismiss = async (postId) => {
        try {
            await fetch(`${API}/api/communities/${communityId}/reported-posts/${postId}/dismiss/`, {
                method: 'POST', headers: { Authorization: `Bearer ${token}` }
            });
            setReportedPosts(prev => prev.filter(p => (p.id || p.post_id) !== postId));
        } catch (err) { console.error('Dismiss failed:', err); }
    };

    const handleReportDelete = async (postId) => {
        try {
            await fetch(`${API}/api/posts/${postId}/admin_delete/`, {
                method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
            });
            setReportedPosts(prev => prev.filter(p => (p.id || p.post_id) !== postId));
        } catch (err) { console.error('Delete failed:', err); }
    };

    const handleKick = async (postId) => {
        const post = reportedPosts.find(p => (p.id || p.post_id) === postId);
        const authorId = post?.author?.id;
        if (!authorId) return;
        try {
            await fetch(`${API}/api/communities/${communityId}/kick/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: authorId })
            });
            setReportedPosts(prev => prev.filter(p => (p.id || p.post_id) !== postId));
        } catch (err) { console.error('Kick failed:', err); }
    };

    const handleReportAction = async (postId) => {
        try {
            await fetch(`${API}/api/posts/${postId}/report/`, {
                method: 'POST', headers: { Authorization: `Bearer ${token}` }
            });
        } catch (err) { console.error('Report action failed:', err); }
    };

    // ── HIGHLIGHT REMOVE ──
    const handleRemoveHighlight = async (postId) => {
        try {
            await fetch(`${API}/api/communities/${communityId}/highlights/${postId}/remove/`, {
                method: 'POST', headers: { Authorization: `Bearer ${token}` }
            });
            setHighlights(prev => prev.filter(p => (p.id || p.post_id) !== postId));
        } catch (err) { console.error('Remove highlight failed:', err); }
    };

    return (
        <div className={styles.postsContainer}>
            {/* ── HEADER ── */}
            <div className={styles.headerRow}>
                <div className={styles.headerLeft}>
                    <button className={styles.backBtn} onClick={onBack}>
                        <img src={arrowLeft} alt="Back" className={styles.backArrow} />
                    </button>
                    <h2 className={styles.headerTitle}>Posts</h2>
                </div>
                <img src={helpIcon} alt="Help" className={styles.helpIcon} />
            </div>

            <div className={styles.centeredDivider} />

            <div className={styles.contentWrapper}>

                {/* POST APPROVAL */}
                <div className={styles.sectionRow}>
                    <div className={styles.inlineInfo}>
                        <h3 className={styles.sectionTitle}>Post Approval</h3>
                        <p className={styles.sectionSubtext}>
                            Admins should accept a post before it's published in the community, posts will be pending until an admin approves it.
                        </p>
                    </div>
                    <label className={styles.toggleWrapper}>
                        <input
                            type="checkbox"
                            className={styles.toggleInput}
                            checked={postApproval}
                            onChange={e => handleToggleApproval(e.target.checked)}
                        />
                        <span className={styles.toggleSlider} />
                    </label>
                </div>

                <div className={styles.centeredDivider} />

                {/* WHO CAN POST */}
                <div className={styles.sectionRow} style={{ alignItems: 'flex-start', flexDirection: 'column', gap: '20px' }}>
                    <div className={styles.inlineInfo}>
                        <h3 className={styles.sectionTitle}>Who can post</h3>
                        <p className={styles.sectionSubtext}>Decide who can post in your community</p>
                    </div>
                    <div className={styles.checkboxColumn}>
                        {['admins', 'instructors', 'students'].map(role => (
                            <label key={role} className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    className={styles.customCheckbox}
                                    checked={canPost[role]}
                                    onChange={() => handleCheckboxChange(role)}
                                />
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                            </label>
                        ))}
                    </div>
                </div>

                <div className={styles.centeredDivider} />

                {/* HIGHLIGHTS */}
                <div className={styles.sectionRow}>
                    <div className={styles.inlineInfo}>
                        <h3 className={styles.sectionTitle}>Highlights</h3>
                        <p className={styles.sectionSubtext}>Manage highlighted content in the community</p>
                    </div>
                    <div className={styles.actionGroup}>
                        <span className={styles.countText}>{highlights.length}/{highlightLimit}</span>
                        <button className={styles.actionBtn} onClick={() => setShowManageModal(true)}>
                            Manage
                        </button>
                    </div>
                </div>

                <div className={styles.centeredDivider} />

                {/* REPORTED */}
                <div className={styles.sectionRow}>
                    <div className={styles.inlineInfo}>
                        <h3 className={styles.sectionTitle}>Reported</h3>
                        <p className={styles.sectionSubtext}>
                            View all reported posts and take actions with them. (dismiss, delete, Kick, Block)
                        </p>
                    </div>
                    <div className={styles.actionGroup}>
                        <span className={styles.countText}>{reportedPosts.length} reported</span>
                        <button className={styles.actionBtn} onClick={() => setShowReportedModal(true)}>
                            View all
                        </button>
                    </div>
                </div>

                <div className={styles.centeredDivider} />

            </div>

            {/* ── MANAGE HIGHLIGHTS MODAL ── */}
            {showManageModal && (
                <div className={styles.modalOverlay} onClick={() => setShowManageModal(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.headerTitle}>Manage Highlights</h2>
                            <button className={styles.closeBtn} onClick={() => setShowManageModal(false)}>✕</button>
                        </div>
                        <div className={styles.modalBody}>
                            {isLoadingHighlights ? (
                                <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '32px 0' }}>Loading...</p>
                            ) : highlights.length === 0 ? (
                                <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '32px 0' }}>No highlighted posts.</p>
                            ) : highlights.map((post, index) => (
                                <div key={post.id || post.post_id}>
                                    <PostCard
                                        post={post}
                                        openComments={() => { }}
                                        isOwnProfile={false}
                                        hasPinnedPost={false}
                                        onPinChange={() => { }}
                                        isReportedMode={false}
                                    />
                                    <button
                                        onClick={() => handleRemoveHighlight(post.id || post.post_id)}
                                        style={{
                                            display: 'block', margin: '0 auto 8px',
                                            background: 'rgba(255,255,255,0.06)',
                                            border: '1px solid #4D4D4D',
                                            borderRadius: 20, padding: '6px 20px',
                                            color: '#CCCCCC', cursor: 'pointer',
                                            fontSize: '0.82rem'
                                        }}
                                    >
                                        Remove from highlights
                                    </button>
                                    {index < highlights.length - 1 && (
                                        <div style={{ width: '75%', height: 1, background: '#4D4D4D', margin: '8px auto' }} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── REPORTED POSTS MODAL ── */}
            {showReportedModal && (
                <div className={styles.modalOverlay} onClick={() => setShowReportedModal(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.headerTitle}>Reported Posts</h2>
                            <button className={styles.closeBtn} onClick={() => setShowReportedModal(false)}>✕</button>
                        </div>
                        <div className={styles.modalBody}>
                            {isLoadingReported ? (
                                <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '32px 0' }}>Loading...</p>
                            ) : reportedPosts.length === 0 ? (
                                <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '32px 0' }}>No reported posts.</p>
                            ) : reportedPosts.map((post, index) => (
                                <div key={post.id || post.post_id}>
                                    <PostCard
                                        post={post}
                                        openComments={() => { }}
                                        isOwnProfile={false}
                                        hasPinnedPost={false}
                                        onPinChange={() => { }}
                                        isReportedMode={true}
                                        onDismiss={handleDismiss}
                                        onReportDelete={handleReportDelete}
                                        onKick={handleKick}
                                        onReportAction={handleReportAction}
                                    />
                                    {index < reportedPosts.length - 1 && (
                                        <div style={{ width: '75%', height: 1, background: '#4D4D4D', margin: '8px auto' }} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommunityPosts;