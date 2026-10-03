import React from 'react';

export function Select({
  label,
  options = [],
  value,
  onChange,
  error,
  required = false,
  className = '',
  ...props
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {label && (
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {label} {required && <span style={{ color: 'var(--primary-coral)' }}>*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: 'var(--bg-input)',
          border: error ? '1px solid var(--accent-rose)' : '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-primary)',
          fontSize: '0.95rem',
          fontFamily: 'var(--font-body)',
          outline: 'none',
          cursor: 'pointer',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%2394a3b8' viewBox='0 0 16 16'><path d='M8 11.5l-5-5h10l-5 5z'/></svg>")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 16px center',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-focus)';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255, 126, 103, 0.15)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? 'var(--accent-rose)' : 'var(--border-subtle)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        {...props}
      >
        {options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            style={{ background: '#111726', color: '#f8fafc' }}
          >
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span style={{ fontSize: '0.775rem', color: 'var(--accent-rose)' }}>{error}</span>}
    </div>
  );
}
