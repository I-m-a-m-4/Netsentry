'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAcademy } from '@/context/academy-context';
import { 
  Zap, 
  Trophy, 
  Bot, 
  User, 
  Clock, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Sword,
  ShieldAlert,
  Sparkles,
  Timer
} from 'lucide-react';
import Link from 'next/link';

interface BattleQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
}

interface BotConfig {
  id: string;
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  accuracyRate: number; // percentage correct (e.g. 0.40 = 40%)
  speedMs: number; // response time (e.g. 5000 = 5 seconds)
  avatar: string;
}

const BOTS: BotConfig[] = [
  { id: 'bot-easy', name: 'Study Buddy Bot', difficulty: 'Easy', accuracyRate: 0.45, speedMs: 7000, avatar: '🤖' },
  { id: 'bot-medium', name: 'UTME Challenger Bot', difficulty: 'Medium', accuracyRate: 0.72, speedMs: 5000, avatar: '👾' },
  { id: 'bot-hard', name: 'Pinnacle Master Bot', difficulty: 'Hard', accuracyRate: 0.94, speedMs: 3000, avatar: '🛸' },
];

const DEFAULT_QUESTIONS: BattleQuestion[] = [
  {
    id: 'sb-q1',
    questionText: 'Which of the following is a unit of power?',
    options: ['Newton', 'Watt', 'Joule', 'Pascal'],
    correctAnswer: 'Watt'
  },
  {
    id: 'sb-q2',
    questionText: 'Identify the synonym of the word "Pragmatic".',
    options: ['Idealistic', 'Practical', 'Theoretical', 'Impulsive'],
    correctAnswer: 'Practical'
  },
  {
    id: 'sb-q3',
    questionText: 'Solve for x: 3x - 7 = 14.',
    options: ['x = 5', 'x = 6', 'x = 7', 'x = 8'],
    correctAnswer: 'x = 7'
  },
  {
    id: 'sb-q4',
    questionText: 'What is the chemical symbol for Gold?',
    options: ['Au', 'Ag', 'Fe', 'Cu'],
    correctAnswer: 'Au'
  },
  {
    id: 'sb-q5',
    questionText: 'Which organelle is referred to as the powerhouse of the cell?',
    options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi Body'],
    correctAnswer: 'Mitochondria'
  }
];

