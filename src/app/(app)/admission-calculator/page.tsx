'use client';

import * as React from 'react';
import { useAcademy } from '@/context/academy-context';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap,
  School,
  Calculator,
  Award,
  Info,
  Save,
  RefreshCw,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Grade point mappings for OAU (A1 = 8, B2 = 7, etc.)
const GRADE_POINTS: Record<string, number> = {
  'A1': 8,
  'B2': 7,
  'B3': 6,
  'C4': 5,
  'C5': 4,
  'C6': 3,
  'D7': 0,
  'E8': 0,
  'F9': 0,
};

const GRADE_LIST = ['A1', 'B2', 'B3', 'C4', 'C5', 'C6', 'D7', 'E8', 'F9'];

// Typical average cut-off marks for competitive courses
const UNIVERSITY_CUTOFFS = {
  UI: [
    { course: 'Medicine & Surgery', cutOff: 80.5 },
    { course: 'Law', cutOff: 75.0 },
    { course: 'Computer Science', cutOff: 72.0 },
    { course: 'Nursing Science', cutOff: 70.5 },
    { course: 'Mechanical Engineering', cutOff: 73.0 },
    { course: 'Economics', cutOff: 72.5 },
  ],
  OAU: [
    { course: 'Medicine & Surgery', cutOff: 79.5 },
    { course: 'Law', cutOff: 74.0 },
    { course: 'Computer Science', cutOff: 71.0 },
    { course: 'Nursing Science', cutOff: 68.5 },
    { course: 'Electrical & Electronic Engineering', cutOff: 72.5 },
    { course: 'Economics', cutOff: 70.0 },
  ]
};

