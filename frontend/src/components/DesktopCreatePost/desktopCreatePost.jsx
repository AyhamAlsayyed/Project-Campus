import React from 'react';
import { Cloud } from 'lucide-react';
import styles from './desktopCreatePost.module.css'; // Adjust path as needed

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
    API
}) => {
    // Helper for the greeting
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

    return (
        <div className={styles.createPostSection} onClick={() => setIsModalOpen(true)}>
            <div className={styles.greetingRow}>
                <img src={avatarSrc} alt="User Avatar" className={styles.userProfilePicture} />
                <div className={styles.greetingText}>
                    <strong className={styles.greeting}>
                        Good {timeGreeting}, {user?.full_name || user?.username || "User"}!
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
                {/* Media Upload */}
                <label className={styles.actionButton} onClick={e => e.stopPropagation()}>
                    <span>🖼</span> Media
                    <input hidden type="file" accept="image/*,video/*" multiple onChange={handleMediaUpload} />
                </label>

                {/* File Upload */}
                <label className={styles.actionButton} onClick={e => e.stopPropagation()}>
                    <span>📁</span> File
                    <input hidden type="file" multiple onChange={handleFileUpload} />
                </label>

                {/* Poll Toggle */}
                <button 
                    type="button" 
                    className={styles.actionButton}
                    onClick={e => { e.stopPropagation(); setIsPollOpen(prev => !prev); }}
                >
                    <span>📊</span> Poll
                </button>

                {/* Community Selector */}
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