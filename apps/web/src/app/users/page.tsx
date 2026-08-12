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
          // Assuming authorization token is stored in localStorage or handled by cookies
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ roleId: newRole })
      });
      if (res.ok) {
        // Optionally show success toast here
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
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>
          LINE Group & User <span className="text-gradient">Role Management</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Track LINE Groups that invited WRC Bot, check member counts, and set user roles for every LINE User ID.
        </p>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>
          👥 Connected LINE Groups ({groups.length})
        </h3>
        <div style={{ position: 'relative', width: '300px', marginBottom: '16px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>🔍</span>
          <input
            type="text"
            placeholder="Search groups..."
            value={groupSearch}
            onChange={(e) => setGroupSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 10px 10px 40px',
              borderRadius: '8px',
              border: '1px solid #333',
              background: 'rgba(0,0,0,0.2)',
              color: 'white',
              outline: 'none'
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', maxHeight: '300px', overflowY: 'auto', paddingRight: '8px' }}>
          <button
            onClick={() => setSelectedGroup('ALL')}
            style={{
              padding: '16px 24px',
              borderRadius: '12px',
              border: selectedGroup === 'ALL' ? '2px solid var(--accent-blue)' : '1px solid #333',
              background: selectedGroup === 'ALL' ? 'rgba(0, 112, 243, 0.1)' : 'transparent',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              textAlign: 'left',
              minWidth: '200px'
            }}
          >
            <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              🌐 All LINE Users
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>All recorded User IDs</span>
          </button>

          {groups.filter(g => !groupSearch || (g.groupName || g.id).toLowerCase().includes(groupSearch.toLowerCase())).map((g: any) => (
            <button
              key={g.id}
              onClick={() => setSelectedGroup(g.id)}
              style={{
                padding: '16px 24px',
                borderRadius: '12px',
                border: selectedGroup === g.id ? '2px solid var(--accent-blue)' : '1px solid #333',
                background: selectedGroup === g.id ? 'rgba(0, 112, 243, 0.1)' : 'transparent',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                textAlign: 'left',
                minWidth: '200px'
              }}
            >
              <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                📱 {g.groupName || g.id}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{g._count?.memberships || 0} members</span>
            </button>
          ))}
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>🔍</span>
            <input
              type="text"
              placeholder="Search by display name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                borderRadius: '8px',
                border: '1px solid #333',
                background: 'rgba(0,0,0,0.2)',
                color: 'white',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>{filteredUsers.length} users</span>
            <button
              onClick={loadData}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                background: 'var(--accent-blue)',
                color: 'white',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '12px' }}>
                <th style={{ padding: '16px 8px' }}>USER</th>
                <th style={{ padding: '16px 8px' }}>GROUP NAME</th>
                <th style={{ padding: '16px 8px' }}>LINE USER ID</th>
                <th style={{ padding: '16px 8px' }}>CURRENT ROLE</th>
                <th style={{ padding: '16px 8px' }}>ASSIGN ROLE</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>No users found.</td></tr>
              ) : (
                filteredUsers.map((u, i) => (
                  <tr key={`${u.groupId}-${u.userId}-${i}`} style={{ borderBottom: '1px solid #222' }}>
                    <td style={{ padding: '16px 8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#444', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {u.pictureUrl ? <img src={u.pictureUrl} alt="" style={{ width: '100%', height: '100%' }} /> : '👤'}
                      </div>
                      <span style={{ fontWeight: 600 }}>{u.displayName || 'Unknown'}</span>
                    </td>
                    <td style={{ padding: '16px 8px', color: 'var(--text-secondary)' }}>
                      {u.groupName}
                    </td>
                    <td style={{ padding: '16px 8px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      {u.userId}
                    </td>
                    <td style={{ padding: '16px 8px' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: '1px solid var(--accent-green)',
                        color: 'var(--accent-green)',
                        background: 'rgba(0, 255, 0, 0.05)'
                      }}>
                        {u.role || 'CUSTOMER'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 8px' }}>
                      <select
                        onChange={(e) => handleRoleChange(u.groupId, u.userId, e.target.value)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          background: 'rgba(0,0,0,0.2)',
                          border: '1px solid #444',
                          color: 'white',
                          width: '100%',
                          cursor: 'pointer'
                        }}
                        defaultValue={u.role || 'CUSTOMER'}
                      >
                        <option value="CUSTOMER">CUSTOMER (Request Quotes & View Basic Info)</option>
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
