import React from 'react';
import { Check } from 'lucide-react';

export function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'emerald' | 'danger' | 'ghost' | 'glass'
  size = 'md', // 'sm' | 'md' | 'lg'
  icon: Icon,
  disabled = false,
  loading = false,
  done = false,
  className = '',
  onClick,
  type = 'button',
  style = {},
  ...props
}) {
  const getVariantStyles = () => {
    if (done) {
      return {
        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        color: '#ffffff',
        boxShadow: '0 4px 18px rgba(34, 197, 94, 0.35)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      };
    }
    switch (variant) {
      case 'primary':
        return {
          background: 'linear-gradient(135deg, #ff7e67 0%, #ff5733 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 18px rgba(255, 126, 103, 0.38)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
        };
      case 'secondary':
        return {
          background: 'rgba(255, 255, 255, 0.06)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-medium)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
        };
      case 'emerald':
        return {
          background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 18px rgba(34, 197, 94, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
        };
      case 'danger':
        return {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
          border: 'none',
        };
      case 'glass':
        return {
          background: 'rgba(19, 25, 41, 0.75)',
          backdropFilter: 'blur(12px)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-medium)',
        };
      case 'ghost':
      default:
        return {
          background: 'transparent',
          color: 'var(--text-secondary)',
          border: '1px solid transparent',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { padding: '8px 18px', minHeight: '40px', fontSize: '0.85rem', borderRadius: 'var(--radius-full)' };
      case 'lg':
        return { padding: '14px 28px', minHeight: '52px', fontSize: '1.025rem', borderRadius: 'var(--radius-full)' };
      case 'md':
      default:
        return { padding: '12px 24px', minHeight: '48px', fontSize: '0.925rem', borderRadius: 'var(--radius-full)' };
    }
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        fontWeight: 700,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        transition: 'all 220ms cubic-bezier(0.22, 1, 0.36, 1)',
        fontFamily: 'var(--font-heading)',
        letterSpacing: '0.01em',
        userSelect: 'none',
        animation: loading ? 'sp-soft-pulse 1.5s infinite ease-in-out' : 'none',
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...style,
      }}
      className={`sp-button ${className}`}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
          e.currentTarget.style.filter = 'brightness(1.08)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.filter = 'none';
        }
      }}
      onMouseDown={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'translateY(1px) scale(0.97)';
        }
      }}
      onMouseUp={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
        }
      }}
      {...props}
    >
      {loading ? (
        <span
          style={{
            width: '18px',
            height: '18px',
            border: '2px solid rgba(255,255,255,0.3)',
            borderTopColor: '#fff',
            borderRadius: '50%',
            animation: 'sp-spin 0.6s linear infinite',
          }}
        />
      ) : done ? (
        <Check size={size === 'sm' ? 16 : 20} strokeWidth={3} />
      ) : Icon ? (
        <Icon size={size === 'sm' ? 16 : size === 'lg' ? 22 : 18} />
      ) : null}
      {children}
    </button>
  );
}
