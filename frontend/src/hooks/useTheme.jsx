import { useState, useEffect } from 'react';

export default function useTheme() {
    const [theme, setTheme] = useState(
        () => localStorage.getItem('theme') || 'dark'  
    );

    useEffect(() => {
        localStorage.setItem('theme', theme);           
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

    return { theme, toggleTheme };
}