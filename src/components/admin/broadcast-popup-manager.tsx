'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, setDoc, onSnapshot, collection, query, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Radio, 
  Send, 
  Tv, 
  Sparkles, 
  Bell, 
  AlertTriangle, 
  ExternalLink, 
  Trash2, 
  CheckCircle2, 
  Eye, 
  XCircle,
  Megaphone,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

interface BroadcastPopup {
  id?: string;
  title: string;
  message: string;
  badgeText: string;
  badgeType: 'promo' | 'announcement' | 'alert' | 'update';
  ctaText: string;
  ctaLink: string;
  imageUrl?: string;
  active: boolean;
  allowDismiss: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export default function BroadcastPopupManager() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [activePopup, setActivePopup] = useState<BroadcastPopup | null>(null);
  const [history, setHistory] = useState<BroadcastPopup[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [badgeText, setBadgeText] = useState('SPECIAL OFFER');
  const [badgeType, setBadgeType] = useState<'promo' | 'announcement' | 'alert' | 'update'>('promo');
  const [ctaText, setCtaText] = useState('Check It Out');
  const [ctaLink, setCtaLink] = useState('https://apps.microsoft.com/store/detail/9P8LKHFTRKKS');
  const [imageUrl, setImageUrl] = useState('');
  const [allowDismiss, setAllowDismiss] = useState(true);

  // Subscribe to live broadcast popup status
  useEffect(() => {
    if (!firestore) return;

    // Active popup doc
    const unsubActive = onSnapshot(
      doc(firestore, 'broadcast_announcements', 'active_popup'),
      (snap) => {
        if (snap.exists()) {
          setActivePopup(snap.data() as BroadcastPopup);
        } else {
          setActivePopup(null);
        }
      },
      (err) => console.warn('Broadcast active snapshot error:', err)
    );

    // History collection
    const qHistory = query(
      collection(firestore, 'broadcast_announcements_history'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    const unsubHistory = onSnapshot(
      qHistory,
      (snap) => {
        setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() } as BroadcastPopup)));
      },
      (err) => console.warn('Broadcast history snapshot error:', err)
    );

    return () => {
      unsubActive();
      unsubHistory();
    };
  }, [firestore]);

  // Publish / Trigger New Broadcast
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) {
      toast({ title: 'Firestore unavailable', variant: 'destructive' });
      return;
    }

    if (!title.trim() || !message.trim()) {
      toast({ title: 'Please provide both a Title and Message', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const popupId = `popup_${Date.now()}`;
      const payload: BroadcastPopup = {
        id: popupId,
        title: title.trim(),
        message: message.trim(),
        badgeText: badgeText.trim() || 'ANNOUNCEMENT',
        badgeType,
        ctaText: ctaText.trim() || 'Learn More',
        ctaLink: ctaLink.trim() || '#',
        imageUrl: imageUrl.trim() || undefined,
        active: true,
        allowDismiss,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 1. Set as active popup
      await setDoc(doc(firestore, 'broadcast_announcements', 'active_popup'), payload);

      // 2. Log in history
      await addDoc(collection(firestore, 'broadcast_announcements_history'), {
        ...payload,
        createdAt: serverTimestamp()
      });

      toast({
        title: '🚀 Screen Popup Broadcasted Live!',
        description: 'Users running NetSentry will see this popup on their screens in real time.',
      });
    } catch (err: any) {
      toast({
        title: 'Failed to publish broadcast',
        description: err?.message || 'Check connection or security rules',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Deactivate Live Broadcast
  const handleDeactivate = async () => {
    if (!firestore) return;
    setIsSubmitting(true);
    try {
      await setDoc(doc(firestore, 'broadcast_announcements', 'active_popup'), {
        active: false,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      toast({
        title: 'Broadcast Stopped',
        description: 'The active screen popup has been taken down.',
      });
    } catch (err: any) {
      toast({ title: 'Error stopping broadcast', description: err?.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick fill from history
  const populateFromHistory = (item: BroadcastPopup) => {
    setTitle(item.title);
    setMessage(item.message);
    setBadgeText(item.badgeText);
    setBadgeType(item.badgeType);
    setCtaText(item.ctaText);
    setCtaLink(item.ctaLink);
    setImageUrl(item.imageUrl || '');
    setAllowDismiss(item.allowDismiss);
    toast({ title: 'Loaded template from history' });
  };

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'promo':
        return 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-orange-400/30';
      case 'alert':
        return 'bg-gradient-to-r from-red-600 to-rose-700 text-white border-red-500/30';
      case 'update':
        return 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-400/30';
      default:
        return 'bg-gradient-to-r from-sky-500 to-blue-600 text-white border-sky-400/30';
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-card border border-border rounded-xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-500 rounded-xl">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="font-bricolage text-xl font-bold flex items-center gap-2">
              User Screen Popup Broadcast
              <Badge variant="outline" className="text-xs border-amber-500/40 text-amber-500">
                Real-Time Push
              </Badge>
            </h2>
            <p className="text-xs text-muted-foreground">
              Trigger instant popup notifications & promotions across all live NetSentry desktop user screens.
            </p>
          </div>
        </div>

        {/* Live Broadcast Status indicator */}
        <div className="flex items-center gap-3">
          {activePopup?.active ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              Popup Currently Live
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border text-muted-foreground text-xs font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              No Active Broadcast
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Create & Broadcast Form */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-500" />
                Compose Screen Popup
              </CardTitle>
              <CardDescription>
                Fill out the fields below and click "Broadcast to Users" to launch the popup instantly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePublish} className="space-y-4">
                {/* Title */}
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-xs font-semibold">
                    Popup Headline / Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g. 🎉 NetSentry Pro 50% Off Lifetime Deal!"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="text-sm font-medium"
                  />
                </div>

                {/* Badge Category & Badge Text */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Badge Type / Color</Label>
                    <select
                      value={badgeType}
                      onChange={(e: any) => setBadgeType(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="promo">🎁 Promotion / Deal (Orange)</option>
                      <option value="announcement">📢 Announcement (Blue)</option>
                      <option value="update">🚀 Feature Update (Green)</option>
                      <option value="alert">⚠️ Security Alert (Red)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="badgeText" className="text-xs font-semibold">
                      Badge Text Label
                    </Label>
                    <Input
                      id="badgeText"
                      placeholder="e.g. SPECIAL OFFER, NEW FEATURE"
                      value={badgeText}
                      onChange={(e) => setBadgeText(e.target.value)}
                      className="text-xs font-medium"
                    />
                  </div>
                </div>

                {/* Message Body */}
                <div className="space-y-1.5">
                  <Label htmlFor="message" className="text-xs font-semibold">
                    Message Body <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    rows={4}
                    placeholder="Write the message that users will read in the popup dialog..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    className="text-sm leading-relaxed resize-none"
                  />
                </div>

                {/* CTA Button Label & Link */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="ctaText" className="text-xs font-semibold">
                      Action Button Text
                    </Label>
                    <Input
                      id="ctaText"
                      placeholder="e.g. Claim Discount, Read More"
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      className="text-xs font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ctaLink" className="text-xs font-semibold">
                      Action Button URL (Opens on Click)
                    </Label>
                    <Input
                      id="ctaLink"
                      placeholder="https://apps.microsoft.com/store/detail/9P8LKHFTRKKS"
                      value={ctaLink}
                      onChange={(e) => setCtaLink(e.target.value)}
                      className="text-xs font-medium"
                    />
                  </div>
                </div>

                {/* Optional Image URL */}
                <div className="space-y-1.5">
                  <Label htmlFor="imageUrl" className="text-xs font-semibold">
                    Optional Banner Image URL
                  </Label>
                  <Input
                    id="imageUrl"
                    placeholder="https://example.com/banner.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="text-xs font-medium"
                  />
                </div>

                {/* Allow Dismiss Switch */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                  <div>
                    <p className="text-xs font-semibold">Allow User to Dismiss</p>
                    <p className="text-[11px] text-muted-foreground">
                      When enabled, users can click "Don't show again" to close the popup.
                    </p>
                  </div>
                  <Switch
                    checked={allowDismiss}
                    onCheckedChange={setAllowDismiss}
                  />
                </div>

                {/* Submit Action */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold px-6 shadow-md"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isSubmitting ? 'Publishing...' : 'Broadcast to Users Now'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Preview & Active Control */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Broadcast Control Box */}
          {activePopup?.active && (
            <Card className="border-amber-500/40 bg-gradient-to-b from-amber-500/5 to-transparent shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge className="bg-amber-500 text-white text-xs">LIVE BROADCAST ACTIVE</Badge>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeactivate}
                    disabled={isSubmitting}
                    className="h-7 text-xs font-bold"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    Take Down Popup
                  </Button>
                </div>
                <CardTitle className="text-base font-bold pt-2">{activePopup.title}</CardTitle>
                <CardDescription className="text-xs">
                  Currently popping up on all active NetSentry desktop apps.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <p className="text-muted-foreground leading-relaxed">{activePopup.message}</p>
                <div className="flex flex-wrap items-center gap-2 text-[11px] pt-1">
                  <span className="font-semibold text-foreground">CTA:</span>
                  <a
                    href={activePopup.ctaLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-500 underline flex items-center gap-1 font-medium"
                  >
                    {activePopup.ctaText} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Live Preview Mockup */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Eye className="w-4 h-4 text-sky-500" />
                Screen Popup Live Preview
              </CardTitle>
              <CardDescription className="text-xs">
                This is how the popup will render on user screens.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Mock Popup Box */}
              <div className="p-5 rounded-2xl border border-sky-500/30 bg-slate-950 text-white shadow-2xl relative overflow-hidden space-y-4">
                {/* Subtle Glow backdrop */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

                {/* Badge */}
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border shadow-sm ${getBadgeStyle(badgeType)}`}>
                    {badgeText || 'SPECIAL ANNOUNCEMENT'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">NetSentry Notification</span>
                </div>

                {/* Title */}
                <h4 className="text-base font-extrabold text-white leading-snug">
                  {title || 'Headline Will Appear Here'}
                </h4>

                {/* Optional Image */}
                {imageUrl && (
                  <div className="w-full h-32 rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Message */}
                <p className="text-xs text-slate-300 leading-relaxed">
                  {message || 'Your detailed broadcast message will render in this area for users.'}
                </p>

                {/* Actions */}
                <div className="pt-2 flex items-center gap-2">
                  <button className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5">
                    {ctaText || 'Learn More'}
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  {allowDismiss && (
                    <button className="py-2 px-3 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs">
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Broadcast History */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                Recent Broadcast History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {history.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-2">No past broadcasts found.</p>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id || Math.random().toString()}
                    className="p-3 rounded-lg border border-border bg-card/60 hover:bg-muted/40 transition-colors flex items-center justify-between text-xs gap-3"
                  >
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <p className="font-semibold truncate text-foreground">{item.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{item.message}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => populateFromHistory(item)}
                      className="h-7 text-[11px] px-2"
                    >
                      Reuse Template
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
