import React, { useState } from 'react';
import { PawPrint, Heart, Sparkles } from 'lucide-react';

export function PawBurstContainer({ children, onClick, type = 'paw' }) {
  const [particles, setParticles] = useState([]);

  const handleClick = (e) => {
    // Generate 5-6 micro burst particles
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const newParticles = Array.from({ length: 5 }).map((_, i) => ({
      id: Date.now() + i,
      x: clickX + (Math.random() * 40 - 20),
      y: clickY,
      size: Math.floor(Math.random() * 8) + 12,
      rotation: Math.floor(Math.random() * 60 - 30),
      color: i % 2 === 0 ? '#ff7e67' : '#22c55e',
    }));

    setParticles((prev) => [...prev, ...newParticles]);

    // Clear particles after 650ms
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
    }, 650);

    if (onClick) onClick(e);
  };

  return (
    <div
      onClick={handleClick}
      style={{ position: 'relative', display: 'inline-block', overflow: 'visible' }}
    >
      {children}

      {/* Floating Burst Particles */}
      {particles.map((p) => {
        const Icon = type === 'heart' ? Heart : type === 'sparkle' ? Sparkles : PawPrint;

        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: `${p.x}px`,
              top: `${p.y}px`,
              pointerEvents: 'none',
              zIndex: 99,
              color: p.color,
              transform: `rotate(${p.rotation}deg)`,
              animation: 'sp-burst-float 600ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
            }}
          >
            <Icon size={p.size} />
          </div>
        );
      })}
    </div>
  );
}
