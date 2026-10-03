import React from 'react';
import { Card, Badge, Button } from '@streetpaw/ui';
import { Ambulance, MapPin, PhoneCall, CheckCircle2 } from 'lucide-react';

export function ActiveRescuesPage() {
  const activeUnits = [
    { unit: 'Ambulance #1 (KA-05-EA-4410)', driver: 'Ramesh Kumar', status: 'En Route to DSU Gate 2', eta: '6 mins', targetCase: 'RSC-9042' },
    { unit: 'Ambulance #2 (KA-05-EA-8821)', driver: 'Suresh V.', status: 'Transporting to Vet Clinic', eta: '14 mins', targetCase: 'RSC-8812' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '6px' }}>Active SOS Ambulance Dispatches</h2>
        <p style={{ color: 'var(--text-muted)' }}>GPS location tracking, driver assignment, and transport coordination for emergency rescues.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {activeUnits.map((u, idx) => (
          <Card key={idx} variant="glow">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <Badge variant="pending">{u.status}</Badge>
              <Ambulance size={22} color="var(--primary-coral)" />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '4px' }}>{u.unit}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '12px' }}>Driver: {u.driver}</p>

            <div style={{ padding: '12px', background: 'rgba(15, 21, 35, 0.8)', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target Ticket:</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary-coral)' }}>{u.targetCase}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', marginTop: '4px', fontWeight: 600 }}>Estimated Arrival: {u.eta}</div>
            </div>

            <Button variant="secondary" icon={PhoneCall} style={{ width: '100%' }}>
              Call Rescue Driver
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
