'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get('error');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [pinError, setPinError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPinError('');

    try {
      const res = await fetch('/api/auth/pin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        setPinError('Invalid PIN code');
      }
    } catch (err) {
      setPinError('An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {error === 'access_denied' && (
        <div style={{ padding: '12px', background: 'var(--accent-red-glow)', color: 'var(--accent-red)', borderRadius: '8px', fontSize: '14px', fontWeight: 600 }}>
          Access Denied. You do not have permissions to access the dashboard.
        </div>
      )}
      {error === 'auth_failed' && (
        <div style={{ padding: '12px', background: 'var(--accent-red-glow)', color: 'var(--accent-red)', borderRadius: '8px', fontSize: '14px', fontWeight: 600 }}>
          Authentication failed. Please try again.
        </div>
      )}
      {error === 'no_code' && (
        <div style={{ padding: '12px', background: 'var(--accent-red-glow)', color: 'var(--accent-red)', borderRadius: '8px', fontSize: '14px', fontWeight: 600 }}>
          Invalid request. Please log in again.
        </div>
      )}
      {pinError && (
        <div style={{ padding: '12px', background: 'var(--accent-red-glow)', color: 'var(--accent-red)', borderRadius: '8px', fontSize: '14px', fontWeight: 600 }}>
          {pinError}
        </div>
      )}
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
        <input 
          type="password" 
          placeholder="Enter PIN" 
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          style={{
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontSize: '18px',
            textAlign: 'center',
            outline: 'none'
          }}
          required
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{
            background: 'var(--accent-blue)',
            color: 'white',
            padding: '16px',
            borderRadius: '12px',
            fontWeight: 700,
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'opacity 0.2s'
          }}
        >
          {loading ? 'Logging in...' : 'Enter Dashboard'}
        </button>
      </form>
    </div>
  );
}
