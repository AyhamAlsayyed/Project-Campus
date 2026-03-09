import styles from "./header.module.css";
import ThemeToggler from "../../pagelayout/themeToggle";
import darkModeIcon from "../../../Assets/Pictures/LogoDarkMode.png";
import { MessageSquare, Bell, Search, Home } from "lucide-react";
import { useNavigate ,useLocation } from "react-router-dom";

export default function Header({ theme, toggleTheme, user, onTitleClick }) {
  const avatarSrc = user?.avatar
    ? `http://localhost:8000${user.avatar}`
    : "/default-avatar.png";

  const navigate = useNavigate();
  const location = useLocation();

  const handleAvatarClick = () => {
    if (location.pathname == "/profile") {
      navigate("/home");
    }
    else{
      navigate("/profile");
    }

  }

  return (
    <div className={styles.headerInner}>
      <div className={styles.headerLeft}>
        <img src={darkModeIcon} alt="Dark Mode Icon" className={styles.darkModeIcon} />
        <button className={styles.title} onClick={onTitleClick} type="button">
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
        <button className={styles.iconButton} type="button">
          <MessageSquare size={24} />
        </button>
        <button className={styles.iconButton} type="button">
          <Bell size={24} />
        </button>
        <button className={styles.iconButton} type="button" onClick={handleAvatarClick}>
          {location.pathname === "/profile" ? (<Home size={24} />) : (
            <img src={avatarSrc} alt="Profile" className={styles.userProfilePicture} />
          )}
        </button>
      </div>
    </div>
  );
}