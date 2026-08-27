'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Award, Laptop, School, Globe, Plane, Search, ArrowRight, Zap, Target, Star, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { InteractiveGrid } from '@/components/interactive-grid';
import MarketingHeader from '@/components/layout/marketing-header';
import MarketingFooter from '@/components/layout/marketing-footer';
import { ThemeProvider } from '@/components/theme-provider';

export default function ServicesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const services = [
    {
      title: "JAMB & UTME Preparations",
      description: "Score 300+ in your computer-based JAMB exams with intensive coaching and timed CBT simulators.",
      icon: <BookOpen className="w-6 h-6 text-primary" />,
      href: "/signup"
    },
    {
      title: "WAEC & NECO Secondary Exams",
      description: "Achieve straight A1s in your senior secondary certificate examinations with syllabus-focused tutorials.",
      icon: <Award className="w-6 h-6 text-primary" />,
      href: "/signup"
    },
    {
      title: "Online Interactive Classes",
      description: "Learn from anywhere with robust interactive online classrooms, study briefs, and virtual tutor support.",
      icon: <Laptop className="w-6 h-6 text-primary" />,
      href: "/signup"
    },
    {
      title: "Physical Tutorial Centers",
      description: "Study in structured, fully equipped facilities in Lagos and Osun State with expert face-to-face mentorship.",
      icon: <School className="w-6 h-6 text-primary" />,
      href: "/signup"
    },
    {
      title: "Admission Consultation",
      description: "Secure your entry into top Nigerian universities and foreign colleges (USA, UK, Canada, Europe) seamlessly.",
      icon: <Globe className="w-6 h-6 text-primary" />,
      href: "/signup"
    },
    {
      title: "International Test Prep",
      description: "Open global doors with competitive test preps for SAT, IELTS, TOEFL, GRE, and GMAT.",
      icon: <Plane className="w-6 h-6 text-primary" />,
      href: "/signup"
    }
  ];

  const coreCapabilities = [
    "Proven Hybrid Classroom Coaching Model",
    "Curated Past Questions & Syllabus Library",
    "Weekly Timed CBT Mock Simulator Runs",
    "Comprehensive Admission & Visa Processing",
    "1-on-1 Private Tutorials & Academic Counselors"
  ];

  const filteredServices = services.filter(service => 
    service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ThemeProvider forcedTheme="light">
      <div className="bg-[#fcfcfc] text-neutral-900 selection:bg-primary/20 min-h-screen overflow-x-hidden relative font-jakarta">
        {/* Grid and Aura background matching About page */}
        <div className="fixed grid-lines w-full h-full top-0 right-0 left-0 pointer-events-none z-0 opacity-[0.15]"></div>
        
        <div className="absolute top-0 left-0 w-full h-[800px] overflow-hidden pointer-events-none z-0">
          <InteractiveGrid />
          <div className="aura-background"></div>
        </div>

        <MarketingHeader />
        
        <div className="z-10 pt-24 relative">
          {/* Hero Section */}
          <section className="md:pl-6 md:pr-6 md:pt-20 text-center max-w-5xl mt-20 mr-auto mb-12 ml-auto pt-20 pr-6 pl-6 bg-transparent relative">
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.15]">
              <motion.div 
                animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[15%] left-[15%]"
              >
                <Laptop className="w-16 h-16 text-slate-900" />
              </motion.div>
              <motion.div 
                animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute top-[25%] right-[15%]"
              >
                <Globe className="w-20 h-20 text-slate-900" />
              </motion.div>
              <motion.div 
                animate={{ y: [0, -15, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute bottom-[20%] left-[10%]"
              >
                <Plane className="w-12 h-12 text-slate-900" />
              </motion.div>
              <motion.div 
                animate={{ y: [0, 25, 0], rotate: [0, 15, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                className="absolute bottom-[15%] right-[10%]"
              >
                <School className="w-24 h-24 text-slate-900" />
              </motion.div>
            </div>

            <div className="inline-flex gap-2 text-xs text-neutral-600 bg-neutral-100 border-neutral-200 border rounded-full mr-auto ml-auto pt-1.5 pr-3 pb-1.5 pl-3 items-center backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
              <span className="text-neutral-900 font-semibold font-geist">Our Services</span>
              <span className="mx-1 h-1 w-1 rounded-full bg-neutral-300"></span>
              <span className="text-neutral-500 font-geist">What Pinnacle Academia Offers</span>
            </div>

            <h1 className="md:text-7xl lg:text-8xl text-5xl font-medium tracking-tighter mt-6 pt-2 pb-2 leading-tight">
              Services Tailored for Excellence
            </h1>
            <p className="mt-5 text-base md:text-lg text-neutral-600 max-w-3xl mx-auto leading-relaxed">
              From senior secondary certificates to foreign university admissions, discover our academic pathways.
            </p>
          </section>

          {/* Search Bar Section */}
          <section className="py-12 px-6 relative z-10">
            <div className="max-w-2xl mx-auto -mt-10">
              <div className="relative bg-white border border-neutral-200 rounded-3xl shadow-xl p-2 flex items-center focus-within:ring-2 focus-within:ring-primary/20 transition-all backdrop-blur-sm">
                <Search className="w-5 h-5 mx-3 text-neutral-400" />
                <input 
                  type="text" 
                  placeholder="Search for your academic goal..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-base py-3 text-slate-900 placeholder:text-neutral-400"
                />
                <button className="bg-[#1e293b] text-white px-6 py-3 rounded-full font-medium hover:bg-[#0f172a] transition-colors hidden sm:block">
                  Search
                </button>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-sm text-neutral-500">
                <span>Popular:</span>
                <button onClick={() => setSearchTerm('JAMB')} className="hover:text-primary transition-colors font-medium">JAMB</button>
                <span>•</span>
                <button onClick={() => setSearchTerm('WAEC')} className="hover:text-primary transition-colors font-medium">WAEC</button>
                <span>•</span>
                <button onClick={() => setSearchTerm('Admission')} className="hover:text-primary transition-colors font-medium">Admissions</button>
                <span>•</span>
                <button onClick={() => setSearchTerm('')} className="hover:text-primary transition-colors font-medium">Reset</button>
              </div>
            </div>
          </section>

          {/* Main Content Section */}
          <section className="py-16 md:py-24 px-6 relative z-10">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-4 block">Pathways</span>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">Explore Academic Pathways</h2>
                <p className="text-xl text-slate-600 mt-4 leading-relaxed max-w-2xl mx-auto">
                  See exactly how our custom study plans, online CBT drills, and experienced instructors prepare you for victory.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredServices.map((service, index) => (
                  <Link 
                    key={index} 
                    href={service.href}
                    className="group block bg-white border border-slate-200 rounded-3xl p-8 shadow-md hover:shadow-xl transition-all hover:border-primary/30"
                  >
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      {service.icon}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-primary transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-6">
                      {service.description}
                    </p>
                    <div className="flex items-center text-primary text-sm font-semibold gap-1">
                      Get Started <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>

              {/* Core Capabilities */}
              <div className="mt-24 bg-[#F9F8F6] border border-slate-200 rounded-3xl p-8 md:p-12">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div>
                    <span className="text-xs uppercase tracking-[0.22em] text-primary font-bold mb-3 block">Strengths</span>
                    <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-4">Core Capabilities</h2>
                    <p className="text-slate-600 text-base leading-relaxed mb-6 font-medium">
                      No matter your level, Pinnacle Academia provides the essential educational support to help you secure admission into your dream university.
                    </p>
                    <Link href="/about" className="border border-slate-200 inline-flex items-center gap-2 hover:bg-neutral-100 transition-colors text-sm font-medium text-neutral-900 bg-white rounded-full pt-3.5 pr-6 pb-3.5 pl-6 shadow-sm">
                      Read Our Story
                    </Link>
                  </div>
                  
                  <div className="space-y-4">
                    {coreCapabilities.map((capability, index) => (
                      <div 
                        key={index} 
                        className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 transition-all group shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                          <span className="font-semibold text-slate-900 text-sm">{capability}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* CTA Section */}
              <section className="mx-auto max-w-4xl px-6 mt-24 relative mb-24 text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-xs text-neutral-600 mb-8 backdrop-blur-sm animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-primary"></span>
                  <span>Join 5,000+ Accomplished Students</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-medium tracking-tighter text-neutral-900 mb-8">Ready to accelerate your learning?</h2>
                <p className="text-neutral-600 text-lg md:text-xl mb-12 max-w-2xl mx-auto font-geist">
                  Join thousands of accomplished learners utilizing Pinnacle Academia to secure admission and master competitive exams.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                  <Link href="/signup" className="hover:bg-[#0f172a] transition-colors text-base font-semibold text-white tracking-tight font-dm-sans bg-[#1e293b] rounded-full py-4 px-10 shadow-md">
                     Register For Free
                  </Link>
                  <Link href="mailto:pinnacleacademia254@gmail.com" className="text-sm font-semibold text-neutral-600 hover:text-primary transition-colors flex items-center gap-2">
                    Get in touch &rarr;
                  </Link>
                </div>
              </section>
            </div>
          </section>
        </div>

        <MarketingFooter />
      </div>
    </ThemeProvider>
  );
}
