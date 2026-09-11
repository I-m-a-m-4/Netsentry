import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Lock, EyeOff, Database, ArrowLeft, Mail, Globe, CheckCircle2 } from 'lucide-react';
import { NetSentryLogo } from '@/components/ui/netsentry-logo';

export const metadata: Metadata = {
  title: 'Privacy Policy - NetSentry',
  description: 'Privacy Policy for NetSentry Windows Application and Website. Learn how we respect and protect your data.',
};

export default function PrivacyPolicyPage() {
  const lastUpdated = 'September 10, 2026';

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
      `}</style>

      {/* Background Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(158,200,224,0.2), rgba(189,216,238,0.4), #EAE3D6)' }} />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">

        {/* Navigation */}
        <nav className="w-full px-6 py-6 md:px-12 flex items-center justify-between max-w-7xl mx-auto animate-fade-in">
          <Link href="/" className="flex items-center gap-2 group">
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-black transition-colors" />
            <span className="text-sm font-semibold text-slate-600 group-hover:text-black transition-colors">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <NetSentryLogo className="w-8 h-8 rounded-lg shadow-md" />
            <span className="text-xl font-bold text-slate-900 tracking-tight font-nunito">NetSentry</span>
          </div>
        </nav>

        <main className="flex-grow flex flex-col items-center pt-12 pb-20 px-4 md:px-6 w-full max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center max-w-4xl mx-auto mb-16 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 backdrop-blur-sm" style={{ background: 'rgba(251,146,60,0.15)', border: '1px solid rgba(249,115,22,0.3)', color: '#c2410c', fontSize: '12px', fontWeight: '700' }}>
              <Shield className="w-3.5 h-3.5" />
              Local-First & Zero-Tracking Privacy
            </div>
            <h1 className="leading-tight font-bold text-[#1A1A1A] tracking-tight font-nunito mb-8" style={{ fontSize: 'clamp(48px, 8vw, 78px)', lineHeight: '1' }}>
              Privacy Policy
            </h1>
            <p className="leading-relaxed font-medium text-slate-600 max-w-2xl mx-auto mb-6" style={{ fontSize: '19px' }}>
              NetSentry is designed from the ground up to respect your digital privacy. We believe your network data belongs solely to you.
            </p>
            <div className="text-xs text-slate-500 font-mono font-bold tracking-widest uppercase">
              Last Updated: {lastUpdated}
            </div>
          </div>

          {/* Quick Highlights - Matching Homepage Feature Cards */}
          <section className="w-full max-w-7xl mx-auto mb-16 relative z-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'Zero Traffic Inspection', desc: 'We never inspect packet payloads, website URLs, browser history, or confidential network contents.', icon: <EyeOff className="w-7 h-7 text-orange-600" /> },
                { title: '100% Local Storage', desc: 'Your network usage counters and firewall rules are stored strictly on your local PC in an encrypted SQLite database.', icon: <Database className="w-7 h-7 text-orange-600" /> },
                { title: 'No Data Selling', desc: 'We do not sell, rent, monetize, or broker personal information to advertisers or external corporations.', icon: <Lock className="w-7 h-7 text-orange-600" /> },
              ].map(card => (
                <div key={card.title} className="bg-white/80 backdrop-blur-md rounded-[32px] p-8 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.6)' }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-3xl shadow-sm group-hover:scale-110 transition-transform duration-300" style={{ background: '#F6F4F0', border: '1px solid white' }}>{card.icon}</div>
                  <h3 className="text-xl font-bold text-[#1A1A1A] font-nunito mb-3">{card.title}</h3>
                  <p className="leading-relaxed text-slate-600" style={{ fontSize: '15px' }}>{card.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Detailed Content - Wrapped in a huge homepage-style card */}
          <section className="w-full max-w-4xl mx-auto relative group animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="absolute inset-0 rounded-[40px] rotate-1 transition-transform duration-700 group-hover:rotate-0" style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(254,215,170,0.4), #EFE6D8)' }} />
            <div className="rounded-[32px] p-8 md:p-12 relative shadow-xl bg-white/90 backdrop-blur-md" style={{ border: '1px solid rgba(255,255,255,0.6)' }}>
              
              <div className="space-y-12 text-slate-700 font-medium text-[16px] leading-relaxed">
                
                {/* Section 1 */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-bold text-[#1A1A1A] font-nunito flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold">1</span>
                    Overview & Developer Identity
                  </h2>
                  <p className="text-slate-600">
                    This Privacy Policy applies to the <strong>NetSentry</strong> desktop application (distributed via Microsoft Store and direct installer) and the official website hosted at <a href="https://netsentry-psi.vercel.app/" className="text-orange-600 underline hover:text-orange-800">https://netsentry-psi.vercel.app/</a>. NetSentry is developed and published by <strong>Bimex</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;).
                  </p>
                </section>

                {/* Section 2 */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-bold text-[#1A1A1A] font-nunito flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold">2</span>
                    Information Processed by the Application
                  </h2>
                  <p className="text-slate-600">
                    To provide live bandwidth monitoring, app data usage graphs, and data saver protection, NetSentry queries standard Windows system APIs (such as the Windows Networking and IP Helper APIs) for:
                  </p>
                  <div className="grid gap-3 pt-2">
                    {[
                      { title: 'Process Names', desc: 'Local system process executables (e.g., chrome.exe) to compute per-application byte counts.' },
                      { title: 'Bandwidth Transfer Counters', desc: 'Cumulative numeric bytes transmitted and received during active sessions.' },
                      { title: 'Network Metered Status', desc: 'Windows network state to advise you when connecting to metered cellular hotspots.' }
                    ].map(item => (
                      <div key={item.title} className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-white/50 cursor-default" style={{ border: '1px solid #f1f5f9' }}>
                        <span className="text-orange-500 font-bold">✓</span>
                        <div>
                          <strong className="text-slate-800">{item.title}:</strong> <span className="text-slate-600">{item.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="p-5 mt-6 rounded-[20px] flex items-start gap-4 shadow-sm" style={{ background: '#F6F4F0', border: '1px solid rgba(255,255,255,0.8)' }}>
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                      <strong className="text-slate-900 block mb-1 text-lg font-nunito">Strict Privacy Guarantee</strong>
                      <span className="text-slate-600 text-sm">NetSentry operates as an administrative telemetry monitor. It does not possess, intercept, or log passwords, keystrokes, DNS history, visited web pages, or email contents.</span>
                    </div>
                  </div>
                </section>

                {/* Section 3 & 4 */}
                <div className="grid md:grid-cols-2 gap-8">
                  <section className="space-y-4">
                    <h2 className="text-xl font-bold text-[#1A1A1A] font-nunito flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold">3</span>
                      Local Storage
                    </h2>
                    <p className="text-slate-600 text-sm">
                      All historical data usage metrics are saved locally on your physical machine inside the local application data directory (SQLite database). You have total control over this data. Uninstalling the NetSentry application removes all stored local databases and configuration files.
                    </p>
                  </section>

                  <section className="space-y-4">
                    <h2 className="text-xl font-bold text-[#1A1A1A] font-nunito flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold">4</span>
                      Voluntary Payments
                    </h2>
                    <p className="text-slate-600 text-sm">
                      If you choose to voluntarily support development via our &ldquo;Buy Us a Coffee&rdquo; feature, payment transactions are processed directly by <strong>Paystack</strong>. We never receive, store, or process your credit/debit card numbers or bank credentials.
                    </p>
                  </section>
                </div>

                {/* Section 5 */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-bold text-[#1A1A1A] font-nunito flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold">5</span>
                    Windows Firewall Operations
                  </h2>
                  <p className="text-slate-600">
                    When you activate <em>Focus Mode</em> or pause high-bandwidth background applications, NetSentry executes local Windows Firewall rules using the native Windows <code>netsh advfirewall</code> subsystem. These rules apply exclusively on your local PC and are never broadcast externally.
                  </p>
                </section>

                {/* Section 6 */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-bold text-[#1A1A1A] font-nunito flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold">6</span>
                    Contact Us
                  </h2>
                  <p className="text-slate-600">
                    If you have any questions, suggestions, or concerns regarding this Privacy Policy or NetSentry&apos;s data practices, please reach out to us:
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4 pt-4">
                    <a 
                      href="mailto:belloimam431@gmail.com" 
                      className="p-5 rounded-[24px] shadow-sm transition-all flex items-center gap-4 hover:-translate-y-1 hover:shadow-md group"
                      style={{ background: '#F6F4F0', border: '1px solid white' }}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        <Mail className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#1A1A1A] font-nunito">Email Support</div>
                        <div className="text-xs text-slate-500 font-semibold mt-0.5">belloimam431@gmail.com</div>
                      </div>
                    </a>

                    <a 
                      href="https://netsentry-psi.vercel.app/" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="p-5 rounded-[24px] shadow-sm transition-all flex items-center gap-4 hover:-translate-y-1 hover:shadow-md group"
                      style={{ background: '#F6F4F0', border: '1px solid white' }}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        <Globe className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#1A1A1A] font-nunito">Official Website</div>
                        <div className="text-xs text-slate-500 font-semibold mt-0.5">netsentry-psi.vercel.app</div>
                      </div>
                    </a>
                  </div>
                </section>
              </div>
            </div>
          </section>
        </main>

        {/* Footer (Matches Homepage style) */}
        <footer className="w-full max-w-7xl z-10 mx-auto px-6 pb-12 relative animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="rounded-[40px] p-8 md:p-12 shadow-sm" style={{ background: '#D3E4F4', border: '1px solid rgba(255,255,255,0.2)' }}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <NetSentryLogo className="w-6 h-6 rounded-md" />
                <span className="text-lg font-semibold text-[#1A1A1A] tracking-tight font-nunito">NetSentry</span>
              </div>
              
              <div className="flex items-center gap-6">
                <Link href="/" className="text-sm font-semibold text-slate-600 hover:text-black transition-colors">Home</Link>
                <Link href="/dashboard" className="text-sm font-semibold text-slate-600 hover:text-black transition-colors">Dashboard</Link>
                <span className="text-sm font-bold text-slate-900">Privacy Policy</span>
              </div>
            </div>
            
            <div className="w-full h-px my-8" style={{ background: 'rgba(15,23,42,0.05)' }} />
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-slate-500" style={{ fontSize: '13px' }}>
              <div className="font-medium">© {new Date().getFullYear()} NetSentry by Bimex. All rights reserved.</div>
              <div className="font-medium">Built with ❤️ for Windows users everywhere</div>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}

