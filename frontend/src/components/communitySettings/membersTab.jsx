import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './membersTab.module.css';

import ArrowLeft from '../../Assets/icons/arrow-left.png';
import SearchIcon from '../../Assets/icons/search.png';
import FilterIcon from '../../Assets/icons/filter.png';
import SortIcon from '../../Assets/icons/sort.png';
import XIcon from '../../Assets/icons/x.png';
import DefaultPfp from '../../Assets/icons/default-pfp.png';
import MakeAdminIcon from '../../Assets/icons/make-admin.png';
import LeaveIcon from '../../Assets/icons/leave.png';
import BlockIcon from '../../Assets/icons/block.png';
import InfoIcon from '../../Assets/icons/info.png';

const API = 'http://localhost:8000';

const renderIcon = (src, color, width = '18px', height = '18px') => (
    <div
        style={{
            width, height,
            backgroundColor: color,
            maskImage: `url(${src})`,
            WebkitMaskImage: `url(${src})`,
            maskSize: 'contain', WebkitMaskSize: 'contain',
            maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
            maskPosition: 'center', WebkitMaskPosition: 'center',
            display: 'inline-block', flexShrink: 0,
        }}
    />
);

export default function MembersTab({ communityId, onBack }) {
    // ── Data state ──
    const [allMembers, setAllMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ── UI Controls ──
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState([]); // ['Admin','Instructor','Student']
    const [sortMode, setSortMode] = useState(null); // 'date' | 'alpha'
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [activeActionMenu, setActiveActionMenu] = useState(null);

    // ── Action feedback ──
    const [actionLoading, setActionLoading] = useState(null); // memberId being acted on
    const [toast, setToast] = useState(null);   // { message, type }

    const filterRef = useRef(null);
    const sortRef = useRef(null);
    const token = localStorage.getItem('access');
    

    // ── Fetch members ──
    useEffect(() => {
        if (!communityId) return;
        const fetchMembers = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${API}/api/communities/${communityId}/members/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error('Failed to fetch members');
                const data = await res.json();
                setAllMembers(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchMembers();
    }, [communityId, token]);

    // ── Close dropdowns on outside click ──
    useEffect(() => {
        const handler = (e) => {
            if (filterRef.current && !filterRef.current.contains(e.target)) setIsFilterOpen(false);
            if (sortRef.current && !sortRef.current.contains(e.target)) setIsSortOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ── Toast helper ──
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // ── Filter toggle ──
    const toggleFilter = (label) => {
        setActiveFilters(prev =>
            prev.includes(label) ? prev.filter(f => f !== label) : [...prev, label]
        );
    };

    // ── Derived: counts per type ──
    const counts = allMembers.reduce((acc, m) => {
        const t = (m.type || m.role || '').toLowerCase();
        if (t.includes('admin')) acc.Admin = (acc.Admin || 0) + 1;
        else if (t.includes('instructor')) acc.Instructor = (acc.Instructor || 0) + 1;
        else acc.Student = (acc.Student || 0) + 1;
        return acc;
    }, {});

    // ── Derived: filtered + sorted members ──
    const visibleMembers = allMembers
        .filter(m => {
            const name = (m.name || m.full_name || m.username || '').toLowerCase();
            const matchSearch = name.includes(searchQuery.toLowerCase());

            if (!matchSearch) return false;
            if (activeFilters.length === 0) return true;

            const t = (m.type || m.role || '').toLowerCase();
            return activeFilters.some(f => {
                if (f === 'Admin') return t.includes('admin');
                if (f === 'Instructor') return t.includes('instructor');
                if (f === 'Student') return t.includes('student') || (!t.includes('admin') && !t.includes('instructor'));
                return true;
            });
        })
        .sort((a, b) => {
            if (sortMode === 'alpha') {
                const nameA = (a.name || a.full_name || a.username || '').toLowerCase();
                const nameB = (b.name || b.full_name || b.username || '').toLowerCase();
                return nameA.localeCompare(nameB);
            }
            if (sortMode === 'date') {
                return new Date(b.date_joined || 0) - new Date(a.date_joined || 0);
            }
            return 0;
        });

    // ── Actions ──
    const handleAction = useCallback(async (action, member) => {
        setActiveActionMenu(null);
        setActionLoading(member.id);
        try {
            let endpoint = '';
            let method = 'POST';
            let successMsg = '';

            if (action === 'make-admin') {
                endpoint = `${API}/api/communities/${communityId}/make-admin/${member.id}/`;
                successMsg = `${member.name || member.username} is now an admin.`;
            } else if (action === 'kick') {
                endpoint = `${API}/api/communities/${communityId}/kick/${member.id}/`;
                successMsg = `${member.name || member.username} was kicked.`;
            } else if (action === 'block') {
                endpoint = `${API}/api/communities/${communityId}/block/${member.id}/`;
                successMsg = `${member.name || member.username} was blocked.`;
            } else if (action === 'report') {
                endpoint = `${API}/api/communities/${communityId}/report/${member.id}/`;
                successMsg = `${member.name || member.username} was reported.`;
            }

            const res = await fetch(endpoint, {
                method,
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error('Action failed');

            // Remove kicked/blocked members from list immediately
            if (action === 'kick' || action === 'block') {
                setAllMembers(prev => prev.filter(m => m.id !== member.id));
            }
            // Promote to admin locally
            if (action === 'make-admin') {
                setAllMembers(prev =>
                    prev.map(m => m.id === member.id ? { ...m, role: 'Community admin' } : m)
                );
            }

            showToast(successMsg, 'success');
        } catch (err) {
            showToast('Something went wrong. Try again.', 'error');
        } finally {
            setActionLoading(null);
        }
    }, [communityId, token]);

    const getAvatar = (member) => {
        const raw = member.avatar || member.profile?.avatar;
        if (!raw) return DefaultPfp;
        return raw.startsWith('http') ? raw : `${API}${raw}`;
    };

    // ── Render ──
    return (
        <div className={styles.membersContainer}>

            {/* Toast */}
            {toast && (
                <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div className={styles.headerRow}>
                <div className={styles.headerLeft}>
                    <button className={styles.backBtn} onClick={onBack}>
                        {renderIcon(ArrowLeft, '#E6E6E6', '20px', '20px')}
                    </button>
                    <h2 className={styles.headerTitle}>Members</h2>
                </div>
                <div className={styles.memberCount}>
                    {loading ? '...' : `${allMembers.length.toLocaleString()} member${allMembers.length !== 1 ? 's' : ''}`}
                </div>
            </div>

            <div className={styles.centeredDivider} />

            {/* Search & Controls */}
            <div className={styles.controlsRow}>
                {/* Search */}
                <div className={styles.searchWrapper}>
                    <div className={styles.searchIcon}>
                        {renderIcon(SearchIcon, '#808080', '18px', '18px')}
                    </div>
                    <input
                        type="text"
                        placeholder="Searching for someone?"
                        className={styles.searchInput}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button className={styles.clearSearch} onClick={() => setSearchQuery('')}>
                            {renderIcon(XIcon, '#808080', '14px', '14px')}
                        </button>
                    )}
                </div>

                {/* Filter */}
                <div className={styles.buttonWrapper} ref={filterRef}>
                    <button
                        className={`${styles.filterBtn} ${activeFilters.length > 0 ? styles.filterActive : ''}`}
                        onClick={() => { setIsFilterOpen(p => !p); setIsSortOpen(false); }}
                    >
                        {renderIcon(FilterIcon, activeFilters.length > 0 ? '#c72cff' : '#CCCCCC')}
                        Filter {activeFilters.length > 0 ? `(${activeFilters.length})` : ''}
                    </button>

                    {isFilterOpen && (
                        <div className={styles.dropdownMenu}>
                            {[
                                { label: 'Admin', count: counts.Admin || 0 },
                                { label: 'Instructor', count: counts.Instructor || 0 },
                                { label: 'Student', count: counts.Student || 0 },
                            ].map(({ label, count }) => (
                                <div
                                    key={label}
                                    className={`${styles.dropdownItem} ${activeFilters.includes(label) ? styles.dropdownItemActive : ''}`}
                                    onClick={() => toggleFilter(label)}
                                >
                                    <div className={styles.dropdownItemLeft}>
                                        <div className={`${styles.radioCircle} ${activeFilters.includes(label) ? styles.radioChecked : ''}`} />
                                        {label}s
                                    </div>
                                    <span className={styles.dropdownCount}>{count.toLocaleString()}</span>
                                </div>
                            ))}

                            <div className={styles.dropdownDivider} />

                            <div className={styles.dropdownItem} onClick={() => setActiveFilters([])}>
                                <div className={styles.dropdownItemLeft}>
                                    {renderIcon(XIcon, '#CCCCCC', '14px', '14px')} Clear filters
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sort */}
                <div className={styles.buttonWrapper} ref={sortRef}>
                    <button
                        className={`${styles.sortBtn} ${sortMode ? styles.filterActive : ''}`}
                        onClick={() => { setIsSortOpen(p => !p); setIsFilterOpen(false); }}
                    >
                        {renderIcon(SortIcon, sortMode ? '#c72cff' : '#CCCCCC', '30px', '30px')}
                    </button>

                    {isSortOpen && (
                        <div className={styles.dropdownMenu} style={{ right: 0, left: 'auto', minWidth: 200 }}>
                            <div
                                className={`${styles.dropdownItem} ${sortMode === 'date' ? styles.dropdownItemActive : ''}`}
                                onClick={() => { setSortMode(sortMode === 'date' ? null : 'date'); setIsSortOpen(false); }}
                            >
                                Filter by date joined
                            </div>
                            <div
                                className={`${styles.dropdownItem} ${sortMode === 'alpha' ? styles.dropdownItemActive : ''}`}
                                onClick={() => { setSortMode(sortMode === 'alpha' ? null : 'alpha'); setIsSortOpen(false); }}
                            >
                                Alphabetical order
                            </div>
                            {sortMode && (
                                <>
                                    <div className={styles.dropdownDivider} />
                                    <div
                                        className={styles.dropdownItem}
                                        onClick={() => { setSortMode(null); setIsSortOpen(false); }}
                                    >
                                        <div className={styles.dropdownItemLeft}>
                                            {renderIcon(XIcon, '#CCCCCC', '14px', '14px')} Clear sort
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Member List */}
            <div className={styles.memberList}>
                {loading && (
                    <div className={styles.stateMsg}>Loading members...</div>
                )}
                {!loading && error && (
                    <div className={styles.stateMsg} style={{ color: '#D4145A' }}>{error}</div>
                )}
                {!loading && !error && visibleMembers.length === 0 && (
                    <div className={styles.stateMsg}>
                        {searchQuery || activeFilters.length > 0
                            ? 'No members match your search or filters.'
                            : 'No members found.'}
                    </div>
                )}

                {!loading && visibleMembers.map((member) => {
                    const isAdmin = (member.role || '').toLowerCase().includes('admin');
                    const memberName = member.name || member.full_name || member.username || 'Unknown';
                    const isActing = actionLoading === member.id;

                    return (
                        <div key={member.id} className={`${styles.memberItem} ${isActing ? styles.memberActing : ''}`}>
                            <div className={styles.memberInfoLeft}>
                                <img src={getAvatar(member)} alt="avatar" className={styles.avatar}
                                    onError={e => { e.target.src = DefaultPfp; }} />
                                <div className={styles.memberDetails}>
                                    <span className={`${styles.roleBadge} ${isAdmin ? styles.roleAdmin : styles.roleMember}`}>
                                        {member.role || 'member'}
                                    </span>
                                    <div className={styles.nameRow}>
                                        <h4 className={`${styles.memberName} ${isAdmin ? styles.nameAdmin : ''}`}>
                                            {memberName}
                                        </h4>
                                        <span className={styles.userType}>{member.type}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.actionBtnWrapper}>
                                <button
                                    className={styles.dotsBtn}
                                    onClick={() => setActiveActionMenu(p => p === member.id ? null : member.id)}
                                    disabled={isActing}
                                >
                                    {isActing
                                        ? <div className={styles.spinner} />
                                        : <><div className={styles.dot} /><div className={styles.dot} /><div className={styles.dot} /></>
                                    }
                                </button>

                                {activeActionMenu === member.id && (
                                    <div className={styles.actionDropdown}>
                                        <div className={styles.actionItem} onClick={() => setActiveActionMenu(null)}>
                                            {renderIcon(DefaultPfp, '#CCCCCC')} View profile
                                        </div>
                                        <div className={styles.actionDivider} />
                                        {!isAdmin && (
                                            <>
                                                <div className={styles.actionItem} onClick={() => handleAction('make-admin', member)}>
                                                    {renderIcon(MakeAdminIcon, '#CCCCCC')} Make admin
                                                </div>
                                                <div className={styles.actionDivider} />
                                            </>
                                        )}
                                        <div className={styles.actionItem} onClick={() => handleAction('kick', member)}>
                                            {renderIcon(LeaveIcon, '#CCCCCC')} Kick member
                                        </div>
                                        <div className={styles.actionDivider} />
                                        <div className={`${styles.actionItem} ${styles.dangerText}`} onClick={() => handleAction('block', member)}>
                                            {renderIcon(BlockIcon, '#D4145A')} Block user
                                        </div>
                                        <div className={styles.actionDivider} />
                                        <div className={`${styles.actionItem} ${styles.dangerText}`} onClick={() => handleAction('report', member)}>
                                            {renderIcon(InfoIcon, '#D4145A')} Report user
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}