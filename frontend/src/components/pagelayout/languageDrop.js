import styles from './languageDrop.module.css'
import { useState } from 'react';

export default function LanguageDropDown({ language, onChange }) {
    const [open, setOpen] = useState(false);
    return (
        <div className={styles.langWrapper}>
            <button className={styles.langButton} onClick={() => setOpen((o) => !o)}>{language == 'en' ? "English" : "العربية"} <span className={styles.caret}>▾</span></button>
            {open && (
                <div className={styles.langDropdown}>
                    <button onClick={() => { onChange('en'); setOpen(false) }}>English</button>
                    <button onClick={() => { onChange('ar'); setOpen(false) }}>العربية</button>
                </div>
            )}
        </div>

    );





}
