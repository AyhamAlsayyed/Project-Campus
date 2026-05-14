import { useState, useEffect } from 'react';
import { X, ChevronRight, AlertCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import styles from './ReportModal.module.css';

const REPORT_REASONS = [
    { label: "Harassment & Abuse", value: "harassment_abuse", },
    { label: "Violence & Harm", value: "violence_harm", },
    { label: "Sexual Content & Exploitation", value: "sexual_content_exploitation", },
    { label: "Child Safety", value: "child_safety", },
    { label: "Hate & Extremism", value: "hate_extremism", },
    { label: "Self-Harm & Dangerous Behavior", value: "self_harm_dangerous_behavior", },
    { label: "Misinformation & Manipulation", value: "misinformation_manipulation", },
    { label: "Privacy & Impersonation", value: "privacy_impersonation", },
    { label: "Spam, Scams & Fraud", value: "spam_scams_fraud", },
    { label: "Illegal & Intellectual Property Violations", value: "illegal_ip_violations", },
    { label: "Other", value: "other", },
];

export default function ReportModal({ contentId, contentType, onClose }) {
    const [step, setStep] = useState('reasons'); // 'reasons' | 'details' | 'done'
    const [selectedReason, setSelectedReason] = useState(null);
    const [extraNote, setExtraNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setVisible(true));
    }, []);

    const handleClose = () => {
        setVisible(false);
        setTimeout(onClose, 300);
    };

    const handleSelectReason = (reason) => {
        setSelectedReason(reason);
        setStep('details');
    };

    const handleSubmit = async () => {
        const token = localStorage.getItem('access');
        setSubmitting(true);
        try {
            const res = await fetch('http://localhost:8000/api/reports/', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    reported_content_id: contentId,
                    content_type: contentType,
                    reason: selectedReason.value,
                    extra_note: extraNote || null,
                }),
            });
            if (res.ok) setStep('done');
        } catch (err) {
            console.error('Report failed:', err);
        } finally {
            setSubmitting(false);
        }
    };

    return createPortal(
        <div
            className={styles.backdrop}
            onClick={handleClose}
            style={{
                background: visible ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0)',
                backdropFilter: visible ? 'blur(8px)' : 'blur(0px)',
                transition: 'background 0.3s, backdrop-filter 0.3s',
            }}
        >
            <div
                className={styles.modal}
                onClick={e => e.stopPropagation()}
                style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'opacity 0.3s, transform 0.3s',
                }}
            >
                {/* Header */}
                <div className={styles.header}>
                    {step === 'details' && (
                        <button className={styles.backBtn} onClick={() => setStep('reasons')}>
                            ‹
                        </button>
                    )}
                    <h3 className={styles.headerTitle}>
                        <AlertCircle size={16} color="rgba(255,100,100,0.8)" />
                        Report {contentType}
                    </h3>
                    <button className={styles.closeBtn} onClick={handleClose}>
                        <X size={15} />
                    </button>
                </div>

                {/* Progress bar */}
                {step !== 'done' && (
                    <div className={styles.progressBar}>
                        <div
                            className={styles.progressFill}
                            style={{ width: step === 'reasons' ? '50%' : '100%' }}
                        />
                    </div>
                )}

                {/* Scrollable body */}
                <div className={styles.body}>

                    {/* Step 1 — Reasons */}
                    {step === 'reasons' && (
                        <div className={styles.reasonsStep}>
                            <div className={styles.reasonsIntro}>
                                <h4>Why are you reporting this {contentType}?</h4>
                                <p>
                                    Your report is anonymous. If someone is in immediate danger,
                                    get help before reporting.
                                </p>
                            </div>
                            {REPORT_REASONS.map((reason, i) => (
                                <button
                                    key={reason.value}
                                    className={styles.reasonRow}
                                    style={{ animationDelay: `${i * 30}ms` }}
                                    onClick={() => handleSelectReason(reason)}
                                >
                                    <div className={styles.reasonLeft}>
                                        <span className={styles.reasonEmoji}>{reason.icon}</span>
                                        {reason.label}
                                    </div>
                                    <ChevronRight
                                        size={16}
                                        className={styles.reasonChevron}
                                        color="rgba(255,255,255,0.25)"
                                    />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Step 2 — Details */}
                    {step === 'details' && (
                        <div className={styles.detailsStep}>
                            <div className={styles.selectedPill}>
                                <span>{selectedReason.icon}</span>
                                <div>
                                    <p className={styles.selectedPillLabel}>Reporting for</p>
                                    <p className={styles.selectedPillValue}>{selectedReason.label}</p>
                                </div>
                            </div>

                            <label className={styles.textareaLabel}>
                                Additional details <span>(optional)</span>
                            </label>
                            <textarea
                                className={styles.textarea}
                                value={extraNote}
                                onChange={e => setExtraNote(e.target.value)}
                                placeholder="Add any extra context that might help us review this report..."
                                rows={4}
                            />

                            <button
                                className={styles.submitBtn}
                                onClick={handleSubmit}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <span className={styles.spinner}>
                                        <span className={styles.spinnerDot} />
                                        Submitting...
                                    </span>
                                ) : 'Submit Report'}
                            </button>
                        </div>
                    )}

                    {/* Step 3 — Done */}
                    {step === 'done' && (
                        <div className={styles.doneStep}>
                            <div className={styles.doneIcon}>
                                <svg
                                    width="28" height="28" viewBox="0 0 24 24"
                                    fill="none" stroke="white" strokeWidth="2.5"
                                    strokeLinecap="round" strokeLinejoin="round"
                                >
                                    <polyline points="20 6 9 17 4 12" className={styles.checkmark} />
                                </svg>
                            </div>
                            <h4 className={styles.doneTitle}>Report submitted</h4>
                            <p className={styles.doneText}>
                                Thanks for letting us know. We'll review this {contentType} and take
                                action if it violates our guidelines.
                            </p>
                            <button className={styles.doneBtn} onClick={handleClose}>
                                Done
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>,
        document.body
    );
}