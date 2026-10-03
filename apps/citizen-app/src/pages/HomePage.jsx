import React from 'react';
import HeroVideoBanner from '../components/HeroVideoBanner';
import { PawlyMascot } from '../components/PawlyMascot';
import { PawBurstContainer } from '../components/PawBurst';
import { Camera, AlertCircle, Search, MapPin, ShieldCheck, Heart, Sparkles, Activity } from 'lucide-react';
import { Card, Button, Badge } from '@streetpaw/ui';

export function HomePage({ setActivePage }) {
  const stats = [
    { label: 'Stray Dogs Tagged', value: '1,428+', icon: Camera, color: 'var(--primary-coral)' },
    { label: 'Successful Rescues', value: '98.5%', icon: ShieldCheck, color: 'var(--accent-emerald)' },
    { label: 'Skin Disease Accuracy', value: '98.51%', icon: Activity, color: 'var(--accent-teal)' },
    { label: 'Partner NGOs', value: '42 Active', icon: Heart, color: 'var(--accent-purple)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
      {/* 1. HERO VIDEO BANNER (Unmodified Dog Video Banner) */}
      <HeroVideoBanner onExploreClick={() => {
        const el = document.getElementById('project-implementation-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }} />

      {/* 2. MAIN PLATFORM IMPLEMENTATION SECTION */}
      <div id="project-implementation-section" style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
        {/* Mascot Banner */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <PawlyMascot mood="happy" speech="Welcome to StreetPaw.AI! Upload a stray dog photo to start real-time health scanning!" />
        </div>

        {/* Action Cards */}
        <Card variant="glow" style={{ padding: '36px', textAlign: 'center', background: 'var(--tint-warm)' }}>
          <Badge variant="brand" style={{ marginBottom: '14px' }}>
            DAYANANDA SAGAR UNIVERSITY • DEPT OF COMPUTER SCIENCE & ENGINEERING
          </Badge>

          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '14px', lineHeight: 1.2 }}>
            AI-Powered Multi-Agent Platform for <br />
            <span style={{ background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Stray Animal Welfare & Emergency Care
            </span>
          </h2>

          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', maxWidth: '780px', margin: '0 auto 28px' }}>
            Real-time stray dog visual Re-ID, YOLOv8 detection, EfficientNet-B3 skin disease classification (Demodicosis / Dermatitis), and automated NGO rescue dispatch across India.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <PawBurstContainer type="paw">
              <Button variant="primary" size="lg" icon={Camera} onClick={() => setActivePage('scan')}>
                Launch AI Scanner
              </Button>
            </PawBurstContainer>

            <PawBurstContainer type="heart">
              <Button variant="emerald" size="lg" icon={AlertCircle} onClick={() => setActivePage('distress')}>
                Report SOS Distress
              </Button>
            </PawBurstContainer>

            <PawBurstContainer type="sparkle">
              <Button variant="secondary" size="lg" icon={Search} onClick={() => setActivePage('lost-found')}>
                Find Lost Pet
              </Button>
            </PawBurstContainer>
          </div>
        </Card>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          {stats.map((s, idx) => {
            const Icon = s.icon;
            return (
              <Card key={idx} variant="glass" interactive style={{ background: 'var(--bg-card)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</span>
                  <div style={{ padding: '8px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.04)', color: s.color }}>
                    <Icon size={20} />
                  </div>
                </div>
                <h3 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>{s.value}</h3>
              </Card>
            );
          })}
        </div>

        {/* Feature Story Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          <Card variant="glass" interactive style={{ background: 'var(--tint-warm)' }} onClick={() => setActivePage('scan')}>
            <Sparkles size={32} color="var(--primary-coral)" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>Vision AI Detection</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Instant YOLOv8 detection for dogs, cats, quadrupeds, plus EfficientNet-B3 breed identification and skin health screening.
            </p>
          </Card>

          <Card variant="glass" interactive style={{ background: 'var(--tint-sky)' }} onClick={() => setActivePage('map')}>
            <MapPin size={32} color="var(--accent-teal)" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>Hotspot & Density Map</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Interactive GPS heatmaps tracking stray dog population clusters, vaccination status, and high-risk distress zones.
            </p>
          </Card>

          <Card variant="glass" interactive style={{ background: 'var(--tint-rose)' }} onClick={() => setActivePage('distress')}>
            <AlertCircle size={32} color="var(--accent-rose)" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>Automated Rescue Dispatch</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Severity-ranked distress reports automatically routed to nearby verified NGOs, ambulances, and vet clinics.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
