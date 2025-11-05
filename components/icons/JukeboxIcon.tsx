// components/icons/JukeboxIcon.tsx
import React from 'react';

export const JukeboxIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    className={className || 'w-6 h-6'} 
    role="img" 
    aria-label="Jukebox Icon"
  >
    <defs>
      <linearGradient id="jukeboxArchGrad" x1="0.5" y1="0" x2="0.5" y2="1">
        <stop offset="0%" stopColor="#40E0D0" />
        <stop offset="100%" stopColor="#008080" />
      </linearGradient>
      <linearGradient id="jukeboxSideGrad" x1="0.5" y1="0" x2="0.5" y2="1">
        <stop offset="0%" stopColor="#ff79c6" />
        <stop offset="100%" stopColor="#bd93f9" />
      </linearGradient>
      <radialGradient id="jukeboxSpeakerGrad">
        <stop offset="0%" stopColor="#8be9fd" />
        <stop offset="100%" stopColor="#50fa7b" />
      </radialGradient>
    </defs>
    
    {/* Main Body */}
    <path fill="#62423e" d="M19,22H5a1,1,0,0,1-1-1V11a6,6,0,1,1,12,0v10a1,1,0,0,1-1,1Z" />
    
    {/* Arch */}
    <path fill="url(#jukeboxArchGrad)" d="M18,11.5V11A6,6,0,0,0,6,11v.5A5.5,5.5,0,0,1,18,11.5Z" />
    <path fill="#282a36" d="M16.5,11.25V11a4.5,4.5,0,0,0-9,0v.25a4,4,0,0,1,9,0Z" />
    <path fill="#44475a" d="M15,11V11a3,3,0,0,0-6,0v0a2.5,2.5,0,0,1,6,0Z" />
    
    {/* Middle Panel */}
    <rect x="7" y="12" width="10" height="4" rx="0.5" fill="#282a36" />
    <rect x="8" y="13" width="1" height="1" rx="0.2" fill="#50fa7b" />
    <rect x="10" y="13" width="1" height="1" rx="0.2" fill="#ff79c6" />
    <rect x="12" y="13" width="1" height="1" rx="0.2" fill="#f1fa8c" />
    <rect x="14" y="13" width="1" height="1" rx="0.2" fill="#ffb86c" />
    
    {/* Speaker */}
    <path fill="url(#jukeboxSpeakerGrad)" d="M7,17 h10 v3 a2,2,0,0,1-2,2 H9 a2,2,0,0,1-2-2 Z" />
    
    {/* Side Pillars */}
    <rect x="2" y="10" width="3" height="12" rx="1" fill="url(#jukeboxSideGrad)" />
    <rect x="19" y="10" width="3" height="12" rx="1" fill="url(#jukeboxSideGrad)" />
    
    {/* Base */}
    <rect x="1" y="21" width="5" height="2" rx="1" fill="#bdc3c7" />
    <rect x="18" y="21" width="5" height="2" rx="1" fill="#bdc3c7" />
  </svg>
);
