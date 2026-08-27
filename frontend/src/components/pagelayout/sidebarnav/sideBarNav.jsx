import styles from "./sideBarNav.module.css";
import { useLocation, useNavigate } from "react-router-dom";

import Home from '../../../Assets/icons/home.png';

import University from '../../../Assets/icons/university.png';
import Events from '../../../Assets/icons/event.png';
import About from '../../../Assets/icons/about-us.png';
import Privacy from '../../../Assets/icons/privacy-policy.png';
import Help from '../../../Assets/icons/help.png';
import Profile from '../../../Assets/icons/default-pfp.png'
import Friends from '../../../Assets/icons/add-friend.png'
import Community from '../../../Assets/icons/community.png'
import Settings from '../../../Assets/icons/setting.png'
import PrivacyPolicy from '../../../Assets/icons/privacy-policy.png'
import FollowedPages from '../../../Assets/icons/followed-pages.png'
import Verified from '../../../Assets/icons/verified-mark.png'
import {
  User,
  UserPlus,
  Bell,
  Users,
  Languages,
  HelpCircle,
} from "lucide-react";

// Routes that show the profile-context sidebar
const PROFILE_PATHS = ['/profile/', '/page/', '/settings', '/subscriptions'];

export default function SidebarNav({ variant: variantProp, currentUser, onClose }) {
  const navigate = useNavigate();
  const { pathname, state: locationState } = useLocation();

  // Auto-detect variant from the current URL; prop and location state act as overrides
  const isProfileRoute =
    pathname.startsWith('/profile/') ||
    pathname.startsWith('/page/') ||
    pathname.startsWith('/settings');

  const variant = variantProp ?? locationState?.sidebarVariant ?? (isProfileRoute ? 'profile' : 'default');

  const handleNav = (path) => {
    // Carry the current variant forward so ambiguous pages (e.g. /subscriptions)
    // know which context the user navigated from
    navigate(path, { state: { sidebarVariant: variant } });
    if (onClose) onClose();
  };

  const isActive = (path) => {
    if (
      (path.startsWith('/profile/') || path.startsWith('/page/')) &&
      !path.endsWith('/friends') &&
      !path.endsWith('/pages')
    ) {
      return pathname === path;
    }
    return pathname === path || pathname.startsWith(path + "/");
  };
  const userType = localStorage.getItem("user_type");



  const userId = currentUser?.id || localStorage.getItem("user_id");
  const isPage =
    currentUser?.user_type === 'page' ||
    currentUser?.user_type === 'univeristy' || // Kept this to match your database typo
    currentUser?.role === 'cafe' ||
    userType === 'page' ||
    userType === 'university';


  const isUniversity =
    currentUser?.user_type === 'university' ||
    currentUser?.user_type === 'univeristy' ||
    userType === 'university';


  const defaultMainItems = isUniversity
    ? [
      { label: "Home page", path: "/home", icon: Home },
      { label: "Communities", path: "/communities", icon: Community },
      { label: "Universities", path: "/Universities", icon: University },
      { label: "Events", path: "/events", icon: Events },
    ]
    : isPage
      ? [
        { label: "Home page", path: "/home", icon: Home },
        { label: "Pages", path: "/pages", icon: FollowedPages },
        { label: "Communities", path: "/communities", icon: Community },
        { label: "Events", path: "/events", icon: Events },
      ]
      : [
        { label: "Home page", path: "/home", icon: Home },
        { label: "Communities", path: "/communities", icon: Community },
        { label: "Universities", path: "/Universities", icon: University },
        { label: "Events", path: "/events", icon: Events },
      ];

  const defaultFooterItems = [
    { label: "About us", path: "/about", icon: About },
    isPage
      ? { label: "Subscriptions", path: "/subscriptions", icon: Verified }
      : { label: "Privacy Policy", path: "/privacy", icon: Privacy },
    { label: "Help", path: "/help", icon: Help },
  ];
  const profileMainItems = isPage
    ? [
      {
        label: "Profile",
        path: `/page/${userId}`,
        icon: Profile
      },
      { label: "Pages", path: `/profile/${userId}/pages`, icon: FollowedPages },
      { label: "Communities", path: `/profile/${userId}/communities`, icon: Community },
      { label: "Events", path: `/profile/${userId}/pageEvents`, icon: Events },
    ]
    : [
      {
        label: "Profile",
        path: `/profile/${userId}`,
        icon: Profile
      },
      { label: "Friends", path: `/profile/${userId}/friends`, icon: Friends },
      { label: "Pages", path: `/profile/${userId}/pages`, icon: FollowedPages },
      { label: "Communities", path: `/profile/${userId}/communities`, icon: Community },
    ];
  const profileFooterItems = [
    { label: "Settings", path: "/settings", icon: Settings },
    isPage
      ? { label: "Subscriptions", path: "/subscriptions", icon: Verified }
      : { label: "Privacy Policy", path: "/privacy", icon: PrivacyPolicy },
    { label: "Help", path: "/help", icon: Help },
  ];

  const mainItems = variant === "profile" ? profileMainItems : defaultMainItems;
  const footerItems = variant === "profile" ? profileFooterItems : defaultFooterItems;


  if (variant === "profile" && !userId) return null;


  return (
    <nav className={styles.sideBarNav}>
      {mainItems.map(({ label, path, icon: Icon }) => (
        <button
          key={path}
          onClick={() => handleNav(path)}
          className={`${styles.sideBarButton} ${isActive(path) ? styles.active : ""}`}
        >
          {Icon && typeof Icon === "string" ? (
            <img
              src={Icon}
              alt=""
              className={styles.icon}
              style={{
                filter: "brightness(0) invert(1)",
                width: Icon === Community ? "30px" : "25px",
                height: Icon === Community ? "20px" : "25px",
              }}
            />
          ) : Icon ? (
            <Icon size={22} />
          ) : null}
          {label}
        </button>
      ))}

      <div className={styles.divider} />

      {footerItems.map(({ label, path, icon: Icon }) => (
        <button
          key={path}
          onClick={() => handleNav(path)}
          className={`${styles.sideBarButton} ${isActive(path) ? styles.active : ""}`}
        >
          {Icon && typeof Icon === "string" ? (
            <img
              src={Icon}
              alt=""
              className={styles.icon}
              style={{
                filter: "brightness(0) invert(1)",
                width: Icon === Community ? "30px" : "25px",
                height: Icon === Community ? "20px" : "25px",
              }}
            />
          ) : Icon ? (
            <Icon size={22} />
          ) : null}
          {label}
        </button>
      ))}

      <span className={styles.copyright}>
        © 2026 Project Campus.
      </span>
    </nav>
  );
}