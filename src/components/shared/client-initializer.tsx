
'use client';

import * as React from 'react';
import { Analytics } from '@vercel/analytics/react';
import { ConsoleGuard } from './console-guard';

export function ClientSideInitializer() {
  const [isMounted, setIsMounted] = React.useState(false);
  
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <ConsoleGuard />;

  const isTauri = typeof window !== 'undefined' && !!(window as any).__TAURI_INTERNALS__;

  return (
    <>
      {!isTauri && <Analytics />}
      <ConsoleGuard />
    </>
  );
}
