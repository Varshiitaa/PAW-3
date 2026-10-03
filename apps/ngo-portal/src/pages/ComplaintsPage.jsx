import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Badge, Modal } from '@streetpaw/ui';
import {
  Ambulance, Search, Filter, AlertCircle, CheckCircle2, MapPin, Clock,
  UserCheck, ShieldCheck, FileText, Trash2, Edit3, Plus, ChevronRight,
  Download, Eye, Check, X, Layers, Grid, List, Sparkles, MessageSquare
} from 'lucide-react';

const KANBAN_COLUMNS = [
  { id: 'reported', label: 'Reported / Pending', color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)' },
  { id: 'acknowledged', label: 'Acknowledged', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)' },
  { id: 'team_dispatched', label: 'Team Dispatched', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.15)' },
  { id: 'in_progress', label: 'In Progress / Triage', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.15)' },
  { id: 'resolved', label: 'Resolved', color: '#4ade80', bg: 'rgba(34, 197, 94, 0.15)' },
  { id: 'closed', label: 'Closed', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' }
];

export function ComplaintsPage({ authToken, currentUser, searchQuery }) {
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'table'

  // Filter state
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');

  // Drawer / Detail Modal
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Status Change Confirmation Modal
  const [pendingStatusChange, setPendingStatusChange] = useState(null); // { complaintId, newStatus }
  const [statusNote, setStatusNote] = useState('');

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Fetch complaints on mount and interval
  useEffect(() => {
    fetchComplaints();
    const interval = setInterval(fetchComplaints, 5000);
    return () => clearInterval(interval);
  }, [statusFilter, urgencyFilter, searchQuery]);

  const fetchComplaints = async () => {
    try {
      let url = 'http://localhost:8000/api/rescues/';
      const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
      const res = await fetch(url, { headers });
      const data = await res.json();

      let list = Array.isArray(data) ? data : [];
      
      // Apply search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        list = list.filter(c =>
          c.public_id?.toLowerCase().includes(q) ||
          c.title?.toLowerCase().includes(q) ||
          c.address?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q)
        );
      }

      if (urgencyFilter !== 'all') {
        list = list.filter(c => (c.urgency || c.severity || '').toUpperCase() === urgencyFilter.toUpperCase());
      }

      setComplaints(list);
    } catch (err) {
      console.error('Error fetching complaints:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Status change handler
  const handleConfirmStatusChange = async () => {
    if (!pendingStatusChange || !authToken) return;
    const { complaintId, publicId, newStatus } = pendingStatusChange;

    try {
      const targetId = publicId || complaintId;
      const res = await fetch(`http://localhost:8000/api/rescues/${targetId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          status: newStatus,
          note: statusNote || `Status updated to ${newStatus.replace('_', ' ').toUpperCase()}`
        })
      });

      if (!res.ok) {
        alert("Failed to update complaint status.");
        return;
      }

      setPendingStatusChange(null);
      setStatusNote('');
      fetchComplaints();
      if (selectedComplaint && (selectedComplaint.id === complaintId || selectedComplaint.public_id === publicId)) {
        // Refresh single complaint drawer
        const updatedRes = await fetch(`http://localhost:8000/api/rescues/`, { headers: { 'Authorization': `Bearer ${authToken}` } });
        const allData = await updatedRes.json();
        const updatedSingle = allData.find(item => item.id === complaintId || item.public_id === publicId);
        if (updatedSingle) setSelectedComplaint(updatedSingle);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Bulk Status Change
  const handleBulkStatusChange = async (newStatus) => {
    if (selectedIds.length === 0 || !authToken) return;
    if (!confirm(`Apply status '${newStatus}' to ${selectedIds.length} selected complaints?`)) return;

    for (const id of selectedIds) {
      try {
        await fetch(`http://localhost:8000/api/rescues/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ status: newStatus, note: `Bulk status update to ${newStatus}` })
        });
      } catch (e) {}
    }
    setSelectedIds([]);
    fetchComplaints();
  };

  // Export selected
  const handleExportSelected = () => {
    const selectedComplaints = complaints.filter(c => selectedIds.includes(c.id) || selectedIds.includes(c.public_id));
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(selectedComplaints, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `complaints_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Soft Delete Complaint
  const handleDeleteComplaint = async (publicId) => {
    if (!confirm(`Soft delete complaint ${publicId}? This action will be recorded in audit log.`)) return;
    try {
      const res = await fetch(`http://localhost:8000/api/rescues/${publicId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        setIsDrawerOpen(false);
        fetchComplaints();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to map complaint to Kanban column ID
  const getColumnId = (statusStr) => {
    const s = (statusStr || '').toLowerCase();
    if (s.includes('report') || s.includes('pending')) return 'reported';
    if (s.includes('ack')) return 'acknowledged';
    if (s.includes('dispatch') || s.includes('ambulance') || s.includes('team')) return 'team_dispatched';
    if (s.includes('progress') || s.includes('triage') || s.includes('admitted')) return 'in_progress';
    if (s.includes('resolve')) return 'resolved';
    if (s.includes('close') || s.includes('cancel')) return 'closed';
    return 'reported';
  };

  // Helper for SLA Overdue Timer calculation (2 hours threshold)
  const getSLAStatus = (createdDateStr) => {
    if (!createdDateStr) return { isOverdue: false, text: 'Normal' };
    try {
      const created = new Date(createdDateStr);
      const diffMinutes = Math.floor((new Date() - created) / 60000);
      if (diffMinutes > 120) {
        return { isOverdue: true, text: `Overdue by ${Math.floor((diffMinutes - 120) / 60)}h ${diffMinutes % 60}m` };
      }
      return { isOverdue: false, text: `SLA: ${120 - diffMinutes}m remaining` };
    } catch (e) {
      return { isOverdue: false, text: 'Normal' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* HEADER BAR & CONTROLS */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Ambulance size={28} color="#22c55e" /> Rescue & Complaint Dispatch Desk
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Real-time citizen SOS reports and dispatch coordination
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* View Toggle */}
          <div style={{ display: 'flex', background: 'rgba(30, 41, 59, 0.8)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'kanban' ? '#22c55e' : 'transparent',
                color: viewMode === 'kanban' ? '#fff' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Grid size={14} /> Kanban Board
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'table' ? '#22c55e' : 'transparent',
                color: viewMode === 'table' ? '#fff' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <List size={14} /> Table View
            </button>
          </div>
        </div>
      </div>

      {/* FILTER BAR & BULK ACTIONS */}
      <Card variant="glass" style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>Urgency:</span>
            {['all', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUrgencyFilter(u)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  border: '1px solid var(--border-subtle)',
                  background: urgencyFilter === u ? '#22c55e' : 'rgba(30, 41, 59, 0.5)',
                  color: urgencyFilter === u ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                {u}
              </button>
            ))}
          </div>

          {/* Bulk Actions */}
          {selectedIds.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(34, 197, 94, 0.15)', padding: '6px 12px', borderRadius: '8px', border: '1px solid #22c55e' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#4ade80' }}>
                {selectedIds.length} Selected:
              </span>
              <Button size="sm" variant="secondary" onClick={() => handleBulkStatusChange('team_dispatched')}>
                Dispatch Team
              </Button>
              <Button size="sm" variant="emerald" onClick={() => handleBulkStatusChange('resolved')}>
                Mark Resolved
              </Button>
              <Button size="sm" variant="secondary" icon={Download} onClick={handleExportSelected}>
                Export JSON
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* VIEWMODE 1: KANBAN BOARD */}
      {viewMode === 'kanban' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', overflowX: 'auto', paddingBottom: '16px' }}>
          {KANBAN_COLUMNS.map((col) => {
            const colComplaints = complaints.filter(c => getColumnId(c.status || c.status_code) === col.id);

            return (
              <div
                key={col.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  minHeight: '480px'
                }}
              >
                {/* Column Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: col.color }} />
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>{col.label}</h3>
                  </div>
                  <Badge variant="normal" style={{ background: col.bg, color: col.color, border: `1px solid ${col.color}` }}>
                    {colComplaints.length}
                  </Badge>
                </div>

                {/* Complaint Cards in Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  {colComplaints.map((c) => {
                    const sla = getSLAStatus(c.created_at);

                    return (
                      <Card
                        key={c.id}
                        variant="glass"
                        style={{
                          padding: '14px',
                          cursor: 'pointer',
                          borderColor: sla.isOverdue ? '#ef4444' : 'var(--border-subtle)',
                          background: 'rgba(30, 41, 59, 0.6)',
                          transition: 'transform 0.15s ease'
                        }}
                        onClick={() => {
                          setSelectedComplaint(c);
                          setIsDrawerOpen(true);
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#4ade80', fontSize: '0.85rem' }}>
                            {c.public_id || c.ticket_id}
                          </span>
                          <Badge variant={c.urgency === 'CRITICAL' ? 'critical' : 'brand'}>
                            {c.urgency || c.severity || 'HIGH'}
                          </Badge>
                        </div>

                        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', margin: '4px 0' }}>
                          {c.title || c.issue_type}
                        </h4>

                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 8px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {c.description || 'No detailed notes provided.'}
                        </p>

                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} color="var(--primary-coral)" /> {c.landmark || c.address}
                        </div>

                        {/* SLA Overdue Highlight */}
                        <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.7rem', color: sla.isOverdue ? '#f87171' : 'var(--text-muted)', fontWeight: sla.isOverdue ? 800 : 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> {sla.text}
                          </span>

                          {/* Quick Move Selector */}
                          <select
                            value={getColumnId(c.status || c.status_code)}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              setPendingStatusChange({
                                complaintId: c.id,
                                publicId: c.public_id || c.ticket_id,
                                newStatus: e.target.value
                              });
                            }}
                            style={{
                              fontSize: '0.7rem',
                              background: 'rgba(15, 23, 42, 0.9)',
                              color: '#fff',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '4px',
                              padding: '2px 4px'
                            }}
                          >
                            <option value="reported">Reported</option>
                            <option value="acknowledged">Acknowledged</option>
                            <option value="team_dispatched">Team Dispatched</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                        </div>
                      </Card>
                    );
                  })}
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* VIEWMODE 2: TABLE VIEW WITH BULK CHECKBOXES */
        <Card variant="glass" style={{ padding: '0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'rgba(30, 41, 59, 0.8)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '14px', width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.length === complaints.length && complaints.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(complaints.map(c => c.id));
                      else setSelectedIds([]);
                    }}
                  />
                </th>
                <th style={{ padding: '14px' }}>TICKET ID</th>
                <th style={{ padding: '14px' }}>ISSUE TYPE</th>
                <th style={{ padding: '14px' }}>LOCATION</th>
                <th style={{ padding: '14px' }}>URGENCY</th>
                <th style={{ padding: '14px' }}>STATUS</th>
                <th style={{ padding: '14px' }}>DATE / SLA</th>
                <th style={{ padding: '14px' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((c) => {
                const isChecked = selectedIds.includes(c.id);
                const sla = getSLAStatus(c.created_at);

                return (
                  <tr
                    key={c.id}
                    style={{ borderBottom: '1px solid var(--border-subtle)', background: isChecked ? 'rgba(34, 197, 94, 0.1)' : 'transparent' }}
                  >
                    <td style={{ padding: '14px' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIds([...selectedIds, c.id]);
                          else setSelectedIds(selectedIds.filter(id => id !== c.id));
                        }}
                      />
                    </td>
                    <td style={{ padding: '14px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#4ade80' }}>
                      {c.public_id || c.ticket_id}
                    </td>
                    <td style={{ padding: '14px', fontWeight: 700, color: '#ffffff' }}>
                      {c.title || c.issue_type}
                    </td>
                    <td style={{ padding: '14px', color: 'var(--text-muted)' }}>
                      {c.landmark || c.address}
                    </td>
                    <td style={{ padding: '14px' }}>
                      <Badge variant={c.urgency === 'CRITICAL' ? 'critical' : 'brand'}>
                        {c.urgency || c.severity || 'HIGH'}
                      </Badge>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <Badge variant={c.status === 'resolved' ? 'emerald' : 'normal'}>
                        {c.status?.toUpperCase()}
                      </Badge>
                    </td>
                    <td style={{ padding: '14px', fontSize: '0.8rem', color: sla.isOverdue ? '#f87171' : 'var(--text-muted)' }}>
                      {c.created_at} ({sla.text})
                    </td>
                    <td style={{ padding: '14px' }}>
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={Eye}
                        onClick={() => {
                          setSelectedComplaint(c);
                          setIsDrawerOpen(true);
                        }}
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* STATUS CHANGE CONFIRMATION MODAL WITH OPTIONAL NOTE */}
      {pendingStatusChange && (
        <Modal
          isOpen={!!pendingStatusChange}
          onClose={() => setPendingStatusChange(null)}
          title="Confirm Dispatch Status Update"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Changing status of complaint <strong>{pendingStatusChange.publicId}</strong> to <strong>{pendingStatusChange.newStatus.replace('_', ' ').toUpperCase()}</strong>.
            </p>

            <Input
              label="Internal Note / Timeline Update (Optional)"
              placeholder="e.g. Ambulance #4 dispatched with vet squad..."
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
            />

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <Button variant="secondary" onClick={() => setPendingStatusChange(null)}>
                Cancel
              </Button>
              <Button variant="emerald" onClick={handleConfirmStatusChange}>
                Confirm & Sync to Citizen App
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* COMPLAINT DRAWER / DETAIL MODAL */}
      {isDrawerOpen && selectedComplaint && (
        <Modal
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          title={`Complaint Record — ${selectedComplaint.public_id || selectedComplaint.ticket_id}`}
          maxWidth="760px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Header info */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              {selectedComplaint.photo && (
                <img
                  src={selectedComplaint.photo}
                  alt="Complaint Photo"
                  style={{ width: '160px', height: '160px', borderRadius: '12px', objectFit: 'cover' }}
                />
              )}
              <div style={{ flex: 1, minWidth: '240px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <Badge variant="critical">{selectedComplaint.urgency || selectedComplaint.severity}</Badge>
                  <Badge variant="emerald">{selectedComplaint.status?.toUpperCase()}</Badge>
                </div>

                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
                  {selectedComplaint.title || selectedComplaint.issue_type}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', marginTop: '6px' }}>
                  {selectedComplaint.description}
                </p>

                <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
                  <MapPin size={14} color="var(--primary-coral)" /> {selectedComplaint.address || selectedComplaint.landmark}
                </div>
              </div>
            </div>

            {/* Reporter Details (Visible ONLY to assigned Org) */}
            <div style={{ padding: '12px 16px', background: 'rgba(30, 41, 59, 0.8)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4ade80', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UserCheck size={14} /> Reporter Contact Info (Assigned Org Restricted View):
              </div>
              <div style={{ fontSize: '0.85rem', color: '#fff' }}>
                {selectedComplaint.reported_by || 'Verified Citizen'}
              </div>
            </div>

            {/* Status Timeline History */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', marginBottom: '10px' }}>
                Dispatch Timeline & Audit Trail
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedComplaint.events && selectedComplaint.events.length > 0 ? (
                  selectedComplaint.events.map((ev) => (
                    <div key={ev.id} style={{ padding: '8px 12px', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '6px', fontSize: '0.825rem', display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <strong style={{ color: '#4ade80' }}>{ev.status.toUpperCase()}</strong> — {ev.note}
                      </div>
                      <span style={{ color: 'var(--text-muted)' }}>{ev.created_at}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Signal registered at {selectedComplaint.created_at}
                  </div>
                )}
              </div>
            </div>

            {/* Actions Row */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button variant="critical" size="sm" icon={Trash2} onClick={() => handleDeleteComplaint(selectedComplaint.public_id)}>
                Soft Delete Complaint
              </Button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="secondary" size="sm" onClick={() => setPendingStatusChange({ complaintId: selectedComplaint.id, publicId: selectedComplaint.public_id, newStatus: 'team_dispatched' })}>
                  Dispatch Squad
                </Button>
                <Button variant="emerald" size="sm" onClick={() => setPendingStatusChange({ complaintId: selectedComplaint.id, publicId: selectedComplaint.public_id, newStatus: 'resolved' })}>
                  Mark Resolved
                </Button>
              </div>
            </div>

          </div>
        </Modal>
      )}

    </div>
  );
}
