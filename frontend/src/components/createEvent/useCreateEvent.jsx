import { useState } from 'react';

const API = 'http://localhost:8000';

export function useCreateEvent({ onSuccess } = {}) {
    const [eventName, setEventName]       = useState('');
    const [description, setDescription]   = useState('');
    const [bannerFile, setBannerFile]     = useState(null);
    const [bannerPreview, setBannerPreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError]   = useState('');

    // Right Sidebar — Start Time
    const [startDay, setStartDay]       = useState('');
    const [startMonth, setStartMonth]   = useState('');
    const [startYear, setStartYear]     = useState('');
    const [startHour, setStartHour]     = useState('');
    const [startMinute, setStartMinute] = useState('');
    const [startPeriod, setStartPeriod] = useState('AM');

    // Right Sidebar — End Time
    const [endDay, setEndDay]       = useState('');
    const [endMonth, setEndMonth]   = useState('');
    const [endYear, setEndYear]     = useState('');
    const [endHour, setEndHour]     = useState('');
    const [endMinute, setEndMinute] = useState('');
    const [endPeriod, setEndPeriod] = useState('PM');

    const isFormValid =
        !!bannerFile &&
        eventName.trim() !== '' &&
        description.trim() !== '' &&
        startDay && startMonth && startYear && startHour && startMinute &&
        endDay && endMonth && endYear && endHour && endMinute;

    // Converts segmented inputs + AM/PM into ISO datetime string
    const buildDatetime = (day, month, year, hour, minute, period) => {
        let h = parseInt(hour, 10);
        if (period === 'PM' && h !== 12) h += 12;
        if (period === 'AM' && h === 12) h = 0;
        const pad = (n) => String(n).padStart(2, '0');
        // Returns "YYYY-MM-DDTHH:MM:00"
        return `${year}-${pad(parseInt(month, 10))}-${pad(parseInt(day, 10))}T${pad(h)}:${pad(parseInt(minute, 10))}:00`;
    };

    const handleSubmit = async () => {
        if (!isFormValid || isSubmitting) return;
        setIsSubmitting(true);
        setSubmitError('');

        try {
            const token = localStorage.getItem('access');

            const formData = new FormData();
            formData.append('title', eventName.trim());
            formData.append('description', description.trim());
            formData.append('banner', bannerFile);
            formData.append(
                'start_date',
                buildDatetime(startDay, startMonth, startYear, startHour, startMinute, startPeriod)
            );
            formData.append(
                'end_date',
                buildDatetime(endDay, endMonth, endYear, endHour, endMinute, endPeriod)
            );

            const res = await fetch(`${API}/api/events/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                // Don't set Content-Type — browser sets it automatically with boundary for FormData
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.detail || data?.message || 'Failed to create event.');
            }

            onSuccess?.();
        } catch (err) {
            setSubmitError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formProps = {
        eventName, setEventName,
        description, setDescription,
        bannerFile, setBannerFile,
        bannerPreview, setBannerPreview,
        isFormValid,
        onSubmit: handleSubmit,
        isSubmitting,
        submitError,
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
        endPeriod, setEndPeriod,
    };

    return { formProps, sidebarProps };
}