import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { BottomTabBar } from './components/BottomTabBar';
import { PawlyChatbot } from './components/PawlyChatbot';
import { AuthModal } from './components/AuthModal';

import { HomePage } from './pages/HomePage';
import { ScanPage } from './pages/ScanPage';
import { DogsPage } from './pages/DogsPage';
import { MapPage } from './pages/MapPage';
import { ReportDistressPage } from './pages/ReportDistressPage';
import { LostFoundPage } from './pages/LostFoundPage';
import { HelpContactsPage } from './pages/HelpContactsPage';
import { StyleguidePage } from './pages/StyleguidePage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ProfilePage } from './pages/ProfilePage';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [activePage, setActivePage] = useState(() => {
    const hasToken = localStorage.getItem('streetpaw_token');
    const isGuest = sessionStorage.getItem('streetpaw_guest') === 'true';
    if (hasToken || isGuest) return 'home';
    return 'signup';
  });
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [isCalmMode, setIsCalmMode] = useState(false);

  useEffect(() => {
    if (user && (activePage === 'signup' || activePage === 'login')) {
      sessionStorage.removeItem('streetpaw_guest');
      setActivePage('home');
    }
  }, [user]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const toggleCalmMode = () => {
    const nextCalm = !isCalmMode;
    setIsCalmMode(nextCalm);
    document.documentElement.setAttribute('data-calm-mode', nextCalm ? 'true' : 'false');
  };

  const renderPage = () => {
    switch (activePage) {
      case 'scan':
        return <ScanPage setActivePage={setActivePage} />;
      case 'dogs':
        return <DogsPage setActivePage={setActivePage} />;
      case 'map':
        return <MapPage setActivePage={setActivePage} />;
      case 'distress':
        return <ReportDistressPage setActivePage={setActivePage} />;
      case 'lost-found':
        return <LostFoundPage setActivePage={setActivePage} />;
      case 'help':
        return <HelpContactsPage />;
      case 'styleguide':
        return <StyleguidePage isCalmMode={isCalmMode} toggleCalmMode={toggleCalmMode} />;
      case 'login':
        return <LoginPage setActivePage={setActivePage} />;
      case 'signup':
        return <SignupPage setActivePage={setActivePage} />;
      case 'profile':
        return <ProfilePage />;
      case 'home':
      default:
        return <HomePage setActivePage={setActivePage} />;
    }
  };

  return (
    <div className="app-container ambient-mesh-bg">
      {/* Sticky Header Navbar */}
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        onOpenAuth={() => setActivePage('login')}
        theme={theme}
        toggleTheme={toggleTheme}
        isCalmMode={isCalmMode}
        toggleCalmMode={toggleCalmMode}
      />

      {/* Main Page Area */}
      <main className="main-content" style={{ animation: 'sp-fade-in 250ms var(--ease-calm)' }}>
        {renderPage()}
      </main>

      {/* Floating Pawly AI Assistant */}
      <PawlyChatbot />

      {/* Mobile Sticky Bottom Tab Bar */}
      <BottomTabBar activePage={activePage} setActivePage={setActivePage} />

      {/* Auth Modal fallback */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
