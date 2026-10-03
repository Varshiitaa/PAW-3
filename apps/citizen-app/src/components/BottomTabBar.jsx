import React from 'react';
import { Home, Camera, Database, MapPin, AlertCircle, PhoneCall } from 'lucide-react';

export function BottomTabBar({ activePage, setActivePage }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'scan', label: 'Scan', icon: Camera },
    { id: 'dogs', label: 'Dogs', icon: Database },
    { id: 'map', label: 'Map', icon: MapPin },
    { id: 'distress', label: 'SOS', icon: AlertCircle },
  ];

  return (
    <div
      className="mobile-bottom-bar"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 950,
        background: 'rgba(11, 15, 25, 0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '8px 12px 14px',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activePage === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => setActivePage(tab.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              border: 'none',
              background: 'transparent',
              color: isActive ? 'var(--primary-coral)' : 'var(--text-muted)',
              fontSize: '0.725rem',
              fontWeight: isActive ? 700 : 500,
              cursor: 'pointer',
              flex: 1,
            }}
          >
            <div
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                background: isActive ? 'rgba(255, 126, 103, 0.15)' : 'transparent',
              }}
            >
              <Icon size={20} />
            </div>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
