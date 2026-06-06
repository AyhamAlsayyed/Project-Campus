import React, { useState } from 'react';
import styles from './RequestModal.module.css';

import Palette from '../../Assets/icons/palette.png';
import ArrowRight from '../../Assets/icons/arrow-right.png';
import ArrowLeft from '../../Assets/icons/arrow-left.png';

export default function RequestModal({ onClose }) {
    const [step, setStep] = useState(1);

    const [communityName, setCommunityName] = useState('');
    const [description, setDescription] = useState(' ');
    const [privacy, setPrivacy] = useState('Public');
    const [privacyOpen, setPrivacyOpen] = useState(false);

    const [justification, setJustification] = useState('');

    const isStep1NextReady = communityName.trim().length > 0 && description.trim().length > 0;
    const isStep2NextReady = justification.trim().length > 0;
    const handleSubmit = async () => {
        try {
            const res = await fetch(`http://localhost:8000/api/communities/request/`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('access')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: communityName,
                    description: description,
                    privacy: privacy,
                    justification: justification,
                }),
            });
            if (res.ok) {
                onClose();
            } else {
                console.error('Failed to submit request');
            }
        } catch (err) {
            console.error('Error submitting request:', err);
        }
    };

    return (
        <div className={styles.modalOverlay}>

            <div className={styles.modalContainer}>

                {/* ── Header ── */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>

                        {step === 1 ? (
                            <>
                                <div
                                    className={styles.paletteIcon}
                                    style={{ '--icon-url': `url(${Palette})` }}
                                />
                                <h2 className={styles.headerTitle}>Request Form</h2>
                            </>
                        ) : (
                            <>
                                <button className={styles.backBtn} onClick={() => setStep(step - 1)}>
                                    <img src={ArrowLeft} alt="Back" className={styles.backArrowImg} />
                                </button>
                                <div className={styles.headerLeftIconAndText}>
                                    <div
                                        className={styles.paletteIcon}
                                        style={{ '--icon-url': `url(${Palette})` }}
                                    />
                                    <h2 className={styles.headerTitle}>Request Form</h2>
                                </div>
                            </>
                        )}
                    </div>

                    <div className={styles.headerRight}>
                        <button className={styles.cancelBtn} onClick={onClose}>
                            Cancel
                        </button>

                        {step === 3 ? (
                            <button
                                className={styles.submitBtn}
                                onClick={handleSubmit}
                            >
                                Submit
                            </button>
                        ) : (
                            <button
                                className={`${styles.nextBtn} ${(step === 1 && isStep1NextReady) || (step === 2 && isStep2NextReady)
                                    ? styles.nextActive
                                    : ''
                                    }`}
                                disabled={
                                    (step === 1 && !isStep1NextReady) || (step === 2 && !isStep2NextReady)
                                }
                                onClick={() => {
                                    if (step === 1 && isStep1NextReady) setStep(2);
                                    if (step === 2 && isStep2NextReady) setStep(3);
                                }}
                            >
                                Next
                            </button>
                        )}
                    </div>
                </div>

                {/* Edge-to-Edge Divider */}
                <div className={styles.divider}></div>

                {/* ── Inner Content ── */}
                <div className={styles.modalContentInner}>
                    <p className={styles.adminNotice}>
                        Requests are reviewed by Campus admins. You'll be notified once a decision is made.
                    </p>

                    {/* ══ STEP 1 ══ */}
                    {step === 1 && (
                        <div className={styles.formBody}>

                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>
                                    Community name <span className={styles.requiredStar}>*</span>
                                </label>
                                <p className={styles.hintText}>Make sure to give it a good unique name.</p>
                                <input
                                    type="text"
                                    className={styles.textInput}
                                    placeholder="Enter a name for the wanted community"
                                    value={communityName}
                                    onChange={(e) => setCommunityName(e.target.value)}
                                />
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>
                                    Community description <span className={styles.requiredStar}>*</span>
                                </label>
                                <p className={styles.hintText}>Give your community a relatable description that is related to its topic.</p>
                                <div className={styles.textareaWrapper}>
                                    <textarea
                                        className={styles.textArea}
                                        maxLength={150}
                                        placeholder=""
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                    <span className={styles.wordCounter}>
                                        {description.length}/150
                                    </span>
                                </div>
                            </div>

                            <div className={styles.privacyGroup}>
                                <div className={styles.privacyText}>
                                    <label className={styles.label}>Privacy</label>
                                    <p className={styles.hintText}>
                                        Public communities are open to everyone.<br />
                                        Private communities require admin approval to join.
                                    </p>
                                </div>

                                <div className={styles.privacyDropdownWrapper}>
                                    <button
                                        className={styles.privacyBtn}
                                        onClick={() => setPrivacyOpen(p => !p)}
                                    >
                                        {privacy}
                                    </button>

                                    <img
                                        src={ArrowRight}
                                        alt=""
                                        className={styles.dropdownArrow}
                                        onClick={() => setPrivacyOpen(p => !p)}
                                    />

                                    {privacyOpen && (
                                        <div className={styles.privacyMenu}>
                                            {['Public', 'Private'].map((option, i, arr) => (
                                                <div key={option}>
                                                    <button
                                                        className={`${styles.privacyOption} ${privacy === option ? styles.privacyOptionActive : ''}`}
                                                        onClick={() => { setPrivacy(option); setPrivacyOpen(false); }}
                                                    >
                                                        {option}
                                                    </button>
                                                    {i < arr.length - 1 && <div className={styles.privacyDivider} />}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    )}

                    {/* ══ STEP 2 ══ */}
                    {step === 2 && (
                        <div className={styles.formBody}>
                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>
                                    Why should this community exist? <span className={styles.requiredStar}>*</span>
                                </label>
                                <p className={styles.hintText}>
                                    Please answer this question, be honest and give a real convincing answer.
                                </p>
                                <div className={styles.textareaWrapperLarge}>
                                    <textarea
                                        className={styles.textAreaLarge}
                                        maxLength={250}
                                        placeholder=""
                                        value={justification}
                                        onChange={(e) => setJustification(e.target.value)}
                                    />
                                    <span className={styles.wordCounter}>
                                        {justification.length}/250
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ══ STEP 3 (Review) ══ */}
                    {step === 3 && (
                        <div className={styles.formBody}>
                            <div className={styles.fieldGroup}>
                                <h3 className={styles.label} style={{ margin: '0' }}>Review of your request</h3>
                                <p className={styles.hintText} style={{ marginTop: '4px' }}>
                                    This is to make sure everything is correct as you wanted.
                                </p>
                            </div>

                            <div style={{ marginTop: '16px' }}>
                                <span className={styles.label}>Community name: </span>
                                <span className={styles.reviewValue}>{communityName}</span>
                            </div>

                            <div className={styles.shortDivider}></div>

                            <div>
                                <div className={styles.label}>Community description:</div>
                                <div className={styles.reviewDescription}>{description}</div>
                            </div>

                            <div className={styles.shortDivider}></div>

                            <div>
                                <span className={styles.label}>Privacy: </span>
                                <span className={styles.reviewValue}>{privacy}</span>
                                <p className={styles.hintText} style={{ marginTop: '8px', fontSize: "0.8rem" }}>
                                    note: privacy can be changed any time later.
                                </p>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* ── Pagination Dots (functional) ── */}
            <div className={styles.paginationDots}>
                {[1, 2, 3].map((dotStep) => (
                    <div
                        key={dotStep}
                        className={`${styles.dot} ${step === dotStep ? styles.activeDot : ''}`}
                    />
                ))}
            </div>

        </div>
    );
}