'use client';

import React, { useState } from 'react';
import { Check, Zap, BookOpen, GraduationCap, Award, Calendar, HelpCircle } from "lucide-react";
import { motion } from 'framer-motion';
import MarketingHeader from "@/components/layout/marketing-header";
import MarketingFooter from "@/components/layout/marketing-footer";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from 'next/link';
import { InteractiveGrid } from '@/components/interactive-grid';

const faqItems = [
    {
      question: "Can I use Pinnacle Academia for free?",
      answer: "Yes! Our Starter plan is 100% free forever. It includes access to basic syllabus tracking, one active mock CBT test simulation, and easy-mode bot challenges."
    },
    {
      question: "What is included in the Pro Plan?",
      answer: "The Pro Plan gives you unlimited access to full CBT mock exam simulations for OAU, UI, and UNILAG, complete study tracking for 5+ subjects, all text novels summaries/quizzes, offline speed battles, and AI-powered performance analysis."
    },
    {
      question: "What is the Elite Mentorship plan?",
      answer: "The Elite Plan includes all Pro features plus two 1-on-1 private peer mentorship sessions per month with top-scoring university students, a custom study plan built for your target course, and 24/7 access to the AI Study Coach."
    },
    {
      question: "How do mentorship sessions work?",
      answer: "Once booked on the platform, sessions are scheduled on our calendar. You will have a private 1-on-1 online consultation with an elite mentor who scored high in UTME for your chosen course."
    },
    {
      question: "Can I change my plan or cancel anytime?",
      answer: "Yes, you can cancel or change your plan at any time directly from your student settings panel."
    },
    {
      question: "Is there support for payment in USD?",
      answer: "Yes, we support both Naira payments and global USD card payments via our Paystack gateway integration."
    }
  ];

