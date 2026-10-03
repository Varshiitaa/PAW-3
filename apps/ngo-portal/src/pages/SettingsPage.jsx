import React, { useState } from 'react';
import { Card, Button, Input, Badge } from '@streetpaw/ui';
import { Settings, ShieldCheck, Globe, Bell, Moon, Sun, Save } from 'lucide-react';

export function SettingsPage({ currentUser, isAllAreas, onToggleScope, theme, onToggleTheme }) {
  const [orgName, setOrgName] = useState(currentUser?.organisation_name || 'CUPA Animal Rescue & Welfare Center');
  const [cityZone, setCityZone] = useState('Bengaluru South & Central');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '720px' }}>
      <div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Settings size={28} color="#c084fc" /> NGO Portal & Service Area Settings
        </h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Configure dispatch zone parameters, theme modes, and organisation credentials
        </span>
      </div>

      {savedSuccess && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.2)', border: '1px solid #22c55e', color: '#4ade80', fontSize: '0.85rem' }}>
          ✓ Portal settings updated successfully!
        </div>
      )}

      <Card variant="glass">
        <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0 }}>Organisation Configuration</h4>

          <Input label="Organisation Name" value={orgName} onChange={(e) => setOrgName(e.target.value)} required />
          <Input label="Primary Dispatch City & Zone" value={cityZone} onChange={(e) => setCityZone(e.target.value)} required />

          <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', margin: 0 }}>Display & Scope Preferences</h4>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(30, 41, 59, 0.6)', borderRadius: '8px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>Portal Theme Mode</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Mode: {theme.toUpperCase()}</div>
              </div>
              <Button type="button" variant="secondary" icon={theme === 'dark' ? Sun : Moon} onClick={onToggleTheme}>
                Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
              </Button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(30, 41, 59, 0.6)', borderRadius: '8px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>Service Area Scope</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{isAllAreas ? 'Showing all city areas' : 'Restricted to assigned org area'}</div>
              </div>
              <Button type="button" variant="emerald" icon={Globe} onClick={onToggleScope}>
                Toggle Scope
              </Button>
            </div>
          </div>

          <Button type="submit" variant="emerald" size="lg" icon={Save} style={{ marginTop: '12px' }}>
            Save Settings
          </Button>
        </form>
      </Card>
    </div>
  );
}
