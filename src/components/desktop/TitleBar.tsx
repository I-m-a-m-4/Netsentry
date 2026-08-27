'use client';

import React, { useEffect, useState } from 'react';
import { X, Minus, Square, Copy, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppConfig } from '@/lib/config';

export function DesktopTitleBar() {
  const [isTauri, setIsTauri] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const checkTauri = async () => {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        if (getCurrentWindow()) {
          setIsTauri(true);
          const win = getCurrentWindow();
          setIsMaximized(await win.isMaximized());
        }
      } catch {
        setIsTauri(false);
      }
    };

    checkTauri();
    
    const handleResize = () => {
       import('@tauri-apps/api/window').then(m => m.getCurrentWindow().isMaximized().then(setIsMaximized)).catch(() => {});
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isTauri) return null;

  const handleMinimize = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().minimize();
    } catch (err) {
      console.error('Minimize failed:', err);
    }
  };

  const handleMaximize = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().toggleMaximize();
    } catch (err) {
      console.error('Maximize toggle failed:', err);
    }
  };

  const handleClose = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().close();
    } catch (err) {
      console.error('Close failed:', err);
    }
  };

  return (
    <div 
      data-tauri-drag-region
      className="h-9 w-full bg-background border-b border-border/40 flex items-center justify-between select-none fixed top-0 left-0 z-[9999] no-print"
    >
      <div className="flex items-center gap-2.5 px-4" data-tauri-drag-region>
         <div className="h-5 w-5 relative flex items-center justify-center">
            <Shield className="h-4 w-4 text-primary" />
         </div>
         <div className="flex flex-col" data-tauri-drag-region>
            <span className="text-[10px] font-black tracking-[0.25em] text-primary leading-none">NETSENTRY</span>
            <div className="flex items-center gap-1.5 mt-0.5">
               <span className="text-[8px] font-semibold text-muted-foreground uppercase tracking-widest leading-none">Desktop v{AppConfig.version || '0.1.0'}</span>
               <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse"></div>
            </div>
         </div>
      </div>

      <div data-tauri-drag-region className="flex-1 h-full cursor-default" />

      <div className="flex items-center h-full" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button 
          onClick={handleMinimize}
          className="h-full w-12 flex items-center justify-center hover:bg-muted/85 transition-all active:scale-95 cursor-pointer"
          title="Minimize"
        >
          <Minus className="h-3.5 w-3.5 text-muted-foreground/80" />
        </button>
        <button 
          onClick={handleMaximize}
          className="h-full w-12 flex items-center justify-center hover:bg-muted/85 transition-all active:scale-95 cursor-pointer"
          title={isMaximized ? "Restore" : "Maximize"}
        >
          {isMaximized ? (
            <Copy className="h-3 w-3 text-muted-foreground/80 -rotate-90" />
          ) : (
            <Square className="h-3 w-3 text-muted-foreground/80" />
          )}
        </button>
        <button 
          onClick={handleClose}
          className="h-full w-12 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all active:scale-95 group cursor-pointer"
          title="Close"
        >
          <X className="h-4 w-4 text-muted-foreground/80 group-hover:text-white" />
        </button>
      </div>
    </div>
  );
}
