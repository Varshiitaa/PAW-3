import React from 'react';
import { Card, Badge, DataTable } from '@streetpaw/ui';

export function MedicalCasesPage() {
  const cases = [
    { id: 'MED-104', animalId: 'DOG-7419', diagnosis: 'Demodicosis (Mange)', severity: 'Moderate', vet: 'Dr. Ananya Rao', status: 'Dipping Treatment Ongoing' },
    { id: 'MED-098', animalId: 'DOG-8842', diagnosis: 'Dermatitis & Scrapes', severity: 'Mild', vet: 'Dr. Vinay Kumar', status: 'Prescribed Antibiotics' },
  ];

  const columns = [
    { title: 'Case ID', key: 'id', render: (val) => <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary-coral)' }}>{val}</span> },
    { title: 'Animal Tag', key: 'animalId', render: (val) => <span style={{ fontFamily: 'var(--font-mono)' }}>{val}</span> },
    { title: 'AI Diagnosis', key: 'diagnosis' },
    { title: 'Severity', key: 'severity' },
    { title: 'Attending Vet', key: 'vet' },
    { title: 'Treatment Progress', key: 'status', render: (val) => <Badge variant="normal">{val}</Badge> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '6px' }}>Veterinary Triage & Medical Records</h2>
        <p style={{ color: 'var(--text-muted)' }}>Digital health charts, EfficientNet-B3 disease tracking, and prescription histories.</p>
      </div>

      <Card variant="glass">
        <DataTable columns={columns} data={cases} keyField="id" />
      </Card>
    </div>
  );
}
