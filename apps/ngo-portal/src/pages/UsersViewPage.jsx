import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Badge, Modal } from '@streetpaw/ui';
import { Users, Search, ShieldCheck, UserCheck, Lock, Unlock, AlertTriangle, Check, X, Shield } from 'lucide-react';

export function UsersViewPage({ authToken, currentUser, searchQuery }) {
  const [usersList, setUsersList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, roleFilter]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
      const res = await fetch('http://localhost:8000/api/users/', { headers });
      const data = await res.json();
      let list = Array.isArray(data) ? data : [];

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        list = list.filter(u =>
          u.username?.toLowerCase().includes(q) ||
          u.full_name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.role?.toLowerCase().includes(q)
        );
      }

      if (roleFilter !== 'all') {
        list = list.filter(u => u.role === roleFilter);
      }

      setUsersList(list);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Update Status (Approve Pending / Suspend User)
  const handleUpdateUserStatus = async (userId, newStatus) => {
    if (!authToken) return;
    try {
      const res = await fetch(`http://localhost:8000/api/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={28} color="#60a5fa" /> Registered Users Directory & Privacy Control
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            RBAC User Database — Citizens, NGO Officers, Govt Staff & System Administrators
          </span>
        </div>
      </div>

      {/* FILTER BAR */}
      <Card variant="glass" style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>Filter Role:</span>
          {['all', 'citizen', 'volunteer', 'ngo_staff', 'govt_official', 'admin'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              style={{
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 700,
                border: '1px solid var(--border-subtle)',
                background: roleFilter === r ? '#60a5fa' : 'rgba(30, 41, 59, 0.5)',
                color: roleFilter === r ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </Card>

      {/* USERS TABLE */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading Users Directory...</div>
      ) : (
        <Card variant="glass" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'rgba(30, 41, 59, 0.8)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '14px' }}>USER</th>
                <th style={{ padding: '14px' }}>ROLE</th>
                <th style={{ padding: '14px' }}>CONTACT EMAIL</th>
                <th style={{ padding: '14px' }}>PHONE</th>
                <th style={{ padding: '14px' }}>LOCATION</th>
                <th style={{ padding: '14px' }}>ACTIVITY</th>
                <th style={{ padding: '14px' }}>STATUS</th>
                <th style={{ padding: '14px' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '14px', fontWeight: 800, color: '#ffffff' }}>
                    <div>{u.full_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{u.username}</div>
                  </td>
                  <td style={{ padding: '14px' }}>
                    <Badge variant={u.role === 'admin' ? 'critical' : u.role === 'ngo_staff' ? 'emerald' : 'brand'}>
                      {u.role?.toUpperCase()}
                    </Badge>
                  </td>
                  <td style={{ padding: '14px', color: u.can_see_contact ? '#4ade80' : 'var(--text-muted)', fontSize: '0.825rem' }}>
                    {u.email}
                  </td>
                  <td style={{ padding: '14px', color: u.can_see_contact ? '#4ade80' : 'var(--text-muted)', fontSize: '0.825rem' }}>
                    {u.phone}
                  </td>
                  <td style={{ padding: '14px', color: 'var(--text-muted)' }}>
                    {u.city}
                  </td>
                  <td style={{ padding: '14px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <div>🐾 {u.dogs_registered} dogs</div>
                    <div>🚨 {u.complaints_raised} SOS</div>
                  </td>
                  <td style={{ padding: '14px' }}>
                    <Badge variant={u.status === 'active' ? 'emerald' : u.status === 'pending' ? 'brand' : 'critical'}>
                      {u.status?.toUpperCase()}
                    </Badge>
                  </td>
                  <td style={{ padding: '14px' }}>
                    {u.status === 'pending' ? (
                      <Button size="sm" variant="emerald" icon={Check} onClick={() => handleUpdateUserStatus(u.id, 'active')}>
                        Approve Staff
                      </Button>
                    ) : u.status === 'active' ? (
                      <Button size="sm" variant="critical" icon={Lock} onClick={() => handleUpdateUserStatus(u.id, 'suspended')}>
                        Suspend
                      </Button>
                    ) : (
                      <Button size="sm" variant="secondary" icon={Unlock} onClick={() => handleUpdateUserStatus(u.id, 'active')}>
                        Reactivate
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

    </div>
  );
}
