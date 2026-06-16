import styles from "./header.module.css";
import ThemeToggler from "../../pagelayout/themeToggle";
import darkModeIcon from "../../../Assets/Pictures/LogoDarkMode.png";
import lightModeIcon from "../../../Assets/Pictures/LogoLightMode.png";
import {
  Search, MoreHorizontal,
  Volume2, Calendar, UserPlus, Heart,
  Users, User, BookOpen, X
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import MessageSquare from "../../../Assets/icons/messages.png";
import Bell from '../../../Assets/icons/notifications.png';
import BellActive from '../../../Assets/icons/notifications-active.png';
import Home from '../../../Assets/icons/home.png';
import Read from '../../../Assets/icons/read.png';
import ProfilePicture from '../../../Assets/icons/default-pfp.png';
import { createPortal } from 'react-dom';
import StatusDot from "../../presence/StatusDot";

import API from '../../../config';

// ── Pure helpers ──
function timeAgo(dateString) {
  if (!dateString) return "";
  let date;
  if (typeof dateString === "string" && dateString.length === 5 && dateString.includes(":")) {
    const [hours, minutes] = dateString.split(":");
    date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  } else {
    date = new Date(dateString);
  }
  if (isNaN(date.getTime())) return dateString;
  const diffInSeconds = Math.floor((Date.now() - date) / 1000);
  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} min. ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hr. ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Yesterday";
  return `${diffInDays} d. ago`;
}

function getNotificationIcon(type) {
  const t = (type || "").toLowerCase();
  if (t.includes("announcement")) return <Volume2 size={12} color="currentColor" />;
  if (t.includes("event")) return <Calendar size={12} color="currentColor" />;
  if (t.includes("friend") || t.includes("request")) return <UserPlus size={12} color="currentColor" />;
  if (t.includes("react") || t.includes("post")) return <Heart size={12} color="currentColor" />;
  return <Volume2 size={12} color="currentColor" />;
}

function resolveAvatar(url, fallback = "/default-avatar.png") {
  if (!url) return fallback;
  return url.startsWith("http") ? url : `${API}${url}`;
}

function formatNotif(item) {
  const notifLink = item.link || {};
  const linkPost = notifLink.post || null;
  const resolvedPostId =
    typeof item.link === "number"
      ? item.link
      : linkPost?.post_id || notifLink.post_id || item.post_id || null;

  return {
    id: item.notification_id || item.id,
    is_read: item.is_read,
    avatar: resolveAvatar(item.actor_avatar || item.avatar),
    type: item.type || item.iconType || "Notification",
    text: item.message || item.content,
    link: notifLink,
    post_id: resolvedPostId,
    post: linkPost,
    comment_id: typeof item.link === "object" ? notifLink.comment_id || item.comment_id || null : null,
    actor_id: item.actor_id || null,
    event_id: item.event_id || null,
    time: timeAgo(item.time) || item.time,
  };
}

function formatChat(chat) {
  return {
    id: chat.id,
    name: chat.name || chat.user_name || "Unknown User",
    avatar: resolveAvatar(chat.avatar, ProfilePicture),
    message:
      typeof chat.preview === "string" ? chat.preview
        : typeof chat.last_message === "string" ? chat.last_message
          : chat.last_message?.content || chat.last_message?.text || "No messages yet",
    status: chat.is_online ? "online" : "offline",
    dotStyle: chat.is_online ? "online" : "offline",
    isGroup: chat.is_group || false,
    unread: chat.unread_count || 0,
    time: timeAgo(chat.last_message_time),
  };
}

