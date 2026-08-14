'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="layout-container">
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <TopNav toggleSidebar={toggleSidebar} />
      
      {/* Overlay for mobile when sidebar is open */}
      {isSidebarOpen && (
        <div 
          className="mobile-overlay" 
          onClick={closeSidebar}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            zIndex: 15,
            backdropFilter: 'blur(4px)',
          }}
        />
      )}

      <main className="main-content">
        {children}
      </main>
      
      <style jsx global>{`
        .layout-container {
          display: flex;
          min-height: 100vh;
        }

        .main-content {
          flex: 1;
          min-width: 0;
          margin-left: var(--sidebar-width);
          padding: calc(var(--header-height) + 32px) 32px 32px 32px;
          min-height: 100vh;
          transition: margin-left 0.3s ease;
        }

        @media (max-width: 768px) {
          .main-content {
            margin-left: 0;
            padding: calc(var(--header-height) + 16px) 16px 16px 16px;
          }
        }
      `}</style>
    </div>
  );
}
