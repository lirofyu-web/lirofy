import React from 'react';

export const BeakerIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || 'w-6 h-6'}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c.224-.044.453-.082.69-.118a2.25 2.25 0 0 1 2.12 0c.237.036.466.074.69.118m-3.5 0a2.25 2.25 0 0 0-2.12 0c-.237.036-.466.074-.69.118m6.62 0a2.25 2.25 0 0 0 2.12 0c.237.036.466.074.69.118m-3.5 0c.224-.044.453-.082.69-.118m0 5.714a2.25 2.25 0 0 0 .659 1.591L19 14.5M3 14.5h18M3 14.5a2.25 2.25 0 0 0-2.25 2.25v2.25a2.25 2.25 0 0 0 2.25 2.25h18a2.25 2.25 0 0 0 2.25-2.25v-2.25a2.25 2.25 0 0 0-2.25-2.25M9 18.75l-1.5-1.5m1.5 1.5v-1.5m0 0l-1.5 1.5m1.5-1.5L9 18.75m6-1.5l-1.5-1.5m1.5 1.5v-1.5m0 0l-1.5 1.5m1.5-1.5L15 18.75" />
  </svg>
);