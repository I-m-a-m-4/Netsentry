'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAcademy } from '@/context/academy-context';
import { 
  User, 
  Target, 
  School, 
  BookOpen, 
  Award, 
  Trophy, 
  Activity, 
  Sparkles, 
  Save, 
  Edit3,
  CheckCircle2
} from 'lucide-react';
import PageTitle from '@/components/shared/page-title';
import { cn } from '@/lib/utils';

const AVAILABLE_SUBJECTS = [
  'English Language',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Government',
  'Economics',
  'Literature in English',
  'Christian Religious Studies',
  'Islamic Religious Studies',
  'Geography',
  'Agricultural Science',
  'History',
  'Commerce',
  'Financial Accounting'
];

export default function StudentProfilePage() {
  const { currentUserProfile: currentUser, admissions, subjects, triggerRefresh } = useAcademy();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  // Editable fields state
  const [name, setName] = React.useState('');
  const [targetScore, setTargetScore] = React.useState<number>(290);
  const [targetInstitution, setTargetInstitution] = React.useState('');
  const [targetCourse, setTargetCourse] = React.useState('');
  const [department, setDepartment] = React.useState('Science');
  const [selectedSubjects, setSelectedSubjects] = React.useState<string[]>(['English Language']);

  // Sync profile details into state
  React.useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setTargetScore(currentUser.targetUTMEScore || 290);
      setTargetInstitution(currentUser.targetInstitution || '');
      setTargetCourse(currentUser.targetCourse || '');
      setDepartment(currentUser.department || 'Science');
      setSelectedSubjects(currentUser.utmeSubjects || ['English Language']);
    }
  }, [currentUser]);

  // Calculate dynamic stats
  const examsTaken = React.useMemo(() => admissions?.length || 0, [admissions]);
  
  const averageScore = React.useMemo(() => {
    if (!admissions || admissions.length === 0) return 0;
    // Calculate average score percentage from admissions
    const totals = admissions.reduce((sum, r) => sum + (r.total || 0), 0);
    return Math.round(totals / admissions.length);
  }, [admissions]);

  const topicsCovered = React.useMemo(() => {
    return subjects?.filter(s => s.stock > 0).length || 0;
  }, [subjects]);

  const totalTopics = React.useMemo(() => {
    return subjects?.length || 0;
  }, [subjects]);

  const coveragePercent = React.useMemo(() => {
    if (totalTopics === 0) return 0;
    return Math.round((topicsCovered / totalTopics) * 100);
  }, [topicsCovered, totalTopics]);

  const handleSubjectToggle = (subject: string) => {
    if (subject === 'English Language') return; // English is compulsory
    
    setSelectedSubjects(prev => {
      if (prev.includes(subject)) {
        return prev.filter(s => s !== subject);
      } else {
        if (prev.length >= 4) {
          toast({
            variant: 'destructive',
            title: 'Subject Limit',
            description: 'You can only select exactly 4 UTME subjects (including English).',
          });
          return prev;
        }
        return [...prev, subject];
      }
    });
  };

  const handleSaveProfile = async () => {
    if (!firestore || !currentUser?.id) return;
    if (selectedSubjects.length !== 4) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'You must select exactly 4 UTME subjects (including English).',
      });
      return;
    }

    setIsSaving(true);
    try {
      const userRef = doc(firestore, 'users', currentUser.id);
      await updateDoc(userRef, {
        name,
        targetUTMEScore: Number(targetScore),
        targetInstitution,
        targetCourse,
        department,
        utmeSubjects: selectedSubjects,
      });

      toast({
        variant: 'success',
        title: 'Profile Updated',
        description: 'Your student goals and profile have been successfully saved.',
      });
      setIsEditing(false);
      triggerRefresh();
    } catch (err) {
      console.error('Error updating student profile:', err);
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: 'Something went wrong while saving your details.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex flex-col gap-6 p-4 sm:p-6">
        <PageTitle title="Student Profile" subtitle="Manage your goals and track your preparation." />
        <Card className="h-64 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <span className="loading-spinner animate-spin h-8 w-8 border-2 border-primary rounded-full border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading profile...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-1 pb-10">
      <PageTitle title="My Student Profile" subtitle="Define your target scores, choice institution, course details, and track your prep metrics." />

      {/* Profile Header Gradient Card */}
      <Card className="relative overflow-hidden border-none bg-gradient-to-r from-primary/90 to-orange-600 text-white shadow-xl rounded-2xl">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[150%] bg-white/5 rounded-full blur-3xl transform rotate-12" />
        <CardContent className="pt-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <Avatar className="h-20 w-20 border-4 border-white/20 shadow-lg">
              <AvatarFallback className="bg-white text-primary text-2xl font-bold">
                {currentUser.name ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'ST'}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl font-bold tracking-tight">{currentUser.name}</h2>
                <Badge className="bg-white/20 border-0 text-white font-medium text-xs px-2 py-0.5">JAMB Candidate</Badge>
              </div>
              <p className="text-white/80 text-sm mt-1">{currentUser.email}</p>
              <div className="flex flex-wrap gap-4 mt-4 text-xs text-white/90">
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  <span>Target UTME: <strong className="text-white font-bold">{targetScore}</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <School className="h-4 w-4" />
                  <span className="truncate">Dream School: <strong className="text-white font-bold">{targetInstitution || 'Not Set'}</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span className="truncate">Dream Course: <strong className="text-white font-bold">{targetCourse || 'Not Set'}</strong></span>
                </div>
              </div>
            </div>
            <Button 
              variant="secondary" 
              className="bg-white text-primary hover:bg-white/90 font-semibold"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancel Edit' : (
                <>
                  <Edit3 className="mr-2 h-4 w-4" /> Edit Targets
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left/Middle: Info & Edit Area */}
        <div className="md:col-span-2 space-y-6">
          
          {isEditing ? (
            /* Editable Goals Form */
            <Card className="shadow-md border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Set Preparation Targets
                </CardTitle>
                <CardDescription>Customize your exam goals and target subjects. Keep your profile updated for smarter insights.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Display Name</label>
                    <Input 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Target OAU Post UTME Score (40 Max)</label>
                    <Input 
                      type="number"
                      min="0"
                      max="40"
                      value={targetScore}
                      onChange={(e) => setTargetScore(Math.min(40, Math.max(0, Number(e.target.value))))}
                      placeholder="e.g. 320"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Dream Institution</label>
                    <Input 
                      value={targetInstitution}
                      onChange={(e) => setTargetInstitution(e.target.value)}
                      placeholder="e.g. University of Lagos (UNILAG)"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Dream Course</label>
                    <Input 
                      value={targetCourse}
                      onChange={(e) => setTargetCourse(e.target.value)}
                      placeholder="e.g. Medicine & Surgery"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Academic Department</label>
                    <div className="flex gap-2 mt-1">
                      {['Science', 'Art', 'Commercial'].map((dept) => (
                        <Button
                          key={dept}
                          type="button"
                          variant={department === dept ? 'default' : 'outline'}
                          className="flex-1 capitalize font-medium"
                          onClick={() => setDepartment(dept)}
                        >
                          {dept}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Select 4 UTME Subjects</label>
                    <Badge variant="outline" className={cn("text-xs", selectedSubjects.length === 4 ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" : "bg-primary/5 text-primary")}>
                      {selectedSubjects.length} of 4 selected
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {AVAILABLE_SUBJECTS.map((sub) => {
                      const isCompulsory = sub === 'English Language';
                      const isChecked = selectedSubjects.includes(sub);
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => handleSubjectToggle(sub)}
                          className={cn(
                            "flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold text-left transition-all duration-200",
                            isChecked 
                              ? "bg-primary/10 border-primary text-primary" 
                              : "bg-background hover:bg-muted/50 border-border"
                          )}
                        >
                          <CheckCircle2 className={cn("h-4 w-4 shrink-0", isChecked ? "text-primary fill-primary/15" : "text-muted-foreground/30")} />
                          <span className="truncate">{sub}</span>
                          {isCompulsory && <span className="text-[9px] text-primary/70 font-bold bg-primary/10 px-1 rounded">Compulsory</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t pt-4">
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>Cancel</Button>
                <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold">
                  {isSaving ? 'Saving...' : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Save Targets
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ) : (
            /* Main Profile Details Grid & Goals display */
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="h-4 w-4 text-primary" /> Target OAU Post UTME Score
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-4xl font-extrabold text-primary">{targetScore}</span>
                    <span className="text-sm text-muted-foreground">out of 400</span>
                  </div>
                  <div className="space-y-1">
                    <Progress value={(targetScore / 400) * 100} className="h-2.5" />
                    <p className="text-[10px] text-muted-foreground text-right font-medium">Requires scoring top 2% of candidates</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <School className="h-4 w-4 text-primary" /> Dream Institution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold text-foreground truncate">{targetInstitution || 'Not Set'}</p>
                  <Badge className="bg-muted hover:bg-muted text-muted-foreground mt-2 border text-[10px] uppercase font-mono">{department || 'General'} Department</Badge>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-primary" /> Choice Course
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold text-foreground truncate">{targetCourse || 'Not Set'}</p>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">Preparation aligned with specific Post-UTME screening models.</p>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-primary" /> UTME Exam Subjects
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-1.5">
                  {selectedSubjects.map((sub) => (
                    <Badge key={sub} variant="secondary" className="text-xs font-semibold px-2 py-0.5">
                      {sub}
                    </Badge>
                  ))}
                  {selectedSubjects.length === 0 && (
                    <span className="text-xs text-muted-foreground">No subjects selected yet. Click Edit Targets.</span>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

        </div>

        {/* Right Sidebar: Prep Tracker & Quick Stats */}
        <div className="space-y-6">
          <Card className="shadow-md">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Academic Progress
              </CardTitle>
              <CardDescription>Live metrics calculated from your study activities.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Simulator Runs</p>
                  <p className="text-2xl font-black text-foreground mt-0.5">{examsTaken} Exams</p>
                </div>
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <Trophy className="h-5 w-5" />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <div>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Average Practice Score</p>
                  <p className="text-2xl font-black text-foreground mt-0.5">{averageScore}%</p>
                </div>
                <div className="h-10 w-10 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                  <Activity className="h-5 w-5" />
                </div>
              </div>

              <div className="pt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Syllabus Coverage</span>
                  <span className="text-xs font-bold text-foreground">{coveragePercent}%</span>
                </div>
                <Progress value={coveragePercent} className="h-2 bg-muted" />
                <p className="text-[10px] text-muted-foreground mt-1 text-right">{topicsCovered} of {totalTopics} topics checked</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
