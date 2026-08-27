'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, GraduationCap, Trophy, Award, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { InteractiveGrid } from '@/components/interactive-grid';
import MarketingHeader from '@/components/layout/marketing-header';
import MarketingFooter from '@/components/layout/marketing-footer';
import Image from 'next/image';

export default function AboutPage() {
  const railRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [mounted, setMounted] = useState(false);

  const checkScroll = () => {
    if (railRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = railRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    setMounted(true);
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scroll = (direction: number) => {
    if (railRef.current) {
      railRef.current.scrollBy({ left: direction * 540, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-[#fcfcfc] text-neutral-900 selection:bg-primary/20 min-h-screen overflow-x-hidden relative font-jakarta">
      <div className="fixed grid-lines w-full h-full top-0 right-0 left-0 pointer-events-none z-0 opacity-[0.15]"></div>
      
      <div className="absolute top-0 left-0 w-full h-[800px] overflow-hidden pointer-events-none z-0">
        <InteractiveGrid />
        <div className="aura-background"></div>
      </div>

      <div className="z-10 pt-24 relative">
        {/* Hero */}
        <section className="md:pl-6 md:pr-6 md:pt-20 text-center max-w-5xl mt-20 mr-auto mb-20 ml-auto pt-20 pr-6 pl-6 bg-transparent">
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.15]">
            <motion.div 
              animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[15%] left-[15%]"
            >
              <BookOpen className="w-16 h-16 text-slate-900" />
            </motion.div>
            <motion.div 
              animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute top-[25%] right-[15%]"
            >
              <GraduationCap className="w-20 h-20 text-slate-900" />
            </motion.div>
            <motion.div 
              animate={{ y: [0, -15, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute bottom-[20%] left-[10%]"
            >
              <Trophy className="w-12 h-12 text-slate-900" />
            </motion.div>
            <motion.div 
              animate={{ y: [0, 25, 0], rotate: [0, 15, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
              className="absolute bottom-[15%] right-[10%]"
            >
              <Award className="w-24 h-24 text-slate-900" />
            </motion.div>
          </div>
          
          <div className="inline-flex gap-2 text-xs text-neutral-600 bg-neutral-100 border-neutral-200 border rounded-full mr-auto ml-auto pt-1.5 pr-3 pb-1.5 pl-3 items-center backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
            <span className="text-neutral-900 font-semibold font-geist">College of Excellence</span>
            <span className="mx-1 h-1 w-1 rounded-full bg-neutral-300"></span>
            <span className="text-neutral-500 font-geist">Igniting Minds, Achieving Excellence</span>
          </div>

          <h1 className="md:text-7xl lg:text-8xl text-5xl font-medium tracking-tighter mt-6 pt-2 pb-2 leading-tight">
            About Pinnacle Academia
          </h1>
          <p className="mt-5 text-base md:text-lg text-neutral-600 max-w-3xl mx-auto leading-relaxed">
            Welcome to Pinnacle Academia, a dedicated, innovative, and supportive educational community. Founded on the belief that every student has the potential to excel, we offer personalized, innovative, and comprehensive educational support that caters to diverse academic needs.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-8 items-center justify-center">
            <Link href="/signup" className="hover:bg-[#0f172a] transition-colors text-sm font-semibold text-white tracking-tight font-dm-sans bg-[#1e293b] rounded-full py-3.5 px-8 shadow-md">
              Join the Academy
            </Link>
            <Link href="/our-services" className="border border-neutral-200 inline-flex items-center gap-2 hover:bg-neutral-100 transition-colors text-sm font-medium text-neutral-900 bg-neutral-50 rounded-full pt-3.5 pr-6 pb-3.5 pl-6 backdrop-blur-sm">
              Our Services
            </Link>
          </div>
        </section>

        {/* Logo Cloud - Exam Pathways */}
        <section className="md:mt-32 max-w-7xl mt-24 mr-auto ml-auto pt-16 pr-6 pb-6 pl-6 relative">
          <div className="text-center">
            <p className="uppercase text-sm font-medium text-neutral-400 tracking-wide">
              Empowering students across top pathways
            </p>
          </div>
          <div className="overflow-hidden mt-10 relative">
            <div 
              style={{ 
                maskImage: 'linear-gradient(to right, transparent, white 15%, white 85%, transparent)', 
                WebkitMaskImage: 'linear-gradient(to right, transparent, white 15%, white 85%, transparent)' 
              }}
            >
              <div className="flex gap-6 will-change-transform animate-marquee-left opacity-30">
                <div className="flex gap-12 shrink-0 items-center">
                   <span className="text-2xl font-bold text-neutral-400">JAMB & UTME</span>
                   <span className="text-2xl font-bold text-neutral-400">WAEC & NECO</span>
                   <span className="text-2xl font-bold text-neutral-400">SAT & IELTS</span>
                   <span className="text-2xl font-bold text-neutral-400">JUPEB & IJMB</span>
                   <span className="text-2xl font-bold text-neutral-400">UNIVERSITY ADMISSIONS</span>
                </div>
                <div className="flex gap-12 shrink-0 items-center">
                   <span className="text-2xl font-bold text-neutral-400">JAMB & UTME</span>
                   <span className="text-2xl font-bold text-neutral-400">WAEC & NECO</span>
                   <span className="text-2xl font-bold text-neutral-400">SAT & IELTS</span>
                   <span className="text-2xl font-bold text-neutral-400">JUPEB & IJMB</span>
                   <span className="text-2xl font-bold text-neutral-400">UNIVERSITY ADMISSIONS</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Methodology */}
        <section className="sm:px-6 sm:mt-24 md:mt-32 max-w-7xl mt-16 mr-auto ml-auto pr-4 pl-4 relative">
          <div className="max-w-7xl mr-auto ml-auto">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              {/* Image Frame */}
              <div className="relative rounded-[36px] overflow-hidden aspect-square border border-slate-200 shadow-xl bg-slate-50">
                <Image
                  src="/pinnacle academia gate.jpeg"
                  alt="Pinnacle Academia Physical Center Gate"
                  fill
                  className="object-cover"
                />
              </div>

              {/* Copy & Methodology */}
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="sm:text-5xl text-4xl font-medium text-slate-900 tracking-tight">Our Academic Approach</h3>
                  <p className="mt-6 text-lg text-slate-600 font-normal">
                    Education isn't just about reading textbooks; it is about building understanding, developing target review strategies, and cultivating exam confidence.
                  </p>
                </div>

                <div className="border-t border-slate-200 pt-8 mt-4">
                  <div className="grid gap-8">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mt-1">
                        <Award className="text-primary w-5 h-5" />
                      </div>
                      <div>
                         <h4 className="text-lg font-semibold text-slate-900">Academic Excellence</h4>
                         <p className="text-sm text-slate-500 mt-1">Through personalized tutorials, innovative teaching methods, and a supportive environment, we equip students to achieve outstanding results.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mt-1">
                        <GraduationCap className="text-primary w-5 h-5" />
                      </div>
                      <div>
                         <h4 className="text-lg font-semibold text-slate-900">Inspiring the Next Generation</h4>
                         <p className="text-sm text-slate-500 mt-1">At Pinnacle Academia, we go beyond tutoring to build resilience, character, and self-belief, shaping learners into future leaders.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-8 mt-4 grid grid-cols-2 md:grid-cols-3 gap-6">
                   <div>
                      <p className="text-3xl font-bold text-slate-900">100%</p>
                      <p className="text-xs text-neutral-400 uppercase tracking-widest">Success Target</p>
                   </div>
                   <div>
                      <p className="text-3xl font-bold text-slate-900">5,000+</p>
                      <p className="text-xs text-neutral-400 uppercase tracking-widest">Students Mentored</p>
                   </div>
                   <div className="hidden md:block">
                      <p className="text-3xl font-bold text-slate-900">25+</p>
                      <p className="text-xs text-neutral-400 uppercase tracking-widest">Expert Educators</p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="mb-32 relative max-w-7xl mx-auto px-6 mt-32">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
            <div className="max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-4 block">Social Proof</span>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">Voices of Success</h2>
              <p className="text-xl text-slate-600 mt-4 leading-relaxed">
                Real feedback from students who transformed their scores with Pinnacle Academia.
              </p>
            </div>
            <Link href="/blog" className="group flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-slate-900 border-b-2 border-primary/20 hover:border-primary transition-all pb-1">
              Read latest news
            </Link>
          </div>
          
          <div className="relative h-[400px]">
              <div 
                className="overflow-hidden h-full rounded-2xl relative" 
                style={{ 
                  maskImage: 'linear-gradient(90deg, transparent, white 10%, white 90%, transparent)', 
                  WebkitMaskImage: 'linear-gradient(90deg, transparent, white 10%, white 90%, transparent)' 
                }}
              >
                <div 
                  className="flex gap-6 overflow-x-auto scroll-smooth px-10 absolute inset-0 items-center hide-scrollbar" 
                  ref={railRef}
                  onScroll={checkScroll}
                >
                   <div className="flex-shrink-0 w-[300px] h-[350px] relative rounded-3xl overflow-hidden border border-neutral-200 shadow-xl bg-white group hover:scale-[1.02] transition-transform duration-300">
                     <Image 
                       src="/a pinnacle std testimonial.jpeg" 
                       alt="Pinnacle Student Testimonial" 
                       fill 
                       className="object-contain p-4"
                     />
                   </div>

                   <div className="flex-shrink-0 w-[300px] h-[350px] relative rounded-3xl overflow-hidden border border-neutral-200 shadow-xl bg-white group hover:scale-[1.02] transition-transform duration-300">
                     <Image 
                       src="/another testimonail form pinnacle academia student.jpeg" 
                       alt="Student Success Testimonial" 
                       fill 
                       className="object-contain p-4"
                     />
                   </div>

                   <div className="flex-shrink-0 w-[300px] h-[350px] relative rounded-3xl overflow-hidden border border-neutral-200 shadow-xl bg-white group hover:scale-[1.02] transition-transform duration-300">
                     <Image 
                       src="/another testimonali].jpeg" 
                       alt="WhatsApp Feedback Testimonial" 
                       fill 
                       className="object-contain p-4"
                     />
                   </div>

                   <div className="flex-shrink-0 w-[300px] h-[350px] relative rounded-3xl overflow-hidden border border-neutral-200 shadow-xl bg-white group hover:scale-[1.02] transition-transform duration-300">
                     <Image 
                       src="/pinnacle student testimonials.jpeg" 
                       alt="Pinnacle Students Feedback" 
                       fill 
                       className="object-contain p-4"
                     />
                   </div>

                   <div className="flex-shrink-0 w-[300px] h-[350px] relative rounded-3xl overflow-hidden border border-neutral-200 shadow-xl bg-white group hover:scale-[1.02] transition-transform duration-300">
                     <Image 
                       src="/result testimonials.jpeg" 
                       alt="Exam Result Proof" 
                       fill 
                       className="object-contain p-4"
                     />
                   </div>

                   <div className="flex-shrink-0 w-[300px] h-[350px] relative rounded-3xl overflow-hidden border border-neutral-200 shadow-xl bg-white group hover:scale-[1.02] transition-transform duration-300">
                     <Image 
                       src="/WhatsApp Image 2026-07-04 at 12.00.46 PM.jpeg" 
                       alt="Pinnacle Academic Score Testimonial" 
                       fill 
                       className="object-contain p-4"
                     />
                   </div>

                   <div className="flex-shrink-0 w-[300px] h-[350px] relative rounded-3xl overflow-hidden border border-neutral-200 shadow-xl bg-white group hover:scale-[1.02] transition-transform duration-300">
                     <Image 
                       src="/WhatsApp Image 2026-07-04 at 12.00.48 PM.jpeg" 
                       alt="Pinnacle Student Review" 
                       fill 
                       className="object-contain p-4"
                     />
                   </div>
                </div>

                <div className="absolute bottom-6 right-10 flex items-center gap-4">
                  <button 
                    className="hover:bg-neutral-200 transition-all inline-flex text-neutral-900 bg-neutral-100 w-12 h-12 border-neutral-200 border rounded-full items-center justify-center"
                    onClick={() => scroll(-1)}
                    disabled={!canScrollLeft}
                    style={{ opacity: canScrollLeft ? 1 : 0.3 }}
                  >
                    &larr;
                  </button>
                  <button 
                    className="w-12 h-12 rounded-full text-white bg-black hover:bg-neutral-800 transition-all inline-flex items-center justify-center shadow-lg"
                    onClick={() => scroll(1)}
                    disabled={!canScrollRight}
                    style={{ opacity: canScrollRight ? 1 : 0.3 }}
                  >
                    &rarr;
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Founder Section */}
          <section className="py-24 px-6 bg-[#F9F8F6] border-t border-slate-100 relative mb-20 rounded-3xl max-w-7xl mx-auto">
            <div className="max-w-4xl mx-auto text-center">
              <span className="text-xs uppercase tracking-[0.22em] text-primary font-bold mb-3 block">Founder & Leadership</span>
              <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-12">Driven by Purpose</h2>
              
              <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 shadow-sm max-w-2xl mx-auto flex flex-col md:flex-row items-center gap-8 text-left">
                <div className="relative h-40 w-40 rounded-full overflow-hidden shrink-0 border-2 border-orange-100 shadow-inner">
                  <Image
                    src="/assets/founder.jpg"
                    alt="Founder Akinola Ibrahim"
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Akinola Ibrahim</h3>
                  <p className="text-primary font-bold text-xs uppercase tracking-widest mb-4">Founder, Pinnacle Academia</p>
                  <p className="text-slate-600 text-sm leading-relaxed font-medium">
                    "We established Pinnacle Academia with a clear purpose: to bridge the gap between classroom instruction and exam requirements. By matching talented instructors with structured study outlines and timed drills, we make top results attainable for every single student."
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Key Values */}
          <section className="py-24 px-6 bg-white border-t border-slate-100 relative max-w-7xl mx-auto">
            <div className="max-w-5xl mx-auto">
              <div className="text-center max-w-2xl mx-auto mb-16">
                <span className="text-xs uppercase tracking-[0.22em] text-primary font-bold mb-3 block">Our Core Pillars</span>
                <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">Key Institutional Values</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 rounded-2xl border border-slate-200 bg-[#F9F8F6]/50">
                  <h4 className="text-xl font-bold text-slate-900 mb-3">Excellence</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">We commit to top-tier teaching, ensuring every student has the tools and support to achieve exceptional exam scores.</p>
                </div>
                <div className="p-8 rounded-2xl border border-slate-200 bg-[#F9F8F6]/50">
                  <h4 className="text-xl font-bold text-slate-900 mb-3">Innovation</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">From hybrid virtual class access to computer-based testing simulators, we deploy the best educational tools.</p>
                </div>
                <div className="p-8 rounded-2xl border border-slate-200 bg-[#F9F8F6]/50">
                  <h4 className="text-xl font-bold text-slate-900 mb-3">Supportive Community</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">We foster collaborative student-teacher relationships where learners feel supported and motivated daily.</p>
                </div>
                <div className="p-8 rounded-2xl border border-slate-200 bg-[#F9F8F6]/50">
                  <h4 className="text-xl font-bold text-slate-900 mb-3">Global Citizenship</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">Preparing students to navigate local universities or transition smoothly into international college life abroad.</p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="mx-auto max-w-4xl px-6 mt-20 relative mb-40 text-center">
             <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-xs text-neutral-600 mb-8 backdrop-blur-sm animate-pulse">
               <span className="h-2 w-2 rounded-full bg-primary"></span>
               <span>Join 5,000+ Accomplished Students</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-medium tracking-tighter text-neutral-900 mb-8">Ready to achieve academic excellence?</h2>
              <p className="text-neutral-600 text-lg md:text-xl mb-12 max-w-2xl mx-auto font-geist">
                Take the guesswork out of exam preparation. Learn with the best tutors and step into university with confidence.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                <Link href="/signup" className="hover:bg-primary/90 transition-colors text-base font-semibold text-white tracking-tight font-dm-sans bg-primary rounded-full py-4 px-10 shadow-md">
                   Register Now
                </Link>
                <a href="#contact" className="text-sm font-semibold text-neutral-600 hover:text-primary transition-colors flex items-center gap-2">
                  Get in touch &rarr;
                </a>
              </div>
           </section>
      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
