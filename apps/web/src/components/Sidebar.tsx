'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { name: 'Dashboard', href: '/' },
    { name: 'Quotations', href: '/quotations' },
    { name: 'Orders', href: '/orders' },
    { name: 'Products & Pricing', href: '/products' },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className="text-gradient">WRC</span> AI Sales
      </div>
      <nav className={styles.nav}>
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link 
              key={link.name} 
              href={link.href}
              className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
            >
              {link.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
