// components/icons/PurpleBilliardBallIcon.tsx
import React from 'react';

export const PurpleBilliardBallIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className || 'w-4 h-4'} role="img" aria-label="Status: Aviso Pendente">
    <defs>
      <radialGradient id="purple-ball-grad" cx="0.35" cy="0.35" r="0.65">
        <stop offset="0%" stopColor="white" stopOpacity="0.4" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </radialGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="#8B5CF6" />
    <circle cx="12" cy="12" r="10" fill="url(#purple-ball-grad)" />
  </svg>
);