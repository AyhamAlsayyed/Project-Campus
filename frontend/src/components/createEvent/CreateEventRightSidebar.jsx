import React, { useState, useEffect } from 'react';
import styles from './createEvent.module.css';
import ArrowLeft from '../../Assets/icons/arrow-left.png';

// Convert 12-hour fields to a comparable Date object (returns null if incomplete)
function toDate(day, month, year, hour, minute, period) {
    const d = parseInt(day, 10);
    const mo = parseInt(month, 10);
    const yr = parseInt(year, 10);
    const h = parseInt(hour, 10);
    const mi = parseInt(minute, 10);
    if (!d || !mo || !yr || yr < 1000 || !h || isNaN(mi)) return null;
    let h24 = h % 12;
    if (period === 'PM') h24 += 12;
    return new Date(yr, mo - 1, d, h24, mi);
}

function daysInMonth(month, year) {
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    if (!m || !y || m < 1 || m > 12) return 31;
    return new Date(y, m, 0).getDate();
}

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
    hidePill,
}) {
    const [showStartDropdown, setShowStartDropdown] = useState(false);
    const [showEndDropdown, setShowEndDropdown] = useState(false);
    const [startError, setStartError] = useState('');
    const [endError, setEndError] = useState('');

    // Re-validate end whenever start changes
    useEffect(() => {
        validateEnd(endDay, endMonth, endYear, endHour, endMinute, endPeriod);
    }, [startDay, startMonth, startYear, startHour, startMinute, startPeriod]);

    const onlyDigits = (value) => value.replace(/\D/g, '');

    // Clamp to [min, max], return '' if empty
    const clampedSetter = (setter, min, max) => (raw) => {
        if (raw === '') { setter(''); return; }
        const n = parseInt(raw, 10);
        if (isNaN(n)) return;
        setter(String(Math.min(Math.max(n, min), max)));
    };

    const handleDigitChange = (setter, min, max) => (e) => {
        const digits = onlyDigits(e.target.value);
        if (digits === '') { setter(''); return; }
        const n = parseInt(digits, 10);
        if (n <= max) setter(digits);
    };

    const handleYearChange = (setter) => (e) => {
        setter(onlyDigits(e.target.value));
    };

    // On blur: clamp to valid range and enforce min
    const handleBlur = (setter, min, max) => () => {
        clampedSetter(setter, min, max)(setter._current ?? '');
    };

    const makeBlur = (value, setter, min, max, extraClamp) => () => {
        if (value === '') return;
        let n = parseInt(value, 10);
        if (isNaN(n)) { setter(''); return; }
        if (extraClamp) n = Math.min(n, extraClamp());
        setter(String(Math.min(Math.max(n, min), max)));
    };

    // Validate start: must not be in the past
    const validateStart = (d, mo, yr, h, mi, p) => {
        const dt = toDate(d, mo, yr, h, mi, p);
        if (!dt) { setStartError(''); return; }
        const now = new Date();
        now.setSeconds(0, 0);
        if (dt < now) {
            setStartError('Start time cannot be in the past.');
        } else {
            setStartError('');
        }
    };

    // Validate end: must be after start
    const validateEnd = (d, mo, yr, h, mi, p) => {
        const dtEnd = toDate(d, mo, yr, h, mi, p);
        if (!dtEnd) { setEndError(''); return; }
        const dtStart = toDate(startDay, startMonth, startYear, startHour, startMinute, startPeriod);
        if (dtStart && dtEnd <= dtStart) {
            setEndError('End time must be after start time.');
        } else {
            setEndError('');
        }
    };

    const onStartBlur = () => {
        validateStart(startDay, startMonth, startYear, startHour, startMinute, startPeriod);
    };

    const onEndBlur = () => {
        validateEnd(endDay, endMonth, endYear, endHour, endMinute, endPeriod);
    };

    const errorStyle = { color: '#ff4d4d', fontSize: '11px', marginTop: '6px' };

    return (
        <div className={styles.createEventRightWrapper}>

            {!hidePill && <div className={styles.durationPillHeaderBadge}>Duration</div>}

            <div className={styles.createEventRightContainer}>

                {/* ================= START TIME SECTION ================= */}
                <div className={styles.logisticsFieldGroup}>
                    <div className={styles.labelWithStarRow}>
                        <label className={styles.logisticsSectionTitle}>Start time</label>
                        <span className={styles.formRequiredStarField}>*</span>
                    </div>

                    <div className={styles.manualDateSegmentsRow}>
                        {/* Day */}
                        <input
                            type="text" inputMode="numeric" placeholder="DD" maxLength="2"
                            className={styles.segmentedInputControl}
                            value={startDay}
                            onChange={handleDigitChange(setStartDay, 1, 31)}
                            onBlur={() => {
                                makeBlur(startDay, setStartDay, 1, 31, () => daysInMonth(startMonth, startYear))();
                                onStartBlur();
                            }}
                        />
                        <span className={styles.dateSeparator}>/</span>
                        {/* Month */}
                        <input
                            type="text" inputMode="numeric" placeholder="MM" maxLength="2"
                            className={styles.segmentedInputControl}
                            value={startMonth}
                            onChange={handleDigitChange(setStartMonth, 1, 12)}
                            onBlur={() => { makeBlur(startMonth, setStartMonth, 1, 12)(); onStartBlur(); }}
                        />
                        <span className={styles.dateSeparator}>/</span>
                        {/* Year */}
                        <input
                            type="text" inputMode="numeric" placeholder="YYYY" maxLength="4"
                            className={styles.segmentedInputControlYear}
                            value={startYear}
                            onChange={handleYearChange(setStartYear)}
                            onBlur={() => {
                                const y = parseInt(startYear, 10);
                                const thisYear = new Date().getFullYear();
                                if (!startYear || isNaN(y) || y < thisYear || startYear.length !== 4) {
                                    setStartYear(String(thisYear));
                                }
                                onStartBlur();
                            }}
                        />
                    </div>

                    <div className={styles.timeRowFlexSelector}>
                        <span className={styles.atTimePrefixLabel}>at the time</span>

                        <div className={styles.manualTimeSegmentsContainer}>
                            <input
                                type="text" inputMode="numeric" placeholder="HH" maxLength="2"
                                className={styles.segmentedInputControl}
                                value={startHour}
                                onChange={handleDigitChange(setStartHour, 1, 12)}
                                onBlur={() => { makeBlur(startHour, setStartHour, 1, 12)(); onStartBlur(); }}
                            />
                            <span className={styles.timeSeparator}>:</span>
                            <input
                                type="text" inputMode="numeric" placeholder="MM" maxLength="2"
                                className={styles.segmentedInputControl}
                                value={startMinute}
                                onChange={handleDigitChange(setStartMinute, 0, 59)}
                                onBlur={() => { makeBlur(startMinute, setStartMinute, 0, 59)(); onStartBlur(); }}
                            />
                        </div>

                        <div className={styles.amPmOuterDropdownSelectorBlock}>
                            <div className={styles.amPmActiveBoxSelection} onClick={() => setShowStartDropdown(!showStartDropdown)}>
                                {startPeriod}
                            </div>
                            <img
                                src={ArrowLeft} alt="toggle"
                                className={`${styles.amPmExternalArrowIcon} ${showStartDropdown ? styles.arrowFlippedUp : ''}`}
                                onClick={() => setShowStartDropdown(!showStartDropdown)}
                            />
                            {showStartDropdown && (
                                <div className={styles.amPmDropdownFloatingMenu}>
                                    <div onClick={() => { setStartPeriod('AM'); setShowStartDropdown(false); setTimeout(onStartBlur, 0); }}>AM</div>
                                    <div onClick={() => { setStartPeriod('PM'); setShowStartDropdown(false); setTimeout(onStartBlur, 0); }}>PM</div>
                                </div>
                            )}
                        </div>
                    </div>
                    {startError && <p style={errorStyle}>{startError}</p>}
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
                            type="text" inputMode="numeric" placeholder="DD" maxLength="2"
                            className={styles.segmentedInputControl}
                            value={endDay}
                            onChange={handleDigitChange(setEndDay, 1, 31)}
                            onBlur={() => {
                                makeBlur(endDay, setEndDay, 1, 31, () => daysInMonth(endMonth, endYear))();
                                onEndBlur();
                            }}
                        />
                        <span className={styles.dateSeparator}>/</span>
                        <input
                            type="text" inputMode="numeric" placeholder="MM" maxLength="2"
                            className={styles.segmentedInputControl}
                            value={endMonth}
                            onChange={handleDigitChange(setEndMonth, 1, 12)}
                            onBlur={() => { makeBlur(endMonth, setEndMonth, 1, 12)(); onEndBlur(); }}
                        />
                        <span className={styles.dateSeparator}>/</span>
                        <input
                            type="text" inputMode="numeric" placeholder="YYYY" maxLength="4"
                            className={styles.segmentedInputControlYear}
                            value={endYear}
                            onChange={handleYearChange(setEndYear)}
                            onBlur={() => {
                                const y = parseInt(endYear, 10);
                                const thisYear = new Date().getFullYear();
                                if (!endYear || isNaN(y) || y < thisYear || endYear.length !== 4) {
                                    setEndYear(String(thisYear));
                                }
                                onEndBlur();
                            }}
                        />
                    </div>

                    <div className={styles.timeRowFlexSelector}>
                        <span className={styles.atTimePrefixLabel}>at the time</span>

                        <div className={styles.manualTimeSegmentsContainer}>
                            <input
                                type="text" inputMode="numeric" placeholder="HH" maxLength="2"
                                className={styles.segmentedInputControl}
                                value={endHour}
                                onChange={handleDigitChange(setEndHour, 1, 12)}
                                onBlur={() => { makeBlur(endHour, setEndHour, 1, 12)(); onEndBlur(); }}
                            />
                            <span className={styles.timeSeparator}>:</span>
                            <input
                                type="text" inputMode="numeric" placeholder="MM" maxLength="2"
                                className={styles.segmentedInputControl}
                                value={endMinute}
                                onChange={handleDigitChange(setEndMinute, 0, 59)}
                                onBlur={() => { makeBlur(endMinute, setEndMinute, 0, 59)(); onEndBlur(); }}
                            />
                        </div>

                        <div className={styles.amPmOuterDropdownSelectorBlock}>
                            <div className={styles.amPmActiveBoxSelection} onClick={() => setShowEndDropdown(!showEndDropdown)}>
                                {endPeriod}
                            </div>
                            <img
                                src={ArrowLeft} alt="toggle"
                                className={`${styles.amPmExternalArrowIcon} ${showEndDropdown ? styles.arrowFlippedUp : ''}`}
                                onClick={() => setShowEndDropdown(!showEndDropdown)}
                            />
                            {showEndDropdown && (
                                <div className={styles.amPmDropdownFloatingMenu}>
                                    <div onClick={() => { setEndPeriod('AM'); setShowEndDropdown(false); setTimeout(onEndBlur, 0); }}>AM</div>
                                    <div onClick={() => { setEndPeriod('PM'); setShowEndDropdown(false); setTimeout(onEndBlur, 0); }}>PM</div>
                                </div>
                            )}
                        </div>
                    </div>
                    {endError && <p style={errorStyle}>{endError}</p>}
                </div>

                <div className={styles.divider50} />

                {/* Address */}
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
