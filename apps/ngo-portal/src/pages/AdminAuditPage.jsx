import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Badge, Modal } from '@streetpaw/ui';
import { History, ShieldAlert, Search, Filter, Eye, UserCheck, Calendar, Lock } from 'lucide-react';

export function AdminAuditPage({ authToken, currentUser }) {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');

  // Diff Modal state
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDiffOpen, setIsDiffOpen] = useState(false);

  useEffect(() => {
    fetchAuditLogs();
  }, [entityFilter, actionFilter]);

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      let url = 'http://localhost:8000/api/admin/audit-log?limit=100&';
      if (entityFilter !== 'all') url += `entity_type=${entityFilter}&`;
      if (actionFilter !== 'all') url += `action=${actionFilter}&`;

      const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
      const res = await fetch(url, { headers });
      
      if (!res.ok) {
        if (res.status === 403) {
          setLogs([]);
          return;
        }
      }
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Non-Admin Permission Protection Screen
  if (currentUser && currentUser.role !== 'admin') {
    return (
      <Card variant="critical" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center', padding: '40px' }}>
        <Lock size={48} color="#f87171" style={{ marginBottom: '12px' }} />
        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f87171' }}>Access Denied — Admin Privilege Required</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '8px 0 0' }}>
          The System Audit Log Inspector is restricted exclusively to verified administrators. Your account (@{currentUser.username}) holds the role of <strong>{currentUser.role?.toUpperCase()}</strong>.
        </p>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <History size={28} color="#f87171" /> System Audit Log & Security Inspector
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Immutable change history and before/after diff audit trail (Admin Only)
          </span>
        </div>
      </div>

      {/* FILTER BAR */}
      <Card variant="glass" style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>Entity:</span>
            {['all', 'dog', 'complaint', 'user', 'lost_found_post', 'export'].map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEntityFilter(e)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  border: '1px solid var(--border-subtle)',
                  background: entityFilter === e ? '#f87171' : 'rgba(30, 41, 59, 0.5)',
                  color: entityFilter === e ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                {e}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>Action:</span>
            {['all', 'create', 'update', 'delete', 'confirm_match', 'export_dogs_excel'].map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setActionFilter(a)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  border: '1px solid var(--border-subtle)',
                  background: actionFilter === a ? '#f87171' : 'rgba(30, 41, 59, 0.5)',
                  color: actionFilter === a ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* AUDIT LOGS TABLE */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading Audit Logs...</div>
      ) : (
        <Card variant="glass" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'rgba(30, 41, 59, 0.8)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '14px' }}>TIMESTAMP</th>
                <th style={{ padding: '14px' }}>ACTOR</th>
                <th style={{ padding: '14px' }}>ACTION</th>
                <th style={{ padding: '14px' }}>ENTITY TYPE</th>
                <th style={{ padding: '14px' }}>ENTITY ID</th>
                <th style={{ padding: '14px' }}>DIFF</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '14px', fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {new Date(l.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '14px', fontWeight: 800, color: '#ffffff' }}>
                    {l.actor_name || `User #${l.actor_id || 'System'}`}
                  </td>
                  <td style={{ padding: '14px' }}>
                    <Badge variant={l.action.includes('delete') ? 'critical' : l.action.includes('create') ? 'emerald' : 'brand'}>
                      {l.action.toUpperCase()}
                    </Badge>
                  </td>
                  <td style={{ padding: '14px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    {l.entity_type}
                  </td>
                  <td style={{ padding: '14px', fontFamily: 'var(--font-mono)', color: '#4ade80' }}>
                    {l.entity_id}
                  </td>
                  <td style={{ padding: '14px' }}>
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={Eye}
                      onClick={() => {
                        setSelectedLog(l);
                        setIsDiffOpen(true);
                      }}
                    >
                      View Diff
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* BEFORE / AFTER DIFF INSPECTION MODAL */}
      {isDiffOpen && selectedLog && (
        <Modal
          isOpen={isDiffOpen}
          onClose={() => setIsDiffOpen(false)}
          title={`Audit Log Entry #${selectedLog.id} — ${selectedLog.action.toUpperCase()}`}
          maxWidth="680px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Actor: <strong>{selectedLog.actor_name}</strong> | Entity: <strong>{selectedLog.entity_type} #{selectedLog.entity_id}</strong> | Timestamp: {selectedLog.created_at}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <h5 style={{ fontSize: '0.85rem', color: '#f87171', fontWeight: 800, marginBottom: '6px' }}>Before State:</h5>
                <pre style={{ background: 'rgba(15, 23, 42, 0.9)', padding: '12px', borderRadius: '8px', fontSize: '0.75rem', color: '#f87171', overflowX: 'auto' }}>
                  {JSON.stringify(selectedLog.before, null, 2) || 'None (Created)'}
                </pre>
              </div>

              <div>
                <h5 style={{ fontSize: '0.85rem', color: '#4ade80', fontWeight: 800, marginBottom: '6px' }}>After State:</h5>
                <pre style={{ background: 'rgba(15, 23, 42, 0.9)', padding: '12px', borderRadius: '8px', fontSize: '0.75rem', color: '#4ade80', overflowX: 'auto' }}>
                  {JSON.stringify(selectedLog.after, null, 2) || 'None (Deleted)'}
                </pre>
              </div>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
