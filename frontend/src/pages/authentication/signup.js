import styles from './authentication.module.css'
import darkMode from '../../Assets/Pictures/LogoDarkMode.png';
import LanguageDropdown from '../../components/pagelayout/languageDrop';
import { useNavigate } from 'react-router-dom';
import { TEXT } from '../../i18n';
import { useState, useEffect } from 'react';



export default function Signup() {
    const navigate = useNavigate();
    const [language, setLanguage] = useState('en');
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
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
            const response = await fetch('http://localhost:8080/api/auth/send-code', {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: form.username, academicEmail: form.academicEmail, personalEmail: form.personalEmail })
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
            const response = await fetch('http://localhost:8080/api/auth/verify-code', {
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
            const response = await fetch('http://localhost:8080/api/auth/signup', {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: form.username,
                    academicEmail: form.academicEmail,
                    personalEmail: form.personalEmail
                    , code: form.code,
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

    }
    const handleReSend = async () => {
        setError('');
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8080/api/auth/send-code', {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: form.username,
                    academicEmail: form.academicEmail,
                    personalEmail: form.personalEmail
                })

            });
            const data = await response.json().catch(() => { });
            if (!response.ok) {
                setError(data?.message || 'Failed to resend verification code.');
                return;
            }

        }catch(error){
            setError('An error occurred. Please try again later.');
        }
        finally{
            setLoading(false);
        }
    }







    const t = (TEXT[language] || TEXT.en).auth.Signup;
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
                            <button className={styles.tabButton} onClick={() => navigate('/login')}>{t.login}</button>
                            <button className={styles.tabButton + " " + styles.activeTab} >{t.signup}</button>
                        </div>
                        <form className={styles.form} onSubmit={handleSubmit}>
                            <div className={styles.formHeader}>
                                <p className={styles.titleOne}>{t.project}</p>
                                <h1 className={styles.titleTwo}>{t.campus}</h1>
                            </div>
                            {error && <p className={styles.error}>{error}</p>}
                            {step === 0 && (<>
                                <input
                                    type="text"
                                    name="username"
                                    placeholder={t.username}
                                    value={form.username}
                                    className={styles.input}
                                    onChange={handleChange}
                                />
                                <input
                                    type="email"
                                    name="academicEmail"
                                    placeholder={t.academicEmail}
                                    value={form.academicEmail}
                                    className={styles.input}
                                    onChange={handleChange}
                                />
                            </>)}
                            {step === 1 && (<>
                                <input
                                    type="text"
                                    name="code"
                                    placeholder="Verification Code"
                                    value={form.code}
                                    className={styles.input}
                                    onChange={handleChange}
                                    inputMode="numeric"
                                />
                                <button type='button' className={styles.resendButton} onClick={handleReSend} disabled={loading}>{t.resendCode}</button>


                            </>)}
                            {step === 2 && (<>
                                <input
                                    type="email"
                                    name="personalEmail"
                                    placeholder={t.personalEmail}
                                    value={form.personalEmail}
                                    className={styles.input}
                                    onChange={handleChange}
                                />

                                <input
                                    type="password"
                                    name="password"
                                    placeholder={t.password}
                                    value={form.password}
                                    className={styles.input}
                                    onChange={handleChange}
                                />
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    placeholder={t.confirmPassword}
                                    value={form.confirmPassword}
                                    className={styles.input}
                                    onChange={handleChange}
                                />
                            </>)}

                            <p className={styles.helpTextTwo}>{t.needHelp.text} <a href='/LandingPage'>{t.needHelp.link}</a>{t.needHelp.afterLink}</p>
                            <button type="submit" className={styles.submitButton} disabled={loading}>
                                {loading ? t.loading : t.submitSignup}</button>
                            <span className={styles.copyright}>{t.copyright}</span>

                        </form>
                    </div>
                </div>
                <div className={styles.footer}>

                </div>

            </div>
        );
    }