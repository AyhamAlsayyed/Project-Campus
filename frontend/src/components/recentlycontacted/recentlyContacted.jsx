import { useState, useEffect } from 'react';
import styles from './recentlyContacted.module.css';
import { Search, MessageSquare } from "lucide-react"





export default function FriendsSuggestion() {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadContacts = async () => {
        const token = localStorage.getItem("access");
        if (!token) {
            setError("No access token found");
            setLoading(false);
            return;
        }
        try {
            const res = await fetch("http://localhost:8000/api/friends/recently-contacted/", {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data.message || "Failed to load contacts");
                setContacts([]);
                return;
            }
            setContacts(Array.isArray(data) ? data : []);
        } catch (err) {
            setError("Failed to load contacts");
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        loadContacts();
    }, []);



    return (
        <div className={styles.container}>
            <div className={styles.recentlyContactedWrap}>
                <div className={styles.pill}>
                    <p>Recently Contacted</p>

                </div>
                <div className={styles.recentlyContactedWrapper}>

                    <div className={styles.searchContactWrap}>
                        <Search size={16} color="#888" className={styles.searchIcon} />
                        <input type="text" placeholder='Searching for someone?' className={styles.searchInput} />


                    </div>
                    <div className={styles.contactList}>
                        {contacts.map((contact) => (
                            <div key={contact.id} className={styles.contactCard}>
                                <div className={styles.contactLeft}>
                                    <div className={styles.contactAvatarWrap}>
                                        <img
                                            src={contact.avatar}
                                            alt={contact.name}
                                            className={styles.contactAvatar}
                                        />
                                        <span
                                            className={`${styles.statusDot} ${contact.status === "Online"
                                                ? styles.online
                                                : contact.status === "Do Not Disturb"
                                                    ? styles.dnd
                                                    : styles.offline
                                                }`}
                                        />
                                    </div>

                                    <div className={styles.contactInfo}>
                                        <div className={styles.contactTopLine}>
                                            <span className={styles.contactStatus}>{contact.status}</span>
                                        </div>

                                        <p className={styles.contactName}>{contact.name}</p>
                                    </div>
                                </div>

                                <div className={styles.contactRight}>
                                    <p className={styles.contactMessage}>{contact.message}</p>
                                    <div className={styles.contactBottomRow}>
                                        <span className={styles.contactTime}>{contact.time}</span>
                                        <MessageSquare size={16} className={styles.contactMessageIcon} />
                                    </div>
                                </div>
                            </div>
                        ))}

                    </div>


                </div>
            </div>


        </div>
    )
}