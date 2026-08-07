import styles from './TopNav.module.css';

export default function TopNav() {
  return (
    <header className={styles.topNav}>
      <div className={styles.profile}>
        <div className={styles.name}>Admin User</div>
        <div className={styles.avatar}>A</div>
      </div>
    </header>
  );
}
