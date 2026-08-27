
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  GraduationCap,
  ListChecks,
  Play,
  Search,
  SortAsc,
  Loader2,
  ChevronRight,
  Target,
  BarChart2,
  Trophy,
  Flame,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAcademy } from '@/context/academy-context';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Subject } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getSubjectProgress = (product: Subject): number => {
  if (!product) return 0;
  const modules = product.modules || [];
  const totalTopics = modules.reduce((acc, m) => acc + (m.topics?.length || 0), 0);

  if (totalTopics > 0) {
    const storedTopics = localStorage.getItem(`pinnacle_topics_${product.id}`);
    if (storedTopics) {
      try {
        const completedIds = JSON.parse(storedTopics) as string[];
        const allTopicIds = new Set(modules.flatMap(m => m.topics?.map(t => t.id) || []));
        const validCompletedCount = completedIds.filter(id => allTopicIds.has(id)).length;
        return Math.round((validCompletedCount / totalTopics) * 100);
      } catch {
        return 0;
      }
    }
    return 0;
  }

  const storedProgress = localStorage.getItem(`pinnacle_progress_${product.id}`);
  if (storedProgress !== null) {
    const parsed = parseInt(storedProgress, 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const getProgressColor = (p: number) => {
  if (p === 100) return { bar: 'bg-emerald-500', text: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/30' };
  if (p >= 60) return { bar: 'bg-blue-500', text: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/30' };
  if (p >= 20) return { bar: 'bg-amber-500', text: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/30' };
  return { bar: 'bg-slate-400', text: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/30' };
};

const getStatusLabel = (p: number) => {
  if (p === 100) return 'Completed';
  if (p > 0) return 'In Progress';
  return 'Not Started';
};

// Subject icon colour based on name
const getSubjectAccent = (name: string): string => {
  const n = name.toLowerCase();
  if (n.includes('english')) return 'from-violet-600/20 to-violet-900/10 border-violet-500/30';
  if (n.includes('math')) return 'from-blue-600/20 to-blue-900/10 border-blue-500/30';
  if (n.includes('phys')) return 'from-cyan-600/20 to-cyan-900/10 border-cyan-500/30';
  if (n.includes('chem')) return 'from-green-600/20 to-green-900/10 border-green-500/30';
  if (n.includes('biol')) return 'from-emerald-600/20 to-emerald-900/10 border-emerald-500/30';
  if (n.includes('geog')) return 'from-teal-600/20 to-teal-900/10 border-teal-500/30';
  if (n.includes('agric')) return 'from-lime-600/20 to-lime-900/10 border-lime-500/30';
  if (n.includes('govt') || n.includes('govern')) return 'from-red-600/20 to-red-900/10 border-red-500/30';
  if (n.includes('econ')) return 'from-orange-600/20 to-orange-900/10 border-orange-500/30';
  if (n.includes('liter')) return 'from-pink-600/20 to-pink-900/10 border-pink-500/30';
  if (n.includes('account')) return 'from-yellow-600/20 to-yellow-900/10 border-yellow-500/30';
  if (n.includes('aptit')) return 'from-indigo-600/20 to-indigo-900/10 border-indigo-500/30';
  if (n.includes('crs') || n.includes('relig')) return 'from-purple-600/20 to-purple-900/10 border-purple-500/30';
  return 'from-slate-600/20 to-slate-900/10 border-slate-500/30';
};

// ─── Update Progress Dialog ────────────────────────────────────────────────────

function UpdateProgressDialog({
  product,
  isOpen,
  onOpenChange,
  currentProgress,
  onSave,
}: {
  product: Subject | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentProgress: number;
  onSave: (progress: number) => void;
}) {
  const [val, setVal] = React.useState(currentProgress);

  React.useEffect(() => {
    if (isOpen) setVal(currentProgress);
  }, [isOpen, currentProgress]);

  if (!product) return null;

  const modules = product.modules || [];
  const totalTopics = modules.reduce((acc, m) => acc + (m.topics?.length || 0), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Update Study Progress
          </DialogTitle>
          <DialogDescription>
            {totalTopics > 0
              ? `Progress for ${product.name} is tracked via topic checklist.`
              : `Set your study completion for ${product.name}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {totalTopics > 0 ? (
            <div className="space-y-4 text-center">
              <div className="p-4 rounded-xl bg-muted/30 border text-sm text-muted-foreground">
                This subject has <strong>{totalTopics} topic{totalTopics > 1 ? 's' : ''}</strong> in its structured syllabus. Progress updates automatically as you tick off topics.
              </div>
              <Button asChild className="w-full">
                <Link href={`/syllabus-tracker/details?id=${product.id}`}>
                  <BookOpen className="mr-2 h-4 w-4" /> Open Study Workspace
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex justify-between text-sm font-semibold">
                  <span>Completion</span>
                  <span className="text-primary font-bold font-mono">{val}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={val}
                  onChange={(e) => setVal(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="grid grid-cols-5 gap-2">
                  {[0, 25, 50, 75, 100].map((pct) => (
                    <Button
                      key={pct}
                      type="button"
                      variant={val === pct ? 'default' : 'outline'}
                      size="sm"
                      className="text-xs h-8"
                      onClick={() => setVal(pct)}
                    >
                      {pct}%
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button onClick={() => { onSave(val); onOpenChange(false); }}>
                  Save Progress
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SubjectCardSkeleton() {
  return (
    <Card className="overflow-hidden border bg-card/40">
      <div className="h-2 bg-muted/30" />
      <CardHeader className="p-4 pb-2 space-y-2">
        <Skeleton className="h-4 w-16 rounded-full" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-3">
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
        </div>
      </CardContent>
      <div className="px-4 pb-4">
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function SyllabusTrackerPage() {
  return (
    <React.Suspense fallback={
      <div className="max-w-6xl mx-auto py-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => <SubjectCardSkeleton key={i} />)}
        </div>
      </div>
    }>
      <SyllabusTrackerContent />
    </React.Suspense>
  );
}

function SyllabusTrackerContent() {
  const router = useRouter();
  const { subjects, isLoading, currentUserProfile } = useAcademy();

  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortBy, setSortBy] = React.useState<'name' | 'progress-desc' | 'progress-asc' | 'newest'>('name');
  const [filterStatus, setFilterStatus] = React.useState<'all' | 'not-started' | 'in-progress' | 'completed'>('all');
  const [progressMap, setProgressMap] = React.useState<Record<string, number>>({});
  const [progressDialogProduct, setProgressDialogProduct] = React.useState<Subject | null>(null);

  // Hydrate progress from localStorage
  React.useEffect(() => {
    if (subjects) {
      const map: Record<string, number> = {};
      subjects.forEach(s => { map[s.id] = getSubjectProgress(s); });
      setProgressMap(map);
    }
  }, [subjects]);

  const handleSaveProgress = (subjectId: string, progress: number) => {
    localStorage.setItem(`pinnacle_progress_${subjectId}`, progress.toString());
    setProgressMap(prev => ({ ...prev, [subjectId]: progress }));
  };

  // Derived stats
  const stats = React.useMemo(() => {
    if (!subjects) return { total: 0, completed: 0, inProgress: 0, notStarted: 0, avgProgress: 0 };
    const total = subjects.length;
    const completed = subjects.filter(s => (progressMap[s.id] ?? 0) === 100).length;
    const inProgress = subjects.filter(s => { const p = progressMap[s.id] ?? 0; return p > 0 && p < 100; }).length;
    const notStarted = subjects.filter(s => (progressMap[s.id] ?? 0) === 0).length;
    const avgProgress = total > 0
      ? Math.round(subjects.reduce((acc, s) => acc + (progressMap[s.id] ?? 0), 0) / total)
      : 0;
    return { total, completed, inProgress, notStarted, avgProgress };
  }, [subjects, progressMap]);

  const filteredSubjects = React.useMemo(() => {
    if (!subjects) return [];
    let list = [...subjects];

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(lower) || s.category?.toLowerCase().includes(lower));
    }

    if (filterStatus !== 'all') {
      list = list.filter(s => {
        const p = progressMap[s.id] ?? 0;
        if (filterStatus === 'completed') return p === 100;
        if (filterStatus === 'in-progress') return p > 0 && p < 100;
        if (filterStatus === 'not-started') return p === 0;
        return true;
      });
    }

    list.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'progress-desc') return (progressMap[b.id] ?? 0) - (progressMap[a.id] ?? 0);
      if (sortBy === 'progress-asc') return (progressMap[a.id] ?? 0) - (progressMap[b.id] ?? 0);
      if (sortBy === 'newest') {
        const dA = a.createdAt?.toMillis?.() || (a.createdAt as any)?.seconds || 0;
        const dB = b.createdAt?.toMillis?.() || (b.createdAt as any)?.seconds || 0;
        return dB - dA;
      }
      return 0;
    });

    return list;
  }, [subjects, searchTerm, filterStatus, sortBy, progressMap]);

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-8 pb-20 md:pb-6">

      {/* ── Page Header ── */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
          <GraduationCap className="h-8 w-8 text-primary" />
          Syllabus Tracker
        </h1>
        <p className="text-muted-foreground text-sm">
          Monitor your study progress across all subjects and prepare for your Post-UTME exam.
        </p>
      </div>

      {/* ── Summary Stats ── */}
      {subjects && subjects.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Subjects', value: stats.total, icon: BookOpen, color: 'text-primary' },
            { label: 'Completed', value: stats.completed, icon: Trophy, color: 'text-emerald-500' },
            { label: 'In Progress', value: stats.inProgress, icon: Flame, color: 'text-amber-500' },
            { label: 'Avg. Progress', value: `${stats.avgProgress}%`, icon: BarChart2, color: 'text-blue-500' },
          ].map(stat => (
            <Card key={stat.label} className="bg-card/50 border-border/40 hover:border-primary/20 transition-colors">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn('p-2 rounded-lg bg-muted/50', stat.color)}>
                  <stat.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-2xl font-black">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Filters & Search ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subjects…"
            className="pl-9 h-10 bg-background/80"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={filterStatus} onValueChange={v => setFilterStatus(v as any)}>
          <SelectTrigger className="h-10 w-full sm:w-44 bg-background/80">
            <ListChecks className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            <SelectItem value="not-started">Not Started</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={v => setSortBy(v as any)}>
          <SelectTrigger className="h-10 w-full sm:w-44 bg-background/80">
            <SortAsc className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name (A–Z)</SelectItem>
            <SelectItem value="progress-desc">Most Progress</SelectItem>
            <SelectItem value="progress-asc">Least Progress</SelectItem>
            <SelectItem value="newest">Recently Added</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Subject Cards Grid ── */}
      {(isLoading && !subjects) ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => <SubjectCardSkeleton key={i} />)}
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[360px] text-center p-12 border rounded-2xl bg-muted/10 border-border/30">
          <BookOpen className="h-20 w-20 text-muted-foreground/20 mb-4" />
          <h3 className="text-xl font-semibold">
            {searchTerm || filterStatus !== 'all' ? 'No subjects match' : 'No Subjects Yet'}
          </h3>
          <p className="text-muted-foreground mt-2 max-w-xs">
            {searchTerm || filterStatus !== 'all'
              ? 'Try changing your search or filter.'
              : 'Your academy has not added any subjects to the syllabus yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredSubjects.map(subject => {
            const progress = progressMap[subject.id] ?? 0;
            const colors = getProgressColor(progress);
            const accent = getSubjectAccent(subject.name);
            const modules = subject.modules || [];
            const totalTopics = modules.reduce((acc, m) => acc + (m.topics?.length || 0), 0);

            return (
              <Card
                key={subject.id}
                className={cn(
                  'relative overflow-hidden flex flex-col border transition-all duration-200 hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5 bg-card/50',
                )}
              >
                {/* Coloured accent header */}
                <div className={cn('h-1.5 w-full bg-gradient-to-r', accent.split(' ')[0].replace('from-', 'from-').replace('/20', '/60'), 'to-transparent')} />

                <CardHeader className="p-4 pb-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={cn('text-[9px] h-4 px-1.5 py-0 rounded-full font-bold', colors.bg, colors.text)}
                    >
                      {progress === 100 ? (
                        <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                      ) : progress > 0 ? (
                        <Clock className="h-2.5 w-2.5 mr-0.5" />
                      ) : (
                        <Circle className="h-2.5 w-2.5 mr-0.5" />
                      )}
                      {getStatusLabel(progress)}
                    </Badge>
                    {subject.category && (
                      <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">
                        {subject.category}
                      </span>
                    )}
                  </div>

                  <CardTitle
                    className="text-sm font-bold leading-tight cursor-pointer hover:text-primary transition-colors line-clamp-2"
                    onClick={() => router.push(`/syllabus-tracker/details?id=${subject.id}`)}
                  >
                    {subject.name}
                  </CardTitle>

                  {totalTopics > 0 && (
                    <p className="text-[10px] text-muted-foreground">
                      {totalTopics} topic{totalTopics !== 1 ? 's' : ''} in syllabus
                    </p>
                  )}
                </CardHeader>

                <CardContent className="px-4 pb-3 space-y-3 flex-1">
                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                      <span>Progress</span>
                      <span className={cn('font-mono', colors.text)}>{progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-500', colors.bar)}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Tutor */}
                  {subject.tutorName && (
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <GraduationCap className="h-3 w-3 shrink-0" />
                      <span className="truncate">{subject.tutorName}</span>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="px-4 pb-4 pt-0 flex flex-col gap-2">
                  <Button
                    className="w-full h-8 text-xs font-semibold gap-1.5"
                    onClick={() => router.push(`/syllabus-tracker/details?id=${subject.id}`)}
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    Study Now
                  </Button>
                  <div className="flex gap-2 w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-7 text-[10px] gap-1"
                      onClick={() => setProgressDialogProduct(subject)}
                    >
                      <Target className="h-3 w-3" /> Update
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-7 text-[10px] gap-1"
                      onClick={() => router.push(`/syllabus-tracker/details?id=${subject.id}&tab=questions`)}
                    >
                      <ListChecks className="h-3 w-3" /> Practise
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Footer count */}
      {filteredSubjects.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Showing <strong>{filteredSubjects.length}</strong> of <strong>{subjects?.length ?? 0}</strong> subjects
        </p>
      )}

      {/* Update Progress Dialog */}
      {progressDialogProduct && (
        <UpdateProgressDialog
          product={progressDialogProduct}
          isOpen={!!progressDialogProduct}
          onOpenChange={open => !open && setProgressDialogProduct(null)}
          currentProgress={progressMap[progressDialogProduct.id] ?? 0}
          onSave={progress => handleSaveProgress(progressDialogProduct.id, progress)}
        />
      )}
    </div>
  );
}
