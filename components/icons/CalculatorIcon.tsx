// components/icons/CalculatorIcon.tsx
import React from 'react';

export const CalculatorIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24"
    className={className || 'w-6 h-6'}
    role="img"
    aria-label="Despesas Icon"
  >
    <defs>
      <linearGradient id="walletGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#6d4c41" />
        <stop offset="100%" stopColor="#4e342e" />
      </linearGradient>
    </defs>
    {/* Main wallet body */}
    <path fill="url(#walletGrad)" d="M4,5 C4,4.447 4.447,4 5,4 H19 C19.553,4 20,4.447 20,5 V19 C20,19.553 19.553,20 19,20 H5 C4.447,20 4,19.553 4,19 V5 Z" />
    {/* Flap */}
    <path fill="#795548" d="M2,7 H22 V9 H2 Z" />
    {/* Red Arrow Down */}
    <path fill="#ef5350" d="M12 17l-4-4h3V9h2v4h3z" />
    {/* Stitching */}
    <path fill="none" stroke="#a1887f" strokeWidth="0.5" strokeDasharray="1,1" d="M5 4.5h14M4.5 5v14M19.5 5v14M5 19.5h14" />
  </svg>
);