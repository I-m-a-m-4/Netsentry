'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { NetSentryLogo } from '@/components/ui/netsentry-logo';

// ─── Platform icons ──────────────────────────────────────────────────────────
function WindowsIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
    </svg>
  );
}

function AppleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  );
}

// ─── OS-aware download button ─────────────────────────────────────────────────
function DownloadButton({ size = 'lg' }: { size?: 'sm' | 'lg' }) {
  const [os, setOs] = useState<'windows' | 'mac' | 'other' | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('win')) setOs('windows');
    else if (ua.includes('mac')) setOs('mac');
    else setOs('other');
  }, []);

  const isLg = size === 'lg';
  const base = isLg
    ? { fontSize: '17px', padding: '14px 28px' }
    : { fontSize: '15px', padding: '10px 20px' };

  if (!os) {
    // SSR / hydration placeholder — matches Windows button shape
    return (
      <div
        className="flex items-center gap-3 font-semibold text-white rounded-full shadow-lg"
        style={{ background: '#1A1A1A', ...base, opacity: 0 }}
      >
        <WindowsIcon size={isLg ? 18 : 15} />
        Download for Windows
      </div>
    );
  }

  if (os === 'mac') {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <a
          href="#"
          className="flex items-center gap-3 font-semibold text-white rounded-full shadow-lg hover:bg-black hover:shadow-xl hover:-translate-y-0.5 transition-all w-full sm:w-auto justify-center"
          style={{ background: '#1A1A1A', ...base }}
        >
          <AppleIcon size={isLg ? 18 : 15} />
          Download for Mac
        </a>
        {isLg && (
          <span className="text-xs font-medium text-slate-500">macOS 12 Monterey or later</span>
        )}
      </div>
    );
  }

  // Windows (default)
  return (
    <div className="flex flex-col items-center gap-1.5">
      <a
        href="https://apps.microsoft.com/store/detail/9P8LKHFTRKKS"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 font-semibold text-white rounded-full shadow-lg hover:bg-black hover:shadow-xl hover:-translate-y-0.5 transition-all w-full sm:w-auto justify-center"
        style={{ background: '#1A1A1A', ...base }}
      >
        <WindowsIcon size={isLg ? 18 : 15} />
        Download on Microsoft Store
      </a>
      {isLg && (
        <span className="text-xs font-medium text-slate-500">Official Microsoft Store Listing</span>
      )}
    </div>
  );
}

import { useRouter } from 'next/navigation';

