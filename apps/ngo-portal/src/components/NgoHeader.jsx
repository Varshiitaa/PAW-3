import React, { useState } from 'react';
import { Bell, Search, Sun, Moon, Globe, Shield, User as UserIcon } from 'lucide-react';
import { Input, Badge } from '@streetpaw/ui';

export function NgoHeader({ currentUser, isAllAreas, onToggleScope, theme, onToggleTheme, onSearch }) {
  const [searchValue, setSearchValue] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(searchValue);
  };

  return (
    <header
      style={{
        padding: '14px 28px',
        background: theme === 'light' ? '#ffffff' : 'rgba(11, 15, 25, 0.92)',
        color: theme === 'light' ? '#0f172a' : '#ffffff',
        backdropFilter: 'blur(16px)',
        borderBottom: theme === 'light' ? '1px solid #e2e8f0' : '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}
    >
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} style={{ maxWidth: '360px', width: '100%' }}>
        <Input
          placeholder="Search complaint #, dog tag, or user..."
          icon={Search}
          value={searchValue}
          onChange={(e) => {
            setSearchValue(e.target.value);
            if (onSearch) onSearch(e.target.value);
          }}
        />
      </form>

      {/* Header Actions & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        
        {/* Service Area Scope Toggle */}
        <button
          type="button"
          onClick={onToggleScope}
          title="Toggle Scope View"
          style={{
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: 700,
            border: '1px solid rgba(34, 197, 94, 0.4)',
            background: isAllAreas ? 'rgba(34, 197, 94, 0.2)' : 'rgba(30, 41, 59, 0.6)',
            color: isAllAreas ? '#4ade80' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Globe size={14} />
          <span>{isAllAreas ? 'Scope: All City Areas' : 'Scope: My Org Area'}</span>
        </button>

        {/* Dark / Light Theme Toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          title="Toggle Theme"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: theme === 'light' ? '#0f172a' : '#e2e8f0',
            cursor: 'pointer',
          }}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        {/* Notifications Icon */}
        <button
          type="button"
          aria-label="Notifications"
          style={{
            position: 'relative',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          <Bell size={16} />
          <span
            style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#22c55e',
            }}
          />
        </button>

        {/* User Info Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '8px', borderLeft: '1px solid var(--border-subtle)' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.85rem'
            }}
          >
            {currentUser?.full_name ? currentUser.full_name.slice(0, 2).toUpperCase() : currentUser?.username?.slice(0, 2).toUpperCase() || 'ST'}
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: theme === 'light' ? '#0f172a' : '#ffffff' }}>
              {currentUser?.full_name || `@${currentUser?.username}` || 'NGO Staff'}
            </div>
            <div style={{ fontSize: '0.725rem', color: '#4ade80', fontWeight: 600 }}>
              {currentUser?.role === 'admin' ? 'System Administrator' : currentUser?.organisation_id ? 'NGO Verified Officer' : 'Govt Official'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
