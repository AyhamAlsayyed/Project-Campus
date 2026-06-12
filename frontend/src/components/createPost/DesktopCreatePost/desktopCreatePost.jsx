import React from 'react';
import { Cloud } from 'lucide-react';
import { useEffect } from 'react';
import styles from './desktopCreatePost.module.css';
import ProfilePicture from '../../../Assets/icons/default-pfp.png';
const DesktopCreatePost = ({
    user,
    avatarSrc,
    weather,
    setIsModalOpen,
    handleMediaUpload,
    handleFileUpload,
    setIsPollOpen,
    selectedCommunity,
    setSelectedCommunity,
    communityDropdownOpen,
    setCommunityDropdownOpen,
    joinedCommunities,
    API,
    defaultCommunity,
    refreshPosts
}) => {
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

    useEffect(() => {

        if (defaultCommunity && (!selectedCommunity || selectedCommunity.id !== defaultCommunity.id)) {
            setSelectedCommunity(defaultCommunity);
        }
    }, [defaultCommunity, selectedCommunity, setSelectedCommunity]);

    return (
        <div className={styles.createPostSection} onClick={() => setIsModalOpen(true)}>
            <div className={styles.greetingRow}>
                <img
                    src={avatarSrc || ProfilePicture}
                    alt="User Avatar"
                    className={styles.userProfilePicture}
                    onError={e => { e.currentTarget.src = ProfilePicture; }}
                />
                <div className={styles.greetingText}>
                    <strong className={styles.greeting}>
                       Good {timeGreeting}, {user?.full_name || user?.page_full_name || user?.username || "User"}!
                    </strong>
                    <span className={styles.question}>What's on your mind?</span>
                </div>
                {weather && (
                    <div className={styles.weatherBadge}>
                        <Cloud width={22} height={22} /> {weather.temp}°c
                    </div>
                )}
            </div>

            <div className={styles.actionsRow} onClick={e => e.stopPropagation()}>
                {/* 2. Added setIsModalOpen(true) to labels so clicking them opens the editor */}
                <label
                    className={styles.actionButton}
                    onClick={() => setIsModalOpen(true)}
                >
                    <span>🖼</span> Media
                    <input hidden type="file" accept="image/*,video/*" multiple onChange={handleMediaUpload} />
                </label>

                <label
                    className={styles.actionButton}
                    onClick={() => setIsModalOpen(true)}
                >
                    <span>📁</span> File
                    <input hidden type="file" multiple onChange={handleFileUpload} />
                </label>

                <button
                    type="button"
                    className={styles.actionButton}
                    onClick={e => {
                        e.stopPropagation();
                        setIsPollOpen(prev => !prev);
                        setIsModalOpen(true); // 3. Open modal when Poll is clicked
                    }}
                >
                    <span>📊</span> Poll
                </button>

                <div className={styles.communitySelector} onClick={e => e.stopPropagation()}>
                    <button
                        className={styles.communitySelectBtn}
                        onClick={e => { e.stopPropagation(); setCommunityDropdownOpen(prev => !prev); }}
                    >
                        <span className={styles.communitySelectLabel}>
                            {selectedCommunity ? selectedCommunity.name : "Community"}
                        </span>
                        <span className={styles.communityChevron}>▾</span>
                    </button>

                    {communityDropdownOpen && (
                        <div className={styles.communityDropdown} onClick={e => e.stopPropagation()}>
                            <div
                                className={styles.communityDropdownItem}
                                onClick={() => { setSelectedCommunity(null); setCommunityDropdownOpen(false); }}
                            >
                                None
                            </div>
                            {joinedCommunities.map(c => (
                                <div
                                    key={c.id}
                                    className={`${styles.communityDropdownItem} ${selectedCommunity?.id === c.id ? styles.communityDropdownItemActive : ""}`}
                                    onClick={() => { setSelectedCommunity(c); setCommunityDropdownOpen(false); }}
                                >
                                    {c.avatar && (
                                        <img
                                            src={c.avatar.startsWith("http") ? c.avatar : `${API}${c.avatar}`}
                                            alt=""
                                            className={styles.communityDropdownAvatar}
                                        />
                                    )}
                                    {c.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <input
                type="text"
                placeholder="What did you learn today? . . ."
                className={styles.postInput}
                readOnly
            />
        </div>
    );
};

export default DesktopCreatePost;