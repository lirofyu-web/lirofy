// components/icons/SaveIcon.tsx
import React from 'react';

export const SaveIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || 'w-6 h-6'}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.641V16.5a2.25 2.25 0 0 0 2.25 2.25h13.5A2.25 2.25 0 0 0 21 16.5v-2.582a2.25 2.25 0 0 0-.1-1.641l-2.41-7.852A2.25 2.25 0 0 0 16.088 3.75H15M12 12.75v6.75m0-6.75H9.375m2.625 0H14.625" />
  </svg>
);