'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Zap, Wifi, Smartphone, ShieldCheck } from 'lucide-react';

interface SmartDataSaverModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SmartDataSaverModal({ open, onOpenChange }: SmartDataSaverModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-background border-border shadow-2xl rounded-2xl p-6">
        <DialogHeader className="space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
            <Zap className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            Smart Data Saver (Smart Profiles)
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            Automated bandwidth & mobile data protection for your computer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 my-2 text-sm">
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-1.5">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-amber-500" /> Auto-Detects Metered Connections
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              When you connect your computer to a mobile phone hotspot or a capped data plan, NetSentry automatically detects that it is a <strong>Metered Connection</strong>.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-1.5">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-500" /> Engages Focus Mode Automatically
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              It immediately switches your system into <strong>Focus Mode</strong>, pausing non-essential, heavy background data downloads (like background app updates or cloud syncs).
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-1.5">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <Wifi className="w-4 h-4 text-emerald-500" /> Seamless Home Wi-Fi Restoration
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              When you reconnect to your Home or Office Wi-Fi, NetSentry automatically restores full connectivity for all background apps without you having to click anything!
            </p>
          </div>
        </div>

        <button
          onClick={() => onOpenChange(false)}
          className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-all text-sm mt-2"
        >
          Got it!
        </button>
      </DialogContent>
    </Dialog>
  );
}
