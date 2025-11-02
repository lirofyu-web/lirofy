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
      <radialGradient id="ball-highlight-numbered" cx="0.35" cy="0.35" r="0.65">
        <stop offset="0%" stopColor="white" stopOpacity="0.3" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Row 5 */}
    <g>
      <circle cx="5" cy="41" r="5" fill="#F44336" /><circle cx="5" cy="41" r="2.5" fill="white" /><text x="5" y="41" textAnchor="middle" dy=".3em" fill="black" fontSize="2.5px" fontWeight="bold">3</text>
    </g>
    <g>
      <circle cx="15" cy="41" r="5" fill="#673AB7" /><circle cx="15" cy="41" r="2.5" fill="white" /><text x="15" y="41" textAnchor="middle" dy=".3em" fill="black" fontSize="2.5px" fontWeight="bold">4</text>
    </g>
    <g>
      <circle cx="25" cy="41" r="5" fill="#FF9800" /><circle cx="25" cy="41" r="2.5" fill="white" /><text x="25" y="41" textAnchor="middle" dy=".3em" fill="black" fontSize="2.5px" fontWeight="bold">5</text>
    </g>
    <g>
      <circle cx="35" cy="41" r="5" fill="#4CAF50" /><circle cx="35" cy="41" r="2.5" fill="white" /><text x="35" y="41" textAnchor="middle" dy=".3em" fill="black" fontSize="2.5px" fontWeight="bold">6</text>
    </g>
    <g>
      <circle cx="45" cy="41" r="5" fill="#880E4F" /><circle cx="45" cy="41" r="2.5" fill="white" /><text x="45" y="41" textAnchor="middle" dy=".3em" fill="black" fontSize="2.5px" fontWeight="bold">7</text>
    </g>
    
    {/* Row 4 */}
    <g>
      <circle cx="10" cy="32.34" r="5" fill="#880E4F" /><circle cx="10" cy="32.34" r="2.5" fill="white" /><text x="10" y="32.34" textAnchor="middle" dy=".3em" fill="black" fontSize="2.5px" fontWeight="bold">15</text>
    </g>
    <g>
      <circle cx="20" cy="32.34" r="5" fill="#212121" /><circle cx="20" cy="32.34" r="2.5" fill="white" /><text x="20" y="32.34" textAnchor="middle" dy=".3em" fill="black" fontSize="2.5px" fontWeight="bold">8</text>
    </g>
    <g>
        <circle cx="30" cy="32.34" r="5" fill="#FFC107" /><circle cx="30" cy="32.34" r="2.5" fill="white" /><text x="30" y="32.34" textAnchor="middle" dy=".3em" fill="black" fontSize="2.5px" fontWeight="bold">9</text>
    </g>
    <g>
        <circle cx="40" cy="32.34" r="5" fill="#2196F3" /><circle cx="40" cy="32.34" r="2.5" fill="white" /><text x="40" y="32.34" textAnchor="middle" dy=".3em" fill="black" fontSize="2.5px" fontWeight="bold">10</text>
    </g>
    
    {/* Row 3 */}
    <g>
        <circle cx="15" cy="23.68" r="5" fill="#673AB7" /><circle cx="15" cy="23.68" r="2.5" fill="white" /><text x="15" y="23.68" textAnchor="middle" dy=".3em" fill="black" fontSize="2.5px" fontWeight="bold">12</text>
    </g>
    <g>
        <circle cx="25" cy="23.68" r="5" fill="#FF9800" /><circle cx="25" cy="23.68" r="2.5" fill="white" /><text x="25" y="23.68" textAnchor="middle" dy=".3em" fill="black" fontSize="2.5px" fontWeight="bold">13</text>
    </g>
    <g>
        <circle cx="35" cy="23.68" r="5" fill="#4CAF50" /><circle cx="35" cy="23.68" r="2.5" fill="white" /><text x="35" y="23.68" textAnchor="middle" dy=".3em" fill="black" fontSize="2.5px" fontWeight="bold">14</text>
    </g>
    
    {/* Row 2 */}
    <g>
        <circle cx="20" cy="15.02" r="5" fill="#2196F3" /><circle cx="20" cy="15.02" r="2.5" fill="white" /><text x="20" y="15.02" textAnchor="middle" dy=".3em" fill="black" fontSize="2.5px" fontWeight="bold">2</text>
    </g>
    <g>
        <circle cx="30" cy="15.02" r="5" fill="#F44336" /><circle cx="30" cy="15.02" r="2.5" fill="white" /><text x="30" y="15.02" textAnchor="middle" dy=".3em" fill="black" fontSize="2.5px" fontWeight="bold">11</text>
    </g>
    
    {/* Row 1 */}
    <g>
        <circle cx="25" cy="6.36" r="5" fill="#FFC107" /><circle cx="25" cy="6.36" r="2.5" fill="white" /><text x="25" y="6.36" textAnchor="middle" dy=".3em" fill="black" fontSize="2.5px" fontWeight="bold">1</text>
    </g>
    
    <g fill="url(#ball-highlight-numbered)">
      <circle cx="5" cy="41" r="5" /><circle cx="15" cy="41" r="5" /><circle cx="25" cy="41" r="5" /><circle cx="35" cy="41" r="5" /><circle cx="45" cy="41" r="5" />
      <circle cx="10" cy="32.34" r="5" /><circle cx="20" cy="32.34" r="5" /><circle cx="30" cy="32.34" r="5" /><circle cx="40" cy="32.34" r="5" />
      <circle cx="15" cy="23.68" r="5" /><circle cx="25" cy="23.68" r="5" /><circle cx="35" cy="23.68" r="5" />
      <circle cx="20" cy="15.02" r="5" /><circle cx="30" cy="15.02" r="5" />
      <circle cx="25" cy="6.36" r="5" />
    </g>
  </svg>
);