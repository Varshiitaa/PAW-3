import React, { useState } from 'react';
import { Card, Input, Button, Badge } from '@streetpaw/ui';
import { Mail, Lock, User, Phone, Eye, EyeOff, Sparkles, Building2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PawlyMascot } from '../components/PawlyMascot';

export function SignupPage({ setActivePage }) {
  const { signup } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('citizen');
  const [orgName, setOrgName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Password strength logic
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: 'Too short', color: '#64748b' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { score: 25, label: 'Weak', color: '#ef4444' };
    if (score === 2) return { score: 50, label: 'Fair', color: '#f59e0b' };
    if (score === 3) return { score: 75, label: 'Good', color: '#3b82f6' };
    return { score: 100, label: 'Strong', color: '#10b981' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const user = await signup({
        email,
        username,
        password,
        full_name: fullName,
        phone,
        role,
        organisation_name: orgName
      });

      if (user.status === 'pending') {
        setSuccessMsg('Account registered! Your organisation access is pending Admin approval.');
      } else {
        setSuccessMsg('Account created successfully! Welcome to StreetPaw AI.');
      }

      setTimeout(() => {
        if (setActivePage) setActivePage('home');
      }, 1200);
    } catch (err) {
      setErrorMsg(err.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
      gap: '32px',
      maxWidth: '1050px',
      margin: '20px auto',
      alignItems: 'center'
    }}>
      {/* Left Visual Banner */}
      <div style={{
        padding: '40px',
        borderRadius: 'var(--radius-xl)',
        background: 'linear-gradient(135deg, rgba(255,158,128,0.2) 0%, rgba(205,184,255,0.2) 50%, rgba(189,235,221,0.2) 100%)',
        border: '1px solid var(--border-medium)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        <PawlyMascot mood={successMsg ? 'happy' : errorMsg ? 'confused' : 'idle'} size={140} />
        
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '20px', marginBottom: '8px' }}>
          Join StreetPaw.AI 🐾
        </h2>
        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', maxWidth: '360px' }}>
          Register as a Citizen Volunteer, NGO Worker, or Government Official to collaborate on stray animal welfare.
        </p>

        <div style={{ display: 'flex', gap: '8px', marginTop: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Badge variant="brand">Instant Citizen Access</Badge>
          <Badge variant="emerald">NGO & SHG Network</Badge>
        </div>
      </div>

      {/* Right Registration Form */}
      <Card variant="glass" style={{ padding: '36px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '4px' }}>Create Account</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Fill in details to register into the digital animal network</p>
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

        {successMsg && (
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
            <Sparkles size={18} /> {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="Username"
              placeholder="e.g. varshita_c"
              icon={User}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <Input
              label="Full Name"
              placeholder="Varshita Chauhan"
              icon={User}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            placeholder="citizen@streetpaw.ai"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Phone Number"
            type="tel"
            placeholder="+91 98765 43210"
            icon={Phone}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          {/* Account Role Selector */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
              Account Role / Type
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                outline: 'none',
                fontSize: '0.9rem'
              }}
            >
              <option value="citizen">Citizen / Pet Parent (Instant Access)</option>
              <option value="volunteer">Animal Welfare Volunteer</option>
              <option value="ngo_staff">NGO Shelter Staff (Requires Admin Approval)</option>
              <option value="govt_official">Government / BBMP Official (Requires Admin Approval)</option>
            </select>
          </div>

          {role !== 'citizen' && (
            <Input
              label="Organisation Name"
              placeholder="e.g. CUPA Rescue Shelter"
              icon={Building2}
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
            />
          )}

          {/* Password with Strength Meter */}
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

            {password && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                  <span>Password Strength:</span>
                  <span style={{ color: strength.color, fontWeight: 700 }}>{strength.label}</span>
                </div>
                <div style={{ height: '4px', width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${strength.score}%`, background: strength.color, transition: 'width 0.3s ease' }} />
                </div>
              </div>
            )}
          </div>

          <Button variant="primary" type="submit" size="lg" loading={isLoading} style={{ marginTop: '8px' }}>
            Complete Registration
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
            style={{ width: '100%', marginTop: '4px', borderColor: 'rgba(255, 126, 103, 0.4)', color: '#ff9e80', fontWeight: 700 }}
          >
            👁️ Continue as Guest
          </Button>

          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Already registered?{' '}
              <a
                href="#login"
                onClick={(e) => { e.preventDefault(); if (setActivePage) setActivePage('login'); }}
                style={{ color: 'var(--primary-coral)', fontWeight: 700, textDecoration: 'none' }}
              >
                Sign In
              </a>
            </span>
          </div>
        </form>
      </Card>
    </div>
  );
}
