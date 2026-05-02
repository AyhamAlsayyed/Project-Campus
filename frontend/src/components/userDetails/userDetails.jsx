import styles from './userDetails.module.css';
import { GraduationCap, Phone, Mail, Building2, BookOpen } from "lucide-react";

export default function UserDetails({ user, hidePill = false }) {
    if (!user) return null;

    const isInstructor = user?.role === 'instructor';

    return (
        <div className={styles.container} style={{ width: "100%", boxSizing: "border-box" }}>
            <div className={styles.recentlyContactedWrap} style={{ width: "100%", boxSizing: "border-box" }}>

                {!hidePill && (
                    <div className={styles.pill}>
                        <p>Details</p>
                    </div>
                )}

                <div className={styles.recentlyContactedWrapper} style={{ width: "100%", boxSizing: "border-box" }}>
                    <div className={styles.contactList} style={{ width: "100%", boxSizing: "border-box" }}>

                        {/* ── Contact ── */}
                        <div className={styles.contactCard} style={{ width: "100%", boxSizing: "border-box" }}>
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
                                {user.university && (
                                    <div className={styles.contactCard} style={{ width: "100%", boxSizing: "border-box" }}>
                                        <div className={styles.detailsSection}>
                                            <h4>Instructor at</h4>
                                            <p>
                                                <Building2 size={16} className={styles.detailIcon} />
                                                {Array.isArray(user.university) ? user.university[0] : user.university}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {user.degree && user.degree.length > 0 && (
                                    <div className={styles.contactCard} style={{ width: "100%", boxSizing: "border-box" }}>
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
                                {user.university && (
                                    <div className={styles.contactCard} style={{ width: "100%", boxSizing: "border-box" }}>
                                        <div className={styles.detailsSection}>
                                            <h4>University</h4>
                                            <p>
                                                <Building2 size={16} className={styles.detailIcon} />
                                                {Array.isArray(user.university) ? user.university[0] : user.university}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {user.degree && user.degree.length > 0 && (
                                    <div className={styles.contactCard} style={{ width: "100%", boxSizing: "border-box" }}>
                                        <div className={styles.detailsSection}>
                                            <h4>Degree</h4>
                                            {user.degree.map((d, i) => (
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