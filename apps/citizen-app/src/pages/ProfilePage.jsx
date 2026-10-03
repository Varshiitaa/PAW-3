import React, { useState } from 'react';
import { Card, Input, Button, Badge } from '@streetpaw/ui';
import { User, Mail, Phone, MapPin, ShieldCheck, Sparkles, Edit3, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PawlyMascot } from '../components/PawlyMascot';

export function ProfilePage() {
  const { user, token, setUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState(user?.city || 'Bengaluru');
  const [state, setState] = useState(user?.state || 'Karnataka');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Please Sign In</h2>
        <p style={{ color: 'var(--text-muted)' }}>You must be logged in to access your user profile.</p>
      </div>
    );
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg('');
    try {
      const res = await fetch('http://localhost:8000/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: fullName,
          phone,
          city,
          state
        })
      });
      const data = await res.json();
      if (res.ok) {
        setUser({ ...user, full_name: fullName, phone, city, state });
        setSuccessMsg('Profile updated successfully!');
      }
    } catch (e) {
      console.error('Update profile error:', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <Badge variant="brand">CITIZEN PROFILE & ACCOUNT</Badge>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '4px' }}>My Account Settings</h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage your personal details and rescue communication preferences.</p>
        </div>
      </div>

      <Card variant="glass">
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'var(--primary-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '2rem',
            fontWeight: 800
          }}>
            {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
          </div>

          <div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{user.full_name || user.username}</h3>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>@{user.username} • {user.email}</div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <Badge variant={user.role === 'admin' ? 'critical' : 'emerald'}>
                • {user.role.toUpperCase()}
              </Badge>
              <Badge variant={user.status === 'active' ? 'normal' : 'pending'}>
                {user.status.toUpperCase()} ACCOUNT
              </Badge>
            </div>
          </div>
        </div>

        {successMsg && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#34d399',
            fontSize: '0.875rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Sparkles size={18} /> {successMsg}
          </div>
        )}

        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <Input
              label="Full Name"
              value={fullName}
              icon={User}
              onChange={(e) => setFullName(e.target.value)}
            />
            <Input
              label="Phone Number"
              value={phone}
              icon={Phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <Input
              label="City"
              value={city}
              icon={MapPin}
              onChange={(e) => setCity(e.target.value)}
            />
            <Input
              label="State"
              value={state}
              icon={MapPin}
              onChange={(e) => setState(e.target.value)}
            />
          </div>

          <Button variant="emerald" type="submit" icon={Save} loading={isSaving} style={{ marginTop: '12px' }}>
            Save Profile Changes
          </Button>
        </form>
      </Card>
    </div>
  );
}
