import styles from './authentication.module.css'
import darkMode from '../../Assets/Pictures/LogoDarkMode.png';
import LanguageDropdown from '../../components/pagelayout/languageDrop';
import { useNavigate } from 'react-router-dom';
import { TEXT } from '../../i18n';
import { useState, useEffect } from 'react';



export default function Signup() {
    const navigate = useNavigate();
    const [language, setLanguage] = useState('en');
    const [form, setForm] = useState({
        username: '',
        email: ''

    })
    const [error, setError] = useState('');
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('http://localhost:8080/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(form),
            });
            const data = await response.json();
            if (!response.ok) {
                setError(data.message || 'Signup failed');
                return;
            }
            navigate('/login');

        } catch (error) {
            setError('An error occurred. Please try again later.');
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
                            name="email"
                            placeholder={t.email}
                            value={form.email}
                            className={styles.input}
                            onChange={handleChange}
                        />
                        <p className={styles.helpTextTwo}>{t.needHelp.text} <a href='/LandingPage'>{t.needHelp.link}</a>{t.needHelp.afterLink}</p>
                        <button type="submit" className={styles.submitButton}>{t.submitSignup}</button>
                        <span className={styles.copyright}>{t.copyright}</span>

                    </form>
                </div>
            </div>
            <div className={styles.footer}>

            </div>

        </div>
    );
}