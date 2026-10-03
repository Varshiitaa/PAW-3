import React from 'react';
import { Card, Button, Badge, DataTable } from '@streetpaw/ui';
import { AlertCircle, Ambulance, Stethoscope, CheckCircle2, Navigation } from 'lucide-react';

export function NgoDashboardPage() {
  const rescueCases = [
    { id: 'RSC-9042', severity: 'CRITICAL', condition: 'Hit & Run Trauma', location: 'Hosur Road Flyover, Gate 2', reporter: 'Varshita C.', status: 'PENDING DISPATCH', eta: '8 mins' },
    { id: 'RSC-8812', severity: 'HIGH', condition: 'Demodicosis Lesions', location: 'BTM 2nd Stage, 16th Main', reporter: 'Citizen App', status: 'AMBULANCE EN ROUTE', eta: '4 mins' },
    { id: 'RSC-7640', severity: 'MEDIUM', condition: 'Deep Scrape & Limping', location: 'Silk Board Junction', reporter: 'Traffic Police', status: 'ADMITTED TO VET', eta: 'Admitted' },
  ];

  const columns = [
    { title: 'Ticket #', key: 'id', render: (val) => <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary-coral)' }}>{val}</span> },
    { title: 'Severity Rank', key: 'severity', render: (val) => <Badge variant={val === 'CRITICAL' ? 'critical' : 'uncertain'}>{val}</Badge> },
    { title: 'Reported Condition', key: 'condition' },
    { title: 'Incident Location', key: 'location' },
    { title: 'Dispatch Status', key: 'status', render: (val) => <Badge variant={val.includes('EN ROUTE') ? 'pending' : 'normal'}>{val}</Badge> },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, row) => (
        <Button variant={row.status === 'PENDING DISPATCH' ? 'emerald' : 'secondary'} size="sm" icon={Ambulance}>
          {row.status === 'PENDING DISPATCH' ? 'Dispatch Driver' : 'Track Unit'}
        </Button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '6px' }}>NGO Dispatch Command Dashboard</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Real-time incident queue, AI-assisted medical severity ranking, and ambulance dispatch control center.
        </p>
      </div>

      {/* Metrics Header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <Card variant="glow">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Pending SOS Signals</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f87171', margin: '4px 0' }}>3 Emergency</div>
          <Badge variant="critical">High Priority</Badge>
        </Card>

        <Card variant="glass">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Active Ambulances</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-emerald)', margin: '4px 0' }}>4 Deployed</div>
          <Badge variant="normal">1 Available</Badge>
        </Card>

        <Card variant="glass">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>In-Patient Shelter Beds</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-teal)', margin: '4px 0' }}>28 / 35</div>
          <Badge variant="brand">80% Capacity</Badge>
        </Card>
      </div>

      {/* Active Incident Queue */}
      <Card variant="glass">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Live Incident & Rescue Queue</h3>
          <Button variant="secondary" size="sm">
            Refresh Stream
          </Button>
        </div>

        <DataTable columns={columns} data={rescueCases} keyField="id" />
      </Card>
    </div>
  );
}
