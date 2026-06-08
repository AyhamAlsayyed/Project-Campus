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
import { useNavigate } from 'react-router-dom';
const API = 'http://localhost:8000';

const renderIcon = (src, color, width = '18px', height = '18px') => (
    <div style={{
        width, height,
        backgroundColor: color,
        maskImage: `url(${src})`,
        WebkitMaskImage: `url(${src})`,
        maskSize: 'contain', WebkitMaskSize: 'contain',
        maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center', WebkitMaskPosition: 'center',
        display: 'inline-block', flexShrink: 0,
    }} />
);

// ── Role helpers ──
const getRoleTier = (member) => {
    const r = (member.role || '').toLowerCase();
    if (r === 'owner' || r === 'community owner') return 0;
    if (r === 'admin' || r === 'community admin') return 1;
    return 2;
};
const getDisplayRole = (member) => {
    const r = (member.role || '').toLowerCase();
    if (r === 'owner') return 'Community owner';
    if (r === 'admin' || r === 'community admin') return 'Community admin';
    return member.community_role || member.role || 'Member';
};

const isOwner = (member) => getRoleTier(member) === 0;
const isAdmin = (member) => getRoleTier(member) === 1;
const isMember = (member) => getRoleTier(member) === 2;

// What actions can currentUserRole perform on a target member?
const canAct = () => true;
export default function MembersTab({ communityId, onBack, currentUserRole = 'member' }) {
  
    const [allMembers, setAllMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState([]);
    const [sortMode, setSortMode] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [activeActionMenu, setActiveActionMenu] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);
    const [toast, setToast] = useState(null);
    const [currentRole, setCurrentRole] = useState(currentUserRole);
    const navigate = useNavigate();

    const filterRef = useRef(null);
    const sortRef = useRef(null);
    const token = localStorage.getItem('access');
    const actionMenuRef = useRef(null);

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

                // 👇 Add this — derive role from the fetched list directly
                const loginUser = JSON.parse(localStorage.getItem('login_user'));
                const me = data.find(m => m.username === loginUser?.username);
               
                if (me) setCurrentRole(me.role);

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchMembers();
    }, [communityId, token]);
    useEffect(() => {
        const handler = (e) => {
            if (filterRef.current && !filterRef.current.contains(e.target)) setIsFilterOpen(false);
            if (sortRef.current && !sortRef.current.contains(e.target)) setIsSortOpen(false);
            if (actionMenuRef.current && !actionMenuRef.current.contains(e.target)) setActiveActionMenu(null);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ── Close dropdowns on outside click ──
    useEffect(() => {
        const handler = (e) => {
            if (filterRef.current && !filterRef.current.contains(e.target)) setIsFilterOpen(false);
            if (sortRef.current && !sortRef.current.contains(e.target)) setIsSortOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const toggleFilter = (label) => {
        setActiveFilters(prev =>
            prev.includes(label) ? prev.filter(f => f !== label) : [...prev, label]
        );
    };

    const counts = allMembers.reduce((acc, m) => {
        const tier = getRoleTier(m);
        if (tier === 0) acc.Owner = (acc.Owner || 0) + 1;
        else if (tier === 1) acc.Admin = (acc.Admin || 0) + 1;
        else acc.Member = (acc.Member || 0) + 1;
        return acc;
    }, {});

    // ── Filtered + sorted — owner first, then admins, then members ──
    const visibleMembers = allMembers
        .filter(m => {
            const name = (m.name || m.full_name || m.username || '').toLowerCase();
            if (!name.includes(searchQuery.toLowerCase())) return false;
            if (activeFilters.length === 0) return true;
            const tier = getRoleTier(m);
            return activeFilters.some(f => {
                if (f === 'Owner') return tier === 0;
                if (f === 'Admin') return tier === 1;
                if (f === 'Member') return tier === 2;
                return true;
            });
        })
        .sort((a, b) => {
            // Always sort by role tier first
            const tierDiff = getRoleTier(a) - getRoleTier(b);
            if (tierDiff !== 0) return tierDiff;

            // Then apply user's chosen sort within same tier
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
            let successMsg = '';

            if (action === 'make-admin') {
                endpoint = `${API}/api/communities/${communityId}/make-admin/${member.id}/`;
                successMsg = `${member.name || member.username} is now a Community admin.`;
            } else if (action === 'kick') {
                endpoint = `${API}/api/communities/${communityId}/kick/${member.id}/`;
                successMsg = `${member.name || member.username} was kicked.`;
            } else if (action === 'block') {
                endpoint = `${API}/api/communities/${communityId}/block/${member.id}/`;
                successMsg = `${member.name || member.username} was blocked.`;
            } else if (action === 'report') {
                endpoint = `${API}/api/communities/${communityId}/report/${member.id}/`;
                successMsg = `${member.name || member.username} was reported.`;
            } else if (action === 'remove-admin') {
                endpoint = `${API}/api/communities/${communityId}/make-admin/${member.id}/`;
                successMsg = `${member.name || member.username} is no longer an admin.`;
            }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error('Action failed');

            if (action === 'kick' || action === 'block') {
                setAllMembers(prev => prev.filter(m => m.id !== member.id));
            }
            if (action === 'make-admin') {
                setAllMembers(prev =>
                    prev.map(m => m.id === member.id ? { ...m, role: 'admin' } : m)
                );
            }
            if (action === 'remove-admin') {
                setAllMembers(prev =>
                    prev.map(m => m.id === member.id ? { ...m, role: 'member' } : m)
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

    return (
        <div className={styles.membersContainer}>

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
                                { label: 'Owner', count: counts.Owner || 0 },
                                { label: 'Admin', count: counts.Admin || 0 },
                                { label: 'Member', count: counts.Member || 0 },
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
                                    <div className={styles.dropdownItem} onClick={() => { setSortMode(null); setIsSortOpen(false); }}>
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
                {loading && <div className={styles.stateMsg}>Loading members...</div>}
                {!loading && error && <div className={styles.stateMsg} style={{ color: '#D4145A' }}>{error}</div>}
                {!loading && !error && visibleMembers.length === 0 && (
                    <div className={styles.stateMsg}>
                        {searchQuery || activeFilters.length > 0 ? 'No members match your search or filters.' : 'No members found.'}
                    </div>
                )}

                {!loading && visibleMembers.map((member) => {
                    const myTier = getRoleTier({ role: currentRole });

                    const theirTier = getRoleTier(member);
                    const canKick = myTier < theirTier;
                    const canMakeAdmin = canKick && isMember(member);
                    const canRemoveAdmin = myTier === 0 && isAdmin(member);
                   


                    const displayRole = getDisplayRole(member);
                    const memberIsOwner = isOwner(member);
                    const memberIsAdmin = isAdmin(member);
                    const memberName = member.name || member.full_name || member.username || 'Unknown';
                    const isActing = actionLoading === member.id;

                    return (
                        <div key={member.id} className={`${styles.memberItem} ${isActing ? styles.memberActing : ''}`}>
                            <div className={styles.memberInfoLeft}>
                                <img
                                    src={getAvatar(member)}
                                    alt="avatar"
                                    className={styles.avatar}
                                    onError={e => { e.target.src = DefaultPfp; }}
                                />
                                <div className={styles.memberDetails}>
                                    <span className={`${styles.roleBadge} ${(memberIsOwner || memberIsAdmin) ? styles.roleAdmin : styles.roleMember}`}>
                                        {displayRole}
                                    </span>
                                    <div className={styles.nameRow}>
                                        <h4 className={`${styles.memberName} ${(memberIsOwner || memberIsAdmin) ? styles.nameAdmin : ''}`}>
                                            {memberName}
                                        </h4>
                                        <span className={styles.userType}>{member.type}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.actionBtnWrapper} ref={activeActionMenu === member.id ? actionMenuRef : null}>
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
                                        <div className={styles.actionItem} onClick={() => {
                                            setActiveActionMenu(null);
                                            if (member.type === 'page') {
                                                navigate(`/page/${member.id}`);
                                            } else {
                                                navigate(`/profile/${member.id}`);
                                            }
                                        }}>
                                            {renderIcon(DefaultPfp, '#CCCCCC')} View profile
                                        </div>
                                        <div className={styles.actionDivider} />
                                        {canMakeAdmin && (
                                            <>
                                                <div className={styles.actionItem} onClick={() => handleAction('make-admin', member)}>
                                                    {renderIcon(MakeAdminIcon, '#CCCCCC')} Make admin
                                                </div>
                                                <div className={styles.actionDivider} />
                                            </>
                                        )}

                                        {canRemoveAdmin && (
                                            <>
                                                <div className={styles.actionItem} onClick={() => handleAction('remove-admin', member)}>
                                                    {renderIcon(MakeAdminIcon, '#CCCCCC')} Remove admin
                                                </div>
                                                <div className={styles.actionDivider} />
                                            </>
                                        )}

                                        {canKick && (
                                            <>
                                                <div className={styles.actionItem} onClick={() => handleAction('kick', member)}>
                                                    {renderIcon(LeaveIcon, '#CCCCCC')} Kick member
                                                </div>
                                                <div className={styles.actionDivider} />
                                            </>
                                        )}

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