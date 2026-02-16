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
                        <button className={styles.tabButton+ " " + styles.activeTab}>Log In</button>
                        <button className={styles.tabButton } onClick={() => navigate('/signup')}>Sign Up</button>
                    </div>
                    <div className={styles.form}>
                        <div className={styles.formHeader}>
                            <p className={styles.titleOne}>PROJECT </p>
                            <h1 className={styles.titleTwo}>CAMPUS</h1>
                        </div>
                        <input type="text" placeholder="Username" className={styles.input} />
                        <input type="email" placeholder="Password" className={styles.input} />
                        <div className={styles.rememberMe}>
                            <input type="checkbox" id="rememberMe" className={styles.checkbox} />
                            <label htmlFor="rememberMe" className={styles.rememberMeLabel}>Remember me</label>
                            <p className={styles.helpTextOne}>Need <a href='/LandingPage'>help</a>?</p>
                        </div>

                        <button type="submit" className={styles.submitButton}>Log in</button>
                        <span className={styles.copyright}>Campus, Inc @ 2026. All rights reserved.</span>

                    </div>
                </div>
            </div>
            <div className={styles.footer}>

            </div>

        </div>
    );
}
