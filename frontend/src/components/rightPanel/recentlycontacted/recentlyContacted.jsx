import { useState, useEffect } from 'react';
import styles from './recentlyContacted.module.css';
import { Search, MessageSquare } from "lucide-react"
import { useNavigate } from 'react-router-dom';
import Messages from '../../../Assets/icons/messages.png'
import StatusDot from '../../presence/StatusDot';
import { usePresence } from '../../../context/presenceContext';
import API from '../../../config';
import DefaultPfp from '../../../Assets/icons/default-pfp.png';
function ChatStatusLabel({ userId }) {
    const { onlineUsers } = usePresence();
    const status = onlineUsers[String(userId)] ?? 'offline';
    const label = status === 'online' ? 'Online' : status === 'away' ? 'Away' : status === 'dnd' ? 'Do Not Disturb' : 'Offline';
    return (
        <span className={styles.contactStatus}>
            {label}
        </span>
    );
}
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
            const res = await fetch(`${API}/api/friends/recently_contacted/`, {
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
            const unique = (Array.isArray(data) ? data : [])
                .reduce((acc, contact) => {
                    const key = contact.name + contact.avatar;
                    const existing = acc.find(c => c.name + c.avatar === key);
                    if (!existing) {
                        acc.push(contact);
                    } else if (contact.time && (!existing.time || new Date(contact.time) > new Date(existing.time))) {
                        const idx = acc.indexOf(existing);
                        acc[idx] = contact;
                    }
                    return acc;
                }, []);
            setContacts(unique.map(contact => ({
                ...contact,
                name: contact.is_group ? contact.group_name || contact.name : contact.name,
                avatar: contact.avatar
                    ? (contact.avatar.startsWith('http') ? contact.avatar : `${API}${contact.avatar}`)
                    : null,
                is_page: contact.is_page || false,
            })));
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
                                        <div className={styles.contactAvatarWrap} style={{ position: 'relative' }}>
                                            <img
                                                src={contact.avatar || DefaultPfp}
                                                alt={contact.name}
                                                className={`${styles.contactAvatar}${!contact.avatar ? ' defaultPfp' : ''}`}
                                                onError={e => { e.currentTarget.src = DefaultPfp; e.currentTarget.classList.add('defaultPfp'); }}
                                            />
                                            {!contact.is_group && !contact.is_page && (
                                                <span style={{ position: 'absolute', bottom: 0, right: 0, borderRadius: '50%' }}>
                                                    <StatusDot userId={contact.other_member_id} size="sm" />
                                                </span>
                                            )}
                                        </div>

                                        <div className={styles.contactInfo}>
                                            <div className={styles.contactTopLine}>
                                                {!contact.is_page && <ChatStatusLabel userId={contact.other_member_id} />}
                                            </div>
                                            <p className={styles.contactName}>{contact.name}</p>
                                        </div>
                                    </div>

                                    <div className={styles.contactRight}>
                                        <div className={styles.contactTextCol}>
                                            <p className={styles.contactMessage}>{contact.message}</p>
                                            <span className={styles.contactTime}>
                                                {formatTime(contact.time)}
                                            </span>
                                        </div>
                                        <img
                                            src={Messages}
                                            alt="message"
                                            width={20}
                                            height={20}
                                            className={styles.messageIcon} style={{ flexShrink: 0 }}
                                        />
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
