import React from 'react';
import {
    Monitor,
    FileText,
    Check,
    Users,
    Calendar,
    Calculator,
    Bell,
    Video,
    BookOpen,
    Database,
    Trophy,
    Award
} from 'lucide-react';

const MARQUEE_ITEMS = [
    {
        label: "CBT Exam Simulator",
        icon: <Monitor className="w-6 h-6 text-slate-700" />
    },
    {
        label: "Verified News Feed",
        icon: <FileText className="w-6 h-6 text-slate-700" />
    },
    {
        label: "Syllabus Checklist Tracker",
        icon: <Check className="w-6 h-6 text-slate-700" />
    },
    {
        label: "Nairaland-Style Forums",
        icon: <Users className="w-6 h-6 text-slate-700" />
    },
    {
        label: "1-on-1 Mentorship Booking",
        icon: <Calendar className="w-6 h-6 text-slate-700" />
    },
    {
        label: "Aggregate Calculator",
        icon: <Calculator className="w-6 h-6 text-slate-700" />
    },
    {
        label: "Scholarship Alerts",
        icon: <Bell className="w-6 h-6 text-slate-700" />
    },
    {
        label: "Interactive Online Classes",
        icon: <Video className="w-6 h-6 text-slate-700" />
    },
    {
        label: "Physical Center Tutorials",
        icon: <BookOpen className="w-6 h-6 text-slate-700" />
    },
    {
        label: "Past Questions Library",
        icon: <Database className="w-6 h-6 text-slate-700" />
    },
    {
        label: "UTME Mock Exams",
        icon: <Trophy className="w-6 h-6 text-slate-700" />
    },
    {
        label: "Admission Advisory",
        icon: <Award className="w-6 h-6 text-slate-700" />
    }
];

export function MarqueeSection() {
    return (
        <div className="pd_press_section py-6 border-b border-slate-100 bg-white/50 backdrop-blur-sm">
            <div className="home-marq marquee-container group">
                <div className="overlay" style={{
                    "--gradient-color": "rgba(255, 255, 255, 1), rgba(255, 255, 255, 0)",
                    "--gradient-width": "100px"
                } as React.CSSProperties}></div>

                {/* First Loop */}
                <div className="marquee flex items-center gap-8 min-w-full justify-around shrink-0 animate-marquee-scroll">
                    {MARQUEE_ITEMS.map((item, index) => (
                        <div key={`m1-${index}`} className="flex items-center gap-3 px-4 py-2 rounded-full border border-slate-100 bg-white/80 shadow-sm backdrop-blur-md">
                            <span className="flex-shrink-0 p-1 bg-slate-50 rounded-full">
                                {item.icon}
                            </span>
                            <span className="font-medium text-slate-600 whitespace-nowrap text-sm">{item.label}</span>
                        </div>
                    ))}
                </div>

                {/* Second Loop */}
                <div className="marquee flex items-center gap-8 min-w-full justify-around shrink-0 animate-marquee-scroll" aria-hidden="true">
                    {MARQUEE_ITEMS.map((item, index) => (
                        <div key={`m2-${index}`} className="flex items-center gap-3 px-4 py-2 rounded-full border border-slate-100 bg-white/80 shadow-sm backdrop-blur-md">
                            <span className="flex-shrink-0 p-1 bg-slate-50 rounded-full">
                                {item.icon}
                            </span>
                            <span className="font-medium text-slate-600 whitespace-nowrap text-sm">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
