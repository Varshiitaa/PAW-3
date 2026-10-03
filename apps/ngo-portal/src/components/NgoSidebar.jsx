import React from 'react';
import {
  LayoutDashboard, Ambulance, Map, PawPrint, Users, Search,
  PhoneCall, ShieldCheck, Settings, LogOut, HeartHandshake, UserCheck, History
} from 'lucide-react';

export function NgoSidebar({ activePage, setActivePage, currentUser, onLogout }) {
  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'complaints', label: 'Complaints Dispatch', icon: Ambulance, badge: 'LIVE' },
    { id: 'map', label: 'Operations Map', icon: Map },
    { id: 'dogs', label: 'Dog Registry', icon: PawPrint },
    { id: 'users', label: 'User Directory', icon: Users },
    { id: 'lost_found', label: 'Lost & Found Desk', icon: HeartHandshake },
    { id: 'contacts', label: 'Directory Contacts', icon: PhoneCall },
    { id: 'team', label: 'Rescue Squad Teams', icon: UserCheck },
    { id: 'settings', label: 'Portal Settings', icon: Settings },
  ];

  if (currentUser && currentUser.role === 'admin') {
    menuItems.push({ id: 'audit', label: 'Admin Audit Log', icon: History });
  }

  return (
    <aside
      style={{
        width: '260px',
        background: 'rgba(11, 15, 25, 0.96)',
        borderRight: '1px solid var(--border-subtle)',
        padding: '20px 14px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100vh',
        position: 'sticky',
        top: 0
      }}
    >
      <div>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 8px 20px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(34, 197, 94, 0.4)',
            }}
          >
            <ShieldCheck size={22} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              StreetPaw<span style={{ color: '#4ade80' }}>.NGO</span>
            </h1>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>COMMAND & DISPATCH</span>
          </div>
        </div>

        {/* Menu Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {menuItems.map((item) => {
            const isActive = activePage === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: isActive ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
                  color: isActive ? '#4ade80' : 'var(--text-secondary)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    style={{
                      background: 'rgba(34, 197, 94, 0.2)',
                      color: '#4ade80',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '10px',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer User Info */}
      <div style={{ padding: '12px', background: 'rgba(17, 23, 38, 0.8)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff' }}>
            {currentUser ? `@${currentUser.username}` : 'NGO Dispatch Staff'}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#4ade80', fontWeight: 600 }}>
            ROLE: {currentUser?.role?.toUpperCase() || 'NGO STAFF'}
          </div>
        </div>
        {currentUser && (
          <button
            onClick={onLogout}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', background: 'rgba(239, 68, 68, 0.15)', border: 'none', color: '#f87171', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
          >
            <LogOut size={12} /> Log Out Staff
          </button>
        )}
      </div>
    </aside>
  );
}
