// components/icons/CogIcon.tsx
import React from 'react';

export const CogIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || 'w-6 h-6'}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0 0 15 0m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m18 0h-1.5m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m18 0h-1.5m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m18 0h-1.5m-1.5 6.335V18.75a2.25 2.25 0 0 1-2.25 2.25H8.25A2.25 2.25 0 0 1 6 18.75v-2.415m12 0a4.5 4.5 0 0 0-9 0m9 0a4.5 4.5 0 0 1-9 0m9 0v.003M6 16.335V18.75a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 18.75v-2.415m-12 0a4.5 4.5 0 0 0 9 0m-9 0a4.5 4.5 0 0 1 9 0m-9 0v-.003" />
  </svg>
);