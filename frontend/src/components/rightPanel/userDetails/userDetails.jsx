import styles from './userDetails.module.css';
import CollegeIcon  from '../../../Assets/icons/college.png';
import CategoryIcon from '../../../Assets/icons/category.png';
import LinkIcon     from '../../../Assets/icons/link.png';
import LocationIcon from '../../../Assets/icons/location.png';
import PhoneIcon    from '../../../Assets/icons/phone.png';
import MailIcon     from '../../../Assets/icons/mail.png';
import StarIcon     from '../../../Assets/icons/star.png';

const DetailIcon = ({ src, size = 16 }) => (
    <img src={src} alt="" width={size} height={size}
        style={{ filter: 'brightness(0) invert(55%)', flexShrink: 0 }} />
);

function Section({ title, children, noBorder }) {
    return (
        <div className={`${styles.section} ${noBorder ? styles.noDivider : ''}`}>
            <div className={styles.sectionContent}>
                {title && <h4 className={styles.sectionTitle}>{title}</h4>}
                {children}
            </div>
        </div>
    );
}

function Row({ icon, children }) {
    return (
        <p className={styles.sectionRow}>
            <DetailIcon src={icon} />
            {children}
        </p>
    );
}

export default function UserDetails({ user, hidePill = false, darker = false, noBorder = false }) {
    if (!user) return null;

    const isInstructor = user?.role === 'instructor';
    const isPage       = user?.type === 'page';
    const profile      = user.profile || {};

    const primaryPhone   = user.primary_phone   || profile.primary_phone   || user.phone;
    const secondaryPhone = user.secondary_phone || profile.secondary_phone;
    const academicEmail  = user.academic_email  || profile.academic_email  || user.email;
    const personalEmail  = user.personal_email  || profile.personal_email;
    const university     = user.university      || profile.university;
    const degrees        = user.degrees         || user.degree             || [];

    const cardClass = [
        styles.detailsCard,
        noBorder ? styles.transparent : '',
        darker && !noBorder ? styles.darker : '',
    ].filter(Boolean).join(' ');

    const wrapClass = [
        styles.detailsWrap,
        noBorder ? styles.noBorder : '',
    ].filter(Boolean).join(' ');

    if (isPage) return (
        <div className={styles.userDetailsRoot}>
            <div className={wrapClass}>
                {!hidePill && <div className={styles.detailsPill}><p>Details</p></div>}
                <div className={cardClass}>
                    <div className={styles.sectionList}>
                        <Section noBorder={noBorder}>
                            {user.average_rating > 0 && <Row icon={StarIcon}>{user.average_rating} / 5</Row>}
                            {user.page_type        && <Row icon={CategoryIcon}>{user.page_type}</Row>}
                            {primaryPhone          && <Row icon={PhoneIcon}>{primaryPhone}</Row>}
                            {academicEmail         && <Row icon={MailIcon}>{academicEmail}</Row>}
                            {user.location         && <Row icon={LocationIcon}>{user.location}</Row>}
                            {user.link && (
                                <Row icon={LinkIcon}>
                                    <a href={user.link} target="_blank" rel="noreferrer"
                                        style={{ color: "inherit", textDecoration: "underline" }}>
                                        {user.link.replace(/^https?:\/\//, '')}
                                    </a>
                                </Row>
                            )}
                            {user.page_branch && <Row icon={CollegeIcon}>{user.page_branch}</Row>}
                        </Section>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className={styles.userDetailsRoot}>
            <div className={wrapClass}>
                {!hidePill && <div className={styles.detailsPill}><p>Details</p></div>}
                <div className={cardClass}>
                    <div className={styles.sectionList}>

                        {/* Contact */}
                        <Section title="Contact" noBorder={noBorder}>
                            {primaryPhone   && <Row icon={PhoneIcon}>{primaryPhone}</Row>}
                            {secondaryPhone && <Row icon={PhoneIcon}>{secondaryPhone}</Row>}
                            {academicEmail  && <Row icon={MailIcon}>{academicEmail}</Row>}
                            {personalEmail  && <Row icon={MailIcon}>{personalEmail}</Row>}
                        </Section>

                        {/* University / Instructor at */}
                        {university && (
                            <Section title={isInstructor ? 'Instructor at' : 'University'} noBorder={noBorder}>
                                <Row icon={CollegeIcon}>
                                    {Array.isArray(university) ? university[0] : university}
                                </Row>
                            </Section>
                        )}

                        {/* Education / Degree */}
                        {degrees.length > 0 && (
                            <Section title={isInstructor ? 'Education' : 'Degree'} noBorder={noBorder}>
                                {degrees.map((d, i) => (
                                    <div key={i} className={styles.degreeRow}>
                                        <DetailIcon src={CollegeIcon} />
                                        <span className={styles.degreeLabel}>
                                            {isInstructor
                                                ? (d.university || d.institution || d)
                                                : (d.major ? `${d.major} ${d.degree_type || ''}` : d)
                                            }
                                        </span>
                                    </div>
                                ))}
                            </Section>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}