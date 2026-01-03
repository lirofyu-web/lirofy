// components/icons/QrCodeIcon.tsx
import React from 'react';

export const QrCodeIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || 'w-6 h-6'}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5A.75.75 0 0 1 4.5 3.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75V4.5Zm0 9.75A.75.75 0 0 1 4.5 13.5h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-4.5Zm9.75-9.75A.75.75 0 0 1 14.25 3.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75V4.5ZM15 15.75h.008v.008H15v-.008Zm1.5.008h.008v.008h-.008v-.008Zm1.5.008h.008v.008h-.008v-.008Zm-3.008 1.5h.008v.008h-.008v-.008Zm1.5.008h.008v.008h-.008v-.008Zm1.5.008h.008v.008h-.008v-.008Zm-4.5-1.5h.008v.008h-.008v-.008Zm1.5.008h.008v.008h-.008v-.008Z" />
  </svg>
);