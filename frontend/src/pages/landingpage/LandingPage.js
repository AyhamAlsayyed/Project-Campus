import styles from './LandingPage.module.css';
import ThemeToggle from '../../components/pagelayout/themeToggle'
import LanguageDropDown from '../../components/pagelayout/languageDrop';
import { TEXT } from '../../i18n';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';


export default function LandingPage() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [theme, setTheme] = useState('dark');
    const [language, setLanguage] = useState('en');
    const t = (TEXT[language] || TEXT.en).landing;
    const slides = t.slides || [];
    const navigate = useNavigate();

    useEffect(() => {
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    }, [language]);
    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme == 'dark' ? 'light' : 'dark'));
    }

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [slides.length]);
    const currentSlide = slides[currentIndex];

    return (
        <div className={theme == "dark" ? styles.darkContainer : styles.lightContainer}>
            <div className={styles.headerSection}>
                <div className={styles.leftHeader}>
                    <p className={styles.headerText}>{t.seeColleges}</p>
                    <LanguageDropDown language={language} onChange={setLanguage} />
                    <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                   

                </div>
                <div className={styles.headerRight}>
                    <button>{t.qAndA}</button>
                    <button>{t.about}</button>
                    <button className={styles.contactUs}>{t.contactUs}</button>
                </div>
            </div>
            <div className={styles.bodySection}>
                <div className={styles.firstHalf}>
                    <p className={styles.bodyFirstTitle}>{t.project}</p>
                    <p className={styles.bodySecondTitle}>{t.campus}</p>
                    <p key={currentIndex} className={`${styles.bodyDescription} ${styles.fade}`}>{currentSlide.description}</p>
                </div>
            </div>
            <div className={styles.bottomSection}>
                <div className={styles.bottomContent}>
                    <button className={styles.getStarted} onClick={() => navigate('/signup')}>{t.getStarted}</button>
                </div>
                 <span className={styles.copyright}>Campus, Inc @ 2026. All rights reserved.</span>
                
            </div>
           

        </div>
    )
}