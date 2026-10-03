import React, { useState } from 'react';
import { Card, Input, Button, Badge } from '@streetpaw/ui';
import { Mail, Lock, Building2, ShieldCheck, Sparkles, User } from 'lucide-react';

export function NgoLoginPage({ onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'request_access' | 'pending'
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [role, setRole] = useState('ngo_staff');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username_or_email: usernameOrEmail, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Login failed');

      if (data.user.status === 'pending') {
        setMode('pending');
        return;
      }

      localStorage.setItem('ngo_token', data.access_token);
      if (onLoginSuccess) onLoginSuccess(data.user);
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestAccess = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: usernameOrEmail.includes('@') ? usernameOrEmail : `${usernameOrEmail}@organisation.org`,
          username: usernameOrEmail,
          password: password,
          role: role,
          organisation_name: orgName
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Request access failed');

      setMode('pending');
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  if (mode === 'pending') {
    return (
      <div style={{ maxWidth: '520px', margin: '80px auto', textAlign: 'center' }}>
        <Card variant="glow" style={{ padding: '40px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(245, 158, 11, 0.2)',
            color: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <ShieldCheck size={36} />
          </div>
          <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px' }}>Pending Admin Approval</h3>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.95rem', marginBottom: '24px' }}>
            Your account and organisation request have been submitted. System administrators must verify your organisation credentials before portal access is granted.
          </p>
          <Button variant="secondary" onClick={() => setMode('login')}>
            Back to Portal Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '440px', margin: '60px auto' }}>
      <Card variant="glass" style={{ padding: '36px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', padding: '8px 16px', background: 'rgba(255, 126, 103, 0.15)', borderRadius: '9999px', color: 'var(--primary-coral)', fontWeight: 800, fontSize: '0.8rem', marginBottom: '10px' }}>
            NGO & GOVT DISPATCH COMMAND PORTAL
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
            {mode === 'login' ? 'Rescue Staff Sign In' : 'Request Portal Access'}
          </h2>
        </div>

        {errorMsg && (
          <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Username or Email"
              placeholder="cupa_staff or staff@cupa.org"
              icon={User}
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button variant="primary" type="submit" size="lg" loading={isLoading}>
              Sign In to Command Portal
            </Button>
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => setMode('request_access')}
                style={{ background: 'transparent', border: 'none', color: 'var(--primary-coral)', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Request Organisation Staff Access →
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRequestAccess} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Username"
              placeholder="e.g. cupa_driver_1"
              icon={User}
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Input
              label="Organisation Name"
              placeholder="e.g. CUPA Rescue Squad"
              icon={Building2}
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
            />
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-input)', color: '#fff', outline: 'none' }}>
                <option value="ngo_staff">NGO Rescue Staff</option>
                <option value="govt_official">Government / BBMP Official</option>
                <option value="volunteer">Community SHG Volunteer</option>
              </select>
            </div>
            <Button variant="emerald" type="submit" size="lg" loading={isLoading}>
              Submit Request for Approval
            </Button>
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => setMode('login')}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
              >
                ← Back to Staff Login
              </button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
