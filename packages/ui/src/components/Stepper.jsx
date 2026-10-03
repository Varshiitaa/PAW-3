import React from 'react';
import { Check } from 'lucide-react';

export function Stepper({ steps = [], currentStep = 0 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '12px 0' }}>
      {steps.map((step, idx) => {
        const isCompleted = idx < currentStep;
        const isCurrent = idx === currentStep;

        return (
          <React.Fragment key={step.id || idx}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 2 }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-heading)',
                  background: isCompleted
                    ? 'var(--accent-emerald)'
                    : isCurrent
                    ? 'var(--primary-gradient)'
                    : 'var(--bg-input)',
                  color: isCompleted || isCurrent ? '#ffffff' : 'var(--text-muted)',
                  border: isCurrent ? 'none' : '1px solid var(--border-subtle)',
                  boxShadow: isCurrent ? 'var(--primary-glow)' : 'none',
                  transition: 'var(--motion-normal)',
                }}
              >
                {isCompleted ? <Check size={18} /> : idx + 1}
              </div>
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: isCurrent ? 700 : 500,
                  color: isCurrent ? 'var(--primary-coral)' : isCompleted ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: '2px',
                  margin: '0 8px',
                  marginBottom: '24px',
                  background: idx < currentStep ? 'var(--accent-emerald)' : 'var(--border-subtle)',
                  transition: 'var(--motion-normal)',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
