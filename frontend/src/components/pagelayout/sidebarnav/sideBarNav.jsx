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
import {
  User,
  UserPlus,
  Bell,
  Users,
  Languages,
  HelpCircle,
} from "lucide-react";

export default function SidebarNav({ variant = "default", currentUser }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActive = (path) => {
    if (path.startsWith('/profile/') && !path.endsWith('/friends') && !path.endsWith('/pages')) {
      return pathname === path;
    }
    return pathname === path || pathname.startsWith(path + "/");
  };

  const defaultMainItems = [
    { label: "Home page", path: "/home", icon: Home },
    { label: "Communities", path: "/communities", icon: Community },
    { label: "Universities", path: "/universities", icon: University },
    { label: "Events", path: "/events", icon: Events },
  ];

  const defaultFooterItems = [
    { label: "About us", path: "/about", icon: About },
    { label: "Privacy Policy", path: "/privacy", icon: Privacy },
    { label: "Help", path: "/help", icon: Help },
  ];

  const profileMainItems = [
    { label: "Profile", path: `/profile/${currentUser?.id}`, icon: Profile },
    { label: "Friends", path: `/profile/${currentUser?.id}/friends`, icon: Friends },
    { label: "Pages", path: `/profile/${currentUser?.id}/pages`, icon: FollowedPages },
    { label: "Communities", path: `/profile/${currentUser?.id}/communities`, icon: Community },
  ];

  const profileFooterItems = [
    { label: "Settings", path: "/settings", icon: Settings },
    { label: "Privacy Policy", path: "/language", icon: PrivacyPolicy },
    { label: "Help", path: "/help", icon: Help },
  ];

  const mainItems = variant === "profile" ? profileMainItems : defaultMainItems;
  const footerItems = variant === "profile" ? profileFooterItems : defaultFooterItems;

  if (variant === "profile" && !currentUser) return null;

  // No Tailwind hidden class — visibility is controlled by the parent (Homepage)
  // which conditionally mounts this component via isMobile JS state
  return (
    <nav className={styles.sideBarNav}>
      {mainItems.map(({ label, path, icon: Icon }) => (
        <button
          key={path}
          onClick={() => navigate(path)}
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
          onClick={() => navigate(path)}
          className={`${styles.sideBarButton} ${isActive(path) ? styles.active : ""}`}
        >
          {Icon && typeof Icon === "string" ? (
            <img src={Icon} alt="" className={styles.icon} width={25} height={25} style={{ filter: "invert(1)" }} />
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