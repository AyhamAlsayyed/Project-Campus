import React from 'react';
import styles from './communitySettingsNav.module.css';
import Setting from '../../Assets/icons/setting.png';

export default function CommunitySettingsNav({ activeTab, setActiveTab, isMobile }) {
  const navItems = [
    { key: 'Community info', label: 'Community info' },
    { key: 'Members', label: 'Members' },
    { key: 'Requests', label: 'Requests' },
    { key: 'Posts', label: 'Posts' },
    { key: 'Delete', label: 'Delete', isDelete: true }
  ];

  const renderSolidIcon = (src, color, width = '20px', height = '20px') => (
    <div
      style={{
        width,
        height,
        backgroundColor: color,
        maskImage: `url(${src})`,
        WebkitMaskImage: `url(${src})`,
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
        display: 'inline-block'
      }}
    />
  );

  if (isMobile) {
    return (
      <div className={styles.mobileTabBar}>
        {navItems.map((item) => {
          const isActive = activeTab?.toLowerCase() === item.key.toLowerCase() ||
            (activeTab === 'Settings' && item.key === 'Community info');
          return (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`${styles.mobileTabItem} ${isActive ? styles.mobileTabItemActive : ''} ${item.isDelete ? styles.mobileTabItemDelete : ''}`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={styles.settingsNavContainer}>
      {/* ── HEADER ── */}
      <div className={styles.settingsNavHeader}>
        {renderSolidIcon(Setting, '#E6E6E6', '25px', '25px')}
        <h2 className={styles.settingsNavTitle}>Admin Settings</h2>
      </div>

      <div className={styles.centeredDivider} />

      {/* ── NAVIGATION LIST ── */}
      <div className={styles.settingsNavList}>
        {navItems.map((item) => {
          const isActive = activeTab?.toLowerCase() === item.key.toLowerCase() ||
                           (activeTab === 'Settings' && item.key === 'Community info');

          let textClass = 'navTextDefault';
          if (isActive) textClass = 'navTextActive';
          else if (item.isDelete) textClass = 'navTextDelete';

          return (
            <div
              key={item.key}
              onClick={() => setActiveTab(item.key)}
             className={`${styles.settingsNavItem} ${isActive ? styles.settingsNavItemActive : ''}`}
            >
              {isActive && (
                <div className={styles.activeArrowWrapper}>
                  <div className={styles.activeGradientArrow} />
                </div>
              )}

              <span className={`${styles.settingsNavText} ${styles[textClass]}`}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}