import React, { useState } from 'react';
import { Card, Button, Input, Select, Badge, Skeleton, Tabs, Stepper } from '@streetpaw/ui';
import { PawBurstContainer } from '../components/PawBurst';
import { PawlyMascot } from '../components/PawlyMascot';
import { Sparkles, Heart, Camera, Check, ShieldCheck } from 'lucide-react';

export function StyleguidePage({ isCalmMode, toggleCalmMode }) {
  const [activeTab, setActiveTab] = useState('buttons');
  const [mascotMood, setMascotMood] = useState('happy');

  const tabs = [
    { id: 'buttons', label: 'Buttons & Particles' },
    { id: 'cards', label: 'Cards & Tints' },
    { id: 'mascot', label: 'Pawly Mascot' },
    { id: 'loaders', label: 'Loaders & Scanning Light' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1050px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <Badge variant="brand">STREETPAW.AI DESIGN SYSTEM</Badge>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '4px' }}>Interactive Visual Styleguide</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Live preview of design tokens, calm mesh gradients, ambient motion, touch micro-interactions, and accessibility rules.
          </p>
        </div>

        {/* Calm Mode / Reduced Motion Switch */}
        <Card variant="solid" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Calm Mode (Reduce Motion)</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Disables bursts & ambient loops</div>
          </div>
          <button
            onClick={toggleCalmMode}
            style={{
              width: '46px',
              height: '26px',
              borderRadius: '9999px',
              background: isCalmMode ? 'var(--accent-emerald)' : 'var(--bg-input)',
              border: '1px solid var(--border-medium)',
              cursor: 'pointer',
              position: 'relative',
              transition: 'var(--motion-fast)',
            }}
          >
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: '#ffffff',
                position: 'absolute',
                top: '3px',
                left: isCalmMode ? '23px' : '3px',
                transition: 'var(--motion-fast)',
              }}
            />
          </button>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* 1. Buttons & Particle Bursts */}
      {activeTab === 'buttons' && (
        <Card variant="glass" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Interactive Buttons & Paw Burst Effects</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Click any button below to trigger the satisfying 600ms PawBurst particle effect and soft scale transition.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <PawBurstContainer type="paw">
              <Button variant="primary" icon={Sparkles} size="lg">
                Primary Coral-Amber (Scan)
              </Button>
            </PawBurstContainer>

            <PawBurstContainer type="heart">
              <Button variant="emerald" icon={Heart} size="lg">
                Emerald Gradient (Rescue)
              </Button>
            </PawBurstContainer>

            <PawBurstContainer type="sparkle">
              <Button variant="secondary" icon={Camera} size="lg">
                Secondary Glass (Create ID)
              </Button>
            </PawBurstContainer>

            <Button variant="danger">Danger SOS</Button>
            <Button variant="ghost">Ghost Button</Button>
          </div>
        </Card>
      )}

      {/* 2. Cards & Section Tints */}
      {activeTab === 'cards' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <Card variant="glass" style={{ background: 'var(--tint-warm)' }} interactive>
            <Badge variant="brand">WARM TINT (HERO / SCAN)</Badge>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '10px 0 6px' }}>Warm Story Section</h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Soft coral undertones for welcoming scan interface.</p>
          </Card>

          <Card variant="glass" style={{ background: 'var(--tint-mint)' }} interactive>
            <Badge variant="normal">MINT TINT (REGISTRY)</Badge>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '10px 0 6px' }}>Mint Story Section</h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Refreshing green undertones for health registry.</p>
          </Card>

          <Card variant="glass" style={{ background: 'var(--tint-sky)' }} interactive>
            <Badge variant="pending">SKY BLUE TINT (MAP)</Badge>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '10px 0 6px' }}>Sky Blue Story Section</h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Calm azure undertones for hotspot mapping.</p>
          </Card>
        </div>
      )}

      {/* 3. Pawly Mascot */}
      {activeTab === 'mascot' && (
        <Card variant="glow" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Pawly AI Mascot Reaction Modes</h3>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant={mascotMood === 'happy' ? 'primary' : 'secondary'} size="sm" onClick={() => setMascotMood('happy')}>
              Happy (Success)
            </Button>
            <Button variant={mascotMood === 'thinking' ? 'primary' : 'secondary'} size="sm" onClick={() => setMascotMood('thinking')}>
              Thinking (Scan Wait)
            </Button>
            <Button variant={mascotMood === 'error' ? 'primary' : 'secondary'} size="sm" onClick={() => setMascotMood('error')}>
              Head Tilt (Error)
            </Button>
          </div>

          <PawlyMascot
            mood={mascotMood}
            speech={
              mascotMood === 'happy'
                ? 'Great news! Dog health scan finished with 98.5% confidence!'
                : mascotMood === 'thinking'
                ? 'Hmm, running deep neural classifier on this photo...'
                : 'Oops! Please make sure the photo clearly shows the stray dog.'
            }
          />
        </Card>
      )}

      {/* 4. Loaders & Sweeping Light */}
      {activeTab === 'loaders' && (
        <Card variant="glass" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Sweeping Light & Skeleton Shimmer Loaders</h3>

          {/* Sweeping Light Animation Box */}
          <div
            style={{
              height: '140px',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(15, 21, 35, 0.8)',
              border: '1px solid var(--border-medium)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Soft Sweeping Light Scanner Beam
            </span>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(90deg, rgba(255,126,103,0) 0%, rgba(255,126,103,0.25) 50%, rgba(255,126,103,0) 100%)',
                animation: 'sp-sweeping-beam 2.2s ease-in-out infinite',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Skeleton height="28px" width="70%" />
            <Skeleton height="18px" width="90%" />
            <Skeleton height="18px" width="40%" />
          </div>
        </Card>
      )}
    </div>
  );
}
