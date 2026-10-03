import React, { useState } from 'react';
import { Card, Input, Button, Badge } from '@streetpaw/ui';
import { Mail, Lock, Eye, EyeOff, Sparkles, User, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PawlyMascot } from '../components/PawlyMascot';

export function LoginPage({ setActivePage }) {
  const { login } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);
    try {
      await login(usernameOrEmail, password);
      setSuccess(true);
      setTimeout(() => {
        if (setActivePage) setActivePage('home');
      }, 800);
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
      gap: '32px',
      maxWidth: '1000px',
      margin: '20px auto',
      alignItems: 'center'
    }}>
      {/* Left Visual Banner with Soft Animated Gradient & Mascot */}
      <div style={{
        padding: '40px',
        borderRadius: 'var(--radius-xl)',
        background: 'linear-gradient(135deg, rgba(255,158,128,0.2) 0%, rgba(205,184,255,0.2) 50%, rgba(189,235,221,0.2) 100%)',
        border: '1px solid var(--border-medium)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <PawlyMascot mood={success ? 'happy' : errorMsg ? 'confused' : 'idle'} size={140} />
        
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '20px', marginBottom: '8px' }}>
          Welcome Back to StreetPaw 🐾
        </h2>
        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', maxWidth: '360px' }}>
          Sign in to protect street animals, track community sightings, and synchronize rescue notifications.
        </p>

        <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
          <Badge variant="brand">Verified AI Vision Engine</Badge>
          <Badge variant="normal">Community Protection</Badge>
        </div>
      </div>

      {/* Right Clean Login Form */}
      <Card variant="glass" style={{ padding: '36px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '4px' }}>Citizen Sign In</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Enter your credentials to manage stray ID records</p>
        </div>

        {errorMsg && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            fontSize: '0.875rem',
            marginBottom: '16px'
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {success && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#34d399',
            fontSize: '0.875rem',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Sparkles size={18} /> Welcome back! Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <Input
            label="Username or Email"
            placeholder="citizen@streetpaw.ai or varshita"
            icon={User}
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
            required
          />

          <div style={{ position: 'relative' }}>
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '14px',
                top: '38px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <Button variant="primary" type="submit" size="lg" loading={isLoading} style={{ marginTop: '8px' }}>
            Sign In to Dashboard
          </Button>

          <Button
            variant="outline"
            size="lg"
            type="button"
            icon={Eye}
            onClick={() => {
              sessionStorage.setItem('streetpaw_guest', 'true');
              if (setActivePage) setActivePage('home');
            }}
            style={{ width: '100%', marginTop: '8px', borderColor: 'rgba(255, 126, 103, 0.4)', color: '#ff9e80', fontWeight: 700 }}
          >
            👁️ Continue as Guest
          </Button>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Don't have an account?{' '}
              <a
                href="#signup"
                onClick={(e) => { e.preventDefault(); if (setActivePage) setActivePage('signup'); }}
                style={{ color: 'var(--primary-coral)', fontWeight: 700, textDecoration: 'none' }}
              >
                Sign Up
              </a>
            </span>
          </div>
        </form>
      </Card>
    </div>
  );
}
