import React, { useState } from 'react';
import styles from './createEvent.module.css';
import ArrowLeft from '../../Assets/icons/arrow-left.png';

export default function CreateEventRightSidebar({
    startDay, setStartDay,
    startMonth, setStartMonth,
    startYear, setStartYear,
    startHour, setStartHour,
    startMinute, setStartMinute,
    startPeriod, setStartPeriod,
    endDay, setEndDay,
    endMonth, setEndMonth,
    endYear, setEndYear,
    endHour, setEndHour,
    endMinute, setEndMinute,
    endPeriod, setEndPeriod,
    address, setAddress,
}) {
    const [showStartDropdown, setShowStartDropdown] = useState(false);
    const [showEndDropdown, setShowEndDropdown] = useState(false);


    // ── Sanitizers ──────────────────────────────────────────────
    const onlyDigits = (value) => value.replace(/\D/g, '');

    const makeHandler = (setter, max) => (e) => {
        const digits = onlyDigits(e.target.value);
        // Clamp: don't allow values exceeding the field's logical max
        if (digits === '' || parseInt(digits, 10) <= max) {
            setter(digits);
        }
    };

    const handleYear = (setter) => (e) => {
        const digits = onlyDigits(e.target.value);
        setter(digits);
    };
    // ─────────────────────────────────────────────────────────────

    return (
        <div className={styles.createEventRightWrapper}>

            <div className={styles.durationPillHeaderBadge}>Duration</div>

            <div className={styles.createEventRightContainer}>

                {/* ================= START TIME SECTION ================= */}
                <div className={styles.logisticsFieldGroup}>
                    <div className={styles.labelWithStarRow}>
                        <label className={styles.logisticsSectionTitle}>Start time</label>
                        <span className={styles.formRequiredStarField}>*</span>
                    </div>

                    <div className={styles.manualDateSegmentsRow}>
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="31"
                            maxLength="2"
                            className={styles.segmentedInputControl}
                            value={startDay}
                            onChange={makeHandler(setStartDay, 31)}
                        />
                        <span className={styles.dateSeparator}>/</span>
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="05"
                            maxLength="2"
                            className={styles.segmentedInputControl}
                            value={startMonth}
                            onChange={makeHandler(setStartMonth, 12)}
                        />
                        <span className={styles.dateSeparator}>/</span>
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="2026"
                            maxLength="4"
                            className={styles.segmentedInputControlYear}
                            value={startYear}
                            onChange={handleYear(setStartYear)}
                        />
                    </div>

                    <div className={styles.timeRowFlexSelector}>
                        <span className={styles.atTimePrefixLabel}>at the time</span>

                        <div className={styles.manualTimeSegmentsContainer}>
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="10"
                                maxLength="2"
                                className={styles.segmentedInputControl}
                                value={startHour}
                                onChange={makeHandler(setStartHour, 12)}
                            />
                            <span className={styles.timeSeparator}>:</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="10"
                                maxLength="2"
                                className={styles.segmentedInputControl}
                                value={startMinute}
                                onChange={makeHandler(setStartMinute, 59)}
                            />
                        </div>

                        <div className={styles.amPmOuterDropdownSelectorBlock}>
                            <div
                                className={styles.amPmActiveBoxSelection}
                                onClick={() => setShowStartDropdown(!showStartDropdown)}
                            >
                                {startPeriod}
                            </div>
                            <img
                                src={ArrowLeft}
                                alt="toggle"
                                className={`${styles.amPmExternalArrowIcon} ${showStartDropdown ? styles.arrowFlippedUp : ''}`}
                                onClick={() => setShowStartDropdown(!showStartDropdown)}
                            />
                            {showStartDropdown && (
                                <div className={styles.amPmDropdownFloatingMenu}>
                                    <div onClick={() => { setStartPeriod('AM'); setShowStartDropdown(false); }}>AM</div>
                                    <div onClick={() => { setStartPeriod('PM'); setShowStartDropdown(false); }}>PM</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className={styles.divider50} />

                {/* ================= END TIME SECTION ================= */}
                <div className={styles.logisticsFieldGroup}>
                    <div className={styles.labelWithStarRow}>
                        <label className={styles.logisticsSectionTitle}>End time</label>
                        <span className={styles.formRequiredStarField}>*</span>
                    </div>

                    <div className={styles.manualDateSegmentsRow}>
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="01"
                            maxLength="2"
                            className={styles.segmentedInputControl}
                            value={endDay}
                            onChange={makeHandler(setEndDay, 31)}
                        />
                        <span className={styles.dateSeparator}>/</span>
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="06"
                            maxLength="2"
                            className={styles.segmentedInputControl}
                            value={endMonth}
                            onChange={makeHandler(setEndMonth, 12)}
                        />
                        <span className={styles.dateSeparator}>/</span>
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="2026"
                            maxLength="4"
                            className={styles.segmentedInputControlYear}
                            value={endYear}
                            onChange={handleYear(setEndYear)}
                        />
                    </div>

                    <div className={styles.timeRowFlexSelector}>
                        <span className={styles.atTimePrefixLabel}>at the time</span>

                        <div className={styles.manualTimeSegmentsContainer}>
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="02"
                                maxLength="2"
                                className={styles.segmentedInputControl}
                                value={endHour}
                                onChange={makeHandler(setEndHour, 12)}
                            />
                            <span className={styles.timeSeparator}>:</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="00"
                                maxLength="2"
                                className={styles.segmentedInputControl}
                                value={endMinute}
                                onChange={makeHandler(setEndMinute, 59)}
                            />
                        </div>

                        <div className={styles.amPmOuterDropdownSelectorBlock}>
                            <div
                                className={styles.amPmActiveBoxSelection}
                                onClick={() => setShowEndDropdown(!showEndDropdown)}
                            >
                                {endPeriod}
                            </div>
                            <img
                                src={ArrowLeft}
                                alt="toggle"
                                className={`${styles.amPmExternalArrowIcon} ${showEndDropdown ? styles.arrowFlippedUp : ''}`}
                                onClick={() => setShowEndDropdown(!showEndDropdown)}
                            />
                            {showEndDropdown && (
                                <div className={styles.amPmDropdownFloatingMenu}>
                                    <div onClick={() => { setEndPeriod('AM'); setShowEndDropdown(false); }}>AM</div>
                                    <div onClick={() => { setEndPeriod('PM'); setShowEndDropdown(false); }}>PM</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className={styles.divider50} />

                {/* Address — text is fine, no restriction needed */}
                <div className={styles.logisticsFieldGroup} style={{ marginBottom: '10px' }}>
                    <label className={styles.logisticsSectionTitle} style={{ marginBottom: '20px', display: 'block' }}>Address</label>
                    <input
                        type="text"
                        className={styles.darkLogisticsAddressInput}
                        placeholder="Where the event is taking place at..."
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                    />
                </div>

            </div>
        </div>
    );
}