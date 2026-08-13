import React, { Suspense } from 'react';
import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: '24px'
    }}>
      <div className="glass-panel" style={{
        padding: '48px',
        maxWidth: '450px',
        width: '100%',
        textAlign: 'center',
        background: 'var(--bg-secondary)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.05)'
      }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>
            <span className="text-gradient">WRC</span> AI Sales
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Sign in to the Admin Dashboard</p>
        </div>
        
        <Suspense fallback={<div>Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
