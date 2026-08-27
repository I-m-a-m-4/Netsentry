'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAcademy } from '@/context/academy-context';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
    Clock, 
    AlertCircle, 
    ChevronLeft, 
    ChevronRight, 
    Flag, 
    CheckCircle2, 
    HelpCircle, 
    Bot, 
    RotateCcw, 
    Home, 
    Award, 
    BookOpen, 
    FileText,
    History,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle 
} from "@/components/ui/alert-dialog";

import { englishQuestions } from '../data/use-of-english';
import { mathematicsQuestions } from '../data/mathematics';
import { physicsQuestions } from '../data/physics';
import { chemistryQuestions } from '../data/chemistry';
import { biologyQuestions } from '../data/biology';

const SEED_QUESTIONS: Record<string, any[]> = {
    'Use of English': englishQuestions,
    'Mathematics': mathematicsQuestions,
    'Physics': physicsQuestions,
    'Chemistry': chemistryQuestions,
    'Biology': biologyQuestions
};

export default function ActiveTestPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { currentUserProfile, academy, parkActiveExamSession } = useAcademy();
    const firestore = useFirestore();

    const [sessionData, setSessionData] = React.useState<any>(null);
    const [timeLeft, setTimeLeft] = React.useState(0);
    const [currentSubjectIndex, setCurrentSubjectIndex] = React.useState(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);

    // Answers format: Record<subjectName, Record<questionIndex, answerLetter>>
    const [answers, setAnswers] = React.useState<Record<string, Record<number, string>>>({});
    // Flags format: Record<subjectName, Set<questionIndex>>
    const [flags, setFlags] = React.useState<Record<string, number[]>>({});

    const [isSubmitted, setIsSubmitted] = React.useState(false);
    const [scoreSummary, setScoreSummary] = React.useState<any>(null);

    // Gamified Bot state for Speed Battle mode
    const [botProgress, setBotProgress] = React.useState(0);
    const [botIntervalId, setBotIntervalId] = React.useState<any>(null);

    const [isQuitDialogOpen, setIsQuitDialogOpen] = React.useState(false);
    const isLoadedRef = React.useRef(false);

    // Load active session from sessionStorage
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = sessionStorage.getItem('active_exam_session');
            if (stored) {
                const parsed = JSON.parse(stored);
                // Hydrate questions with seeds if the subject does not have any questions configured
                const hydratedSubjects = parsed.subjects.map((sub: any) => {
                    const localQuestions = sub.questions || [];
                    if (localQuestions.length === 0) {
                        // Find matching seed questions or default to Use of English seeds
                        const seed = SEED_QUESTIONS[sub.name] || SEED_QUESTIONS['Use of English'];
                        return { ...sub, questions: seed };
                    }
                    return sub;
                });
                parsed.subjects = hydratedSubjects;
                setSessionData(parsed);

                if (parsed.isParked) {
                    setTimeLeft(parsed.timeLeft);
                    setCurrentSubjectIndex(parsed.currentSubjectIndex || 0);
                    setCurrentQuestionIndex(parsed.currentQuestionIndex || 0);
                    setAnswers(parsed.answers || {});
                    setFlags(parsed.flags || {});
                    
                    // Clear parked state flags
                    parsed.isParked = false;
                    sessionStorage.setItem('active_exam_session', JSON.stringify(parsed));
                } else {
                    const progressStored = sessionStorage.getItem('active_exam_progress');
                    if (progressStored) {
                        try {
                            const progress = JSON.parse(progressStored);
                            setTimeLeft(progress.timeLeft);
                            setCurrentSubjectIndex(progress.currentSubjectIndex || 0);
                            setCurrentQuestionIndex(progress.currentQuestionIndex || 0);
                            setAnswers(progress.answers || {});
                            setFlags(progress.flags || {});
                        } catch (e) {
                            console.error("Failed to restore exam progress:", e);
                            setTimeLeft(parsed.timeLimit * 60);
                            const initialAnswers: Record<string, Record<number, string>> = {};
                            const initialFlags: Record<string, number[]> = {};
                            parsed.subjects.forEach((sub: any) => {
                                initialAnswers[sub.name] = {};
                                initialFlags[sub.name] = [];
                            });
                            setAnswers(initialAnswers);
                            setFlags(initialFlags);
                        }
                    } else {
                        setTimeLeft(parsed.timeLimit * 60);

                        // Initialize answers and flags structures
                        const initialAnswers: Record<string, Record<number, string>> = {};
                        const initialFlags: Record<string, number[]> = {};
                        parsed.subjects.forEach((sub: any) => {
                            initialAnswers[sub.name] = {};
                            initialFlags[sub.name] = [];
                        });
                        setAnswers(initialAnswers);
                        setFlags(initialFlags);
                    }
                }

                // Start Speed Battle Bot AI simulator
                if (parsed.mode === 'Card' || parsed.mode === 'Speed Battle') {
                    const interval = setInterval(() => {
                        setBotProgress(prev => {
                            const step = Math.floor(Math.random() * 3) + 1;
                            const next = prev + step;
                            const totalQuestions = hydratedSubjects.reduce((sum: number, s: any) => sum + s.questions.length, 0);
                            if (next >= totalQuestions) {
                                clearInterval(interval);
                                return totalQuestions;
                            }
                            return next;
                        });
                    }, 5000);
                    setBotIntervalId(interval);
                }

                // Set hydration ref to true after load batch finishes
                isLoadedRef.current = true;
            } else {
                toast({
                    variant: 'destructive',
                    title: 'No Session Found',
                    description: 'Could not load active exam state. Returning to simulator config.'
                });
                router.push('/cbt-simulator/select-subjects');
            }
        }
    }, [router, toast]);

    // Save progress to sessionStorage on changes
    React.useEffect(() => {
        if (isLoadedRef.current && sessionData && !isSubmitted) {
            const progress = {
                timeLeft,
                currentSubjectIndex,
                currentQuestionIndex,
                answers,
                flags
            };
            sessionStorage.setItem('active_exam_progress', JSON.stringify(progress));
        }
    }, [timeLeft, currentSubjectIndex, currentQuestionIndex, answers, flags, sessionData, isSubmitted]);

    // Timer countdown effect
    React.useEffect(() => {
        if (timeLeft <= 0 || isSubmitted || !sessionData) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmitExam(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, isSubmitted, sessionData]);

    // Cleanup bot interval on unmount
    React.useEffect(() => {
        return () => {
            if (botIntervalId) clearInterval(botIntervalId);
        };
    }, [botIntervalId]);

    if (!sessionData) {
        return (
            <div className="flex h-screen items-center justify-center bg-background text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                    <Clock className="h-10 w-10 animate-spin text-primary" />
                    <span>Loading exam simulator...</span>
                </div>
            </div>
        );
    }

    const currentSubject = sessionData.subjects[currentSubjectIndex];
    const currentQuestion = currentSubject?.questions[currentQuestionIndex];
    const totalSubjects = sessionData.subjects.length;
    const totalSubjectQuestions = currentSubject?.questions.length || 0;

    const formattedTime = () => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const handleAnswerSelection = (optionLetter: string) => {
        setAnswers(prev => ({
            ...prev,
            [currentSubject.name]: {
                ...prev[currentSubject.name],
                [currentQuestionIndex]: optionLetter
            }
        }));
    };

    const toggleFlagQuestion = () => {
        setFlags(prev => {
            const list = prev[currentSubject.name] || [];
            const updated = list.includes(currentQuestionIndex)
                ? list.filter(i => i !== currentQuestionIndex)
                : [...list, currentQuestionIndex];
            return {
                ...prev,
                [currentSubject.name]: updated
            };
        });
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < totalSubjectQuestions - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else if (currentSubjectIndex < totalSubjects - 1) {
            setCurrentSubjectIndex(prev => prev + 1);
            setCurrentQuestionIndex(0);
        }
    };

    const handlePrevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        } else if (currentSubjectIndex > 0) {
            setCurrentSubjectIndex(prev => prev - 1);
            const prevSub = sessionData.subjects[currentSubjectIndex - 1];
            setCurrentQuestionIndex(prevSub.questions.length - 1);
        }
    };

    const handleSubmitExam = async (auto = false) => {
        if (botIntervalId) clearInterval(botIntervalId);

        // Compute scores
        let totalScore = 0;
        let maxScore = 0;
        let totalQuestionsCount = 0;
        let correctCount = 0;
        let incorrectCount = 0;
        let unansweredCount = 0;

        const subjectBreakdown = sessionData.subjects.map((sub: any) => {
            const subAnswers = answers[sub.name] || {};
            let subCorrect = 0;
            let subIncorrect = 0;
            let subUnanswered = 0;

            sub.questions.forEach((q: any, idx: number) => {
                const answer = subAnswers[idx];
                if (!answer) {
                    subUnanswered++;
                } else if (answer === q.correctAnswer) {
                    subCorrect++;
                } else {
                    subIncorrect++;
                }
            });

            const subQuestionsCount = sub.questions.length;
            totalQuestionsCount += subQuestionsCount;
            correctCount += subCorrect;
            incorrectCount += subIncorrect;
            unansweredCount += subUnanswered;

            // Score scaled out of 100 for each subject
            const scorePercent = subQuestionsCount > 0 ? (subCorrect / subQuestionsCount) * 100 : 0;
            totalScore += scorePercent;
            maxScore += 100;

            return {
                name: sub.name,
                correct: subCorrect,
                incorrect: subIncorrect,
                unanswered: subUnanswered,
                score: Math.round(scorePercent)
            };
        });

        const university = sessionData.university || '';
        const isOAU = university.toLowerCase().includes('oau') || university.toLowerCase().includes('obafemi');
        const isUnilag = university.toLowerCase().includes('unilag') || university.toLowerCase().includes('lagos');

        let maxScoreScale = 100; // default for others (e.g. UNILORIN)
        if (isOAU) maxScoreScale = 40;
        else if (isUnilag) maxScoreScale = 30;

        // Compute aggregate score out of university max scale
        const finalScore = maxScore > 0 ? Math.round((totalScore / maxScore) * maxScoreScale) : 0;
        const finalPercentage = maxScore > 0 ? Math.round((correctCount / totalQuestionsCount) * 100) : 0;

        const summary = {
            finalScore, // e.g. 28/40
            finalPercentage, // e.g. 70%
            correctCount,
            incorrectCount,
            unansweredCount,
            totalQuestionsCount,
            subjectBreakdown,
            maxScoreScale
        };

        setScoreSummary(summary);
        setIsSubmitted(true);

        // Save results to Firestore
        if (firestore && currentUserProfile?.id) {
            try {
                await addDoc(collection(firestore, `users/${currentUserProfile.id}/examResults`), {
                    receiptNumber: sessionData.receiptNumber,
                    mode: sessionData.mode,
                    score: finalScore,
                    percentage: finalPercentage,
                    correct: correctCount,
                    incorrect: incorrectCount,
                    unanswered: unansweredCount,
                    totalQuestions: totalQuestionsCount,
                    timeRemaining: timeLeft,
                    timeLimit: sessionData.timeLimit,
                    breakdown: subjectBreakdown,
                    createdAt: serverTimestamp()
                });
            } catch (e) {
                console.error("Could not persist exam result to Firestore:", e);
            }
        }

        sessionStorage.removeItem('active_exam_progress');

        toast({
            variant: 'success',
            title: auto ? 'Time Expired!' : 'Exam Submitted!',
            description: `Your CBT Simulation is complete. Score: ${finalScore}/${maxScoreScale} (${finalPercentage}%)`
        });
    };

    const handleParkTest = () => {
        if (!sessionData) return;

        const sessionToPark = {
            ...sessionData,
            timeLeft,
            currentSubjectIndex,
            currentQuestionIndex,
            answers,
            flags,
            isParked: true
        };

        parkActiveExamSession(sessionToPark);

        // Clear active session states from sessionStorage
        sessionStorage.removeItem('active_exam_session');
        sessionStorage.removeItem('active_exam_progress');

        toast({
            variant: 'success',
            title: 'Test Parked',
            description: 'Your test progress has been stored. You can safely return later.'
        });

        // Redirect to select subjects
        router.push('/cbt-simulator/select-subjects');
    };

    const handleQuitExam = () => {
        setIsQuitDialogOpen(true);
    };

    const confirmQuitExam = () => {
        if (botIntervalId) clearInterval(botIntervalId);
        sessionStorage.removeItem('active_exam_session');
        sessionStorage.removeItem('active_exam_progress');
        toast({
            title: 'Exam Quit',
            description: 'You have quit the examination session.'
        });
        router.push('/cbt-simulator/select-subjects');
    };

    const isPracticeMode = sessionData.mode === 'Bank Transfer' || sessionData.mode === 'Practice Mode';
    const isSpeedBattle = sessionData.mode === 'Card' || sessionData.mode === 'Speed Battle';
    const totalExamQuestions = sessionData.subjects.reduce((sum: number, s: any) => sum + s.questions.length, 0);

    if (isSubmitted && scoreSummary) {
        return (
            <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500 pb-16 px-6">
                <Card className="border-[0.5px] border-border/40 bg-card/40 backdrop-blur-md shadow-xl rounded-2xl p-6 text-center">
                    <CardHeader className="items-center pb-2">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-2 border border-primary/20 animate-bounce">
                            <Award className="h-10 w-10 text-primary" />
                        </div>
                        <CardTitle className="text-3xl font-extrabold">CBT Simulator Results</CardTitle>
                        <CardDescription>Examination Code: <span className="font-mono font-bold text-foreground">{sessionData.receiptNumber}</span></CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-4">
                        <div className="flex justify-center gap-12 flex-wrap">
                            <div className="p-4 bg-muted/30 border rounded-2xl min-w-[150px] shadow-sm">
                                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Aggregate Score</span>
                                <span className="text-4xl font-extrabold text-primary mt-1 block">{scoreSummary.finalScore} <span className="text-lg text-muted-foreground">/ {scoreSummary.maxScoreScale}</span></span>
                            </div>
                            <div className="p-4 bg-muted/30 border rounded-2xl min-w-[150px] shadow-sm">
                                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Success Rate</span>
                                <span className="text-4xl font-extrabold text-foreground mt-1 block">{scoreSummary.finalPercentage}%</span>
                            </div>
                        </div>

                        <Progress value={scoreSummary.finalPercentage} className="h-3 w-full max-w-md mx-auto rounded-full bg-muted shadow-inner" />

                        <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto text-sm pt-2">
                            <div className="text-center p-2 border rounded-xl bg-green-500/10 border-green-500/20 text-green-600">
                                <span className="block font-bold">{scoreSummary.correctCount}</span>
                                <span className="text-[10px] uppercase font-semibold">Correct</span>
                            </div>
                            <div className="text-center p-2 border rounded-xl bg-red-500/10 border-red-500/20 text-red-600">
                                <span className="block font-bold">{scoreSummary.incorrectCount}</span>
                                <span className="text-[10px] uppercase font-semibold">Incorrect</span>
                            </div>
                            <div className="text-center p-2 border rounded-xl bg-slate-500/10 border-slate-500/20 text-slate-600">
                                <span className="block font-bold">{scoreSummary.unansweredCount}</span>
                                <span className="text-[10px] uppercase font-semibold">Left</span>
                            </div>
                        </div>

                        <Separator className="my-6" />

                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-left flex items-center gap-2"><FileText className="text-primary h-5 w-5" /> Subject Performance Details</h3>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {scoreSummary.subjectBreakdown.map((sub: any) => (
                                    <div key={sub.name} className="flex justify-between items-center p-3.5 border rounded-xl bg-background/50 hover:bg-background/80 transition-colors shadow-sm">
                                        <div>
                                            <span className="font-semibold text-sm">{sub.name}</span>
                                            <span className="text-xs text-muted-foreground block mt-1">Correct: {sub.correct} | Wrong: {sub.incorrect}</span>
                                        </div>
                                        <Badge className="text-xs h-7 px-3 bg-primary/20 text-primary border-primary/30" variant="outline">{sub.score} / 100</Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-center gap-4 pt-6">
                        <Button variant="outline" onClick={() => router.push('/dashboard')} className="min-w-[150px] hover:bg-muted hover:text-foreground"><Home className="mr-2 h-4 w-4" /> Go Dashboard</Button>
                        <Button onClick={() => {
                            sessionStorage.removeItem('active_exam_session');
                            router.push('/cbt-simulator/select-subjects');
                        }} className="min-w-[150px]"><RotateCcw className="mr-2 h-4 w-4" /> Retake Test</Button>
                    </CardFooter>
                </Card>

                {/* Question Review Section */}
                <Card className="border-[0.5px] border-border/40 bg-card/40 backdrop-blur-md shadow-xl rounded-2xl p-6">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold flex items-center gap-2"><CheckCircle2 className="text-primary h-5 w-5" /> Review Exam Solutions</CardTitle>
                        <CardDescription>Scroll through all questions to review correct answers and tutors explanations.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8 pt-4">
                        {sessionData.subjects.map((sub: any) => (
                            <div key={sub.name} className="space-y-4">
                                <h3 className="text-md font-bold uppercase tracking-wider text-primary border-b pb-1 flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> {sub.name}</h3>
                                {sub.questions.map((q: any, idx: number) => {
                                    const userAnswer = answers[sub.name]?.[idx];
                                    const isCorrect = userAnswer === q.correctAnswer;
                                    return (
                                        <div key={q.id} className="p-4 rounded-xl border bg-background/30 space-y-3">
                                            <div className="flex justify-between items-start gap-2">
                                                <span className="font-semibold text-sm">Question {idx + 1}</span>
                                                {userAnswer ? (
                                                    isCorrect ? (
                                                        <Badge variant="outline" className="bg-green-500/10 border-green-500/20 text-green-600 text-[10px]">Correct</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-red-500/10 border-red-500/20 text-red-600 text-[10px]">Incorrect</Badge>
                                                    )
                                                ) : (
                                                    <Badge variant="outline" className="bg-slate-500/10 border-slate-500/20 text-slate-600 text-[10px]">Unanswered</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm font-medium leading-relaxed">{q.questionText}</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                                {q.options.map((opt: string, optIdx: number) => {
                                                    const letter = String.fromCharCode(65 + optIdx);
                                                    const isOptCorrect = letter === q.correctAnswer;
                                                    const isOptChosen = letter === userAnswer;
                                                    return (
                                                        <div key={letter} className={cn(
                                                            "p-2.5 rounded-lg border",
                                                            isOptCorrect && "bg-green-500/10 border-green-500/30 text-green-600 font-medium",
                                                            isOptChosen && !isOptCorrect && "bg-red-500/10 border-red-500/30 text-red-600"
                                                        )}>
                                                            <strong className="mr-1.5">{letter}.</strong> {opt}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            {q.explanation && (
                                                <div className="text-xs p-3 bg-muted/40 rounded-lg border border-border/50 text-muted-foreground mt-2 leading-relaxed">
                                                    <strong>Tutor's Explanation:</strong> {q.explanation}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        );
    }

    const currentAnswer = answers[currentSubject.name]?.[currentQuestionIndex] || '';
    const isQuestionFlagged = flags[currentSubject.name]?.includes(currentQuestionIndex);

    return (
        <div className="grid lg:grid-cols-4 gap-6 pb-16 max-w-[1440px] mx-auto px-6 h-[calc(100vh-140px)]">
            {/* Left Exam Pane */}
            <div className="lg:col-span-3 flex flex-col justify-between h-full space-y-4">
                {/* Exam Navigation Header */}
                <div className="flex items-center justify-between p-4 bg-card border rounded-2xl shadow-sm">
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 capitalize font-medium text-xs py-0.5 px-2">
                            {sessionData.mode === 'Invoice' ? 'Offline Study' : (sessionData.mode === 'Card' ? 'Speed Battle' : sessionData.mode)}
                        </Badge>
                        <span className="text-xs text-muted-foreground hidden sm:inline">Slip Ref: {sessionData.receiptNumber}</span>
                    </div>

                    <div className="flex items-center gap-6">
                        {isSpeedBattle && (
                            <div className="flex items-center gap-2">
                                <Bot className="h-4 w-4 text-primary animate-pulse" />
                                <span className="text-xs font-semibold">Bot: {botProgress} / {totalExamQuestions}</span>
                                <Progress value={(botProgress / totalExamQuestions) * 100} className="w-16 h-1.5 rounded-full" />
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleParkTest}
                                className="text-xs font-bold rounded-xl h-9 border border-primary/20 text-primary hover:bg-primary/10 hover:text-primary gap-1.5"
                            >
                                <History className="h-3.5 w-3.5" />
                                Park Test
                            </Button>

                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleQuitExam}
                                className="text-xs font-bold rounded-xl h-9 border border-red-500/20 text-red-600 hover:bg-red-50 hover:text-red-700 gap-1.5"
                            >
                                <X className="h-3.5 w-3.5" />
                                Quit Exam
                            </Button>
                        </div>

                        <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg px-3 py-1 text-sm font-bold font-mono">
                            <Clock className="h-4 w-4" />
                            <span>{formattedTime()}</span>
                        </div>
                    </div>
                </div>

                {/* Subject Selector Tabs */}
                <div className="flex gap-1.5 overflow-x-auto p-1.5 bg-muted/30 border rounded-2xl scrollbar-none">
                    {sessionData.subjects.map((sub: any, idx: number) => (
                        <button
                            key={sub.name}
                            onClick={() => {
                                setCurrentSubjectIndex(idx);
                                setCurrentQuestionIndex(0);
                            }}
                            className={cn(
                                "flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 shrink-0 uppercase tracking-wider",
                                currentSubjectIndex === idx
                                    ? "bg-card text-foreground shadow-sm border-[0.5px]"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <BookOpen className="h-4 w-4" />
                            {sub.name}
                        </button>
                    ))}
                </div>

                {/* Question Area Card */}
                <Card className="flex-1 border-[0.5px] border-border/40 bg-card/40 backdrop-blur-md shadow-md rounded-2xl flex flex-col justify-between p-6">
                    <CardHeader className="p-0 pb-4 flex flex-row justify-between items-start gap-4">
                        <div>
                            <CardTitle className="text-lg font-bold text-primary">Question {currentQuestionIndex + 1}</CardTitle>
                            <CardDescription>Selected subject: {currentSubject.name}</CardDescription>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleFlagQuestion}
                            className={cn(
                                "h-8 border hover:bg-muted/80 hover:text-foreground rounded-xl",
                                isQuestionFlagged && "text-amber-600 bg-amber-500/10 border-amber-500/20 hover:text-amber-700"
                            )}
                        >
                            <Flag className="h-4 w-4 mr-1.5" /> {isQuestionFlagged ? 'Flagged' : 'Flag'}
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 flex flex-col justify-center space-y-6 py-4">
                        <p className="text-base sm:text-lg font-semibold leading-relaxed text-foreground/90">
                            {currentQuestion ? currentQuestion.questionText : 'No question text provided.'}
                        </p>

                        <div className="grid grid-cols-1 gap-3">
                            {currentQuestion?.options.map((opt: string, optIdx: number) => {
                                const letter = String.fromCharCode(65 + optIdx);
                                const isSelected = letter === currentAnswer;
                                return (
                                    <button
                                        key={letter}
                                        onClick={() => handleAnswerSelection(letter)}
                                        className={cn(
                                            "w-full text-left p-4 rounded-xl border text-sm transition-all duration-200 active:scale-[0.99] flex items-center gap-3.5 hover:bg-muted/30 group",
                                            isSelected
                                                ? "bg-primary/10 border-primary ring-1 ring-primary/20 text-foreground font-semibold"
                                                : "bg-background/40 border-border/60 text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <span className={cn(
                                            "h-7 w-7 rounded-lg border text-xs font-bold flex items-center justify-center transition-colors shadow-sm",
                                            isSelected
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-background group-hover:bg-muted"
                                        )}>
                                            {letter}
                                        </span>
                                        <span className="flex-1">{opt}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Practice Mode Explanation Box */}
                        {isPracticeMode && currentAnswer && currentQuestion?.explanation && (
                            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center gap-2 text-xs font-bold text-primary mb-1">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span>Correct Answer: {currentQuestion.correctAnswer}</span>
                                    {currentAnswer === currentQuestion.correctAnswer ? (
                                        <Badge variant="outline" className="bg-green-500/10 border-green-500/20 text-green-600 py-0 text-[9px]">Correct</Badge>
                                    ) : (
                                        <Badge variant="outline" className="bg-red-500/10 border-red-500/20 text-red-600 py-0 text-[9px]">Incorrect</Badge>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    <strong>Hint:</strong> {currentQuestion.explanation}
                                </p>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="p-0 pt-4 flex justify-between gap-4 border-t mt-4">
                        <Button
                            variant="outline"
                            onClick={handlePrevQuestion}
                            disabled={currentSubjectIndex === 0 && currentQuestionIndex === 0}
                            className="rounded-xl px-4 hover:bg-muted hover:text-foreground"
                        >
                            <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                        </Button>
                        <Button
                            onClick={handleNextQuestion}
                            disabled={currentSubjectIndex === totalSubjects - 1 && currentQuestionIndex === totalSubjectQuestions - 1}
                            className="rounded-xl px-4"
                        >
                            Next <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            {/* Right Control Drawer */}
            <Card className="lg:col-span-1 border-[0.5px] border-border/40 bg-card/40 backdrop-blur-md shadow-md rounded-2xl flex flex-col justify-between p-5 h-full overflow-hidden">
                <div className="space-y-5 flex-1 flex flex-col overflow-hidden">
                    <CardHeader className="p-0">
                        <CardTitle className="text-base font-bold flex items-center gap-1.5"><HelpCircle className="h-5 w-5 text-primary" /> Question Grid</CardTitle>
                        <CardDescription>Click to jump to a question directly.</CardDescription>
                    </CardHeader>

                    <div className="flex-1 overflow-y-auto pr-1 scrollbar-none hover:scrollbar-thin space-y-4">
                        {sessionData.subjects.map((sub: any, subIdx: number) => (
                            <div key={sub.name} className="space-y-2">
                                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
                                    <BookOpen className="h-3 w-3 text-primary" /> {sub.name}
                                </h4>
                                <div className="grid grid-cols-5 gap-1.5">
                                    {sub.questions.map((_: any, idx: number) => {
                                        const isAnswered = answers[sub.name]?.[idx] !== undefined;
                                        const isFlagged = flags[sub.name]?.includes(idx);
                                        const isCurrent = subIdx === currentSubjectIndex && idx === currentQuestionIndex;

                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    setCurrentSubjectIndex(subIdx);
                                                    setCurrentQuestionIndex(idx);
                                                }}
                                                className={cn(
                                                    "h-8 w-8 rounded-lg text-xs font-bold transition-all duration-200 border flex items-center justify-center active:scale-90",
                                                    isCurrent
                                                        ? "border-primary ring-2 ring-primary/20 bg-background text-primary"
                                                        : isFlagged
                                                            ? "bg-amber-500/10 border-amber-500/30 text-amber-600"
                                                            : isAnswered
                                                                ? "bg-green-500/10 border-green-500/30 text-green-600"
                                                                : "bg-muted/40 border-border/40 text-muted-foreground hover:bg-muted"
                                                )}
                                            >
                                                {idx + 1}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-4 border-t space-y-3 mt-4 shrink-0">
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground pb-2">
                        <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-green-500/10 border border-green-500/30 inline-block" /> Answered</div>
                        <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amber-500/10 border border-amber-500/30 inline-block" /> Flagged</div>
                    </div>
                    <Button onClick={() => handleSubmitExam()} className="w-full rounded-xl h-11 text-md font-bold shadow-md hover:shadow-lg hover:scale-102 active:scale-98 transition-all">
                        Submit Examination
                    </Button>
                </div>
            </Card>
            {/* Custom Quit Exam Dialog */}
            <AlertDialog open={isQuitDialogOpen} onOpenChange={setIsQuitDialogOpen}>
                <AlertDialogContent className="rounded-2xl max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold flex items-center gap-2 text-destructive">
                            Quit Examination Session?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm">
                            Are you sure you want to quit this exam? Any unsaved progress will be permanently lost. To save your progress, use the <strong>Park Test</strong> button instead.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6 flex gap-2">
                        <AlertDialogCancel className="rounded-xl border border-border">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmQuitExam} 
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl"
                        >
                            Yes, Quit Exam
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
