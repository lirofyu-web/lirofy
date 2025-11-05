// components/icons/ChartBarIcon.tsx
import React from 'react';

export const ChartBarIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24"
    className={className || 'w-6 h-6'}
    role="img"
    aria-label="Relatórios Icon"
  >
    <defs>
      <linearGradient id="bar1" x1="0.5" y1="0" x2="0.5" y2="1">
        <stop offset="0%" stopColor="#42a5f5" />
        <stop offset="100%" stopColor="#1e88e5" />
      </linearGradient>
      <linearGradient id="bar2" x1="0.5" y1="0" x2="0.5" y2="1">
        <stop offset="0%" stopColor="#66bb6a" />
        <stop offset="100%" stopColor="#43a047" />
      </linearGradient>
      <linearGradient id="bar3" x1="0.5" y1="0" x2="0.5" y2="1">
        <stop offset="0%" stopColor="#ffee58" />
        <stop offset="100%" stopColor="#fdd835" />
      </linearGradient>
    </defs>
    {/* Base Line */}
    <path fill="#90a4ae" d="M3 20h18v1H3z" />
    {/* Bars */}
    <rect x="4" y="12" width="4" height="8" rx="1" fill="url(#bar1)" />
    <rect x="10" y="8" width="4" height="12" rx="1" fill="url(#bar2)" />
    <rect x="16" y="4" width="4" height="16" rx="1" fill="url(#bar3)" />
  </svg>
);