export default function PricingContent() {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [currency, setCurrency] = useState<'NGN' | 'USD'>('NGN');

    return (
        <div className="min-h-screen bg-white">
            <MarketingHeader />

            <main>
                {/* Hero / Pricing Header */}
                <section className="relative pt-32 pb-20 px-6 bg-transparent border-b border-slate-100 overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <InteractiveGrid />
                        <div className="aura-background"></div>
                    </div>
                    <div className="max-w-6xl mx-auto text-center relative z-10">
                        {/* Doodle Icons */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.1]">
                            <motion.div 
                                animate={{ y: [0, -25, 0], rotate: [0, 10, 0] }}
                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -top-10 left-[10%]"
                            >
                                <GraduationCap className="w-16 h-16 text-slate-400" />
                            </motion.div>
                            <motion.div 
                                animate={{ y: [0, 30, 0], rotate: [0, -15, 0] }}
                                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                className="absolute top-20 right-[5%]"
                            >
                                <BookOpen className="w-20 h-20 text-slate-400" />
                            </motion.div>
                            <motion.div 
                                animate={{ y: [0, -20, 0], scale: [1, 1.1, 1] }}
                                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                                className="absolute bottom-20 left-[5%]"
                            >
                                <Award className="w-14 h-14 text-slate-400" />
                            </motion.div>
                            <motion.div 
                                animate={{ y: [0, 35, 0], rotate: [0, 20, 0] }}
                                transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                                className="absolute -bottom-10 right-[10%]"
                            >
                                <Calendar className="w-24 h-24 text-slate-400" />
                            </motion.div>
                        </div>

                        <div className="inline-flex items-center gap-4 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 mb-8">
                            <div className="flex items-center gap-2">
                                <Zap className="w-3.5 h-3.5 text-primary" />
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Pricing Plans</span>
                            </div>
                            <div className="w-px h-3 bg-slate-300"></div>
                            <div className="flex items-center gap-2">
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Secure Payment via Paystack</span>
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-light text-slate-900 tracking-tight font-bricolage max-w-3xl mx-auto mb-6">
                            Choose the Perfect Plan for Your Studies
                        </h1>
                        <p className="text-lg text-slate-500 max-w-2xl mx-auto font-dm-sans tracking-tight mb-12">
                            Start for free, and unlock premium features as you prepare for your university admissions mock exams.
                        </p>

                        <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-4">
                            {/* Billing Cycle Toggle */}
                            <div className="inline-flex items-center p-1 bg-neutral-100/80 border-2 border-dashed border-neutral-200 rounded-xl">
                                <button
                                    onClick={() => setBillingCycle('monthly')}
                                    className={`px-8 py-2.5 text-sm font-semibold rounded-lg transition-all ${billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Monthly
                                </button>
                                <button
                                    onClick={() => setBillingCycle('yearly')}
                                    className={`px-8 py-2.5 text-sm font-semibold rounded-lg transition-all ${billingCycle === 'yearly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Yearly
                                </button>
                            </div>

                            {/* Currency Toggle */}
                            <div className="inline-flex items-center p-1 bg-neutral-100/80 border-2 border-dashed border-neutral-200 rounded-xl">
                                <button
                                    onClick={() => setCurrency('NGN')}
                                    className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all ${currency === 'NGN' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Naira (₦)
                                </button>
                                <button
                                    onClick={() => setCurrency('USD')}
                                    className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all ${currency === 'USD' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    USD ($)
                                </button>
                            </div>
                        </div>
                        {billingCycle === 'yearly' && (
                            <div className="text-sm text-emerald-600 font-bold animate-bounce h-6">2 Months Free! 🚀</div>
                        )}
                    </div>
                </section>

                {/* Pricing Section Grid */}
                <section className="py-24 px-6 bg-white">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Starter Plan */}
                            <div className="relative flex flex-col p-8 bg-white border-2 border-dashed border-slate-200 rounded-lg shadow-sm">
                                <h3 className="text-lg font-semibold leading-5 text-slate-900">Starter</h3>
                                <p className="mt-4 text-slate-500 text-sm">For students getting started with basic UTME exam preparations.</p>

                                <div className="mt-4">
                                    <span className="text-4xl font-bold tracking-tight text-slate-900">Free</span>
                                </div>
                                <ul className="mt-6 space-y-4 text-sm flex-1">
                                    <li className="flex items-center gap-3 text-slate-700"><Check className="h-5 w-5 text-primary" /> Access to limited syllabus tracking</li>
                                    <li className="flex items-center gap-3 text-slate-700"><Check className="h-5 w-5 text-primary" /> Take 1 Active Mock Test at a time</li>
                                    <li className="flex items-center gap-3 text-slate-700"><Check className="h-5 w-5 text-primary" /> Basic Performance Reports</li>
                                    <li className="flex items-center gap-3 text-slate-700"><Check className="h-5 w-5 text-primary" /> Standard Bot Challenge (Easy Mode)</li>
                                </ul>
                                <div className="mt-auto pt-8">
                                    <Button asChild size="lg" className="w-full">
                                        <Link href="/signup">Get Started for Free</Link>
                                    </Button>
                                </div>
                            </div>

                            {/* Pro Plan */}
                            <div className="relative flex flex-col p-8 bg-white border-2 border-dashed border-primary rounded-lg shadow-2xl shadow-primary/10">
                                <p className="absolute top-0 -translate-y-1/2 bg-primary text-white px-3 py-1 text-sm font-semibold tracking-wide rounded-full">Most Popular</p>
                                <h3 className="text-lg font-semibold leading-5 text-slate-900">Pro</h3>
                                <p className="mt-4 text-slate-500 text-sm">Comprehensive study features for top-scoring university candidates.</p>

                                <div className="mt-4">
                                    <span className="text-4xl font-bold tracking-tight text-slate-900">
                                        {currency === 'NGN' 
                                            ? (billingCycle === 'monthly' ? '₦1,500' : '₦15,000')
                                            : (billingCycle === 'monthly' ? '$1.50' : '$15.00')
                                        }
                                    </span>
                                    <span className="text-base font-medium text-slate-500">
                                        {billingCycle === 'monthly' ? '/mo' : '/year'}
                                    </span>
                                    {billingCycle === 'yearly' && (
                                        <div className="text-xs text-emerald-600 font-bold mt-1 block animate-pulse">
                                            Save {currency === 'NGN' ? '₦3,000!' : '$3.00!'}
                                        </div>
                                    )}
                                </div>
                                <ul className="mt-6 space-y-4 text-sm flex-1">
                                    <li className="flex items-center gap-3 text-slate-700"><Check className="h-5 w-5 text-primary" /> Full access to 5+ subjects syllabus</li>
                                    <li className="flex items-center gap-3 text-slate-700"><Check className="h-5 w-5 text-primary" /> Unlimited Mock CBT simulations</li>
                                    <li className="flex items-center gap-3 text-slate-700"><Check className="h-5 w-5 text-primary" /> Offline Speed Battles (All difficulties)</li>
                                    <li className="flex items-center gap-3 text-slate-700"><Check className="h-5 w-5 text-primary" /> Novel Chapter Summaries & Quizzes</li>
                                    <li className="flex items-center gap-3 text-slate-700"><Check className="h-5 w-5 text-primary" /> Smart AI Study Insights & reports</li>
                                    <li className="flex items-center gap-3 text-slate-700"><Check className="h-5 w-5 text-primary" /> Target Course Admission analysis</li>
                                </ul>
                                <div className="mt-auto pt-8">
                                    <Button asChild size="lg" className="w-full">
                                        <Link href="/signup">Start Pro Trial</Link>
                                    </Button>
                                </div>
                            </div>

                            {/* Elite Plan */}
                            <div className="relative flex flex-col p-8 bg-white border-2 border-dashed border-slate-200 rounded-lg shadow-sm">
                                <h3 className="text-lg font-semibold leading-5 text-slate-900">Elite</h3>
                                <p className="mt-4 text-slate-500 text-sm">Complete learning resources plus private university student mentoring.</p>

                                <div className="mt-4">
                                    <span className="text-4xl font-bold tracking-tight text-slate-900">
                                        {currency === 'NGN'
                                            ? (billingCycle === 'monthly' ? '₦5,000' : '₦50,000')
                                            : (billingCycle === 'monthly' ? '$5.00' : '$50.00')
                                        }
                                    </span>
                                    <span className="text-base font-medium text-slate-500">
                                        {billingCycle === 'monthly' ? '/mo' : '/year'}
                                    </span>
                                    {billingCycle === 'yearly' && (
                                        <div className="text-xs text-emerald-600 font-bold mt-1 block">
                                            Save {currency === 'NGN' ? '₦10,000!' : '$10.00!'}
                                        </div>
                                    )}
                                </div>
                                <ul className="mt-6 space-y-4 text-sm flex-1">
                                    <li className="flex items-center gap-3 text-slate-700"><Check className="h-5 w-5 text-primary" /> All features in Pro Plan</li>
                                    <li className="flex items-center gap-3 text-slate-700"><Check className="h-5 w-5 text-primary" /> 2 Private Peer Mentorship sessions / month</li>
                                    <li className="flex items-center gap-3 text-slate-700"><Check className="h-5 w-5 text-primary" /> Custom Study Planner creation</li>
                                    <li className="flex items-center gap-3 text-slate-700"><Check className="h-5 w-5 text-primary" /> AI Study Coach active 24/7</li>
                                    <li className="flex items-center gap-3 text-slate-700"><Check className="h-5 w-5 text-primary" /> Priority review of mock test queries</li>
                                </ul>
                                <div className="mt-auto pt-8">
                                    <Button asChild size="lg" className="w-full">
                                        <Link href="/signup">Start Elite Trial</Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section id="faq" className="py-24 px-6 border-t bg-white border-slate-100">
                    <div className="max-w-3xl mr-auto ml-auto">
                        <h2 className="text-3xl tracking-tight mb-12 text-center font-bricolage font-light text-slate-900">Frequently asked questions</h2>
                        <Accordion type="multiple" className="w-full">
                            {faqItems.map((item, index) => (
                                <AccordionItem key={index} value={`item-${index}`}>
                                    <AccordionTrigger className="text-lg text-left">{item.question}</AccordionTrigger>
                                    <AccordionContent className="text-base text-muted-foreground leading-relaxed">
                                        {item.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                        <div className="text-center mt-12 bg-neutral-50 p-10 rounded-2xl border border-dashed border-neutral-200">
                            <p className="mb-4 font-dm-sans tracking-tight text-slate-600 text-lg">Still have questions?</p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button asChild size="lg" variant="outline">
                                    <Link href="/help-center">Browse Help Center</Link>
                                </Button>
                                <Button asChild size="lg">
                                    <Link href="/contact">Contact Support</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <MarketingFooter />
        </div>
    );
}