export default function LandingPage() {
 const router = useRouter();

 useEffect(() => {
 // Redirect to dashboard if running inside Tauri
 if (typeof window !== 'undefined' && ((window as any).__TAURI__ || (window as any).__TAURI_INTERNALS__)) {
 router.replace('/dashboard');
 }
 }, [router]);

 return (
    <div className="antialiased min-h-screen overflow-x-hidden text-slate-800 font-sans relative" style={{ background: '#A8CCDF' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Nunito:wght@600;700;800&display=swap');
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 0px; background: transparent; }
        .font-nunito { font-family: 'Nunito', sans-serif; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 1s ease-out forwards; }
        .animate-slide-up { animation: slideUp 1s ease-out forwards; }
        @keyframes scroll-testimonials { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-scroll-testimonials { animation: scroll-testimonials 80s linear infinite; }
        .animate-scroll-testimonials:hover { animation-play-state: paused; }
        @keyframes wheel-rotate { 0% { transform: translateY(0); } 100% { transform: translateY(calc(-50% - 2rem)); } }
        .animate-wheel { animation: wheel-rotate 15s linear infinite; }
      `}</style>

      {/* Background Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(158,200,224,0.2), rgba(189,216,238,0.4), #EAE3D6)' }} />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">

        {/* Navigation */}
        <nav className="w-full px-6 py-6 md:px-12 flex items-center justify-between max-w-7xl mx-auto animate-fade-in">
          <div className="flex items-center gap-2">
            <NetSentryLogo className="w-8 h-8 rounded-lg shadow-md" />
            <span className="text-xl font-bold text-slate-900 tracking-tight font-nunito">NetSentry</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-700" style={{ fontSize: '15px' }}>
            <a href="#features" className="hover:text-black transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-black transition-colors">How it Works</a>
            <a href="#pricing" className="hover:text-black transition-colors">Pricing</a>
            <a href="#" className="hover:text-black transition-colors">Support</a>
          </div>
          <DownloadButton size="sm" />
        </nav>

        {/* Hero Section */}
        <main className="flex-grow flex flex-col items-center pt-12 pb-20 px-4 md:px-6 w-full max-w-7xl mx-auto">

          <div className="text-center max-w-4xl mx-auto mb-16 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 backdrop-blur-sm" style={{ background: 'rgba(251,146,60,0.15)', border: '1px solid rgba(249,115,22,0.3)', color: '#c2410c', fontSize: '12px', fontWeight: '700' }}>
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              Now available for Windows — Free Download
            </div>
            <h1 className="leading-tight font-bold text-[#1A1A1A] tracking-tight font-nunito mb-8" style={{ fontSize: 'clamp(48px, 8vw, 78px)', lineHeight: '1' }}>
              Take control of<br />your internet
            </h1>
            <p className="leading-relaxed font-medium text-slate-600 max-w-2xl mx-auto mb-10" style={{ fontSize: '19px' }}>
              Monitor live speeds, block data-hungry apps, set daily limits, and protect your connection. Simple, beautiful, and built for everyday Windows users.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <DownloadButton size="lg" />
              <a href="#features" className="text-[#1A1A1A] font-medium w-full sm:w-auto flex items-center justify-center gap-2 rounded-full hover:-translate-y-0.5 transition-all" style={{ background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.5)', fontSize: '17px', padding: '14px 32px' }}>
                See features
              </a>
            </div>
          </div>

          {/* Dashboard Mockup */}
          <div className="w-full rounded-t-[32px] border overflow-hidden flex flex-col md:flex-row relative animate-slide-up" style={{ maxWidth: '1300px', background: '#FDFBF9', borderColor: 'rgba(255,255,255,0.6)', boxShadow: '0 50px 100px -20px rgba(50,50,93,0.15), 0 30px 60px -30px rgba(0,0,0,0.1)', animationDelay: '0.3s' }}>

            {/* Sidebar */}
            <aside className="hidden md:flex flex-col w-64 p-6" style={{ borderRight: '1px solid #f1f5f9', background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(8px)' }}>
              <div className="flex items-center gap-2 mb-8 px-2">
                <NetSentryLogo className="w-5 h-5 rounded-md" />
                <span className="text-lg font-bold text-slate-900 font-nunito">NetSentry</span>
              </div>
              <nav className="space-y-1 mb-8">
                {[
                  { label: 'Overview', active: true },
                  { label: 'App Manager' },
                  { label: 'Data Usage' },
                  { label: 'Focus Mode' },
                ].map(item => (
                  <a key={item.label} href="#" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${item.active ? 'bg-[#EAE5DC] text-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>
                    <span className="w-4 h-4 rounded-sm inline-block" style={{ background: 'currentColor', opacity: 0.5 }} />
                    {item.label}
                  </a>
                ))}
              </nav>
              <div className="mt-auto">
                <p className="px-3 mb-2 text-slate-400 uppercase tracking-wider" style={{ fontSize: '11px', fontWeight: '700' }}>Tools</p>
                <nav className="space-y-1">
                  {['Firewall Rules', 'Bandwidth Limits', 'Smart Scheduler', 'Connection Log', 'Emergency Reset'].map(label => (
                    <a key={label} href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors font-medium text-sm">
                      <span className="w-4 h-4 rounded-sm inline-block" style={{ background: 'currentColor', opacity: 0.4 }} />
                      {label}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 p-6 md:p-8 max-h-[70vh] md:max-h-none overflow-y-auto" style={{ background: '#FDFBF9' }}>
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 font-nunito">Network Overview</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Real-time telemetry · Metered connection active</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <input type="text" placeholder="Search apps" className="pl-4 pr-4 py-2 bg-white border rounded-full text-sm placeholder:text-slate-400 focus:outline-none w-48 shadow-sm" style={{ borderColor: '#f1f5f9' }} />
                  </div>
                  <div className="flex items-center gap-3 pl-4" style={{ borderLeft: '1px solid #e2e8f0' }}>
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-semibold text-slate-700">Engine Active</span>
                  </div>
                </div>
              </header>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Data Used Today', value: '1.58 GB', badge: '100%', bad: true },
                  { label: 'Download Speed', value: '6.9 KB/s', badge: '↑Live', bad: false },
                  { label: 'Upload Speed', value: '3.1 KB/s', badge: '↑Live', bad: false },
                  { label: 'Active Sockets', value: '238', badge: '+12', bad: false },
                ].map(stat => (
                  <div key={stat.label} className="p-5 rounded-xl transition-colors" style={{ background: '#F6F4F0', border: '1px solid transparent' }}>
                    <div className="flex items-center gap-2 text-slate-500 mb-6">
                      <div className="p-1.5 rounded-md shadow-sm" style={{ background: 'white' }}>
                        <span className="w-4 h-4 bg-slate-700 rounded block" style={{ opacity: 0.7 }} />
                      </div>
                      <span className="text-xs font-semibold">{stat.label}</span>
                    </div>
                    <div className="flex items-end justify-between">
                      <span className="text-3xl font-bold font-nunito text-slate-900">{stat.value}</span>
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ color: stat.bad ? '#ef4444' : '#16a34a', background: stat.bad ? 'rgba(239,68,68,0.1)' : 'rgba(22,163,74,0.1)', fontSize: '11px' }}>{stat.badge}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm" style={{ border: '1px solid #f1f5f9' }}>
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="font-bold text-sm text-slate-900">Data usage over time</h3>
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50" style={{ border: '1px solid #e2e8f0' }}>Month ↓</button>
                  </div>
                  <div className="flex items-center gap-4 mb-6" style={{ fontSize: '12px', fontWeight: '600' }}>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-orange-400" />
                      <span className="text-slate-600">Download</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-orange-200" />
                      <span className="text-slate-400">Upload</span>
                    </div>
                  </div>
                  <div className="h-48 w-full flex items-end justify-between gap-2 md:gap-4 px-2">
                    {[30, 65, 25, 35, 25, 38, 58, 18, 32, 48, 12, 42].map((h, i) => (
                      <div key={i} className="w-full flex flex-col justify-end gap-0.5 h-full group">
                        <div className="w-full rounded-t-sm transition-colors" style={{ height: `${h}%`, background: i === 6 ? 'rgba(251,146,60,0.6)' : 'rgba(251,146,60,0.25)' }} />
                        <div className="text-center text-slate-400 mt-2" style={{ fontSize: '9px' }}>
                          {['J','F','M','A','M','J','J','A','S','O','N','D'][i]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Block App', icon: '🚫' },
                    { label: 'Focus Mode', icon: '🎯' },
                    { label: 'Set Limit', icon: '📊' },
                    { label: 'View Log', icon: '📋' },
                    { label: 'Speed Test', icon: '⚡' },
                    { label: 'Reset Rules', icon: '🔄' },
                  ].map(action => (
                    <div key={action.label} className="bg-white p-4 rounded-xl shadow-sm flex flex-col items-start justify-center gap-3 hover:border-slate-300 transition-colors cursor-pointer group" style={{ border: '1px solid #f1f5f9' }}>
                      <div className="p-2 rounded-lg text-lg group-hover:bg-[#EAE5DC] transition-colors" style={{ background: '#F6F4F0' }}>{action.icon}</div>
                      <span className="font-semibold text-slate-700" style={{ fontSize: '11px' }}>{action.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Features Section */}
        <section id="features" className="w-full max-w-7xl mx-auto px-4 md:px-6 py-24 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-4 block">One App</span>
            <h2 className="md:text-5xl text-3xl font-semibold text-[#1A1A1A] tracking-tight font-nunito mb-6">Everything you need to own your network</h2>
            <p className="text-lg text-slate-600 font-medium">Stop watching your data disappear. Take control of every byte with beautiful, simple tools built for real people.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Live Bandwidth Monitor', desc: 'See real-time download and upload speeds for every app on your PC. Know exactly who is consuming your connection, second by second.', icon: '📡' },
              { title: 'Data Limit & Alerts', desc: 'Set a daily or monthly data cap. NetSentry automatically alerts you before you hit the limit and can cut off traffic to protect your quota.', icon: '🛡️' },
              { title: 'Focus Mode & App Blocker', desc: 'Block distracting or data-hungry apps with a single click. Stay in the zone without background apps wasting your connection.', icon: '🎯' },
            ].map(card => (
              <div key={card.title} className="bg-white/80 backdrop-blur-md rounded-[32px] p-8 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.6)' }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-3xl shadow-sm group-hover:scale-110 transition-transform duration-300" style={{ background: '#F6F4F0', border: '1px solid white' }}>{card.icon}</div>
                <h3 className="text-xl font-bold text-[#1A1A1A] font-nunito mb-3">{card.title}</h3>
                <p className="leading-relaxed text-slate-600" style={{ fontSize: '15px' }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Feature Block 1: App Manager */}
        <section id="how-it-works" className="w-full max-w-7xl mx-auto px-4 md:px-12 py-16 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24 mb-32">
            <div className="w-full lg:w-[55%] relative group">
              <div className="absolute inset-0 rounded-[40px] rotate-1 transition-transform duration-700 group-hover:rotate-0" style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(254,215,170,0.4), #EFE6D8)' }} />
              <div className="rounded-3xl p-8 relative shadow-xl hover:scale-[1.01] transition-transform duration-500" style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(254,215,170,0.3), #EFE6D8)' }}>
                <div className="bg-white max-w-lg rounded-2xl mx-auto shadow-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.6)' }}>
                  <div className="p-6" style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <h3 className="font-bold text-lg text-slate-900 font-nunito mb-4">App Data Usage</h3>
                    <div className="flex gap-2">
                      <input type="text" placeholder="Search apps..." className="flex-1 bg-white rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none shadow-sm" style={{ border: '1px solid #e2e8f0' }} />
                      <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 shadow-sm" style={{ border: '1px solid #e2e8f0' }}>Filter</button>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(248,250,252,0.6)' }}>
                    <div className="px-6 py-4"><span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Top Apps Today</span></div>
                    <div className="bg-white shadow-sm" style={{ borderTop: '1px solid #f1f5f9' }}>
                      {[
                        { name: 'Chrome.exe', usage: '892 MB', status: 'Active', bar: 89 },
                        { name: 'Teams.exe', usage: '340 MB', status: 'Paused', bar: 34 },
                        { name: 'Spotify.exe', usage: '128 MB', status: 'Active', bar: 13 },
                        { name: 'Steam.exe', usage: '76 MB', status: 'Blocked', bar: 8 },
                        { name: 'Discord.exe', usage: '54 MB', status: 'Active', bar: 5 },
                      ].map((app, idx) => (
                        <div key={idx} className="grid items-center px-6 py-4 hover:bg-slate-50 transition-colors" style={{ gridTemplateColumns: '2fr 1fr 1fr', gap: '16px', borderBottom: idx < 4 ? '1px solid #f8fafc' : 'none' }}>
                          <div>
                            <div className="font-semibold text-slate-900" style={{ fontSize: '13px' }}>{app.name}</div>
                            <div className="mt-1 h-1.5 rounded-full overflow-hidden w-full" style={{ background: '#f1f5f9' }}>
                              <div className="h-full rounded-full" style={{ width: `${app.bar}%`, background: '#fb923c' }} />
                            </div>
                          </div>
                          <div className="text-sm font-semibold text-slate-700">{app.usage}</div>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold" style={{
                            fontSize: '10px',
                            background: app.status === 'Active' ? '#f0fdf4' : app.status === 'Paused' ? '#fefce8' : '#fef2f2',
                            border: `1px solid ${app.status === 'Active' ? '#bbf7d0' : app.status === 'Paused' ? '#fef08a' : '#fecaca'}`,
                            color: app.status === 'Active' ? '#15803d' : app.status === 'Paused' ? '#a16207' : '#b91c1c',
                          }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: app.status === 'Active' ? '#22c55e' : app.status === 'Paused' ? '#eab308' : '#ef4444' }} />
                            {app.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full lg:w-[45%]">
              <span className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-4 block">App Manager</span>
              <h2 className="text-4xl font-semibold text-[#1A1A1A] tracking-tight font-nunito mb-6" style={{ fontSize: 'clamp(32px, 4vw, 46px)', lineHeight: '1.15' }}>See every app using your internet</h2>
              <p className="leading-relaxed font-medium text-slate-600 mb-10" style={{ fontSize: '18px' }}>
                NetSentry tracks every process on your Windows PC in real time. Know which apps are eating your data, pause or block them instantly, and take back full control of your bandwidth.
              </p>
              <Link href="/dashboard" className="inline-block text-white px-8 py-3.5 rounded-full font-semibold shadow-lg hover:bg-black hover:shadow-xl hover:-translate-y-0.5 transition-all mb-12" style={{ background: '#1A1A1A', fontSize: '15px' }}>
                Open NetSentry
              </Link>
              <div className="grid grid-cols-2 gap-4">
                {['Per-app tracking', 'Real-time speeds', 'Block instantly', 'Usage history'].map(f => (
                  <div key={f} className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-white/50 hover:bg-white hover:shadow-md transition-all cursor-default" style={{ border: '1px solid #f1f5f9' }}>
                    <span className="text-slate-800 font-bold">✓</span>
                    <span className="text-sm font-semibold text-slate-700">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feature Block 2: Data Protection */}
          <div className="flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-24">
            <div className="w-full lg:w-[45%]">
              <span className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-4 block">Data Protection</span>
              <h2 className="text-4xl font-semibold text-[#1A1A1A] tracking-tight font-nunito mb-6" style={{ fontSize: 'clamp(32px, 4vw, 46px)', lineHeight: '1.15' }}>Set limits. Stay safe. Never overpay again.</h2>
              <p className="text-slate-600 font-medium mb-10 leading-relaxed" style={{ fontSize: '18px' }}>
                Whether you are on a mobile hotspot or a capped broadband plan, NetSentry ensures you never accidentally blow your data allowance. Set a limit, walk away, and let NetSentry handle the rest.
              </p>
              <Link href="/dashboard" className="inline-block text-white px-8 py-3.5 rounded-full font-semibold shadow-lg hover:bg-black hover:shadow-xl hover:-translate-y-0.5 transition-all mb-12" style={{ background: '#1A1A1A', fontSize: '15px' }}>
                Try it now
              </Link>
              <div className="grid grid-cols-2 gap-4">
                {['Daily limits', 'Auto-cutoff', 'Smart alerts', 'Usage trends'].map(f => (
                  <div key={f} className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-white/50 hover:bg-white hover:shadow-md transition-all cursor-default" style={{ border: '1px solid #f1f5f9' }}>
                    <span className="text-slate-800 font-bold">✓</span>
                    <span className="text-sm font-semibold text-slate-700">{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full lg:w-[55%] relative group">
              <div className="absolute inset-0 rounded-[40px] -rotate-1 transition-transform duration-700 group-hover:rotate-0" style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.1), rgba(254,215,170,0.3), #EFE6D8)' }} />
              <div className="rounded-3xl p-8 relative shadow-xl hover:scale-[1.01] transition-transform duration-500" style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.12), rgba(254,215,170,0.25), #EFE6D8)' }}>
                <div className="font-sans bg-white max-w-lg rounded-2xl mx-auto p-8 shadow-xl" style={{ border: '1px solid rgba(255,255,255,0.6)' }}>
                  <h3 className="font-bold text-lg text-slate-900 font-nunito mb-8">Bandwidth Quota</h3>
                  <div className="grid grid-cols-2 gap-y-10 gap-x-6 mb-10 pb-10" style={{ borderBottom: '1px solid #f1f5f9' }}>
                    {[
                      { icon: '📊', value: '1,580 MB', label: 'Used today' },
                      { icon: '🎯', value: '1,000 MB', label: 'Daily limit' },
                      { icon: '💾', value: '0 MB', label: 'Buffer remaining' },
                      { icon: '📈', value: '100%', label: 'Quota used' },
                    ].map(stat => (
                      <div key={stat.label} className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0" style={{ background: '#f1f5f9' }}>{stat.icon}</div>
                        <div>
                          <div className="font-bold font-nunito text-slate-900 leading-none mb-1.5" style={{ fontSize: '26px' }}>{stat.value}</div>
                          <div className="text-xs font-semibold text-slate-500">{stat.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-slate-900 font-nunito">Usage over time</h3>
                    </div>
                    <div className="w-full h-32 relative">
                      <div className="absolute top-0 bottom-0 left-[62%] w-px bg-slate-900 z-10" />
                      <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="chartGrad2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f97316" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path d="M0,48 L15,46 L30,40 L45,38 L62,30 L62,48 L0,48" fill="url(#chartGrad2)" />
                        <path d="M0,48 L15,46 L30,40 L45,38 L62,30" fill="none" stroke="#f97316" strokeWidth="0.8" strokeLinecap="round" />
                        <path d="M62,30 L75,15 L90,10 L100,5" fill="none" stroke="#f97316" strokeWidth="0.8" strokeDasharray="2 2" strokeLinecap="round" />
                      </svg>
                      <div className="flex justify-between mt-2 text-slate-400 font-bold" style={{ fontSize: '10px' }}>
                        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <span key={d}>{d}</span>)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Feature Cards */}
        <section className="w-full max-w-7xl mx-auto px-4 md:px-12 py-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '🔥', title: 'Emergency Firewall Reset', desc: 'If something goes wrong with your connection, tap one button to restore Windows Firewall back to factory defaults. No technical knowledge required.' },
              { icon: '🌍', title: 'Metered Connection Smart Mode', desc: 'Automatically detects mobile hotspots and capped plans, switching to a conservative low-data profile without you lifting a finger.' },
              { icon: '📱', title: 'Simple & Consumer-Friendly', desc: 'No confusing firewall rules or technical jargon. NetSentry uses plain English so anyone can understand and control their internet from day one.' },
            ].map(f => (
              <div key={f.title} className="rounded-[32px] p-8 md:p-10 flex flex-col items-start gap-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group" style={{ background: '#F2EBE5' }}>
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform text-2xl">{f.icon}</div>
                <h4 className="text-lg font-bold text-slate-900 font-nunito">{f.title}</h4>
                <p className="leading-relaxed text-slate-600" style={{ fontSize: '15px' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Scrolling Ticker */}
        <section className="w-full max-w-7xl mx-auto relative overflow-hidden my-8 z-10" style={{ height: '300px' }}>
          <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none" style={{ height: '38%', background: 'linear-gradient(to bottom, rgba(234,227,214,0), rgba(234,227,214,0.9), transparent)' }} />
          <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none" style={{ height: '38%', background: 'linear-gradient(to top, rgba(234,227,214,0), rgba(234,227,214,0.9), transparent)' }} />
          <div className="flex flex-col items-center gap-6 animate-wheel" style={{ willChange: 'transform' }}>
            {['Monitor','Block','Protect','Control','Save Data','Go Fast','Stay Safe','Monitor','Block','Protect','Control','Save Data','Go Fast','Stay Safe'].map((t, i) => (
              <div key={i} className="font-bold font-nunito text-[#1A1A1A] tracking-tight" style={{ fontSize: 'clamp(48px, 8vw, 96px)', opacity: i % 7 === 2 ? 1 : i % 7 === 1 || i % 7 === 3 ? 0.4 : 0.2, filter: (i % 7 === 0 || i % 7 === 4 || i % 7 === 5 || i % 7 === 6) ? 'blur(1px)' : 'none' }}>{t}</div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="w-full relative py-24 z-10" style={{ background: '#F6F4F0', borderTop: '1px solid rgba(255,255,255,0.4)' }}>
          <div className="max-w-4xl mx-auto px-6 text-center mb-20">
            <h2 className="leading-tight font-semibold text-[#1A1A1A] tracking-tight font-nunito mb-10 drop-shadow-sm" style={{ fontSize: 'clamp(28px, 5vw, 48px)' }}>
              &ldquo;NetSentry completely transformed how I manage my laptop on mobile data. It just works.&rdquo;
            </h2>
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="p-1 rounded-full bg-white shadow-sm" style={{ border: '1px solid #e2e8f0' }}>
                <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-2xl">👤</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-[#1A1A1A] font-nunito">James Okafor</div>
                <div className="text-sm font-medium text-slate-500">Software Engineer, Lagos</div>
              </div>
            </div>
          </div>
          <div className="relative w-full overflow-hidden pb-10">
            <div className="absolute inset-y-0 left-0 z-20 pointer-events-none" style={{ width: '8rem', background: 'linear-gradient(to right, #F6F4F0, transparent)' }} />
            <div className="absolute inset-y-0 right-0 z-20 pointer-events-none" style={{ width: '8rem', background: 'linear-gradient(to left, #F6F4F0, transparent)' }} />
            <div className="flex animate-scroll-testimonials gap-8 px-4" style={{ width: 'max-content' }}>
              {[
                { quote: 'I was burning through my hotspot every month. NetSentry showed Chrome was the culprit. I blocked it when not needed and my data bill dropped significantly.', name: 'Amara K.', role: 'Graphic Designer' },
                { quote: 'The Focus Mode is incredible. I block social media apps during work hours and my productivity has gone through the roof. Highly recommend to anyone working from home.', name: 'David M.', role: 'Remote Developer' },
                { quote: 'Finally a Windows tool that speaks plain English. I have tried other firewalls and gave up after 10 minutes. NetSentry was up and running in seconds.', name: 'Sophie L.', role: 'Content Creator' },
                { quote: 'The Emergency Firewall Reset saved me when my connection broke. One click and everything was back to normal. Absolute lifesaver.', name: 'Emeka O.', role: 'IT Support Tech' },
              ].flatMap((t, i) => [0, 1].map(j => (
                <div key={`${i}-${j}`} className="bg-white rounded-[32px] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow duration-300" style={{ width: '420px', padding: '40px', border: '1px solid #f1f5f9' }}>
                  <p className="leading-relaxed text-slate-600 mb-8" style={{ fontSize: '17px' }}>"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-600" style={{ border: '1px solid #f1f5f9' }}>{t.name[0]}</div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 font-nunito">{t.name}</div>
                      <div className="text-xs font-medium text-slate-500">{t.role}</div>
                    </div>
                  </div>
                </div>
              )))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="w-full z-10 pt-24 pb-32 relative" style={{ background: '#F6F4F0', borderTop: '1px solid rgba(255,255,255,0.4)' }}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <span className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-5 block">Pricing</span>
              <h2 className="font-semibold text-[#1A1A1A] tracking-tight font-nunito mb-6" style={{ fontSize: 'clamp(32px, 5vw, 56px)', lineHeight: '1.1' }}>Simple, honest pricing</h2>
              <p className="leading-relaxed text-slate-600 font-medium max-w-xl mx-auto" style={{ fontSize: '17px' }}>
                NetSentry is free for personal use. No hidden fees, no subscriptions. Just download and go.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start mb-20">
              <div className="bg-white rounded-[32px] p-8 lg:p-10 shadow-sm flex flex-col h-full hover:shadow-lg transition-shadow" style={{ border: '1px solid #f1f5f9' }}>
                <h3 className="text-lg font-semibold text-slate-900 font-nunito mb-2">Personal</h3>
                <div className="font-bold font-nunito text-[#1A1A1A] tracking-tight mb-4" style={{ fontSize: '48px' }}>Free</div>
                <p className="text-sm text-slate-500 font-medium mb-10 leading-relaxed">For everyday users who want to monitor and save data.</p>
                <ul className="space-y-4 mb-10 flex-1">
                  {['Live bandwidth monitor', 'Per-app data tracking', 'Daily data limit', 'Focus Mode (app blocker)', 'Basic usage history'].map(f => (
                    <li key={f} className="flex items-start gap-3 font-medium text-slate-700" style={{ fontSize: '15px' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-900 shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/dashboard" className="w-full py-4 rounded-full font-semibold text-center block hover:bg-slate-200 transition-colors" style={{ background: '#f1f5f9', color: '#0f172a', fontSize: '15px' }}>
                  Open App
                </Link>
              </div>
              <div className="rounded-[32px] p-8 lg:p-10 relative shadow-xl flex flex-col h-full z-10 md:-mt-6 md:mb-6" style={{ background: 'linear-gradient(to bottom, #fff7ed, rgba(254,215,170,0.5))', border: '1.5px solid #fed7aa' }}>
                <div className="absolute top-8 right-8">
                  <span className="text-white font-bold px-2.5 py-1 rounded-full uppercase tracking-wide" style={{ background: '#f97316', fontSize: '10px' }}>Most Popular</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 font-nunito mb-2 mt-8 md:mt-0">Pro</h3>
                <div className="font-bold font-nunito text-[#1A1A1A] tracking-tight mb-4" style={{ fontSize: '48px' }}>$4.99<span className="text-xl text-slate-500 font-medium ml-1">/mo</span></div>
                <p className="text-sm text-slate-500 font-medium mb-10 leading-relaxed">For power users who need deeper insights and controls.</p>
                <ul className="space-y-4 mb-10 flex-1">
                  {['Everything in Personal', 'Advanced analytics dashboard', '30-day usage history', 'Smart auto-cutoff rules', 'Priority support'].map(f => (
                    <li key={f} className="flex items-start gap-3 font-medium text-slate-800" style={{ fontSize: '15px' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-900 shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button className="w-full py-4 rounded-full text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all" style={{ background: '#1A1A1A', fontSize: '15px' }}>
                  Coming Soon
                </button>
              </div>
              <div className="bg-white rounded-[32px] p-8 lg:p-10 shadow-sm flex flex-col h-full hover:shadow-lg transition-shadow" style={{ border: '1px solid #f1f5f9' }}>
                <h3 className="text-lg font-semibold text-slate-900 font-nunito mb-2">Enterprise</h3>
                <div className="font-bold font-nunito text-[#1A1A1A] tracking-tight mb-4" style={{ fontSize: '48px' }}>Custom</div>
                <p className="text-sm text-slate-500 font-medium mb-10 leading-relaxed">For IT teams and businesses deploying across multiple devices.</p>
                <ul className="space-y-4 mb-10 flex-1">
                  {['Everything in Pro', 'Centralized admin panel', 'MSI/silent installer', 'Group policy support', 'Dedicated account manager'].map(f => (
                    <li key={f} className="flex items-start gap-3 font-medium text-slate-700" style={{ fontSize: '15px' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-900 shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button className="w-full py-4 rounded-full font-semibold hover:bg-slate-200 transition-colors" style={{ background: '#f1f5f9', color: '#0f172a', fontSize: '15px' }}>
                  Contact us
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full max-w-7xl z-10 mx-auto pt-20 px-6 pb-12 relative">
          <div className="rounded-[40px] p-8 md:p-12 lg:p-16 shadow-sm" style={{ background: '#D3E4F4', border: '1px solid rgba(255,255,255,0.2)' }}>
            <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 mb-16 justify-between">
              <div className="max-w-sm">
                <div className="flex items-center gap-2 mb-6">
                  <NetSentryLogo className="w-7 h-7 rounded-md" />
                  <span className="text-xl font-semibold text-[#1A1A1A] tracking-tight font-nunito">NetSentry</span>
                </div>
                <p className="leading-relaxed text-slate-600 font-medium mb-8" style={{ fontSize: '15px' }}>
                  Your beautiful, simple internet monitor for Windows. Stop wasting data. Start owning your connection.
                </p>
              </div>
              <div className="flex gap-12 sm:gap-24">
                <div className="flex flex-col gap-4">
                  <h4 className="text-xs font-semibold tracking-widest text-[#1A1A1A] uppercase mb-1 font-nunito">Product</h4>
                  {['Features', 'Download', 'Changelog', 'Roadmap'].map(l => (
                    <a key={l} href="#" className="text-slate-600 hover:text-[#1A1A1A] transition-colors" style={{ fontSize: '15px' }}>{l}</a>
                  ))}
                </div>
                <div className="flex flex-col gap-4">
                  <h4 className="text-xs font-semibold tracking-widest text-[#1A1A1A] uppercase mb-1 font-nunito">Support</h4>
                  <a href="mailto:belloimam431@gmail.com" className="text-slate-600 hover:text-[#1A1A1A] transition-colors" style={{ fontSize: '15px' }}>Contact</a>
                  <Link href="/privacy" className="text-slate-600 hover:text-[#1A1A1A] transition-colors" style={{ fontSize: '15px' }}>Privacy Policy</Link>
                  <a href="https://github.com/I-m-a-m-4/Netsentry" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-[#1A1A1A] transition-colors" style={{ fontSize: '15px' }}>GitHub</a>
                </div>
              </div>
            </div>
            <div className="w-full h-px mb-8" style={{ background: 'rgba(15,23,42,0.05)' }} />
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-slate-500" style={{ fontSize: '13px' }}>
              <div>© 2026 NetSentry. All rights reserved.</div>
              <div>Built with ❤️ for Windows users everywhere</div>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}


