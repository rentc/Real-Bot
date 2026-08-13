'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';

export default function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();

  const links = [
    { name: 'Dashboard', href: '/' },
    { name: 'Customers', href: '/customers' },
    { name: 'Quotations', href: '/quotations' },
    { name: 'Orders', href: '/orders' },
    { name: 'Products & Pricing', href: '/products' },
    { name: 'User Management', href: '/users' },
  ];

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <span className="text-gradient">WRC</span> AI Sales
        </div>
        <button className={styles.closeBtn} onClick={onClose}>
          ✕
        </button>
      </div>
      <nav className={styles.nav}>
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link 
              key={link.name} 
              href={link.href}
              className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
              onClick={onClose}
            >
              {link.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
