
import PostCard from "../posts/postCard";
import UserDetails from "../userDetails/userDetails";
import FriendsTab from "../FriendsTab/FriendsTab";
import { User, MessageSquare, UserPlus, Users } from "lucide-react";
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const firstDay = (y, m) => new Date(y, m, 1).getDay();

export default function MobileProfileView({
    styles, user, currentUser, isOwnProfile,
    friendStatus, posts, photoPosts, friends,
    activityPosts, savedPosts, communityPicks,
    activeTab, setActiveTab, picksSlide, setPicksSlide,
    postsLoading, activitiesLoading, savedLoading,
    openComments, handleMessage, handleAddFriend,
    handleAccept, handleDecline,
    onEditClick, edit,
    ...rest
}) {
    const profileTabs = isOwnProfile ? ['Posts', 'Activities', 'Saved'] : ['Posts', 'Photos', 'Friends'];
    const username = user?.username || "Username";
    const role = user?.role || "Role";
    const fullName = user?.full_name || user?.fullName || "Full name";
    const university = user?.university || "University";
    const major = user?.major || "Major";
    const bio = user?.bio;
    const avatarUrl = user?.avatar_url || user?.avatar || "";
    const coverUrl = user?.cover_url || user?.cover || "";
    return (
        <div style={{ background: "#333333", minHeight: "100vh" }}>

            {/* Cover */}
            <div style={{
                width: "100%", height: "clamp(160px, 22vw, 300px)", position: "relative",
                background: "rgba(255,255,255,0.04)", overflow: "hidden"
            }}>
                {coverUrl ? <img src={coverUrl} alt="cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}

            </div>

            {/* Avatar + name */}
            <div style={{ padding: "0 16px 16px", marginTop: "clamp(-36px, -5vw, -60px)", position: "relative", zIndex: 2 }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginBottom: 10 }}>
                    <div style={{
                        width: "clamp(72px, 9vw, 96px)", height: "clamp(72px, 9vw, 96px)",
                        borderRadius: "50%", border: "4px solid #333333",
                        overflow: "hidden", background: "rgba(0,0,0,0.25)",
                        flexShrink: 0, position: "relative", zIndex: 3
                    }}>
                        {avatarUrl ? <img src={avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={36} color="white" />}
                    </div>

                    {!isOwnProfile && (
                        <div style={{ display: "flex", gap: 8, marginLeft: "auto", paddingBottom: 4 }}>
                            <button className={styles.messageBtn} onClick={handleMessage} style={{ width: 36, height: 36 }}>
                                <MessageSquare size={16} />
                            </button>
                            {friendStatus === "none" && <button className={styles.addFriendBtn} onClick={handleAddFriend} style={{ padding: "6px 12px", fontSize: "0.8rem" }}><UserPlus size={14} />Add</button>}
                            {friendStatus === "sent" && <button className={styles.pendingBtn} style={{ padding: "6px 12px", fontSize: "0.8rem" }}>⏳ Sent</button>}
                            {friendStatus === "received" && (<><button className={styles.acceptBtn} onClick={handleAccept} style={{ padding: "6px 10px", fontSize: "0.8rem" }}>✅</button><button className={styles.declineBtn} onClick={handleDecline} style={{ padding: "6px 10px", fontSize: "0.8rem" }}>❌</button></>)}
                            {friendStatus === "friends" && <button className={styles.friendsBtn} style={{ padding: "6px 12px", fontSize: "0.8rem" }}>👥 Friends</button>}
                        </div>
                    )}
                </div>

                {user?.role === 'instructor' ? (
                    <>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#fff" }}>{username}</h2>
                            {user?.is_verified && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b2dff" strokeWidth="2.5"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        </div>
                        <div style={{ display: "flex", gap: 8, marginTop: 4, color: "#aaa", fontSize: "0.82rem" }}>
                            {user?.department && <span>{user.department}</span>}
                            {user?.employment_type && <><span>·</span><span>{user.employment_type}</span></>}
                        </div>
                        {bio && <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.6)", fontSize: "0.82rem", lineHeight: 1.4 }}>{bio}</p>}
                    </>
                ) : (
                    <>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                            <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#fff" }}>{username}</h2>
                            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" }}>/{role}</span>
                            {isOwnProfile && (
                                <button style={{
                                    position: "absolute", right: 12, bottom: 10,
                                    background: "transparent", border: "none", borderRadius: 10,
                                    color: "rgba(255,255,255,0.9)", padding: "7px 12px", cursor: "pointer", fontWeight: 600
                                }} onClick={onEditClick}>Edit ✎</button>
                            )}
                        </div>
                        <div style={{ color: "#ccc", fontSize: "0.85rem", marginTop: 2 }}>{fullName}</div>
                        <div style={{ color: "#aaa", fontSize: "0.8rem", marginTop: 2 }}>{university} — {major}</div>
                    </>
                )}
            </div>

            {/* ── Tabs — space-between ── */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                padding: "0 12px",
                overflowX: "auto",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                WebkitOverflowScrolling: "touch"
            }}>
                {(isOwnProfile
                    ? ['Posts', 'Activities', 'Saved']
                    : ['Posts', 'Photos', 'Friends', 'Details']
                ).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            flex: 1,
                            background: "transparent",
                            border: "none",
                            color: activeTab === tab ? "#fff" : "rgba(255,255,255,0.5)",
                            fontWeight: activeTab === tab ? 700 : 500,
                            fontSize: "0.85rem",
                            padding: "12px 4px",
                            cursor: "pointer",
                            borderBottom: activeTab === tab ? "2px solid #8b2dff" : "2px solid transparent",
                            marginBottom: -1,
                            whiteSpace: "nowrap",
                            textAlign: "center"
                        }}
                    >{tab}</button>
                ))}
            </div>

            {/* Tab content */}
            <div style={{ padding: "12px 10px 40px", display: "flex", flexDirection: "column", gap: 12 }}>

                {activeTab === 'Posts' && (
                    postsLoading
                        ? <div className={styles.notice}>Loading...</div>
                        : posts.length === 0
                            ? <div className={styles.notice}>No posts yet.</div>
                            : posts.map(post => <PostCard key={post.id} post={post} openComments={openComments} />)
                )}

                {activeTab === 'Photos' && (
                    <div style={{
                        display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
                        gap: 8, background: "#2a2a2a", borderRadius: 20, padding: 12
                    }}>
                        {photoPosts.length > 0 ? photoPosts.map((post, idx) => (
                            <img
                                key={post.id}
                                src={post.image || post.image_url || post.media?.[0]?.url} alt=""
                                onClick={() => openComments(post)}
                                style={{
                                    width: "100%", aspectRatio: "1/1", objectFit: "cover",
                                    borderRadius: 10, cursor: "pointer",
                                    gridColumn: idx === 0 ? "span 2" : undefined,
                                    gridRow: idx === 0 ? "span 2" : undefined
                                }}
                            />
                        )) : <div className={styles.notice} style={{ gridColumn: "span 3" }}>No photos found.</div>}
                    </div>
                )}

                {activeTab === 'Friends' && (
                    <div className={styles.friendsTabContent}>
                        <FriendsTab friends={friends} />
                    </div>
                )}

                {activeTab === 'Details' && (
                    <div style={{ width: "100%", boxSizing: "border-box" }}>
                        <UserDetails user={user} hidePill />
                    </div>
                )}
                {activeTab === 'Activities' && (
                    activitiesLoading
                        ? <div className={styles.notice}>Loading activities...</div>
                        : activityPosts.length > 0
                            ? activityPosts.map(post => <PostCard key={post.id} post={post} openComments={openComments} />)
                            : <div className={styles.notice}>No recent activity to show.</div>
                )}

                {activeTab === 'Saved' && (
                    savedLoading
                        ? <div className={styles.notice}>Loading saved posts...</div>
                        : savedPosts.length > 0
                            ? savedPosts.map(post => <PostCard key={post.id} post={post} openComments={openComments} />)
                            : <div className={styles.notice}>You haven't saved any posts yet.</div>
                )}

                {!isOwnProfile && activeTab !== 'Details' && communityPicks.length > 0 && (
                    <div className={styles.picksCard} style={{ marginTop: 8 }}>
                        <div className={styles.picksHeader}>
                            <Users size={18} className={styles.picksIcon} />
                            <span className={styles.picksTitle}>{user?.username?.split(' ')[0]}'s Picks</span>
                        </div>
                        <div className={styles.picksSliderWrapper}>
                            <button className={styles.picksArrow} onClick={() => setPicksSlide(p => Math.max(0, p - 1))} disabled={picksSlide === 0}>‹</button>
                            <div className={styles.picksSlide}>
                                {communityPicks[picksSlide] && (() => {
                                    const pick = communityPicks[picksSlide];
                                    return (
                                        <div className={styles.pickItem}>
                                            {pick.cover_image && <img src={pick.cover_image} alt={pick.name} className={styles.pickCoverImage} />}
                                            <div className={styles.pickInfo}>
                                                <div className={styles.pickNameRow}>
                                                    <span className={styles.pickName}>{pick.name}</span>
                                                    <button className={styles.pickViewBtn}>View</button>
                                                </div>
                                                <p className={styles.pickDescription}>{pick.description}</p>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                            <button className={styles.picksArrow} onClick={() => setPicksSlide(p => Math.min(communityPicks.length - 1, p + 1))} disabled={picksSlide === communityPicks.length - 1}>›</button>
                        </div>
                        {communityPicks.length > 1 && (
                            <div className={styles.picksDots}>
                                {communityPicks.map((_, i) => (
                                    <button key={i} className={`${styles.picksDot} ${i === picksSlide ? styles.picksDotActive : ''}`} onClick={() => setPicksSlide(i)} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

        </div>
    )
}