'use client';

import React from 'react';
import { 
  Sparkles,
  Quote,
  Award,
  BookOpen,
  GraduationCap,
  ChevronRight,
  TrendingUp,
  Target
} from 'lucide-react';
import { InteractiveGrid } from '@/components/interactive-grid';
import MarketingHeader from '@/components/layout/marketing-header';
import MarketingFooter from '@/components/layout/marketing-footer';
import { ThemeProvider } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Testimonial {
  id: string;
  name: string;
  score: number;
  course: string;
  institution: string;
  text: string;
  avatar: string;
  badge: string;
}

const ROW_1_TESTIMONIALS: Testimonial[] = [
  {
    id: 't-1',
    name: 'Adewale Haruna',
    score: 345,
    course: 'Medicine & Surgery',
    institution: 'Obafemi Awolowo University (OAU)',
    text: "The OAU Post-UTME CBT simulator was a total lifesaver. The 10-questions-per-subject constraints matched the actual exam pattern perfectly. I felt zero pressure in the exam hall!",
    avatar: 'AH',
    badge: 'OAU Medicine'
  },
  {
    id: 't-2',
    name: 'Chidi Okafor',
    score: 312,
    course: 'Law',
    institution: 'University of Lagos (UNILAG)',
    text: "The text novels summaries section was what did it for me. I read all recommended books, took chapter quizzes, and tracked my progress easily. Highly recommended study tool!",
    avatar: 'CO',
    badge: 'UNILAG Law'
  },
  {
    id: 't-3',
    name: 'Evelyn Peters',
    score: 328,
    course: 'Pharmacy',
    institution: 'University of Ibadan (UI)',
    text: "I loved the performance reports. Seeing my score history trend upwards kept me motivated. The UI mock tests are highly analytical.",
    avatar: 'EP',
    badge: 'UI Pharmacy'
  },
  {
    id: 't-4',
    name: 'David Okon',
    score: 334,
    course: 'Computer Engineering',
    institution: 'Obafemi Awolowo University (OAU)',
    text: "Offline Speed Battles against the bots made studying physics and math feel like playing games. It improved my speed by 50%.",
    avatar: 'DO',
    badge: 'OAU Engineering'
  }
];

const ROW_2_TESTIMONIALS: Testimonial[] = [
  {
    id: 't-5',
    name: 'Sarah Alabi',
    score: 318,
    course: 'Software Engineering',
    institution: 'University of Ibadan (UI)',
    text: "The mentorship desk let me consult UI engineering student mentors who gave me exact details on high-yield topics. This app has everything you need.",
    avatar: 'SA',
    badge: 'UI Software Engr.'
  },
  {
    id: 't-6',
    name: 'Amina Bello',
    score: 305,
    course: 'Nursing Science',
    institution: 'University of Lagos (UNILAG)',
    text: "Completely customizable subjects layout. I could adjust my test subjects override anytime to prepare for multiple universities.",
    avatar: 'AB',
    badge: 'UNILAG Nursing'
  },
  {
    id: 't-7',
    name: 'Tobi Adebayo',
    score: 322,
    course: 'Mechanical Engineering',
    institution: 'Obafemi Awolowo University (OAU)',
    text: "The interface colors, font, and button sizes are designed beautifully. It builds real exam-day confidence.",
    avatar: 'TA',
    badge: 'OAU Mech Engr.'
  },
  {
    id: 't-8',
    name: 'Grace Nwosu',
    score: 315,
    course: 'Economics',
    institution: 'University of Nigeria, Nsukka',
    text: "The syllabus tracker's visual counts let me track exactly how many topics I had left. I entered the exam fully covered.",
    avatar: 'GN',
    badge: 'UNN Economics'
  }
];

function TestimonialCard({ item }: { item: Testimonial }) {
  return (
    <div className="w-[320px] md:w-[350px] shrink-0 p-6 rounded-2xl border border-border/40 bg-card/45 backdrop-blur-md shadow-sm hover:shadow-md hover:border-primary/20 hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between mx-3 text-left">
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-sm">
              {item.avatar}
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">{item.name}</h4>
              <p className="text-[10px] text-muted-foreground">{item.badge}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-primary/5 text-primary border border-primary/10 rounded-lg px-2 py-0.5 text-xs font-black">
            <Target className="h-3.5 w-3.5" />
            <span>{item.score}</span>
          </div>
        </div>

        <div className="relative">
          <Quote className="absolute -top-2 -left-2 h-6 w-6 text-primary/5 -z-10" />
          <p className="text-xs text-muted-foreground leading-relaxed italic">
            "{item.text}"
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-border/20 mt-4 flex justify-between items-center text-[10px] font-semibold text-muted-foreground">
        <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5 text-primary" /> {item.course}</span>
        <span className="text-[9px] uppercase tracking-wider font-bold bg-muted px-2 py-0.5 rounded-full">{item.institution.split(' ')[0]}</span>
      </div>
    </div>
  );
}

