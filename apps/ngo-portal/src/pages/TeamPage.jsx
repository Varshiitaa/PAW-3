import React, { useState } from 'react';
import { Card, Button, Badge, Input } from '@streetpaw/ui';
import { UserCheck, Plus, ShieldCheck, Ambulance, MapPin, Phone, Mail } from 'lucide-react';

export function TeamPage({ currentUser }) {
  const [squads, setSquads] = useState([
    { id: 1, name: 'CUPA Emergency Rescue Squad #4', lead: 'Vikram Singh', zone: 'Hosur Road / BTM / JP Nagar', members: 4, vehicle: 'KA-05-EX-9042', status: 'On Duty' },
    { id: 2, name: 'BBMP Stray Dog ABC Drive Squad #3', lead: 'Dr. Ramesh Kumar', zone: 'Koramangala / Indiranagar', members: 6, vehicle: 'KA-01-AB-3310', status: 'On Duty' },
    { id: 3, name: 'CARE Trauma & Rehabilitation Squad', lead: 'Priya Sharma', zone: 'Whitefield / Electronic City', members: 3, vehicle: 'KA-53-MC-8812', status: 'Standby' }
  ]);

  const [isAdding, setIsAdding] = useState(false);
  const [newSquadName, setNewSquadName] = useState('');
  const [newLead, setNewLead] = useState('');
  const [newZone, setNewZone] = useState('');

  const handleAddSquad = (e) => {
    e.preventDefault();
    if (!newSquadName.trim()) return;
    setSquads([...squads, {
      id: Date.now(),
      name: newSquadName,
      lead: newLead || 'Assigned Officer',
      zone: newZone || 'Central Zone',
      members: 2,
      vehicle: 'KA-02-RS-1100',
      status: 'On Duty'
    }]);
    setIsAdding(false);
    setNewSquadName('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UserCheck size={28} color="#4ade80" /> Rescue Squad & Dispatch Teams
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Manage active field ambulances, veterinary officers, and zone dispatch rosters
          </span>
        </div>

        <Button variant="emerald" icon={Plus} onClick={() => setIsAdding(true)}>
          Create Dispatch Squad
        </Button>
      </div>

      {isAdding && (
        <Card variant="glass" style={{ maxWidth: '600px', borderColor: '#4ade80' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>Add New Dispatch Squad</h4>
          <form onSubmit={handleAddSquad} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Input label="Squad Name" placeholder="e.g. Squad #5 Central Rescue" value={newSquadName} onChange={(e) => setNewSquadName(e.target.value)} required />
            <Input label="Squad Lead Officer" placeholder="e.g. Dr. Ananya Roy" value={newLead} onChange={(e) => setNewLead(e.target.value)} />
            <Input label="Assigned Zone / Area" placeholder="e.g. Malleshwaram / Rajajinagar" value={newZone} onChange={(e) => setNewZone(e.target.value)} />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <Button type="button" variant="secondary" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button type="submit" variant="emerald">Register Squad</Button>
            </div>
          </form>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {squads.map((sq) => (
          <Card key={sq.id} variant="glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <Badge variant="emerald">{sq.status}</Badge>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>🚑 {sq.vehicle}</span>
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '6px' }}>{sq.name}</h3>
              <div style={{ fontSize: '0.85rem', color: '#4ade80', fontWeight: 700 }}>Lead: {sq.lead}</div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={14} color="var(--primary-coral)" /> {sq.zone}
              </div>
            </div>

            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sq.members} Active Rescuers</span>
              <Button size="sm" variant="secondary">Manage Squad</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
