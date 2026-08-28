'use client';

import React from 'react';

export default function Admin2FAGate({ children }: { children: React.ReactNode }) {
  // Pass-through wrapper or PIN gate for secure admin operations
  return <>{children}</>;
}
