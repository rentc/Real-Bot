import styles from './TopNav.module.css';

export default function TopNav({ toggleSidebar }: { toggleSidebar?: () => void }) {
  return (
    <header className={styles.topNav}>
      <button className={styles.menuBtn} onClick={toggleSidebar}>
        ☰
      </button>
      <div className={styles.profile}>
        <div className={styles.name}>Admin User</div>
        <div className={styles.avatar}>A</div>
        <a href="/api/auth/logout" style={{ marginLeft: '16px', fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'underline' }}>Sign Out</a>
      </div>
    </header>
  );
}
