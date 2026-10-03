import React, { useState } from 'react';
import { PawPrint, Home, Camera, MapPin, AlertCircle, Search, PhoneCall, User, Sun, Moon, Database, Sparkles, Feather, LogOut, ChevronDown } from 'lucide-react';
import { Button } from '@streetpaw/ui';
import { useAuth } from '../context/AuthContext';

export function Navbar({ activePage, setActivePage, onOpenAuth, theme, toggleTheme, isCalmMode, toggleCalmMode }) {
  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'scan', label: 'Scan', icon: Camera },
    { id: 'dogs', label: 'Dogs', icon: Database },
    { id: 'map', label: 'Map', icon: MapPin },
    { id: 'distress', label: 'Report Distress', icon: AlertCircle },
    { id: 'lost-found', label: 'Lost & Found', icon: Search },
    { id: 'help', label: 'Help', icon: PhoneCall },
  ];

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 900,
        background: 'rgba(11, 15, 25, 0.88)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '14px 28px',
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand Logo */}
        <div
          onClick={() => setActivePage('home')}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #ff7e67 0%, #22c55e 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(255, 126, 103, 0.35)',
              flexShrink: 0,
            }}
          >
            <PawPrint size={22} color="#ffffff" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 900,
                  background: 'linear-gradient(90deg, #ff9e80 0%, #6ee7b7 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.1,
                  letterSpacing: '0.02em',
                }}
              >
                STREETPAW.AI 🐾🐾
              </h1>
              <span
                style={{
                  padding: '2px 10px',
                  borderRadius: '999px',
                  border: '1px solid rgba(255, 126, 103, 0.4)',
                  background: 'rgba(255, 126, 103, 0.1)',
                  fontFamily: 'var(--font-mono)',
                  color: '#ff9e80',
                  fontSize: '0.725rem',
                  fontWeight: 700,
                }}
              >
                v2.0 Vision Engine
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>
              Stray Animal Care & Welfare Platform ❤️
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav
          className="desktop-nav"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '999px',
            padding: '4px 6px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
          }}
        >
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            const IconComp = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '999px',
                  border: isActive ? '1px solid rgba(255, 126, 103, 0.4)' : '1px solid transparent',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(255, 126, 103, 0.22), rgba(255, 158, 128, 0.12))'
                    : 'transparent',
                  color: isActive ? '#ff9e80' : '#94a3b8',
                  fontWeight: isActive ? 700 : 600,
                  fontSize: '0.825rem',
                  letterSpacing: '0.01em',
                  cursor: 'pointer',
                  transition: 'all 180ms var(--ease-calm)',
                  boxShadow: isActive ? '0 0 14px rgba(255, 126, 103, 0.25)' : 'none',
                }}
              >
                {IconComp && <IconComp size={14} color={isActive ? '#ff9e80' : '#64748b'} />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Controls & User Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={toggleCalmMode}
            title={isCalmMode ? 'Disable Calm Mode' : 'Enable Calm Mode (Reduce Motion)'}
            style={{
              background: isCalmMode ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: isCalmMode ? '#4ade80' : 'var(--text-secondary)',
              fontSize: '0.775rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Feather size={14} />
            <span>{isCalmMode ? 'Calm Mode ON' : 'Calm Mode'}</span>
          </button>

          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            style={{
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
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  background: 'rgba(255, 126, 103, 0.15)',
                  border: '1px solid rgba(255, 126, 103, 0.4)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary-coral)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span>@{user.username || 'user'}</span>
                <ChevronDown size={14} />
              </button>

              {isUserMenuOpen && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '46px',
                  width: '200px',
                  background: 'var(--bg-dark-surface)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  zIndex: 999
                }}>
                  <button
                    onClick={() => { setActivePage('profile'); setIsUserMenuOpen(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'transparent', border: 'none', color: '#fff', fontSize: '0.85rem', cursor: 'pointer', borderRadius: '6px' }}
                  >
                    <User size={14} /> Profile Settings
                  </button>
                  <button
                    onClick={() => { setActivePage('dogs'); setIsUserMenuOpen(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'transparent', border: 'none', color: '#fff', fontSize: '0.85rem', cursor: 'pointer', borderRadius: '6px' }}
                  >
                    <Database size={14} /> My Registered Dogs
                  </button>
                  <button
                    onClick={() => { setActivePage('distress'); setIsUserMenuOpen(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'transparent', border: 'none', color: '#fff', fontSize: '0.85rem', cursor: 'pointer', borderRadius: '6px' }}
                  >
                    <AlertCircle size={14} /> My Distress Signals
                  </button>
                  <hr style={{ borderColor: 'var(--border-subtle)', margin: '4px 0' }} />
                  <button
                    onClick={() => { logout(); setIsUserMenuOpen(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'rgba(239,68,68,0.1)', border: 'none', color: '#f87171', fontSize: '0.85rem', cursor: 'pointer', borderRadius: '6px', fontWeight: 700 }}
                  >
                    <LogOut size={14} /> Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button variant="secondary" icon={User} size="sm" onClick={() => setActivePage('login')}>
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
