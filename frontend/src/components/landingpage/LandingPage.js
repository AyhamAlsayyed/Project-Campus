import styles from './LandingPage.module.css';
import ThemeToggle from '../pagelayout/themeToggle'
import LanguageDropDown from '../pagelayout/languageDrop';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';


const TEXT = {
    en: {
        seeColleges: "See colleges",
        qAndA: "Q&A",
        about: "About",
        contactUs: "Contact us",
        project: "PROJECT",
        campus: "CAMPUS",
        getStarted: "Get Started",
        slides: [
            {
                description: "“The platform is super clean and intuitive, I feel at home!”",
            },
            {
                description: "I love connecting with students from other universties here.”"
            },
            {
                description: "I can see all my university info in one place, it's so easy! ”"
            },
            {
                description: "Finding professors and contatcing them has never been simpler.”"
            }
        ]

    },
    ar: {
        seeColleges: "شاهد الكليات",
        qAndA: "سؤال وجواب",
        about: "عن",
        contactUs: "اتصل بنا",
        project: "المشروع",
        campus: "الحرم الجامعي",
        getStarted: "ابدأ الآن",
        slides: [
            {
                description: "المنصة نظيفة جداً ومريحة، أشعر بالراحة!",
            },
            {
                description: "أحب التفاعل مع الطلاب من جامعات أخرى هنا."
            },
            {
                description: "يمكنني رؤية جميع معلومات جامعيتي في مكان واحد، سهل جداً!"
            },
            {
                description: "البحث عن الأساتذة والتواصل معهم لم يكن أسهل من الآن."
            }
        ]
    }
}

export default function LandingPage() {
    const [apiMsg, setApiMsg] = useState("");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [theme, setTheme] = useState('dark');
    const [language, setLanguage] = useState('en');
    const text = TEXT[language];
    const slides = text.slides;
    const navigate = useNavigate();

    useEffect(() => {
      fetch("http://127.0.0.1:8000/api/ping/")
        .then((res) => res.json())
        .then((data) => setApiMsg(data.message))
        .catch(() => setApiMsg("API connection failed"));
    }, []);

    useEffect(() => {
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    })
    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme == 'dark' ? 'light' : 'dark'));
    }

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);
    const currentSlide = slides[currentIndex];

    return (
        <div className={theme == "dark" ? styles.darkContainer : styles.lightContainer}>
            <p className={styles.bodyDescription}>{apiMsg}</p>
            <div className={styles.headerSection}>
                <div className={styles.leftHeader}>
                    <p className={styles.headerText}>{text.seeColleges}</p>
                    <LanguageDropDown language={language} onChange={setLanguage} />
                    <ThemeToggle theme={theme} toggleTheme={toggleTheme} />


                </div>
                <div className={styles.headerRight}>
                    <button>{text.qAndA}</button>
                    <button>{text.about}</button>
                    <button className={styles.contactUs}>{text.contactUs}</button>
                </div>
            </div>
            <div className={styles.bodySection}>
                <div className={styles.firstHalf}>
                    <p className={styles.bodyFirstTitle}>{text.project}</p>
                    <p className={styles.bodySecondTitle}>{text.campus}</p>
                    <p key={currentIndex} className={`${styles.bodyDescription} ${styles.fade}`}>{currentSlide.description}</p>
                </div>
            </div>
            <div className={styles.bottomSection}>
                <div className={styles.bottomContent}>
                    <button className={styles.getStarted} onClick={() => navigate('/signup')}>{text.getStarted}</button>
                </div>
                 <span className={styles.copyright}>Campus, Inc @ 2026. All rights reserved.</span>

            </div>


        </div>
    )
}
