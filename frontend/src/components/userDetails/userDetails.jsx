import styles from './userDetails.module.css';
import { GraduationCap, Phone, Mail, Building2, BookOpen } from "lucide-react";
export default function UserDetails({ user }) {
    if (!user) return null;


    const renderItems = (data, icon) => {
        if (!data) return <p>{icon} N/A</p>;
        const items = Array.isArray(data) ? data : [data];
        return items.map((item, index) => (
            <p key={index}>{icon} {item}</p>
        ));
    };
    const isInstructor = user?.role === 'instructor';

     return (
        <div className={styles.container}>
            <div className={styles.recentlyContactedWrap}>
                <div className={styles.pill}>
                    <p>Details</p>
                </div>

                <div className={styles.recentlyContactedWrapper}>
                    <div className={styles.contactList}>

                        {/* ── Contact ── */}
                        <div className={styles.contactCard}>
                            <div className={styles.detailsSection}>
                                <h4>Contact</h4>
                                {user.phone?.map((p, i) => (
                                    <p key={i}>
                                        <Phone size={16} className={styles.detailIcon} />
                                        {p.phone || p}
                                    </p>
                                ))}
                                {user.email && (
                                    <p>
                                        <Mail size={16} className={styles.detailIcon} />
                                        {user.email}
                                    </p>
                                )}
                            </div>
                        </div>

                        {isInstructor ? (
                            <>
                                {/* ── Instructor at ── */}
                                {user.university && (
                                    <div className={styles.contactCard}>
                                        <div className={styles.detailsSection}>
                                            <h4>Instructor at</h4>
                                            <p>
                                                <Building2 size={16} className={styles.detailIcon} />
                                                {Array.isArray(user.university)
                                                    ? user.university[0]
                                                    : user.university}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* ── Education ── */}
                                {user.degree && user.degree.length > 0 && (
                                    <div className={styles.contactCard}>
                                        <div className={styles.detailsSection}>
                                            <h4>Education</h4>
                                            {user.degree.map((d, i) => (
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
                                {/* ── University ── */}
                                {user.university && (
                                    <div className={styles.contactCard}>
                                        <div className={styles.detailsSection}>
                                            <h4>University</h4>
                                            <p>
                                                <Building2 size={16} className={styles.detailIcon} />
                                                {Array.isArray(user.university)
                                                    ? user.university[0]
                                                    : user.university}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* ── Degree ── */}
                                {user.degree && user.degree.length > 0 && (
                                    <div className={styles.contactCard}>
                                        <div className={styles.detailsSection}>
                                            <h4>Degree</h4>
                                            {user.degree.map((d, i) => (
                                                <div key={i} className={styles.degreeItem}>
                                                    <GraduationCap size={16} className={styles.detailIcon} />
                                                    <span className={styles.degreeText}>
                                                        {d.major
                                                            ? `${d.major} ${d.degree_type || ''}`
                                                            : d}
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