export default function StudyMaterialsPage() {
  return (
    <ThemeProvider forcedTheme="light">
      <div className="h-full overflow-y-auto w-full antialiased overflow-x-hidden text-slate-900 bg-[#F9F8F6] relative font-jakarta">
        <div className="fixed grid-lines w-full h-full top-0 right-0 left-0 pointer-events-none z-0 opacity-[0.15]"></div>
        
        {/* Style injection for infinite horizontal marquee slider */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes marquee-left {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          @keyframes marquee-right {
            0% { transform: translateX(-50%); }
            100% { transform: translateX(0); }
          }
          .animate-marquee-left-scroll {
            display: flex;
            width: max-content;
            animation: marquee-left 25s linear infinite;
          }
          .animate-marquee-right-scroll {
            display: flex;
            width: max-content;
            animation: marquee-right 25s linear infinite;
          }
          .animate-marquee-left-scroll:hover, .animate-marquee-right-scroll:hover {
            animation-play-state: paused;
          }
        `}} />

        <div className="relative z-10">
          <MarketingHeader />

          <main className="min-h-screen pt-20 pb-20">
            {/* Hero Section */}
            <section className="text-center max-w-5xl mt-16 mx-auto pt-20 pb-12 px-6 relative z-10 bg-transparent">
              <InteractiveGrid />
              <div className="aura-background"></div>
              
              <div className="inline-flex gap-2 text-xs text-orange-800 bg-orange-50 border-orange-200/60 border rounded-full px-4 py-2 items-center backdrop-blur-sm shadow-sm mb-6">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-semibold">SUCCESS TRIBUTES.</span>
                <span className="mx-1 h-1 w-1 rounded-full bg-orange-300"></span>
                <span className="text-orange-600">Hear from high-scoring alumni student members</span>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-tight mb-8">
                Wall of Fame
              </h1>
              
              <p className="mt-6 text-lg md:text-xl text-slate-700 max-w-3xl mx-auto font-medium leading-relaxed">
                Hundreds of candidates use Pinnacle Academia to track their UTME syllabus, challenge bots, book consultations, and ace their post-UTME exams. Here's what they say.
              </p>

              <div className="flex gap-4 items-center justify-center mt-10">
                <Button asChild size="lg" className="rounded-full shadow-md px-8 py-3.5 transition-all text-sm font-semibold">
                  <Link href="/signup">Start Free Preparation <ChevronRight className="w-4 h-4 ml-1.5" /></Link>
                </Button>
              </div>
            </section>

            {/* Testimonials Marquee Ticker Container */}
            <section className="py-12 space-y-8 bg-white border-t border-b border-slate-100/80 overflow-hidden relative">
              
              {/* Fade masks for left and right edges to make cards collapse into edges */}
              <div className="absolute top-0 bottom-0 left-0 w-16 md:w-32 bg-gradient-to-r from-white to-transparent z-20 pointer-events-none" />
              <div className="absolute top-0 bottom-0 right-0 w-16 md:w-32 bg-gradient-to-l from-white to-transparent z-20 pointer-events-none" />

              {/* Row 1: Moving Left */}
              <div className="w-full flex overflow-hidden">
                <div className="animate-marquee-left-scroll">
                  {[...ROW_1_TESTIMONIALS, ...ROW_1_TESTIMONIALS].map((item, idx) => (
                    <TestimonialCard key={`row1-${item.id}-${idx}`} item={item} />
                  ))}
                </div>
              </div>

              {/* Row 2: Moving Right */}
              <div className="w-full flex overflow-hidden">
                <div className="animate-marquee-right-scroll">
                  {[...ROW_2_TESTIMONIALS, ...ROW_2_TESTIMONIALS].map((item, idx) => (
                    <TestimonialCard key={`row2-${item.id}-${idx}`} item={item} />
                  ))}
                </div>
              </div>

              {/* Row 3: Moving Left */}
              <div className="w-full flex overflow-hidden">
                <div className="animate-marquee-left-scroll">
                  {[...ROW_1_TESTIMONIALS, ...ROW_1_TESTIMONIALS].map((item, idx) => (
                    <TestimonialCard key={`row3-${item.id}-${idx}`} item={item} />
                  ))}
                </div>
              </div>
            </section>
          </main>

          <MarketingFooter />
        </div>
      </div>
    </ThemeProvider>
  );
}
