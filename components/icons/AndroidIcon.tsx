// components/icons/AndroidIcon.tsx
import React from 'react';

export const AndroidIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className || 'w-6 h-6'}
    role="img"
    aria-label="Android Icon"
  >
    <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zm11.5-15.5c-.83 0-1.5.67-1.5 1.5v1.5H8v-1.5C8 2.67 7.33 2 6.5 2S5 2.67 5 3.5V6H4c-1.1 0-2 .9-2 2v10c0 2.21 1.79 4 4 4h12c2.21 0 4-1.79 4-4V8c0-1.1-.9-2-2-2h-1V3.5c0-.83-.67-1.5-1.5-1.5zM16 5h-2V4h2v1zm-6 0H8V4h2v1z" />
  </svg>
);