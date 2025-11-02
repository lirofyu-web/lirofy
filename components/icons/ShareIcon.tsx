// components/icons/ShareIcon.tsx
import React from 'react';

export const ShareIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || 'w-6 h-6'}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Zm0 0v2.544a2.25 2.25 0 0 1-1.128 1.948l-1.923.962a2.25 2.25 0 0 0-1.128 1.948V18.75c0 .339.273.612.613.612h12.25c.34 0 .613-.273.613-.612v-2.14a2.25 2.25 0 0 0-1.128-1.948l-1.923-.962a2.25 2.25 0 0 1-1.128-1.948V10.907M14.25 9.75a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" />
  </svg>
);
