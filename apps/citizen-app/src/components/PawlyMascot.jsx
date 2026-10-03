import React, { useState, useEffect } from 'react';

export function PawlyMascot({ mood = 'happy', speech = 'Show me a photo and ask me anything.' }) {
  const [isBlinking, setIsBlinking] = useState(false);

  // Periodic blinking effect
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 200);
    }, 4000);

    return () => clearInterval(blinkInterval);
  }, []);

  const getHeadTransform = () => {
    switch (mood) {
      case 'thinking':
        return 'rotate(8deg)';
      case 'sad':
      case 'error':
        return 'rotate(-12deg)';
      case 'happy':
      default:
        return 'rotate(0deg)';
    }
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '14px',
        padding: '10px 18px',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 126, 103, 0.2)',
        borderRadius: 'var(--radius-full)',
        boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
        transition: 'var(--motion-normal)',
      }}
    >
      {/* SVG Animated Pawly Dog Mascot */}
      <svg
        width="46"
        height="46"
        viewBox="0 0 100 100"
        style={{
          transform: getHeadTransform(),
          transition: 'transform 300ms var(--ease-calm)',
          flexShrink: 0,
        }}
      >
        {/* Tail */}
        <path
          d="M 25 75 Q 10 60 20 45"
          fill="none"
          stroke="#ff7e67"
          strokeWidth="6"
          strokeLinecap="round"
          style={{
            animation: mood === 'happy' ? 'sp-tail-wag 1.2s ease-in-out infinite' : 'none',
            transformOrigin: '25px 75px',
          }}
        />

        {/* Dog Head */}
        <circle cx="50" cy="50" r="34" fill="#ff9e80" />
        <circle cx="50" cy="50" r="32" fill="#ffd9c0" />

        {/* Ears */}
        <ellipse cx="22" cy="38" rx="10" ry="18" fill="#ff7e67" transform="rotate(-15 22 38)" />
        <ellipse cx="78" cy="38" rx="10" ry="18" fill="#ff7e67" transform="rotate(15 78 38)" />

        {/* Eyes */}
        <ellipse cx="38" cy="46" rx="4" ry={isBlinking ? '0.5' : '6'} fill="#1e1b2e" />
        <ellipse cx="62" cy="46" rx="4" ry={isBlinking ? '0.5' : '6'} fill="#1e1b2e" />
        {!isBlinking && (
          <>
            <circle cx="40" cy="44" r="1.5" fill="#ffffff" />
            <circle cx="64" cy="44" r="1.5" fill="#ffffff" />
          </>
        )}

        {/* Snout & Cute Nose */}
        <ellipse cx="50" cy="58" rx="12" ry="8" fill="#ffffff" />
        <path d="M 46 54 Q 50 51 54 54 Q 50 60 46 54 Z" fill="#1e1b2e" />

        {/* Mouth */}
        <path d="M 44 61 Q 50 66 56 61" fill="none" stroke="#1e1b2e" strokeWidth="2.5" strokeLinecap="round" />
      </svg>

      {/* Speech Bubble */}
      <div>
        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary-coral)', letterSpacing: '0.04em' }}>
          PAWLY MASCOT
        </div>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '1px' }}>
          {speech}
        </div>
      </div>
    </div>
  );
}
