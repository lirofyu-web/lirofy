// components/icons/CraneIcon.tsx
import React from 'react';

export const CraneIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className || 'w-6 h-6'}
    role="img"
    aria-label="Crane Machine Icon"
  >
    {/* Box */}
    <rect x="3" y="8" width="18" height="13" rx="1" />
    {/* Top section */}
    <path d="M3 8V5a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v3" />
    {/* Glass */}
    <rect x="5" y="10" width="14" height="9" fill="currentColor" fillOpacity="0.1" />
    {/* Crane arm */}
    <path d="M12 4v7" />
    {/* Claw */}
    <path d="M10 11c0 1.1.9 2 2 2s2-.9 2-2" />
    <path d="M10 11l-1 1" />
    <path d="M14 11l1 1" />
    {/* Joystick */}
    <line x1="18" y1="18" x2="18" y2="18.01" />
    <line x1="18" y1="16" x2="18" y2="18" />
  </svg>
);