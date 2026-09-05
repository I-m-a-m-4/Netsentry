import React from 'react';

export function NetSentryLogo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
      <rect width="32" height="32" fill="#f97316" />
      <path d="M6 24 A 12 12 0 1 1 26 24" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 5" opacity="0.4" />
      <path d="M6 24 A 12 12 0 0 1 22 6" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="1" />
      <circle cx="16" cy="15" r="3" fill="#ffffff" />
      <path d="M16 15 L24 7" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M26 24 L29 24" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}
