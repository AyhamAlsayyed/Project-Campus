import styles from "./header.module.css";
import ThemeToggler from "../../pagelayout/themeToggle";
import darkModeIcon from "../../../Assets/Pictures/LogoDarkMode.png";
import {
  Search, Home, Check, MoreHorizontal,
  Volume2, Calendar, UserPlus, Heart
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import MessageSquare from "../../../Assets/icons/messages.png";
import Bell from '../../../Assets/icons/notifications.png';
import BellActive from '../../../Assets/icons/notifications-active.png';

export default function Header({ theme, toggleTheme, user }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const notifRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showChats, setShowChats] = useState(false);
  const chatRef = useRef(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [chats, setChats] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();

  const timeAgo = (dateString) => {
    if (!dateString) return "";
    let date;
    if (typeof dateString === 'string' && dateString.length === 5 && dateString.includes(':')) {
      const [hours, minutes] = dateString.split(':');
      date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    } else {
      date = new Date(dateString);
    }
    if (isNaN(date.getTime())) return dateString;
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 0) return "Just now";
    if (diffInSeconds < 60) return "Just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} min. ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hr. ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "Yesterday";
    return `${diffInDays} d. ago`;
  };

  const getNotificationIcon = (type) => {
    const t = (type || "").toLowerCase();
    if (t.includes("announcement")) return <Volume2 size={12} color="currentColor" />;
    if (t.includes("event")) return <Calendar size={12} color="currentColor" />;
    if (t.includes("friend") || t.includes("request")) return <UserPlus size={12} color="currentColor" />;
    if (t.includes("react") || t.includes("post")) return <Heart size={12} color="currentColor" />;
    return <Volume2 size={12} color="currentColor" />;
  };

  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const fetchHeaderData = async () => {
      try {
        const token = localStorage.getItem("access");
        const headers = {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        };


        const notifRes = await fetch("http://localhost:8000/api/notifications", { headers });
        if (notifRes.ok) {
          const notifData = await notifRes.json();

          const formattedNotifs = notifData.map(item => {
            const notifLink = item.link || {};
            return {
              id: item.notification_id || item.id,
              is_read: item.is_read,
              avatar: (item.actor_avatar || item.avatar)?.startsWith("http")
                ? (item.actor_avatar || item.avatar)
                : `http://localhost:8000${item.actor_avatar || item.avatar}` || "/default-avatar.png",
              type: item.type || "Notification",
              text: item.message || item.content,
              link: notifLink,
              post_id: item.post_id || notifLink.post_id || null,
              comment_id: item.comment_id || notifLink.comment_id || null,
              actor_id: item.actor_id,
              event_id: item.event_id,
              time: timeAgo(item.time) || item.time,
            };
          });
          setNotifications(formattedNotifs);
        }

        const chatRes = await fetch("http://localhost:8000/api/chats/", { headers });
        if (chatRes.ok) {
          const chatData = await chatRes.json();
          const formattedChats = chatData.map(chat => ({
            id: chat.id,
            name: chat.name || chat.user_name || "Unknown User",
            avatar: chat.avatar?.startsWith("http")
              ? chat.avatar
              : `http://localhost:8000${chat.avatar}` || "/default-avatar.png",
            message: chat.preview || chat.last_message || "No messages yet",
            status: chat.is_online ? "online" : "offline",
            dotStyle: chat.is_online ? "online" : "offline",
            isGroup: chat.is_group || false,
            unread: chat.unread_count || 0,
            time: timeAgo(chat.last_message_time)
          }));
          setChats(formattedChats);
        }
      } catch (error) {
        console.error("Error fetching header data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) fetchHeaderData();
  }, [user]);


  const handleNotificationClick = (n) => {
    console.log("Notification clicked:", n);

    const post_id = n.post_id || n.link?.post_id;
    const comment_id = n.comment_id || n.link?.comment_id;

    if (comment_id && post_id) {
      navigate(`/home?openPost=${post_id}&highlightComment=${comment_id}`);
      setShowNotifications(false);
      return;
    }

    if (n.event_id) {
      navigate(`/events/${n.event_id}`);
    } else if (post_id) {
      navigate(`/posts/${post_id}`);
    } else if (n.actor_id) {
      navigate(`/profile/${n.actor_id}`);
    }
    setShowNotifications(false);
  };
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
        setOpenMenuId(null);
      }
      if (chatRef.current && !chatRef.current.contains(event.target)) {
        setShowChats(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadChatsCount = chats.reduce((sum, chat) => sum + chat.unread, 0);

  const handleMarkAsRead = async (id) => {
    try {
      const token = localStorage.getItem("access");
      const response = await fetch(`http://localhost:8000/api/notifications/${id}/`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_read: true }),
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setOpenMenuId(null);
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("access");
      const response = await fetch(`http://localhost:8000/api/notifications/${id}/`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        setOpenMenuId(null);
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleManage = (id) => {
    navigate("/settings/notifications");
    setOpenMenuId(null);
  };

  const avatarSrc = user?.avatar
    ? user.avatar.startsWith("http")
      ? user.avatar
      : `http://localhost:8000${user.avatar}`
    : "/default-avatar.png";

  const handleAvatarClick = () => {
    if (!user?.id) { console.warn("User not loaded yet"); return; }
    if (location.pathname.startsWith(`/profile/${user.id}`)) {
      navigate("/home");
    } else {
      navigate(`/profile/${user.id}`);
    }
  };

  const isInProfileSection = location.pathname.startsWith(`/profile/${user?.id}`);
  const unreadCount = notifications.filter(n => !n.is_read).length;
  const displayCount = notifications.length;

  return (
    <div className={styles.headerInner}>
      <div className={styles.headerLeft}>
        <img src={darkModeIcon} alt="Dark Mode Icon" className={styles.darkModeIcon} />
        <button className={styles.title} type="button">CAMPUS</button>
      </div>

      <div className={styles.headerCenter}>
        <div className={styles.searchWrap}>
          <Search className={styles.searchIcon} size={24} />
          <input className={styles.searchInput} type="text" placeholder="What are you looking for?" />
        </div>
      </div>

      <div className={styles.headerRight}>
        <ThemeToggler theme={theme} toggleTheme={toggleTheme} />

        {/* ── CHATS ── */}
        <div className={styles.chatWrapper} ref={chatRef}>
          <button
            className={`${styles.iconButton} ${showChats ? styles.activeIconBtn : ""}`}
            type="button"
            onClick={() => setShowChats((prev) => !prev)}
          >
            <img src={MessageSquare} width={27} height={27} alt="Messages" style={{ filter: "invert(1)" }} />
            {unreadChatsCount > 0 && <span className={styles.redDotIndicator} style={{ top: '2px', right: '4px' }} />}
          </button>

          {showChats && (
            <div className={styles.chatDropdown}>
              <div className={styles.notifHeader}>
                <h3 className={styles.notifTitle}>Chats</h3>
                <div className={styles.notifHeaderActions}>
                  <Check size={18} />
                  <span onClick={() => { navigate("/chats"); setShowChats(false); }} className={styles.viewAll}>
                    view all
                  </span>
                </div>
              </div>

              <div className={styles.chatSearchContainer}>
                <Search size={18} className={styles.chatSearchIcon} />
                <input
                  className={styles.chatSearchInput}
                  placeholder="Searching for someone?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className={styles.chatListWrapper}>
                {filteredChats.length > 0 ? (
                  filteredChats.map((chat) => (
                    <div
                      key={chat.id}
                      className={styles.chatItem}
                      // ── clicking a chat navigates to that chat ──
                      onClick={() => {
                        setShowChats(false);
                        navigate(`/chats/${chat.id}`);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className={styles.chatAvatarWrap}>
                        <img src={chat.avatar} alt="" className={styles.chatAvatar} />
                        {!chat.isGroup && (
                          <span className={`${styles.statusDot} ${styles[
                            chat.dotStyle === 'online' ? 'dotOnline' :
                              chat.dotStyle === 'dnd' ? 'dotDnd' : 'dotOffline'
                          ]}`} />
                        )}
                      </div>
                      <div className={styles.chatGrid}>
                        {!chat.isGroup && <span className={styles.chatStatus}>{chat.status}</span>}
                        <span className={styles.chatPreview}>{chat.message}</span>
                        <span className={styles.chatName}>{chat.name}</span>
                        <div className={styles.chatTimeContainer}>
                          {chat.unread > 0 && <span className={styles.chatUnread}>{chat.unread}</span>}
                          <span className={styles.chatTime}>{chat.time}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyState} style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                    No users found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── NOTIFICATIONS ── */}
        <div className={styles.notificationWrapper} ref={notifRef}>
          <button
            className={styles.bellButton}
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <div className={styles.bellIconContainer}>
              <img
                src={unreadCount > 0 ? BellActive : Bell}
                width={27} height={29} alt="Notifications"
                style={{ filter: "invert(1)" }}
              />
              {unreadCount > 0 && <span className={styles.redDotIndicator} />}
            </div>
            {displayCount > 0 && <span className={styles.rightBadge}>{displayCount}</span>}
          </button>

          {showNotifications && (
            <div className={styles.notificationDropdown}>
              <div className={styles.notifHeader}>
                <h3 className={styles.notifTitle}>Notifications</h3>
                <div className={styles.notifHeaderActions}>
                  <Check size={18} />
                  <span className={styles.viewAll}>view all</span>
                </div>
              </div>

              <div className={styles.notifList}>
                {notifications.length === 0 ? (
                  <div className={styles.emptyState}>No new notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      // ── uses link field from backend ──
                      onClick={() => handleNotificationClick(n)}
                      className={`${styles.notificationItem} ${!n.is_read ? styles.unread : ""}`}
                    >
                      {!n.is_read && <span className={styles.unreadDot} />}
                      <div className={styles.notifAvatarWrap}>
                        <img src={n.avatar || "/default-avatar.png"} alt="" className={styles.notifAvatar} />
                        <div className={styles.notifIconBadge}>{getNotificationIcon(n.type)}</div>
                      </div>
                      <div className={styles.notifContent}>
                        <div className={styles.notifTopRow}>
                          <span className={styles.notifType}>{n.type}</span>
                          <span className={styles.notifTime}>{n.time}</span>
                        </div>
                        <p className={styles.notifText}>{n.text}</p>
                      </div>
                      <div className={styles.notifMenuWrapper}>
                        <button
                          className={styles.notifMenuBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === n.id ? null : n.id);
                          }}
                        >
                          <MoreHorizontal size={18} />
                        </button>
                        {openMenuId === n.id && (
                          <div className={styles.actionMenu}>
                            <button onClick={() => handleMarkAsRead(n.id)}>
                              <Check size={14} /> Read
                            </button>
                            <button onClick={() => handleManage(n.id)}>Manage</button>
                            <button className={styles.deleteAction} onClick={() => handleDelete(n.id)}>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── AVATAR / HOME ── */}
        <button className={styles.iconButton} type="button" onClick={handleAvatarClick}>
          {isInProfileSection ? (
            <Home size={24} />
          ) : (
            <img src={avatarSrc} alt="Profile" className={styles.userProfilePicture} />
          )}
        </button>
      </div>
    </div>
  );
}