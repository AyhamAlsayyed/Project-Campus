import styles from './userDetails.module.css';
import { GraduationCap, Phone, Mail, Building2, BookOpen, Star, MapPin, Link, LayoutGrid } from "lucide-react";

export default function UserDetails({ user, hidePill = false , darker = false }) {
    if (!user) return null;

    const isInstructor = user?.role === 'instructor';
    const isPage = user?.type === 'page';

    const profile = user.profile || {};
    const primary_phone = user.primary_phone || profile.primary_phone || user.phone;
    const secondary_phone = user.secondary_phone || profile.secondary_phone;
    const academic_email = user.academic_email || profile.academic_email || user.email;
    const personal_email = user.personal_email || profile.personal_email;
    const university = user.university || profile.university;
    const degrees = user.degrees || user.degree || [];

    if (isPage) return (
        <div className={styles.container} style={{ width: "100%", boxSizing: "border-box" }}>
            <div className={styles.recentlyContactedWrap} style={{ width: "100%", boxSizing: "border-box" }}>
                {!hidePill && <div className={styles.pill}><p>Details</p></div>}
                <div className={styles.recentlyContactedWrapper} style={{ width: "100%", boxSizing: "border-box"  }}>
                    <div className={styles.contactList} style={{ width: "100%", boxSizing: "border-box" }}>
                        <div className={styles.contactCard} style={{ width: "100%", boxSizing: "border-box" }}>
                            <div className={styles.detailsSection} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                {user.average_rating > 0 && (
                                    <p style={{ margin: 0, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: 10 }}>
                                        <Star size={18} className={styles.detailIcon} />{user.average_rating} / 5
                                    </p>
                                )}
                                {user.page_type && (
                                    <p style={{ margin: 0, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: 10 }}>
                                        <LayoutGrid size={18} className={styles.detailIcon} />{user.page_type}
                                    </p>
                                )}
                                {primary_phone && (
                                    <p style={{ margin: 0, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: 10 }}>
                                        <Phone size={18} className={styles.detailIcon} />{primary_phone}
                                    </p>
                                )}
                                {academic_email && (
                                    <p style={{ margin: 0, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: 10 }}>
                                        <Mail size={18} className={styles.detailIcon} />{academic_email}
                                    </p>
                                )}
                                {user.location && (
                                    <p style={{ margin: 0, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: 10 }}>
                                        <MapPin size={18} className={styles.detailIcon} />{user.location}
                                    </p>
                                )}
                                {user.link && (
                                    <p style={{ margin: 0, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: 10 }}>
                                        <Link size={18} className={styles.detailIcon} />
                                        <a href={user.link} target="_blank" rel="noreferrer"
                                            style={{ color: "inherit", textDecoration: "underline" }}>
                                            {user.link.replace(/^https?:\/\//, '')}
                                        </a>
                                    </p>
                                )}
                                {user.page_branch && (
                                    <p style={{ margin: 0, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: 10 }}>
                                        <Building2 size={18} className={styles.detailIcon} />{user.page_branch}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className={styles.container} style={{ width: "100%", boxSizing: "border-box" }}>
            <div className={styles.recentlyContactedWrap} style={{ width: "100%", boxSizing: "border-box" }}>

                {!hidePill && (
                    <div className={styles.pill}>
                        <p>Details</p>
                    </div>
                )}

                <div className={styles.recentlyContactedWrapper} style={{ width: "100%", boxSizing: "border-box",...(darker && { background: "#2a2a2a" }) }}>
                    <div className={styles.contactList} style={{ width: "100%", boxSizing: "border-box" }}>

                        <div className={styles.contactCard} style={{ width: "100%", boxSizing: "border-box" }}>
                            <div className={styles.detailsSection}>
                                <h4>Contact</h4>
                                {primary_phone && (
                                    <p><Phone size={16} className={styles.detailIcon} />{primary_phone}</p>
                                )}
                                {secondary_phone && (
                                    <p><Phone size={16} className={styles.detailIcon} />{secondary_phone}</p>
                                )}
                                {academic_email && (
                                    <p><Mail size={16} className={styles.detailIcon} />{academic_email}</p>
                                )}
                                {personal_email && (
                                    <p><Mail size={16} className={styles.detailIcon} />{personal_email}</p>
                                )}
                            </div>
                        </div>

                        {isInstructor ? (
                            <>
                                {university && (
                                    <div className={styles.contactCard} style={{ width: "100%", boxSizing: "border-box" }}>
                                        <div className={styles.detailsSection}>
                                            <h4>Instructor at</h4>
                                            <p>
                                                <Building2 size={16} className={styles.detailIcon} />
                                                {Array.isArray(university) ? university[0] : university}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {degrees.length > 0 && (
                                    <div className={styles.contactCard} style={{ width: "100%", boxSizing: "border-box" }}>
                                        <div className={styles.detailsSection}>
                                            <h4>Education</h4>
                                            {degrees.map((d, i) => (
                                                <div key={i} className={styles.degreeItem}>
                                                    <BookOpen size={16} className={styles.detailIcon} />
                                                    <span className={styles.degreeText}>
                                                        {d.university || d.institution || d}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                {university && (
                                    <div className={styles.contactCard} style={{ width: "100%", boxSizing: "border-box" }}>
                                        <div className={styles.detailsSection}>
                                            <h4>University</h4>
                                            <p>
                                                <Building2 size={16} className={styles.detailIcon} />
                                                {Array.isArray(university) ? university[0] : university}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {degrees.length > 0 && (
                                    <div className={styles.contactCard} style={{ width: "100%", boxSizing: "border-box" }}>
                                        <div className={styles.detailsSection}>
                                            <h4>Degree</h4>
                                            {degrees.map((d, i) => (
                                                <div key={i} className={styles.degreeItem}>
                                                    <GraduationCap size={16} className={styles.detailIcon} />
                                                    <span className={styles.degreeText}>
                                                        {d.major ? `${d.major} ${d.degree_type || ''}` : d}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}