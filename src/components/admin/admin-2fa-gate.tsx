'use client';

import React, { useState } from 'react';
import { useUser } from '@/firebase';
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { ShieldAlert, ArrowLeft, ArrowRight, Lock, ShieldCheck, Activity, Terminal } from 'lucide-react';
import Link from 'next/link';
import { NetSentryLogo } from '@/components/ui/netsentry-logo';

function GoogleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
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
  const [email, setEmail] = useState('belloimam431@gmail.com');
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
      if (err?.code === 'auth/invalid-credential' || err?.code === 'auth/wrong-password') {
        setError('Incorrect password. Please verify your password and try again.');
      } else if (err?.code === 'auth/user-not-found') {
        setError(`No account found for ${email}. Please check Firebase Auth console.`);
      } else {
        setError(err.message || 'Authentication failed');
      }
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
      if (err?.code === 'auth/operation-not-allowed' || err?.message?.includes('operation-not-allowed')) {
        setError('Google Sign-In is currently disabled in your Firebase console. Please sign in below using your password, or enable Google Provider in Firebase Console.');
      } else {
        setError(err.message || 'Google authentication failed');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      window.location.reload();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (isUserLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FAF9F6] text-slate-800">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#FA5438] border-t-transparent"></div>
          <p className="text-xs font-semibold text-slate-500">Loading NetSentry Command...</p>
        </div>
      </div>
    );
  }

  // Determine if the current user is a valid Super Admin
  const isSuperAdminUser =
    user &&
    !user.isAnonymous &&
    user.email &&
    user.email.toLowerCase() === adminEmail.toLowerCase();

  // If logged in with a NON-ADMIN email (and not anonymous)
  if (user && !user.isAnonymous && user.email && !isSuperAdminUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FAF9F6] p-4 text-slate-900">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto border border-red-200">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Access Denied</h2>
            <p className="text-slate-600 text-sm mt-2 leading-relaxed">
              The account <span className="font-bold text-slate-900 font-mono">{user.email}</span> does not have administrator privileges.
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Please sign in with <span className="font-semibold text-[#FA5438]">{adminEmail}</span>.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-3.5 px-6 bg-[#FA5438] hover:bg-[#E0452B] text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
          >
            Sign Out & Switch Account
          </button>
        </div>
      </div>
    );
  }

  // If NOT logged in as Super Admin (unauthenticated or anonymous)
  if (!isSuperAdminUser) {
    return (
      <div className="fixed inset-0 z-50 flex min-h-screen w-full bg-[#FAF9F5] text-slate-800 font-sans overflow-hidden">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Nunito:wght@700;800;900&display=swap');
          .font-nunito { font-family: 'Nunito', sans-serif; }
        `}</style>

        {/* ─── LEFT COLUMN: CORAL HERO BANNER (NETSENTRY TAILORED) ─────────────── */}
        <div className="hidden lg:flex lg:w-1/2 bg-[#FA5438] text-white p-12 lg:p-16 flex-col justify-between relative overflow-hidden">
          {/* Background glow pattern */}
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-orange-600/30 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Logo */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white border border-white/30 shadow-inner">
              <NetSentryLogo className="w-7 h-7" />
            </div>
            <span className="text-2xl font-black tracking-tight font-nunito text-white">
              NetSentry<span className="text-orange-200">.</span>
            </span>
          </div>

          {/* Center Hero Heading (Custom Tailored for NetSentry Admin) */}
          <div className="relative z-10 max-w-lg my-auto py-12">
            <h1 className="text-5xl lg:text-6xl font-extrabold text-white tracking-tight font-nunito leading-[1.1] mb-6">
              It starts with<br />
              a little <span className="inline-block bg-white text-[#FA5438] px-3.5 py-1 rounded-2xl shadow-lg transform -rotate-1">firewall.</span>
            </h1>
            <p className="text-white/95 text-lg leading-relaxed font-medium">
              For your desktop apps, fleet nodes, threat audits, and real-time network telemetry.
            </p>
          </div>

          {/* Bottom Floating NetSentry Status Cards */}
          <div className="relative z-10 space-y-4 max-w-md">
            {/* Card 1: Active Fleet Nodes */}
            <div className="bg-white/95 backdrop-blur-md text-slate-800 p-4 rounded-2xl shadow-xl flex items-center gap-3 border border-white/50 transform -rotate-1 hover:rotate-0 transition-transform">
              <div className="w-9 h-9 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-md">
                <Activity className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">NetSentry Fleet</span>
                  <span className="text-[10px] text-slate-400">just now</span>
                </div>
                <p className="text-slate-600 truncate mt-0.5">14 client desktop nodes streaming data ⚡</p>
              </div>
            </div>

            {/* Card 2: Cyber Threat Defense */}
            <div className="bg-white/95 backdrop-blur-md text-slate-800 p-4 rounded-2xl shadow-xl flex items-center gap-3 border border-white/50 transform rotate-1 hover:rotate-0 transition-transform relative">
              <div className="w-9 h-9 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-md">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Security Audit</span>
                  <span className="text-[10px] text-slate-400">just now</span>
                </div>
                <p className="text-slate-600 truncate mt-0.5">0 threat anomalies. Shield active.</p>
              </div>
              {/* Heart reaction badge */}
              <div className="absolute -bottom-2 right-4 bg-white border border-slate-200 px-2 py-0.5 rounded-full text-[11px] font-bold text-slate-700 shadow-md flex items-center gap-1">
                <span>🛡️</span> Protected
              </div>
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN: SIGN-IN FORM AREA (NETSENTRY TAILORED) ───────────── */}
        <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 md:p-12 lg:p-16 overflow-y-auto bg-[#FAF9F5]">
          {/* Top Header Row */}
          <div className="flex items-center justify-between w-full max-w-md mx-auto lg:max-w-none">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to home
            </Link>

            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 bg-slate-200/60 px-3 py-1 rounded-full">
              Owner Console <Lock className="w-3 h-3 text-slate-500" />
            </span>
          </div>

          {/* Form Content Box */}
          <div className="w-full max-w-md mx-auto my-auto py-10 space-y-6">
            {/* Title */}
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-nunito">
                NetSentry Command.
              </h2>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Authenticate with your administrator credentials to broadcast screen popups, inspect fleet telemetry, and run security audits.
              </p>
            </div>

            {/* 1-Click Google Sign In */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-sm flex items-center justify-center gap-3 transition-all shadow-md active:scale-98 disabled:opacity-60"
              >
                {googleLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <GoogleIcon className="w-5 h-5 bg-white rounded-full p-0.5" />
                )}
                {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="h-[1px] flex-1 bg-slate-200" />
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                or sign in with password
              </span>
              <div className="h-[1px] flex-1 bg-slate-200" />
            </div>

            {/* Email & Password Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Admin Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-12 bg-white border border-slate-200 px-4 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FA5438] transition-all placeholder:text-slate-400 text-slate-900 shadow-sm"
                  placeholder="belloimam431@gmail.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-12 bg-white border border-slate-200 px-4 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FA5438] transition-all placeholder:text-slate-400 text-slate-900 shadow-sm"
                  placeholder="••••••••••••"
                />
              </div>

              {error && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold leading-relaxed">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#FA5438] hover:bg-[#E0452B] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 disabled:opacity-70 mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Command</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </form>

            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              Protected by NetSentry 2FA Security Rules. Access restricted to <span className="font-semibold text-slate-600">{adminEmail}</span>.
            </p>
          </div>

          {/* Footer Note */}
          <div className="w-full max-w-md mx-auto lg:max-w-none text-center">
            <p className="text-xs text-slate-400 font-medium">
              NetSentry Command Portal • v2.0
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Pass-through wrapper for the correct super admin user
  return <>{children}</>;
}
