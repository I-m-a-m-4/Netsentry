'use client';

import React, { useState } from 'react';
import { useUser } from '@/firebase';
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { ShieldAlert, LogIn, Lock } from 'lucide-react';

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export default function Admin2FAGate({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // Strict email whitelisting
  const adminEmail = 'belloimam431@gmail.com';

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth);
  };

  if (isUserLoading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center p-8">
        <div className="animate-spin rounded-md h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If logged in but wrong email
  if (user && user.email !== adminEmail) {
    return (
      <div className="flex min-h-[60vh] w-full flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="p-4 rounded-md bg-red-500/10 text-red-500 mb-2 border border-red-500/20">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-black font-bricolage text-foreground">Access Denied</h2>
        <p className="text-muted-foreground text-sm max-w-md">
          The currently authenticated account (<span className="font-mono text-foreground font-bold">{user.email}</span>) does not have administrator privileges to access NetSentry Admin Command.
        </p>
        <p className="text-xs text-muted-foreground">
          Please sign in with <span className="font-semibold text-primary">{adminEmail}</span>.
        </p>
        <button
          onClick={handleLogout}
          className="mt-4 px-6 py-2.5 bg-primary text-white rounded-md font-bold text-sm hover:bg-primary/90 transition-all active:scale-95 shadow-md"
        >
          Sign Out & Switch Account
        </button>
      </div>
    );
  }

  // If not logged in
  if (!user) {
    return (
      <div className="flex min-h-[70vh] w-full items-center justify-center p-4">
        <div className="w-full max-w-md bg-card border rounded-3xl p-8 relative overflow-hidden shadow-2xl">
          {/* Subtle glow effect */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-primary to-orange-500" />

          <div className="flex flex-col items-center mb-6 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 border border-primary/20 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black font-bricolage text-foreground">
              NetSentry Admin Command
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Sign in with <span className="font-bold text-foreground">{adminEmail}</span> to access telemetry & controls.
            </p>
          </div>

          {/* 1-Click Google Sign In */}
          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full py-3.5 px-4 rounded-xl border border-border bg-background hover:bg-muted font-bold text-sm flex items-center justify-center gap-3 transition-all shadow-sm active:scale-98 disabled:opacity-60"
            >
              {googleLoading ? (
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              {googleLoading ? 'Connecting to Google...' : 'Sign in with Google'}
            </button>

            <div className="flex items-center gap-3 my-2">
              <div className="h-[1px] flex-1 bg-border" />
              <span className="text-[11px] font-semibold text-muted-foreground uppercase">or email & password</span>
              <div className="h-[1px] flex-1 bg-border" />
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-background border px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/40"
                  placeholder="belloimam431@gmail.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-background border px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/40"
                  placeholder="••••••••••••"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-semibold text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 shadow-md"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                {loading ? 'Authenticating...' : 'Sign In with Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Pass-through wrapper for the correct admin user
  return <>{children}</>;
}
