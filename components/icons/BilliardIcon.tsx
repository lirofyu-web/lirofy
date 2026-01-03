// components/icons/BilliardIcon.tsx
import React from 'react';

export const BilliardIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className || 'w-6 h-6'}
    role="img"
    aria-label="Ícone de Bilhar"
  >
    <defs>
      <radialGradient id="billiard-highlight-simple" cx="0.35" cy="0.35" r="0.65">
        <stop offset="0%" stopColor="white" stopOpacity="0.4" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </radialGradient>
    </defs>
    
    {/* Cue Stick */}
    <line x1="3" y1="21" x2="15" y2="9" stroke="#a0522d" strokeWidth="2" strokeLinecap="round" />
    <line x1="15" y1="9" x2="17" y2="7" stroke="#e0e0e0" strokeWidth="2" strokeLinecap="round" />
    
    {/* 8-Ball */}
    <g>
      <circle cx="16" cy="8" r="5" fill="#212121" />
      <circle cx="16" cy="8" r="2.5" fill="white" />
      <text
        x="16"
        y="8"
        textAnchor="middle"
        dy=".35em"
        fill="black"
        fontSize="2.5"
        fontWeight="bold"
        fontFamily="sans-serif"
      >
        8
      </text>
      <circle cx="16" cy="8" r="5" fill="url(#billiard-highlight-simple)" />
    </g>
  </svg>
);
