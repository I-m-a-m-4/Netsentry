'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import MarketingHeader from "@/components/layout/marketing-header";
import MarketingFooter from "@/components/layout/marketing-footer";
import { InteractiveGrid } from '@/components/interactive-grid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Award, Calendar, ExternalLink, GraduationCap, MapPin, Search, Sparkles } from "lucide-react";

interface ScholarshipOpportunity {
    id: string;
    title: string;
    provider: string;
    value: string;
    deadline: string;
    category: 'national' | 'international' | 'merit' | 'need-based';
    location: string;
    description: string;
    link: string;
}

const scholarshipData: ScholarshipOpportunity[] = [
    {
        id: '1',
        title: 'NNPC/Chevron Joint Venture National Scholarship',
        provider: 'Chevron Nigeria Limited',
        value: '₦200,000 / Year',
        deadline: 'August 15, 2026',
        category: 'national',
        location: 'Nigeria (All Universities)',
        description: 'Offered to second-year (100 Level) undergraduate students in Nigerian universities studying Engineering, Medicine, Science, or Business.',
        link: 'https://www.chevron.com/'
    },
    {
        id: '2',
        title: 'MTN Foundation Science & Technology Scholarship',
        provider: 'MTN Nigeria Foundation',
        value: '₦300,000 / Year',
        deadline: 'September 30, 2026',
        category: 'merit',
        location: 'Nigeria',
        description: 'Awarded to high-performing 300 level students studying Science and Technology courses in public tertiary institutions (Universities, Polytechnics, and Colleges of Education).',
        link: 'https://www.mtn.ng/foundation/'
    },
    {
        id: '3',
        title: 'Pinnacle Academia Academic Excellence Award',
        provider: 'Pinnacle Academia Board',
        value: 'Full Tuition Cover',
        deadline: 'December 31, 2026',
        category: 'merit',
        location: 'UI, OAU & UNILAG candidates',
        description: 'For students who score 320+ in their JAMB exams using the Pinnacle CBT simulator, entering UI, OAU, or UNILAG. Cover includes first-year tuition and free tutoring.',
        link: '/cbt-simulator/select-subjects'
    },
    {
        id: '4',
        title: 'Federal Government Bilateral Education Agreement (BEA) Awards',
        provider: 'Federal Ministry of Education',
        value: 'Fully Funded (Tuition + Stipend)',
        deadline: 'July 5, 2026',
        category: 'international',
        location: 'Russia, Morocco, Hungary, Egypt',
        description: 'The Federal Government of Nigeria offers bilateral scholarships for undergraduate studies abroad. Open to students with outstanding WAEC/NECO grades.',
        link: 'https://education.gov.ng/'
    },
    {
        id: '5',
        title: 'Gani Fawehinmi Scholarship Board Awards',
        provider: 'Gani Fawehinmi Memorial Association',
        value: '₦150,000 one-off',
        deadline: 'October 10, 2026',
        category: 'need-based',
        location: 'Nigeria (All States)',
        description: 'Awarded annually to indigent but smart Nigerian undergraduate students across all fields. Requires proof of academic achievement and financial need.',
        link: 'https://www.ganifawehinmi.org'
    },
    {
        id: '6',
        title: 'Shell University Scholarship Scheme',
        provider: 'Shell Petroleum Development Company (SPDC)',
        value: '₦150,000 / Year',
        deadline: 'November 20, 2026',
        category: 'national',
        location: 'Nigeria (Host Communities)',
        description: 'Designed to support undergraduate students from SPDC host communities and other parts of Nigeria in obtaining high-quality university degrees.',
        link: 'https://www.shell.com.ng/'
    }
];

export default function ScholarshipsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'national' | 'international' | 'merit' | 'need-based'>('all');

    const filteredScholarships = scholarshipData.filter(s => {
        const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = activeFilter === 'all' || s.category === activeFilter;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="min-h-screen bg-white">
            <MarketingHeader />

            <main>
                {/* Hero / Header Section */}
                <section className="relative pt-32 pb-16 px-6 bg-transparent border-b border-slate-100 overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <InteractiveGrid />
                        <div className="aura-background"></div>
                    </div>
                    <div className="max-w-5xl mx-auto text-center relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 mb-8">
                            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                            <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider">Scholarship & Opportunities Portal</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-light text-slate-900 tracking-tight font-bricolage max-w-3xl mx-auto mb-6">
                            Finance Your Academic Dreams
                        </h1>
                        <p className="text-lg text-slate-500 max-w-2xl mx-auto font-dm-sans tracking-tight mb-8">
                            Explore vetted scholarships, grants, and merit awards available to prospective and current university freshers in Nigeria and abroad.
                        </p>

                        {/* Search and Filters */}
                        <div className="max-w-xl mx-auto space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                                <Input
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder="Search scholarships by keyword, sponsor, or discipline..."
                                    className="pl-10 pr-4 h-12 shadow-sm border-slate-200"
                                />
                            </div>
                            <div className="flex flex-wrap justify-center gap-2">
                                {(['all', 'national', 'international', 'merit', 'need-based'] as const).map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setActiveFilter(f)}
                                        className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors border ${
                                            activeFilter === f
                                                ? 'bg-slate-950 border-transparent text-white'
                                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        {f === 'need-based' ? 'Need Based' : f}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Scholarships Grid */}
                <section className="py-16 px-6 bg-slate-50/50">
                    <div className="max-w-6xl mx-auto">
                        {filteredScholarships.length === 0 ? (
                            <div className="text-center py-20 bg-white border border-dashed rounded-2xl max-w-xl mx-auto">
                                <GraduationCap className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-slate-800">No Scholarships Found</h3>
                                <p className="text-slate-500 text-sm mt-1">Try adjusting your search terms or filters.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredScholarships.map(s => (
                                    <motion.div
                                        key={s.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <Card className="h-full flex flex-col hover:shadow-lg transition-shadow border-slate-200">
                                            <CardHeader className="space-y-1.5 pb-3">
                                                <div className="flex justify-between items-start gap-2">
                                                    <span className="text-[10px] uppercase font-bold text-orange-600 tracking-wider">
                                                        {s.provider}
                                                    </span>
                                                    <Badge variant="outline" className="capitalize text-[10px] font-semibold border-slate-200">
                                                        {s.category === 'need-based' ? 'Need Based' : s.category}
                                                    </Badge>
                                                </div>
                                                <CardTitle className="text-base font-bold leading-snug line-clamp-2">
                                                    {s.title}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4 flex-grow">
                                                <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                                                    {s.description}
                                                </p>
                                                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <Award className="h-4 w-4 text-emerald-500 shrink-0" />
                                                        <span className="font-semibold text-slate-900">{s.value}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                                                        <span>Deadline: <strong className="text-slate-700">{s.deadline}</strong></span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                                                        <span className="truncate">{s.location}</span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                            <CardFooter className="pt-2">
                                                <Button asChild className="w-full text-xs font-semibold uppercase tracking-wider" size="sm">
                                                    <a href={s.link} target={s.link.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer" className="flex items-center justify-center gap-1.5">
                                                        Apply Now
                                                        {s.link.startsWith('http') && <ExternalLink className="h-3.5 w-3.5" />}
                                                    </a>
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <MarketingFooter />
        </div>
    );
}
