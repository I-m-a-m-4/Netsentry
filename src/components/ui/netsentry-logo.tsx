import React from 'react';

export function NetSentryLogo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
      {/* Dotted background track (Meter ticks) */}
      <path d="M6 24 A 12 12 0 1 1 26 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 5" opacity="0.3" />
      
      {/* Solid active usage gauge */}
      <path d="M6 24 A 12 12 0 0 1 22 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="1" />
      
      {/* Center dial */}
      <circle cx="16" cy="15" r="3" fill="currentColor" />
      
      {/* Needle pointing to the usage */}
      <path d="M16 15 L24 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      
      {/* Data Limit / Lock Marker */}
      <path d="M26 24 L29 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}
