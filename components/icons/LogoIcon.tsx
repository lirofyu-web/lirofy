// components/icons/LogoIcon.tsx
import React from 'react';

export const LogoIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 50 48"
    className={className || 'w-6 h-6'}
    role="img"
    aria-label="Billiard Balls Logo"
  >
    <defs>
      <radialGradient id="ball-highlight" cx="0.35" cy="0.35" r="0.65">
        <stop offset="0%" stopColor="white" stopOpacity="0.5" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Row 5 */}
    <circle cx="5" cy="41" r="5" fill="#F44336" /> {/* Red */}
    <circle cx="15" cy="41" r="5" fill="#673AB7" /> {/* Purple */}
    <circle cx="25" cy="41" r="5" fill="#FF9800" /> {/* Orange */}
    <circle cx="35" cy="41" r="5" fill="#4CAF50" /> {/* Green */}
    <circle cx="45" cy="41" r="5" fill="#880E4F" /> {/* Maroon */}
    
    {/* Row 4 */}
    <circle cx="10" cy="32.34" r="5" fill="#880E4F" /> {/* Maroon */}
    <circle cx="20" cy="32.34" r="5" fill="#212121" /> {/* Black */}
    <circle cx="30" cy="32.34" r="5" fill="#FFC107" /> {/* Yellow */}
    <circle cx="40" cy="32.34" r="5" fill="#2196F3" /> {/* Blue */}
    
    {/* Row 3 */}
    <circle cx="15" cy="23.68" r="5" fill="#673AB7" /> {/* Purple */}
    <circle cx="25" cy="23.68" r="5" fill="#FF9800" /> {/* Orange */}
    <circle cx="35" cy="23.68" r="5" fill="#4CAF50" /> {/* Green */}
    
    {/* Row 2 */}
    <circle cx="20" cy="15.02" r="5" fill="#2196F3" /> {/* Blue */}
    <circle cx="30" cy="15.02" r="5" fill="#F44336" /> {/* Red */}
    
    {/* Row 1 */}
    <circle cx="25" cy="6.36" r="5" fill="#FFC107" /> {/* Yellow */}
    
    <g fill="url(#ball-highlight)">
      {/* Row 5 */}
      <circle cx="5" cy="41" r="5" />
      <circle cx="15" cy="41" r="5" />
      <circle cx="25" cy="41" r="5" />
      <circle cx="35" cy="41" r="5" />
      <circle cx="45" cy="41" r="5" />
      {/* Row 4 */}
      <circle cx="10" cy="32.34" r="5" />
      <circle cx="20" cy="32.34" r="5" />
      <circle cx="30" cy="32.34" r="5" />
      <circle cx="40" cy="32.34" r="5" />
      {/* Row 3 */}
      <circle cx="15" cy="23.68" r="5" />
      <circle cx="25" cy="23.68" r="5" />
      <circle cx="35" cy="23.68" r="5" />
      {/* Row 2 */}
      <circle cx="20" cy="15.02" r="5" />
      <circle cx="30" cy="15.02" r="5" />
      {/* Row 1 */}
      <circle cx="25" cy="6.36" r="5" />
    </g>
  </svg>
);
