'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface Group {
  id: string;
  name?: string;
  groupId?: string; // Sometimes the ID is in a different field
}

interface Props {
  groups: Group[];
  currentGroupId?: string;
  currentRole?: string;
}

export default function DashboardFilters({ groups, currentGroupId, currentRole }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newGroupId = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (newGroupId) {
      params.set('groupId', newGroupId);
    } else {
      params.delete('groupId');
    }
    router.push(`/?${params.toString()}`);
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (newRole) {
      params.set('role', newRole);
    } else {
      params.delete('role');
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label htmlFor="group-select" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Select Group</label>
        <select
          id="group-select"
          value={currentGroupId || ''}
          onChange={handleGroupChange}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid var(--glass-border)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            minWidth: '200px'
          }}
        >
          <option value="">All Groups</option>
          {groups?.map((g: any) => (
            <option key={g.id || g.groupId} value={g.id || g.groupId}>
              {g.groupName || g.name || g.groupId || g.id}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label htmlFor="role-select" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Select Role</label>
        <select
          id="role-select"
          value={currentRole || ''}
          onChange={handleRoleChange}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid var(--glass-border)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            minWidth: '150px'
          }}
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="staff">Staff</option>
        </select>
      </div>
    </div>
  );
}
