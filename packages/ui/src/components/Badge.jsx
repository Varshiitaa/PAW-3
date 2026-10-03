import React from 'react';

export function Badge({
  children,
  variant = 'normal', // 'normal' | 'disease' | 'uncertain' | 'pending' | 'critical' | 'brand'
  size = 'md',
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'disease':
      case 'critical':
        return {
          background: 'rgba(239, 68, 68, 0.15)',
          color: '#f87171',
          border: '1px solid rgba(239, 68, 68, 0.35)',
        };
      case 'uncertain':
        return {
          background: 'rgba(245, 158, 11, 0.15)',
          color: '#fbbf24',
          border: '1px solid rgba(245, 158, 11, 0.35)',
        };
      case 'pending':
        return {
          background: 'rgba(59, 130, 246, 0.15)',
          color: '#60a5fa',
          border: '1px solid rgba(59, 130, 246, 0.35)',
        };
      case 'brand':
        return {
          background: 'rgba(255, 126, 103, 0.15)',
          color: 'var(--primary-coral)',
          border: '1px solid var(--border-medium)',
        };
      case 'normal':
      default:
        return {
          background: 'rgba(34, 197, 94, 0.15)',
          color: '#4ade80',
          border: '1px solid rgba(34, 197, 94, 0.35)',
        };
    }
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: size === 'sm' ? '2px 8px' : '4px 12px',
        borderRadius: 'var(--radius-full)',
        fontSize: size === 'sm' ? '0.75rem' : '0.825rem',
        fontWeight: 600,
        fontFamily: 'var(--font-heading)',
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
        ...getVariantStyles(),
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: 'currentColor',
        }}
      />
      {children}
    </span>
  );
}
