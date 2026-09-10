import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Lock, EyeOff, Database, ArrowLeft, Heart, CheckCircle2, Mail, Globe } from 'lucide-react';
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
      `}</style>

      {/* Background Layer (Matches Homepage) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(158,200,224,0.2), rgba(189,216,238,0.4), #EAE3D6)' }} />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 backdrop-blur-md border-b" style={{ background: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.5)' }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-black transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to NetSentry</span>
            </Link>

            <div className="flex items-center gap-2">
              <NetSentryLogo className="w-7 h-7 rounded-lg shadow-sm" />
              <span className="font-bold tracking-tight text-sm font-nunito text-slate-900">NetSentry</span>
            </div>
          </div>
        </header>

        {/* Hero Header */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 relative z-10 w-full">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 backdrop-blur-sm" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#047857', fontSize: '12px', fontWeight: '700' }}>
              <Shield className="w-3.5 h-3.5" />
              <span>Local-First & Zero-Tracking Privacy</span>
            </div>
            <h1 className="leading-tight font-bold text-[#1A1A1A] tracking-tight font-nunito mb-4 text-3xl sm:text-4xl lg:text-5xl">
              Privacy Policy
            </h1>
            <p className="leading-relaxed font-medium text-slate-600 max-w-2xl mx-auto mb-3" style={{ fontSize: '17px' }}>
              NetSentry is designed from the ground up to respect your digital privacy. We believe your network data belongs solely to you.
            </p>
            <div className="text-xs text-slate-500 font-mono font-medium">
              Effective & Last Updated: {lastUpdated}
            </div>
          </div>

          {/* Quick Highlights Banner */}
          <div className="grid sm:grid-cols-3 gap-4 mb-12">
            <div className="p-5 rounded-2xl flex flex-col gap-2 border" style={{ background: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)' }}>
              <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600 w-fit">
                <EyeOff className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 font-nunito">Zero Traffic Inspection</h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                We never inspect packet payloads, website URLs, browser history, or confidential network contents.
              </p>
            </div>

            <div className="p-5 rounded-2xl flex flex-col gap-2 border" style={{ background: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)' }}>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 w-fit">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 font-nunito">100% Local Storage</h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Your network usage counters and firewall rules are stored strictly on your local PC in an encrypted SQLite database.
              </p>
            </div>

            <div className="p-5 rounded-2xl flex flex-col gap-2 border" style={{ background: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)' }}>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 w-fit">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 font-nunito">No Data Selling</h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                We do not sell, rent, monetize, or broker personal information to advertisers or external corporations.
              </p>
            </div>
          </div>

          {/* Privacy Policy Detailed Content */}
          <div className="space-y-10 text-slate-700 font-medium text-[15px] leading-relaxed border-t pt-10" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
            {/* Section 1 */}
            <section className="space-y-3">
              <h2 className="font-nunito text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="text-orange-600 font-mono text-base">1.</span>
                <span>Overview & Developer Identity</span>
              </h2>
              <p>
                This Privacy Policy applies to the <strong>NetSentry</strong> desktop application (distributed via Microsoft Store and direct installer) and the official website hosted at <a href="https://netsentry-psi.vercel.app/" className="text-orange-600 underline hover:text-orange-800">https://netsentry-psi.vercel.app/</a>. NetSentry is developed and published by <strong>Bimex</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;).
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <h2 className="font-nunito text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="text-orange-600 font-mono text-base">2.</span>
                <span>Information Processed by the Application</span>
              </h2>
              <p>
                To provide live bandwidth monitoring, app data usage graphs, and data saver protection, NetSentry queries standard Windows system APIs (such as the Windows Networking and IP Helper APIs) for:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                <li><strong>Process Names:</strong> Local system process executables (e.g., <code>chrome.exe</code>, <code>msedge.exe</code>) to compute per-application byte counts.</li>
                <li><strong>Bandwidth Transfer Counters:</strong> Cumulative numeric bytes transmitted and received during active sessions.</li>
                <li><strong>Network Metered Status:</strong> Windows network state to advise you when connecting to metered cellular hotspots.</li>
              </ul>
              <div className="p-4 rounded-xl border mt-4 text-sm text-slate-700 flex items-start gap-3" style={{ background: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.8)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-slate-900">Strict Privacy Guarantee:</strong> NetSentry operates as an administrative telemetry monitor. It does not possess, intercept, or log passwords, keystrokes, DNS history, visited web pages, or email contents.
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <h2 className="font-nunito text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="text-orange-600 font-mono text-base">3.</span>
                <span>Local Storage and Data Retention</span>
              </h2>
              <p>
                All historical data usage metrics are saved locally on your physical machine inside the local application data directory (SQLite database). You have total control over this data:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                <li>You can reset or wipe daily data usage logs at any time from within the app settings.</li>
                <li>Uninstalling the NetSentry application removes all stored local databases and configuration files.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <h2 className="font-nunito text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="text-orange-600 font-mono text-base">4.</span>
                <span>Voluntary Contributions & Payments</span>
              </h2>
              <p>
                NetSentry is free software. If you choose to voluntarily support development via our &ldquo;Buy Us a Coffee&rdquo; feature, payment transactions are processed directly by <strong>Paystack</strong> (a PCI-DSS Level 1 certified payment gateway). 
              </p>
              <p className="text-slate-600">
                We never receive, store, or process your credit/debit card numbers or bank credentials on our servers. All transaction billing information is handled securely under Paystack&apos;s independent Privacy Policy.
              </p>
            </section>

            {/* Section 5 */}
            <section className="space-y-3">
              <h2 className="font-nunito text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="text-orange-600 font-mono text-base">5.</span>
                <span>Windows Firewall Operations</span>
              </h2>
              <p>
                When you activate <em>Focus Mode</em> or pause high-bandwidth background applications, NetSentry executes local Windows Firewall rules using the native Windows <code>netsh advfirewall</code> subsystem. These rules apply exclusively on your local PC and are never broadcast externally.
              </p>
            </section>

            {/* Section 6 */}
            <section className="space-y-3">
              <h2 className="font-nunito text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="text-orange-600 font-mono text-base">6.</span>
                <span>Children&apos;s Privacy</span>
              </h2>
              <p>
                NetSentry does not knowingly collect or solicit personal information from children under the age of 13. Because our software does not collect personal data from any user, it is compliant with the Children&apos;s Online Privacy Protection Act (COPPA) and GDPR.
              </p>
            </section>

            {/* Section 7 */}
            <section className="space-y-3">
              <h2 className="font-nunito text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="text-orange-600 font-mono text-base">7.</span>
                <span>Contact Us</span>
              </h2>
              <p>
                If you have any questions, suggestions, or concerns regarding this Privacy Policy or NetSentry&apos;s data practices, please reach out to us:
              </p>
              <div className="grid sm:grid-cols-2 gap-4 pt-4">
                <a 
                  href="mailto:belloimam431@gmail.com" 
                  className="p-4 rounded-2xl border transition-all flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-md group"
                  style={{ background: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.8)' }}
                >
                  <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-600 group-hover:scale-110 transition-transform">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 font-nunito">Email Support</div>
                    <div className="text-xs text-slate-600 font-medium">belloimam431@gmail.com</div>
                  </div>
                </a>

                <a 
                  href="https://netsentry-psi.vercel.app/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-4 rounded-2xl border transition-all flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-md group"
                  style={{ background: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.8)' }}
                >
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 group-hover:scale-110 transition-transform">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 font-nunito">Official Website</div>
                    <div className="text-xs text-slate-600 font-medium">netsentry-psi.vercel.app</div>
                  </div>
                </a>
              </div>
            </section>
          </div>

          {/* Footer */}
          <footer className="mt-16 pt-8 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4 border-t font-medium" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
            <div>
              &copy; {new Date().getFullYear()} NetSentry by Bimex. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <Link href="/" className="hover:text-black transition-colors">Home</Link>
              <Link href="/dashboard" className="hover:text-black transition-colors">App Dashboard</Link>
              <span className="text-slate-800 font-bold">Privacy Policy</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

