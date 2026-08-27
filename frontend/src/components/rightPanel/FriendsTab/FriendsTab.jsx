import React from 'react';
import styles from './FriendsTab.module.css';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DefaultPfp from '../../../Assets/icons/default-pfp.png';

export default function FriendsTab({ friends = { mutual: [], all: [] } }) {
    const navigate = useNavigate();
    const handleFriendClick = (userId) => {
        navigate(`/profile/${userId}`);
    };

    const mutuals = friends.mutual?.slice(0, 4) || [];
    const allFriends = friends.all || [];

    return (
        <div className={styles.tabWrapper}>
            <div className={styles.friendsCard}>

                {/* Search Bar */}
                <div className={styles.searchBar}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Searching for someone?"
                        className={styles.searchInput}
                    />
                </div>

                {/* Mutual Section — hidden when empty */}
                {mutuals.length > 0 && (
                    <>
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <h3 className={styles.sectionTitle}>Mutual</h3>
                                <div className={styles.headerLine} />
                                <button className={styles.viewAllBtn}>view all</button>
                            </div>

                            <div className={styles.friendsGrid}>
                                {mutuals.map((friend) => (
                                    <div key={friend.id} className={styles.friendItem} onClick={() => handleFriendClick(friend.id)}>
                                        <div className={styles.avatarBox}>
                                            <img
                                                src={friend.avatar_url || friend.avatar || DefaultPfp}
                                                onError={e => { e.currentTarget.src = DefaultPfp; }}
                                                alt={friend.username}
                                                className={styles.friendImg}
                                            />
                                        </div>
                                        <span className={styles.friendName} style={friend.role === 'instructor' ? { color: "#E043B5" } : {}}>{friend.username}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className={styles.mainDivider} />
                    </>
                )}


                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h3 className={styles.sectionTitle}>All Friends</h3>
                        <div className={styles.headerLine} /> {/* The Middle Line */}
                        {/* No button here to match common UI, but can be added if needed */}
                    </div>

                    <div className={styles.friendsGrid}>
                        {allFriends.map((friend) => (
                            <div key={friend.id} className={styles.friendItem} onClick={() => handleFriendClick(friend.id)}>
                                <div className={styles.avatarBox}>
                                    <img
                                        src={friend.avatar_url || friend.avatar || DefaultPfp}
                                                onError={e => { e.currentTarget.src = DefaultPfp; }}
                                        alt={friend.username}
                                        className={styles.friendImg}
                                    />
                                </div>
                                <span className={styles.friendName} style={friend.role === 'instructor' ? { color: "#E043B5" } : {}}>{friend.username}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}