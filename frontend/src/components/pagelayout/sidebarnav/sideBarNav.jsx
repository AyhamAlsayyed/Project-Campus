import styles from "./sideBarNav.module.css";
import {  useLocation, useNavigate} from "react-router-dom";

import Home from '../../../Assets/icons/home.png';
import Community from '../../../Assets/icons/community.png';
import University from '../../../Assets/icons/university.png';
import Events from '../../../Assets/icons/event.png';
import About from '../../../Assets/icons/about-us.png';
import Privacy from '../../../Assets/icons/privacy-policy.png';
import Help from '../../../Assets/icons/help.png';

export default function SidebarNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActive = (path) => pathname === path || pathname.startsWith(path + "/");

  const mainItems = [
    { label: "Home page", path: "/home", icon: Home },
    { label: "Communities", path: "/communities", icon: Community },
    { label: "Universities", path: "/universities", icon: University },
    { label: "Events", path: "/events", icon: Events },
  ];

  const footerItems = [
    { label: "About us", path: "/about", icon: About },
    { label: "Privacy Policy", path: "/privacy", icon: Privacy },
    { label: "Help", path: "/help", icon: Help },
  ];

  return (
    <nav className={styles.sideBarNav}>
      {mainItems.map(({label, path, icon }) => (
        <button
          key={path}
          type="button"
          onClick={() => navigate(path)}
          className={`${styles.sideBarButton} ${isActive(path) ? styles.active : ""}`}
        >
          <img src={icon} alt="" className={styles.icon} width={22} height={22} style={{ filter: "invert(1)" }} />
          {label}
        </button>
      ))}

      <div className={styles.divider} />

      {footerItems.map(({ label, path, icon }) => (
        <button
          key={path}
          type="button"
          onClick={() => navigate(path)}
          className={`${styles.sideBarButton} ${isActive(path) ? styles.active : ""}`}
        >
          <img src={icon} alt="" className={styles.icon}  width={22} height={22} style={{ filter: "invert(1)" }} />
          {label}
        </button>
      ))}

      <span className={styles.copyright}>
        © 2024 Project Campus. All rights reserved.
      </span>
    </nav>
  );
}