// components/icons/LogoIcon.tsx
import React from 'react';

export const LogoIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 36"
    className={className || 'w-6 h-6'}
    role="img"
    aria-label="Montanha Bilhar Logo"
    fill="currentColor"
  >
    <path fillRule="evenodd" d="M0 0 H10 L24 14 L38 0 H48 L24 26 Z M12.5 0 L24 6 L35.5 0 Z" />
    <path d="M24 28 L29 32 L24 36 L19 32 Z" />
  </svg>
);