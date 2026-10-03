import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

export function Toast({ message, type = 'info', onClose }) {
  if (!message) return null;

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return { icon: CheckCircle2, border: 'var(--accent-emerald)', bg: 'rgba(34, 197, 94, 0.12)', color: '#4ade80' };
      case 'warning':
        return { icon: AlertTriangle, border: 'var(--accent-yellow)', bg: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24' };
      case 'error':
        return { icon: XCircle, border: 'var(--accent-rose)', bg: 'rgba(239, 68, 68, 0.12)', color: '#f87171' };
      case 'info':
      default:
        return { icon: Info, border: 'var(--primary-coral)', bg: 'rgba(255, 126, 103, 0.12)', color: 'var(--primary-coral)' };
    }
  };

  const config = getToastConfig();
  const Icon = config.icon;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 20px',
        background: 'var(--bg-dark-surface)',
        border: `1px solid ${config.border}`,
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        color: 'var(--text-primary)',
        maxWidth: '400px',
      }}
    >
      <Icon size={20} color={config.color} />
      <span style={{ fontSize: '0.9rem', flex: 1 }}>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
