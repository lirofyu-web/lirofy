// components/icons/HomeIcon.tsx
import React from 'react';

export const HomeIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24"
    className={className || 'w-6 h-6'}
    role="img"
    aria-label="Dashboard Icon"
  >
    <defs>
      <linearGradient id="doorGrad" x1="0.5" y1="0" x2="0.5" y2="1">
        <stop offset="0%" stopColor="#a0522d" />
        <stop offset="100%" stopColor="#8b4513" />
      </linearGradient>
      <linearGradient id="awningGrad" x1="0.5" y1="0" x2="0.5" y2="1">
        <stop offset="0%" stopColor="#4caf50" />
        <stop offset="100%" stopColor="#388e3c" />
      </linearGradient>
    </defs>
    {/* Building Body */}
    <path fill="#f5f5dc" d="M4 21h16v-9H4z" />
    <path fill="#d2b48c" d="M3 21h18v1H3z" />
    {/* Roof */}
    <path fill="#a0522d" d="M2 12 12 4l10 8z" />
    {/* Awning */}
    <path fill="url(#awningGrad)" d="M2.5 12h19l-1 2h-17z" />
    <path fill="#fff" d="M4.5 13h1m3 0h1m3 0h1m3 0h1m3 0h1" stroke="#fff" strokeWidth="0.5" />
    {/* Door */}
    <path fill="url(#doorGrad)" d="M9 14h6v7H9z" />
    <circle cx="14" cy="17.5" r="0.5" fill="#ffd700" />
    {/* Window */}
    <path fill="#87ceeb" d="M16 15h4v3h-4z" />
    <path fill="#fff" d="M18 15v3m-2-1.5h4" stroke="#fff" strokeWidth="0.5" />
  </svg>
);