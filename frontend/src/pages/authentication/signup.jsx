import styles from './authentication.module.css'
import darkMode from '../../Assets/Pictures/LogoDarkMode.png';
import LanguageDropdown from '../../components/pagelayout/languageDrop';
import { useNavigate } from 'react-router-dom';
import { TEXT } from '../../i18n';
import { useState, useEffect } from 'react';
import imageOne from '../../Assets/Pictures/login-1.png'
import imageTwo from '../../Assets/Pictures/login-2.png'
import imageThree from '../../Assets/Pictures/login-3.png'
import imageFour from '../../Assets/Pictures/login-4.png'


export default function Signup() {
    const navigate = useNavigate();
    const [language, setLanguage] = useState('en');
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const slides = [
        { image: imageOne, },
        { image: imageTwo, },
        { image: imageThree, },
        { image: imageFour, }
    ];
    const currentSlide = slides[currentIndex];
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [slides.length]);
    const [form, setForm] = useState({
        username: '',
        academicEmail: '',
        personalEmail: '',
        password: '',
        code: '',
        confirmPassword: ''

    })
    const [error, setError] = useState('');
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };
    const getButtonText = () => {
        if (loading) return t.loading;
        if (step == 0) return t.submitSignup;
        if (step == 1) return t.confirmCode;
        if (step == 2) return t.createAccount;


    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (step == 0) return sendCode();
        if (step == 1) return verifyCode();
        return completeSignup();
    }
    const sendCode = async () => {
        if (!form.username || !form.academicEmail) {
            setError('Please fill in all required fields.');
            return;
        }
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/auth/send_code/', {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: form.username, academicEmail: form.academicEmail })
            });
            const data = await response.json().catch(() => { });
            if (!response.ok) {
                setError(data?.message || 'Failed to send verification code.');
                return;
            }
            setStep(1);

        } catch (error) {
            setError('An error occurred. Please try again later.');
        } finally {
            setLoading(false);
        }


    }
    const verifyCode = async () => {
        if (!form.code) {
            setError('Please enter the verification code.');
            return;
        }
        setLoading(true);

        try {
            const response = await fetch('http://localhost:8000/api/auth/verify_code/', {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ academicEmail: form.academicEmail, code: form.code })
            });
            const data = await response.json().catch(() => { });
            if (!response.ok) {
                setError(data?.message || 'Verification failed.');
                return;
            }
            setStep(2);

        } catch (error) {
            setError('An error occurred. Please try again later.');
        } finally {
            setLoading(false);
        }
    }
    const completeSignup = async () => {
        if (!form.password || !form.confirmPassword) {
            setError('Please fill in all required fields.');
            return;
        }
        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/auth/signup/', {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: form.username,
                    academicEmail: form.academicEmail,
                    personalEmail: form.personalEmail,
                    password: form.password
                })
            });
            const data = await response.json().catch(() => { });
            if (!response.ok) {
                setError(data?.message || 'Signup failed.');
                return;
            }
        } catch (error) {
            setError('An error occurred. Please try again later.');
        } finally {
            setLoading(false);
        }
        navigate('/login')

    }
    const handleReSend = async () => {
        setError('');
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/auth/send_code/', {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: form.username,
                    academicEmail: form.academicEmail,
                })

            });
            const data = await response.json().catch(() => { });
            if (!response.ok) {
                setError(data?.message || 'Failed to resend verification code.');
                return;
            }

        } catch (error) {
            setError('An error occurred. Please try again later.');
        }
        finally {
            setLoading(false);
        }
    }







    const t = (TEXT[language] || TEXT.en).auth.Signup;
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
                            className="flex-1 py-3 text-sm font-bold text-white
                                border-0 cursor-pointer opacity-90 transition-all duration-150
                                hover:opacity-100 active:scale-95"
                            style={{
                                fontFamily: '"Aktiv Grotesk", sans-serif',
                                background: 'linear-gradient(-90deg, rgba(166,39,156,1), rgba(49,32,169,1))',
                                letterSpacing: '0.02em',
                            }}
                            onClick={() => navigate('/login')}>
                            {t.login}
                        </button>

                        <button
                            className="flex-1 py-3 text-base font-bold bg-white text-purple-700 
                                border-0 cursor-pointer transition-all duration-150 active:scale-95"
                            style={{
                                fontFamily: '"Aktiv Grotesk", sans-serif',
                                boxShadow: '0 -4px 12px rgba(0,0,0,0.05)',
                                letterSpacing: '0.02em'
                            }}>
                            {t.signup}
                        </button>
                    </div>

                    <form className={`${styles.form} !w-full !h-auto !pb-8 !mt-0`} onSubmit={handleSubmit}>
                        <div className={styles.formHeader}>
                            <p className={styles.titleOne}>{t.project}</p>
                            <h1 className={`${styles.titleTwo} !text-4xl !tracking-normal`}>{t.campus}</h1>
                        </div>

                        {error && <p className={styles.error}>{error}</p>}

                        {step === 0 && (<>
                            <input type="text" name="username" placeholder={t.username}
                                value={form.username} className={styles.input} onChange={handleChange} />
                            <input type="email" name="academicEmail" placeholder={t.academicEmail}
                                value={form.academicEmail} className={styles.input} onChange={handleChange} />
                        </>)}

                        {step === 1 && (<>
                            <input type="text" name="code" placeholder="Verification Code"
                                value={form.code} className={styles.input} onChange={handleChange} inputMode="numeric" />
                            <button type='button' className={`${styles.resendButton} !mx-10 !w-auto`}
                                onClick={handleReSend} disabled={loading}>
                                {t.resendCode}
                            </button>
                        </>)}

                        {step === 2 && (<>
                            <input type="email" name="personalEmail" placeholder={t.personalEmail}
                                value={form.personalEmail} className={styles.input} onChange={handleChange} />
                            <input type="password" name="password" placeholder={t.password}
                                value={form.password} className={styles.input} onChange={handleChange} />
                            <input type="password" name="confirmPassword" placeholder={t.confirmPassword}
                                value={form.confirmPassword} className={styles.input} onChange={handleChange} />
                        </>)}

                        <p className={styles.helpTextTwo}>
                            {t.needHelp.text} <a href='/LandingPage'>{t.needHelp.link}</a>{t.needHelp.afterLink}
                        </p>
                        <button type="submit" className={styles.submitButton} disabled={loading}>
                            {getButtonText()}
                        </button>
                        <span className={styles.copyright}>{t.copyright}</span>
                    </form>
                </div>
                <div className={`${styles.outterContainer} max-lg:!hidden`}>
                    <div className={styles.sideTabs}>
                        <button className={styles.tabButton} onClick={() => navigate('/login')}>{t.login}</button>
                        <button className={`${styles.tabButton} ${styles.activeTab}`}>{t.signup}</button>
                    </div>
                    <form className={styles.form} onSubmit={handleSubmit}>
                        <div className={styles.formHeader}>
                            <p className={styles.titleOne}>{t.project}</p>
                            <h1 className={styles.titleTwo}>{t.campus}</h1>
                        </div>

                        {error && <p className={styles.error}>{error}</p>}

                        {step === 0 && (<>
                            <input type="text" name="username" placeholder={t.username}
                                value={form.username} className={styles.input} onChange={handleChange} />
                            <input type="email" name="academicEmail" placeholder={t.academicEmail}
                                value={form.academicEmail} className={styles.input} onChange={handleChange} />
                        </>)}

                        {step === 1 && (<>
                            <input type="text" name="code" placeholder="Verification Code"
                                value={form.code} className={styles.input} onChange={handleChange} inputMode="numeric" />
                            <button type='button' className={`${styles.resendButton} max-lg:!mx-10 max-lg:!w-auto`}
                                onClick={handleReSend} disabled={loading}>
                                {t.resendCode}
                            </button>
                        </>)}

                        {step === 2 && (<>
                            <input type="email" name="personalEmail" placeholder={t.personalEmail}
                                value={form.personalEmail} className={styles.input} onChange={handleChange} />
                            <input type="password" name="password" placeholder={t.password}
                                value={form.password} className={styles.input} onChange={handleChange} />
                            <input type="password" name="confirmPassword" placeholder={t.confirmPassword}
                                value={form.confirmPassword} className={styles.input} onChange={handleChange} />
                        </>)}

                        <p className={styles.helpTextTwo}>
                            {t.needHelp.text} <a href='/LandingPage'>{t.needHelp.link}</a>{t.needHelp.afterLink}
                        </p>
                        <button type="submit" className={styles.submitButton} disabled={loading}>
                            {getButtonText()}
                        </button>
                        <span className={styles.copyright}>{t.copyright}</span>
                    </form>
                </div>
            </div>


            <div className={`${styles.footer}  lg:!block`}></div>
        </div>
    );
}
