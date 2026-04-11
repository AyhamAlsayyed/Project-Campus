import styles from './userDetails.module.css';

export default function UserDetails({ user }) {
    if (!user) return null;

   
    const renderItems = (data, icon) => {
        if (!data) return <p>{icon} N/A</p>;
        const items = Array.isArray(data) ? data : [data];
        return items.map((item, index) => (
            <p key={index}>{icon} {item}</p>
        ));
    };

    return (
        <div className={styles.container}>
            <div className={styles.recentlyContactedWrap}>
                <div className={styles.pill}>
                    <p>Details</p>
                </div>

                <div className={styles.recentlyContactedWrapper}>
                    <div className={styles.contactList}>
                        
                        <div className={styles.contactCard}>
                            <div className={styles.detailsSection}>
                                <h4>Contact</h4>
                                <p>📞 {user.phone || "N/A"}</p>
                                <p>✉️ {user.email || "N/A"}</p>
                            </div>
                        </div>

                        <div className={styles.contactCard}>
                            <div className={styles.detailsSection}>
                                <h4>University</h4>
                                {renderItems(user.university, "🏛️")}
                            </div>
                        </div>

                        <div className={styles.contactCard}>
                            <div className={styles.detailsSection}>
                                <h4>Degrees</h4>
                                {renderItems(user.degree, "📜")}
                            </div>
                        </div>

                        <div className={styles.contactCard}>
                            <div className={styles.detailsSection}>
                                <h4>Hobbies</h4>
                                {renderItems(user.hobbies, "🎨")}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}