'use client';

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Bot, Sparkles } from 'lucide-react';

const examInsights = [
    "WAEC/NECO registrations are fast approaching. Get your syllabus and begin your revision today!",
    "JAMB candidate registration increases by 60% in January. Pre-register now to secure your preferred exam center.",
    "Students taking physical SAT classes show a 30% increase in score retention when utilizing our weekly mock tests.",
    "Study materials for Use of English are highly requested. Download your past questions bundle now."
];

const admissionInsights = [
    "University of Lagos releases merit list. Check your JAMB CAPS portal now to accept admission.",
    "Admission processing for foreign universities takes 4-6 months. Begin your application consultation early.",
    "Federal universities require O'Level result uploads. Upload your WAEC/NECO results on JAMB portal now.",
    "Scholarship applications for UK/US universities are open. Prepare your transcripts and statement of purpose."
];

export function ZenAIInsights() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [hasTriggered, setHasTriggered] = useState(false);
    const [examIndex, setExamIndex] = useState(0);
    const [admissionIndex, setAdmissionIndex] = useState(0);
    const [isExamPulsing, setIsExamPulsing] = useState(false);
    const [isAdmissionPulsing, setIsAdmissionPulsing] = useState(false);

    useEffect(() => {
        const examInterval = setInterval(() => {
            setExamIndex((prev) => (prev + 1) % examInsights.length);
        }, 6000);
        return () => clearInterval(examInterval);
    }, []);

    useEffect(() => {
        const admissionInterval = setInterval(() => {
            setAdmissionIndex((prev) => (prev + 1) % admissionInsights.length);
        }, 8000);
        return () => clearInterval(admissionInterval);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasTriggered) {
                    handleExamClick();
                    handleAdmissionClick();
                    setHasTriggered(true);
                }
            },
            { threshold: 0.1 }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, [hasTriggered]);

    const handleExamClick = () => {
        setIsExamPulsing(true);
        setTimeout(() => setIsExamPulsing(false), 3000);
    };

    const handleAdmissionClick = () => {
        setIsAdmissionPulsing(true);
        setTimeout(() => setIsAdmissionPulsing(false), 3000);
    };

    return (
        <div ref={containerRef} className="relative flex flex-col justify-center items-center py-4">
            {/* AI Connection Visual */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[300px] pointer-events-none">
                <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-0.5 h-[60%] bg-gradient-to-b from-slate-200 via-primary/20 to-slate-200"></div>
            </div>

            {/* Central AI Node */}
            <div className="relative z-10 mb-8">
                <div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white">
                    <Sparkles className="w-7 h-7 text-primary animate-pulse" />
                </div>
            </div>

            {/* Chat Bubbles */}
            <div className="space-y-6 w-full max-w-sm relative z-10">
                {/* Bubble 1 */}
                <div
                    onClick={handleExamClick}
                    className="relative group cursor-pointer transform hover:scale-[1.02] transition-transform duration-300"
                >
                    {/* Icon - Outside Clipping */}
                    <div className="absolute -top-3 -left-3 bg-white border border-slate-100 p-1.5 rounded-full shadow-sm z-20">
                        <Bot className="w-4 h-4 text-emerald-600" />
                    </div>

                    {/* Clipped Card Container */}
                    <div className={`relative rounded-2xl rounded-tl-sm overflow-hidden bg-white shadow-xl transition-all duration-300 ${isExamPulsing ? 'p-[2px]' : 'border border-slate-100'}`}>
                        {/* Spinning Beam Background */}
                        <div className={`absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent_0_280deg,#10b981_360deg)] animate-[spin_8s_linear_infinite] opacity-0 blur-md transition-opacity duration-300 ${isExamPulsing ? 'opacity-100' : ''}`}></div>

                        {/* Content */}
                        <div className="relative bg-white p-5 h-full rounded-[inherit]">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">Exam Preparations</span>
                            </div>
                            <p className="text-slate-700 text-sm leading-relaxed font-medium min-h-[60px] flex items-center transition-opacity duration-300">
                                “{examInsights[examIndex]}”
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bubble 2 */}
                <div
                    onClick={handleAdmissionClick}
                    className="relative group cursor-pointer transform hover:scale-[1.02] transition-transform duration-300 ml-6"
                >
                    <div className="absolute -top-3 -right-3 bg-white border border-slate-100 p-1.5 rounded-full shadow-sm z-20">
                        <Bot className="w-4 h-4 text-blue-600" />
                    </div>

                    <div className={`relative rounded-2xl rounded-tr-sm overflow-hidden bg-white shadow-xl transition-all duration-300 ${isAdmissionPulsing ? 'p-[2px]' : 'border border-slate-100'}`}>
                        <div className={`absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent_0_280deg,#3b82f6_360deg)] animate-[spin_8s_linear_infinite] opacity-0 blur-md transition-opacity duration-300 ${isAdmissionPulsing ? 'opacity-100' : ''}`}></div>

                        <div className="relative bg-white p-5 h-full rounded-[inherit]">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">Admission News</span>
                            </div>
                            <p className="text-slate-700 text-sm leading-relaxed font-medium min-h-[60px] flex items-center transition-opacity duration-300">
                                “{admissionInsights[admissionIndex]}”
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
