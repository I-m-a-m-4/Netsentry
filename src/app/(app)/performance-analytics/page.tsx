'use client';

import * as React from 'react';
import { useAcademy } from '@/context/academy-context';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import PageTitle from '@/components/shared/page-title';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    Clock, 
    Award, 
    CheckCircle2, 
    Flag, 
    BookOpen, 
    TrendingUp, 
    FileText, 
    Activity, 
    Calendar,
    Target,
    HelpCircle,
    Brain,
    Percent
} from 'lucide-react';
import { format } from 'date-fns';
import { safeToDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

function ReportStatCard({ title, value, icon: Icon, description }: { title: string, value: string | number, icon: React.ElementType, description?: string }) {
    return (
        <Card className="relative overflow-hidden border border-border/40 bg-card/45 backdrop-blur-md rounded-2xl hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
                <Icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-black text-foreground">{value}</div>
                {description && <p className="text-[10px] text-muted-foreground mt-1">{description}</p>}
            </CardContent>
        </Card>
    );
}

export default function ReportsDashboard() {
    const { currentUserProfile, subjects, currencySymbol } = useAcademy();
    const firestore = useFirestore();
    const { toast } = useToast();

    // Query exam results for the student
    const examResultsQuery = useMemoFirebase(
        () => currentUserProfile?.id ? query(collection(firestore, 'users', currentUserProfile.id, 'examResults'), orderBy('createdAt', 'asc')) : null,
        [currentUserProfile?.id, firestore]
    );

    const { data: examResults, isLoading } = useCollection<any>(examResultsQuery);

    // Calculate syllabus progress
    const syllabusProgressData = React.useMemo(() => {
        if (!subjects) return [];
        return subjects.map(sub => {
            const modules = sub.modules || [];
            const totalTopics = modules.reduce((acc, m) => acc + (m.topics?.length || 0), 0);
            let completedCount = 0;
            if (totalTopics > 0 && typeof window !== 'undefined') {
                const stored = localStorage.getItem(`pinnacle_topics_${sub.id}`);
                completedCount = stored ? JSON.parse(stored).length : 0;
            }
            const progressPercent = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;
            return {
                subject: sub.name,
                progress: progressPercent,
                completed: completedCount,
                total: totalTopics
            };
        });
    }, [subjects]);

    const averageSyllabusProgress = React.useMemo(() => {
        if (syllabusProgressData.length === 0) return 0;
        const total = syllabusProgressData.reduce((sum, item) => sum + item.progress, 0);
        return Math.round(total / syllabusProgressData.length);
    }, [syllabusProgressData]);

    // Calculate aggregated statistics from Mock Exam results
    const academicStats = React.useMemo(() => {
        if (!examResults || examResults.length === 0) {
            return {
                avgScore: 0,
                totalExams: 0,
                totalQuestions: 0,
                avgAccuracy: 0,
                estimatedStudyTime: 0,
                bestSubject: 'N/A'
            };
        }

        let totalScore = 0;
        let totalCorrect = 0;
        let totalQuestions = 0;
        let totalTimeSpent = 0;
        const subjectCorrects: Record<string, { correct: number, total: number }> = {};

        examResults.forEach(run => {
            totalScore += run.score || 0;
            totalCorrect += run.correct || 0;
            totalQuestions += run.totalQuestions || 0;
            // Estimated time spent = limit - remaining
            const limit = (run.timeLimit || 0) * 60;
            const remaining = run.timeRemaining || 0;
            totalTimeSpent += Math.max(0, limit - remaining);

            if (run.breakdown) {
                run.breakdown.forEach((sub: any) => {
                    if (!subjectCorrects[sub.name]) {
                        subjectCorrects[sub.name] = { correct: 0, total: 0 };
                    }
                    subjectCorrects[sub.name].correct += sub.correct || 0;
                    subjectCorrects[sub.name].total += (sub.correct || 0) + (sub.incorrect || 0) + (sub.unanswered || 0);
                });
            }
        });

        // Find best performing subject
        let bestSubName = 'N/A';
        let highestRate = -1;
        Object.entries(subjectCorrects).forEach(([name, data]) => {
            const rate = data.total > 0 ? data.correct / data.total : 0;
            if (rate > highestRate) {
                highestRate = rate;
                bestSubName = name;
            }
        });

        return {
            avgScore: Math.round(totalScore / examResults.length),
            totalExams: examResults.length,
            totalQuestions,
            avgAccuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
            estimatedStudyTime: Math.round(totalTimeSpent / 3600 * 10) / 10, // hours
            bestSubject: bestSubName
        };
    }, [examResults]);

    // Format chart data for mock exam scores trend
    const scoresTrendData = React.useMemo(() => {
        if (!examResults) return [];
        return examResults.map((run, idx) => ({
            attempt: `Attempt ${idx + 1}`,
            score: run.score || 0,
            date: run.createdAt ? format(safeToDate(run.createdAt), 'MMM dd') : `Exam ${idx + 1}`
        }));
    }, [examResults]);

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-140px)] items-center justify-center bg-background text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                    <Clock className="h-10 w-10 animate-spin text-primary" />
                    <span>Loading academic reports...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-16">
            <PageTitle 
                title="Academic Performance Analytics" 
                subtitle="Track your mock exam results, syllabus completion rates, and learning progress." 
            />

            {/* Academic Stat Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <ReportStatCard
                    title="Avg CBT Score"
                    value={academicStats.totalExams > 0 ? `${academicStats.avgScore} / 400` : 'N/A'}
                    icon={Award}
                    description="Average mock score"
                />
                <ReportStatCard
                    title="Exams Taken"
                    value={academicStats.totalExams}
                    icon={FileText}
                    description="Completed mock simulations"
                />
                <ReportStatCard
                    title="Average Accuracy"
                    value={`${academicStats.avgAccuracy}%`}
                    icon={Percent}
                    description="Correct answers rate"
                />
                <ReportStatCard
                    title="Syllabus Progress"
                    value={`${averageSyllabusProgress}%`}
                    icon={BookOpen}
                    description="Topics marked completed"
                />
                <ReportStatCard
                    title="Target UTME"
                    value={currentUserProfile?.targetUTMEScore || 'N/A'}
                    icon={Target}
                    description={currentUserProfile?.targetCourse ? `For ${currentUserProfile.targetCourse}` : 'Target Score'}
                />
                <ReportStatCard
                    title="Practice Hours"
                    value={`${academicStats.estimatedStudyTime} hrs`}
                    icon={Clock}
                    description="Estimated testing time"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Mock Test Score Trend Line Chart */}
                <Card className="lg:col-span-3 border border-border/40 bg-card/40 backdrop-blur-md rounded-2xl shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-bold flex items-center gap-1.5">
                            <TrendingUp className="h-5 w-5 text-primary" /> UTME Mock Exam Trend
                        </CardTitle>
                        <CardDescription>Track your scores progression over successive attempts.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[320px] w-full pt-2">
                        {scoresTrendData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={scoresTrendData} margin={{ top: 5, right: 25, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} className="text-xs font-semibold text-muted-foreground" />
                                    <YAxis tickLine={false} axisLine={false} domain={[0, 400]} tickMargin={8} className="text-xs font-semibold text-muted-foreground" />
                                    <Tooltip contentStyle={{ borderRadius: '12px', background: 'rgba(255,255,255,0.9)' }} />
                                    <Line type="monotone" dataKey="score" name="Exam Score" stroke="hsl(var(--primary))" strokeWidth={3} activeDot={{ r: 6 }} dot={{ r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-4">
                                <Activity className="h-10 w-10 opacity-30 mb-2" />
                                <span className="text-xs">No mock exam scores recorded yet. Complete a CBT simulation test to view trends.</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Subject Syllabus Completion Bar Chart */}
                <Card className="lg:col-span-2 border border-border/40 bg-card/40 backdrop-blur-md rounded-2xl shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-bold flex items-center gap-1.5">
                            <BookOpen className="h-5 w-5 text-primary" /> Subject Syllabus Completion
                        </CardTitle>
                        <CardDescription>Progress rate of completed topics by subject.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[320px] w-full pt-2">
                        {syllabusProgressData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={syllabusProgressData} layout="vertical" margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} tickMargin={8} className="text-xs font-semibold text-muted-foreground" />
                                    <YAxis dataKey="subject" type="category" tickLine={false} axisLine={false} tickMargin={8} className="text-xs font-bold text-foreground" width={90} />
                                    <Tooltip formatter={(value) => [`${value}%`, 'Progress']} contentStyle={{ borderRadius: '12px' }} />
                                    <Bar dataKey="progress" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-4">
                                <BookOpen className="h-10 w-10 opacity-30 mb-2" />
                                <span className="text-xs">No subjects registered in your profile. Configure your subjects list inside Syllabus Tracker.</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Table & Course Fit Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Recent Exams Table Log */}
                <Card className="lg:col-span-3 border border-border/40 bg-card/40 backdrop-blur-md rounded-2xl shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-bold flex items-center gap-1.5">
                            <FileText className="h-5 w-5 text-primary" /> Mock Exam Attempts History
                        </CardTitle>
                        <CardDescription>A listing of all simulated exams completed.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                        {examResults && examResults.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="border-b border-border/40 text-muted-foreground uppercase font-bold tracking-wider">
                                            <th className="py-3 px-2">Date</th>
                                            <th className="py-3 px-2">Mode</th>
                                            <th className="py-3 px-2">Correct / Total</th>
                                            <th className="py-3 px-2">Score</th>
                                            <th className="py-3 px-2 text-right">Percentage</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/20 font-medium">
                                        {examResults.map((run: any) => (
                                            <tr key={run.id} className="hover:bg-muted/10 transition-colors text-foreground">
                                                <td className="py-3 px-2">
                                                    {run.createdAt ? format(safeToDate(run.createdAt), 'PP p') : 'N/A'}
                                                </td>
                                                <td className="py-3 px-2 capitalize">
                                                    {run.mode === 'Card' ? 'Speed Battle' : run.mode}
                                                </td>
                                                <td className="py-3 px-2">
                                                    {run.correct} / {run.totalQuestions}
                                                </td>
                                                <td className="py-3 px-2 font-bold text-primary">
                                                    {run.score} / 400
                                                </td>
                                                <td className="py-3 px-2 text-right">
                                                    {run.percentage}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center">
                                <HelpCircle className="h-8 w-8 opacity-30 mb-2" />
                                <span className="text-xs">No recent attempts logged.</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Course Fit & Target Analysis Card */}
                <Card className="lg:col-span-2 border border-border/40 bg-card/40 backdrop-blur-md rounded-2xl shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-bold flex items-center gap-1.5">
                            <Brain className="h-5 w-5 text-primary" /> Target Admission Analysis
                        </CardTitle>
                        <CardDescription>Evaluating your readiness for your chosen course.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-2 text-xs">
                        <div className="space-y-3.5">
                            <div className="p-3 bg-muted/40 border rounded-xl space-y-1">
                                <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Target Course</span>
                                <span className="font-bold text-foreground block text-sm">{currentUserProfile?.targetCourse || 'Not Configured'}</span>
                                <span className="text-[10px] text-muted-foreground block">{currentUserProfile?.targetInstitution || 'No University Selected'}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl">
                                    <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Target UTME</span>
                                    <span className="font-extrabold text-primary text-base block mt-1">{currentUserProfile?.targetUTMEScore || 'N/A'}</span>
                                </div>
                                <div className="p-3 bg-muted/40 border rounded-xl">
                                    <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Current Average</span>
                                    <span className="font-extrabold text-foreground text-base block mt-1">{academicStats.totalExams > 0 ? academicStats.avgScore : 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        {currentUserProfile?.targetUTMEScore && academicStats.totalExams > 0 ? (
                            <div className="p-3.5 rounded-xl border flex gap-3 items-start bg-background/50">
                                {academicStats.avgScore >= currentUserProfile.targetUTMEScore ? (
                                    <>
                                        <CheckCircle2 className="text-green-500 h-5 w-5 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-bold text-green-600">On Track!</h4>
                                            <p className="text-[11px] text-muted-foreground leading-normal mt-0.5">
                                                Your current average score exceeds your target score! Maintain consistency to secure your admission.
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Activity className="text-amber-500 h-5 w-5 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-bold text-amber-600">Improvement Needed</h4>
                                            <p className="text-[11px] text-muted-foreground leading-normal mt-0.5">
                                                You are {currentUserProfile.targetUTMEScore - academicStats.avgScore} points below your target OAU Post UTME score. Focus on your weakest subject: <strong className="text-foreground">{academicStats.bestSubject !== 'N/A' ? 'Syllabus topics' : 'Practice tests'}</strong>.
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="p-3.5 rounded-xl border border-dashed text-center text-muted-foreground text-[11px]">
                                Configure your targets in your Student Profile and take a mock test to view detailed admission analytics.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
