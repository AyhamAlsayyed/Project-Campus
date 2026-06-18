import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import PostCard from '../posts/postCard';
import CommentModal from '../comments/commentsModal';

export default function SharedAdModal({ post, onClose, currentUser }) {
    const overlayRef = useRef(null);
    const [commentPost, setCommentPost] = useState(null);

    // close on Escape
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    return createPortal(
        <div
            ref={overlayRef}
            onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
            style={{
                position: 'fixed', inset: 0, zIndex: 10000,
                background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '20px',
            }}
        >
            <div style={{
                position: 'relative',
                width: '100%', maxWidth: 560,
                maxHeight: '90vh', overflowY: 'auto',
                borderRadius: 20,
                background: '#1c1c1e',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 32px 64px rgba(0,0,0,0.6)',
                scrollbarWidth: 'none',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 16px 0',
                }}>
                    <span style={{
                        fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        background: 'linear-gradient(90deg, #c72cff, #8b2dff)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>
                        Sponsored · Shared with you
                    </span>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.08)', border: 'none',
                            borderRadius: '50%', width: 30, height: 30,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: 'white',
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* PostCard */}
                <div style={{ padding: '8px 0 16px' }}>
                    <PostCard
                        post={post}
                        openComments={(p) => setCommentPost(p)}
                        isOwnProfile={false}
                        hasPinnedPost={false}
                        onPinChange={() => {}}
                        currentUser={currentUser}
                    />
                </div>
            </div>

            {commentPost && (
                <CommentModal
                    post={commentPost}
                    onClose={() => setCommentPost(null)}
                    currentUser={currentUser}
                />
            )}
        </div>,
        document.body
    );
}
