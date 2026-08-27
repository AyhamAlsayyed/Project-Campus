import styles from './authentication.module.css';
import darkMode from '../../Assets/Pictures/LogoDarkMode.png';
import lightMode from '../../Assets/Pictures/LogoLightMode.png';
import LanguageDropdown from '../../components/pagelayout/languageDrop';
import ThemeToggle from '../../components/pagelayout/themeToggle';
import { useNavigate } from 'react-router-dom';
import { TEXT } from '../../i18n';
import { useState, useEffect } from 'react';
import imageOne from '../../Assets/Pictures/login-1.png';
import imageTwo from '../../Assets/Pictures/login-2.png';
import imageThree from '../../Assets/Pictures/login-3.png';
import imageFour from '../../Assets/Pictures/login-4.png';
import API from '../../config';
import useTheme from '../../hooks/useTheme';
export default function Signup() {
    const navigate = useNavigate();
    const [language, setLanguage] = useState('en');
    const { theme, toggleTheme } = useTheme();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [currentIndex] = useState(1);
    

    const slides = [
        { image: imageOne, },
        { image: imageTwo, },
        { image: imageThree, },
        { image: imageFour, }
    ];
    const currentSlide = slides[currentIndex];
    

    const [form, setForm] = useState({
        username: '',
        academicEmail: '',
        personalEmail: '',
        password: '',
        code: '',
        confirmPassword: ''
    });

    const [error, setError] = useState('');
    const [showPersonalEmailPopup, setShowPersonalEmailPopup] = useState(false);
    const [personalEmailOtp, setPersonalEmailOtp] = useState('');
    const [personalEmailOtpError, setPersonalEmailOtpError] = useState('');
    const [personalEmailOtpLoading, setPersonalEmailOtpLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const getButtonText = () => {
        if (loading) return t.loading;
        if (step == 0) return t.submitSignup;
        if (step == 1) return t.confirmCode;
        if (step == 2) return t.createAccount;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (step == 0) return sendCode();
        if (step == 1) return verifyCode();
        return completeSignup();
    };

    const sendCode = async () => {
        if (!form.username || !form.academicEmail) {
            setError('Please fill in all required fields.');
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${API}/api/auth/send_code/`, {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: form.username, academicEmail: form.academicEmail, signup: false })
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
    };

    const verifyCode = async () => {
        if (!form.code) {
            setError('Please enter the verification code.');
            return;
        }
        setLoading(true);

        try {
            const response = await fetch(`${API}/api/auth/verify_code/`, {
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
    };

    const completeSignup = async () => {
        if (!form.password || !form.confirmPassword) {
            setError('Please fill in all required fields.');
            return;
        }
        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        // If personal email provided, send verification code and show popup
        if (form.personalEmail) {
            setLoading(true);
            try {
                const response = await fetch(`${API}/api/auth/send_code/`, {
                    method: 'POST',
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username: form.username, personalEmail: form.personalEmail, signup: true })
                });
                const data = await response.json().catch(() => { });
                if (!response.ok) {
                    setError(data?.message || 'Failed to send verification code to personal email.');
                    return;
                }
                setPersonalEmailOtp('');
                setPersonalEmailOtpError('');
                setShowPersonalEmailPopup(true);
            } catch {
                setError('An error occurred. Please try again later.');
            } finally {
                setLoading(false);
            }
            return;
        }

        await doCreateAccount();
    };

    const resendPersonalEmailCode = async () => {
        setPersonalEmailOtpError('');
        setPersonalEmailOtpLoading(true);
        try {
            const response = await fetch(`${API}/api/auth/send_code/`, {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: form.username, personalEmail: form.personalEmail, signup: true })
            });
            const data = await response.json().catch(() => { });
            if (!response.ok) {
                setPersonalEmailOtpError(data?.message || 'Failed to resend code.');
            }
        } catch {
            setPersonalEmailOtpError('An error occurred. Please try again later.');
        } finally {
            setPersonalEmailOtpLoading(false);
        }
    };

    const verifyPersonalEmailAndComplete = async () => {
        if (personalEmailOtp.length < 6) return;
        setPersonalEmailOtpLoading(true);
        setPersonalEmailOtpError('');
        try {
            const response = await fetch(`${API}/api/auth/verify_code/`, {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ personalEmail: form.personalEmail, code: personalEmailOtp })
            });
            const data = await response.json().catch(() => { });
            if (!response.ok) {
                setPersonalEmailOtpError(data?.message || 'Invalid code. Please try again.');
                return;
            }
            setShowPersonalEmailPopup(false);
            await doCreateAccount();
        } catch {
            setPersonalEmailOtpError('An error occurred. Please try again later.');
        } finally {
            setPersonalEmailOtpLoading(false);
        }
    };

    const doCreateAccount = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API}/api/auth/signup/`, {
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
        } catch {
            setError('An error occurred. Please try again later.');
        } finally {
            setLoading(false);
        }
        navigate('/login');
    };

    const handleReSend = async () => {
        setError('');
        setLoading(true);
        try {
            const response = await fetch(`${API}/api/auth/send_code/`, {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: form.username,
                    academicEmail: form.academicEmail,
                    signup: false,
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
    };

    const t = (TEXT[language] || TEXT.en).auth.Signup;
    
    useEffect(() => {
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    }, [language]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    return (
        <div className={`${theme === 'dark' ? styles.darkContainer : styles.lightContainer} max-lg:!overflow-auto`}>
            <div className={`${styles.header} max-lg:!px-6 max-lg:!py-4 max-lg:!gap-4`}>
                <img src={theme === 'dark' ? darkMode : lightMode} alt="Campus Logo" className={`${styles.darkModeImage} max-lg:!h-12`} />
                <button className={`${styles.homeButton} max-lg:!text-xl max-lg:!h-auto`} onClick={() => navigate('/')}>{t.homepage}</button>
                <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
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

                    <div style={{
                        display: 'flex',
                        width: '85%',
                        margin: '0 auto',
                        gap: 8,
                        position: 'relative',
                        zIndex: 20,
                    }}>
                        <button
                            style={{
                                flex: 1,
                                padding: '12px 0',
                                fontWeight: 700,
                                fontSize: '1rem',
                                border: 'none',
                                borderRadius: '14px 14px 0 0',
                                cursor: 'pointer',
                                background: 'linear-gradient(-90deg, rgba(166,39,156,1), rgba(49,32,169,1))',
                                color: 'rgba(255,255,255,0.85)',
                                fontFamily: '"Aktiv Grotesk", sans-serif',
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                                transition: 'transform 0.15s ease',
                            }}
                            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
                            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                            onClick={() => navigate('/login')}>
                            {t.login}
                        </button>

                        <button
                            style={{
                                flex: 1,
                                padding: '12px 0',
                                fontWeight: 800,
                                fontSize: '1rem',
                                border: 'none',
                                borderRadius: '14px 14px 0 0',
                                cursor: 'pointer',
                                background: 'white',
                                color: '#662D91',
                                fontFamily: '"Aktiv Grotesk", sans-serif',
                                letterSpacing: '0.05em',
                                boxShadow: '0 -4px 16px rgba(0,0,0,0.12)',
                                textTransform: 'uppercase',
                                transition: 'transform 0.15s ease',
                            }}
                            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
                            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
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

            {showPersonalEmailPopup && (
                <div style={{ position: "fixed", inset: 0, zIndex: 1001, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} onClick={() => setShowPersonalEmailPopup(false)} />
                    <div style={{
                        position: "relative", background: "#1e1e1e", borderRadius: 20,
                        padding: 32, width: 420, boxShadow: "0 20px 50px rgba(0,0,0,0.7)",
                        border: "1px solid rgba(255,255,255,0.08)"
                    }}>
                        <h3 style={{ margin: "0 0 8px", color: "white", fontWeight: 700, fontSize: "1.05rem" }}>
                            Verify your email{" "}
                            <span style={{ color: "#c084fc" }}>
                                {form.personalEmail?.replace(/(.{2}).*(@.*)/, '$1***$2')}
                            </span>
                        </h3>
                        <p style={{ margin: "0 0 24px", color: "#777", fontSize: "0.85rem", lineHeight: 1.5 }}>
                            A verification code was sent to your personal email. Do not share that code with anyone!
                        </p>

                        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 16 }}>
                            {Array.from({ length: 6 }).map((_, i) => (
                                <input
                                    key={i}
                                    type="text"
                                    maxLength={1}
                                    inputMode="numeric"
                                    value={personalEmailOtp[i] || ''}
                                    onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        const arr = personalEmailOtp.split('');
                                        arr[i] = val;
                                        const next = arr.join('').slice(0, 6);
                                        setPersonalEmailOtp(next);
                                        setPersonalEmailOtpError('');
                                        if (val && i < 5) {
                                            const inputs = e.target.closest('div').querySelectorAll('input');
                                            inputs[i + 1]?.focus();
                                        }
                                    }}
                                    onKeyDown={e => {
                                        if (e.key === 'Backspace' && !personalEmailOtp[i] && i > 0) {
                                            const inputs = e.target.closest('div').querySelectorAll('input');
                                            inputs[i - 1]?.focus();
                                        }
                                    }}
                                    style={{
                                        width: 52, height: 56,
                                        background: personalEmailOtp[i] ? "rgba(139,45,255,0.12)" : "transparent",
                                        border: `2px solid ${personalEmailOtp[i] ? "rgba(139,45,255,0.7)" : "rgba(139,45,255,0.45)"}`,
                                        borderRadius: 12, color: "white", fontSize: "1.3rem",
                                        fontWeight: 700, textAlign: "center", outline: "none",
                                        transition: "border-color 0.15s, background 0.15s"
                                    }}
                                />
                            ))}
                        </div>

                        {personalEmailOtpError && (
                            <p style={{ color: "#ff4b4b", fontSize: "0.8rem", textAlign: "center", margin: "0 0 12px" }}>
                                {personalEmailOtpError}
                            </p>
                        )}

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                            <button
                                onClick={resendPersonalEmailCode}
                                disabled={personalEmailOtpLoading}
                                style={{ background: "none", border: "none", color: "#888", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" }}
                            >
                                Resend
                            </button>
                            <button
                                onClick={verifyPersonalEmailAndComplete}
                                disabled={personalEmailOtpLoading || personalEmailOtp.length < 6}
                                style={{
                                    background: "linear-gradient(30deg, #5E23A4, #9C269D)",
                                    border: "none", color: "white", borderRadius: 20,
                                    padding: "10px 36px", fontWeight: 600,
                                    cursor: (personalEmailOtpLoading || personalEmailOtp.length < 6) ? "not-allowed" : "pointer",
                                    fontSize: "0.9rem",
                                    opacity: (personalEmailOtpLoading || personalEmailOtp.length < 6) ? 0.6 : 1
                                }}
                            >
                                {personalEmailOtpLoading ? '…' : 'Verify'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}