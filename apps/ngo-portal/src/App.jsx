import React, { useState, useEffect } from 'react';
import { NgoSidebar } from './components/NgoSidebar';
import { NgoHeader } from './components/NgoHeader';

import { NgoDashboardPage } from './pages/NgoDashboardPage';
import { ComplaintsPage } from './pages/ComplaintsPage';
import { NgoMapPage } from './pages/NgoMapPage';
import { DogsViewPage } from './pages/DogsViewPage';
import { UsersViewPage } from './pages/UsersViewPage';
import { LostFoundDeskPage } from './pages/LostFoundDeskPage';
import { ContactsPage } from './pages/ContactsPage';
import { TeamPage } from './pages/TeamPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminAuditPage } from './pages/AdminAuditPage';
import { NgoLoginPage } from './pages/NgoLoginPage';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(localStorage.getItem('ngo_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  // Scope & Theme state
  const [isAllAreas, setIsAllAreas] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (authToken) {
      fetchMe(authToken);
    } else {
      setIsLoading(false);
    }
  }, [authToken]);

  const fetchMe = async (token) => {
    try {
      const res = await fetch('http://localhost:8000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const user = await res.json();
        setCurrentUser(user);
      } else {
        handleLogout();
      }
    } catch (e) {
      console.error('NGO portal fetch me error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setAuthToken(localStorage.getItem('ngo_token'));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken(null);
    localStorage.removeItem('ngo_token');
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  if (!currentUser) {
    return <NgoLoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Pending user check
  if (currentUser.status === 'pending') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0b0f19', color: '#fff', textAlign: 'center', padding: '24px' }}>
        <h2 style={{ fontSize: '1.8rem', color: '#fbbf24', marginBottom: '8px' }}>⏳ Account Pending NGO Admin Approval</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 20px' }}>
          Your organisation staff registration (@{currentUser.username}) is currently pending admin approval. You will receive portal access once confirmed.
        </p>
        <button onClick={handleLogout} style={{ padding: '8px 16px', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid #ef4444', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>
          Log Out
        </button>
      </div>
    );
  }

  const renderPage = () => {
    switch (activePage) {
      case 'complaints':
        return <ComplaintsPage authToken={authToken} currentUser={currentUser} searchQuery={searchQuery} />;
      case 'map':
        return <NgoMapPage authToken={authToken} />;
      case 'dogs':
        return <DogsViewPage authToken={authToken} searchQuery={searchQuery} />;
      case 'users':
        return <UsersViewPage authToken={authToken} currentUser={currentUser} searchQuery={searchQuery} />;
      case 'lost_found':
        return <LostFoundDeskPage authToken={authToken} searchQuery={searchQuery} />;
      case 'contacts':
        return <ContactsPage authToken={authToken} searchQuery={searchQuery} />;
      case 'team':
        return <TeamPage currentUser={currentUser} />;
      case 'settings':
        return <SettingsPage currentUser={currentUser} isAllAreas={isAllAreas} onToggleScope={() => setIsAllAreas(!isAllAreas)} theme={theme} onToggleTheme={toggleTheme} />;
      case 'audit':
        return <AdminAuditPage authToken={authToken} currentUser={currentUser} />;
      case 'dashboard':
      default:
        return <NgoDashboardPage setActivePage={setActivePage} />;
    }
  };

  return (
    <div className="ngo-layout" style={{ background: theme === 'light' ? '#f8fafc' : '#0b0f19', color: theme === 'light' ? '#0f172a' : '#ffffff', minHeight: '100vh', display: 'flex' }}>
      <NgoSidebar
        activePage={activePage}
        setActivePage={setActivePage}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      <div className="ngo-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <NgoHeader
          currentUser={currentUser}
          isAllAreas={isAllAreas}
          onToggleScope={() => setIsAllAreas(!isAllAreas)}
          theme={theme}
          onToggleTheme={toggleTheme}
          onSearch={(val) => setSearchQuery(val)}
        />
        <main className="ngo-content" style={{ padding: '24px 28px', flex: 1 }}>
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
