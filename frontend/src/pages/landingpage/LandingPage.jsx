import styles from './LandingPage.module.css';
import ThemeToggle from '../../components/pagelayout/themeToggle'
import LanguageDropDown from '../../components/pagelayout/languageDrop';
import { TEXT } from '../../i18n';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useTheme from '../../hooks/useTheme';

export default function LandingPage() {
    const [currentIndex] = useState(() => Math.floor(Math.random() * (TEXT['en'].landing.slides?.length || 4)));
   
    const [language, setLanguage] = useState('en');
    const t = (TEXT[language] || TEXT.en).landing;
    const slides = t.slides || [];
    const navigate = useNavigate();

    useEffect(() => {
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    }, [language]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const { theme, toggleTheme } = useTheme();
    

    const currentSlide = slides[currentIndex];

    return (
        <div className={`${theme === 'dark' ? styles.darkContainer : styles.lightContainer} max-lg:!px-6 max-lg:!overflow-auto max-lg:!max-h-none`}>

            {/* HEADER */}
            <div className={`${styles.headerSection} max-lg:!flex-col max-lg:!items-start max-lg:!gap-3`}>
                <div className={`${styles.leftHeader} !flex-wrap !gap-x-4 !gap-y-2`}>
                    <p className={styles.headerText}>{t.seeColleges}</p>
                    <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                </div>

                <div className={`${styles.headerRight} max-lg:!gap-4`}>
                    <button className={`hidden lg:block ${styles.navLink}`} onClick={() => navigate('/help')}>{t.qAndA}</button>
                    <button className={`hidden lg:block ${styles.navLink}`} onClick={() => navigate('/about')}>{t.about}</button>
                    <button className={`${styles.contactUs} max-lg:!text-base max-lg:!py-2 max-lg:!px-5`} onClick={() => navigate('/help')}>
                        {t.contactUs}
                    </button>
                </div>
            </div>

            {/* BODY */}
            <div className={`${styles.bodySection} max-lg:!mt-6`}>
                <div className={`${styles.firstHalf} !w-full lg:!w-1/2`}>
                    <p className={`${styles.bodyFirstTitle} max-lg:!text-3xl`}>{t.project}</p>
                    <p className={`${styles.bodySecondTitle} max-lg:!text-[clamp(2.5rem,11vw,4rem)] max-lg:!tracking-normal`}>
                        {t.campus}
                    </p>
                    <p key={currentIndex} className={`${styles.bodyDescription} ${styles.fade} max-lg:!text-lg`}>
                        {currentSlide.description}
                    </p>
                </div>

                <div className={`${styles.secondHalf} !hidden lg:!flex`}>
                    <img
                        key={currentIndex}
                        src={currentSlide.image}
                        alt="Slide"
                        className={styles.slideImage}
                    />
                </div>
            </div>

           
            <div className={`${styles.bottomSection} max-lg:!w-[calc(100%+48px)] max-lg:!ml-[-24px] max-lg:!mr-[-24px] max-lg:!h-auto max-lg:!min-h-[140px] max-lg:!mt-6`}>
                <div className={`${styles.bottomContent} max-lg:!px-6 max-lg:!py-6 max-lg:!flex-col max-lg:!items-start max-lg:!gap-3`}>
                    {/* Override the fixed clamp width so the button sizes naturally */}
                    <button
                        className={`${styles.getStarted} max-lg:!w-auto max-lg:!text-xl max-lg:!px-6 max-lg:!py-4`}
                        onClick={() => navigate('/signup')}
                        style={{fontWeight :"1000"}}
                    >
                        {t.getStarted}
                    </button>
                </div>
                <span className={`${styles.copyright} max-lg:!w-auto max-lg:!self-end max-lg:!pb-4 max-lg:!pr-6 max-lg:!text-xs max-lg:!mb-0`}>
                    Campus, Inc @ 2026. All rights reserved.
                </span>
            </div>

        </div>
    );
}
