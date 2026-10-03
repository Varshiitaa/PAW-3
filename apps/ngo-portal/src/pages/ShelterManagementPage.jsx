import React from 'react';
import { Card, Badge } from '@streetpaw/ui';
import { Home, Heart, ShieldCheck } from 'lucide-react';

export function ShelterManagementPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '6px' }}>Shelter Occupancy & Kennel Management</h2>
        <p style={{ color: 'var(--text-muted)' }}>Real-time shelter capacity, quarantine ward isolation, and adoption readiness tracking.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        <Card variant="glass">
          <Home size={28} color="var(--accent-emerald)" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>Quarantine Ward A</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '12px' }}>Dermatitis & Demodicosis Patients</p>
          <Badge variant="uncertain">10 / 12 Beds Occupied</Badge>
        </Card>

        <Card variant="glass">
          <Heart size={28} color="var(--primary-coral)" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>Adoption Readiness Kennel</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '12px' }}>Vaccinated & Friendly Dogs</p>
          <Badge variant="normal">8 Dogs Available for Adoption</Badge>
        </Card>
      </div>
    </div>
  );
}
