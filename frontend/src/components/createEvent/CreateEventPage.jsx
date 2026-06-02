import React, { useState } from 'react';
import CreateEventForm from './CreateEventForm';
import CreateEventRightSidebar from './CreateEventRightSidebar';
import styles from './createEvent.module.css';

export default function CreateEventPage({ onBack }) {
    // Form States
    const [eventName, setEventName] = useState('');
    const [description, setDescription] = useState('');
    const [bannerUploaded, setBannerUploaded] = useState(false);

    // Right Sidebar States - Start Time
    const [startDay, setStartDay] = useState('');
    const [startMonth, setStartMonth] = useState('');
    const [startYear, setStartYear] = useState('');
    const [startHour, setStartHour] = useState('');
    const [startMinute, setStartMinute] = useState('');
    const [startPeriod, setStartPeriod] = useState('AM');

    // Right Sidebar States - End Time
    const [endDay, setEndDay] = useState('');
    const [endMonth, setEndMonth] = useState('');
    const [endYear, setEndYear] = useState('');
    const [endHour, setEndHour] = useState('');
    const [endMinute, setEndMinute] = useState('');
    const [endPeriod, setEndPeriod] = useState('PM');

    // Validation: All required fields must be filled
    const isFormValid =
        bannerUploaded &&
        eventName.trim() !== '' &&
        description.trim() !== '' &&
        startDay.trim() !== '' &&
        startMonth.trim() !== '' &&
        startYear.trim() !== '' &&
        startHour.trim() !== '' &&
        startMinute.trim() !== '' &&
        endDay.trim() !== '' &&
        endMonth.trim() !== '' &&
        endYear.trim() !== '' &&
        endHour.trim() !== '' &&
        endMinute.trim() !== '';

    const formProps = {
        eventName,
        setEventName,
        description,
        setDescription,
        bannerUploaded,
        setBannerUploaded,
        isFormValid,
        onBack
    };

    const sidebarProps = {
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
        endPeriod, setEndPeriod
    };

    return (
        <div className={styles.pageWrapper}>
            <CreateEventForm {...formProps} />
            <CreateEventRightSidebar {...sidebarProps} />
        </div>
    );
}
