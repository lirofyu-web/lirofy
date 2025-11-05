// components/icons/ReceiptIcon.tsx
import React from 'react';

export const ReceiptIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24"
    className={className || 'w-6 h-6'}
    role="img"
    aria-label="Cobranças Icon"
  >
    <defs>
      <linearGradient id="receiptMachine" x1="0.5" y1="0" x2="0.5" y2="1">
        <stop offset="0%" stopColor="#9e9e9e" />
        <stop offset="100%" stopColor="#616161" />
      </linearGradient>
    </defs>
    {/* Machine Body */}
    <path fill="url(#receiptMachine)" d="M5 8h14v13H5z" rx="1" />
    {/* Receipt Paper */}
    <path fill="#f5f5f5" d="M8 3 C 8 3, 8 6, 10 6 S 12 3, 14 3 S 16 6, 16 6 V 12 H 8 Z" />
    <path fill="none" stroke="#bdbdbd" strokeWidth="0.5" d="M9 7h6 M9 8.5h6 M9 10h4" />
    {/* Green dollar sign */}
    <text x="12" y="18" fontFamily="Arial, sans-serif" fontSize="6" fill="#4caf50" textAnchor="middle" fontWeight="bold">$</text>
    {/* Slot */}
    <rect x="7" y="8" width="10" height="1.5" fill="#424242" rx="0.5" />
  </svg>
);