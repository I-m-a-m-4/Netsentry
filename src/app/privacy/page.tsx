import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Lock, EyeOff, Database, ArrowLeft, Heart, CheckCircle2, Mail, Globe } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy - NetSentry',
  description: 'Privacy Policy for NetSentry Windows Application and Website. Learn how we respect and protect your data.',
};

export default function PrivacyPolicyPage() {
  const lastUpdated = 'September 10, 2026';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-primary selection:text-white">
      {/* Background Subtle Gradient */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />

      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-850">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to NetSentry</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-black text-xs">
              NS
            </div>
            <span className="font-bold tracking-tight text-sm">NetSentry</span>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
            <Shield className="w-3.5 h-3.5" />
            <span>Local-First & Zero-Tracking Privacy</span>
          </div>
          <h1 className="font-bricolage text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm sm:text-base text-slate-400">
            NetSentry is designed from the ground up to respect your digital privacy. We believe your network data belongs solely to you.
          </p>
          <div className="text-xs text-slate-500 mt-3 font-mono">
            Effective & Last Updated: {lastUpdated}
          </div>
        </div>

        {/* Quick Highlights Banner */}
        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex flex-col gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary w-fit">
              <EyeOff className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-200">Zero Traffic Inspection</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We never inspect packet payloads, website URLs, browser history, or confidential network contents.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex flex-col gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 w-fit">
              <Database className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-200">100% Local Storage</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your network usage counters and firewall rules are stored strictly on your local PC in an encrypted SQLite database.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex flex-col gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 w-fit">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-200">No Data Selling</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We do not sell, rent, monetize, or broker personal information to advertisers or external corporations.
            </p>
          </div>
        </div>

        {/* Privacy Policy Detailed Content */}
        <div className="space-y-10 text-slate-300 text-sm leading-relaxed border-t border-slate-800/80 pt-10">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="font-bricolage text-xl font-bold text-white flex items-center gap-2">
              <span className="text-primary font-mono text-base">1.</span>
              <span>Overview & Developer Identity</span>
            </h2>
            <p>
              This Privacy Policy applies to the <strong>NetSentry</strong> desktop application (distributed via Microsoft Store and direct installer) and the official website hosted at <a href="https://netsentry-psi.vercel.app/" className="text-primary underline hover:text-primary/80">https://netsentry-psi.vercel.app/</a>. NetSentry is developed and published by <strong>Bimex</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;).
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="font-bricolage text-xl font-bold text-white flex items-center gap-2">
              <span className="text-primary font-mono text-base">2.</span>
              <span>Information Processed by the Application</span>
            </h2>
            <p>
              To provide live bandwidth monitoring, app data usage graphs, and data saver protection, NetSentry queries standard Windows system APIs (such as the Windows Networking and IP Helper APIs) for:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
              <li><strong>Process Names:</strong> Local system process executables (e.g., <code>chrome.exe</code>, <code>msedge.exe</code>) to compute per-application byte counts.</li>
              <li><strong>Bandwidth Transfer Counters:</strong> Cumulative numeric bytes transmitted and received during active sessions.</li>
              <li><strong>Network Metered Status:</strong> Windows network state to advise you when connecting to metered cellular hotspots.</li>
            </ul>
            <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <strong>Strict Privacy Guarantee:</strong> NetSentry operates as an administrative telemetry monitor. It does not possess, intercept, or log passwords, keystrokes, DNS history, visited web pages, or email contents.
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="font-bricolage text-xl font-bold text-white flex items-center gap-2">
              <span className="text-primary font-mono text-base">3.</span>
              <span>Local Storage and Data Retention</span>
            </h2>
            <p>
              All historical data usage metrics are saved locally on your physical machine inside the local application data directory (SQLite database). You have total control over this data:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
              <li>You can reset or wipe daily data usage logs at any time from within the app settings.</li>
              <li>Uninstalling the NetSentry application removes all stored local databases and configuration files.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="font-bricolage text-xl font-bold text-white flex items-center gap-2">
              <span className="text-primary font-mono text-base">4.</span>
              <span>Voluntary Contributions & Payments</span>
            </h2>
            <p>
              NetSentry is free software. If you choose to voluntarily support development via our &ldquo;Buy Us a Coffee&rdquo; feature, payment transactions are processed directly by <strong>Paystack</strong> (a PCI-DSS Level 1 certified payment gateway). 
            </p>
            <p className="text-slate-400">
              We never receive, store, or process your credit/debit card numbers or bank credentials on our servers. All transaction billing information is handled securely under Paystack&apos;s independent Privacy Policy.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="font-bricolage text-xl font-bold text-white flex items-center gap-2">
              <span className="text-primary font-mono text-base">5.</span>
              <span>Windows Firewall Operations</span>
            </h2>
            <p>
              When you activate <em>Focus Mode</em> or pause high-bandwidth background applications, NetSentry executes local Windows Firewall rules using the native Windows <code>netsh advfirewall</code> subsystem. These rules apply exclusively on your local PC and are never broadcast externally.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="font-bricolage text-xl font-bold text-white flex items-center gap-2">
              <span className="text-primary font-mono text-base">6.</span>
              <span>Children&apos;s Privacy</span>
            </h2>
            <p>
              NetSentry does not knowingly collect or solicit personal information from children under the age of 13. Because our software does not collect personal data from any user, it is compliant with the Children&apos;s Online Privacy Protection Act (COPPA) and GDPR.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="font-bricolage text-xl font-bold text-white flex items-center gap-2">
              <span className="text-primary font-mono text-base">7.</span>
              <span>Contact Us</span>
            </h2>
            <p>
              If you have any questions, suggestions, or concerns regarding this Privacy Policy or NetSentry&apos;s data practices, please reach out to us:
            </p>
            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              <a 
                href="mailto:belloimam431@gmail.com" 
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors flex items-center gap-3"
              >
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Email Support</div>
                  <div className="text-xs text-slate-400">belloimam431@gmail.com</div>
                </div>
              </a>

              <a 
                href="https://netsentry-psi.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors flex items-center gap-3"
              >
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Official Website</div>
                  <div className="text-xs text-slate-400">netsentry-psi.vercel.app</div>
                </div>
              </a>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-slate-850 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            &copy; {new Date().getFullYear()} NetSentry by Bimex. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-slate-300 transition-colors">Home</Link>
            <Link href="/dashboard" className="hover:text-slate-300 transition-colors">App Dashboard</Link>
            <span className="text-slate-400 font-semibold">Privacy Policy</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
