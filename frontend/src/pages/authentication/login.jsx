import styles from './authentication.module.css'
import darkMode from '../../Assets/Pictures/LogoDarkMode.png';
import LanguageDropdown from '../../components/pagelayout/languageDrop';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TEXT } from '../../i18n';
import imageOne from '../../Assets/Pictures/login-1.png'
import imageTwo from '../../Assets/Pictures/login-2.png'
import imageThree from '../../Assets/Pictures/login-3.png'
import imageFour from '../../Assets/Pictures/login-4.png'
export default function Login() {
    const navigate = useNavigate();
    const [language, setLanguage] = useState('en');
    const t = (TEXT[language] || TEXT.en).auth.Login;
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const [currentIndex, setCurrentIndex] = useState(0);

    const slides = [
        { image: imageOne, },
        { image: imageTwo, },
        { image: imageThree, },
        { image: imageFour, }
    ];
    const currentSlide = slides[currentIndex];
    const handlesubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:8000/api/auth/login/', {

                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });
            const data = await response.json();
            if (!response.ok) {
                setError(data.message || 'Login failed');
                return;

            }

            if (data.access && data.refresh) {
                localStorage.setItem("access", data.access);
                localStorage.setItem("refresh", data.refresh);
                localStorage.setItem("user_type", data.user.user_type ?? '');
                localStorage.setItem("login_user", JSON.stringify(data.user));
            } else {
                setError("No tokens returned from server");
                return;
            }

            navigate('/home');

        }
        catch (error) {
            setError('An error occurred. Please try again later.');
        }
    }
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [slides.length]);


    useEffect(() => {
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    }, [language]);


    return (
        <div className={`${styles.darkContainer} max-lg:!overflow-auto`}>

            <div className={`${styles.header} max-lg:!px-6 max-lg:!py-4 max-lg:!gap-4`}>
                <img src={darkMode} alt="Dark Mode" className={`${styles.darkModeImage} max-lg:!h-12`} />
                <button className={`${styles.homeButton} max-lg:!text-xl max-lg:!h-auto`}>{t.homepage}</button>
                <LanguageDropdown language={language} onChange={setLanguage} />
            </div>


            <div className={`${styles.absoluteSlider} !hidden lg:!block`}>
                <p key={`text-${currentIndex}`} className={`${styles.sliderDescription} ${styles.fade}`}>
                    {currentSlide?.description}
                </p>
                <img key={`img-${currentIndex}`} src={currentSlide?.image} alt="Slide"
                    className={`${styles.sliderImage} ${styles.fadeSlide}`} />
            </div>

            <div className={`${styles.content} max-lg:!justify-center max-lg:!items-start max-lg:!py-8 max-lg:!flex-1`}>

                <div className="hidden max-lg:!flex flex-col w-full max-w-[430px] mx-4">
                    <div className="flex w-[85%] mx-auto rounded-t-[20px] overflow-hidden !mb-0 relative z-20">
                        <button
                            className="flex-1 py-3 text-base font-bold bg-white text-purple-700 
                            border-0 cursor-pointer transition-all duration-150 active:scale-95 "
                            style={{
                                fontFamily: '"Aktiv Grotesk", sans-serif',
                                boxShadow: '0 -4px 12px rgba(0,0,0,0.05)',
                                letterSpacing: '0.02em'
                            }}>
                            {t.login}
                        </button>

                        <button
                            className="flex-1 py-3 text-sm font-bold text-white
                            border-0 cursor-pointer opacity-90 transition-all duration-150
                            hover:opacity-100 active:scale-90 "
                            style={{
                                fontFamily: '"Aktiv Grotesk", sans-serif',
                                background: 'linear-gradient(-90deg, rgba(166,39,156,1), rgba(49,32,169,1))',
                                letterSpacing: '0.02em',
                            }}
                            onClick={() => navigate('/signup')}>
                            {t.signup}
                        </button>
                    </div>
                    <form className={`${styles.form} !w-full !h-auto !pb-8 `}
                        onSubmit={handlesubmit}>
                        <div className={styles.formHeader}>
                            <p className={styles.titleOne}>{t.project}</p>
                            <h1 className={`${styles.titleTwo} !text-4xl !tracking-normal`}>{t.campus}</h1>
                        </div>
                        {error && <p className={styles.error}>{error}</p>}
                        <input type="text" placeholder={t.username} className={styles.input}
                            value={username} onChange={(e) => setUsername(e.target.value)} />
                        <input type="password" placeholder={t.password} className={styles.input}
                            value={password} onChange={(e) => setPassword(e.target.value)} />
                        <div className={styles.rememberMe}>
                            <div className={styles.checkbox}>
                                <input type="checkbox" id="rememberMe" />
                                <label htmlFor="rememberMe" className={styles.rememberMeLabel}>{t.rememberMe}</label>
                            </div>
                            <p className={styles.helpTextOne}>
                                {t.needHelp.text} <a href='/LandingPage'>{t.needHelp.link}</a>{t.needHelp.afterLink}
                            </p>
                        </div>
                        <button type="submit" className={styles.submitButton}>{t.submitLogin}</button>
                        <span className={styles.copyright}>{t.copyright}</span>
                    </form>
                </div>


                <div className={`${styles.outterContainer} max-lg:!hidden`}>
                    <div className={styles.sideTabs}>
                        <button className={`${styles.tabButton} ${styles.activeTab}`}>{t.login}</button>
                        <button className={styles.tabButton} onClick={() => navigate('/signup')}>{t.signup}</button>
                    </div>
                    <form className={styles.form} onSubmit={handlesubmit}>
                        <div className={styles.formHeader}>
                            <p className={styles.titleOne}>{t.project}</p>
                            <h1 className={styles.titleTwo}>{t.campus}</h1>
                        </div>
                        {error && <p className={styles.error}>{error}</p>}
                        <input type="text" placeholder={t.username} className={styles.input}
                            value={username} onChange={(e) => setUsername(e.target.value)} />
                        <input type="password" placeholder={t.password} className={styles.input}
                            value={password} onChange={(e) => setPassword(e.target.value)} />
                        <div className={styles.rememberMe}>
                            <div className={styles.checkbox}>
                                <input type="checkbox" id="rememberMeDesktop" />
                                <label htmlFor="rememberMeDesktop" className={styles.rememberMeLabel}>{t.rememberMe}</label>
                            </div>
                            <p className={styles.helpTextOne}>
                                {t.needHelp.text} <a href='/LandingPage'>{t.needHelp.link}</a>{t.needHelp.afterLink}
                            </p>
                        </div>
                        <button type="submit" className={styles.submitButton}>{t.submitLogin}</button>
                        <span className={styles.copyright}>{t.copyright}</span>
                    </form>
                </div>

            </div>

            <div className={`${styles.footer}  lg:!block`}></div>
        </div>
    );
}
