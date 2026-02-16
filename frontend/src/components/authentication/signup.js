import styles from './authentication.module.css'
import darkMode from '../../Assets/Pictures/LogoDarkMode.png';
import LanguageDropdown from '../pagelayout/languageDrop';
import { useNavigate } from 'react-router-dom';


export default function Signup() {
    const navigate = useNavigate();
    return (
        <div className={styles.darkContainer}>
            <div className={styles.header}>
                <img src={darkMode} alt="Dark Mode" className={styles.darkModeImage} />
                <button className={styles.homeButton}>Home page</button>
                <LanguageDropdown />

            </div>

            <div className={styles.content}>
                <div className={styles.outterContainer}>
                    <div className={styles.sideTabs}>
                        <button className={styles.tabButton} onClick={() => navigate('/login')}>Log In</button>
                        <button className={styles.tabButton + " " + styles.activeTab} >Sign Up</button>
                    </div>
                    <div className={styles.form}>
                        <div className={styles.formHeader}>
                            <p className={styles.titleOne}>PROJECT </p>
                            <h1 className={styles.titleTwo}>CAMPUS</h1>
                        </div>
                        <input type="text" placeholder="Create Username" className={styles.input} />
                        <input type="email" placeholder="Academic Email" className={styles.input} />
                        <p className={styles.helpTextTwo}>Need <a href='/LandingPage'>help</a>?</p>
                        <button type="submit" className={styles.submitButton}>Sign Up</button>
                        <span className={styles.copyright}>Campus, Inc @ 2026. All rights reserved.</span>

                    </div>
                </div>
            </div>
            <div className={styles.footer}>

            </div>

        </div>
    );
}
