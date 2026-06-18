import styles from './authentication.module.css';
import darkMode from '../../Assets/Pictures/LogoDarkMode.png';
import lightMode from '../../Assets/Pictures/LogoLightMode.png';
import LanguageDropdown from '../../components/pagelayout/languageDrop';
import ThemeToggle from '../../components/pagelayout/themeToggle';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TEXT } from '../../i18n';
import imageOne from '../../Assets/Pictures/login-1.png';
import imageTwo from '../../Assets/Pictures/login-2.png';
import imageThree from '../../Assets/Pictures/login-3.png';
import imageFour from '../../Assets/Pictures/login-4.png';
import Stars from '../../Assets/icons/stars.png';
import API from '../../config'
import useTheme from '../../hooks/useTheme';
export default function Login() {
    const navigate = useNavigate();
    const [language, setLanguage] = useState('en');
    const { theme, toggleTheme } = useTheme();

    const t = (TEXT[language] || TEXT.en).auth.Login;
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showExpiredPopup, setShowExpiredPopup] = useState(false);
    const [subscribing, setSubscribing] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotPasswordStep, setForgotPasswordStep] = useState(1);
    const [resetEmail, setResetEmail] = useState('');
    const [resetOtp, setResetOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [popupError, setPopupError] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [resetLoading, setResetLoading] = useState(false);


    const closeForgotPasswordPopup = () => {
        setShowForgotPassword(false);
        setForgotPasswordStep(1);
        setResetEmail('');
        setResetOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setPopupError('');
    };
    const handleForgotPasswordFlow = async (e) => {
        e.preventDefault();
        setPopupError('');

        if (forgotPasswordStep === 1) {
            try {
                const res = await fetch(`${API}/api/auth/send_code/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: resetEmail }),
                });
                const data = await res.json();
                if (!res.ok) {
                    setPopupError(data.message || data.error || 'Failed to send code.');
                    return;
                }
                setForgotPasswordStep(2);
            } catch {
                setPopupError('Something went wrong. Please try again.');
            }
        }

        else if (forgotPasswordStep === 2) {
            if (resetOtp.length < 6) {
                setPopupError('Please enter the full 6-digit code.');
                return;
            }
            try {
                const res = await fetch(`${API}/api/auth/verify_code/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: resetEmail, code: resetOtp }),
                });
                const data = await res.json();
                if (!res.ok) {
                    setPopupError(data.message || data.error || 'Invalid or expired code.');
                    return;
                }

                if (data.token) setResetToken(data.token);
                setForgotPasswordStep(3);
            } catch {
                setPopupError('Something went wrong. Please try again.');
            }
        }

        else if (forgotPasswordStep === 3) {
            if (newPassword !== confirmPassword) {
                setPopupError('Passwords do not match.');
                return;
            }
            try {
                const res = await fetch(`${API}/api/auth/change-password/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: resetEmail,
                        code: resetOtp,
                        new_password: newPassword,
                        ...(resetToken ? { token: resetToken } : {}),
                    }),
                });
                const data = await res.json();
                if (!res.ok) {
                    setPopupError(data.message || data.error || 'Failed to reset password.');
                    return;
                }
                closeForgotPasswordPopup();
            } catch {
                setPopupError('Something went wrong. Please try again.');
            }
        }
    };



    const handleSubscribe = async (plan) => {
        try {
            setSubscribing(true);
            const token = localStorage.getItem("access");
            const res = await fetch(`${API}/api/subscriptions/subscribe/`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ plan })
            });
            if (res.ok) {
                setShowExpiredPopup(false);
                navigate('/home');
            }
        } catch (e) { console.error(e); }
        finally { setSubscribing(false); }
    };

    const slides = [
        { image: imageOne, },
        { image: imageTwo, },
        { image: imageThree, },
        { image: imageFour, }
    ];
    const [currentIndex] = useState(0);
    const currentSlide = slides[currentIndex];

    const handlesubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API}/api/auth/login/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });
            const data = await response.json();
            console.log('Login response:', data);
            if (!response.ok) {
                setError(data.message || 'Login failed');
                return;
            }
            if (data.access && data.refresh) {
                localStorage.setItem("access", data.access);
                localStorage.setItem("refresh", data.refresh);
                localStorage.setItem("user_type", data.user.user_type ?? '');
                localStorage.setItem("user_id", data.user.id);
                localStorage.setItem("login_user", JSON.stringify(data.user));
                localStorage.setItem("is_premium", data.user.is_premium ? 'true' : 'false'); 
            } else {
                setError("No tokens returned from server");
                return;
            }
            const subRes = await fetch(`${API}/api/subscriptions/current/`, {
                headers: { Authorization: `Bearer ${data.access}` }
            });

            if (subRes.ok) {
                const subData = await subRes.json();
                const isExpired = !subData?.is_active;
                if (isExpired) {
                    setShowExpiredPopup(true);
                    return;
                }
            }

            navigate('/home');

        }
        catch (error) {
            setError('An error occurred. Please try again later.');
        }
    }



    useEffect(() => {
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    }, [language]);


    return (
        <div className={`${theme === 'dark' ? styles.darkContainer : styles.lightContainer} max-lg:!overflow-auto`}>

            <div className={`${styles.header} max-lg:!px-6 max-lg:!py-4 max-lg:!gap-4`}>
                <img src={theme === 'dark' ? darkMode : lightMode} alt="Campus Logo" className={`${styles.darkModeImage} max-lg:!h-12`} />
                <button className={`${styles.homeButton} max-lg:!text-xl max-lg:!h-auto`} onClick={() => navigate('/')}>{t.homepage}</button>
                <LanguageDropdown language={language} onChange={setLanguage} />
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
                                {t.needHelp.text}{' '}
                                <button
                                    type="button"
                                    onClick={() => setShowForgotPassword(true)}
                                    className="bg-transparent border-none p-0 cursor-pointer hover:underline"
                                    style={{ color: 'inherit', font: 'inherit', display: 'inline' }}
                                >
                                    {t.needHelp.link}
                                </button>
                                {t.needHelp.afterLink}
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
                                {t.needHelp.text}{' '}
                                <button
                                    type="button"
                                    onClick={() => setShowForgotPassword(true)}
                                    className="bg-transparent border-none p-0 cursor-pointer hover:underline"
                                    style={{ color: 'inherit', font: 'inherit', display: 'inline' }}
                                >
                                    {t.needHelp.link}
                                </button>
                                {t.needHelp.afterLink}
                            </p>
                        </div>
                        <button type="submit" className={styles.submitButton}>{t.submitLogin}</button>
                        <span className={styles.copyright}>{t.copyright}</span>
                    </form>
                </div>

            </div>

            <div className={`${styles.footer}  lg:!block`}></div>
            {showExpiredPopup && (
                <div className={styles.expiredOverlay}>
                    <div style={{ position: 'relative', display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
                        <span className={styles.expiredHeading}>
                            Your subscription has expired — choose a plan to continue
                        </span>

                        {/* Basic Card */}
                        <div className={styles.basicCard}>
                            <div className={styles.cardHeader}>
                                <span className={styles.basicTitle}>BASIC</span>
                                <span className={styles.subText}>Subscription</span>
                            </div>
                            <ul className={styles.featuresList}>
                                <li>Exist on the platform</li>
                                <li>Your own identity and content.</li>
                                <li>Join communities.</li>
                                <li>Create events.</li>
                                <li>Create posts and interact with others.</li>
                                <li>Create and run promotions.</li>
                            </ul>
                            <div className={styles.priceContainerBasic}>
                                <button
                                    onClick={() => handleSubscribe('basic')}
                                    disabled={subscribing}
                                    className={styles.priceBtn}
                                >
                                    $14.99
                                </button>
                                <span className={styles.perMonthText}>/month</span>
                            </div>
                        </div>

                        {/* Premium Card */}
                        <div className={styles.premiumCard}>
                            <div className={styles.cardHeader}>
                                <img src={Stars} alt="stars" className={styles.starsIconSmall} />
                                <span className={styles.premiumTitleCard}>PREMIUM</span>
                                <span className={styles.subText}>Subscription</span>
                            </div>
                            <ul className={styles.featuresList}>
                                <li>Exist on the platform</li>
                                <li>Your own identity and content.</li>
                                <li>Join communities.</li>
                                <li>Create events.</li>
                                <li>Create posts and interact with others.</li>
                                <li>Create and run promotions.</li>
                            </ul>
                            <div className={styles.divider} />
                            <ul className={`${styles.featuresList} ${styles.pinkList}`}>
                                <li>Verification badge.</li>
                                <li>Instant community creation.</li>
                                <li>Higher priority in feed.</li>
                                <li>16% Subscription discount.</li>
                            </ul>
                            <div className={styles.premiumFooter}>
                                <div className={styles.premiumPriceBox}>
                                    <div className={styles.priceColumn}>
                                        <span className={styles.oldPrice}>$29.99</span>
                                        <button
                                            onClick={() => handleSubscribe('premium')}
                                            disabled={subscribing}
                                            className={styles.priceBtn}
                                        >
                                            $24.99
                                        </button>
                                    </div>
                                    <span className={styles.perMonthText}>/month</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showForgotPassword && (
                <div className={styles.expiredOverlay}>
                    <div className={styles.forgotPasswordCard}>

                        <div className={styles.popupHeader}>
                            <span className={styles.stepTitle}>
                                {forgotPasswordStep === 1 && "Forgot Password?"}
                                {forgotPasswordStep === 2 && "Enter Verification Code"}
                                {forgotPasswordStep === 3 && "Create New Password"}
                            </span>

                            {forgotPasswordStep === 1 && (
                                <span className={styles.subText}>
                                    Enter your email address and we'll send you a recovery link.
                                </span>
                            )}
                            {forgotPasswordStep === 2 && (
                                <p className={styles.instructionText}>
                                    A verification code was sent to your email. Do not share that code with anyone!
                                </p>
                            )}
                            {forgotPasswordStep === 3 && (
                                <span className={styles.subText}>
                                    Please enter your new password below.
                                </span>
                            )}
                        </div>

                        <form onSubmit={handleForgotPasswordFlow} className={styles.popupForm}>

                            {/* POPUP SPECIFIC ERROR RENDERING */}
                            {popupError && <p className={styles.popupError}>{popupError}</p>}

                            {/* STEP 1: EMAIL INPUT */}
                            {forgotPasswordStep === 1 && (
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    className={styles.resetInput}
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    required
                                />
                            )}

                            {/* STEP 2: 6-DIGIT OTP INPUTS */}
                            {forgotPasswordStep === 2 && (
                                <div className={styles.otpContainer}>
                                    {resetOtp.padEnd(6, ' ').split('').map((d, i) => (
                                        <input
                                            key={i}
                                            type="text"
                                            maxLength={1}
                                            inputMode="numeric"
                                            value={resetOtp[i] || ''}
                                            onChange={e => {
                                                const val = e.target.value.replace(/\D/g, '');
                                                const arr = resetOtp.split('');
                                                arr[i] = val;
                                                const next = arr.join('').slice(0, 6);
                                                setResetOtp(next);

                                                if (val && i < 5) {
                                                    const inputs = e.target.closest('div').querySelectorAll('input');
                                                    inputs[i + 1]?.focus();
                                                }
                                            }}
                                            onKeyDown={e => {
                                                if (e.key === 'Backspace' && !resetOtp[i] && i > 0) {
                                                    const inputs = e.target.closest('div').querySelectorAll('input');
                                                    inputs[i - 1]?.focus();
                                                }
                                            }}
                                            className={`${styles.otpInput} ${resetOtp[i] ? styles.otpInputFilled : styles.otpInputEmpty}`}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* STEP 3: NEW PASSWORD INPUTS */}
                            {forgotPasswordStep === 3 && (
                                <>
                                    <input
                                        type="password"
                                        placeholder="New Password"
                                        className={styles.darkInput}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                    />
                                    <input
                                        type="password"
                                        placeholder="Confirm Password"
                                        className={styles.darkInput}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </>
                            )}

                            {/* DYNAMIC FLOW NAVIGATION BUTTONS */}
                            <div className={styles.actionButtons}>
                                <button
                                    type="button"
                                    onClick={closeForgotPasswordPopup}
                                    className={styles.cancelBtn}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className={styles.confirmBtn} disabled={resetLoading}>
                                    {resetLoading ? 'Loading...' :
                                        forgotPasswordStep === 1 ? 'Send Code' :
                                            forgotPasswordStep === 2 ? 'Verify Code' :
                                                'Confirm'
                                    }
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}