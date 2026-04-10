import styles from "./header.module.css";
import ThemeToggler from "../../pagelayout/themeToggle";
import darkModeIcon from "../../../Assets/Pictures/LogoDarkMode.png";
import { Search, Home, Check, MoreHorizontal } from "lucide-react";
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
  
  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  useEffect(() => {
    const fetchNotifications = async () => {
      const token = localStorage.getItem("accessToken");
      try {
        const response = await fetch("http://localhost:8000/api/notifications", {
          headers: { 
            "Authorization": `Bearer ${token}`, 
            "Content-Type": "application/json" 
          }
        });
        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) fetchNotifications();
  }, [user]);


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

      const response = await fetch(`http://localhost:8000/api/notifications/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_read: true }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, is_read: true } : n)
        );
        setOpenMenuId(null);
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };
  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("accessToken"); // Or however you store your JWT
      const response = await fetch(`http://localhost:8000/api/notifications/${id}/`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`, // <--- Add this
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
    console.log("Navigating to settings for notification:", id);
    navigate("/settings/notifications");
    setOpenMenuId(null);
  };


  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
        setOpenMenuId(null); // <--- Add this line
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const avatarSrc = user?.avatar
    ? user.avatar.startsWith("http")
      ? user.avatar
      : `http://localhost:8000${user.avatar}`
    : "/default-avatar.png";

  const navigate = useNavigate();
  const location = useLocation();

  const handleAvatarClick = () => {
    if (location.pathname === "/profile") {
      navigate("/home");
    } else {
      navigate(`/profile/${user.id}`);
    }
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {

        const response = await fetch("http://localhost:8000/api/notifications", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",

          }
        });

        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
        } else {
          console.error("Failed to fetch notifications");
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setIsLoading(false);
      }
    };


    if (user) {
      fetchNotifications();
    }
  }, [user]);



  const unreadCount = notifications.filter(n => !n.is_read).length;
  const displayCount = notifications.length;
  return (
    <div className={styles.headerInner}>
      <div className={styles.headerLeft}>
        <img src={darkModeIcon} alt="Dark Mode Icon" className={styles.darkModeIcon} />
        <button className={styles.title} type="button">
          CAMPUS
        </button>
      </div>

      <div className={styles.headerCenter}>
        <div className={styles.searchWrap}>
          <Search className={styles.searchIcon} size={24} />
          <input
            className={styles.searchInput}
            type="text"
            placeholder="What are you looking for?"
          />
        </div>
      </div>

      <div className={styles.headerRight}>
        <ThemeToggler theme={theme} toggleTheme={toggleTheme} />

        <div className={styles.chatWrapper} ref={chatRef}>
          {/* Active class added, red dot added */}
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
                  <span onClick={() => navigate("/chats")} className={styles.viewAll}>
                    view all
                  </span>
                </div>
              </div>

              {/* Fixed Search Bar */}
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
                    <div key={chat.id} className={styles.chatItem}>
                      <div className={styles.chatAvatarWrap}>
                        <img src={chat.avatar} alt="" className={styles.chatAvatar} />
                        <span className={`${styles.statusDot} ${styles[chat.dotStyle === 'online' ? 'dotOnline' : chat.dotStyle === 'dnd' ? 'dotDnd' : 'dotOffline']}`} />
                      </div>

                      <div className={styles.chatGrid}>
                        <span className={styles.chatStatus}>{chat.status}</span>
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

        <div className={styles.notificationWrapper} ref={notifRef}>
          <button
            className={styles.bellButton}
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <div className={styles.bellIconContainer}>

              <img
                src={unreadCount > 0 ? BellActive : Bell}
                width={27}
                height={29}
                alt="Notifications"
                style={{ filter: "invert(1)" }}
              />

              {unreadCount > 0 && <span className={styles.redDotIndicator} />}
            </div>


            {displayCount > 0 && (
              <span className={styles.rightBadge}>{displayCount}</span>
            )}
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
                    <div key={n.id} className={`${styles.notificationItem} ${!n.is_read ? styles.unread : ""}`}>
                      {!n.is_read && <span className={styles.unreadDot} />}

                      <div className={styles.notifAvatarWrap}>

                        <img src={n.avatar || "/default-avatar.png"} alt="" className={styles.notifAvatar} />
                        <div className={styles.notifIconBadge}>{n.iconType}</div>
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
                            <button onClick={() => handleManage(n.id)}>
                              Manage
                            </button>
                            <button
                              className={styles.deleteAction}
                              onClick={() => handleDelete(n.id)}
                            >
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

        <button className={styles.iconButton} type="button" onClick={() => navigate("/profile")}>
          <img src={avatarSrc} alt="Profile" className={styles.userProfilePicture} />
        </button>
      </div>
    </div>
  );
}