export default function SpeedBattlesPage() {
  const { academy, currentUserProfile } = useAcademy();
  const firestore = useFirestore();

  // Load custom speed battles config from Firestore
  const battlesQuery = useMemoFirebase(() => query(collection(firestore, 'speed_battles_config')), [firestore]);
  const { data: dbConfig } = useCollection<any>(battlesQuery);

  const questions = React.useMemo(() => {
    if (dbConfig && dbConfig.length > 0 && dbConfig[0].questions) {
      return dbConfig[0].questions as BattleQuestion[];
    }
    return DEFAULT_QUESTIONS;
  }, [dbConfig]);

  const [gameState, setGameState] = React.useState<'setup' | 'battle' | 'results'>('setup');
  const [selectedBotId, setSelectedBotId] = React.useState<string>('bot-medium');
  const [selectedSubject, setSelectedSubject] = React.useState<string>('General Papers');
  
  // Game metrics
  const [currentQuestionIdx, setCurrentQuestionIdx] = React.useState(0);
  const [playerScore, setPlayerScore] = React.useState(0);
  const [botScore, setBotScore] = React.useState(0);
  const [timeLeft, setTimeLeft] = React.useState(20);
  const [playerAnswered, setPlayerAnswered] = React.useState(false);
  const [botAnsweredStatus, setBotAnsweredStatus] = React.useState<'idle' | 'answered'>('idle');
  const [playerSelectedOption, setPlayerSelectedOption] = React.useState<string | null>(null);
  
  // Timers and simulation
  const botTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const selectedBot = BOTS.find(b => b.id === selectedBotId) || BOTS[1];

  const handleStartBattle = () => {
    setGameState('battle');
    setCurrentQuestionIdx(0);
    setPlayerScore(0);
    setBotScore(0);
    startQuestionRound(0);
  };

  const startQuestionRound = (idx: number) => {
    setTimeLeft(20);
    setPlayerAnswered(false);
    setBotAnsweredStatus('idle');
    setPlayerSelectedOption(null);

    // Start Timer countdown
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current!);
          handleRoundTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Simulate Bot answering process
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    
    // Bot takes some random offset of speed
    const botResponseDelay = Math.max(2000, selectedBot.speedMs + (Math.random() * 2000 - 1000));
    botTimerRef.current = setTimeout(() => {
      const currentQuestion = questions[idx];
      if (!currentQuestion) return;

      const isBotCorrect = Math.random() < selectedBot.accuracyRate;
      
      setBotAnsweredStatus('answered');
      if (isBotCorrect) {
        setBotScore(prev => prev + 1);
      }
    }, botResponseDelay);
  };

  const handleRoundTimeout = () => {
    // Round ended automatically. Move to next or finish.
    handleNextQuestion();
  };

  const handlePlayerAnswer = (option: string) => {
    if (playerAnswered) return;
    setPlayerAnswered(true);
    setPlayerSelectedOption(option);

    const currentQuestion = questions[currentQuestionIdx];
    if (option === currentQuestion.correctAnswer) {
      setPlayerScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIdx + 1 < questions.length) {
      setCurrentQuestionIdx(prev => prev + 1);
      startQuestionRound(currentQuestionIdx + 1);
    } else {
      endBattle();
    }
  };

  const endBattle = () => {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setGameState('results');

    // Save battle log to firestore
    if (firestore && academy?.id && currentUserProfile) {
      addDoc(collection(firestore, 'speed_battles_logs'), {
        academyId: academy.id,
        studentId: currentUserProfile.id,
        studentName: currentUserProfile.name,
        subject: selectedSubject,
        botName: selectedBot.name,
        botDifficulty: selectedBot.difficulty,
        playerScore,
        botScore,
        won: playerScore > botScore,
        createdAt: serverTimestamp()
      }).catch(err => console.error("Error logging battle:", err));
    }
  };

  React.useEffect(() => {
    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  const getWinnerMessage = () => {
    if (playerScore > botScore) {
      return {
        title: 'Victory! 🏆',
        desc: `You defeated ${selectedBot.name} in the Speed Arena!`,
        color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
      };
    } else if (playerScore < botScore) {
      return {
        title: 'Defeat 💀',
        desc: `${selectedBot.name} outpaced you. Keep practicing!`,
        color: 'text-rose-500 bg-rose-500/10 border-rose-500/20'
      };
    } else {
      return {
        title: 'Draw 🤝',
        desc: 'An even match! Your speed and accuracy are matched.',
        color: 'text-amber-500 bg-amber-500/10 border-amber-500/20'
      };
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
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-orange-400 to-rose-500 bg-clip-text text-transparent">
            Offline Speed Battles
          </h1>
          <p className="text-muted-foreground text-sm">
            Challenge adaptive Pinnacle Bots in a gamified speed-practice test arena.
          </p>
        </div>
      </div>

      {gameState === 'setup' && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Sword className="h-5 w-5 text-orange-500" />
              Prepare for Battle
            </CardTitle>
            <CardDescription>Configure stream subjects and select your robotic challenger</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Subject Selector */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">Select Battle Subject</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {['English Language', 'General Mathematics', 'Physics Prep', 'Chemistry Prep', 'General Papers'].map(subj => {
                  const isSel = subj === selectedSubject;
                  return (
                    <button
                      key={subj}
                      onClick={() => setSelectedSubject(subj)}
                      className={`p-3 rounded-lg border text-xs font-semibold transition-all ${
                        isSel ? 'bg-orange-500/10 border-orange-500 text-orange-600 dark:text-orange-400' : 'bg-card hover:bg-muted/40 border-border/50'
                      }`}
                    >
                      {subj}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Challenger Selector */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">Choose Challenger Bot</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {BOTS.map(bot => {
                  const isSel = bot.id === selectedBotId;
                  return (
                    <div
                      key={bot.id}
                      onClick={() => setSelectedBotId(bot.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSel ? 'bg-rose-500/10 border-rose-500/40 ring-1 ring-rose-500/30' : 'bg-card hover:bg-muted/40 border-border/50'
                      }`}
                    >
                      <div className="text-3xl mb-2">{bot.avatar}</div>
                      <h4 className="font-bold text-sm">{bot.name}</h4>
                      <div className="flex gap-1.5 mt-2">
                        <Badge variant={bot.difficulty === 'Easy' ? 'secondary' : bot.difficulty === 'Medium' ? 'default' : 'destructive'} className="text-[10px] scale-90 px-1 py-0 h-4">
                          {bot.difficulty}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                        Accuracy: {bot.accuracyRate * 100}%<br />
                        Speed: {(bot.speedMs / 1000).toFixed(0)}s avg response
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleStartBattle} className="w-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 font-bold py-6 h-auto text-base">
              Enter Speed Arena
            </Button>
          </CardFooter>
        </Card>
      )}

      {gameState === 'battle' && questions[currentQuestionIdx] && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-4xl mx-auto">
          
          {/* Main Battle Room */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="relative overflow-hidden">
              {/* Timing progress bar */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-muted">
                <div 
                  className="h-full bg-orange-500 transition-all duration-1000 ease-linear"
                  style={{ width: `${(timeLeft / 20) * 100}%` }}
                />
              </div>

              <CardHeader className="pt-6">
                <div className="flex justify-between items-center">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Timer className="h-3 w-3 text-orange-500" />
                    {timeLeft}s Remaining
                  </Badge>

                  <span className="text-xs text-muted-foreground font-bold">
                    Round {currentQuestionIdx + 1} of {questions.length}
                  </span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <h3 className="text-lg font-bold">
                  {questions[currentQuestionIdx].questionText}
                </h3>

                <div className="grid grid-cols-1 gap-3">
                  {questions[currentQuestionIdx].options.map(option => {
                    const isSelected = playerSelectedOption === option;
                    return (
                      <button
                        key={option}
                        onClick={() => handlePlayerAnswer(option)}
                        disabled={playerAnswered}
                        className={`p-4 text-left text-sm rounded-xl border transition-all ${
                          isSelected 
                            ? 'border-orange-500 bg-orange-500/5 font-semibold' 
                            : 'border-border/50 bg-card hover:bg-muted/40'
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </CardContent>

              <CardFooter className="border-t border-border/40 py-3.5 bg-muted/15 justify-end">
                <Button 
                  onClick={handleNextQuestion} 
                  disabled={!playerAnswered && timeLeft > 0}
                  className="bg-primary hover:bg-primary/95"
                >
                  {currentQuestionIdx + 1 < questions.length ? "Next Round" : "Calculate Standings"}
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Real-time score board */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="bg-gradient-to-b from-card to-background">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Sword className="h-4.5 w-4.5 text-rose-500" />
                  Scoreboard Status
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                
                {/* Player Status */}
                <div className="flex items-center justify-between p-3 rounded-lg border bg-background/50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-none">{currentUserProfile?.name || 'You'}</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">Player</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black">{playerScore}</p>
                  </div>
                </div>

                {/* BOT Status */}
                <div className="flex items-center justify-between p-3 rounded-lg border bg-background/50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 text-lg">
                      {selectedBot.avatar}
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-none">{selectedBot.name}</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">Adaptive Bot</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black">{botScore}</p>
                  </div>
                </div>

                {/* Challenger activity telemetry */}
                <div className="p-3.5 rounded-lg border bg-muted/20 text-[10px] leading-relaxed text-muted-foreground flex flex-col justify-center gap-2">
                  <div className="flex justify-between items-center">
                    <span>Bot Status:</span>
                    <Badge variant={botAnsweredStatus === 'answered' ? 'default' : 'secondary'} className="text-[9px] py-0 h-4 scale-90">
                      {botAnsweredStatus === 'answered' ? 'Answered' : 'Thinking...'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Your Status:</span>
                    <Badge variant={playerAnswered ? 'default' : 'secondary'} className="text-[9px] py-0 h-4 scale-90">
                      {playerAnswered ? 'Answered' : 'Waiting...'}
                    </Badge>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

        </div>
      )}

      {gameState === 'results' && (
        <Card className="max-w-md mx-auto text-center relative overflow-hidden">
          <CardHeader className="pb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 border flex items-center justify-center mx-auto text-3xl mb-4">
              🔥
            </div>
            
            {/* Visual verdict box */}
            {(() => {
              const verdict = getWinnerMessage();
              return (
                <div className={`p-4 rounded-xl border mb-2 ${verdict.color}`}>
                  <h2 className="text-2xl font-black">{verdict.title}</h2>
                  <p className="text-sm mt-1">{verdict.desc}</p>
                </div>
              );
            })()}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 border-y py-4 my-2">
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Your Score</p>
                <p className="text-3xl font-black mt-1 text-primary">{playerScore}</p>
                <p className="text-[9px] text-muted-foreground">out of {questions.length}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Bot Score</p>
                <p className="text-3xl font-black mt-1">{botScore}</p>
                <p className="text-[9px] text-muted-foreground">out of {questions.length}</p>
              </div>
            </div>

            <div className="text-xs text-muted-foreground p-3.5 bg-muted/10 border rounded-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              <p className="text-left leading-relaxed">
                Your speed battle results have been computed and synchronized with your Academy Profile. Challenge a higher difficulty bot to gain extra points!
              </p>
            </div>
          </CardContent>
          <CardFooter className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="w-full" onClick={() => setGameState('setup')}>
              Change Settings
            </Button>
            <Button className="w-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600" onClick={handleStartBattle}>
              Battle Again
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
