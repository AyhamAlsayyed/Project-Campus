
import styles from "./themeToggle.module.css";
export default function ThemeToggle({ theme, toggleTheme }) {
    return (
        <button className={`${styles.toggle} ${theme === "dark" ? styles.toggleDark : styles.toggleLight}`} onClick={toggleTheme}>
            <span className={styles.toggleCircle}>
                {theme === "dark" ? "🌙" : "☀️"}
            </span>
        </button>
    );
}
