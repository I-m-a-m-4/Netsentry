'use client';

import * as React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PricingPlans() {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    return (
        <div className="w-full">
            <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-12">
                {/* Billing Toggle */}
                <div className="inline-flex items-center p-1 bg-neutral-100/80 border-2 border-dashed border-neutral-200 rounded-xl">
                    <button
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-8 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setBillingCycle('yearly')}
                        className={`px-8 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${billingCycle === 'yearly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Yearly
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Starter Plan */}
                <div className="relative flex flex-col p-8 bg-white border-2 border-dashed border-slate-200 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold leading-5 text-slate-900">Starter</h3>
                    <p className="mt-4 text-slate-600 text-sm">For students getting started with basic UTME exam preparations.</p>

                    <div className="mt-4">
                        <span className="text-4xl font-bold tracking-tight text-slate-900">Free</span>
                    </div>
                    <ul className="mt-6 space-y-4 text-sm text-slate-700 flex-1">
                        <li className="flex items-center gap-3"><Check className="h-5 w-5 text-primary" /> Access to limited syllabus tracking</li>
                        <li className="flex items-center gap-3"><Check className="h-5 w-5 text-primary" /> Take 1 Active Mock Test at a time</li>
                        <li className="flex items-center gap-3"><Check className="h-5 w-5 text-primary" /> Basic Performance Reports</li>
                        <li className="flex items-center gap-3"><Check className="h-5 w-5 text-primary" /> Standard Bot Challenge (Easy Mode)</li>
                    </ul>
                    <div className="mt-auto pt-6">
                        <Button asChild size="lg" className="w-full">
                            <Link href="/signup">Get Started for Free</Link>
                        </Button>
                    </div>
                </div>

                {/* Pro Plan */}
                <div className="relative flex flex-col p-8 bg-white border-2 border-dashed border-primary rounded-lg shadow-2xl shadow-primary/10">
                    <p className="absolute top-0 -translate-y-1/2 bg-primary text-white px-3 py-1 text-sm font-semibold tracking-wide rounded-full">Most Popular</p>
                    <h3 className="text-lg font-semibold leading-5 text-slate-900">Pro</h3>
                    <p className="mt-4 text-slate-600 text-sm">Comprehensive study features for top-scoring university candidates.</p>

                    <div className="mt-4">
                        <span className="text-4xl font-bold tracking-tight text-slate-900">
                            {billingCycle === 'monthly' ? '₦1,500' : '₦15,000'}
                        </span>
                        <span className="text-base font-medium text-slate-500">
                            {billingCycle === 'monthly' ? '/mo' : '/year'}
                        </span>
                        {billingCycle === 'yearly' && (
                            <div className="text-xs text-emerald-600 font-bold mt-1 block animate-pulse">Save ₦3,000!</div>
                        )}
                    </div>
                    <ul className="mt-6 space-y-4 text-sm text-slate-700 flex-1">
                        <li className="flex items-center gap-3"><Check className="h-5 w-5 text-primary" /> Full access to 5+ subjects syllabus</li>
                        <li className="flex items-center gap-3"><Check className="h-5 w-5 text-primary" /> Unlimited Mock CBT simulations</li>
                        <li className="flex items-center gap-3"><Check className="h-5 w-5 text-primary" /> Offline Speed Battles (All difficulties)</li>
                        <li className="flex items-center gap-3"><Check className="h-5 w-5 text-primary" /> Novel Chapter Summaries & Quizzes</li>
                        <li className="flex items-center gap-3"><Check className="h-5 w-5 text-primary" /> Smart AI Study Insights & reports</li>
                        <li className="flex items-center gap-3"><Check className="h-5 w-5 text-primary" /> Target Course Admission analysis</li>
                    </ul>
                    <div className="mt-auto pt-6">
                        <Button asChild size="lg" className="w-full">
                            <Link href="/signup">Start Pro Trial</Link>
                        </Button>
                    </div>
                </div>

                {/* Elite Mentorship Plan */}
                <div className="relative flex flex-col p-8 bg-white border-2 border-dashed border-slate-200 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold leading-5 text-slate-900">Elite</h3>
                    <p className="mt-4 text-slate-600 text-sm">Complete learning resources plus private university student mentoring.</p>

                    <div className="mt-4">
                        <span className="text-4xl font-bold tracking-tight text-slate-900">
                            {billingCycle === 'monthly' ? '₦5,000' : '₦50,000'}
                        </span>
                        <span className="text-base font-medium text-slate-500">
                            {billingCycle === 'monthly' ? '/mo' : '/year'}
                        </span>
                        {billingCycle === 'yearly' && (
                            <div className="text-xs text-emerald-600 font-bold mt-1 block">Save ₦10,000!</div>
                        )}
                    </div>
                    <ul className="mt-6 space-y-4 text-sm text-slate-700 flex-1">
                        <li className="flex items-center gap-3"><Check className="h-5 w-5 text-primary" /> All features in Pro Plan</li>
                        <li className="flex items-center gap-3"><Check className="h-5 w-5 text-primary" /> 2 Private Peer Mentorship sessions / month</li>
                        <li className="flex items-center gap-3"><Check className="h-5 w-5 text-primary" /> Custom Study Planner creation</li>
                        <li className="flex items-center gap-3"><Check className="h-5 w-5 text-primary" /> AI Study Coach active 24/7</li>
                        <li className="flex items-center gap-3"><Check className="h-5 w-5 text-primary" /> Priority review of mock test queries</li>
                    </ul>
                    <div className="mt-auto pt-6">
                        <Button asChild size="lg" className="w-full">
                            <Link href="/signup">Start Elite Trial</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