// ── Component ──
export default function Header({ theme, toggleTheme, user, onOpenPost }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showChats, setShowChats] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [chats, setChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchBoxRect, setSearchBoxRect] = useState(null);

  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuRect, setMenuRect] = useState(null);
  const [joinGate, setJoinGate] = useState(null);
  const [requestGate, setRequestGate] = useState(null);
  const [joinLoading, setJoinLoading] = useState(false);

  const notifRef = useRef(null);
  const chatRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchDropdownRef = useRef(null);
  const notifMenuBtnRef = useRef(null);
  const searchTimer = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  // ── Derived values ──
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );
  const unreadChatsCount = useMemo(
    () => chats.reduce((sum, c) => sum + c.unread, 0),
    [chats]
  );
  const filteredChats = useMemo(
    () => chats.filter((c) => c.name.toLowerCase().includes(chatSearchQuery.toLowerCase())),
    [chats, chatSearchQuery]
  );
  const totalResults = useMemo(
    () =>
      searchResults
        ? (searchResults.people?.length || 0) +
        (searchResults.communities?.length || 0) +
        (searchResults.pages?.length || 0)
        : 0,
    [searchResults]
  );

  const rawAvatar = user?.profile?.avatar || user?.avatar || user?.profile_image;
  const avatarSrc = useMemo(() => resolveAvatar(rawAvatar, ProfilePicture), [rawAvatar]);

  const isInProfileSection = useMemo(() => {
    const loggedInType = localStorage.getItem("user_type");
    const isPageUser = loggedInType === "page" || loggedInType === "university";
    const id = isPageUser ? user?.page_id : user?.id;
    return (
      location.pathname.startsWith(`/profile/${id}`) ||
      location.pathname.startsWith(`/page/${id}`)
    );
  }, [location.pathname, user]);

  // ── Data fetch (parallel) ──
  useEffect(() => {
    if (!user) return;

    const fetchHeaderData = async () => {
      try {
        const token = localStorage.getItem("access");
        const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

        const [notifRes, chatRes] = await Promise.all([
          fetch(`${API}/api/notifications`, { headers }),
          fetch(`${API}/api/chats/`, { headers }),
        ]);

        if (notifRes.ok) {
          const notifData = await notifRes.json();
          setNotifications(notifData.map(formatNotif));
        }

        if (chatRes.ok) {
          const chatData = await chatRes.json();

          // O(n) dedup by id, keep most recent
          const map = new Map();
          for (const chat of chatData) {
            const existing = map.get(chat.id);
            if (
              !existing ||
              (chat.last_message_time &&
                (!existing.last_message_time ||
                  new Date(chat.last_message_time) > new Date(existing.last_message_time)))
            ) {
              map.set(chat.id, chat);
            }
          }

          const mapped = [...map.values()].map(formatChat);
          setChats(mapped);


          mapped.forEach((c) => {
            if (c.avatar && c.avatar !== ProfilePicture) {
              const img = new Image();
              img.src = c.avatar;
            }
          });
        }
      } catch (err) {
        console.error("Error fetching header data:", err);
      }
    };

    fetchHeaderData();
  }, [user]);

  // ── Notif menu scroll/resize tracking ──
  useEffect(() => {
    if (!openMenuId) return;
    const update = () => {
      if (notifMenuBtnRef.current)
        setMenuRect(notifMenuBtnRef.current.getBoundingClientRect());
    };
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [openMenuId]);

  // ── Search box rect on scroll ──
  useEffect(() => {
    if (!showSearchDropdown) return;
    const update = () => {
      if (searchInputRef.current)
        setSearchBoxRect(searchInputRef.current.getBoundingClientRect());
    };
    window.addEventListener("scroll", update, true);
    return () => window.removeEventListener("scroll", update, true);
  }, [showSearchDropdown]);

  // ── Click outside ──
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
        setOpenMenuId(null);
        setMenuRect(null);
      }
      if (chatRef.current && !chatRef.current.contains(e.target)) {
        setShowChats(false);
        setChatSearchQuery("");
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        const portal = document.getElementById("search-results-portal");
        if (!portal || !portal.contains(e.target)) setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Search ──
  const fetchSearch = useCallback(async (query) => {
    setSearchLoading(true);
    try {
      const token = localStorage.getItem("access");
      const res = await fetch(
        `${API}/api/search/?q=${encodeURIComponent(query)}&dropdown=true`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) setSearchResults(await res.json());
    } catch (e) {
      console.error("Search failed", e);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleSearchChange = useCallback((e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setSearchBoxRect(searchInputRef.current?.getBoundingClientRect());
    if (!val.trim()) {
      setSearchResults(null);
      setShowSearchDropdown(false);
      return;
    }
    setShowSearchDropdown(true);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchSearch(val.trim()), 350);
  }, [fetchSearch]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults(null);
    setShowSearchDropdown(false);
  }, []);

  const handleResultClick = useCallback((type, item) => {
    setShowSearchDropdown(false);
    setSearchQuery("");
    setSearchResults(null);
    switch (type) {
      case "person": navigate(`/profile/${item.id}`); break;
      case "page": navigate(`/page/${item.page_id || item.id}`); break;
      case "community":
        if (item.is_joined) navigate(`/communities/${item.id}`);
        else if (item.request_sent) break;
        else if (item.is_private) setRequestGate(item);
        else setJoinGate(item);
        break;
      case "all": navigate(`/search?q=${encodeURIComponent(searchQuery)}`); break;
      default: break;
    }
  }, [navigate, searchQuery]);

  // ── Notification actions ──
  const handleNotificationClick = useCallback((n) => {
    setShowNotifications(false);
    const type = (n.type || "").toLowerCase();

    if (type.includes("friend") || type.includes("request")) {
      const profileId = typeof n.link === "number" ? n.link : n.link?.id || n.actor_id;
      if (profileId) navigate(`/profile/${profileId}`);
      return;
    }

    const post_id = n.post_id || (typeof n.link === "number" ? n.link : n.link?.post_id);
    const comment_id = n.comment_id || null;
    const post = n.post || n.link?.post || null;

    if (post_id) {
      if (onOpenPost) onOpenPost(post_id, comment_id, post);
      else navigate("/home", { state: { openPost: { post, postId: post_id, commentId: comment_id } } });
      return;
    }
    if (n.event_id) { navigate(`/events/${n.event_id}`); return; }
    if (n.link?.id) navigate(`/profile/${n.link.id}`);
    else if (n.actor_id) navigate(`/profile/${n.actor_id}`);
  }, [navigate, onOpenPost]);

  const handleMarkAllAsRead = useCallback(async () => {
    const token = localStorage.getItem("access");
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (!unreadIds.length) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await Promise.all(
        unreadIds.map((id) =>
          fetch(`${API}/api/notifications/${id}/`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ is_read: true }),
          })
        )
      );
    } catch {
      setNotifications((prev) =>
        prev.map((n) => (unreadIds.includes(n.id) ? { ...n, is_read: false } : n))
      );
    }
  }, [notifications]);

  const handleMarkAllChatsAsRead = useCallback(async () => {
    const token = localStorage.getItem("access");
    const unreadIds = chats.filter((c) => c.unread > 0).map((c) => c.id);
    if (!unreadIds.length) return;
    const snapshot = chats;
    setChats((prev) => prev.map((c) => ({ ...c, unread: 0 })));
    try {
      await Promise.all(
        unreadIds.map((id) =>
          fetch(`${API}/api/chats/${id}/read/`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          })
        )
      );
    } catch {
      setChats(snapshot);
    }
  }, [chats]);

  const handleMarkAsRead = useCallback(async (id, currentlyRead) => {
    try {
      const token = localStorage.getItem("access");
      const res = await fetch(`${API}/api/notifications/${id}/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ is_read: !currentlyRead }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: !currentlyRead } : n))
        );
        setOpenMenuId(null);
        setMenuRect(null);
      }
    } catch (e) { console.error(e); }
  }, []);

  const handleDelete = useCallback(async (id) => {
    try {
      const token = localStorage.getItem("access");
      const res = await fetch(`${API}/api/notifications/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        setOpenMenuId(null);
        setMenuRect(null);
      }
    } catch (e) { console.error(e); }
  }, []);

  const handleManage = useCallback(() => {
    navigate("/settings/notifications");
    setOpenMenuId(null);
    setMenuRect(null);
  }, [navigate]);

  const handleAvatarClick = useCallback(() => {
    const loggedInType = localStorage.getItem("user_type");
    const isPageUser = loggedInType === "page" || loggedInType === "university";
    const id = isPageUser ? user?.page_id : user?.id;
    if (!id) return;
    const profilePath = isPageUser ? `/page/${id}` : `/profile/${id}`;
    location.pathname.startsWith(profilePath) ? navigate("/home") : navigate(profilePath);
  }, [user, location.pathname, navigate]);

  // ── Community join / request ──
  const handleJoinCommunity = useCallback(async () => {
    if (!joinGate) return;
    setJoinLoading(true);
    try {
      const token = localStorage.getItem("access");
      const res = await fetch(`${API}/api/communities/${joinGate.id}/join/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (res.ok) navigate(`/communities/${joinGate.id}`);
    } catch (e) { console.error(e); }
    finally { setJoinLoading(false); setJoinGate(null); }
  }, [joinGate, navigate]);

  const handleRequestJoin = useCallback(async () => {
    if (!requestGate) return;
    setJoinLoading(true);
    try {
      const token = localStorage.getItem("access");
      const res = await fetch(`${API}/api/communities/${requestGate.id}/request/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (res.ok) setRequestGate(null);
    } catch (e) { console.error(e); }
    finally { setJoinLoading(false); }
  }, [requestGate]);

  // ── Render ──
  return (
    <div className={styles.headerInner}>

      {/* ── LEFT ── */}
      <div className={styles.headerLeft}>
        <img
          src={theme === "light" ? lightModeIcon : darkModeIcon}
          alt="Logo"
          className={styles.darkModeIcon}
        />
        <button className={styles.title} type="button">CAMPUS</button>
      </div>

      {/* ── SEARCH ── */}
      <div className={styles.headerCenter} ref={searchRef}>
        <div className={styles.searchWrap}>
          <Search className={styles.searchIcon} size={24} />
          <input
            ref={searchInputRef}
            className={styles.searchInput}
            type="text"
            placeholder="What are you looking for?"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => {
              if (searchQuery.trim()) {
                setShowSearchDropdown(true);
                setSearchBoxRect(searchInputRef.current?.getBoundingClientRect());
              }
            }}
          />
          {searchQuery && (
            <button onClick={clearSearch} className={styles.clearSearchBtn}>
              <X size={16} />
            </button>
          )}

          {showSearchDropdown && searchQuery.trim() && searchBoxRect &&
            createPortal(
              <div
                ref={searchDropdownRef}
                id="search-results-portal"
                className={styles.searchPortal}
                style={{
                  top: searchBoxRect.bottom + 8,
                  left: searchBoxRect.left + searchBoxRect.width / 2,
                }}
              >
                {/* See all */}
                <div className={styles.seeAllRow} onMouseDown={() => handleResultClick("all")}>
                  <div className={styles.seeAllIcon}>
                    <Search size={16} color="white" />
                  </div>
                  <div>
                    <div className={styles.seeAllTitle}>
                      See all results for "<span className={styles.seeAllHighlight}>{searchQuery}</span>"
                    </div>
                    {!searchLoading && searchResults && (
                      <div className={styles.seeAllCount}>
                        {totalResults} result{totalResults !== 1 ? "s" : ""} found
                      </div>
                    )}
                  </div>
                </div>

                {searchLoading ? (
                  <div className={styles.searchStatusMsg}>Searching…</div>
                ) : searchResults ? (
                  <>
                    {/* People */}
                    {searchResults.people?.length > 0 && (
                      <div>
                        <div className={styles.sectionLabel}>People</div>
                        {searchResults.people.slice(0, 3).map((person) => {
                          const av = person.profile?.profile_image || person.profile?.avatar ||
                            person.avatar_url || person.avatar || person.profile_picture || person.profile_photo;

                          return (
                            <div
                              key={person.id}
                              onMouseDown={() => handleResultClick("person", person)}
                              className={styles.resultRow}
                            >
                              <div className={styles.resultAvatarWrap}>
                                <img src={resolveAvatar(av, ProfilePicture)} alt="" className={styles.resultAvatar} />

                                <div className={styles.resultTypeBadge}>
                                  <User size={8} color="currentColor" />
                                </div>
                              </div>
                              <div className={styles.resultInfo}>
                                <div className={styles.resultName}>{person.full_name || person.username}</div>
                                <div className={styles.resultSub}>
                                  @{person.username}{person.university ? ` · ${person.university}` : ""}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Communities */}
                    {searchResults.communities?.length > 0 && (
                      <div>
                        <div className={styles.sectionLabel}>Communities</div>
                        {searchResults.communities.slice(0, 3).map((community) => {
                          const isMember = community.is_joined;
                          const statusClass =
                            isMember ? styles.statusJoined
                              : community.request_sent ? styles.statusRequested
                                : styles.statusNotJoined;
                          const statusLabel =
                            isMember ? "✓ Joined"
                              : community.request_sent ? "⏳ Requested"
                                : community.is_private ? "🔒 Private"
                                  : "Not joined";

                          return (
                            <div
                              key={community.id}
                              onMouseDown={() => handleResultClick("community", community)}
                              className={styles.resultRow}
                              style={{ opacity: isMember ? 1 : 0.75 }}
                            >
                              <div className={styles.resultAvatarWrap}>
                                {community.avatar ? (
                                  <img
                                    src={resolveAvatar(community.avatar)}
                                    alt=""
                                    className={styles.resultAvatarSquare}
                                  />
                                ) : (
                                  <div className={styles.communityPlaceholder}>
                                    <Users size={18} color="#c084fc" />
                                  </div>
                                )}
                                {!isMember && community.is_private && (
                                  <div className={styles.privateLockBadge}>🔒</div>
                                )}
                              </div>
                              <div className={styles.resultInfoFlex}>
                                <div className={styles.resultName}>{community.name}</div>
                                <div className={styles.resultSub}>
                                  <span className={`${styles.statusTag} ${statusClass}`}>
                                    {statusLabel}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Pages */}
                    {searchResults.pages?.length > 0 && (
                      <div>
                        <div className={styles.sectionLabel}>Pages</div>
                        {searchResults.pages.slice(0, 3).map((page) => (
                          <div
                            key={page.id}
                            onMouseDown={() => handleResultClick("page", page)}
                            className={styles.resultRow}
                          >
                            <div className={styles.resultAvatarWrap}>
                              {page.profile_image ? (
                                <img
                                  src={resolveAvatar(page.profile_image)}
                                  alt={page.page_full_name || "Page"}
                                  className={styles.resultAvatarSquare}
                                />
                              ) : (
                                <div className={styles.pagePlaceholder}>
                                  <BookOpen size={18} color="rgba(255,255,255,0.5)" />
                                </div>
                              )}
                            </div>
                            <div className={styles.resultInfo}>
                              <div className={styles.resultName}>
                                {page.page_full_name || page.page_name || page.name}
                              </div>
                              <div className={styles.resultSub}>{page.page_type || "Page"}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {totalResults === 0 && (
                      <div className={styles.searchStatusMsg}>
                        No results found for "
                        <span className={styles.dimHighlight}>{searchQuery}</span>"
                      </div>
                    )}
                  </>
                ) : null}
              </div>,
              document.body
            )
          }
        </div>
      </div>

      {/* ── RIGHT ── */}
      <div className={styles.headerRight}>
        <ThemeToggler theme={theme} toggleTheme={toggleTheme} />

        {/* CHATS */}
        <div className={styles.chatWrapper} ref={chatRef}>
          <button
            className={`${styles.iconButton} ${showChats ? styles.activeIconBtn : ""}`}
            type="button"
            onClick={() => setShowChats((prev) => { if (prev) setChatSearchQuery(""); return !prev; })}
          >
            <img src={MessageSquare} width={27} height={27} alt="Messages" style={{ filter: "invert(1)" }} />
            {unreadChatsCount > 0 && (
              <span className={styles.redDotIndicator} style={{ top: "2px", right: "4px" }} />
            )}
          </button>

          {showChats && (
            <div className={styles.chatDropdown}>
              <div className={styles.notifHeader}>
                <h3 className={styles.notifTitle}>Chats</h3>
                <div className={styles.notifHeaderActions}>
                  <img
                    src={Read}
                    alt="Read"
                    onClick={handleMarkAllChatsAsRead}
                    className={`${styles.readIcon} ${unreadChatsCount > 0 ? styles.readIconActive : styles.readIconDisabled}`}
                    title="Mark all chats as read"
                  />
                  <span
                    onClick={() => { navigate("/chats"); setShowChats(false); }}
                    className={styles.viewAll}
                  >
                    view all
                  </span>
                </div>
              </div>

              <div className={styles.chatSearchContainer}>
                <Search size={18} className={styles.chatSearchIcon} />
                <input
                  className={styles.chatSearchInput}
                  placeholder="Searching for someone?"
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                />
              </div>

              <div className={styles.chatListWrapper}>
                {filteredChats.length > 0 ? (
                  filteredChats.map((chat) => (
                    <div
                      key={chat.id}
                      className={styles.chatItem}
                      onClick={() => { setShowChats(false); navigate(`/chats/${chat.id}`); }}
                    >
                      <div className={styles.chatAvatarWrap} style={{ position: 'relative', flexShrink: 0 }}>
                        <img
                          src={chat.avatar}
                          alt=""
                          className={styles.chatAvatar}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => { e.currentTarget.src = ProfilePicture; }}
                        />
                        {!chat.isGroup && (
                          <span style={{ position: 'absolute', bottom: 0, right: 0 , borderRadius: '50%' }}>
                            <StatusDot userId={chat.userId} size="sm" />
                          </span>
                        )}
                      </div>
                      <div className={styles.chatGrid}>
                        {!chat.isGroup && <span className={styles.chatStatus}>{chat.status}</span>}
                        <span className={styles.chatPreview}>{chat.message}</span>
                        <span className={styles.chatName}>{chat.name}</span>
                        <div className={styles.chatTimeContainer}>
                          {chat.unread > 0 && (
                            <span className={styles.chatUnread}>{chat.unread}</span>
                          )}
                          <span className={styles.chatTime}>{chat.time}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyNotice}>No users found</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* NOTIFICATIONS */}
        <div className={styles.notificationWrapper} ref={notifRef}>
          <button
            className={styles.bellButton}
            type="button"
            onClick={() => setShowNotifications((p) => !p)}
          >
            <div className={styles.bellIconContainer}>
              <img
                src={unreadCount > 0 ? BellActive : Bell}
                width={24}
                height={29}
                alt="Notifications"
                style={{ filter: "invert(1)" }}
              />
              {unreadCount > 0 && <span className={styles.redDotIndicator} />}
            </div>
            {notifications.length > 0 && (
              <span className={styles.rightBadge}>{notifications.length}</span>
            )}
          </button>

          {showNotifications && (
            <div className={styles.notificationDropdown}>
              <div className={styles.notifHeader}>
                <h3 className={styles.notifTitle}>Notifications</h3>
                <div className={styles.notifHeaderActions}>
                  <img
                    src={Read}
                    alt="Read"
                    onClick={handleMarkAllAsRead}
                    className={`${styles.readIcon} ${styles.readIconNotif} ${unreadCount > 0 ? styles.readIconActive : styles.readIconDisabled
                      }`}
                    title="Mark all notifications as read"
                  />
                  <span
                    onClick={() => { navigate('/notifications'); setShowNotifications(false); }}
                    className={styles.viewAll}
                  >
                    view all
                  </span>
                </div>
              </div>

              <div className={styles.notifList}>
                {notifications.length === 0 ? (
                  <div className={styles.emptyNotice}>No new notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`${styles.notificationItem} ${!n.is_read ? styles.unread : ""}`}
                    >
                      {!n.is_read && <span className={styles.unreadDot} />}
                      <div className={styles.notifAvatarWrap}>
                        <img
                          src={n.avatar}
                          alt=""
                          className={styles.notifAvatar}
                          onError={(e) => { e.currentTarget.src = ProfilePicture; }}
                        />
                        <div className={styles.notifIconBadge}>{getNotificationIcon(n.type)}</div>
                      </div>
                      <div className={styles.notifContent}>
                        <div className={styles.notifTopRow}>
                          <span className={styles.notifType}>{n.type}</span>
                          <span className={styles.notifTime}>{n.time}</span>
                        </div>
                        <p className={styles.notifText}>{n.text}</p>
                      </div>
                      <div
                        className={styles.notifMenuWrapper}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <button
                          className={styles.notifMenuBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (openMenuId === n.id) {
                              setOpenMenuId(null);
                              setMenuRect(null);
                              notifMenuBtnRef.current = null;
                            } else {
                              notifMenuBtnRef.current = e.currentTarget;
                              setOpenMenuId(n.id);
                              setMenuRect(e.currentTarget.getBoundingClientRect());
                            }
                          }}
                        >
                          <MoreHorizontal size={18} />
                        </button>

                        {openMenuId === n.id && menuRect &&
                          createPortal(
                            <div
                              className={styles.actionMenu}
                              style={{ top: menuRect.bottom + 6, left: menuRect.left + menuRect.width / 2 }}
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              <button onClick={(e) => { e.stopPropagation(); handleMarkAsRead(n.id, n.is_read); }}>
                                <img
                                  src={Read}
                                  alt=""
                                  className={styles.readIcon}
                                  style={{ marginLeft: 3 }}
                                />
                                {n.is_read ? "Mark as unread" : "Mark as read"}
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); handleManage(); }}>
                                Manage
                              </button>
                              <button
                                className={styles.deleteAction}
                                onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
                              >
                                Delete
                              </button>
                            </div>,
                            document.body
                          )
                        }
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* AVATAR */}
        <button className={styles.iconButton} type="button" onClick={handleAvatarClick}>
          {isInProfileSection ? (
            <img src={Home} alt="home" className={styles.homeIcon} />
          ) : (
            <img
              src={avatarSrc}
              alt="Profile"
              className={styles.userProfilePicture}
              onError={(e) => { e.currentTarget.src = ProfilePicture; }}
            />
          )}
        </button>
      </div>

      {/* ── JOIN GATE ── */}
      {joinGate && (
        <div className={styles.gateBackdrop}>
          <div className={styles.gateOverlay} onClick={() => setJoinGate(null)} />
          <div className={styles.gateCard}>
            <button onClick={() => setJoinGate(null)} className={styles.gateCloseBtn}>
              <X size={15} />
            </button>
            <div className={styles.gateHeader}>
              {joinGate.avatar ? (
                <img src={resolveAvatar(joinGate.avatar)} alt="" className={styles.gateAvatar} />
              ) : (
                <div className={styles.gateAvatarPlaceholder}>
                  <Users size={26} color="#c084fc" />
                </div>
              )}
              <div>
                <div className={styles.gateName}>{joinGate.name}</div>
                <div className={styles.gateSub}>
                  {joinGate.members_count ? `${joinGate.members_count} members` : "Community"}
                </div>
              </div>
            </div>
            <div className={`${styles.gateBody} ${styles.gateBodyJoin}`}>
              <span className={styles.gateBodyIcon}>🔒</span>
              <p className={styles.gateBodyText}>
                You have to join <strong>{joinGate.name}</strong> to see what's inside. Would you like to join?
              </p>
            </div>
            <div className={styles.gateActions}>
              <button onClick={() => setJoinGate(null)} className={styles.gateCancelBtn}>
                Not now
              </button>
              <button
                onClick={handleJoinCommunity}
                disabled={joinLoading}
                className={`${styles.gateConfirmBtn} ${styles.gateConfirmJoin}`}
              >
                {joinLoading ? "Joining…" : "Join Community"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REQUEST GATE ── */}
      {requestGate && (
        <div className={styles.gateBackdrop}>
          <div className={styles.gateOverlay} onClick={() => setRequestGate(null)} />
          <div className={styles.gateCard}>
            <button onClick={() => setRequestGate(null)} className={styles.gateCloseBtn}>
              <X size={15} />
            </button>
            <div className={styles.gateHeader}>
              {requestGate.avatar ? (
                <img src={resolveAvatar(requestGate.avatar)} alt="" className={styles.gateAvatar} />
              ) : (
                <div className={styles.gateAvatarPlaceholder}>
                  <Users size={26} color="#c084fc" />
                </div>
              )}
              <div>
                <div className={styles.gateName}>{requestGate.name}</div>
                <div className={styles.gateSub}>🔒 Private Community</div>
              </div>
            </div>
            <div className={`${styles.gateBody} ${styles.gateBodyRequest}`}>
              <span className={styles.gateBodyIcon}>🔒</span>
              <p className={styles.gateBodyText}>
                <strong>{requestGate.name}</strong> is a private community. You need to request access to join.
              </p>
            </div>
            <div className={styles.gateActions}>
              <button onClick={() => setRequestGate(null)} className={styles.gateCancelBtn}>
                Cancel
              </button>
              <button
                onClick={handleRequestJoin}
                disabled={joinLoading}
                className={`${styles.gateConfirmBtn} ${styles.gateConfirmRequest}`}
              >
                {joinLoading ? "Requesting…" : "Request to Join"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}