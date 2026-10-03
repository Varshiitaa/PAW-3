import React from 'react';

export function Tabs({ tabs = [], activeTab, onChange }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        gap: '4px',
        padding: '4px',
        background: 'rgba(15, 21, 35, 0.8)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        width: 'fit-content',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: isActive ? 'var(--primary-gradient)' : 'transparent',
              color: isActive ? '#ffffff' : 'var(--text-muted)',
              fontSize: '0.875rem',
              fontWeight: isActive ? 700 : 500,
              cursor: 'pointer',
              transition: 'var(--motion-fast)',
              boxShadow: isActive ? 'var(--primary-glow)' : 'none',
            }}
          >
            {Icon && <Icon size={16} />}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
