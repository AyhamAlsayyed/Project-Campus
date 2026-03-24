
import styles from './communities.module.css';
import Header from '../../components/pagelayout/header/header'
import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav';
import { useState } from 'react';


export default function Community(){
    const [theme, setTheme] = useState('dark');
    const [user, setUser] = useState(null)
    const toggleTheme = () => { setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));}
    return(
        <div className={styles.darkContainer}>
            <div className={`${styles.header} ${styles.page}`}>
                 <Header theme={theme} toggleTheme={toggleTheme} user={user}  />

            </div>
            <div className={`${styles.content} ${styles.page}`}>
                <SideBarNav theme={theme} toggleTheme={toggleTheme} user={user} />
                <div className={styles.mainContent}>
                    <h1 className={styles.title}>
                        Looking for <span className={styles.highlight}>communities</span> to be part of?
                    </h1>
                    
                </div>


            </div>
        </div>
    )
}