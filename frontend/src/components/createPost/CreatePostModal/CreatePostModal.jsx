import { X, BarChart2 } from 'lucide-react';
import MediaIcon from '../../../Assets/icons/media.png';
import DocumentIcon from '../../../Assets/icons/document.png';
import styles from './CreatePostModal.module.css';

/**
 * Shared create-post modal used by Homepage and CommunityPage.
 *
 * Slots:
 *   toggles      — rendered on the right of the avatar row (announcement / academic toggles)
 *   bodyContent  — replaces the default textarea (announcement / promote fields)
 *   actionsExtra — appended after the Poll button in the actions row (community dropdown)
 *   belowPoll    — rendered between the poll section and the Post button (image-required warning)
 */
export default function CreatePostModal({
    isOpen,
    onClose,
    user,
    avatarSrc,
    isMobile,
    // standard textarea state (used when bodyContent is not provided)
    content,
    setContent,
    placeholder,
    // media / file state
    images,
    setImages,
    files,
    setFiles,
    // poll state
    isPollOpen,
    setIsPollOpen,
    pollOptions,
    setPollOptions,
    // submit
    onSubmit,
    submitDisabled,
    // slots
    toggles,
    bodyContent,
    actionsExtra,
    belowPoll,
}) {
    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div
                className={styles.modal}
                onClick={e => e.stopPropagation()}
                style={isMobile ? { width: 'calc(100vw - 24px)', maxWidth: 500, boxSizing: 'border-box', padding: 16 } : {}}
            >
                <div className={styles.modalHeader}>
                    <h3>Create post</h3>
                    <button className={styles.closeButton} onClick={onClose}>✕</button>
                </div>

                <div className={styles.leftSide}>
                    <img
                        src={avatarSrc}
                        alt=""
                        className={styles.userProfilePicture}
                    />
                    <strong>{user?.full_name || user?.page_full_name || user?.username}</strong>
                    {toggles}
                </div>

                {bodyContent ?? (
                    <textarea
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        placeholder={placeholder ?? "What's on your mind?"}
                        className={styles.modalInput}
                    />
                )}

                {images.length > 0 && (
                    <div className={styles.previewContainer}>
                        {images.map((file, i) => {
                            const url = URL.createObjectURL(file);
                            if (file.type.startsWith('video/')) return (
                                <div key={i} className={styles.previewWrapper}>
                                    <video src={url} className={styles.previewImage} controls />
                                    <button
                                        className={styles.removeImage}
                                        onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            );
                            return (
                                <div key={i} className={styles.previewWrapper}>
                                    <img src={url} alt="" className={styles.previewImage} />
                                    <button
                                        className={styles.removeImage}
                                        onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {files.length > 0 && (
                    <div className={styles.filePreviewContainer}>
                        {files.map((f, i) => (
                            <div key={i} className={styles.fileItem}>
                                📁 {f.name}
                                <button
                                    className={styles.removeFile}
                                    onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className={styles.actionsRow}>
                    <label className={styles.actionButton}>
                        <img src={MediaIcon} alt="" className={styles.actionIcon} />
                        Media
                        <input
                            hidden
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            onChange={e => setImages(prev => [...prev, ...Array.from(e.target.files)])}
                        />
                    </label>
                    <label className={styles.actionButton}>
                        <img src={DocumentIcon} alt="" className={styles.actionIcon} />
                        File
                        <input
                            hidden
                            type="file"
                            multiple
                            onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files)])}
                        />
                    </label>
                    <button
                        type="button"
                        className={styles.actionButton}
                        onClick={() => {
                            if (isPollOpen) { setIsPollOpen(false); setPollOptions(['', '']); }
                            else setIsPollOpen(true);
                        }}
                    >
                        <BarChart2 size={16} className={styles.actionIconSvg} />
                        Poll
                    </button>
                    {actionsExtra}
                </div>

                {isPollOpen && (
                    <div className={styles.pollContainer}>
                        {pollOptions.map((option, i) => (
                            <div key={i} className={styles.pollOptionRow}>
                                <input
                                    value={option}
                                    onChange={e => {
                                        const updated = [...pollOptions];
                                        updated[i] = e.target.value;
                                        setPollOptions(updated);
                                    }}
                                    placeholder={`Option ${i + 1}`}
                                    className={styles.pollInput}
                                    style={{ width: '100%', boxSizing: 'border-box' }}
                                />
                                {pollOptions.length > 2 && (
                                    <button
                                        className={styles.removeOption}
                                        onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))}
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => setPollOptions([...pollOptions, ''])}
                            className={styles.addOption}
                        >
                            + Add Option
                        </button>
                    </div>
                )}

                {belowPoll}

                <button
                    className={styles.postButton}
                    onClick={onSubmit}
                    disabled={submitDisabled}
                >
                    Post
                </button>
            </div>
        </div>
    );
}
