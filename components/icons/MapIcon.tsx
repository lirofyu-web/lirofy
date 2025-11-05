// components/icons/MapIcon.tsx
import React from 'react';

export const MapIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24"
    className={className || 'w-6 h-6'}
    role="img"
    aria-label="Rotas Icon"
  >
    <defs>
      <linearGradient id="mapGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#a5d6a7" />
        <stop offset="100%" stopColor="#66bb6a" />
      </linearGradient>
    </defs>
    {/* Map Background */}
    <path fill="url(#mapGrad)" d="M4 4h16v16H4z" rx="2"/>
    {/* Roads */}
    <path fill="none" stroke="#fff" strokeWidth="1.5" strokeOpacity="0.7" d="M8 4v16M16 4v16M4 10h16M4 18h16"/>
    {/* Route Line */}
    <path fill="none" stroke="#ef5350" strokeWidth="2" strokeDasharray="2,2" d="M7 17 C 7 12, 12 12, 12 7"/>
    {/* Start Pin */}
    <circle cx="7" cy="17" r="2" fill="#42a5f5"/>
    <circle cx="7" cy="17" r="1" fill="#fff"/>
    {/* End Pin */}
    <path fill="#f44336" d="M12 2a5 5 0 0 1 0 10a5 5 0 0 1 0-10zm0 2a3 3 0 0 0 0 6a3 3 0 0 0 0-6z" />
    <circle cx="12" cy="7" r="1.5" fill="#fff"/>
  </svg>
);