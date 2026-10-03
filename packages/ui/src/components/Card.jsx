import React from 'react';

export function Card({
  children,
  variant = 'glass', // 'glass' | 'solid' | 'glow'
  className = '',
  style = {},
  onClick,
  interactive = false,
  ...props
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'solid':
        return {
          background: 'var(--bg-dark-surface)',
          border: '1px solid var(--border-subtle)',
        };
      case 'glow':
        return {
          background: 'var(--bg-card)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--border-medium)',
          boxShadow: 'var(--shadow-glow)',
        };
      case 'glass':
      default:
        return {
          background: 'var(--bg-card)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-md)',
        };
    }
  };

  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: 'var(--radius-xl)',
        padding: '24px',
        color: 'var(--text-primary)',
        transition: 'var(--motion-normal)',
        cursor: interactive || onClick ? 'pointer' : 'default',
        ...getVariantStyles(),
        ...style,
      }}
      className={`sp-card ${className}`}
      onMouseEnter={(e) => {
        if (interactive || onClick) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.borderColor = 'var(--border-medium)';
          e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
        }
      }}
      onMouseLeave={(e) => {
        if (interactive || onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.borderColor = getVariantStyles().border;
          e.currentTarget.style.boxShadow = getVariantStyles().boxShadow || 'var(--shadow-md)';
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
}
