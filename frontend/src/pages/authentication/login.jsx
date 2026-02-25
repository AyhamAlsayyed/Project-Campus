import styles from './authentication.module.css'
import darkMode from '../../Assets/Pictures/LogoDarkMode.png';
import LanguageDropdown from '../../components/pagelayout/languageDrop';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TEXT } from '../../i18n';

export default function Signup() {
    const navigate = useNavigate();
    const [language, setLanguage] = useState('en');
    const t = (TEXT[language] || TEXT.en).auth.Login;
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const handlesubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:8080/api/auth/login', {
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


        }
        catch (error) {
            setError('An error occurred. Please try again later.');
        }
    }


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
                    <form className={styles.form} onSubmit={handlesubmit}>
                        <div className={styles.formHeader}>
                            <p className={styles.titleOne}>{t.project}</p>
                            <h1 className={styles.titleTwo}>{t.campus}</h1>
                        </div>
                        {error && <p className={styles.error}>{error}</p>}
                        <input
                            type="text"
                            placeholder={t.username}
                            className={styles.input}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder={t.password}
                            className={styles.input}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <div className={styles.rememberMe}>
                            <div className={styles.checkbox}>
                                <input type="checkbox" id="rememberMe" className={styles.checkbox} />
                                <label htmlFor="rememberMe" className={styles.rememberMeLabel}>{t.rememberMe}</label>
                            </div>

                            <p className={styles.helpTextOne}> {t.needHelp.text} {" "} <a href='/LandingPage'>{t.needHelp.link}</a>{t.needHelp.afterLink}</p>
                        </div>

                        <button type="submit" className={styles.submitButton}>{t.submitLogin}</button>
                        <span className={styles.copyright}>{t.copyright}</span>

                    </form>
                </div>
            </div>
            <div className={styles.footer}>

            </div>

        </div>
    );
}