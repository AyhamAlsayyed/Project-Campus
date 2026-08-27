import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './CommunityPosts.module.css';
import arrowLeft from '../../Assets/icons/arrow-left.png';
import helpIcon from '../../Assets/icons/help.png';
import PostCard from '../posts/postCard';

import API from '../../config';

const CommunityPosts = ({ onBack, communityId }) => {
    const navigate = useNavigate();
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
    const [reportDeleteConfirmId, setReportDeleteConfirmId] = useState(null);
    const [removeHighlightConfirmId, setRemoveHighlightConfirmId] = useState(null);

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
        setReportDeleteConfirmId(postId);
    };

    const confirmReportDelete = async () => {
        const postId = reportDeleteConfirmId;
        setReportDeleteConfirmId(null);
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
            await fetch(`${API}/api/communities/${communityId}/kick/${authorId}/`, {  
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            setReportedPosts(prev => prev.filter(p => (p.id || p.post_id) !== postId));
        } catch (err) { console.error('Kick failed:', err); }
    };

    const handleReportAction = async (postId) => {
        try {
            await fetch(`${API}/api/reports/`, {
                method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ post: postId })
            });
        } catch (err) { console.error('Report action failed:', err); }
    };

    // ── HIGHLIGHT REMOVE ──
    const handleRemoveHighlight = (postId) => {
        setRemoveHighlightConfirmId(postId);
    };

    const confirmRemoveHighlight = async () => {
        const postId = removeHighlightConfirmId;
        setRemoveHighlightConfirmId(null);
        try {
            await fetch(`${API}/api/communities/${communityId}/highlights/${postId}/remove/`, {
                method: 'POST', headers: { Authorization: `Bearer ${token}` }
            });
            setHighlights(prev => prev.filter(p => (p.id || p.post_id) !== postId));
        } catch (err) { console.error('Remove highlight failed:', err); }
    };

    const confirmDialogStyle = {
        overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 },
        box: { background: '#2a2a2a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '24px 28px', width: 300, textAlign: 'center', boxShadow: '0 12px 32px rgba(0,0,0,0.5)' },
        title: { fontSize: '1rem', fontWeight: 700, color: 'rgba(255,255,255,0.92)', margin: '0 0 6px' },
        sub: { fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', margin: '0 0 20px' },
        actions: { display: 'flex', gap: 10 },
        cancel: { flex: 1, padding: '9px 0', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.75)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' },
        del: { flex: 1, padding: '9px 0', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#c0392b,#e74c3c)', color: '#fff', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer' },
    };

    return (
        <>
        {reportDeleteConfirmId && (
            <div style={confirmDialogStyle.overlay} onClick={() => setReportDeleteConfirmId(null)}>
                <div style={confirmDialogStyle.box} onClick={e => e.stopPropagation()}>
                    <p style={confirmDialogStyle.title}>Delete this post?</p>
                    <p style={confirmDialogStyle.sub}>This will permanently delete the reported post.</p>
                    <div style={confirmDialogStyle.actions}>
                        <button style={confirmDialogStyle.cancel} onClick={() => setReportDeleteConfirmId(null)}>Cancel</button>
                        <button style={confirmDialogStyle.del} onClick={confirmReportDelete}>Delete</button>
                    </div>
                </div>
            </div>
        )}
        {removeHighlightConfirmId && (
            <div style={confirmDialogStyle.overlay} onClick={() => setRemoveHighlightConfirmId(null)}>
                <div style={confirmDialogStyle.box} onClick={e => e.stopPropagation()}>
                    <p style={confirmDialogStyle.title}>Remove from highlights?</p>
                    <p style={confirmDialogStyle.sub}>This post will no longer be featured.</p>
                    <div style={confirmDialogStyle.actions}>
                        <button style={confirmDialogStyle.cancel} onClick={() => setRemoveHighlightConfirmId(null)}>Cancel</button>
                        <button style={confirmDialogStyle.del} onClick={confirmRemoveHighlight}>Remove</button>
                    </div>
                </div>
            </div>
        )}
        <div className={`${styles.postsContainer} w-full max-w-full px-4 sm:px-6`}>
            {/* ── HEADER ── */}
            <div className={`${styles.headerRow} flex items-center justify-between`}>
                <div className={`${styles.headerLeft} flex items-center gap-2`}>
                    <button className={styles.backBtn} onClick={onBack}>
                        <img src={arrowLeft} alt="Back" className={styles.backArrow} />
                    </button>
                    <h2 className={styles.headerTitle}>Posts</h2>
                </div>
                <button onClick={() => navigate('/help')} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}>
                    <img src={helpIcon} alt="Help" className={styles.helpIcon} />
                </button>
            </div>

            <div className={styles.centeredDivider} />

            <div className={`${styles.contentWrapper} flex flex-col gap-8`}>

                {/* POST APPROVAL */}
                <div className={`${styles.sectionRow} flex flex-row items-center justify-between gap-4 w-full`}>
                    <div className={`${styles.inlineInfo} flex flex-col gap-1 flex-1`}>
                        <h3 className={`${styles.sectionTitle} m-0`}>Post Approval</h3>
                        <p className={`${styles.sectionSubtext} m-0`}>
                            Admins should accept a post before it's published in the community, posts will be pending until an admin approves it.
                        </p>
                    </div>
                    <label className={`${styles.toggleWrapper} shrink-0`}>
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
                <div className={`${styles.sectionRow} flex flex-col items-start gap-4 w-full`}>
                    <div className={`${styles.inlineInfo} flex flex-col gap-1 w-full`}>
                        <h3 className={`${styles.sectionTitle} m-0`} style={{ whiteSpace: 'normal' }}>Who can post</h3>
                        <p className={`${styles.sectionSubtext} m-0`}>Decide who can post in your community</p>
                    </div>
                    <div className={`${styles.checkboxColumn} flex flex-col gap-3 w-full`}>
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
                <div className={`${styles.sectionRow} flex flex-row items-center justify-between gap-4 w-full`}>
                    <div className={`${styles.inlineInfo} flex flex-col gap-1 flex-1`}>
                        <h3 className={`${styles.sectionTitle} m-0`}>Highlights</h3>
                        <p className={`${styles.sectionSubtext} m-0`}>Manage highlighted content in the community</p>
                    </div>
                    <div className={`${styles.actionGroup} flex items-center gap-4 shrink-0`}>
                        <span className={styles.countText}>{highlights.length}/{highlightLimit}</span>
                        <button className={styles.actionBtn} onClick={() => setShowManageModal(true)}>
                            Manage
                        </button>
                    </div>
                </div>

                <div className={styles.centeredDivider} />

                {/* REPORTED */}
                <div className={`${styles.sectionRow} flex flex-row items-center justify-between gap-4 w-full`}>
                    <div className={`${styles.inlineInfo} flex flex-col gap-1 flex-1`}>
                        <h3 className={`${styles.sectionTitle} m-0`}>Reported</h3>
                        <p className={`${styles.sectionSubtext} m-0`}>
                            View all reported posts and take actions with them. (dismiss, delete, Kick, Block)
                        </p>
                    </div>
                    <div className={`${styles.actionGroup} flex items-center gap-4 shrink-0`}>
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
                <div className={`${styles.modalOverlay} fixed inset-0 flex items-center justify-center p-4 sm:p-6 z-50`} onClick={() => setShowManageModal(false)}>
                    {/* Width adjusted to max-w-xl for a cleaner desktop standard size */}
                    <div className={`${styles.modalContent} w-full max-w-xl max-h-[85vh] flex flex-col relative overflow-hidden`} onClick={e => e.stopPropagation()}>
                        <div className={`${styles.modalHeader} shrink-0 flex items-center justify-between p-4`}>
                            <h2 className={`${styles.headerTitle} m-0`}>Manage Highlights</h2>
                            <button className={styles.closeBtn} onClick={() => setShowManageModal(false)}>✕</button>
                        </div>
                        <div className={`${styles.modalBody} overflow-y-auto overflow-x-hidden break-words flex-1 p-4`}>
                            {isLoadingHighlights ? (
                                <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '32px 0' }}>Loading...</p>
                            ) : highlights.length === 0 ? (
                                <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '32px 0' }}>No highlighted posts.</p>
                            ) : highlights.map((post, index) => (
                                <div key={post.id || post.post_id} className="w-full">
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
                <div className={`${styles.modalOverlay} fixed inset-0 flex items-center justify-center p-4 sm:p-6 z-50`} onClick={() => setShowReportedModal(false)}>
            
                    <div className={`${styles.modalContent} w-full max-w-xl max-h-[85vh] flex flex-col relative overflow-hidden`} onClick={e => e.stopPropagation()}>
                        <div className={`${styles.modalHeader} shrink-0 flex items-center justify-between p-4`}>
                            <h2 className={`${styles.headerTitle} m-0`}>Reported Posts</h2>
                            <button className={styles.closeBtn} onClick={() => setShowReportedModal(false)}>✕</button>
                        </div>
                        <div className={`${styles.modalBody} overflow-y-auto overflow-x-hidden break-words flex-1 p-4`}>
                            {isLoadingReported ? (
                                <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '32px 0' }}>Loading...</p>
                            ) : reportedPosts.length === 0 ? (
                                <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '32px 0' }}>No reported posts.</p>
                            ) : reportedPosts.map((post, index) => (
                                <div key={post.id || post.post_id} style={{width: "100%"}} className="w-full">
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
        </>
    );
};

export default CommunityPosts;