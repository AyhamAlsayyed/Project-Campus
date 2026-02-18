import styles from './authentication.module.css'
import darkMode from '../../Assets/Pictures/LogoDarkMode.png';
import LanguageDropdown from '../../components/pagelayout/languageDrop';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TEXT } from '../../i18n';

export default function Signup() {
    const navigate = useNavigate();
    const [language, setLanguage] = useState('en');
    const t = (TEXT[language] || TEXT.en).auth;
    useEffect(() => {
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    }, [language]);


    return (
        <div className={styles.darkContainer}>
            <div className={styles.header}>
                <img src={darkMode} alt="Dark Mode" className={styles.darkModeImage} />
                <button className={styles.homeButton}>{t.homepage}</button>
                <LanguageDropdown language={language} onChange={setLanguage} />

            </div>

            <div className={styles.content}>
                <div className={styles.outterContainer}>
                    <div className={styles.sideTabs}>
                        <button className={styles.tabButton + " " + styles.activeTab}>{t.login}</button>
                        <button className={styles.tabButton} onClick={() => navigate('/signup')}>{t.signup}</button>
                    </div>
                    <div className={styles.form}>
                        <div className={styles.formHeader}>
                            <p className={styles.titleOne}>{t.project}</p>
                            <h1 className={styles.titleTwo}>{t.campus}</h1>
                        </div>
                        <input type="text" placeholder={t.username} className={styles.input} />
                        <input type="email" placeholder={t.password} className={styles.input} />
                        <div className={styles.rememberMe}>
                            <div className={styles.checkbox}>
                                <input type="checkbox" id="rememberMe" className={styles.checkbox} />
                                <label htmlFor="rememberMe" className={styles.rememberMeLabel}>{t.rememberMe}</label>
                            </div>

                            <p className={styles.helpTextOne}> {t.needHelp.text} {" "} <a href='/LandingPage'>{t.needHelp.link}</a>{t.needHelp.afterLink}</p>
                        </div>

                        <button type="submit" className={styles.submitButton}>{t.submitLogin}</button>
                        <span className={styles.copyright}>{t.copyright}</span>

                    </div>
                </div>
            </div>
            <div className={styles.footer}>

            </div>

        </div>
    );
}