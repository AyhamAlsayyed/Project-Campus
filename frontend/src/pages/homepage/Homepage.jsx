
import styles from './Homepage.module.css'
import darkModeIcon from '../../Assets/Pictures/LogoDarkMode.png'

import ThemeToggler from '../../components/pagelayout/themeToggle';
import { useState } from 'react';
import { MessageSquare, Bell, UserCircle, Search } from "lucide-react"
import {
  Home,
  Users,
  GraduationCap,
  Calendar,
  Info,
  FileText,
  HelpCircle
} from "lucide-react";


export default function Homepage() {
    const [theme, setTheme] = useState("dark");
    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
    };
    return (
        <div className={styles.darkContainer}>
            <div className={styles.header}>
                <div className={styles.headerInner}>
                    <div className={styles.headerLeft}>
                        <img src={darkModeIcon} alt="Dark Mode Icon" className={styles.darkModeIcon} />
                        <h1 className={styles.title}>CAMPUS</h1>
                    </div>
                    <div className={styles.headerCenter}>
                        <div className={styles.searchWrap}>
                            <Search className={styles.searchIcon} size={24} color="#333" />
                            <input className={styles.searchInput} type="text" placeholder="What are you looking for?" />
                        </div>

                    </div>

                    <div className={styles.headerRight}>
                        <ThemeToggler theme={theme} toggleTheme={toggleTheme} />
                        <button className={styles.iconButton}><MessageSquare size={24} color="#333" /></button>
                        <button className={styles.iconButton}><Bell size={24} color="#333" /></button>
                        <button className={styles.iconButton}><UserCircle size={24} color="#333" /></button>
                    </div>

                </div>
            </div>
            <div className={styles.content}>
                <div className={styles.sideBarNav}>
                    <button className={styles.sideBarButton}><Home size={24} color="#333" />Home page</button>
                    <button className={styles.sideBarButton}><Users size={24} color="#333" /> Communities</button>
                    <button className={styles.sideBarButton}><GraduationCap size={24} color="#333" /> Universities</button>
                    <button className={styles.sideBarButton}><Calendar size={24} color="#333" />Events</button>
                    <button className={styles.sideBarButton}><Info size={24} color="#333" />About us</button>
                    <button className={styles.sideBarButton}><FileText size={24} color="#333" />Privacy Policy</button>
                    <button className={styles.sideBarButton}><HelpCircle size={24} color="#333" />Help</button>

                </div>

            </div>


        </div >

    );
}
