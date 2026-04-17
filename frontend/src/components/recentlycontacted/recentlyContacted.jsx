import { useState, useEffect } from 'react';
import styles from './recentlyContacted.module.css';
import { Search, MessageSquare } from "lucide-react"
import { useNavigate } from 'react-router-dom';

export default function FriendsSuggestion() {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const loadContacts = async () => {
        const token = localStorage.getItem("access");
        if (!token) {
            setError("No access token found");
            setLoading(false);
            return;
        }
        try {
            const res = await fetch("http://localhost:8000/api/friends/recently_contacted/", {
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
            setContacts(
                (Array.isArray(data) ? data : []).map(contact => ({
                    ...contact,
                    name: contact.is_group
                        ? contact.group_name || contact.name
                        : contact.name
                }))
            );
        } catch (err) {
            setError("Failed to load contacts");
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        loadContacts();
    }, []);
    const formatTime = (dateString) => {
        if (!dateString) return "";

        const date = new Date(dateString);
        if (isNaN(date)) return "";

        const now = new Date();
        const diff = Math.floor((now - date) / 1000);

        if (diff < 60) return "Just now";

        const mins = Math.floor(diff / 60);
        if (mins < 60) return `${mins} min ago`;

        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours} hr ago`;

        const days = Math.floor(hours / 24);
        return `${days} d ago`;
    };



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
                        {contacts.map((contact, index) => (
                            <div key={contact.id || index}>
                                <div
                                    className={styles.contactCard}
                                    onClick={() => {
                                        console.log("Navigating to ID:", contact);
                                        navigate(`/chats/${contact.id}`);
                                    }}
                                >
                                    <div className={styles.contactLeft}>
                                        <div className={styles.contactAvatarWrap}>
                                            <img
                                                src={contact.avatar}
                                                alt={contact.name}
                                                className={styles.contactAvatar}
                                            />
                                            {!contact.is_group && (
                                                <span
                                                    className={`${styles.statusDot} ${contact.status === "Online"
                                                        ? styles.online
                                                        : contact.status === "Do Not Disturb"
                                                            ? styles.dnd
                                                            : styles.offline
                                                        }`}
                                                />
                                            )}

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
                                            <span className={styles.contactTime}>
                                                {formatTime(contact.time)}
                                            </span>
                                            <MessageSquare size={16} className={styles.contactMessageIcon} />
                                        </div>
                                    </div>
                                </div>

                                {/* Divider is now a sibling to .contactCard, appearing below it */}
                                {index !== contacts.length - 1 && (
                                    <div className={styles.divider} />
                                )}
                            </div>
                        ))}
                    </div>


                </div>
            </div>


        </div>
    )
}
