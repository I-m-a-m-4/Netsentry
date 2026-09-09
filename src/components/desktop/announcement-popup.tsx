'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { 
  X, 
  ExternalLink, 
  Sparkles, 
  Megaphone, 
  Gift, 
  AlertTriangle, 
  Zap, 
  ShieldCheck 
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface BroadcastPopupData {
  id: string;
  title: string;
  message: string;
  badgeText: string;
  badgeType: 'promo' | 'announcement' | 'alert' | 'update';
  ctaText: string;
  ctaLink: string;
  imageUrl?: string;
  active: boolean;
  allowDismiss: boolean;
}

export default function AnnouncementPopup() {
  const firestore = useFirestore();
  const [popupData, setPopupData] = useState<BroadcastPopupData | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!firestore) return;

    // Listen to real-time broadcast doc from Firestore
    const unsub = onSnapshot(
      doc(firestore, 'broadcast_announcements', 'active_popup'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as BroadcastPopupData;
          if (data.active && data.title && data.message) {
            // Check if user has already dismissed this specific popup ID
            const dismissedId = typeof window !== 'undefined' ? localStorage.getItem('netsentry_dismissed_popup_id') : null;
            if (dismissedId !== data.id) {
              setPopupData(data);
              setIsOpen(true);
              return;
            }
          }
        }
        setIsOpen(false);
        setPopupData(null);
      },
      (err) => {
        // Silent catch for rule or network errors
        console.warn('Announcement popup listener notice:', err);
      }
    );

    return () => unsub();
  }, [firestore]);

  const handleDismiss = () => {
    if (popupData?.id && typeof window !== 'undefined') {
      localStorage.setItem('netsentry_dismissed_popup_id', popupData.id);
    }
    setIsOpen(false);
  };

  const handleCtaClick = () => {
    if (popupData?.ctaLink && typeof window !== 'undefined') {
      window.open(popupData.ctaLink, '_blank', 'noopener,noreferrer');
    }
    handleDismiss();
  };

  if (!isOpen || !popupData) return null;

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'promo':
        return 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-amber-500/20';
      case 'alert':
        return 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-red-500/20';
      case 'update':
        return 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/20';
      default:
        return 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sky-500/20';
    }
  };

  const getBadgeIcon = (type: string) => {
    switch (type) {
      case 'promo':
        return <Gift className="w-3.5 h-3.5 mr-1" />;
      case 'alert':
        return <AlertTriangle className="w-3.5 h-3.5 mr-1" />;
      case 'update':
        return <Zap className="w-3.5 h-3.5 mr-1" />;
      default:
        return <Megaphone className="w-3.5 h-3.5 mr-1" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && popupData.allowDismiss) handleDismiss(); }}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-sky-500/30 bg-slate-950 text-white shadow-2xl rounded-2xl sm:rounded-3xl">
        {/* Glow backdrop effect */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Content Container */}
        <div className="p-6 sm:p-7 space-y-4 relative z-10">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase shadow-md ${getBadgeStyle(popupData.badgeType)}`}>
              {getBadgeIcon(popupData.badgeType)}
              {popupData.badgeText || 'SPECIAL ANNOUNCEMENT'}
            </span>

            {popupData.allowDismiss && (
              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Title */}
          <h3 className="text-xl font-extrabold text-white leading-snug tracking-tight font-sans">
            {popupData.title}
          </h3>

          {/* Optional Image */}
          {popupData.imageUrl && (
            <div className="w-full h-44 rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-inner">
              <img
                src={popupData.imageUrl}
                alt="Notification"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Message */}
          <p className="text-sm text-slate-300 leading-relaxed font-normal">
            {popupData.message}
          </p>

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <Button
              onClick={handleCtaClick}
              className="w-full sm:flex-1 py-3 h-auto rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all transform hover:-translate-y-0.5"
            >
              {popupData.ctaText || 'Learn More'}
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>

            {popupData.allowDismiss && (
              <Button
                variant="outline"
                onClick={handleDismiss}
                className="w-full sm:w-auto py-3 h-auto rounded-xl border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-sm font-semibold"
              >
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
