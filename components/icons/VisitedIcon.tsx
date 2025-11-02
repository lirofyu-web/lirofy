// components/icons/VisitedIcon.tsx
import React from 'react';

export const VisitedIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24"
    className={className || 'w-6 h-6'}
    role="img"
    aria-label="Status: Visitado"
  >
    <defs>
      <radialGradient id="green-ball-highlight" cx="0.35" cy="0.35" r="0.65">
        <stop offset="0%" stopColor="white" stopOpacity="0.4" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </radialGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="#4CAF50" /> 
    <circle cx="12" cy="12" r="10" fill="url(#green-ball-highlight)" />
  </svg>
);