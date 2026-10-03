import React from 'react';

export function DataTable({ columns = [], data = [], keyField = 'id', onRowClick }) {
  return (
    <div style={{ width: '100%', overflowX: 'auto', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ background: 'rgba(15, 21, 35, 0.9)', borderBottom: '1px solid var(--border-subtle)' }}>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding: '14px 18px',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-heading)',
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  letterSpacing: '0.05em',
                }}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={row[keyField] || idx}
              onClick={() => onRowClick && onRowClick(row)}
              style={{
                borderBottom: '1px solid var(--border-subtle)',
                background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)',
                cursor: onRowClick ? 'pointer' : 'default',
                transition: 'var(--motion-fast)',
              }}
              onMouseEnter={(e) => {
                if (onRowClick) e.currentTarget.style.background = 'rgba(255, 126, 103, 0.06)';
              }}
              onMouseLeave={(e) => {
                if (onRowClick) e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)';
              }}
            >
              {columns.map((col) => (
                <td key={col.key} style={{ padding: '14px 18px', color: 'var(--text-primary)' }}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
