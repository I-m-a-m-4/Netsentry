'use client';

import React, { useState } from 'react';
import { useUser } from '@/firebase';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { ShieldAlert, LogIn, Lock } from 'lucide-react';

export default function Admin2FAGate({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Strict email whitelisting
  const adminEmail = 'belloimam431@gmail.com';

  const handleLogin = async (e: React.FormEvent) => {
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

  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth);
  };

  if (isUserLoading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If logged in but wrong email
  if (user && user.email !== adminEmail) {
    return (
      <div className="flex min-h-[60vh] w-full flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="p-4 rounded-full bg-red-500/10 text-red-500 mb-2 border border-red-500/20">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-black font-bricolage text-foreground">Access Denied</h2>
        <p className="text-muted-foreground text-sm max-w-md">
          The currently authenticated account (<span className="font-mono text-foreground">{user.email}</span>) does not have privileges to access the NetSentry Command Dashboard.
        </p>
        <button 
          onClick={handleLogout}
          className="mt-6 px-6 py-2.5 bg-primary/10 border border-primary/30 text-primary rounded-xl font-bold text-sm hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95"
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
        <div className="w-full max-w-md bg-card border rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle glow effect */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
          
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-5 border border-primary/20 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black font-bricolage bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
              Command Access
            </h1>
            <p className="text-xs text-muted-foreground mt-2">
              Authenticate with your administrator credentials to proceed.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Email Address
              </label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-background border px-4 py-3.5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
                placeholder="admin@example.com"
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
                className="w-full bg-background border px-4 py-3.5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
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
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-70 mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Pass-through wrapper for the correct admin user
  return <>{children}</>;
}
