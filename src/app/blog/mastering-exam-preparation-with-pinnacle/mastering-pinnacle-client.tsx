'use client';

import * as React from 'react';
import { format } from 'date-fns';
import MarketingHeader from '@/components/layout/marketing-header';
import MarketingFooter from '@/components/layout/marketing-footer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  ChevronRight,
  Clock,
  BookOpen,
  Share2,
  Twitter,
  ChevronLeft,
  Zap,
  Shield,
  BarChart3,
  Users,
  Instagram,
  ArrowRight,
  GraduationCap
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from 'next/link';
import { ThemeProvider } from '@/components/theme-provider';
import { useToast } from '@/hooks/use-toast';

export default function MasteringPinnacleClient() {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = React.useState<string>('');

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: 'Link Copied', description: 'Article link added to clipboard.' });
  };

  // Intersection Observer for Scroll Highlighting
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0% -35% 0%' }
    );

    const sections = ['studypoints', 'synchronization', 'audit', 'performance', 'growth', 'psychology', 'legacy', 'local', 'volatility', 'invisible'];
    sections.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <ThemeProvider forcedTheme="light">
      <div className="min-h-screen bg-white selection:bg-slate-900 selection:text-white">
        <MarketingHeader />
        
        <main className="min-h-screen">
          <div className="mx-auto max-w-6xl px-6 pb-16 pt-48 sm:px-6 sm:pb-24 lg:grid lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-12 lg:pb-24 xl:gap-16">
            <article className="min-w-0">
               {/* Breadcrumbs */}
              <nav className="mb-10 text-[11px] font-medium text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Link href="/blog" className="hover:text-slate-900 transition-colors">Blog</Link>
                <span className="text-slate-300">/</span>
                <span className="truncate">Mastering Exam Preparation with Pinnacle Academia</span>
              </nav>

              <header className="mb-12">
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 mb-8 leading-[1.2]">
                   Mastering Exam Preparation: The Pinnacle Framework for Success
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                   <div className="flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5" />
                      <span>Academic Mastery</span>
                   </div>
                   <span className="text-slate-200">•</span>
                   <time dateTime="2026-05-25">May 25, 2026</time>
                   <span className="text-slate-200">•</span>
                   <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span>12 MIN READ</span>
                   </div>
                </div>
              </header>

              {/* Content Area */}
              <div className="prose prose-slate max-w-none 
                prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-slate-900
                prose-p:text-slate-600 prose-p:text-lg prose-p:leading-relaxed prose-p:mb-8
                prose-strong:text-slate-900 prose-strong:font-bold
                prose-a:text-orange-600 prose-a:no-underline hover:prose-a:underline prose-a:transition-all
                prose-blockquote:border-l-2 prose-blockquote:border-slate-200 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-slate-500
                prose-img:rounded-3xl prose-img:shadow-sm
                prose-hr:border-slate-100 prose-hr:my-16
                prose-table:border-collapse prose-th:text-left prose-th:font-bold prose-th:text-slate-900 prose-th:pb-4 prose-td:py-4 prose-td:border-t prose-td:border-slate-100
              ">
                <p>Excelling in national and university entrance examinations in Nigeria requires more than just long study hours. It requires a command over your syllabus, a shield against test day anxiety, and the ability to manage multiple study subjects cohesively. This is the core mission of Pinnacle Academia: providing you with the ultimate dashboard for clear, mission-critical academic preparation.</p>
                <p>In this guide, we break down the five pillars of academic excellence using the Pinnacle framework. Whether you are prepping for JAMB, WAEC, post-UTME, or university exams, these tactics will transform how you study.</p>

                <hr />

                <h2 id="studypoints" className="scroll-mt-32">Tactical Study Plan Management</h2>
                <p>Your study schedule is your academic lifeblood, but it is also where most study hours are wasted. Pinnacle&apos;s learning system doesn&apos;t just track hours; it tracks revision velocity.</p>
                <ul>
                  <li><strong>Automated Study Milestones:</strong> Set milestones so you cover key exam topics before registration deadlines, ensuring zero gaps in your preparation.</li>
                  <li><strong>Syllabus Progress Tracking:</strong> Crucial for JAMB and WAEC preparation, Pinnacle alerts you to under-studied chapters weeks before the exam date.</li>
                  <li><strong>Subject Variations & Classification:</strong> Manage dozens of complex topics categorized by difficulty or exam relevance with high-fidelity accuracy.</li>
                </ul>

                <h2 id="synchronization" className="scroll-mt-32">Multi-Subject Synchronization</h2>
                <p>The biggest challenge of exam preparation is fragmentation—spending too much time on Math and neglecting Physics. Pinnacle&apos;s cloud-native interface ensures that your practice scores across all subjects are integrated into a single view.</p>
                <blockquote>
                  &quot;Preparation without synchronization is just organized struggle. Pinnacle brings every subject score into a single, cohesive dashboard.&quot;
                </blockquote>
                <p>With real-time sync, you can review topic explanations and switch between practice assessments with a simple click, ensuring a balanced study progress.</p>

                <h2 id="audit" className="scroll-mt-32">Real-Time Self-Audit Integrity</h2>
                <p>Unidentified weak areas are the silent killer of test scores. Pinnacle&apos;s analytics log records every practice question answered, adjusting your personal study recommendations automatically.</p>
                <div className="overflow-x-auto">
                  <table>
                    <thead>
                      <tr>
                        <th>Prep Feature</th>
                        <th>Impact</th>
                        <th>Strategic Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Mock Tests</strong></td>
                        <td>Assess Readiness</td>
                        <td>High Integrity</td>
                      </tr>
                      <tr>
                        <td><strong>Weakness Analytics</strong></td>
                        <td>Target Weak Topics</td>
                        <td>Score Security</td>
                      </tr>
                      <tr>
                        <td><strong>AI Tutor Hints</strong></td>
                        <td>Step-by-Step Logic</td>
                        <td>Conceptual Clarity</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h2 id="psychology" className="scroll-mt-32">The Psychology of Revision</h2>
                <p>Exam success is as much about psychology as it is about study guidelines. Today&apos;s student is surrounded by digital distractions. Pinnacle helps you master focus by linking your study sessions to progressive streaks. Are you revising out of habit or pressure? When you have access to your personal study data, you stop cramming and start mastering concepts.</p>

                <h2 id="legacy" className="scroll-mt-32">Legacy vs. High-Fidelity Study Methods</h2>
                <p>The transition from legacy systems—like standard physical textbooks and paper-based mock tests—to a high-fidelity digital learning OS like Pinnacle is the single most important hardware-software upgrade a student can make. Legacy study methods are silos; Pinnacle is an interactive ecosystem. While legacy books offer static questions, Pinnacle provides dynamic solutions and adaptive quizzes.</p>

                <h2 id="local" className="scroll-mt-32">The Local Advantage (Offline-First Study)</h2>
                <p>Global educational solutions often fail in the local Nigerian context. They don&apos;t account for intermittent internet connectivity or high data costs. Pinnacle was built with these challenges at the core. Our &quot;Offline-First&quot; architecture means your learning never stops, even when the network does. Download your resources once and study offline anywhere.</p>

                <h2 id="volatility" className="scroll-mt-32">Mitigating Exam Day Volatility</h2>
                <p>Time limits and tricky question structures mean your score is under constant attack under exam conditions. You cannot afford to wait until the real exam day to know if you can finish on time. Pinnacle&apos;s timed simulation mock exams allow you to adjust your pacing on the fly, preparing you to tackle the actual CBT interface smoothly.</p>

                <h2 id="invisible" className="scroll-mt-32">Tracking the Invisible Errors</h2>
                <p>The most dangerous part of taking mock tests is ignoring the errors—the simple mistakes that slip through your fingers. Pinnacle acts as your remote exam coach. Through detailed post-test explanations and error analytics, you correct mistakes before they cost you marks.</p>

                <h2 id="sovereignty" className="scroll-mt-32">Data Sovereignty in the Learning Age</h2>
                <p>As you study, your progress history becomes your most valuable asset. Who owns that data? In legacy apps, your progress is often lost. Pinnacle ensures your learning sovereignty. All your mock history, weak area reports, and bookmarks are yours to command. We provide the high-performance infrastructure to store it, but the intelligence belongs to you.</p>

                <h2 id="hesitation" className="scroll-mt-32">The Cost of Procrastination (Opportunity Loss)</h2>
                <p>Exams move fast; academic calendars move in real-time. The cost of not knowing your weakness is not just a wrong answer—it&apos;s a missed admission. When a candidate falls short of the cut-off by a few points, they lose a whole academic year. Pinnacle eliminates this hesitation by highlighting what to study next.</p>

                <h2 id="divide" className="scroll-mt-32">Bridging the Knowledge Gap (Student Onboarding)</h2>
                <p>A common concern is the technical barrier to computer-based testing (CBT). We built Pinnacle to be &quot;Zero-Training Ready.&quot; The interface is as intuitive as a messaging app, reducing onboarding time to minutes. The system guides you through the mock exam process, building CBT confidence automatically.</p>

                <h2 id="liquidity" className="scroll-mt-32">The Focus Trap (Time-in-Study)</h2>
                <p>Many students feel busy yet make no progress. This is the focus trap. You have hours of study time tied up in reading subjects you already know. Pinnacle&apos;s velocity tracking identifies your static topics instantly. By directing your energy to untested syllabus parts, you unlock your study efficiency.</p>

                <h2 id="generational" className="scroll-mt-32">Building a Generational Legacy</h2>
                <p>Pinnacle is not just about passing today&apos;s test; it&apos;s about building study habits that last. By creating structured, repeatable, and data-driven methods, you turn your learning into a system. A system can scale to university and beyond. Whether your goal is a university scholarship or professional excellence, Pinnacle provides the tools required of a world-class student.</p>

                {/* FAQ Section */}
                <div className="mt-24 pt-16 border-t border-slate-100">
                  <h3 className="text-2xl font-black text-slate-950 mb-8 tracking-tight font-bricolage">Academic FAQ</h3>
                  <Accordion type="multiple" className="w-full">
                    {[
                      {
                        question: "How do I access study materials on Pinnacle Academia?",
                        answer: "You can easily browse, download, and study exam preparation materials, syllabus guidelines, and past questions from our comprehensive digital library."
                      },
                      {
                        question: "What exams are covered by Pinnacle Academia?",
                        answer: "We support a wide range of exams, including JAMB, WAEC, NECO, post-UTME, and university-level prep assessments across major Nigerian and international institutions."
                      },
                      {
                        question: "Can I download materials for offline study?",
                        answer: "Yes. Our mobile application allows you to download textbooks, past questions, and lecture notes directly to your device so you can study anytime without internet data."
                      },
                      {
                        question: "Does Pinnacle Academia provide performance tracking?",
                        answer: "Absolutely. Our analytics tool tracks study patterns, practice test scores, and learning progress to highlight strengths and areas needing improvement."
                      },
                      {
                        question: "How does the Pinnacle AI tutor help students?",
                        answer: "The Pinnacle AI assistant provides instant explanations of complex topics, custom practice quizzes, and guided hints for solving difficult past questions."
                      }
                    ].map((item, index) => (
                      <AccordionItem key={index} value={`item-${index}`} className="border-slate-100">
                        <AccordionTrigger className="text-left font-bold text-slate-900 hover:text-orange-600 transition-all py-4 text-base">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-slate-500 text-base leading-relaxed pb-4">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </div>

              {/* Share */}
              <div className="mt-24 pt-10 border-t border-slate-100 flex items-center justify-between">
                 <div className="flex items-center gap-6">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Share</span>
                    <div className="flex gap-4">
                      <button onClick={copyLink} className="text-slate-400 hover:text-slate-900 transition-colors">
                        <Share2 className="h-4 w-4" />
                      </button>
                      <button className="text-slate-400 hover:text-slate-900 transition-colors">
                        <Twitter className="h-4 w-4" />
                      </button>
                    </div>
                 </div>
                 
                 <Button asChild variant="link" className="text-slate-400 hover:text-slate-900 p-0 h-auto text-[11px] font-bold uppercase tracking-widest no-underline">
                    <Link href="/blog" className="flex items-center gap-2">
                      <ChevronLeft className="h-3 w-3" />
                      All articles
                    </Link>
                 </Button>
              </div>

              {/* Next Steps CTA */}
              <div className="mt-24 rounded-[2.5rem] bg-slate-100 text-slate-900 p-8 md:p-16 relative overflow-hidden group border border-dashed border-slate-200">
                <div className="absolute inset-0 grid-lines opacity-10 pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                  <div className="max-w-md">
                    <h3 className="text-3xl md:text-4xl font-black tracking-tight mb-4 leading-tight text-slate-950">Ready to excel in your academic journey?</h3>
                    <p className="text-slate-600 font-medium text-lg">Join thousands of students using Pinnacle Academia to master exams and achieve outstanding results.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <Link href="/study-materials" className="hover:bg-[#0f172a] transition-colors text-sm font-medium text-white tracking-tight font-dm-sans bg-[#1e293b] rounded-md pt-2.5 pr-8 pb-2.5 pl-8 shadow-sm text-center">Explore Materials</Link>
                    <Link href="/about/our-mission" className="transition-colors text-sm font-medium bg-[#ffffff] border rounded-md px-8 py-2.5 font-dm-sans tracking-tight hover:text-slate-600 text-slate-900 border-stone-200 shadow-sm text-center">Our Mission</Link>
                  </div>
                </div>
              </div>
            </article>

            {/* Sidebar / On this page */}
            <aside className="hidden lg:block">
              <div className="sticky top-40 space-y-12">
                 <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6 font-mono">On this page</p>
                    <div className="space-y-6">
                       <p className="text-sm font-medium text-slate-500 leading-relaxed border-l-2 border-slate-100 pl-4 mb-4">
                         Everything you need to know about scaling your exam preparation across multiple subjects in Nigeria.
                       </p>
                       <nav className="flex flex-col gap-4">
                         {[
                           { id: 'psychology', label: 'The Psychology of Revision' },
                           { id: 'legacy', label: 'Legacy vs. High-Fidelity Study' },
                           { id: 'local', label: 'The Offline-First Advantage' },
                           { id: 'volatility', label: 'Mitigating Mock Volatility' },
                           { id: 'invisible', label: 'Tracking Invisible Errors' },
                           { id: 'sovereignty', label: 'Data Sovereignty in Learning' },
                           { id: 'hesitation', label: 'The Cost of Procrastination' },
                           { id: 'divide', label: 'Bridging the Knowledge Gap' },
                           { id: 'liquidity', label: 'The Focus Trap (Time-in-Study)' },
                           { id: 'generational', label: 'Building a Generational Legacy' }
                         ].map((item) => (
                           <button 
                             key={item.id}
                             onClick={() => {
                               const el = document.getElementById(item.id);
                               if (el) el.scrollIntoView({ behavior: 'smooth' });
                             }}
                             className={cn(
                               "text-left text-xs font-bold transition-all duration-300",
                               activeSection === item.id ? "text-orange-600 pl-2" : "text-slate-500 hover:text-slate-900"
                             )}
                           >
                             {item.label}
                           </button>
                         ))}
                       </nav>
                    </div>
                 </div>

                  <div className="pt-10 border-t border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6 font-mono">Follow Mission</p>
                    <Link 
                      href="https://instagram.com/pinnacle_academia" 
                      target="_blank"
                      className="group flex flex-col gap-4 p-5 rounded-2xl bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-center gap-3">
                         <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-600 to-orange-500 p-[2px]">
                            <div className="h-full w-full rounded-[10px] bg-white flex items-center justify-center">
                               <Instagram className="h-5 w-5 text-slate-900" />
                            </div>
                         </div>
                         <div>
                            <p className="text-xs font-black text-slate-950 uppercase tracking-tighter">@pinnacle_academia</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Follow Academic Feed</p>
                         </div>
                      </div>
                      <p className="text-[10px] leading-relaxed text-slate-500 font-medium">Join our growing community getting daily study tips, exam strategies, and academic updates on the gram.</p>
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-950 uppercase tracking-widest group-hover:gap-2 transition-all">
                        Follow Now <ArrowRight className="h-3 w-3" />
                      </div>
                    </Link>
                  </div>

                  <div className="pt-10 border-t border-slate-100">
                     <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6 font-mono">Related</p>
                    <div className="flex flex-col gap-8">
                       <Link href="/blog" className="group block">
                          <h4 className="text-sm font-bold leading-snug text-slate-600 group-hover:text-slate-900 transition-colors mb-2">
                             JAMB Central Admission Processing System (CAPS): How It Works
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                             <span>Recently</span>
                             <span>·</span>
                             <span className="flex items-center gap-1">Read <ChevronRight className="h-2 w-2" /></span>
                          </div>
                       </Link>
                    </div>
                 </div>
              </div>
            </aside>
          </div>
        </main>
        
        <MarketingFooter />
      </div>
    </ThemeProvider>
  );
}
