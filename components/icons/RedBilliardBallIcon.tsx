// components/icons/RedBilliardBallIcon.tsx
import React from 'react';

export const RedBilliardBallIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className || 'w-4 h-4'} role="img" aria-label="Status: Visita Pendente">
    <defs>
      <radialGradient id="red-ball-grad" cx="0.35" cy="0.35" r="0.65">
        <stop offset="0%" stopColor="white" stopOpacity="0.4" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </radialGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="#F44336" />
    <circle cx="12" cy="12" r="10" fill="url(#red-ball-grad)" />
  </svg>
);