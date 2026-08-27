'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowLeft, TriangleAlert } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen selection:bg-slate-900 selection:text-white bg-[#FFFBF9] relative overflow-hidden flex flex-col items-center justify-center">
      <main className="relative z-10 px-6 py-20 text-center space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white mb-6 shadow-sm">
            <TriangleAlert className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold tracking-tight text-slate-950 uppercase">Page Not Found</span>
          </div>
          
          <h1 className="text-[12rem] md:text-[18rem] font-black leading-none tracking-tighter text-slate-950/5 select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 font-bricolage">
            404
          </h1>
          
          <h2 className="font-bricolage text-4xl md:text-6xl font-black tracking-tight leading-[0.95] text-slate-950 mb-6">
            This page <span className="text-slate-500">doesn&apos;t exist.</span>
          </h2>
          
          <p className="text-lg md:text-xl text-slate-650 max-w-lg mx-auto font-medium leading-relaxed font-sans">
            It looks like you found a missing link. The page you&apos;re looking for might have been moved or deleted.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button 
            variant="outline" 
            size="lg" 
            className="h-14 px-10 rounded-2xl border-slate-200 bg-white text-slate-950 hover:bg-slate-50 hover:text-slate-950 transition-all font-bold group cursor-pointer"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="mr-2 h-5 w-5 transition-transform group-hover:-translate-x-1" />
            Go Back
          </Button>
          <Link href="/">
            <Button 
              size="lg" 
              className="h-14 px-10 rounded-2xl bg-primary text-white hover:bg-primary/95 transition-all font-bold cursor-pointer"
            >
              Go Home
            </Button>
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
