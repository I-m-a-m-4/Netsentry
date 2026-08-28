'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser, useFirestore } from '@/firebase';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Bell, 
  Bug, 
  Users, 
  ShieldAlert,
  Download,
  Database,
  Sun,
  Moon,
  LogOut,
  Radio,
  Server
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAuth, signOut } from 'firebase/auth';
import { cn } from '@/lib/utils';
import Admin2FAGate from '@/components/admin/admin-2fa-gate';
import { useTheme } from 'next-themes';
import { Badge } from '@/components/ui/badge';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useNativeNotifications } from '@/hooks/use-native-notifications';

const navLinks = [
  { href: '/admin-imamshaffy', label: 'Command Dashboard', icon: LayoutDashboard },
  { href: '/admin-imamshaffy/users', label: 'Client Nodes', icon: Users },
  { href: '/admin-imamshaffy/developer-logs', label: 'Error & Security Logs', icon: Bug },
  { href: '/admin-imamshaffy/backups', label: 'Telemetry & Backups', icon: Database },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const pathname = usePathname();

  const { setTheme, resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';

  const [unreadErrorCount, setUnreadErrorCount] = useState(0);
  const { notify } = useNativeNotifications();

  useEffect(() => {
    if (!firestore || !user) return;

    try {
      const q = query(
        collection(firestore, 'error_logs'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (typeof window === 'undefined') return;
        const lastViewedTimeStr = localStorage.getItem('netsentry_last_viewed_errors');
        const lastViewedTime = lastViewedTimeStr ? parseInt(lastViewedTimeStr) : 0;

        let count = 0;
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.createdAt) {
            const date = typeof data.createdAt.toDate === 'function'
              ? data.createdAt.toDate()
              : new Date(data.createdAt);
            const time = date.getTime();
            if (!isNaN(time) && time > lastViewedTime) {
              count++;
            }
          }
        });
        setUnreadErrorCount(count);

        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            if (data.createdAt) {
              const date = typeof data.createdAt.toDate === 'function'
                ? data.createdAt.toDate()
                : new Date(data.createdAt);
              const time = date.getTime();
              if (!isNaN(time) && time > lastViewedTime && (Date.now() - time) < 60000) {
                notify(
                  data.type === 'anomaly' ? 'Security Anomaly Detected' : 'New System Log',
                  data.message || data.errorMessage || 'A new event was recorded.',
                  '/admin-imamshaffy/developer-logs'
                );
              }
            }
          }
        });
      }, () => {});

      return () => unsubscribe();
    } catch (e) {
      console.error(e);
    }
  }, [firestore, user, pathname, notify]);

  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth).catch((err) => console.error('Sign out error:', err));
  };

  const isLinkActive = (href: string) => {
    if (href === '/admin-imamshaffy') return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-screen w-full flex-col relative overflow-hidden bg-background text-foreground">
      {/* Top Header */}
      <header className="sticky top-0 flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 backdrop-blur-md px-4 z-40">
        {/* Brand */}
        <Link
          href="/admin-imamshaffy"
          className="flex items-center gap-2 text-base font-black tracking-tight whitespace-nowrap shrink-0 mr-4"
        >
          <div className="p-1.5 bg-primary/10 text-primary rounded-lg border border-primary/20">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent font-bricolage">
            NetSentry Command
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex flex-row items-center gap-5 text-sm font-medium">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-1.5 whitespace-nowrap py-1 transition-colors hover:text-foreground',
                isLinkActive(link.href)
                  ? 'text-foreground font-bold border-b-2 border-primary'
                  : 'text-muted-foreground'
              )}
            >
              <link.icon className="w-4 h-4" />
              <span>{link.label}</span>
              {link.label.includes('Logs') && unreadErrorCount > 0 && (
                <Badge
                  variant="destructive"
                  className="h-5 min-w-5 px-1.5 py-0 flex items-center justify-center text-[10px] font-black rounded-full animate-pulse bg-red-600 text-white border-0"
                >
                  {unreadErrorCount}
                </Badge>
              )}
            </Link>
          ))}
        </nav>

        {/* Right controls */}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
            className="rounded-full w-9 h-9 border-muted hover:bg-accent shrink-0"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode
              ? <Sun className="h-4 w-4 text-yellow-500" />
              : <Moon className="h-4 w-4 text-slate-700" />}
          </Button>
          
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="shrink-0 flex items-center gap-1.5"
          >
            <LogOut className="h-4 w-4" /> 
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      {/* Page content */}
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 overflow-y-auto pb-24 md:pb-8">
        <Admin2FAGate>
          {children}
        </Admin2FAGate>
      </main>

      {/* Mobile Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-border bg-background/95 backdrop-blur-md h-16 pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around items-center h-full">
          {navLinks.map((link) => {
            const active = isLinkActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col items-center justify-center flex-1 h-full"
              >
                <div className="relative mb-0.5">
                  <link.icon
                    className={cn('h-5 w-5', active ? 'text-primary' : 'text-muted-foreground')}
                  />
                  {link.label.includes('Logs') && unreadErrorCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-600 text-[8px] text-white font-bold">
                      {unreadErrorCount > 9 ? '9+' : unreadErrorCount}
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    'text-[10px] leading-none',
                    active ? 'text-primary font-semibold' : 'text-muted-foreground'
                  )}
                >
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
