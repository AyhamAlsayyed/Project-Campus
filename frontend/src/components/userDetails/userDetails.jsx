import styles from './userDetails.module.css';
import { GraduationCap, Phone, Mail, Building2, BookOpen } from "lucide-react";

export default function UserDetails({ user, hidePill = false }) {
    if (!user) return null;

    const isInstructor = user?.role === 'instructor';
    
    // Flatten profile fields
    const profile = user.profile || {};
    const primary_phone = user.primary_phone || profile.primary_phone;
    const secondary_phone = user.secondary_phone || profile.secondary_phone;
    const academic_email = user.academic_email || profile.academic_email;
    const personal_email = user.personal_email || profile.personal_email;
    const university = user.university || profile.university;
    const degrees = user.degrees || user.degree || [];

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