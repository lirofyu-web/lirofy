// components/icons/LogoIcon.tsx
import React from 'react';

export const LogoIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 200 150" 
    className={className || 'w-24 h-auto'}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="logo-metal" x1="0.5" y1="0" x2="0.5" y2="1">
        <stop offset="0%" stopColor="#e5e7eb" />
        <stop offset="100%" stopColor="#9ca3af" />
      </linearGradient>
      <linearGradient id="logo-shadow" x1="0.5" y1="0" x2="0.5" y2="1">
        <stop offset="0%" stopColor="#6b7280" />
        <stop offset="100%" stopColor="#374151" />
      </linearGradient>
      <linearGradient id="logo-neon-green" x1="0.5" y1="0" x2="0.5" y2="1">
        <stop offset="0%" stopColor="#bef264" />
        <stop offset="100%" stopColor="#84cc16" />
      </linearGradient>
      <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {/* Circle Glow */}
    <circle cx="100" cy="75" r="70" fill="none" stroke="#a3e635" strokeWidth="6" filter="url(#neon-glow)" />

    {/* Mountain */}
    <g transform="translate(0, 5)">
      <path d="M100 15 L50 75 L150 75 Z" fill="url(#logo-metal)" />
      <path d="M100 15 L75 75 L125 75 Z" fill="url(#logo-shadow)" transform="translate(2, -2)" />
      <path d="M100 15 L80 55 L120 55 Z" fill="url(#logo-metal)" transform="translate(-1, 1)" />
      {/* Neon Lightning */}
      <path d="M100 18 l-10 20 h8 l-12 20 l18 -25 h-9 z" fill="url(#logo-neon-green)" />
    </g>

    {/* Text */}
    <text x="100" y="110" fontFamily="Inter, sans-serif" fontSize="24" fontWeight="900" textAnchor="middle" fill="url(#logo-metal)" stroke="#1f2937" strokeWidth="0.5">
      MONTANHA
    </text>
    <text x="100" y="130" fontFamily="Inter, sans-serif" fontSize="12" fontWeight="600" textAnchor="middle" fill="#9ca3af">
      BILHAR E JUKEBOX
    </text>
  </svg>
);
