import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Badge, Modal } from '@streetpaw/ui';
import {
  PawPrint, Search, ShieldCheck, Syringe, Activity, History, Trash2, Edit3, Check, Plus, Eye, MapPin, AlertCircle
} from 'lucide-react';

export function DogsViewPage({ authToken, searchQuery }) {
  const [dogs, setDogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDog, setSelectedDog] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchDogs();
  }, [searchQuery]);

  const fetchDogs = async () => {
    setIsLoading(true);
    try {
      let url = 'http://localhost:8000/api/dogs/?';
      if (searchQuery) url += `q=${encodeURIComponent(searchQuery)}&`;
      const res = await fetch(url);
      const data = await res.json();
      setDogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSingleDog = async (code) => {
    try {
      const res = await fetch(`http://localhost:8000/api/dogs/${code}`);
      const data = await res.json();
      setSelectedDog(data);
      setEditForm({
        name: data.name || '',
        breed: data.breed || '',
        status: data.status || 'Healthy / Sterilized',
        sterilised: data.sterilised || 'unknown',
        ear_notch: data.ear_notch || false
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Verify vaccination / sterilisation action (Adds Verified Badge & Audit Log)
  const handleVerifyDogStatus = async (dogCode, verifyType) => {
    if (!authToken) return alert("Please login with NGO staff credentials.");
    try {
      const payload = {};
      if (verifyType === 'sterilised') payload.sterilised = 'yes';
      if (verifyType === 'vaccinated') payload.status = 'Healthy / Sterilized & Vaccinated';

      const res = await fetch(`http://localhost:8000/api/dogs/${dogCode}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(`Successfully verified ${verifyType} badge for dog ${dogCode}!`);
        fetchSingleDog(dogCode);
        fetchDogs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save Inline Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedDog || !authToken) return;
    try {
      const res = await fetch(`http://localhost:8000/api/dogs/${selectedDog.public_code}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        setIsEditing(false);
        fetchSingleDog(selectedDog.public_code);
        fetchDogs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Soft Delete Dog
  const handleSoftDeleteDog = async (dogCode) => {
    if (!confirm(`Soft delete dog profile ${dogCode}? Recorded in audit log with 10s undo window.`)) return;
    try {
      const res = await fetch(`http://localhost:8000/api/dogs/${dogCode}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        setIsDetailOpen(false);
        fetchDogs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PawPrint size={28} color="#4ade80" /> Digital Dog Registry & Audit Trail
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Central database of registered stray dogs, vaccination status, sightings, and health audit history
          </span>
        </div>
      </div>

      {/* DOGS TABLE */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading Dog Registry...</div>
      ) : (
        <Card variant="glass" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'rgba(30, 41, 59, 0.8)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '14px' }}>PAW CODE</th>
                <th style={{ padding: '14px' }}>DOG NAME</th>
                <th style={{ padding: '14px' }}>BREED</th>
                <th style={{ padding: '14px' }}>STERILISED</th>
                <th style={{ padding: '14px' }}>STATUS</th>
                <th style={{ padding: '14px' }}>LOCATION</th>
                <th style={{ padding: '14px' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {dogs.map((dog) => (
                <tr key={dog.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '14px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#4ade80' }}>
                    {dog.public_code}
                  </td>
                  <td style={{ padding: '14px', fontWeight: 700, color: '#ffffff' }}>
                    {dog.name}
                  </td>
                  <td style={{ padding: '14px', color: 'var(--text-muted)' }}>
                    {dog.breed}
                  </td>
                  <td style={{ padding: '14px' }}>
                    <Badge variant={dog.sterilised === 'yes' ? 'emerald' : 'normal'}>
                      {dog.sterilised === 'yes' ? '✓ VERIFIED YES' : 'UNKNOWN'}
                    </Badge>
                  </td>
                  <td style={{ padding: '14px' }}>
                    <Badge variant="emerald">{dog.status || dog.health_status}</Badge>
                  </td>
                  <td style={{ padding: '14px', color: 'var(--text-muted)' }}>
                    {dog.location}
                  </td>
                  <td style={{ padding: '14px' }}>
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={Eye}
                      onClick={() => {
                        fetchSingleDog(dog.public_code);
                        setIsDetailOpen(true);
                      }}
                    >
                      Inspect Profile
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* DOG INSPECTION & VERIFICATION MODAL */}
      {isDetailOpen && selectedDog && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => { setIsDetailOpen(false); setIsEditing(false); }}
          title={`Dog Profile — ${selectedDog.public_code}`}
          maxWidth="720px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Hero Card */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <img src={selectedDog.image_url} alt={selectedDog.name} style={{ width: '160px', height: '160px', borderRadius: '12px', objectFit: 'cover' }} />
              <div style={{ flex: 1, minWidth: '240px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#4ade80' }}>{selectedDog.public_code}</span>
                  <Badge variant="emerald">{selectedDog.status}</Badge>
                </div>

                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: '4px 0' }}>{selectedDog.name}</h3>
                <div style={{ fontSize: '0.9rem', color: 'var(--primary-coral)', fontWeight: 700 }}>{selectedDog.breed}</div>

                <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={14} color="var(--primary-coral)" /> {selectedDog.location}
                </div>

                {/* Verification Badges Row */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <Button size="sm" variant="emerald" icon={ShieldCheck} onClick={() => handleVerifyDogStatus(selectedDog.public_code, 'sterilised')}>
                    Verify Sterilised Badge
                  </Button>
                  <Button size="sm" variant="secondary" icon={Syringe} onClick={() => handleVerifyDogStatus(selectedDog.public_code, 'vaccinated')}>
                    Verify Vaccination
                  </Button>
                </div>
              </div>
            </div>

            {/* EDIT FORM or DISPLAY */}
            {isEditing ? (
              <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', background: 'rgba(30, 41, 59, 0.8)', borderRadius: '12px' }}>
                <Input label="Dog Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                <Input label="Breed" value={editForm.breed} onChange={(e) => setEditForm({ ...editForm, breed: e.target.value })} />
                <Input label="Status" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} />
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button type="submit" variant="emerald">Save Changes</Button>
                </div>
              </form>
            ) : (
              <Button variant="secondary" size="sm" icon={Edit3} onClick={() => setIsEditing(true)}>
                Edit Profile Record
              </Button>
            )}

            {/* Audit Log Timeline */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <History size={16} /> Audit Trail & History Log
              </h4>

              {selectedDog.last_editor ? (
                <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', padding: '10px 14px', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '8px' }}>
                  Last edited by <strong>{selectedDog.last_editor.actor_name}</strong> on {selectedDog.last_editor.date} ({selectedDog.last_editor.action})
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Initial creation record verified in database.
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="critical" size="sm" icon={Trash2} onClick={() => handleSoftDeleteDog(selectedDog.public_code)}>
                Soft Delete Dog Record
              </Button>
            </div>

          </div>
        </Modal>
      )}

    </div>
  );
}
