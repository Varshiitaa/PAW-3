import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Card, Badge } from '@streetpaw/ui';
import { ShieldCheck, MapPin, Calendar, Heart, Syringe, Activity, History, Edit3, Trash2, RotateCcw, AlertTriangle, CheckCircle2, User, Clock, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LocationPicker } from './LocationPicker';

export function DogDetailModal({ dogCode, isOpen, onClose, onRefresh }) {
  const { user, token } = useAuth();
  const [dog, setDog] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Action Modals
  const [isAddVacOpen, setIsAddVacOpen] = useState(false);
  const [isAddSightingOpen, setIsAddSightingOpen] = useState(false);
  const [isAddHealthEventOpen, setIsAddHealthEventOpen] = useState(false);

  // Vaccination form
  const [vacType, setVacType] = useState('Anti-Rabies (ARV)');
  const [vacGivenBy, setVacGivenBy] = useState('BBMP Drive Squad #3');
  const [vacNotes, setVacNotes] = useState('Annual anti-rabies drive tag');

  // Health event form
  const [eventType, setEventType] = useState('observation');
  const [eventDesc, setEventDesc] = useState('');

  // Delete & Undo State
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [deletedState, setDeletedState] = useState(null);
  const [undoSeconds, setUndoSeconds] = useState(10);

  useEffect(() => {
    if (dogCode && isOpen) {
      fetchDetail();
    }
  }, [dogCode, isOpen]);

  const fetchDetail = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/dogs/${dogCode}`);
      const data = await res.json();
      setDog(data);
      setEditForm({
        name: data.name || '',
        breed: data.breed || 'Indian Pariah / Desi',
        sex: data.sex || 'unknown',
        approx_age: data.approx_age || '',
        colour_markings: data.colour_markings || '',
        sterilised: data.sterilised || 'unknown',
        ear_notch: data.ear_notch || false,
        status: data.health_status || data.status || 'Healthy / Sterilized'
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!token) return alert("Please login to update record.");
    try {
      const res = await fetch(`http://localhost:8000/api/dogs/${dogCode}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.detail || "Permission denied to edit this record.");
        return;
      }
      setIsEditing(false);
      fetchDetail();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddVaccination = async (e) => {
    e.preventDefault();
    if (!token) return alert("Please login to record vaccination.");
    try {
      await fetch(`http://localhost:8000/api/dogs/${dogCode}/vaccinations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          vaccine: vacType,
          given_by: vacGivenBy,
          notes: vacNotes
        })
      });
      setIsAddVacOpen(false);
      fetchDetail();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddHealthEvent = async (e) => {
    e.preventDefault();
    if (!token) return alert("Please login to record health event.");
    try {
      await fetch(`http://localhost:8000/api/dogs/${dogCode}/health-events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: eventType,
          description: eventDesc
        })
      });
      setIsAddHealthEventOpen(false);
      fetchDetail();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDog = async () => {
    if (confirmInput.trim().toUpperCase() !== dog.public_code.toUpperCase()) {
      alert(`Please type "${dog.public_code}" to confirm deletion.`);
      return;
    }
    if (!token) return alert("Please login to delete record.");

    try {
      const res = await fetch(`http://localhost:8000/api/dogs/${dogCode}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.detail || "Permission denied to delete this record.");
        return;
      }
      const data = await res.json();
      setIsDeleteConfirmOpen(false);
      setDeletedState(data);
      setUndoSeconds(10);

      // Countdown timer for 10 seconds undo
      const interval = setInterval(() => {
        setUndoSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setDeletedState(null);
            onClose();
            if (onRefresh) onRefresh();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestoreDog = async () => {
    if (!token) return;
    try {
      await fetch(`http://localhost:8000/api/dogs/${dogCode}/restore`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setDeletedState(null);
      fetchDetail();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={dog ? `Dog Profile — ${dog.public_code} (${dog.animal_id})` : "Dog Health Record"} maxWidth="680px">
      {isLoading ? (
        <div className="p-8 text-center text-muted">Loading complete dog health record...</div>
      ) : dog ? (
        <div className="dog-detail-modal-body">
          {/* Floating Undo Delete Toast */}
          {deletedState && (
            <div className="undo-delete-toast">
              <div className="flex items-center gap-2">
                <Trash2 size={18} color="#ef4444" />
                <span>Dog <strong>{dog.public_code}</strong> soft-deleted. ({undoSeconds}s to undo)</span>
              </div>
              <Button variant="emerald" size="sm" icon={RotateCcw} onClick={handleRestoreDog}>
                Undo Delete
              </Button>
            </div>
          )}

          {/* Hero Header Card */}
          <div className="dog-hero-header">
            <img src={dog.image_url} alt={dog.name} className="dog-hero-photo" />
            <div className="dog-hero-info">
              <div className="flex items-center justify-between">
                <span className="public-code-badge">{dog.public_code}</span>
                <Badge variant="emerald">{dog.status}</Badge>
              </div>

              <h3 className="text-xl font-bold text-white mt-1">{dog.name}</h3>
              <p className="text-sm text-coral-400 font-semibold">{dog.breed}</p>
              <p className="text-xs text-muted flex items-center gap-1 mt-1">
                <MapPin size={14} color="var(--primary-coral)" /> {dog.location}
              </p>

              <div className="mt-2.5 flex items-center gap-2">
                <Button
                  variant="brand"
                  size="sm"
                  icon={MessageSquare}
                  onClick={() => {
                    onClose();
                    window.dispatchEvent(new CustomEvent('streetpaw:open-pawly-chat', {
                      detail: {
                        dog_id: dog.public_code,
                        dog_name: dog.name,
                        breed: dog.breed,
                        location: dog.location,
                        status: dog.status,
                        sterilised: dog.sterilised,
                        vaccinated: dog.vaccinated
                      }
                    }));
                  }}
                >
                  Ask Pawly about this dog
                </Button>
              </div>

              {dog.last_editor && (
                <div className="last-editor-banner mt-2">
                  <Clock size={12} /> Last edited by <strong>{dog.last_editor.actor_name}</strong> on {dog.last_editor.date}
                </div>
              )}
            </div>
          </div>

          {/* EDIT FORM or DISPLAY */}
          {isEditing ? (
            <form onSubmit={handleUpdateProfile} className="edit-form-card">
              <h4 className="font-bold text-white text-sm mb-2">Edit Dog Record Details</h4>
              <div className="grid-2-col">
                <div>
                  <label className="field-label">Name</label>
                  <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                </div>
                <div>
                  <label className="field-label">Breed</label>
                  <Input value={editForm.breed} onChange={(e) => setEditForm({ ...editForm, breed: e.target.value })} />
                </div>
                <div>
                  <label className="field-label">Health / Sterilization Status</label>
                  <Input value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} />
                </div>
                <div>
                  <label className="field-label">Sterilised (ABC)</label>
                  <select className="custom-select" value={editForm.sterilised} onChange={(e) => setEditForm({ ...editForm, sterilised: e.target.value })}>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button type="submit" variant="emerald" icon={CheckCircle2}>Save Profile Changes</Button>
              </div>
            </form>
          ) : (
            <div className="action-toolbar">
              <Button variant="secondary" size="sm" icon={Edit3} onClick={() => setIsEditing(true)}>Edit Details</Button>
              <Button variant="glass" size="sm" icon={Syringe} onClick={() => setIsAddVacOpen(true)}>+ Vaccination</Button>
              <Button variant="glass" size="sm" icon={Activity} onClick={() => setIsAddHealthEventOpen(true)}>+ Health Event</Button>
              <Button variant="danger" size="sm" icon={Trash2} onClick={() => setIsDeleteConfirmOpen(true)}>Delete</Button>
            </div>
          )}

          {/* VACCINATIONS CARD WITH OVERDUE WARNINGS */}
          <Card variant="glass" className="section-card">
            <div className="section-header">
              <Syringe size={18} color="#10b981" />
              <h4 className="font-bold text-white text-sm">Vaccination Records ({dog.vaccinations.length})</h4>
            </div>

            {dog.vaccinations.length === 0 ? (
              <div className="text-xs text-muted">No vaccination records logged yet. Click '+ Vaccination' above.</div>
            ) : (
              <div className="vaccinations-list">
                {dog.vaccinations.map((v) => (
                  <div key={v.id} className="vac-item-row">
                    <div>
                      <div className="font-bold text-white text-sm">{v.vaccine}</div>
                      <div className="text-xs text-muted">Given: {v.date_given ? new Date(v.date_given).toLocaleDateString() : 'N/A'} • By: {v.given_by || 'Drive Unit'}</div>
                    </div>
                    <div>
                      {v.is_overdue ? (
                        <Badge variant="critical">⚠️ OVERDUE</Badge>
                      ) : v.is_due_soon ? (
                        <Badge variant="uncertain">⚡ DUE SOON</Badge>
                      ) : (
                        <Badge variant="emerald">✓ UP TO DATE</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* COMBINED SIGHTINGS & HEALTH TIMELINE */}
          <Card variant="glass" className="section-card">
            <div className="section-header">
              <History size={18} color="var(--primary-coral)" />
              <h4 className="font-bold text-white text-sm">Sighting & Health Timeline ({dog.sightings.length + dog.health_events.length})</h4>
            </div>

            <div className="timeline-events-list">
              {dog.sightings.map((s, i) => (
                <div key={`s-${s.id}-${i}`} className="timeline-row">
                  <MapPin size={16} color="var(--primary-coral)" className="flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-semibold text-white text-sm">Sighting at {s.address || s.area || dog.location}</div>
                    <div className="text-xs text-muted">{s.recorded_at ? new Date(s.recorded_at).toLocaleString() : 'Registered'} • {s.note || 'Community Sighting'}</div>
                  </div>
                </div>
              ))}

              {dog.health_events.map((ev, i) => (
                <div key={`h-${ev.id}-${i}`} className="timeline-row">
                  <Activity size={16} color="#60a5fa" className="flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-semibold text-blue-300 text-sm">Health Event: {ev.type}</div>
                    <div className="text-xs text-white">{ev.description}</div>
                    <div className="text-xs text-muted">{ev.date ? new Date(ev.date).toLocaleDateString() : 'Recorded'}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* DELETE CONFIRMATION MODAL */}
          <Modal isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} title={`Confirm Soft Delete — ${dog.public_code}`}>
            <div className="p-4 flex flex-col gap-4">
              <p className="text-sm text-red-300">
                Are you sure you want to soft delete dog profile <strong>{dog.public_code}</strong>? Type <strong>{dog.public_code}</strong> below to confirm.
              </p>

              <Input
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={`Type ${dog.public_code}`}
              />

              <div className="flex justify-end gap-2 mt-2">
                <Button variant="ghost" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
                <Button variant="danger" icon={Trash2} onClick={handleDeleteDog}>Confirm Soft Delete</Button>
              </div>
            </div>
          </Modal>

          {/* ADD VACCINATION MODAL */}
          <Modal isOpen={isAddVacOpen} onClose={() => setIsAddVacOpen(false)} title={`Record Vaccination — ${dog.public_code}`}>
            <form onSubmit={handleAddVaccination} className="p-4 flex flex-col gap-4">
              <div>
                <label className="field-label">Vaccine Type</label>
                <select className="custom-select" value={vacType} onChange={(e) => setVacType(e.target.value)}>
                  <option value="Anti-Rabies (ARV)">Anti-Rabies (ARV)</option>
                  <option value="DHPP 7-in-1">DHPP 7-in-1</option>
                  <option value="Anti-Rabies Booster">Anti-Rabies Booster</option>
                </select>
              </div>

              <div>
                <label className="field-label">Administered By</label>
                <Input value={vacGivenBy} onChange={(e) => setVacGivenBy(e.target.value)} placeholder="Drive unit / Vet doctor name" />
              </div>

              <div>
                <label className="field-label">Notes</label>
                <Input value={vacNotes} onChange={(e) => setVacNotes(e.target.value)} placeholder="Tag number, batch number..." />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="ghost" type="button" onClick={() => setIsAddVacOpen(false)}>Cancel</Button>
                <Button variant="emerald" type="submit" icon={CheckCircle2}>Save Vaccination</Button>
              </div>
            </form>
          </Modal>

          {/* ADD HEALTH EVENT MODAL */}
          <Modal isOpen={isAddHealthEventOpen} onClose={() => setIsAddHealthEventOpen(false)} title={`Record Health Observation — ${dog.public_code}`}>
            <form onSubmit={handleAddHealthEvent} className="p-4 flex flex-col gap-4">
              <div>
                <label className="field-label">Event Type</label>
                <select className="custom-select" value={eventType} onChange={(e) => setEventType(e.target.value)}>
                  <option value="scan">AI Vision Scan</option>
                  <option value="injury">Injury Scrape</option>
                  <option value="treatment">Deworming / Vet Treatment</option>
                  <option value="observation">General Observation</option>
                </select>
              </div>

              <div>
                <label className="field-label">Description / Diagnosis</label>
                <Input value={eventDesc} onChange={(e) => setEventDesc(e.target.value)} placeholder="e.g. Minor ear scratch treated with antiseptic..." required />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="ghost" type="button" onClick={() => setIsAddHealthEventOpen(false)}>Cancel</Button>
                <Button variant="emerald" type="submit" icon={CheckCircle2}>Record Health Event</Button>
              </div>
            </form>
          </Modal>
        </div>
      ) : null}
    </Modal>
  );
}
