import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, DataTable, Input } from '@streetpaw/ui';
import { Users, ShieldCheck, CheckCircle2, XCircle, Search, Filter, Building2, UserCheck, AlertTriangle } from 'lucide-react';

export function AdminUsersPage({ adminToken }) {
  const [users, setUsers] = useState([]);
  const [organisations, setOrganisations] = useState([]);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
    fetchOrganisations();
  }, [roleFilter, statusFilter]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      let url = 'http://localhost:8000/api/admin/users?';
      if (roleFilter !== 'all') url += `role=${roleFilter}&`;
      if (statusFilter !== 'all') url += `status=${statusFilter}&`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${adminToken || localStorage.getItem('ngo_token')}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
    } catch (e) {
      console.error('Fetch admin users error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrganisations = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/admin/organisations', {
        headers: { Authorization: `Bearer ${adminToken || localStorage.getItem('ngo_token')}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setOrganisations(data);
    } catch (e) {
      console.error('Fetch admin orgs error:', e);
    }
  };

  const handleUpdateUserStatus = async (userId, newStatus, newRole = None) => {
    try {
      const payload = { status: newStatus };
      if (newRole) payload.role = newRole;

      await fetch(`http://localhost:8000/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken || localStorage.getItem('ngo_token')}`
        },
        body: JSON.stringify(payload)
      });
      fetchUsers();
    } catch (e) {
      console.error('Update user status error:', e);
    }
  };

  const handleVerifyOrg = async (orgId, isVerified) => {
    try {
      await fetch(`http://localhost:8000/api/admin/organisations/${orgId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken || localStorage.getItem('ngo_token')}`
        },
        body: JSON.stringify({ verified: isVerified })
      });
      fetchOrganisations();
    } catch (e) {
      console.error('Verify org error:', e);
    }
  };

  const filteredUsers = users.filter(u =>
    (u.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { title: 'User ID', key: 'id', render: (val) => <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>#{val}</span> },
    { title: 'Username & Name', key: 'username', render: (val, row) => (
      <div>
        <div style={{ fontWeight: 700 }}>@{val}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{row.full_name}</div>
      </div>
    )},
    { title: 'Email & Phone', key: 'email', render: (val, row) => (
      <div style={{ fontSize: '0.85rem' }}>
        <div>{val}</div>
        <div style={{ color: 'var(--text-muted)' }}>{row.phone || 'No phone'}</div>
      </div>
    )},
    { title: 'Role', key: 'role', render: (val) => <Badge variant={val === 'admin' ? 'critical' : 'brand'}>{val.toUpperCase()}</Badge> },
    { title: 'Organisation', key: 'organisation_name', render: (val) => val || '—' },
    { title: 'Status', key: 'status', render: (val) => <Badge variant={val === 'active' ? 'normal' : val === 'pending' ? 'pending' : 'critical'}>{val.toUpperCase()}</Badge> },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          {row.status === 'pending' && (
            <Button variant="emerald" size="sm" icon={UserCheck} onClick={() => handleUpdateUserStatus(row.id, 'active')}>
              Approve
            </Button>
          )}
          {row.status === 'active' && row.role !== 'admin' && (
            <Button variant="ghost" size="sm" onClick={() => handleUpdateUserStatus(row.id, 'suspended')}>
              Suspend
            </Button>
          )}
          {row.status === 'suspended' && (
            <Button variant="secondary" size="sm" onClick={() => handleUpdateUserStatus(row.id, 'active')}>
              Unsuspend
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <Badge variant="critical">SYSTEM ADMIN CONTROL CENTER</Badge>
        <h2 style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '4px' }}>Users & Organisations Management</h2>
        <p style={{ color: 'var(--text-muted)' }}>Approve staff requests, manage user roles, suspend accounts, and verify organisations.</p>
      </div>

      {/* Organisations Verification Section */}
      <Card variant="glass">
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building2 color="var(--primary-coral)" /> Registered Organisations Directory ({organisations.length})
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {organisations.map((org) => (
            <div key={org.id} style={{ padding: '16px', background: 'rgba(15, 21, 35, 0.8)', borderRadius: '12px', border: '1px solid var(--border-medium)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>{org.name}</span>
                <Badge variant={org.verified ? 'normal' : 'pending'}>{org.type}</Badge>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>📍 {org.city}, {org.state}</div>
              <Button
                variant={org.verified ? 'ghost' : 'emerald'}
                size="sm"
                onClick={() => handleVerifyOrg(org.id, !org.verified)}
              >
                {org.verified ? 'Verified ✓' : 'Verify Organisation'}
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Users Table */}
      <Card variant="glass">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ maxWidth: '340px', width: '100%' }}>
            <Input
              placeholder="Search by username, name, or email..."
              icon={Search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-input)', color: '#fff' }}>
              <option value="all">All Roles</option>
              <option value="citizen">Citizen</option>
              <option value="ngo_staff">NGO Staff</option>
              <option value="govt_official">Govt Official</option>
              <option value="volunteer">Volunteer</option>
              <option value="admin">Admin</option>
            </select>

            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-input)', color: '#fff' }}>
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <DataTable columns={columns} data={filteredUsers} keyField="id" />
      </Card>
    </div>
  );
}
