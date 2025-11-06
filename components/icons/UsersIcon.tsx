// components/icons/UsersIcon.tsx
import React from 'react';

export const UsersIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24"
    className={className || 'w-6 h-6'}
    role="img"
    aria-label="Clientes Icon"
  >
    <defs>
      <linearGradient id="cardStack" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ff7eb9" />
        <stop offset="100%" stopColor="#ff63a5" />
      </linearGradient>
    </defs>
    {/* Back Card */}
    <rect x="4" y="8" width="16" height="12" rx="2" fill="#78909c" />
    {/* Middle Card */}
    <rect x="6" y="6" width="16" height="12" rx="2" fill="#546e7a" />
    {/* Front Card */}
    <rect x="2" y="4" width="16" height="12" rx="2" fill="url(#cardStack)" />
    {/* Person Icon on Front Card */}
    <circle cx="7" cy="9" r="2" fill="#fff" />
    <path d="M4.5 14c0-1.5 2-2.5 2.5-2.5s2.5 1 2.5 2.5v1h-5v-1z" fill="#fff" />
    {/* Text Lines on Front Card */}
    <rect x="11" y="8" width="5" height="1" fill="#fff" opacity="0.8"/>
    <rect x="11" y="10" width="5" height="1" fill="#fff" opacity="0.8"/>
    <rect x="11" y="12" width="3" height="1" fill="#fff" opacity="0.8"/>
  </svg>
);