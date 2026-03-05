import styles from "./sideBarNav.module.css";
import {  useLocation, useNavigate} from "react-router-dom";
import {
  Home,
  Users,
  GraduationCap,
  Calendar,
  Info,
  FileText,
  HelpCircle
} from "lucide-react";

export default function SidebarNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActive = (path) => pathname === path || pathname.startsWith(path + "/");

  const mainItems = [
    { label: "Home page", path: "/home", Icon: Home },
    { label: "Communities", path: "/communities", Icon: Users },
    { label: "Universities", path: "/universities", Icon: GraduationCap },
    { label: "Events", path: "/events", Icon: Calendar },
  ];

  const footerItems = [
    { label: "About us", path: "/about", Icon: Info },
    { label: "Privacy Policy", path: "/privacy", Icon: FileText },
    { label: "Help", path: "/help", Icon: HelpCircle },
  ];

  return (
    <nav className={styles.sideBarNav}>
      {mainItems.map(({ label, path, Icon }) => (
        <button
          key={path}
          type="button"
          onClick={() => navigate(path)}
          className={`${styles.sideBarButton} ${isActive(path) ? styles.active : ""}`}
        >
          <Icon size={22} />
          {label}
        </button>
      ))}

      <div className={styles.divider} />

      {footerItems.map(({ label, path, Icon }) => (
        <button
          key={path}
          type="button"
          onClick={() => navigate(path)}
          className={`${styles.sideBarButton} ${isActive(path) ? styles.active : ""}`}
        >
          <Icon size={22} />
          {label}
        </button>
      ))}

      <span className={styles.copyright}>
        © 2024 Project Campus. All rights reserved.
      </span>
    </nav>
  );
}