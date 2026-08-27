'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { 
  BookOpen, 
  CheckCircle2, 
  HelpCircle, 
  ChevronRight, 
  Users, 
  Award, 
  Sparkles, 
  BookMarked,
  ArrowLeft,
  GraduationCap
} from 'lucide-react';
import Link from 'next/link';

interface NovelQuizQuestion {
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface Chapter {
  id: string;
  title: string;
  summary: string;
  characters?: string[];
  quiz?: NovelQuizQuestion[];
}

interface Novel {
  id: string;
  title: string;
  author: string;
  description: string;
  imageUrl?: string;
  examType: 'JAMB' | 'WAEC' | 'NECO';
  chapters: Chapter[];
}

const FALLBACK_NOVELS: Novel[] = [
  {
    id: 'life-changer',
    title: 'The Life Changer',
    author: 'Khadija Abubakar Jalli',
    examType: 'JAMB',
    description: 'The official JAMB UTME recommended English novel following university admission life lessons and moral guide.',
    chapters: [
      {
        id: 'lc-ch1',
        title: 'Chapter 1: The Admission & Family Discussion',
        summary: 'Bint recounts her classroom experience and her mother\'s advice on behavior. The family gathers to discuss university admission as Salma enters university.',
        characters: ['Bint', 'Ummi (Mother)', 'Salma', 'Dad'],
        quiz: [
          {
            questionText: 'Who is the youngest child in the family?',
            options: ['Salma', 'Bint', 'Omar', 'Teemah'],
            correctAnswer: 'Bint',
            explanation: 'Bint is the youngest daughter who shares her classroom encounter with her teacher.'
          },
          {
            questionText: 'What is the main topic discussed in Chapter 1?',
            options: ['University examination', 'Family life and school entry advice', 'Social media issues', 'Exam malpractice'],
            correctAnswer: 'Family life and school entry advice',
            explanation: 'Chapter 1 focuses on Ummi advising her children about life, education, and moral uprightness.'
          }
        ]
      },
      {
        id: 'lc-ch2',
        title: 'Chapter 2: The University Registration Grid',
        summary: 'Salma faces difficulties during registration, encountering long queues and meeting characters like Samuel and Labaran.',
        characters: ['Salma', 'Samuel', 'Labaran'],
        quiz: [
          {
            questionText: 'Who assisted Salma in fast-tracking her registration queue?',
            options: ['Samuel', 'Labaran', 'Dr. Kabir', 'Tomiwa'],
            correctAnswer: 'Samuel',
            explanation: 'Samuel assists Salma and helps her navigate the stressful registration process.'
          }
        ]
      }
    ]
  },
  {
    id: 'sweet-sixteen',
    title: 'Sweet Sixteen',
    author: 'Bolaji Abdullahi',
    examType: 'WAEC',
    description: 'A coming-of-age story centered around Aliya and her father\'s letter on her sixteenth birthday discussing life, relationship, and values.',
    chapters: [
      {
        id: 'ss-ch1',
        title: 'Chapter 1: The Birthday Letter',
        summary: 'Aliya receives a deep personal letter from her father on her 16th birthday touching on self-identity, relationships, and maturity.',
        characters: ['Aliya', 'Mr. Bello (Father)', 'Mrs. Bello (Mother)'],
        quiz: [
          {
            questionText: 'How old is Aliya when she receives the letter?',
            options: ['15', '16', '17', '18'],
            correctAnswer: '16',
            explanation: 'The book title Sweet Sixteen and Chapter 1 celebrate Aliya\'s sixteenth birthday.'
          }
        ]
      }
    ]
  }
];

export default function TextNovelsPage() {
  const firestore = useFirestore();
  const novelsQuery = useMemoFirebase(() => query(collection(firestore, 'novels')), [firestore]);
  const { data: dbNovels, isLoading } = useCollection<Novel>(novelsQuery);

  const novels = React.useMemo(() => {
    if (!dbNovels || dbNovels.length === 0) return FALLBACK_NOVELS;
    return dbNovels;
  }, [dbNovels]);

  const [selectedNovelId, setSelectedNovelId] = React.useState<string>(novels[0]?.id || 'life-changer');
  const [selectedChapterId, setSelectedChapterId] = React.useState<string | null>(null);
  
  // Progress state
  const [readChapters, setReadChapters] = React.useState<Record<string, boolean>>({});
  
  // Quiz state
  const [quizActive, setQuizActive] = React.useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = React.useState(0);
  const [selectedOption, setSelectedOption] = React.useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = React.useState<Record<number, boolean>>({});
  const [showExplanation, setShowExplanation] = React.useState(false);
  const [quizScore, setQuizScore] = React.useState<number | null>(null);

  React.useEffect(() => {
    const saved = localStorage.getItem('pinnacle_read_chapters');
    if (saved) {
      try {
        setReadChapters(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const currentNovel = novels.find(n => n.id === selectedNovelId) || novels[0];
  const currentChapter = currentNovel?.chapters.find(c => c.id === selectedChapterId) || null;

  const toggleChapterRead = (chapId: string) => {
    const updated = {
      ...readChapters,
      [chapId]: !readChapters[chapId]
    };
    setReadChapters(updated);
    localStorage.setItem('pinnacle_read_chapters', JSON.stringify(updated));
  };

  const getNovelProgress = (novel: Novel) => {
    if (!novel.chapters || novel.chapters.length === 0) return 0;
    const readCount = novel.chapters.filter(c => readChapters[c.id]).length;
    return Math.round((readCount / novel.chapters.length) * 100);
  };

  const startQuiz = () => {
    setQuizActive(true);
    setCurrentQuestionIdx(0);
    setSelectedOption(null);
    setQuizAnswers({});
    setShowExplanation(false);
    setQuizScore(null);
  };

  const handleAnswerSubmit = () => {
    if (!currentChapter?.quiz || selectedOption === null) return;
    
    const question = currentChapter.quiz[currentQuestionIdx];
    const isCorrect = selectedOption === question.correctAnswer;
    
    setQuizAnswers(prev => ({
      ...prev,
      [currentQuestionIdx]: isCorrect
    }));
    
    setShowExplanation(true);
  };

  const nextQuestion = () => {
    if (!currentChapter?.quiz) return;
    
    if (currentQuestionIdx + 1 < currentChapter.quiz.length) {
      setCurrentQuestionIdx(prev => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      // Calculate score
      const correctCount = Object.values(quizAnswers).filter(Boolean).length;
      setQuizScore(correctCount);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
            Text Novel Summaries
          </h1>
          <p className="text-muted-foreground text-sm">
            Read comprehensive summaries and test your comprehension of official syllabus novels.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Novels & Chapters */}
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Syllabus Novel List</CardTitle>
              <CardDescription>Select a book recommended for JAMB/WAEC prep</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {novels.map(novel => {
                const isActive = novel.id === selectedNovelId;
                const progress = getNovelProgress(novel);
                return (
                  <div
                    key={novel.id}
                    onClick={() => {
                      setSelectedNovelId(novel.id);
                      setSelectedChapterId(novel.chapters?.[0]?.id || null);
                      setQuizActive(false);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-200 ${
                      isActive 
                        ? 'bg-emerald-500/10 border-emerald-500/30' 
                        : 'bg-card hover:bg-muted/40 border-border/50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-sm">{novel.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{novel.author}</p>
                      </div>
                      <Badge variant={novel.examType === 'JAMB' ? 'default' : 'secondary'}>
                        {novel.examType}
                      </Badge>
                    </div>

                    <div className="mt-4 space-y-1.5">
                      <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                        <span>Chapter Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {currentNovel && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Chapters
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                  {currentNovel.chapters?.map((ch, idx) => {
                    const isSelected = ch.id === selectedChapterId;
                    const isRead = readChapters[ch.id];
                    return (
                      <div
                        key={ch.id}
                        onClick={() => {
                          setSelectedChapterId(ch.id);
                          setQuizActive(false);
                        }}
                        className={`flex items-center justify-between p-3.5 cursor-pointer text-sm transition-colors ${
                          isSelected ? 'bg-primary/5 font-semibold text-primary' : 'hover:bg-muted/30'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={!!isRead}
                            onCheckedChange={() => toggleChapterRead(ch.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="truncate max-w-[200px]">{ch.title}</span>
                        </div>
                        {isRead && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Chapter Summary / Practice */}
        <div className="lg:col-span-8">
          {currentChapter ? (
            <div className="space-y-6">
              {/* Summary view */}
              {!quizActive ? (
                <Card className="min-h-[400px] flex flex-col">
                  <CardHeader className="border-b border-border/40 pb-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                          <BookMarked className="h-5.5 w-5.5 text-emerald-500" />
                          {currentChapter.title}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Book: <span className="font-semibold text-foreground">{currentNovel.title}</span> by {currentNovel.author}
                        </CardDescription>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          onClick={() => toggleChapterRead(currentChapter.id)}
                          variant={readChapters[currentChapter.id] ? "outline" : "default"}
                          size="sm"
                          className="h-8 text-xs gap-1.5"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {readChapters[currentChapter.id] ? "Mark Unread" : "Mark as Read"}
                        </Button>

                        {currentChapter.quiz && currentChapter.quiz.length > 0 && (
                          <Button 
                            onClick={startQuiz}
                            variant="secondary" 
                            size="sm"
                            className="h-8 text-xs gap-1.5"
                          >
                            <Award className="h-4 w-4" />
                            Comprehension Quiz
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6 flex-1">
                    <div className="space-y-3">
                      <h3 className="font-bold text-sm text-primary uppercase tracking-wider">Chapter Summary</h3>
                      <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line bg-muted/20 p-4 rounded-xl border">
                        {currentChapter.summary}
                      </p>
                    </div>

                    {currentChapter.characters && currentChapter.characters.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="font-bold text-sm text-primary uppercase tracking-wider flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          Key Characters Mentioned
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {currentChapter.characters.map(char => (
                            <Badge key={char} variant="secondary" className="px-2.5 py-1 text-xs">
                              {char}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                /* Chapter practice quiz */
                <Card className="min-h-[400px] flex flex-col">
                  <CardHeader className="border-b border-border/40 pb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg">Comprehension Check-in</CardTitle>
                        <CardDescription>Verify your knowledge of {currentChapter.title}</CardDescription>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setQuizActive(false)}>
                        Back to Summary
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 flex-1 flex flex-col justify-center">
                    {quizScore === null ? (
                      /* Active Question */
                      currentChapter.quiz && currentChapter.quiz[currentQuestionIdx] && (
                        <div className="space-y-6">
                          <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
                            <span>Question {currentQuestionIdx + 1} of {currentChapter.quiz.length}</span>
                          </div>

                          <h3 className="text-base font-bold">
                            {currentChapter.quiz[currentQuestionIdx].questionText}
                          </h3>

                          <div className="grid grid-cols-1 gap-3">
                            {currentChapter.quiz[currentQuestionIdx].options.map(option => {
                              const isSelected = selectedOption === option;
                              return (
                                <button
                                  key={option}
                                  onClick={() => !showExplanation && setSelectedOption(option)}
                                  disabled={showExplanation}
                                  className={`p-3.5 text-left text-sm rounded-xl border transition-all ${
                                    isSelected 
                                      ? 'border-primary bg-primary/5 font-semibold' 
                                      : 'border-border/50 bg-card hover:bg-muted/40'
                                  }`}
                                >
                                  {option}
                                </button>
                              );
                            })}
                          </div>

                          {showExplanation ? (
                            <div className="space-y-4">
                              <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
                                quizAnswers[currentQuestionIdx] 
                                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                                  : 'bg-rose-500/5 border-rose-500/20 text-rose-600 dark:text-rose-400'
                              }`}>
                                <p className="font-bold flex items-center gap-1.5 mb-1.5">
                                  {quizAnswers[currentQuestionIdx] ? "Correct! 🎉" : "Incorrect ❌"}
                                </p>
                                <p><strong>Rationale:</strong> {currentChapter.quiz[currentQuestionIdx].explanation}</p>
                              </div>
                              
                              <Button className="w-full" onClick={nextQuestion}>
                                {currentQuestionIdx + 1 < currentChapter.quiz.length ? "Next Question" : "Finish Quiz"}
                              </Button>
                            </div>
                          ) : (
                            <Button 
                              className="w-full" 
                              onClick={handleAnswerSubmit}
                              disabled={selectedOption === null}
                            >
                              Check Answer
                            </Button>
                          )}
                        </div>
                      )
                    ) : (
                      /* Quiz Completion View */
                      <div className="text-center py-12 space-y-6 max-w-sm mx-auto">
                        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-500">
                          <Award className="h-10 w-10 animate-bounce" />
                        </div>

                        <div>
                          <h2 className="text-xl font-bold">Quiz Completed!</h2>
                          <p className="text-sm text-muted-foreground mt-1">
                            You scored <strong>{quizScore}</strong> out of <strong>{currentChapter.quiz?.length}</strong> questions correctly.
                          </p>
                        </div>

                        <div className="flex gap-3 justify-center">
                          <Button variant="outline" size="sm" onClick={startQuiz}>
                            Retry Quiz
                          </Button>
                          <Button size="sm" onClick={() => {
                            setQuizActive(false);
                            // Mark chapter as read automatically upon passing
                            if (quizScore === currentChapter.quiz?.length && !readChapters[currentChapter.id]) {
                              toggleChapterRead(currentChapter.id);
                            }
                          }}>
                            Return to Chapter
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card className="min-h-[400px] flex items-center justify-center text-center p-12">
              <div className="max-w-sm space-y-3">
                <BookOpen className="h-12 w-12 text-muted-foreground/45 mx-auto" />
                <h3 className="font-bold text-lg">No Chapters Available</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Please select a book and choose a chapter from the list on the left to read its summary and test your comprehension.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
