
import styles from "./themeToggle.module.css";
import darkModeIcon from '../../Assets/icons/dark-mode.png'
import LightModeIcon from '../../Assets/icons/light-mode.png'
export default function ThemeToggle({ theme, toggleTheme }) {
    return (
        <button className={`${styles.toggle} ${theme === "dark" ? styles.toggleDark : styles.toggleLight}`} onClick={toggleTheme}>
            <span className={styles.toggleCircle}>
                {theme === "dark" ?  <span className={styles.iconGradient} />: <img src={LightModeIcon} alt="Light Mode" width={20} height={20}style={{ filter: "invert(1)" }} />}
            </span>
        </button>
    );
}
