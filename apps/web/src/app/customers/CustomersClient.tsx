'use client';
import { useRouter } from 'next/navigation';

export default function CustomersClient({ groups }: { groups: any[] }) {
  const router = useRouter();

  return (
    <div>
      <h1 style={{ fontSize: '32px', marginBottom: '8px', fontWeight: 700 }}>
        Customer <span className="text-gradient">Management</span>
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '14px' }}>
        Manage buyer details and custom pricing for each LINE customer group.
      </p>

      {groups.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>No customer groups found.</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>
            Groups are created automatically when the LINE bot joins a chat.
          </p>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Group Name</th>
                <th style={{ padding: '12px' }}>Company</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Members</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group: any) => (
                <tr
                  key={group.id}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '14px 12px', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: 'var(--accent-blue-glow)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '16px', flexShrink: 0
                      }}>
                        💬
                      </div>
                      {group.groupName || group.id}
                    </div>
                  </td>
                  <td style={{ padding: '14px 12px', color: 'var(--text-secondary)' }}>
                    {group.buyerProfile?.companyName || (
                      <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', opacity: 0.6 }}>Not set</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '12px',
                      background: 'rgba(99,179,237,0.15)', color: 'var(--accent-blue)',
                      fontWeight: 600, fontSize: '13px'
                    }}>
                      {group._count?.memberships ?? 0}
                    </span>
                  </td>
                  <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '12px', fontSize: '12px',
                      background: group.status === 'ACTIVE' ? 'rgba(0,230,118,0.15)' : 'rgba(255,255,255,0.08)',
                      color: group.status === 'ACTIVE' ? 'var(--accent-green)' : 'var(--text-secondary)'
                    }}>
                      {group.status || 'PENDING'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                    <button
                      onClick={() => router.push(`/customers/${group.id}`)}
                      className="btn-primary"
                      style={{ padding: '8px 16px', fontSize: '13px' }}
                    >
                      View Details →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
