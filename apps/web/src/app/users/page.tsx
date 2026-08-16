"use client";

import { useEffect, useState } from 'react';
import { fetchGroups } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function UsersPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('ALL');

  const loadData = async () => {
    setLoading(true);
    try {
      const groupsData = await fetchGroups();
      setGroups(groupsData);

      const allUsers: any[] = [];
      for (const g of groupsData) {
        const res = await fetch(`${API_URL}/groups/${g.id}`);
        if (res.ok) {
          const groupDetails = await res.json();
          const memberships = groupDetails.memberships || [];
          memberships.forEach((m: any) => {
            allUsers.push({
              ...m,
              groupId: g.id,
              groupName: g.groupName || g.id,
              userId: m.id // membership doc id is the line userId
            });
          });
        }
      }
      setUsers(allUsers);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = users.filter((u) => {
    if (selectedGroup !== 'ALL' && u.groupId !== selectedGroup) return false;
    if (search && !u.displayName?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleRoleChange = async (groupId: string, userId: string, newRole: string) => {
    try {
      const res = await fetch(`${API_URL}/groups/${groupId}/members/${userId}/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ roleId: newRole })
      });
      if (res.ok) {
        loadData(); // refresh to show updated role
      } else {
        console.error('Failed to update role');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>
          User <span className="text-gradient">Management</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Track LINE Groups that invited WRC Bot, check member counts, and set user roles for every LINE User ID.
        </p>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '20px', fontWeight: 600 }}>
          👥 Connected LINE Groups ({groups.length})
        </h3>
        
        <div style={{ position: 'relative', width: '100%', maxWidth: '400px', marginBottom: '24px' }}>
          <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>🔍</span>
          <input
            type="text"
            className="input-premium"
            placeholder="Search groups by name or ID..."
            value={groupSearch}
            onChange={(e) => setGroupSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: '48px' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto', padding: '4px' }}>
          <button
            className={`glass-panel hover-glow ${selectedGroup === 'ALL' ? 'active-group' : ''}`}
            onClick={() => setSelectedGroup('ALL')}
            style={{
              padding: '16px 20px',
              border: selectedGroup === 'ALL' ? '2px solid var(--accent-blue)' : '1px solid var(--glass-border)',
              background: selectedGroup === 'ALL' ? 'var(--bg-secondary)' : 'var(--glass-bg)',
              color: 'var(--text-primary)',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: selectedGroup === 'ALL' ? '0 4px 15px var(--accent-blue-glow)' : 'var(--glass-shadow)',
              transform: selectedGroup === 'ALL' ? 'translateY(-2px)' : 'none'
            }}
          >
            <span style={{ fontWeight: 700, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🌐 All LINE Users
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>View all recorded User IDs</span>
          </button>

          {groups.filter(g => !groupSearch || (g.groupName || g.id).toLowerCase().includes(groupSearch.toLowerCase())).map((g: any) => (
            <button
              key={g.id}
              className={`glass-panel hover-glow ${selectedGroup === g.id ? 'active-group' : ''}`}
              onClick={() => setSelectedGroup(g.id)}
              style={{
                padding: '16px 20px',
                border: selectedGroup === g.id ? '2px solid var(--accent-blue)' : '1px solid var(--glass-border)',
                background: selectedGroup === g.id ? 'var(--bg-secondary)' : 'var(--glass-bg)',
                color: 'var(--text-primary)',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: selectedGroup === g.id ? '0 4px 15px var(--accent-blue-glow)' : 'var(--glass-shadow)',
                transform: selectedGroup === g.id ? 'translateY(-2px)' : 'none'
              }}
            >
              <span style={{ fontWeight: 700, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', wordBreak: 'break-all' }}>
                📱 {g.groupName || g.id}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {g._count?.memberships || 0} members
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '32px', background: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '350px' }}>
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>🔍</span>
            <input
              type="text"
              className="input-premium"
              placeholder="Search users by display name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '48px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{filteredUsers.length} users</span>
            <button
              className="btn-primary"
              onClick={loadData}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead style={{ background: 'var(--bg-primary)' }}>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>User Profile</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Group Name</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Current Role</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Assign Role</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>No users found matching your criteria.</td></tr>
              ) : (
                filteredUsers.map((u, i) => (
                  <tr key={`${u.groupId}-${u.userId}-${i}`} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-primary)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-tertiary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        {u.pictureUrl ? <img src={u.pictureUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.displayName || 'Unknown'}</span>
                    </td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>
                      {u.groupName}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 700,
                        border: u.role === 'ADMIN' ? '1px solid var(--accent-red)' : u.role === 'STAFF' ? '1px solid var(--accent-blue)' : '1px solid var(--accent-green)',
                        color: u.role === 'ADMIN' ? 'var(--accent-red)' : u.role === 'STAFF' ? 'var(--accent-blue)' : 'var(--accent-green)',
                        background: u.role === 'ADMIN' ? 'var(--accent-red-glow)' : u.role === 'STAFF' ? 'var(--accent-blue-glow)' : 'rgba(16, 185, 129, 0.1)'
                      }}>
                        {u.role || 'CUSTOMER'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <select
                        className="input-premium"
                        onChange={(e) => handleRoleChange(u.groupId, u.userId, e.target.value)}
                        style={{
                          padding: '8px 12px',
                          width: '100%',
                          minWidth: '220px',
                          cursor: 'pointer',
                          fontSize: '13px'
                        }}
                        defaultValue={u.role || 'CUSTOMER'}
                      >
                        <option value="CUSTOMER">CUSTOMER (Request Quotes)</option>
                        <option value="ADMIN">ADMIN (Full Access)</option>
                        <option value="STAFF">STAFF (Manage Orders)</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
