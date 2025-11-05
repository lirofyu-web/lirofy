// components/icons/CogIcon.tsx
import React from 'react';

export const CogIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24"
    className={className || 'w-6 h-6'}
    role="img"
    aria-label="Configurações Icon"
  >
    <defs>
      <linearGradient id="gearGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#b0bec5" />
        <stop offset="100%" stopColor="#78909c" />
      </linearGradient>
      <radialGradient id="gearHole" cx="0.5" cy="0.5" r="0.5">
        <stop offset="70%" stopColor="#546e7a" stopOpacity="0"/>
        <stop offset="100%" stopColor="#546e7a"/>
      </radialGradient>
    </defs>
    <path fill="url(#gearGrad)" d="M19.4,12.6l-1.6-0.5c-0.1-0.5-0.3-1-0.5-1.4l0.8-1.5c-0.3-0.5-0.7-1-1.2-1.3l-1.5,0.8 c-0.4-0.2-0.9-0.4-1.4-0.5l-0.5-1.6C13.4,4.1,12.7,4,12,4s-1.4,0.1-1.6,0.6L9.8,6.2C9.4,6.3,8.9,6.5,8.4,6.7L7,5.9 C6.5,6.2,6,6.6,5.7,7.1l0.8,1.5C6.3,9.1,6.1,9.5,6,10.1l-1.6,0.5C4.1,10.6,4,11.3,4,12s0.1,1.4,0.6,1.6l1.6,0.5 c0.1,0.5,0.3,1,0.5,1.4l-0.8,1.5c0.3,0.5,0.7,1,1.2,1.3l1.5-0.8c0.4,0.2,0.9,0.4,1.4,0.5l0.5,1.6c0.2,0.5,0.9,0.6,1.6,0.6 s1.4-0.1,1.6-0.6l0.5-1.6c0.5-0.1,1-0.3,1.4-0.5l1.5,0.8c0.5-0.3,1-0.7,1.3-1.2l-0.8-1.5c0.2-0.4,0.4-0.9,0.5-1.4l1.6-0.5 C19.9,13.4,20,12.7,20,12S19.9,10.6,19.4,10.4z M12,16c-2.2,0-4-1.8-4-4s1.8-4,4-4s4,1.8,4,4S14.2,16,12,16z"/>
    <circle cx="12" cy="12" r="6" fill="url(#gearHole)" />
    <circle cx="12" cy="12" r="2.5" fill="#cfd8dc" />
  </svg>
);