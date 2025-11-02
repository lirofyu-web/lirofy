// Fix: Added UsersIcon component content to make the file a valid module.
import React from 'react';

export const UsersIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || 'w-6 h-6'}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-4.663M5.54 5.281A7.474 7.474 0 0112 4.5c1.72 0 3.32.52 4.634 1.405M9.19 9.31a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" />
  </svg>
);
