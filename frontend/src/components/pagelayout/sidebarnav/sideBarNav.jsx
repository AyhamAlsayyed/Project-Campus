import styles from "./sideBarNav.module.css";
import { useLocation, useNavigate } from "react-router-dom";

import Home from '../../../Assets/icons/home.png';
import Community from '../../../Assets/icons/community.png';
import University from '../../../Assets/icons/university.png';
import Events from '../../../Assets/icons/event.png';
import About from '../../../Assets/icons/about-us.png';
import Privacy from '../../../Assets/icons/privacy-policy.png';
import Help from '../../../Assets/icons/help.png';
import {
  User,
  UserPlus,
  Bell,
  Users,
  Settings,
  Languages,
  HelpCircle,
  MessageSquare
} from "lucide-react";

export default function SidebarNav({ variant = "default", currentUser }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActive = (path) => pathname === path || pathname.startsWith(path + "/");

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
  { label: "Profile", path: `/profile/${currentUser?.id}`, icon: User },
  { label: "Friends", path: "/friends", icon: UserPlus },
  { label: "Pages", path: "/pages", icon: Bell },
  { label: "Communities", path: "/communities", icon: Users },
];

const profileFooterItems = [
  { label: "Settings", path: "/settings", icon: Settings },
  { label: "Language", path: "/language", icon: Languages },
  { label: "Help", path: "/help", icon: HelpCircle },
];
  const mainItems =
    variant === "profile" ? profileMainItems : defaultMainItems;

  const footerItems =
    variant === "profile" ? profileFooterItems : defaultFooterItems;


  if (variant === "profile" && !currentUser) return null;

  return (
    <nav className={styles.sideBarNav}>

      {mainItems.map(({ label, path, icon: Icon }) => (
        <button
          key={path}
          onClick={() => navigate(path)}
          className={`${styles.sideBarButton} ${isActive(path) ? styles.active : ""
            }`}
        >
          {Icon && typeof Icon === "string" ? (
           <img src={Icon} alt="" className={styles.icon} width={path == "/communities" ? 22 : 22} height={path == "/communities" ? 20 : 22} style={{ filter: "invert(1)" }} />
          ) : Icon ? (
            <Icon size={22} />
          ) : null}
          {label}
        </button>
      ))}

      {/* DIVIDER */}
      <div className={styles.divider} />

      {/* FOOTER */}
      {footerItems.map(({ label, path, icon: Icon }) => (
        <button
          key={path}
          onClick={() => navigate(path)}
          className={`${styles.sideBarButton} ${isActive(path) ? styles.active : ""
            }`}
        >
          {Icon && typeof Icon === "string" ? (
            <img src={Icon} alt="" className={styles.icon} width={22} height={22} style={{ filter: "invert(1)" }} />
          ) : Icon ? (
            <Icon size={22} />
          ) : null}
          {label}
        </button>
      ))}

      {/* STATIC FOOTER TEXT */}
      <span className={styles.copyright}>
        © 2026 Project Campus.
      </span>
    </nav>
  );
}