import React from 'react';

export const JukeboxIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || 'w-6 h-6'}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5h16.5a2.25 2.25 0 0 1 2.25 2.25v10.5a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 17.25V6.75A2.25 2.25 0 0 1 3.75 4.5Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75h.008v.008H12v-.008Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 12.75h.008v.008H7.5v-.008Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75h.008v.008H16.5v-.008Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 16.5h9" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75V2.25" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 3.75V2.25" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8.25a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
  </svg>
);