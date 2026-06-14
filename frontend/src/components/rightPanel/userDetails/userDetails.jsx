import styles from './userDetails.module.css';
import CollegeIcon from '../../../Assets/icons/college.png';
import CategoryIcon from '../../../Assets/icons/category.png';
import LinkIcon from '../../../Assets/icons/link.png';
import LocationIcon from '../../../Assets/icons/location.png';
import PhoneIcon from '../../../Assets/icons/phone.png';
import MailIcon from '../../../Assets/icons/mail.png';
import StarIcon from '../../../Assets/icons/star.png';

const icon = (src, size = 16) => (
    <img src={src} alt="" width={size} height={size}
        style={{ filter: 'brightness(0) invert(55%)', flexShrink: 0 }} />
);

export default function UserDetails({ user, hidePill = false, darker = false }) {
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
                <div className={`${styles.recentlyContactedWrapper} ${darker ? styles.darkerBg : ''}`} style={{ width: "100%", boxSizing: "border-box" }}>
                    <div className={styles.contactList} style={{ width: "100%", boxSizing: "border-box" }}>
                        <div className={styles.contactCard} style={{ width: "100%", boxSizing: "border-box" }}>
                            <div className={styles.detailsSection} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                {user.average_rating > 0 && (
                                    <p style={{ margin: 0, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: 10 }}>
                                        {icon(StarIcon, 18)}{user.average_rating} / 5
                                    </p>
                                )}
                                {user.page_type && (
                                    <p style={{ margin: 0, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: 10 }}>
                                        {icon(CategoryIcon, 18)}{user.page_type}
                                    </p>
                                )}
                                {primary_phone && (
                                    <p style={{ margin: 0, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: 10 }}>
                                        {icon(PhoneIcon, 18)}{primary_phone}
                                    </p>
                                )}
                                {academic_email && (
                                    <p style={{ margin: 0, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: 10 }}>
                                        {icon(MailIcon, 18)}{academic_email}
                                    </p>
                                )}
                                {user.location && (
                                    <p style={{ margin: 0, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: 10 }}>
                                        {icon(LocationIcon, 18)}{user.location}
                                    </p>
                                )}
                                {user.link && (
                                    <p style={{ margin: 0, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: 10 }}>
                                        {icon(LinkIcon, 18)}
                                        <a href={user.link} target="_blank" rel="noreferrer"
                                            style={{ color: "inherit", textDecoration: "underline" }}>
                                            {user.link.replace(/^https?:\/\//, '')}
                                        </a>
                                    </p>
                                )}
                                {user.page_branch && (
                                    <p style={{ margin: 0, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: 10 }}>
                                        {icon(CollegeIcon, 18)}{user.page_branch}
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

                <div className={`${styles.recentlyContactedWrapper} ${darker ? styles.darkerBg : ''}`} style={{ width: "100%", boxSizing: "border-box" }}>

                    <div className={styles.contactList} style={{ width: "100%", boxSizing: "border-box" }}>

                        <div className={styles.contactCard} style={{ width: "100%", boxSizing: "border-box" }}>
                            <div className={styles.detailsSection}>
                                <h4>Contact</h4>
                                {primary_phone && (
                                    <p>{icon(PhoneIcon)}{primary_phone}</p>
                                )}
                                {secondary_phone && (
                                    <p>{icon(PhoneIcon)}{secondary_phone}</p>
                                )}
                                {academic_email && (
                                    <p>{icon(MailIcon)}{academic_email}</p>
                                )}
                                {personal_email && (
                                    <p>{icon(MailIcon)}{personal_email}</p>
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
                                                {icon(CollegeIcon)}
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
                                                    {icon(CollegeIcon)}
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
                                                {icon(CollegeIcon)}
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
                                                    {icon(CollegeIcon)}
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