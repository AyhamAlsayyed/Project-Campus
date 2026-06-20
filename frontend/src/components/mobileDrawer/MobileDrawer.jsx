import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import styles from './MobileDrawer.module.css';
import darkModeLogo from '../../Assets/Pictures/LogoDarkMode.png';
import lightModeLogo from '../../Assets/Pictures/LogoLightMode.png';
import LightModeIcon from '../../Assets/icons/light-mode.png';
import DarkModeIcon from '../../Assets/icons/dark-mode.png';
import SideBarNav from '../pagelayout/sidebarnav/sideBarNav';

export default function MobileDrawer({ isOpen, onClose, theme, toggleTheme, variant = 'default', currentUser }) {
    const navigate = useNavigate();
    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.backdrop} onClick={onClose} />
            <div className={styles.panel} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <img
                        src={theme === 'light' ? lightModeLogo : darkModeLogo}
                        alt="Logo"
                        className={styles.logo}
                    />
                    <span
                        className={styles.brandName}
                        onClick={() => { navigate('/home'); onClose(); }}
                    >
                        CAMPUS
                    </span>
                    <button
                        className={styles.themeToggle}
                        onClick={toggleTheme}
                        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        <img
                            src={theme === 'dark' ? LightModeIcon : DarkModeIcon}
                            alt="Toggle theme"
                            width={18}
                            height={18}
                            className={styles.themeIcon}
                        />
                    </button>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={16} />
                    </button>
                </div>
                <div className={styles.nav}>
                    <SideBarNav onClose={onClose} variant={variant} currentUser={currentUser} />
                </div>
            </div>
        </div>
    );
}