export default function AdmissionCalculatorPage() {
  const { currentUserProfile, triggerRefresh } = useAcademy();
  const firestore = useFirestore();
  const { toast } = useToast();

  // University Selection (UI or OAU)
  const [institution, setInstitution] = React.useState<'UI' | 'OAU'>('UI');

  // Input states
  const [utmeScore, setUtmeScore] = React.useState<number>(0);
  const [postUtmeScore, setPostUtmeScore] = React.useState<number>(0); // UI uses 0-100, OAU uses 0-40

  // O'Level grades (5 subjects, first is English)
  const [oLevelGrades, setOLevelGrades] = React.useState<string[]>(['none', 'none', 'none', 'none', 'none']);

  // Selected target course for comparison
  const [selectedCourse, setSelectedCourse] = React.useState<string>('Medicine & Surgery');
  
  // Loading status for profile updates
  const [isSaving, setIsSaving] = React.useState<boolean>(false);

  // Sync with user profile on mount if available
  React.useEffect(() => {
    if (currentUserProfile) {
      if (currentUserProfile.targetUTMEScore) {
        setUtmeScore(currentUserProfile.targetUTMEScore);
      }
      if (currentUserProfile.targetInstitution) {
        const inst = currentUserProfile.targetInstitution.toLowerCase();
        if (inst.includes('ibadan') || inst.includes('ui')) {
          setInstitution('UI');
        } else if (inst.includes('awolowo') || inst.includes('oau') || inst.includes('ife')) {
          setInstitution('OAU');
        }
      }
      if (currentUserProfile.targetCourse) {
        // Match target course if it exists in cut-offs
        const availableCourses = institution === 'UI' ? UNIVERSITY_CUTOFFS.UI : UNIVERSITY_CUTOFFS.OAU;
        const matched = availableCourses.find(c => c.course.toLowerCase().includes(currentUserProfile.targetCourse!.toLowerCase()));
        if (matched) {
          setSelectedCourse(matched.course);
        }
      }
    }
  }, [currentUserProfile, institution]);

  // Adjust Post-UTME default scale when university selection changes
  React.useEffect(() => {
    setPostUtmeScore(0);
  }, [institution]);

  // Calculations
  const calculations = React.useMemo(() => {
    // 1. JAMB Contribution (out of 50)
    const utmeContribution = Number((utmeScore / 8).toFixed(2));

    // 2. Post-UTME Contribution
    let postUtmeContribution = 0;
    if (institution === 'UI') {
      // UI: Graded / 100, contributes 50% (divide score by 2)
      postUtmeContribution = Number((postUtmeScore / 2).toFixed(2));
    } else {
      // OAU: Graded / 40, contributes 40% (used directly)
      postUtmeContribution = Number(postUtmeScore.toFixed(2));
    }

    // 3. O'Level Contribution (OAU only, contributes 10%)
    let oLevelContribution = 0;
    let totalPoints = 0;
    if (institution === 'OAU') {
      oLevelGrades.forEach(grade => {
        if (grade) {
          totalPoints += GRADE_POINTS[grade] || 0;
        }
      });
      // (Total points of best 5 subjects) / 4. Max: 40 points / 4 = 10%
      oLevelContribution = Number((totalPoints / 4).toFixed(2));
    }

    // 4. Overall Aggregate
    const aggregate = Number((utmeContribution + postUtmeContribution + oLevelContribution).toFixed(2));

    return {
      utmeContribution,
      postUtmeContribution,
      oLevelContribution,
      oLevelTotalPoints: totalPoints,
      aggregate
    };
  }, [institution, utmeScore, postUtmeScore, oLevelGrades]);

  // Find cut-off for currently selected course
  const currentCourseCutoff = React.useMemo(() => {
    const cutoffs = institution === 'UI' ? UNIVERSITY_CUTOFFS.UI : UNIVERSITY_CUTOFFS.OAU;
    return cutoffs.find(c => c.course === selectedCourse) || cutoffs[0];
  }, [institution, selectedCourse]);

  // Grade adjustment helper
  const handleGradeChange = (index: number, value: string) => {
    const updated = [...oLevelGrades];
    updated[index] = value;
    setOLevelGrades(updated);
  };

  // Reset calculator to defaults
  const handleReset = () => {
    setUtmeScore(0);
    setPostUtmeScore(0);
    setOLevelGrades(['none', 'none', 'none', 'none', 'none']);
  };

  // Save targets to user profile
  const handleSaveToProfile = async () => {
    if (!currentUserProfile || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Action Denied',
        description: 'You need to be logged in to sync with your profile.'
      });
      return;
    }

    setIsSaving(true);
    try {
      const userRef = doc(firestore, 'users', currentUserProfile.id);
      const mappedInstitution = institution === 'UI' ? 'University of Ibadan (UI)' : 'Obafemi Awolowo University (OAU)';

      await updateDoc(userRef, {
        targetUTMEScore: utmeScore,
        targetInstitution: mappedInstitution,
        targetCourse: selectedCourse,
      });

      toast({
        variant: 'success',
        title: 'Goals Synced!',
        description: 'Your target parameters have been successfully saved to your student profile.'
      });

      if (triggerRefresh) triggerRefresh();
    } catch (e: any) {
      console.error('Error updating profile targets:', e);
      toast({
        variant: 'destructive',
        title: 'Sync Failed',
        description: 'Could not sync goals online. We will save it locally.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Comparative status feedback color
  const difference = calculations.aggregate - currentCourseCutoff.cutOff;
  const statusColorClass = difference >= 0 
    ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
    : difference >= -5
    ? 'text-amber-500 bg-amber-500/10 border-amber-500/20'
    : 'text-rose-500 bg-rose-500/10 border-rose-500/20';

  return (
    <div className="space-y-8 p-1 sm:p-4">
      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
            Admission Aggregate Calculator
          </h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Calculate your aggregate admission score dynamically for UI and OAU.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} className="border-border/50 bg-card/20 hover:bg-muted/40">
            <RefreshCw className="h-4 w-4 mr-2" /> Reset
          </Button>
          {currentUserProfile && (
            <Button size="sm" onClick={handleSaveToProfile} disabled={isSaving} className="bg-primary/90 hover:bg-primary">
              {isSaving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Target to Profile
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Input parameters (7 cols on large) */}
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                Admission Formula Inputs
              </CardTitle>
              <CardDescription>Configure your scores and select grades for calculation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              
              {/* Institution toggle via standard design-system tabs */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground">Select Institution Formula</label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={institution === 'UI' ? 'default' : 'outline'}
                    onClick={() => setInstitution('UI')}
                    className="flex items-center gap-2 justify-center py-6 h-auto"
                  >
                    <School className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-bold text-sm">University of Ibadan (UI)</div>
                      <div className="text-[10px] opacity-80 font-normal">50:50 ratio (UTME + Post-UTME)</div>
                    </div>
                  </Button>
                  <Button
                    variant={institution === 'OAU' ? 'default' : 'outline'}
                    onClick={() => setInstitution('OAU')}
                    className="flex items-center gap-2 justify-center py-6 h-auto"
                  >
                    <GraduationCap className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-bold text-sm">Obafemi Awolowo Univ. (OAU)</div>
                      <div className="text-[10px] opacity-80 font-normal">50:40:10 ratio</div>
                    </div>
                  </Button>
                </div>
              </div>

              {/* JAMB UTME Score Input */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-sm font-semibold text-foreground">JAMB Score</span>
                  </div>
                  <div className="w-20">
                    <Input
                      type="number"
                      min={0}
                      max={400}
                      value={utmeScore || ''}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(400, Number(e.target.value)));
                        setUtmeScore(val);
                      }}
                      className="text-center font-bold text-primary bg-muted/20 border-border/50"
                    />
                  </div>
                </div>
                <Slider
                  min={0}
                  max={400}
                  step={1}
                  value={[utmeScore]}
                  onValueChange={(val) => setUtmeScore(val[0])}
                />
              </div>

              {/* Post-UTME Score Input */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-sm font-semibold text-foreground">Post-UTME Score</span>
                  </div>
                  <div className="w-20">
                    <Input
                      type="number"
                      min={0}
                      max={institution === 'UI' ? 100 : 40}
                      value={postUtmeScore || ''}
                      onChange={(e) => {
                        const maxVal = institution === 'UI' ? 100 : 40;
                        const val = Math.max(0, Math.min(maxVal, Number(e.target.value)));
                        setPostUtmeScore(val);
                      }}
                      className="text-center font-bold text-primary bg-muted/20 border-border/50"
                    />
                  </div>
                </div>
                <Slider
                  min={0}
                  max={institution === 'UI' ? 100 : 40}
                  step={0.5}
                  value={[postUtmeScore]}
                  onValueChange={(val) => setPostUtmeScore(val[0])}
                />
              </div>

              {/* O'Level Grade Configurator (OAU Only) */}
              {institution === 'OAU' && (
                <div className="space-y-4 pt-4 border-t border-border/10">
                  <div className="space-y-1">
                    <span className="text-sm font-semibold text-foreground">
                      O'Level Grades (Compulsory English + best 4 subjects)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
                    
                    {/* Compulsory English Grade */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">1. English (Comp.)</label>
                      <Select value={oLevelGrades[0]} onValueChange={(val) => handleGradeChange(0, val)}>
                        <SelectTrigger className="bg-card/40 border-border/50 font-bold">
                          <SelectValue placeholder="English" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Select Grade</SelectItem>
                          {GRADE_LIST.map(grade => (
                            <SelectItem key={`eng-${grade}`} value={grade} className="font-mono">
                              {grade} ({GRADE_POINTS[grade]} pts)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Subject 2 Grade */}
                    {['2nd Subject', '3rd Subject', '4th Subject', '5th Subject'].map((subj, idx) => (
                      <div key={subj} className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{idx + 2}. {subj}</label>
                        <Select value={oLevelGrades[idx + 1]} onValueChange={(val) => handleGradeChange(idx + 1, val)}>
                          <SelectTrigger className="bg-card/40 border-border/50 font-bold">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Select Grade</SelectItem>
                            {GRADE_LIST.map(grade => (
                              <SelectItem key={`${subj}-${grade}`} value={grade} className="font-mono">
                                {grade} ({GRADE_POINTS[grade]} pts)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}

                  </div>

                  {/* Quick O'Level Stats */}
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10 text-[11px] text-primary">
                    <Info className="h-4.5 w-4.5 shrink-0" />
                    <span>
                      Selected subjects accumulated <strong>{calculations.oLevelTotalPoints}</strong> grade points. Calculated value contribution: <strong>{calculations.oLevelContribution}%</strong> out of 10% target weight.
                    </span>
                  </div>

                </div>
              )}

            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Results, breakdowns & comparison (5 cols on large) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main Results Card */}
          <Card className="relative">
            <div className="absolute top-0 right-0 p-4">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-bold uppercase tracking-wider text-[10px]">
                {institution} Score Mode
              </Badge>
            </div>
            
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-muted-foreground">Computed Aggregate</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pt-2 pb-6">
              
              {/* Giant visual score indicator */}
              <div className="relative flex items-center justify-center w-40 h-40 rounded-full border-4 border-primary/20 bg-primary/5 mb-4 shadow-inner">
                {/* Visual glowing back drop */}
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 blur-sm" />
                
                <div className="text-center z-10">
                  <span className="text-5xl font-black text-foreground tracking-tight">{calculations.aggregate}</span>
                  <span className="text-sm font-semibold text-muted-foreground block mt-1">%</span>
                </div>
              </div>

              {/* Status Rating Badge */}
              <div className={cn("px-3 py-1 rounded-full text-xs font-semibold border mb-4", statusColorClass)}>
                {difference >= 0 
                  ? "Exceeds Target Cut-off 🎉"
                  : difference >= -3
                  ? "Highly Competitive Zone 👍"
                  : "Target Gap Exists 📈"}
              </div>

              {/* Progress visual comparison bar */}
              <div className="w-full space-y-2">
                <div className="flex justify-between text-xs font-medium text-muted-foreground px-0.5">
                  <span>Your Score: {calculations.aggregate}%</span>
                  <span>Target Course Cut-off: {currentCourseCutoff.cutOff}%</span>
                </div>
                <div className="relative w-full h-3 bg-muted/40 rounded-full overflow-hidden border border-border/20">
                  {/* Current Score Bar */}
                  <div
                    className={cn(
                      "absolute top-0 left-0 h-full rounded-full transition-all duration-500",
                      difference >= 0 ? "bg-gradient-to-r from-primary to-emerald-500" : "bg-gradient-to-r from-primary to-primary"
                    )}
                    style={{ width: `${Math.min(100, calculations.aggregate)}%` }}
                  />
                  {/* Target Cutoff Marker */}
                  <div 
                    className="absolute top-0 h-full w-1 bg-rose-500 transition-all duration-500 z-10"
                    style={{ left: `${currentCourseCutoff.cutOff}%` }}
                    title={`Cutoff: ${currentCourseCutoff.cutOff}%`}
                  />
                </div>
                <div className="flex items-center gap-1.5 justify-center pt-2 text-xs">
                  {difference >= 0 ? (
                    <span className="text-emerald-500 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      +{difference.toFixed(2)} points clear of cut-off!
                    </span>
                  ) : (
                    <span className="text-rose-400 font-semibold flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Need {Math.abs(difference).toFixed(2)} more points for safety.
                    </span>
                  )}
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Breakdown & Course Reference Table */}
          <Card>
            <CardHeader className="border-b border-border/10 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <TrendingUp className="h-4.5 w-4.5 text-primary" />
                Score Breakdown & Target Benchmarks
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              
              {/* Aggregate formula breakdowns */}
              <div className="grid grid-cols-3 divide-x divide-border/10 border-b border-border/10 text-center py-4 bg-muted/10">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">UTME (50%)</span>
                  <span className="text-lg font-bold text-primary block mt-1">{calculations.utmeContribution}</span>
                  <span className="text-[9px] text-muted-foreground block mt-0.5">({utmeScore} / 8)</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                    Post-UTME ({institution === 'UI' ? '50%' : '40%'})
                  </span>
                  <span className="text-lg font-bold text-primary block mt-1">{calculations.postUtmeContribution}</span>
                  <span className="text-[9px] text-muted-foreground block mt-0.5">
                    ({postUtmeScore} {institution === 'UI' ? '/ 2' : 'directly'})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">O'Level (10%)</span>
                  <span className="text-lg font-bold text-primary block mt-1">
                    {institution === 'OAU' ? calculations.oLevelContribution : '—'}
                  </span>
                  <span className="text-[9px] text-muted-foreground block mt-0.5">
                    {institution === 'OAU' ? `(${calculations.oLevelTotalPoints} pts / 4)` : 'N/A for UI'}
                  </span>
                </div>
              </div>

              {/* Course Benchmarks Table */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Select Target Course for Comparison:</span>
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger className="w-[180px] h-8 text-xs bg-muted/20 border-border/50">
                      <SelectValue placeholder="Select Course" />
                    </SelectTrigger>
                    <SelectContent>
                      {(institution === 'UI' ? UNIVERSITY_CUTOFFS.UI : UNIVERSITY_CUTOFFS.OAU).map(item => (
                        <SelectItem key={item.course} value={item.course} className="text-xs">
                          {item.course}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-lg border border-border/30 overflow-hidden bg-card/25">
                  <div className="grid grid-cols-12 bg-muted/30 py-2 px-3 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    <div className="col-span-8">Course Program</div>
                    <div className="col-span-4 text-right">Avg Cut-off</div>
                  </div>
                  
                  <div className="divide-y divide-border/10 text-xs">
                    {(institution === 'UI' ? UNIVERSITY_CUTOFFS.UI : UNIVERSITY_CUTOFFS.OAU).map(item => (
                      <div
                        key={item.course}
                        onClick={() => setSelectedCourse(item.course)}
                        className={cn(
                          "grid grid-cols-12 py-2.5 px-3 cursor-pointer transition-colors items-center",
                          selectedCourse === item.course
                            ? "bg-primary/10 text-foreground font-semibold"
                            : "hover:bg-muted/10 text-muted-foreground"
                        )}
                      >
                        <div className="col-span-8 flex items-center gap-1.5">
                          {selectedCourse === item.course && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                          {item.course}
                        </div>
                        <div className="col-span-4 text-right font-mono font-bold text-foreground">
                          {item.cutOff}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Practical Advice Banner */}
                {difference < 0 && (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[11px] text-amber-500/90 leading-relaxed">
                    <HelpCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                    <div>
                      <strong>Bridging the target gap:</strong> To secure admission for {selectedCourse} with your target {utmeScore} JAMB score, you need a minimum of 
                      <strong> {institution === 'UI' ? (currentCourseCutoff.cutOff * 2 - utmeScore / 4).toFixed(1) : (currentCourseCutoff.cutOff - utmeScore / 8 - calculations.oLevelContribution).toFixed(1)}</strong> in your Post-UTME. Use our CBT Simulator's dedicated Post-UTME Practice Mode to maximize your performance.
                    </div>
                  </div>
                )}

              </div>

            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
