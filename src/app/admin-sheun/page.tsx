

'use client';
import FollowUpCenter from '@/components/admin/follow-up-center';
import PlatformRevenueChart from '@/components/admin/charts/PlatformRevenueChart';
import UserGrowthChart from '@/components/admin/charts/UserGrowthChart';
import TransactionVolumeChart from '@/components/admin/charts/TransactionVolumeChart';
import RevenueGrowthIndexChart from '@/components/admin/charts/RevenueGrowthIndexChart';
import PlanDistributionChart from '@/components/admin/charts/PlanDistributionChart';
import RetentionCohortChart from '@/components/admin/charts/RetentionCohortChart';
import FeatureStickinessChart from '@/components/admin/charts/FeatureStickinessChart';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from '@/components/ui/card';
import {
    LineChart as ReLineChart,
    BarChart as ReBarChart,
    PieChart as RePieChart,
    XAxis,
    YAxis,
    Bar,
    Line,
    Pie,
    Cell,
    CartesianGrid,
    Legend,
    Tooltip as ReTooltip,
    ResponsiveContainer,
} from 'recharts';
import {
    Users,
    Activity,
    DollarSign,
    Package,
    Building,
    Loader,
    TrendingUp,
    FileText,
    UserCheck,
    ShoppingCart,
    PieChart as PieChartIcon,
    Crown,
    Calendar as CalendarIcon,
    Clock,
    XCircle,
    Layers,
    Newspaper,
    UserCog,
    Check,
    Ban,
    Briefcase,
    UserX,
    ShieldCheck,
    HeartPulse,
    Bot,
    BarChart2,
    AlertTriangle,
    Heart,
    Megaphone,
    MapPin,
    LogIn,
    AlertCircle,
    ArrowRight,
    Search,
    Filter,
    ArrowUpDown,
    Download,
    Settings,
    Database,
    RefreshCcw,
    Trash2,
    PartyPopper,
    Store,
    Trophy,
    CheckCircle,
    Globe,
    Mail,
    Zap,
    Plus,
    PlusCircle,
    Save,
    BookOpen,
    HelpCircle,
    Calculator as CalculatorIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMemo, useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import Image from 'next/image';
import {
    collection,
    query,
    orderBy,
    where,
    getDocs,
    doc,
    updateDoc,
    addDoc,
    setDoc,
    serverTimestamp,
    Timestamp,
    collectionGroup,
    getDoc,
    deleteDoc,
    onSnapshot,
    limit,
} from 'firebase/firestore';
import { format, formatDistanceToNow, subDays, differenceInDays } from 'date-fns';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { logAuditEvent } from '@/lib/audit';
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle, 
    AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { Academy, StudentProfile, Purchase, Admission, Subject } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Combobox } from '@/components/ui/combobox';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAcademy } from '@/context/academy-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CyberShield from '@/components/admin/cyber-shield';
import AdminBlogTabContent from '@/components/admin/blog-tab-content';

// Import static question data files to support static file curation
import { englishQuestions } from '@/app/(app)/cbt-simulator/data/use-of-english';
import { mathematicsQuestions } from '@/app/(app)/cbt-simulator/data/mathematics';
import { physicsQuestions } from '@/app/(app)/cbt-simulator/data/physics';
import { chemistryQuestions } from '@/app/(app)/cbt-simulator/data/chemistry';
import { biologyQuestions } from '@/app/(app)/cbt-simulator/data/biology';
import { governmentQuestions } from '@/app/(app)/cbt-simulator/data/government';
import { literatureQuestions } from '@/app/(app)/cbt-simulator/data/literature';
import { economicsQuestions } from '@/app/(app)/cbt-simulator/data/economics';
import { accountingQuestions } from '@/app/(app)/cbt-simulator/data/accounting';
import { crsQuestions } from '@/app/(app)/cbt-simulator/data/crs';
import { aptitudeQuestions } from '@/app/(app)/cbt-simulator/data/aptitude';
import { geographyQuestions } from '@/app/(app)/cbt-simulator/data/geography';
import { agricScienceQuestions } from '@/app/(app)/cbt-simulator/data/agric-science';

const DEFAULT_QUESTIONS = [
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

const CustomTooltipContent = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const isRevenue = payload[0].name === 'Revenue';
        return (
            <div className="bg-background/80 backdrop-blur-sm p-3 border rounded-lg shadow-lg">
                <p className="text-sm font-bold mb-1">{label}</p>
                {payload.map((pld: any, index: number) => (
                    <p key={index} className="text-sm" style={{ color: pld.fill || pld.stroke }}>
                        {`${pld.name}: ${isRevenue ? '₦' : ''}${pld.value.toLocaleString()}`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const CustomTooltip = (props: any) => {
    return <CustomTooltipContent {...props} />;
};

const StatCard = ({ title, value, icon: Icon, description }: { title: string, value: string | number, icon: React.ElementType, description?: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">
                {value}
            </div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </CardContent>
    </Card>
);

const UserPresence = ({ lastSeen }: { lastSeen: any }) => {
    if (!lastSeen?.toDate) {
        return <span className="text-muted-foreground text-xs">Never</span>;
    }
    const lastSeenDate = lastSeen.toDate();
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const isOnline = lastSeenDate > fiveMinutesAgo;

    return (
        <div className="flex items-center gap-2">
            {isOnline ? (
                <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
            ) : (
                <span className="relative flex h-2.5 w-2.5">
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-muted-foreground/50"></span>
                </span>
            )}
            <span className="text-xs text-muted-foreground">{formatDistanceToNow(lastSeenDate, { addSuffix: true })}</span>
        </div>
    );
};

const PIE_CHART_COLORS = {
    Healthy: '#22c55e', // Bright Green
    'Needs Attention': '#eab308', // Bright Yellow/Amber
    'At Risk': '#ef4444', // Bright Red
    Pro: '#3b82f6', // Bright Blue
    Business: '#8b5cf6', // Bright Purple
    Starter: '#94a3b8', // Slate/Gray (visible but distinct)
    Lifetime: '#10b981' // Emerald
};

function BusinessDetailDialog({ open, onOpenChange, title, description, businesses, users, isInfoOnly }: { open: boolean, onOpenChange: (open: boolean) => void, title: string, description: string, businesses: Academy[], users: StudentProfile[] | null, isInfoOnly?: boolean }) {
    const businessOwners = useMemo(() => {
        if (!users || isInfoOnly) return {};
        return businesses.reduce((acc, b) => {
            const owner = users.find(u => u.id === b.ownerId);
            acc[b.id] = owner?.name || 'N/A';
            return acc;
        }, {} as Record<string, string>);
    }, [businesses, users, isInfoOnly]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>
                {!isInfoOnly && (
                    <ScrollArea className="h-96">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Academy Name</TableHead>
                                    <TableHead>Owner</TableHead>
                                    <TableHead>Plan</TableHead>
                                    <TableHead>Trial Expires</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {businesses.map(b => (
                                    <TableRow key={b.id}>
                                        <TableCell className="font-medium">{b.name}</TableCell>
                                        <TableCell>{businessOwners[b.id]}</TableCell>
                                        <TableCell><Badge variant="secondary" className="capitalize">{b.accessLevel === 'lifetime' ? 'Lifetime' : b.plan || 'starter'}</Badge></TableCell>
                                        <TableCell>{b.trialExpiresAt ? format(b.trialExpiresAt.toDate(), 'PPP') : 'N/A'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                )}
            </DialogContent>
        </Dialog>
    );
}

function UserListDialog({ open, onOpenChange, title, description, users, businesses }: { open: boolean, onOpenChange: (open: boolean) => void, title: string, description: string, users: StudentProfile[] | null, businesses: Academy[] | null }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-96">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Academy</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(users || []).map(u => {
                                const biz = businesses?.find(b => b.id === u.academyId);
                                return (
                                    <TableRow key={u.id}>
                                        <TableCell className="font-medium">{u.name}</TableCell>
                                        <TableCell>{u.email}</TableCell>
                                        <TableCell>{biz?.name || 'N/A'}</TableCell>
                                        <TableCell><Badge variant={u.status === 'inactive' ? 'destructive' : 'outline'} className="capitalize">{u.status || 'active'}</Badge></TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

function PinnacleMilestoneDialog({ open, onOpenChange, daysActive, totalSessions, totalBusinesses, totalUsers, launchDate, averageSalesPerDay, averageReceiptsPerDay, platformAOV, arr, topLocation }: { 
    open: boolean, 
    onOpenChange: (open: boolean) => void, 
    daysActive: number, 
    totalSessions: number, 
    totalBusinesses: number, 
    totalUsers: number, 
    launchDate: Date,
    averageSalesPerDay: number,
    averageReceiptsPerDay: number,
    platformAOV: number,
    arr: number,
    topLocation: string
}) {
    const elementRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();
    const [isExporting, setIsExporting] = useState(false);

    const handleDownloadCertificate = async () => {
        if (!elementRef.current) return;
        setIsExporting(true);
        toast({ title: "Generating Commemoration...", description: "Please wait while we render your high-fidelity milestone card." });
        try {
            const canvas = await html2canvas(elementRef.current, { 
                scale: 3, 
                backgroundColor: '#09090b',
                logging: false,
                useCORS: true
            });
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `pinnacle-milestone-${daysActive}days.png`;
            link.href = dataUrl;
            link.click();
            toast({ variant: "success", title: "Card Downloaded", description: "Your commemorative achievement card is now saved!" });
        } catch (e) {
            toast({ variant: "destructive", title: "Export Failed", description: "Unable to capture image canvas." });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl p-0 overflow-visible border-none bg-transparent backdrop-blur-none flex justify-center items-center shadow-none no-capture [&>button]:text-white/50">
                <DialogTitle className="sr-only">Pinnacle OS Platform Genesis Milestone</DialogTitle>
                <DialogDescription className="sr-only">Commemorative dashboard visualizing operational growth and visionary trajectory.</DialogDescription>
                <div className="relative group max-w-3xl w-full mx-auto px-4" ref={elementRef}>
                    {/* Dynamic gradient background wrapper */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-emerald-500 to-cyan-500 rounded-[2.5rem] blur-xl opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                    
                    <div className="relative bg-zinc-950 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden ring-1 ring-white/10 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
                        
                        {/* COLUMN 1: ACHIEVEMENT BADGE */}
                        <div className="relative px-6 py-8 flex flex-col items-center text-center overflow-hidden">
                            {/* Atmospheric lighting */}
                            <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-indigo-500/20 to-transparent pointer-events-none"></div>
                            <div className="absolute -right-24 -top-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
                            
                            {/* Bouncing Trophy */}
                            <div className="relative bg-white/5 border border-white/10 p-5 rounded-3xl mt-2 mb-4 shadow-inner flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-yellow-400/10 rounded-3xl blur-sm"></div>
                                <Trophy className="h-12 w-12 text-amber-400 relative z-10 animate-bounce" />
                            </div>

                            <span className="text-[9px] uppercase tracking-[0.3em] font-black text-indigo-400 mb-2 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 select-none">Platform Genesis</span>
                            <h2 className="text-3xl font-black tracking-tight text-white select-none flex items-center gap-1">
                                PINNACLE ACADEMIA
                            </h2>
                            
                            <p className="text-xs text-zinc-400 font-medium mb-6 leading-relaxed select-none max-w-[260px]">
                                Active on the grid since <span className="text-zinc-100 font-bold underline decoration-dotted decoration-indigo-400 underline-offset-2">{format(launchDate, 'PPP')}</span>.
                            </p>

                            {/* Grid Stats */}
                            <div className="w-full grid grid-cols-3 gap-2 bg-white/[0.03] border border-white/5 rounded-2xl p-3 mb-6 select-none">
                                <div className="flex flex-col p-1 items-center justify-center">
                                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Accounts</span>
                                    <span className="text-sm font-black text-white mt-0.5">+{totalUsers}</span>
                                </div>
                                <div className="flex flex-col border-x border-white/10 p-1 items-center justify-center">
                                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Academies</span>
                                    <span className="text-sm font-black text-white mt-0.5">+{totalBusinesses}</span>
                                </div>
                                <div className="flex flex-col p-1 items-center justify-center">
                                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Volume</span>
                                    <span className="text-sm font-black text-emerald-400 mt-0.5">+{totalSessions.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Download Button */}
                            <Button onClick={handleDownloadCertificate} disabled={isExporting} size="sm" variant="outline" className="w-full bg-white/5 hover:bg-white/10 border-white/10 text-white rounded-2xl font-bold no-capture flex items-center justify-center gap-2 h-10 text-xs shadow-lg active:scale-[0.98] transition-transform mt-auto">
                                <Download className="h-3.5 w-3.5 text-zinc-300" /> {isExporting ? "Capturing..." : "Commemorate Badge"}
                            </Button>
                        </div>

                        {/* COLUMN 2: DYNAMIC DYNAMIC PLATFORM INTELLIGENCE */}
                        <div className="relative px-6 py-8 flex flex-col bg-white/[0.01] overflow-hidden">
                            <div className="absolute -left-24 -bottom-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

                            {/* Header */}
                            <div className="flex items-center gap-2 mb-4 text-emerald-400 font-extrabold tracking-widest text-[9px] uppercase">
                                <Activity className="h-3.5 w-3.5 text-emerald-400 animate-pulse" /> Platform Intelligence Pulse
                            </div>
                            
                            <h3 className="text-xl font-black text-white mb-1.5 tracking-tight select-none">Real-time Velocity</h3>
                            <p className="text-[10px] text-zinc-400 leading-relaxed mb-6 select-none">
                                Continuous live ecosystem calculations aggregated from all active academy portals.
                            </p>

                            {/* Timeline Flow replacement: Dynamic KPI stack */}
                            <div className="space-y-3 relative flex-grow select-none">
                                {/* Metric 1: Frequency Pulse */}
                                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-indigo-500/10 p-2 rounded-xl border border-indigo-500/20">
                                            <Zap className="h-4 w-4 text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Frequency Pulse</p>
                                            <p className="text-[11px] font-semibold text-zinc-300">Admission Flow Rate</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-white">{(averageReceiptsPerDay || 0).toFixed(2)} <span className="text-[8px] text-zinc-500 uppercase tracking-wider font-bold">/day</span></p>
                                    </div>
                                </div>

                                {/* Metric 2: Daily Economic Volume */}
                                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                                            <DollarSign className="h-4 w-4 text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Economic Volume</p>
                                            <p className="text-[11px] font-semibold text-zinc-300">Avg. Daily Admissions Value</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-emerald-400">₦{(averageSalesPerDay || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                    </div>
                                </div>

                                {/* Metric 3: Basket size */}
                                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-cyan-500/10 p-2 rounded-xl border border-cyan-500/20">
                                            <ShoppingCart className="h-4 w-4 text-cyan-400" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Ecosystem Basket</p>
                                            <p className="text-[11px] font-semibold text-zinc-300">Average Enrollment Value</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-white">₦{(platformAOV || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                    </div>
                                </div>

                                {/* Metric 4: Projections */}
                                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-rose-500/10 p-2 rounded-xl border border-rose-500/20">
                                            <TrendingUp className="h-4 w-4 text-rose-400" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Software Target</p>
                                            <p className="text-[11px] font-semibold text-zinc-300">Annual Target Runrate</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-white">₦{(arr || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Active Territory Footer Quote */}
                            <div className="mt-6 pt-4 text-[9px] text-zinc-500 border-t border-white/5 font-medium flex items-center justify-between select-none">
                                <span className="uppercase tracking-wider font-bold text-[8px]">Dominant Regional Territory:</span>
                                <span className="flex items-center gap-1 text-zinc-300 font-extrabold uppercase tracking-wide">
                                    <MapPin className="h-3 w-3 text-emerald-400" /> {topLocation}
                                </span>
                            </div>
                        </div>

                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function UserDetailDialog({ user, academy, open, onOpenChange }: { user: StudentProfile | null, academy: Academy | undefined, open: boolean, onOpenChange: (open: boolean) => void }) {
    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{user?.name}'s Profile</DialogTitle>
                    <DialogDescription>Detailed view of user account and associated academy data.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className='col-span-2'>
                            <Label className="text-xs text-muted-foreground font-bold">Academy Name</Label>
                            <p className="font-medium text-lg">{academy?.name || 'N/A'}</p>
                        </div>

                        <div>
                            <Label className="text-xs text-muted-foreground font-bold">Contact Phone</Label>
                            <p className="font-medium">{academy?.settings?.phone || user.phone || 'N/A'}</p>
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground font-bold">Contact Email</Label>
                            <p className="font-medium">{academy?.settings?.email || user.email || 'N/A'}</p>
                        </div>

                        <div className='col-span-2'>
                            <Label className="text-xs text-muted-foreground font-bold">Address</Label>
                            <p className="font-medium">{academy?.address || 'N/A'}</p>
                        </div>

                        <div>
                            <Label className="text-xs text-muted-foreground font-bold">State</Label>
                            <p className="font-medium">{academy?.settings?.state || 'N/A'}</p>
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground font-bold">Country</Label>
                            <p className="font-medium">{academy?.settings?.country || 'N/A'}</p>
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground font-bold">Currency</Label>
                            <p className="font-medium">{academy?.settings?.currency || 'NGN'}</p>
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground font-bold">Plan</Label>
                            <div className="mt-1">
                                {academy ? (
                                    academy.accessLevel === 'lifetime' ? <Badge variant="default" className="bg-green-600">Lifetime</Badge> : <Badge variant="secondary" className="capitalize">{academy.plan || 'starter'}</Badge>
                                ) : <Badge variant="outline">N/A</Badge>}
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground font-bold">User Status</Label>
                            <div className="mt-1">
                                <Badge variant={user.status === 'inactive' ? 'destructive' : 'outline'} className="capitalize">
                                    {user.status || 'active'}
                                </Badge>
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground font-bold">Last Seen</Label>
                            <div className="mt-1">
                                <UserPresence lastSeen={user.lastSeen} />
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}


function AdminDashboardContent({ users, businesses, subjects, admissions, purchases, applications, downloadClicks }: { users: StudentProfile[] | null, businesses: Academy[] | null, subjects: Subject[] | null, admissions: Admission[] | null, purchases: Purchase[] | null, applications: any[] | null, downloadClicks?: any[] | null }) {
    const firestore = useFirestore();
    const { toast } = useToast();

    const [grantEmail, setGrantEmail] = useState('');
    const [grantDate, setGrantDate] = useState<Date>();
    const [isGranting, setIsGranting] = useState(false);
    const [grantLifetime, setGrantLifetime] = useState(false);
    const [userStatusEmail, setUserStatusEmail] = useState('');
    const [isUserActive, setIsUserActive] = useState(true);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [planUserEmail, setPlanUserEmail] = useState('');
    const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro' | 'academy'>('starter');
    const [isAssigningPlan, setIsAssigningPlan] = useState(false);
    const [detailModalState, setDetailModalState] = useState<{ open: boolean; title: string; description: string; businesses: Academy[]; isInfoOnly?: boolean }>({ open: false, title: '', description: '', businesses: [], isInfoOnly: false });
    const [userListModalState, setUserListModalState] = useState<{ open: boolean; title: string; description: string; users: StudentProfile[] }>({ open: false, title: '', description: '', users: [] });
    const [isAgeMilestoneOpen, setIsAgeMilestoneOpen] = useState(false);
    const [certificateModalState, setCertificateModalState] = useState<{ open: boolean; title: string; description: string; value: string; icon: any; } | null>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [selectedUserForDetail, setSelectedUserForDetail] = useState<StudentProfile | null>(null);
    const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);
    const [isSalesVelocityOpen, setIsSalesVelocityOpen] = useState(false);
    const [totalSubscribers, setTotalSubscribers] = useState(0);
    
    // --- ACADEMIC DATA CONFIG STATES ---
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [subjectModules, setSubjectModules] = useState<any[]>([]);
    const [subjectQuestions, setSubjectQuestions] = useState<any[]>([]);
    const [mappings, setMappings] = useState<any[]>([]);
    const [isMappingsLoading, setIsMappingsLoading] = useState(true);
    const [newMappingUni, setNewMappingUni] = useState('');
    const [newMappingCourse, setNewMappingCourse] = useState('');
    const [newMappingAcademyId, setNewMappingAcademyId] = useState('');
    const [selectedMappingSubjects, setSelectedMappingSubjects] = useState<string[]>([]);
    const [isSavingSubjectData, setIsSavingSubjectData] = useState(false);
    const [academicSubTab, setAcademicSubTab] = useState<'editor' | 'mappings'>('editor');

    // Listen to Post-UTME mappings in real-time
    useEffect(() => {
        const mappingsRef = collection(firestore, 'postUtmeMappings');
        const unsubscribe = onSnapshot(mappingsRef, (snapshot) => {
            const mappingsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMappings(mappingsData);
            setIsMappingsLoading(false);
        }, (error) => {
            console.error("Error listening to mappings in admin dashboard:", error);
            setIsMappingsLoading(false);
        });
        return () => unsubscribe();
    }, [firestore]);

    // Load subject modules and questions when selected subject changes
    useEffect(() => {
        if (selectedSubjectId && subjects) {
            const subject = subjects.find(s => s.id === selectedSubjectId);
            if (subject) {
                setSubjectModules(subject.modules || []);
                
                // Load questions statically from codebase files instead of Firestore
                let localQuestions: any[] = [];
                const name = subject.name.toLowerCase();
                if (name.includes('english')) localQuestions = englishQuestions;
                else if (name.includes('math')) localQuestions = mathematicsQuestions;
                else if (name.includes('phys')) localQuestions = physicsQuestions;
                else if (name.includes('chem')) localQuestions = chemistryQuestions;
                else if (name.includes('biol')) localQuestions = biologyQuestions;
                else if (name.includes('govt') || name.includes('govern')) localQuestions = governmentQuestions;
                else if (name.includes('liter')) localQuestions = literatureQuestions;
                else if (name.includes('econ')) localQuestions = economicsQuestions;
                else if (name.includes('account')) localQuestions = accountingQuestions;
                else if (name.includes('crs') || name.includes('relig')) localQuestions = crsQuestions;
                else if (name.includes('apti')) localQuestions = aptitudeQuestions;
                else if (name.includes('geog')) localQuestions = geographyQuestions;
                else if (name.includes('agric') || name.includes('agriculture')) localQuestions = agricScienceQuestions;
                else localQuestions = englishQuestions;

                setSubjectQuestions(localQuestions);
            }
        } else {
            setSubjectModules([]);
            setSubjectQuestions([]);
        }
    }, [selectedSubjectId, subjects]);

    // Save changes back to Firebase for subject modules
    const handleSaveSubjectData = async () => {
        if (!selectedSubjectId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a subject first.' });
            return;
        }
        setIsSavingSubjectData(true);
        try {
            const subjectRef = doc(firestore, 'subjects', selectedSubjectId);
            await updateDoc(subjectRef, {
                modules: subjectModules,
                // Do not update questions in Firestore (handled statically in files)
                updatedAt: serverTimestamp()
            });
            toast({ variant: 'success', title: 'Curriculum Syllabus Saved', description: 'Curriculum syllabus has been successfully updated.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to Save', description: error.message || 'An error occurred.' });
        } finally {
            setIsSavingSubjectData(false);
        }
    };

    // Add mapping
    const handleAddMapping = async () => {
        if (!newMappingUni || !newMappingCourse || selectedMappingSubjects.length === 0 || !newMappingAcademyId) {
            toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please fill university, course, academy, and select at least one subject.' });
            return;
        }

        try {
            const mappingsRef = collection(firestore, 'postUtmeMappings');
            const newMappingId = doc(mappingsRef).id;
            const newMapping = {
                id: newMappingId,
                academyId: newMappingAcademyId,
                university: newMappingUni,
                course: newMappingCourse,
                subjects: selectedMappingSubjects,
                createdAt: serverTimestamp()
            };

            const mappingDocRef = doc(firestore, 'postUtmeMappings', newMappingId);
            await setDoc(mappingDocRef, newMapping);

            toast({ variant: 'success', title: 'Mapping Added', description: 'Successfully added Post-UTME mapping.' });
            setNewMappingUni('');
            setNewMappingCourse('');
            setSelectedMappingSubjects([]);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to Add', description: error.message || 'An error occurred.' });
        }
    };

    // Delete mapping
    const handleDeleteMapping = async (id: string) => {
        if (!confirm('Are you sure you want to delete this mapping?')) return;
        try {
            const mappingRef = doc(firestore, 'postUtmeMappings', id);
            await deleteDoc(mappingRef);
            toast({ variant: 'success', title: 'Mapping Deleted', description: 'Successfully removed mapping.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to Delete', description: error.message || 'An error occurred.' });
        }
    };

    // Syllabus curriculum helper functions
    const handleAddModule = () => {
        setSubjectModules(prev => [...prev, { title: '', topics: [] }]);
    };

    const handleRemoveModule = (modIndex: number) => {
        setSubjectModules(prev => prev.filter((_, idx) => idx !== modIndex));
    };

    const handleModuleTitleChange = (modIndex: number, title: string) => {
        setSubjectModules(prev => prev.map((mod, idx) => idx === modIndex ? { ...mod, title } : mod));
    };

    const handleAddTopic = (modIndex: number) => {
        setSubjectModules(prev => prev.map((mod, idx) => {
            if (idx === modIndex) {
                const newTopics = [...(mod.topics || []), { id: Math.random().toString(36).substring(2, 11), title: '' }];
                return { ...mod, topics: newTopics };
            }
            return mod;
        }));
    };

    const handleRemoveTopic = (modIndex: number, topicIndex: number) => {
        setSubjectModules(prev => prev.map((mod, idx) => {
            if (idx === modIndex) {
                const newTopics = (mod.topics || []).filter((_: any, tIdx: number) => tIdx !== topicIndex);
                return { ...mod, topics: newTopics };
            }
            return mod;
        }));
    };

    const handleTopicTitleChange = (modIndex: number, topicIndex: number, title: string) => {
        setSubjectModules(prev => prev.map((mod, idx) => {
            if (idx === modIndex) {
                const newTopics = (mod.topics || []).map((topic: any, tIdx: number) => 
                    tIdx === topicIndex ? { ...topic, title } : topic
                );
                return { ...mod, topics: newTopics };
            }
            return mod;
        }));
    };

    // CBT Questions editor helper functions
    const handleAddQuestion = () => {
        setSubjectQuestions(prev => [
            ...prev, 
            { 
                id: Math.random().toString(36).substring(2, 11), 
                questionText: '', 
                options: ['', '', '', ''], 
                correctAnswer: 'A', 
                explanation: '',
                year: ''
            }
        ]);
    };

    const handleRemoveQuestion = (qIndex: number) => {
        setSubjectQuestions(prev => prev.filter((_, idx) => idx !== qIndex));
    };

    const handleQuestionTextChange = (qIndex: number, questionText: string) => {
        setSubjectQuestions(prev => prev.map((q, idx) => idx === qIndex ? { ...q, questionText } : q));
    };

    const handleQuestionOptionChange = (qIndex: number, optIndex: number, val: string) => {
        setSubjectQuestions(prev => prev.map((q, idx) => {
            if (idx === qIndex) {
                const newOpts = [...(q.options || ['', '', '', ''])];
                newOpts[optIndex] = val;
                return { ...q, options: newOpts };
            }
            return q;
        }));
    };

    const handleQuestionCorrectAnswerChange = (qIndex: number, correctAnswer: 'A' | 'B' | 'C' | 'D') => {
        setSubjectQuestions(prev => prev.map((q, idx) => idx === qIndex ? { ...q, correctAnswer } : q));
    };

    const handleQuestionExplanationChange = (qIndex: number, explanation: string) => {
        setSubjectQuestions(prev => prev.map((q, idx) => idx === qIndex ? { ...q, explanation } : q));
    };

    const handleQuestionYearChange = (qIndex: number, year: string) => {
        setSubjectQuestions(prev => prev.map((q, idx) => idx === qIndex ? { ...q, year } : q));
    };
    
    // --- PEER FORUM MODERATION STATES & LISTENERS ---
    const [forumMessages, setForumMessages] = useState<any[]>([]);
    const [isForumLoading, setIsForumLoading] = useState(true);

    useEffect(() => {
        const chatsRef = collection(firestore, 'peers_chats');
        const q = query(chatsRef, orderBy('createdAt', 'desc'), limit(100));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setForumMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setIsForumLoading(false);
        }, (error) => {
            console.error("Error fetching chats in admin dashboard:", error);
            setIsForumLoading(false);
        });
        return () => unsubscribe();
    }, [firestore]);

    const handleDeleteForumMessage = async (msgId: string) => {
        if (!confirm('Are you sure you want to delete this message from the peer forums?')) return;
        try {
            await deleteDoc(doc(firestore, 'peers_chats', msgId));
            toast({ variant: 'success', title: 'Message Moderated', description: 'The chat message has been permanently deleted.' });
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Failed to delete message', description: e.message || 'An error occurred.' });
        }
    };

    // --- MENTORSHIP MANAGER STATES & LISTENERS ---
    const [mentorshipBookings, setMentorshipBookings] = useState<any[]>([]);
    const [isMentorshipLoading, setIsMentorshipLoading] = useState(true);
    const [mentors, setMentors] = useState<any[]>([]);
    const [newMentorName, setNewMentorName] = useState('');
    const [newMentorSpec, setNewMentorSpec] = useState('');
    const [newMentorAvail, setNewMentorAvail] = useState('');

    useEffect(() => {
        try {
            const q = query(collectionGroup(firestore, 'mentorshipBookings'), orderBy('createdAt', 'desc'));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                setMentorshipBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                setIsMentorshipLoading(false);
            }, (error) => {
                console.error("Error fetching group mentorshipBookings:", error);
                setIsMentorshipLoading(false);
            });
            return () => unsubscribe();
        } catch (e) {
            console.error(e);
            setIsMentorshipLoading(false);
        }
    }, [firestore]);

    useEffect(() => {
        const q = query(collection(firestore, 'mentors'), orderBy('name', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMentors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => {
            console.error("Error loading mentors list:", error);
        });
        return () => unsubscribe();
    }, [firestore]);

    const handleAddMentor = async () => {
        if (!newMentorName || !newMentorSpec) {
            toast({ variant: 'destructive', title: 'Missing Fields', description: 'Name and Specialization are required.' });
            return;
        }
        try {
            await addDoc(collection(firestore, 'mentors'), {
                name: newMentorName,
                specialization: newMentorSpec,
                availability: newMentorAvail || 'Available upon booking request',
                createdAt: serverTimestamp()
            });
            setNewMentorName('');
            setNewMentorSpec('');
            setNewMentorAvail('');
            toast({ variant: 'success', title: 'Mentor Registered', description: 'New mentor registered successfully.' });
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Failed to add mentor', description: e.message });
        }
    };

    const handleDeleteMentor = async (mentorId: string) => {
        if (!confirm('Are you sure you want to delete this mentor?')) return;
        try {
            await deleteDoc(doc(firestore, 'mentors', mentorId));
            toast({ variant: 'success', title: 'Mentor Removed', description: 'Successfully removed mentor from system.' });
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Failed', description: e.message });
        }
    };

    const handleUpdateBookingStatus = async (academyId: string, bookingId: string, status: string) => {
        try {
            await updateDoc(doc(firestore, 'businessInstances', academyId, 'mentorshipBookings', bookingId), {
                status
            });
            toast({ variant: 'success', title: 'Status Updated', description: `Booking is now ${status}.` });
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Failed to update status', description: e.message });
        }
    };

    // --- ADMISSION CALCULATOR CONFIG STATES & LISTENERS ---
    const [cutoffs, setCutoffs] = useState<any[]>([]);
    const [newCutoffUni, setNewCutoffUni] = useState('');
    const [newCutoffCourse, setNewCutoffCourse] = useState('');
    const [newCutoffMark, setNewCutoffMark] = useState('');

    useEffect(() => {
        const q = query(collection(firestore, 'university_cutoffs'), orderBy('university', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setCutoffs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => {
            console.error("Error loading university cutoffs:", error);
        });
        return () => unsubscribe();
    }, [firestore]);

    const handleAddCutoff = async () => {
        if (!newCutoffUni || !newCutoffCourse || !newCutoffMark) {
            toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please complete all cutoff fields.' });
            return;
        }
        try {
            await addDoc(collection(firestore, 'university_cutoffs'), {
                university: newCutoffUni,
                course: newCutoffCourse,
                cutOff: parseFloat(newCutoffMark),
                createdAt: serverTimestamp()
            });
            setNewCutoffUni('');
            setNewCutoffCourse('');
            setNewCutoffMark('');
            toast({ variant: 'success', title: 'Cutoff Configured', description: 'University course cut-off mark added successfully.' });
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Failed to save', description: e.message });
        }
    };

    const handleDeleteCutoff = async (cutoffId: string) => {
        if (!confirm('Are you sure you want to delete this cutoff entry?')) return;
        try {
            await deleteDoc(doc(firestore, 'university_cutoffs', cutoffId));
            toast({ variant: 'success', title: 'Cutoff Deleted', description: 'Cut-off entry has been deleted.' });
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Failed to delete', description: e.message });
        }
    };

    // --- TEXT NOVELS CONFIG STATES & LISTENERS ---
    const [novels, setNovels] = useState<any[]>([]);
    const [newNovelTitle, setNewNovelTitle] = useState('');
    const [newNovelAuthor, setNewNovelAuthor] = useState('');
    const [newNovelExamType, setNewNovelExamType] = useState<'JAMB' | 'WAEC' | 'NECO'>('JAMB');
    const [newNovelDesc, setNewNovelDesc] = useState('');

    const [selectedNovelConfigId, setSelectedNovelConfigId] = useState('');
    const [newChapterTitle, setNewChapterTitle] = useState('');
    const [newChapterSummary, setNewChapterSummary] = useState('');
    const [newChapterChars, setNewChapterChars] = useState('');
    const [newChapterQuizJson, setNewChapterQuizJson] = useState('[\n  {\n    "questionText": "Question description?",\n    "options": ["A", "B", "C", "D"],\n    "correctAnswer": "A",\n    "explanation": "Rationale explanation"\n  }\n]');

    useEffect(() => {
        const q = query(collection(firestore, 'novels'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setNovels(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => {
            console.error("Error loading novels:", error);
        });
        return () => unsubscribe();
    }, [firestore]);

    const handleAddNovel = async () => {
        if (!newNovelTitle || !newNovelAuthor) {
            toast({ variant: 'destructive', title: 'Missing Fields', description: 'Title and Author are required.' });
            return;
        }
        try {
            await addDoc(collection(firestore, 'novels'), {
                title: newNovelTitle,
                author: newNovelAuthor,
                examType: newNovelExamType,
                description: newNovelDesc,
                chapters: [],
                createdAt: serverTimestamp()
            });
            setNewNovelTitle('');
            setNewNovelAuthor('');
            setNewNovelDesc('');
            toast({ variant: 'success', title: 'Novel Registered', description: 'Book added to catalog.' });
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Failed to add', description: e.message });
        }
    };

    const handleDeleteNovel = async (novelId: string) => {
        if (!confirm('Are you sure you want to delete this novel from the catalog?')) return;
        try {
            await deleteDoc(doc(firestore, 'novels', novelId));
            toast({ variant: 'success', title: 'Novel Deleted', description: 'Book removed from catalog.' });
            if (selectedNovelConfigId === novelId) setSelectedNovelConfigId('');
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Failed to delete novel', description: e.message });
        }
    };

    const handleAddChapterToNovel = async () => {
        if (!selectedNovelConfigId || !newChapterTitle || !newChapterSummary) {
            toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please select a novel and fill Chapter Title & Summary.' });
            return;
        }
        try {
            const targetNovel = novels.find(n => n.id === selectedNovelConfigId);
            if (!targetNovel) return;

            let quizParsed = [];
            try {
                if (newChapterQuizJson.trim()) {
                    quizParsed = JSON.parse(newChapterQuizJson);
                }
            } catch (e) {
                toast({ variant: 'destructive', title: 'JSON Syntax Error', description: 'Practice questions must be formatted in a valid JSON array.' });
                return;
            }

            const newChapterObj = {
                id: `chap-${Date.now()}`,
                title: newChapterTitle,
                summary: newChapterSummary,
                characters: newChapterChars ? newChapterChars.split(',').map(c => c.trim()) : [],
                quiz: quizParsed
            };

            const novelRef = doc(firestore, 'novels', selectedNovelConfigId);
            await updateDoc(novelRef, {
                chapters: [...(targetNovel.chapters || []), newChapterObj]
            });

            setNewChapterTitle('');
            setNewChapterSummary('');
            setNewChapterChars('');
            toast({ variant: 'success', title: 'Chapter Added', description: 'Added chapter summary & quiz to novel.' });
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Failed to save chapter', description: e.message });
        }
    };

    const handleDeleteChapterFromNovel = async (novelId: string, chapId: string) => {
        if (!confirm('Are you sure you want to delete this chapter?')) return;
        try {
            const targetNovel = novels.find(n => n.id === novelId);
            if (!targetNovel) return;
            const updatedChaps = (targetNovel.chapters || []).filter((c: any) => c.id !== chapId);
            await updateDoc(doc(firestore, 'novels', novelId), { chapters: updatedChaps });
            toast({ variant: 'success', title: 'Chapter Deleted', description: 'Successfully removed chapter from book.' });
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Failed to delete chapter', description: e.message });
        }
    };

    // --- SPEED BATTLES CONFIG STATES & LISTENERS ---
    const [speedBattlesConfigs, setSpeedBattlesConfigs] = useState<any[]>([]);
    const [battleTimeLimit, setBattleTimeLimit] = useState(20);
    const [battleMultiplier, setBattleMultiplier] = useState(1);
    const [isSavingBattleConfig, setIsSavingBattleConfig] = useState(false);

    useEffect(() => {
        const q = query(collection(firestore, 'speed_battles_config'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const data = snapshot.docs[0].data();
                setSpeedBattlesConfigs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                if (data.timeLimit) setBattleTimeLimit(data.timeLimit);
                if (data.multiplier) setBattleMultiplier(data.multiplier);
            }
        }, (error) => {
            console.error("Error loading speed battles config:", error);
        });
        return () => unsubscribe();
    }, [firestore]);

    const handleSaveBattleConfig = async () => {
        setIsSavingBattleConfig(true);
        try {
            const configRef = collection(firestore, 'speed_battles_config');
            const snap = await getDocs(configRef);
            if (snap.empty) {
                await addDoc(configRef, {
                    timeLimit: battleTimeLimit,
                    multiplier: battleMultiplier,
                    questions: DEFAULT_QUESTIONS,
                    createdAt: serverTimestamp()
                });
            } else {
                await updateDoc(doc(firestore, 'speed_battles_config', snap.docs[0].id), {
                    timeLimit: battleTimeLimit,
                    multiplier: battleMultiplier,
                });
            }
            toast({ variant: 'success', title: 'Config Saved', description: 'Battle configuration updated successfully.' });
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally {
            setIsSavingBattleConfig(false);
        }
    };

    // --- PERSISTENT CACHE FOR OUTREACH ---
    const [outreachLogs, setOutreachLogs] = useState<any[]>([]);
    const [outreachSentCount, setOutreachSentCount] = useState(0);
    const [isOutreachLoading, setIsOutreachLoading] = useState(false);
    const [hasLoadedOutreach, setHasLoadedOutreach] = useState(false);

    const fetchOutreachData = async (force = false) => {
        // PREVENT REDUNDANT FETCHING: Return early if already loaded and not forced
        // This addresses the user's concern about cost and redundant reads.
        if (hasLoadedOutreach && !force) {
            console.log("Admin Intelligence: Outreach cache hit, skipping fetch.");
            return;
        }
        
        // Intel Mission: Query Firestore directly for logs to bypass 404 in static desktop environment
        try {
            const logsQuery = query(
                collection(firestore, 'follow_up_logs'),
                orderBy('sentAt', 'desc')
            );
            const snapshot = await getDocs(logsQuery);
            const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
            
            setOutreachLogs(logs);
            setOutreachSentCount(logs.filter(log => log.status !== 'failed').length);
            setHasLoadedOutreach(true);
        } catch (error) {
            console.error('Failed to fetch outreach logs from Firestore:', error);
        } finally {
            setIsOutreachLoading(false);
        }
    };

    useEffect(() => {
        const fetchSubscribers = async () => {
            try {
                // Intel Mission: Directly query the analytics overview document
                const analyticsRef = doc(firestore, 'admin_analytics', 'overview');
                const analyticsDoc = await getDoc(analyticsRef);
                
                if (analyticsDoc.exists()) {
                    const data = analyticsDoc.data();
                    if (data.appInstalls !== undefined) {
                        setTotalSubscribers(data.appInstalls);
                    } else if (data.totalUsers !== undefined) {
                        setTotalSubscribers(data.totalUsers);
                    }
                } else {
                    // Fallback to counting users if overview doc missing
                    setTotalSubscribers(users?.length || 0);
                }
            } catch (error) {
                console.error("Error fetching platform overview data from Firestore:", error);
            }
        };
        fetchSubscribers();
    }, [firestore]);

    // Broadcast State
    const [broadcastTitle, setBroadcastTitle] = useState('');
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [broadcastType, setBroadcastType] = useState<'info' | 'warning' | 'alert'>('info');
    const [broadcastDuration, setBroadcastDuration] = useState('24'); // hours
    const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

    // User Management State
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'active' | 'joined' | 'name'>('active');
    const [filterPlan, setFilterPlan] = useState<'all' | 'starter' | 'pro' | 'academy' | 'lifetime'>('all');

    const userOptions = useMemo(() => (users || []).map(user => ({
        value: user.email,
        label: `${user.name} (${user.email})`
    })), [users]);

    const handleDeleteApplication = async (appId: string) => {
        if (!confirm('Are you sure you want to delete this application?')) return;
        try {
            await deleteDoc(doc(firestore, 'job_applications', appId));
            toast({ title: "Intelligence Action: Target Deleted", description: "The career application has been removed from the sector." });
        } catch (error) {
            console.error("Error deleting application:", error);
            toast({ variant: "destructive", title: "Action Failed", description: "Failed to remove the application. Data integrity maintained." });
        }
    };

    const processedUsers = useMemo(() => {
        let result = users || [];

        // 1. Search
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(u =>
                u.name.toLowerCase().includes(lowerQuery) ||
                u.email.toLowerCase().includes(lowerQuery) ||
                (businesses?.find(b => b.id === u.academyId)?.name || '').toLowerCase().includes(lowerQuery)
            );
        }

        // 2. Filter by Plan
        if (filterPlan !== 'all') {
            result = result.filter(u => {
                const academy = businesses?.find(b => b.id === u.academyId);
                // If no academy, assume starter/no plan unless looking for strictly starter
                if (!academy) return filterPlan === 'starter';

                if (filterPlan === 'lifetime') return academy.accessLevel === 'lifetime';
                if (filterPlan === 'starter') return (!academy.plan || academy.plan === 'starter') && academy.accessLevel !== 'lifetime';
                return academy.plan === filterPlan && academy.accessLevel !== 'lifetime';
            });
        }

        // 3. Sort
        return [...result].sort((a, b) => {
            if (sortBy === 'active') { // Most recent first
                const dateA = a.lastSeen?.toDate ? a.lastSeen.toDate() : new Date(0);
                const dateB = b.lastSeen?.toDate ? b.lastSeen.toDate() : new Date(0);
                return dateB.getTime() - dateA.getTime();
            } else if (sortBy === 'joined') { // Newest first
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
                return dateB.getTime() - dateA.getTime();
            } else {
                return a.name.localeCompare(b.name);
            }
        });
    }, [users, businesses, searchQuery, filterPlan, sortBy]);

    const platformAnalytics = useMemo(() => {
        const activeBusinesses = businesses?.filter(b => b.status !== 'deleted') || [];
        const productsByBusiness = (subjects || []).reduce((acc, p) => {
            if (!acc[p.academyId]) acc[p.academyId] = [];
            acc[p.academyId].push(p);
            return acc;
        }, {} as Record<string, Subject[]>);

        const receiptsByBusiness = (admissions || []).reduce((acc, r) => {
            if (!acc[r.academyId]) acc[r.academyId] = [];
            acc[r.academyId].push(r);
            return acc;
        }, {} as Record<string, Admission[]>);

        const activatedBusinessesList = activeBusinesses.filter(b => {
            const busProducts = productsByBusiness[b.id] || [];
            const busReceipts = receiptsByBusiness[b.id] || [];
            return busProducts.length >= 10 && busReceipts.length >= 1;
        });

        const fourteenDaysAgo = subDays(new Date(), 14);
        const businessesWithRecentSales = new Set(
            (admissions || []).filter(r => r.createdAt.toDate() > fourteenDaysAgo).map(r => r.academyId)
        );
        const atRiskBusinesses = activeBusinesses.filter(b => !businessesWithRecentSales.has(b.id));

        const payingBusinessesList = activeBusinesses.filter(b => {
            if (b.accessLevel === 'lifetime') return false;
            if (b.plan !== 'pro' && b.plan !== 'academy') return false;
            if (b.trialExpiresAt && b.trialExpiresAt.toDate() > new Date()) return false;
            return true;
        });

        const healthScores = activeBusinesses.map(b => (b.settings?.academyAnalysis as any)?.health?.score ?? -1);
        const healthDistribution = {
            healthy: healthScores.filter(s => s >= 70).length,
            attention: healthScores.filter(s => s >= 40 && s < 70).length,
            atRisk: healthScores.filter(s => s >= 0 && s < 40).length,
        };
        const healthDistributionData = [
            { name: 'Healthy', value: healthDistribution.healthy, fill: PIE_CHART_COLORS.Healthy },
            // { name: 'Needs Attention', value: healthDistribution.attention, fill: PIE_CHART_COLORS['Needs Attention'] }, // User requested removal
            { name: 'At Risk', value: healthDistribution.atRisk, fill: PIE_CHART_COLORS['At Risk'] },
        ];

        const sevenDaysAgo = subDays(new Date(), 7);
        const thirtyDaysAgo = subDays(new Date(), 30);
        const aiUsersLast7Days = new Set(activeBusinesses.filter(b => b.settings?.academyAnalysis?.createdAt?.toDate() > sevenDaysAgo || b.settings?.aiTroubleshootSuggestions?.createdAt?.toDate() > sevenDaysAgo).map(b => b.id)).size;
        const aiUsersLast30Days = new Set(activeBusinesses.filter(b => b.settings?.academyAnalysis?.createdAt?.toDate() > thirtyDaysAgo || b.settings?.aiTroubleshootSuggestions?.createdAt?.toDate() > thirtyDaysAgo).map(b => b.id)).size;

        const businessAnalysisUsers = activeBusinesses.filter(b => b.settings?.academyAnalysis).length;
        const troubleshootUsers = activeBusinesses.filter(b => b.settings?.aiTroubleshootSuggestions).length;

        const aiAdoption7 = activeBusinesses.length > 0 ? (aiUsersLast7Days / activeBusinesses.length) * 100 : 0;
        const aiAdoption30 = activeBusinesses.length > 0 ? (aiUsersLast30Days / activeBusinesses.length) * 100 : 0;

        // --- POWER FEATURES ANALYTICS ---

        // 1. Churn Prediction
        const churnRiskList = activeBusinesses.map(b => {
            const owner = users?.find(u => u.id === b.ownerId);
            const lastSeen = owner?.lastSeen?.toDate ? owner.lastSeen.toDate() : null;
            const daysSinceLogin = lastSeen ? differenceInDays(new Date(), lastSeen) : 999;

            // Check sales activity
            const busReceipts = receiptsByBusiness[b.id] || [];
            const recentSales = busReceipts.filter(r => r.createdAt.toDate() > subDays(new Date(), 7)).length;

            let riskScore = 0;
            let riskFactors = [];

            if (daysSinceLogin > 7) { riskScore += 30; riskFactors.push('Inactive > 7 days'); }
            if (daysSinceLogin > 30) { riskScore += 50; riskFactors.push('Inactive > 30 days'); }
            if (recentSales === 0 && busReceipts.length > 0) { riskScore += 20; riskFactors.push('No sales in 7 days'); }

            return { academy: b, owner, riskScore, riskFactors, daysSinceLogin };
        }).filter(item => item.riskScore >= 50).sort((a, b) => b.riskScore - a.riskScore).slice(0, 10); // Top 10 at risk

        // 2. Trial Conversion
        const expiredTrials = activeBusinesses.filter(b => b.trialExpiresAt && b.trialExpiresAt.toDate() < new Date() && (b.plan === 'starter' || !b.plan));
        const paidUsers = activeBusinesses.filter(b => b.plan === 'pro' || b.plan === 'academy');
        const conversionRate = (expiredTrials.length + paidUsers.length) > 0
            ? (paidUsers.length / (expiredTrials.length + paidUsers.length)) * 100
            : 0;

        const expiringSoonList = activeBusinesses.filter(b => {
            if (!b.trialExpiresAt || b.plan === 'pro' || b.plan === 'academy') return false;
            const expiry = b.trialExpiresAt.toDate();
            const now = new Date();
            const diff = differenceInDays(expiry, now);
            return diff >= 0 && diff <= 3;
        });

        // 3. Geographic & Industry Distribution
        const locationCounts = activeBusinesses.reduce((acc, b) => {
            const state = b.settings?.state || (b.address ? b.address.split(',').pop()?.trim() : undefined) || 'Unknown';
            if (state) acc[state] = (acc[state] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const countryCounts = activeBusinesses.reduce((acc, b) => {
            const country = b.settings?.country || 'Pending Onboarding';
            acc[country] = (acc[country] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const industryCounts = activeBusinesses.reduce((acc, b) => {
            const industry = b.settings?.industry || 'Pending Onboarding';
            acc[industry] = (acc[industry] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const topLocations = Object.entries(locationCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        const countryData = Object.entries(countryCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const industryData = Object.entries(industryCounts)
            .map(([name, value]) => ({ 
                name, 
                value,
                fill: `hsl(${(Object.keys(industryCounts).indexOf(name) * 137.5) % 360}, 70%, 50%)`
            }))
            .sort((a, b) => b.value - a.value);

        const businessesWithProductsList = activeBusinesses.filter(b => (productsByBusiness[b.id] || []).length > 0);
        const businessesWithSalesList = activeBusinesses.filter(b => (receiptsByBusiness[b.id] || []).length > 0);

        return {
            totalActiveBusinesses: activeBusinesses.length,
            activatedBusinessesCount: activatedBusinessesList.length,
            activatedBusinessesList,
            atRiskBusinesses,
            payingBusinessesCount: payingBusinessesList.length,
            payingBusinessesList,
            healthDistribution,
            healthDistributionData,
            aiAdoption7,
            aiAdoption30,
            businessAnalysisUsers,
            troubleshootUsers,
            churnRiskList,
            conversionRate,
            expiringSoonList,
            topLocations,
 
            countryData: countryData.map(c => ({
                ...c,
                businesses: activeBusinesses.filter(b => (b.settings?.country || 'Pending Onboarding') === c.name)
            })),
            industryData: industryData.map(i => ({
                ...i,
                businesses: activeBusinesses.filter(b => (b.settings?.industry || 'Pending Onboarding') === i.name)
            })),
            businessesWithProducts: businessesWithProductsList.length,
            businessesWithSales: businessesWithSalesList.length,
            businessesWithProductsList,
            businessesWithSalesList
        }
    }, [businesses, subjects, admissions, users]);
    const analyticsData = useMemo(() => {
        const activeBusinesses = businesses?.filter(b => b.status !== 'deleted') || [];
        const allUsers = users || [];
        const activeUsers = allUsers.filter(u => u.status === 'active' || u.status === undefined || !u.status);
        const inactiveUsers = allUsers.filter(u => u.status === 'inactive');

        const totalUsers = activeUsers.length;
        const totalBusinesses = activeBusinesses.length;

        const totalProducts = subjects?.length || 0;
        const totalReceipts = admissions?.length || 0;
        const now = new Date();

        const platformGmv = admissions?.reduce((sum, r) => sum + r.total, 0) || 0;

        const totalProductsSold = admissions?.reduce((sum, r) => sum + r.items.reduce((itemSum, i) => itemSum + i.quantity, 0), 0) || 0;

        const totalSubscriptionRevenue = purchases?.reduce((sum, p) => sum + p.amount, 0) || 0;

        const platformAOV = totalReceipts > 0 ? (platformGmv / totalReceipts) : 0;

        const payingBusinesses = activeBusinesses?.filter(b => {
            if (b.accessLevel === 'lifetime') return false;
            if (b.plan !== 'pro' && b.plan !== 'academy') return false;
            if (b.trialExpiresAt && b.trialExpiresAt.toDate() > now) return false;
            return true;
        });

        const thirtyDaysAgo = subDays(new Date(), 30);
        const recentPurchases = (purchases || []).filter(p => {
            const pDate = p.timestamp?.toDate ? p.timestamp.toDate() : (p.timestamp?.seconds ? new Date(p.timestamp.seconds * 1000) : new Date(0));
            return pDate > thirtyDaysAgo;
        });

        const mrr = recentPurchases.reduce((sum, p) => sum + p.amount, 0);
        const arr = mrr * 12;

        const usersByDate = (activeUsers || []).reduce((acc, user) => {
            if (user.createdAt?.seconds) {
                const date = format(new Date(user.createdAt.seconds * 1000), 'MMM d');
                acc[date] = (acc[date] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);
        const newUserGrowth = Object.entries(usersByDate).map(([date, count]) => ({ date, 'New Users': count }));

        const revenueByDate = (purchases || []).reduce((acc, purchase) => {
            if (purchase.timestamp?.seconds) {
                const date = format(new Date(purchase.timestamp.seconds * 1000), 'MMM d');
                acc[date] = (acc[date] || 0) + purchase.amount;
            }
            return acc;
        }, {} as Record<string, number>);
        const revenueGrowth = Object.entries(revenueByDate).map(([date, amount]) => ({ date, 'Revenue': amount }));

        const categoryCounts = (subjects || []).reduce((acc, product) => {
            const category = product.category || 'Uncategorized';
            acc[category] = (acc[category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const categoryData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);

        const activeSubscriptions = payingBusinesses?.length || 0;

        const trialingBusinessIds = new Set((activeBusinesses || []).filter(b => b.trialExpiresAt?.toDate() > now && (b.plan === 'starter' || !b.plan)).map(b => b.id));
        const trialingUsers = activeUsers.filter(u => u.academyId && trialingBusinessIds.has(u.academyId)).length;

        const planCounts = (activeBusinesses || []).reduce((acc, academy) => {
            const plan = academy.accessLevel === 'lifetime' ? 'Lifetime' : academy.plan || 'Starter';
            acc[plan] = (acc[plan] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const planDistributionData = Object.entries(planCounts).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value,
            fill: PIE_CHART_COLORS[name as keyof typeof PIE_CHART_COLORS] || '#ccc'
        }));

        const userRoleData = (activeUsers || []).reduce((acc, user) => {
            const role = user.role || 'unknown';
            acc[role] = (acc[role] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const businessRevenues = (admissions || []).reduce((acc, r) => {
            if (r.academyId) {
                acc[r.academyId] = (acc[r.academyId] || 0) + r.total;
            }
            return acc;
        }, {} as Record<string, number>);

        const sortedBusinessRevenues = Object.entries(businessRevenues)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([bId, rev]) => {
                const academy = businesses?.find(b => b.id === bId);
                return academy ? { ...academy, totalBookingValue: rev } : null;
            })
            .filter((b): b is any => b !== null);

        const richestBusiness = sortedBusinessRevenues[0] || null;
        const topPerformers = sortedBusinessRevenues;

        // --- New Daily Metrics ---
        const launchDate = new Date(2026, 1, 17); // February 17, 2026
        
        const daysActive = Math.max(differenceInDays(new Date(), launchDate), 1);
        const earliestBusiness = launchDate;
        const averageSalesPerDay = platformGmv / daysActive;
        const averageReceiptsPerDay = totalReceipts / daysActive;

        const dailyGmv: Record<string, number> = {};
        const dailyReceipts: Record<string, number> = {};
        
        admissions?.forEach(r => {
            const date = format(r.createdAt.toDate(), 'MMM d');
            dailyGmv[date] = (dailyGmv[date] || 0) + r.total;
            dailyReceipts[date] = (dailyReceipts[date] || 0) + 1;
        });

        const dailyGmvData = Object.entries(dailyGmv).map(([date, amount]) => ({ date, 'Revenue': amount })).slice(-14);
        const dailyReceiptsData = Object.entries(dailyReceipts).map(([date, count]) => ({ date, 'Sales': count })).slice(-14);

        // LTV = Total Subscription Revenue / Total Customers
        const ltv = totalBusinesses > 0 ? totalSubscriptionRevenue / totalBusinesses : 0;

        // --- DOWNLOAD TELEMETRY INTELLIGENCE ---
        const downloadStats = (downloadClicks || []).reduce((acc, d) => {
            const pList = d.platforms || [];
            pList.forEach((p: string) => {
                if (p.includes('windows')) acc.windows += 1;
                else if (p.includes('macos')) acc.macos += 1;
                else if (p.includes('android')) acc.android += 1;
            });
            acc.totalClicks += (d.clicks || 0);
            return acc;
        }, { windows: 0, macos: 0, android: 0, totalClicks: 0 });

        return {
            totalUsers, totalBusinesses, totalProducts, platformGmv, totalProductsSold, 
            totalReceipts, platformAOV, mrr, arr, ltv, activeUsers, inactiveUsers, 
            newUserGrowth, revenueGrowth, categoryData, activeSubscriptions, 
            trialingUsers, planDistributionData, userRoleData, totalSubscriptionRevenue, 
            richestBusiness, topPerformers, averageSalesPerDay, averageReceiptsPerDay, dailyGmvData, dailyReceiptsData,
            earliestBusiness, daysActive,
            uniqueDownloaders: downloadClicks?.length || 0,
            downloadStats
        };
    }, [users, businesses, subjects, admissions, purchases, downloadClicks]);


    const handleOpenDetailModal = (type: 'active' | 'activated' | 'atRisk' | 'paying' | 'totalBusinesses' | 'inventoryActive' | 'generatingSales' | 'totalUsers') => {
        let modalData = { open: true, title: '', description: '', businesses: [] as Academy[] };
        const activeBusinesses = businesses?.filter(b => b.status !== 'deleted') || [];

        switch (type) {
            case 'active':
            case 'totalBusinesses':
                modalData.title = 'All Registered Academies';
                modalData.description = 'A list of all active academy accounts currently established on the platform.';
                modalData.businesses = activeBusinesses;
                break;
            case 'inventoryActive':
                modalData.title = 'Active Subject Catalogs';
                modalData.description = 'A list of all academies that have added at least one subject to their course catalog.';
                modalData.businesses = platformAnalytics.businessesWithProductsList || [];
                break;
            case 'generatingSales':
                modalData.title = 'Active Admission Academies';
                modalData.description = 'A list of all academies that have recorded and processed at least one student enrollment.';
                modalData.businesses = platformAnalytics.businessesWithSalesList || [];
                break;
            case 'totalUsers':
                setUserListModalState({
                    open: true,
                    title: 'Total Platform Users',
                    description: 'Complete register of all authenticated accounts active across all academies.',
                    users: users || []
                });
                return;
            case 'activated':
                modalData.title = 'Activated Academies';
                modalData.description = 'Academies with at least 10 subjects and at least 1 student enrollment.';
                modalData.businesses = platformAnalytics.activatedBusinessesList;
                break;
            case 'atRisk':
                modalData.title = 'Academies At Risk';
                modalData.description = 'Academies with no student enrollments in the last 14 days.';
                modalData.businesses = platformAnalytics.atRiskBusinesses;
                break;
            case 'paying':
                modalData.title = 'Paying Academies';
                modalData.description = 'Academies on a Pro or Academy plan whose trial has expired.';
                modalData.businesses = platformAnalytics.payingBusinessesList;
                break;
        }
        setDetailModalState(modalData);
    };

    const handleGrantAccess = async () => {
        if (!grantEmail) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide a user email.' });
            return;
        }
        if (!grantDate && !grantLifetime) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide a date or grant lifetime access.' });
            return;
        }
        setIsGranting(true);
        try {
            const usersRef = collection(firestore, 'users');
            const q = query(usersRef, where("email", "==", grantEmail));
            const userSnapshot = await getDocs(q);
            if (userSnapshot.empty) throw new Error(`User with email ${grantEmail} not found.`);
            const userDoc = userSnapshot.docs[0];
            const userData = userDoc.data() as StudentProfile;
            if (!userData.academyId) throw new Error("This user is not associated with any academy.");
            const businessDocRef = doc(firestore, 'businessInstances', userData.academyId);
            const historyColRef = collection(firestore, 'businessInstances', userData.academyId, 'subscription_history');

            if (grantLifetime) {
                await updateDoc(businessDocRef, { accessLevel: 'lifetime', trialExpiresAt: null, plan: 'academy' });
                await addDoc(historyColRef, {
                    action: 'Admin Grant: Lifetime access',
                    amount: 0,
                    currency: 'NGN',
                    timestamp: serverTimestamp()
                });

                if (currentUserProfile) {
                    await logAuditEvent(firestore, userData.academyId, currentUserProfile, {
                        action: 'billing.grant_lifetime',
                        entity: { type: 'academy', id: userData.academyId, name: userData.name },
                        details: { targetEmail: grantEmail }
                    });
                }

                toast({ variant: 'success', title: 'Lifetime Access Granted!', description: `${userData.name} now has lifetime access.` });
            } else if (grantDate) {
                await updateDoc(businessDocRef, { trialExpiresAt: grantDate });
                await addDoc(historyColRef, {
                    action: `Admin Grant: Trial extended to ${format(grantDate, 'PPP')}`,
                    amount: 0,
                    currency: 'NGN',
                    timestamp: serverTimestamp()
                });

                if (currentUserProfile) {
                    await logAuditEvent(firestore, userData.academyId, currentUserProfile, {
                        action: 'billing.extend_trial',
                        entity: { type: 'academy', id: userData.academyId, name: userData.name },
                        details: { targetEmail: grantEmail, newExpiry: format(grantDate, 'PPP') }
                    });
                }

                toast({ variant: 'success', title: 'Access Granted', description: `${userData.name}'s trial now expires on ${format(grantDate, 'PPP')}.` });
            }
            setGrantEmail('');
            setGrantDate(undefined);
            setGrantLifetime(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Grant Failed', description: error.message || 'An unexpected error occurred.' });
        } finally {
            setIsGranting(false);
        }
    }

    const handleUserStatusSelection = (email: string) => {
        setUserStatusEmail(email);
        if (email && users) {
            const selectedUser = users.find(u => u.email === email);
            if (selectedUser) {
                setIsUserActive(selectedUser.status !== 'inactive');
            }
        }
    };

    const handleUpdateUserStatus = async () => {
        if (!userStatusEmail) {
            toast({ variant: 'destructive', title: 'Missing Email', description: 'Please select a user to update.' });
            return;
        }
        setIsUpdatingStatus(true);
        try {
            const usersRef = collection(firestore, 'users');
            const q = query(usersRef, where("email", "==", userStatusEmail));
            const userSnapshot = await getDocs(q);
            if (userSnapshot.empty) throw new Error(`User with email ${userStatusEmail} not found.`);

            const userDoc = userSnapshot.docs[0];
            const newStatus = isUserActive ? 'active' : 'inactive';
            await updateDoc(userDoc.ref, { status: newStatus });

            toast({ variant: 'success', title: 'User Status Updated', description: `${userDoc.data().name}'s account is now ${newStatus}.` });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message || 'An unexpected error occurred.' });
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleAssignPlan = async () => {
        if (!planUserEmail) {
            toast({ variant: 'destructive', title: 'Missing User', description: 'Please select a user to assign a plan.' });
            return;
        }
        setIsAssigningPlan(true);
        try {
            const usersRef = collection(firestore, 'users');
            const q = query(usersRef, where("email", "==", planUserEmail));
            const userSnapshot = await getDocs(q);
            if (userSnapshot.empty) throw new Error(`User with email ${planUserEmail} not found.`);

            const userDoc = userSnapshot.docs[0];
            const userData = userDoc.data() as StudentProfile;
            if (!userData.academyId) throw new Error("This user is not associated with any academy.");

            const businessDocRef = doc(firestore, 'businessInstances', userData.academyId);
            await updateDoc(businessDocRef, {
                plan: selectedPlan,
                accessLevel: null, // Ensure plan takes precedence over lifetime
            });

            toast({ variant: 'success', title: 'Plan Assigned', description: `${userData.name} is now on the ${selectedPlan} plan.` });
            setPlanUserEmail('');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Plan Assignment Failed', description: error.message || 'An unexpected error occurred.' });
        } finally {
            setIsAssigningPlan(false);
        }
    };

    const handleSendBroadcast = async () => {
        if (!broadcastTitle || !broadcastMessage) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide both a title and a message for the broadcast.' });
            return;
        }

        setIsSendingBroadcast(true);
        try {
            const broadcastsRef = collection(firestore, 'system_broadcasts');
            const durationInHours = parseInt(broadcastDuration);
            const expiryDate = new Date();
            expiryDate.setHours(expiryDate.getHours() + durationInHours);

            await addDoc(broadcastsRef, {
                title: broadcastTitle,
                message: broadcastMessage,
                type: broadcastType,
                createdAt: serverTimestamp(),
                expiresAt: Timestamp.fromDate(expiryDate),
                active: true,
            });

            toast({ variant: 'success', title: 'Broadcast Sent!', description: 'Your message has been sent to all active users.' });
            setBroadcastTitle('');
            setBroadcastMessage('');
            setBroadcastType('info');
            setBroadcastDuration('24');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Broadcast Failed', description: error.message || 'An unexpected error occurred.' });
        } finally {
            setIsSendingBroadcast(false);
        }
    };

    const { impersonateUser, currentUserProfile } = useAcademy();
    const router = useRouter();

    const handleImpersonateUser = (user: StudentProfile) => {
        impersonateUser(user.id);
        router.push('/dashboard');
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6 high-fidelity-shell">
            <div className="mb-2">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground">
                    Platform-wide overview, analytics, and admin tools.
                </p>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="flex flex-wrap gap-1 bg-transparent border-b h-auto p-0 rounded-none mb-6">
                    <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2">Overview</TabsTrigger>
                    <TabsTrigger value="users" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2">User Management</TabsTrigger>

                    <TabsTrigger value="academic-data" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 gap-2">
                        <Database className="h-4 w-4" />
                        Academic Data
                    </TabsTrigger>
                    <TabsTrigger value="peers-forums" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 gap-2">
                        <Users className="h-4 w-4" />
                        Forums Manager
                    </TabsTrigger>
                    <TabsTrigger value="mentorships" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 gap-2">
                        <Globe className="h-4 w-4" />
                        Mentorships
                    </TabsTrigger>
                    <TabsTrigger value="calculator-config" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 gap-2">
                        <CalculatorIcon className="h-4 w-4" />
                        Calculator Config
                    </TabsTrigger>
                    <TabsTrigger value="text-novels-config" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 gap-2">
                        <BookOpen className="h-4 w-4" />
                        Text Novels Config
                    </TabsTrigger>

                    <TabsTrigger value="latest-news" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 gap-2">
                        <Newspaper className="h-4 w-4" /> Latest News
                    </TabsTrigger>

                    <TabsTrigger value="cyber-shield" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 gap-2 text-red-500 hover:text-red-600 data-[state=active]:text-red-500 data-[state=active]:border-red-500">
                        <ShieldCheck className="h-4 w-4" /> Cyber Shield
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <HeartPulse className="h-5 w-5 text-primary" />
                                Platform Overview Command
                            </CardTitle>
                        </CardHeader>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4">
                        <button onClick={() => handleOpenDetailModal('totalUsers')} className="text-left w-full h-full transition-transform active:scale-95">
                            <StatCard 
                                title="Total Users" 
                                value={analyticsData.totalUsers} 
                                icon={Users} 
                                description="Total registered user accounts"
                            />
                        </button>
                        <button onClick={() => handleOpenDetailModal('totalBusinesses')} className="text-left w-full h-full transition-transform active:scale-95">
                            <StatCard 
                                title="Total Academies" 
                                value={analyticsData.totalBusinesses} 
                                icon={Building} 
                                description="Total academy registrations"
                            />
                        </button>
                        <button onClick={() => handleOpenDetailModal('inventoryActive')} className="text-left w-full h-full transition-transform active:scale-95">
                            <StatCard 
                                title="Active Subjects" 
                                value={platformAnalytics.businessesWithProducts} 
                                icon={Package} 
                                description="Academies with added subjects"
                            />
                        </button>
                        <button onClick={() => handleOpenDetailModal('generatingSales')} className="text-left w-full h-full transition-transform active:scale-95">
                            <StatCard 
                                title="Active Admissions" 
                                value={platformAnalytics.businessesWithSales} 
                                icon={Zap} 
                                description="Academies with active enrollments"
                            />
                        </button>

                        <button 
                            onClick={() => toast({ title: "Download Traffic Intelligence", description: `Total engagement: ${analyticsData.downloadStats.totalClicks} total clicks. Breakdown: ${analyticsData.downloadStats.windows} Windows, ${analyticsData.downloadStats.macos} macOS, ${analyticsData.downloadStats.android} Android.` })} 
                            className="text-left w-full h-full transition-transform active:scale-95"
                        >
                            <StatCard 
                                title="Unique Downloaders" 
                                value={analyticsData.uniqueDownloaders} 
                                icon={Download} 
                                description={`${analyticsData.downloadStats.windows} Win / ${analyticsData.downloadStats.macos} Mac / ${analyticsData.downloadStats.android} Android`}
                            />
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 border-t border-white/5 pt-6">
                        <button onClick={() => handleOpenDetailModal('active')} className="text-left w-full h-full transition-transform active:scale-95">
                            <StatCard title="Active Academies" value={platformAnalytics.totalActiveBusinesses} icon={Building} description="Currently active academies" />
                        </button>
                        <button onClick={() => handleOpenDetailModal('paying')} className="text-left w-full h-full transition-transform active:scale-95" disabled={platformAnalytics.payingBusinessesList.length === 0}>
                            <StatCard title="MRR" value={`₦${analyticsData.mrr.toLocaleString()}`} icon={DollarSign} description="Monthly Recurring" />
                        </button>
                        <button onClick={() => setIsSalesVelocityOpen(true)} className="text-left w-full h-full transition-transform active:scale-95">
                            <StatCard title="Admission Velocity" value={`₦${analyticsData.averageSalesPerDay.toLocaleString(undefined, { maximumFractionDigits: 0 })}/day`} icon={Activity} description="Platform enrollment momentum" />
                        </button>
                        <button onClick={() => handleOpenDetailModal('activated')} className="text-left w-full h-full transition-transform active:scale-95">
                            <StatCard title="Activated Academies" value={platformAnalytics.activatedBusinessesCount} icon={UserCheck} description="Academies with >10 subjects" />
                        </button>
                        <button onClick={() => handleOpenDetailModal('atRisk')} className="text-left w-full h-full transition-transform active:scale-95" disabled={platformAnalytics.atRiskBusinesses.length === 0}>
                            <StatCard title="Inactive Academies" value={platformAnalytics.atRiskBusinesses.length} icon={AlertTriangle} description="No student activity for 14 days" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 mt-4">
                        <StatCard title="ARR" value={`₦${analyticsData.arr.toLocaleString()}`} icon={TrendingUp} description="Annual Target" />
                        <StatCard title="LTV" value={`₦${analyticsData.ltv.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={Crown} description="Est. Lifetime Value" />
                        <StatCard title="Sub Revenue" value={`₦${analyticsData.totalSubscriptionRevenue.toLocaleString()}`} icon={ShieldCheck} description="Total Software Sales" />
                        <StatCard title="Platform AOV" value={`₦${analyticsData.platformAOV.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={ShoppingCart} description="Avg. Admission Value" />
                    </div>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Top Locations</CardTitle><CardDescription>Where are your users located?</CardDescription></CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={250}>
                                    <ReBarChart data={platformAnalytics.topLocations} layout="vertical" margin={{ left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                        <ReTooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                                    </ReBarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="border-yellow-500/20 overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent pointer-events-none" />
                            <CardHeader className="pb-3 relative z-10">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Trophy className="h-5 w-5 text-yellow-500" /> Top Academies Spotlight
                                </CardTitle>
                                <CardDescription>Top 3 academies driving the most admissions value.</CardDescription>
                            </CardHeader>
                            <CardContent className="relative z-10 space-y-3">
                                {analyticsData.topPerformers && analyticsData.topPerformers.length > 0 ? (
                                    analyticsData.topPerformers.map((academy, index) => (
                                        <div key={academy.id} className={cn(
                                            "flex items-center justify-between p-3 rounded-lg border",
                                            index === 0 ? "bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-500/30" : "bg-background/60 border-border/50"
                                        )}>
                                            <div className="flex items-center gap-3">
                                                <div className={cn( 
                                                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                                                    index === 0 ? "bg-yellow-500 text-white" : "bg-muted text-muted-foreground"
                                                )}>
                                                    #{index + 1}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold leading-none">{academy.name}</p>
                                                    <p className="text-[10px] text-muted-foreground mt-1">Academy Partner</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold">₦{academy.totalBookingValue.toLocaleString()}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">Gross Admissions Value</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6 text-muted-foreground text-sm">Waiting for more high-performing data...</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>


                    <div className="mb-8">


                    
                    {/* New Industry & Country Analytics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <Card className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Briefcase className="h-5 w-5 text-blue-500" />
                                    Faculty/Stream Diversity
                                </CardTitle>
                                <CardDescription>Number of academies categorized by faculty/stream.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[250px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ReBarChart
                                            data={platformAnalytics.industryData}
                                            layout="vertical"
                                            margin={{ left: 40, right: 40 }}
                                            onClick={(data) => {
                                                if (data && data.activePayload) {
                                                    const d = data.activePayload[0].payload;
                                                    setDetailModalState({
                                                        open: true,
                                                        title: `${d.name} Academies`,
                                                        description: `List of all academies in the ${d.name} stream.`,
                                                        businesses: d.businesses,
                                                    });
                                                }
                                            }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                                            <XAxis type="number" hide />
                                            <YAxis
                                                dataKey="name"
                                                type="category"
                                                tick={{ fontSize: 11, fontWeight: 500 }}
                                                width={100}
                                            />
                                            <ReTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<CustomTooltip />} />
                                            <Bar
                                                dataKey="value"
                                                radius={[0, 4, 4, 0]}
                                                className="cursor-pointer"
                                            >
                                                {platformAnalytics.industryData.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </ReBarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Globe className="h-5 w-5 text-emerald-500" />
                                    Country Presence
                                </CardTitle>
                                <CardDescription>Global footprint. Click a country to view businesses.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[250px] pr-4">
                                    <div className="space-y-4">
                                        {platformAnalytics.countryData.map((item, i) => {
                                            const getFlag = (c: string) => {
                                                const normalized = c.toLowerCase();
                                                if (normalized.includes('nigeria')) return '🇳🇬';
                                                if (normalized.includes('united states') || normalized === 'usa') return '🇺🇸';
                                                if (normalized.includes('united kingdom') || normalized === 'uk') return '🇬🇧';
                                                if (normalized.includes('ghana')) return '🇬🇭';
                                                if (normalized.includes('canada')) return '🇨🇦';
                                                if (normalized.includes('south africa')) return '🇿🇦';
                                                if (normalized.includes('kenya')) return '🇰🇪';
                                                if (normalized.includes('onboarding')) return '⏳';
                                                return '🌐';
                                            };
                                            return (
                                                <div 
                                                    key={i} 
                                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border cursor-pointer group"
                                                    onClick={() => setDetailModalState({
                                                        open: true,
                                                        title: `Academies in ${item.name}`,
                                                        description: `Registered academies operating in ${item.name}.`,
                                                        businesses: item.businesses
                                                    })}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-2xl drop-shadow-sm group-hover:scale-110 transition-transform">{getFlag(item.name)}</span>
                                                        <span className="font-semibold text-sm">{item.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="secondary" className="font-mono">{item.value}</Badge>
                                                        <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
                        <PlatformRevenueChart admissions={admissions || []} />
                        <UserGrowthChart users={users || []} />
                        <TransactionVolumeChart admissions={admissions || []} />
                        <PlanDistributionChart businesses={businesses || []} />
                        <div className="lg:col-span-2">
                            <RevenueGrowthIndexChart purchases={purchases || []} />
                        </div>
                        <div className="lg:col-span-2">
                            <RetentionCohortChart users={users || []} admissions={admissions || []} />
                        </div>
                        <div className="lg:col-span-2">
                            <FeatureStickinessChart businesses={businesses || []} subjects={subjects || []} />
                        </div>
                    </div>
                 </TabsContent>



                <TabsContent value="users" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>All Accounts</CardTitle>
                                    <CardDescription>List of all users on the platform.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search users, emails, or academies..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-8"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Select value={filterPlan} onValueChange={(v: any) => setFilterPlan(v)}>
                                                <SelectTrigger className="w-[130px]">
                                                    <div className="flex items-center gap-2">
                                                        <Filter className="h-4 w-4" />
                                                        <SelectValue />
                                                    </div>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Plans</SelectItem>
                                                    <SelectItem value="starter">Starter</SelectItem>
                                                    <SelectItem value="pro">Pro</SelectItem>
                                                    <SelectItem value="academy">Academy</SelectItem>
                                                    <SelectItem value="lifetime">Lifetime</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                                                <SelectTrigger className="w-[180px]">
                                                    <div className="flex items-center gap-2">
                                                        <ArrowUpDown className="h-4 w-4" />
                                                        <SelectValue />
                                                    </div>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">Most Recently Active</SelectItem>
                                                    <SelectItem value="joined">Newest Members</SelectItem>
                                                    <SelectItem value="name">Name (A-Z)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <ScrollArea className="h-[500px]">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>User</TableHead>
                                                    <TableHead>Academy Name</TableHead>
                                                    <TableHead>Plan</TableHead>
                                                    <TableHead>Activity</TableHead>
                                                    <TableHead>Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {processedUsers.map(user => {
                                                    const academy = businesses?.find(b => b.id === user.academyId);
                                                    return (
                                                        <TableRow
                                                            key={user.id}
                                                            className="hover:bg-muted/50"
                                                        >
                                                            <TableCell onClick={() => { setSelectedUserForDetail(user); setIsUserDetailOpen(true); }} className="cursor-pointer">
                                                                <div className="font-medium">{user.name}</div><div className="text-xs text-muted-foreground">{user.email}</div>
                                                            </TableCell>
                                                            <TableCell onClick={() => { setSelectedUserForDetail(user); setIsUserDetailOpen(true); }} className="cursor-pointer">
                                                                {academy?.name || 'N/A'}
                                                            </TableCell>
                                                            <TableCell>
                                                                {academy ? (
                                                                    academy.accessLevel === 'lifetime' ? <Badge variant="default" className="bg-green-600 hover:bg-green-700">Lifetime</Badge> : <Badge variant="secondary" className="capitalize">{academy.plan || 'starter'}</Badge>
                                                                ) : <Badge variant="outline">N/A</Badge>}
                                                            </TableCell>
                                                            <TableCell>
                                                                <UserPresence lastSeen={user.lastSeen} />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleImpersonateUser(user); }} title="Inspect Data">
                                                                    <LogIn className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                })}
                                            </TableBody>
                                        </Table>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </div>
                        <div className='space-y-6'>
                            <Card>
                                <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase />Assign Plan</CardTitle><CardDescription>Manually set a subscription plan.</CardDescription></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2"><Label htmlFor="plan-email">User Email</Label><Combobox options={userOptions} value={planUserEmail} onChange={setPlanUserEmail} placeholder="Select a user..." /></div>
                                    <div className="space-y-2"><Label>Plan</Label><Select value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as any)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="starter">Starter</SelectItem><SelectItem value="pro">Pro</SelectItem><SelectItem value="academy">Academy</SelectItem></SelectContent></Select></div>
                                </CardContent>
                                <CardFooter><Button onClick={handleAssignPlan} disabled={isAssigningPlan} className="w-full">{isAssigningPlan && <Loader className="mr-2 h-4 w-4 animate-spin" />}Assign Plan</Button></CardFooter>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle>Grant Access</CardTitle><CardDescription>Extend trial or grant lifetime.</CardDescription></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="grant-email">User Email</Label>
                                        <Combobox options={userOptions} value={grantEmail} onChange={setGrantEmail} placeholder="Select a user..." />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Switch id="lifetime-mode" checked={grantLifetime} onCheckedChange={setGrantLifetime} />
                                        <Label htmlFor="lifetime-mode">Lifetime Access</Label>
                                    </div>
                                    {!grantLifetime && (
                                        <div className="space-y-2">
                                            <Label>Expiry Date</Label>
                                            <Calendar mode="single" selected={grantDate} onSelect={setGrantDate} className="rounded-md border" />
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter>
                                    {grantLifetime ? (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button disabled={isGranting} className="w-full bg-green-600 hover:bg-green-700">
                                                    {isGranting && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                                                    Grant Lifetime Access
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will grant <strong className="text-foreground">{grantEmail}</strong> permanent, unlimited access to Pinnacle Academia. This action is recorded in the audit logs.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={handleGrantAccess} className="bg-green-600 hover:bg-green-700">
                                                        Yes, Grant Lifetime
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    ) : (
                                        <Button onClick={handleGrantAccess} disabled={isGranting} className="w-full">
                                            {isGranting && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                                            Extend Trial
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="cyber-shield" className="space-y-6">
                    <CyberShield allBusinesses={businesses} allUsers={users} isLoadingBusinesses={!businesses} />
                </TabsContent>


                <TabsContent value="academic-data" className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-white/5">
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">Academic Data Configurator</h2>
                            <p className="text-sm text-muted-foreground">Manage Post-UTME mappings, syllabus tracking modules, and CBT simulator exam questions.</p>
                        </div>
                        <div className="flex bg-muted p-1 rounded-lg">
                            <button
                                onClick={() => setAcademicSubTab('editor')}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-semibold rounded-md transition-all",
                                    academicSubTab === 'editor' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <span className="flex items-center gap-1.5">
                                    <BookOpen className="h-3.5 w-3.5" /> Syllabus & Questions Bank
                                </span>
                            </button>
                            <button
                                onClick={() => setAcademicSubTab('mappings')}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-semibold rounded-md transition-all",
                                    academicSubTab === 'mappings' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <span className="flex items-center gap-1.5">
                                    <Layers className="h-3.5 w-3.5" /> Post-UTME Mappings
                                </span>
                            </button>
                        </div>
                    </div>

                    {academicSubTab === 'editor' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Left Column: Subject Select */}
                            <div className="lg:col-span-4 space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-semibold">Select Subject</CardTitle>
                                        <CardDescription>Select the course/subject to populate curriculum details and test banks.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label htmlFor="subjectSelect">Syllabus Subject</Label>
                                            <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                                                <SelectTrigger id="subjectSelect">
                                                    <SelectValue placeholder="Select a subject..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {(subjects || []).map(s => (
                                                        <SelectItem key={s.id} value={s.id}>{s.name} ({s.sku})</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {selectedSubjectId && (
                                            <div className="pt-4 border-t border-white/5 space-y-2">
                                                <Button
                                                    onClick={handleSaveSubjectData}
                                                    disabled={isSavingSubjectData}
                                                    className="w-full flex items-center justify-center gap-2"
                                                >
                                                    {isSavingSubjectData ? (
                                                        <Loader className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Save className="h-4 w-4" />
                                                    )}
                                                    Save Changes
                                                </Button>
                                                <p className="text-[10px] text-muted-foreground text-center">Updates modules, topics and questions in real-time.</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Right Column: Syllabus & CBT Editors */}
                            <div className="lg:col-span-8 space-y-6">
                                {!selectedSubjectId ? (
                                    <Card className="flex flex-col items-center justify-center py-20 text-center">
                                        <CardHeader>
                                            <div className="bg-primary/10 p-4 rounded-full w-fit mx-auto mb-2 text-primary">
                                                <BookOpen className="h-8 w-8" />
                                            </div>
                                            <CardTitle className="text-lg">No Subject Selected</CardTitle>
                                            <CardDescription className="max-w-xs">
                                                Please select a subject from the left panel to populate and edit syllabus modules and exam questions.
                                            </CardDescription>
                                        </CardHeader>
                                    </Card>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Syllabus Tracker Card */}
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between">
                                                <div>
                                                    <CardTitle className="flex items-center gap-2">
                                                        <BookOpen className="h-5 w-5 text-primary" />
                                                        Curriculum Syllabus Modules
                                                    </CardTitle>
                                                    <CardDescription>Configure subject curriculum breakdown into modules and topics.</CardDescription>
                                                </div>
                                                <Button onClick={handleAddModule} size="sm" variant="outline" className="gap-1">
                                                    <Plus className="h-3.5 w-3.5" /> Add Module
                                                </Button>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                {subjectModules.length === 0 ? (
                                                    <div className="text-center py-10 border border-dashed rounded-lg text-muted-foreground text-sm">
                                                        No syllabus modules defined yet. Click "Add Module" to start.
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        {subjectModules.map((module, modIdx) => (
                                                            <div key={modIdx} className="border border-white/5 bg-white/[0.01] rounded-lg p-4 space-y-3">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <div className="flex-1">
                                                                        <Label className="text-xs text-muted-foreground">Module {modIdx + 1} Title</Label>
                                                                        <Input
                                                                            value={module.title || ''}
                                                                            onChange={e => handleModuleTitleChange(modIdx, e.target.value)}
                                                                            placeholder="e.g. Introduction to Physics"
                                                                            className="mt-1"
                                                                        />
                                                                    </div>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => handleRemoveModule(modIdx)}
                                                                        className="text-muted-foreground hover:text-destructive self-end h-9 w-9"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>

                                                                {/* Topics Section */}
                                                                <div className="pl-4 border-l border-white/5 space-y-2">
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="text-xs font-semibold text-muted-foreground">Topics / Lessons</span>
                                                                        <Button onClick={() => handleAddTopic(modIdx)} size="sm" variant="ghost" className="h-7 text-xs text-primary gap-1">
                                                                            <Plus className="h-3 w-3" /> Add Topic
                                                                        </Button>
                                                                    </div>
                                                                    {(module.topics || []).length === 0 ? (
                                                                        <p className="text-[11px] text-muted-foreground italic">No topics added to this module yet.</p>
                                                                    ) : (
                                                                        <div className="space-y-2">
                                                                            {(module.topics || []).map((topic: any, topicIdx: number) => (
                                                                                <div key={topic.id || topicIdx} className="flex items-center gap-2">
                                                                                    <Input
                                                                                        value={topic.title || ''}
                                                                                        onChange={e => handleTopicTitleChange(modIdx, topicIdx, e.target.value)}
                                                                                        placeholder={`Topic ${topicIdx + 1} title`}
                                                                                        className="h-8 text-xs flex-1"
                                                                                    />
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="icon"
                                                                                        onClick={() => handleRemoveTopic(modIdx, topicIdx)}
                                                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                                                    >
                                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                                    </Button>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>

                                        {/* CBT Exam Simulator Questions */}
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between">
                                                <div>
                                                    <CardTitle className="flex items-center gap-2">
                                                        <HelpCircle className="h-5 w-5 text-primary" />
                                                        CBT Exam Question Bank
                                                    </CardTitle>
                                                    <CardDescription>Manage CBT practice exam questions with options and explanations.</CardDescription>
                                                </div>
                                                <Button onClick={handleAddQuestion} size="sm" variant="outline" className="gap-1">
                                                    <Plus className="h-3.5 w-3.5" /> Add Question
                                                </Button>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                {subjectQuestions.length === 0 ? (
                                                    <div className="text-center py-10 border border-dashed rounded-lg text-muted-foreground text-sm">
                                                        No exam questions in this subject's test bank. Click "Add Question" to begin.
                                                    </div>
                                                ) : (
                                                    <div className="space-y-6 divide-y divide-white/5">
                                                        {subjectQuestions.map((q, qIdx) => (
                                                            <div key={q.id || qIdx} className={cn("space-y-4", qIdx > 0 && "pt-6")}>
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div className="flex-1 space-y-1">
                                                                        <span className="text-xs font-bold text-primary">Question {qIdx + 1}</span>
                                                                        <Textarea
                                                                            value={q.questionText || ''}
                                                                            onChange={e => handleQuestionTextChange(qIdx, e.target.value)}
                                                                            placeholder="Type the CBT exam question..."
                                                                            className="h-20 text-sm mt-1"
                                                                        />
                                                                    </div>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => handleRemoveQuestion(qIdx)}
                                                                        className="text-muted-foreground hover:text-destructive h-9 w-9 mt-5"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>

                                                                {/* Options Grid */}
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    {['A', 'B', 'C', 'D'].map((opt, oIdx) => (
                                                                        <div key={opt} className="flex items-center gap-2">
                                                                            <span className="text-xs font-bold text-muted-foreground w-4">{opt}.</span>
                                                                            <Input
                                                                                value={q.options?.[oIdx] || ''}
                                                                                onChange={e => handleQuestionOptionChange(qIdx, oIdx, e.target.value)}
                                                                                placeholder={`Option ${opt}`}
                                                                                className="text-xs h-8 flex-1"
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                </div>

                                                                {/* Answer selection, Year, and explanation */}
                                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                                                    <div>
                                                                        <Label className="text-xs text-muted-foreground font-bold">Exam Year</Label>
                                                                        <Input
                                                                            value={q.year || ''}
                                                                            onChange={e => handleQuestionYearChange(qIdx, e.target.value)}
                                                                            placeholder="e.g. 2024"
                                                                            className="h-8 text-xs mt-1"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <Label className="text-xs text-muted-foreground font-bold">Correct Answer</Label>
                                                                        <Select
                                                                            value={q.correctAnswer || 'A'}
                                                                            onValueChange={(val: any) => handleQuestionCorrectAnswerChange(qIdx, val)}
                                                                        >
                                                                            <SelectTrigger className="h-8 text-xs mt-1">
                                                                                <SelectValue />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="A">Option A</SelectItem>
                                                                                <SelectItem value="B">Option B</SelectItem>
                                                                                <SelectItem value="C">Option C</SelectItem>
                                                                                <SelectItem value="D">Option D</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                    <div className="md:col-span-2">
                                                                        <Label className="text-xs text-muted-foreground font-bold">Explanation (Optional)</Label>
                                                                        <Input
                                                                            value={q.explanation || ''}
                                                                            onChange={e => handleQuestionExplanationChange(qIdx, e.target.value)}
                                                                            placeholder="Brief rationale for the correct answer..."
                                                                            className="h-8 text-xs mt-1"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Mappings Manager */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Layers className="h-5 w-5 text-primary" />
                                        University Post-UTME Mappings Builder
                                    </CardTitle>
                                    <CardDescription>Map specific combination of required CBT subjects to courses at various institutions.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                        <div>
                                            <Label htmlFor="mappingAcademy">Select Target Academy</Label>
                                            <Select value={newMappingAcademyId} onValueChange={setNewMappingAcademyId}>
                                                <SelectTrigger id="mappingAcademy">
                                                    <SelectValue placeholder="Select academy..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {(businesses || []).map(b => (
                                                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="mappingUni">Target University</Label>
                                            <Select value={newMappingUni} onValueChange={setNewMappingUni}>
                                                <SelectTrigger id="mappingUni">
                                                    <SelectValue placeholder="Select university..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="UI">University of Ibadan (UI)</SelectItem>
                                                    <SelectItem value="OAU">Obafemi Awolowo University (OAU)</SelectItem>
                                                    <SelectItem value="UNILAG">University of Lagos (UNILAG)</SelectItem>
                                                    <SelectItem value="ABU">Ahmadu Bello University (ABU)</SelectItem>
                                                    <SelectItem value="UNIBEN">University of Benin (UNIBEN)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="mappingCourse">Target Course / Major</Label>
                                            <Input
                                                id="mappingCourse"
                                                value={newMappingCourse}
                                                onChange={e => setNewMappingCourse(e.target.value)}
                                                placeholder="e.g. Medicine and Surgery"
                                            />
                                        </div>
                                    </div>

                                    {/* Subjects Selector checkboxes */}
                                    <div className="space-y-2">
                                        <Label className="font-bold text-xs text-muted-foreground">Required Core Subjects (Choose up to 4)</Label>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                            {(subjects || []).map(sub => {
                                                const isChecked = selectedMappingSubjects.includes(sub.name);
                                                return (
                                                    <label
                                                        key={sub.id}
                                                        className={cn(
                                                            "flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer select-none transition-colors",
                                                            isChecked ? "bg-primary/10 border-primary text-foreground" : "border-white/5 bg-white/[0.01] text-muted-foreground hover:bg-white/[0.03]"
                                                        )}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only"
                                                            checked={isChecked}
                                                            onChange={() => {
                                                                if (isChecked) {
                                                                    setSelectedMappingSubjects(prev => prev.filter(name => name !== sub.name));
                                                                } else {
                                                                    setSelectedMappingSubjects(prev => [...prev, sub.name]);
                                                                }
                                                            }}
                                                        />
                                                        <span className="truncate">{sub.name}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <Button onClick={handleAddMapping} className="gap-1.5">
                                        <Plus className="h-4 w-4" /> Save Mapping
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Mappings Table list */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-semibold">Active Mappings Registry</CardTitle>
                                    <CardDescription>Currently established subject combinations across mapped institutions.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {isMappingsLoading ? (
                                        <div className="flex items-center justify-center py-10">
                                            <Loader className="h-6 w-6 animate-spin text-primary" />
                                        </div>
                                    ) : mappings.length === 0 ? (
                                        <div className="text-center py-10 border border-dashed rounded-lg text-muted-foreground text-sm">
                                            No configuration mappings defined yet. Define mappings above.
                                        </div>
                                    ) : (
                                        <div className="border rounded-lg overflow-hidden bg-background">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Academy</TableHead>
                                                        <TableHead>University</TableHead>
                                                        <TableHead>Course</TableHead>
                                                        <TableHead>Subjects</TableHead>
                                                        <TableHead className="w-[80px]"><span className="sr-only">Actions</span></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {mappings.map(m => {
                                                        const academy = (businesses || []).find(b => b.id === m.academyId);
                                                        return (
                                                            <TableRow key={m.id}>
                                                                <TableCell className="font-medium text-xs">{academy?.name || 'Global'}</TableCell>
                                                                <TableCell className="text-xs">{m.university}</TableCell>
                                                                <TableCell className="text-xs">{m.course}</TableCell>
                                                                <TableCell className="max-w-[250px]">
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {m.subjects?.map((sub: string) => (
                                                                            <Badge key={sub} variant="secondary" className="text-[10px] px-1 py-0">{sub}</Badge>
                                                                        ))}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => handleDeleteMapping(m.id)}
                                                                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="peers-forums" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Forums Chat Moderation</CardTitle>
                            <CardDescription>Review and moderate recent student conversation logs from the Peer Forums.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isForumLoading ? (
                                <div className="flex items-center justify-center py-10">
                                    <Loader className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            ) : forumMessages.length === 0 ? (
                                <div className="text-center py-10 border border-dashed rounded-lg text-muted-foreground text-sm">
                                    No recent forum messages found.
                                </div>
                            ) : (
                                <div className="border rounded-lg overflow-hidden bg-background max-h-[500px] overflow-y-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Channel</TableHead>
                                                <TableHead>Sender</TableHead>
                                                <TableHead>Message Text</TableHead>
                                                <TableHead>Time</TableHead>
                                                <TableHead className="w-[80px]"><span className="sr-only">Actions</span></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {forumMessages.map(msg => (
                                                <TableRow key={msg.id}>
                                                    <TableCell className="font-semibold text-xs text-primary">#{msg.channelId}</TableCell>
                                                    <TableCell>
                                                        <div className="font-bold text-xs">{msg.senderName}</div>
                                                        <div className="text-[10px] text-muted-foreground">{msg.senderEmail}</div>
                                                    </TableCell>
                                                    <TableCell className="text-xs max-w-sm truncate" title={msg.text}>{msg.text}</TableCell>
                                                    <TableCell className="text-[10px] text-muted-foreground">
                                                        {msg.createdAt?.toDate ? format(msg.createdAt.toDate(), 'PPP p') : 'Just now'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDeleteForumMessage(msg.id)}
                                                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="mentorships" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Bookings table */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /> Active Mentorship Bookings</CardTitle>
                                    <CardDescription>Scheduled 15-minute consultations booked by student candidates.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {isMentorshipLoading ? (
                                        <div className="flex items-center justify-center py-10">
                                            <Loader className="h-6 w-6 animate-spin text-primary" />
                                        </div>
                                    ) : mentorshipBookings.length === 0 ? (
                                        <div className="text-center py-10 border border-dashed rounded-lg text-muted-foreground text-sm">
                                            No mentorship bookings scheduled.
                                        </div>
                                    ) : (
                                        <div className="border rounded-lg overflow-hidden bg-background">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Student</TableHead>
                                                        <TableHead>Topic/Mentor</TableHead>
                                                        <TableHead>Date</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {mentorshipBookings.map(booking => (
                                                        <TableRow key={booking.id}>
                                                            <TableCell>
                                                                <div className="font-bold text-xs">{booking.customerName}</div>
                                                                <div className="text-[10px] text-muted-foreground">{booking.customerEmail}</div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="text-xs font-semibold">{booking.items?.[0]?.name || 'Consultation'}</div>
                                                                <div className="text-[10px] text-muted-foreground">Qty: {booking.items?.[0]?.quantity || 1}</div>
                                                            </TableCell>
                                                            <TableCell className="text-xs">
                                                                {booking.createdAt?.toDate ? format(booking.createdAt.toDate(), 'PP') : 'N/A'}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant={booking.status === 'paid' ? 'default' : booking.status === 'cancelled' ? 'destructive' : 'secondary'} className="capitalize text-[10px]">
                                                                    {booking.status === 'paid' ? 'Confirmed' : booking.status}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <Select
                                                                    value={booking.status || 'pending'}
                                                                    onValueChange={(val) => handleUpdateBookingStatus(booking.academyId, booking.id, val)}
                                                                >
                                                                    <SelectTrigger className="h-7 text-[10px] w-24">
                                                                        <SelectValue placeholder="Update" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="pending">Pending</SelectItem>
                                                                        <SelectItem value="paid">Confirm</SelectItem>
                                                                        <SelectItem value="cancelled">Cancel</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Mentors roster list */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Register Mentor</CardTitle>
                                    <CardDescription>Introduce a high-performing student mentor to students.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="mentorName">Mentor Full Name</Label>
                                        <Input id="mentorName" placeholder="e.g. Chidi Benson" value={newMentorName} onChange={e => setNewMentorName(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="mentorSpec">Specialization Program</Label>
                                        <Input id="mentorSpec" placeholder="e.g. JAMB Mathematics (Scored 340)" value={newMentorSpec} onChange={e => setNewMentorSpec(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="mentorAvail">Availability Hours</Label>
                                        <Input id="mentorAvail" placeholder="e.g. Mon-Wed, 4pm - 6pm" value={newMentorAvail} onChange={e => setNewMentorAvail(e.target.value)} />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button onClick={handleAddMentor} className="w-full">Register Mentor</Button>
                                </CardFooter>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-semibold">Registered Mentors</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {mentors.length === 0 ? (
                                        <p className="text-xs text-muted-foreground p-4 text-center">No mentors registered in database.</p>
                                    ) : (
                                        <div className="divide-y divide-border/40">
                                            {mentors.map(mentor => (
                                                <div key={mentor.id} className="flex justify-between items-center p-3 text-xs">
                                                    <div>
                                                        <h5 className="font-bold">{mentor.name}</h5>
                                                        <p className="text-[10px] text-muted-foreground">{mentor.specialization}</p>
                                                        <p className="text-[9px] text-indigo-400 mt-0.5">{mentor.availability}</p>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteMentor(mentor.id)}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="calculator-config" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><CalculatorIcon className="h-5 w-5 text-primary" /> University Cutoff Marks Registry</CardTitle>
                                    <CardDescription>Cut-off targets that students calculate their aggregates against.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {cutoffs.length === 0 ? (
                                        <div className="text-center py-10 border border-dashed rounded-lg text-muted-foreground text-sm">
                                            No custom cut-off marks configured. Standard static cut-offs apply to students.
                                        </div>
                                    ) : (
                                        <div className="border rounded-lg overflow-hidden bg-background">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>University</TableHead>
                                                        <TableHead>Course</TableHead>
                                                        <TableHead>Cut-off Mark</TableHead>
                                                        <TableHead className="w-[50px]"><span className="sr-only">Delete</span></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {cutoffs.map(cutoff => (
                                                        <TableRow key={cutoff.id}>
                                                            <TableCell className="font-bold text-xs">{cutoff.university}</TableCell>
                                                            <TableCell className="text-xs">{cutoff.course}</TableCell>
                                                            <TableCell className="font-mono text-xs font-bold text-emerald-500">{cutoff.cutOff}%</TableCell>
                                                            <TableCell>
                                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteCutoff(cutoff.id)}>
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        <div>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Configure Cutoff Point</CardTitle>
                                    <CardDescription>Configure target threshold scores for course calculations.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="cutoffUni">University Abbreviation</Label>
                                        <Select value={newCutoffUni} onValueChange={setNewCutoffUni}>
                                            <SelectTrigger id="cutoffUni">
                                                <SelectValue placeholder="Select institution..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="UI">University of Ibadan (UI)</SelectItem>
                                                <SelectItem value="OAU">Obafemi Awolowo University (OAU)</SelectItem>
                                                <SelectItem value="UNILAG">University of Lagos (UNILAG)</SelectItem>
                                                <SelectItem value="UNIBEN">University of Benin (UNIBEN)</SelectItem>
                                                <SelectItem value="ABU">Ahmadu Bello University (ABU)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="cutoffCourse">Course of Study</Label>
                                        <Input id="cutoffCourse" placeholder="e.g. Medicine & Surgery" value={newCutoffCourse} onChange={e => setNewCutoffCourse(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="cutoffMark">Target Cutoff Mark (%)</Label>
                                        <Input id="cutoffMark" type="number" step="0.1" placeholder="e.g. 78.5" value={newCutoffMark} onChange={e => setNewCutoffMark(e.target.value)} />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button onClick={handleAddCutoff} className="w-full">Save Cutoff Threshold</Button>
                                </CardFooter>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="text-novels-config" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Book Registration */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Register Literature Novel</CardTitle>
                                    <CardDescription>Configure books recommended for JAMB or WAEC exam syllabus.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="novelTitle">Novel Title</Label>
                                        <Input id="novelTitle" placeholder="e.g. Sweet Sixteen" value={newNovelTitle} onChange={e => setNewNovelTitle(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="novelAuthor">Author</Label>
                                        <Input id="novelAuthor" placeholder="e.g. Bolaji Abdullahi" value={newNovelAuthor} onChange={e => setNewNovelAuthor(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Syllabus Exam Target</Label>
                                        <Select value={newNovelExamType} onValueChange={(v: any) => setNewNovelExamType(v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="JAMB">JAMB UTME</SelectItem>
                                                <SelectItem value="WAEC">WAEC (WASSCE)</SelectItem>
                                                <SelectItem value="NECO">NECO</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="novelDesc">Description Outline</Label>
                                        <Textarea id="novelDesc" placeholder="Brief outline or exam metadata details..." value={newNovelDesc} onChange={e => setNewNovelDesc(e.target.value)} />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button onClick={handleAddNovel} className="w-full">Register Novel</Button>
                                </CardFooter>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-semibold">Novel List ({novels.length})</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {novels.length === 0 ? (
                                        <p className="text-xs text-muted-foreground p-4 text-center">No novels configured.</p>
                                    ) : (
                                        <div className="divide-y divide-border/40">
                                            {novels.map(novel => (
                                                <div 
                                                    key={novel.id} 
                                                    onClick={() => setSelectedNovelConfigId(novel.id)}
                                                    className={`flex justify-between items-center p-3 text-xs cursor-pointer transition-colors ${
                                                        selectedNovelConfigId === novel.id ? 'bg-primary/5 font-semibold' : 'hover:bg-muted/10'
                                                    }`}
                                                >
                                                    <div>
                                                        <h5 className="font-bold flex items-center gap-1.5">
                                                            {novel.title}
                                                            <Badge variant="outline" className="text-[8px] py-0 px-1">{novel.examType}</Badge>
                                                        </h5>
                                                        <p className="text-[10px] text-muted-foreground">{novel.author}</p>
                                                        <p className="text-[9px] text-emerald-500 font-semibold mt-0.5">{novel.chapters?.length || 0} chapters summary</p>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteNovel(novel.id); }}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Chapter Builder */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Chapter Summary & Quiz Configurator</CardTitle>
                                    <CardDescription>
                                        {selectedNovelConfigId 
                                            ? `Manage chapters for "${novels.find(n => n.id === selectedNovelConfigId)?.title}"`
                                            : "Please select a novel from the list to manage its chapters."}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="chTitle">Chapter Title</Label>
                                            <Input id="chTitle" placeholder="e.g. Chapter 1: The Outset" value={newChapterTitle} onChange={e => setNewChapterTitle(e.target.value)} disabled={!selectedNovelConfigId} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="chChars">Key Characters (comma separated)</Label>
                                            <Input id="chChars" placeholder="e.g. Bint, Omar, Ummi" value={newChapterChars} onChange={e => setNewChapterChars(e.target.value)} disabled={!selectedNovelConfigId} />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="chSummary">Chapter Summary Details</Label>
                                        <Textarea id="chSummary" placeholder="Input complete comprehensive summary guides..." className="h-32" value={newChapterSummary} onChange={e => setNewChapterSummary(e.target.value)} disabled={!selectedNovelConfigId} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="chQuiz">Comprehension Quiz Questions (JSON Format)</Label>
                                        <Textarea id="chQuiz" className="font-mono text-xs h-32" value={newChapterQuizJson} onChange={e => setNewChapterQuizJson(e.target.value)} disabled={!selectedNovelConfigId} />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button onClick={handleAddChapterToNovel} disabled={!selectedNovelConfigId} className="w-full">
                                        Append Chapter to Novel
                                    </Button>
                                </CardFooter>
                            </Card>

                            {selectedNovelConfigId && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-semibold">Configured Chapters</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {(() => {
                                            const activeBook = novels.find(n => n.id === selectedNovelConfigId);
                                            if (!activeBook || !activeBook.chapters || activeBook.chapters.length === 0) {
                                                return <p className="text-xs text-muted-foreground p-4 text-center">No chapters registered for this book.</p>;
                                            }
                                            return (
                                                <div className="divide-y divide-border/40">
                                                    {activeBook.chapters.map((ch: any) => (
                                                        <div key={ch.id} className="p-4 flex justify-between items-start text-xs hover:bg-muted/15">
                                                            <div className="space-y-1 flex-1 pr-4">
                                                                <h5 className="font-bold text-sm">{ch.title}</h5>
                                                                <p className="text-muted-foreground line-clamp-2 leading-relaxed">{ch.summary}</p>
                                                                {ch.characters && ch.characters.length > 0 && (
                                                                    <div className="flex gap-1 flex-wrap mt-2">
                                                                        {ch.characters.map((c: string) => (
                                                                            <Badge key={c} variant="secondary" className="text-[9px] px-1 py-0">{c}</Badge>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => handleDeleteChapterFromNovel(selectedNovelConfigId, ch.id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })()}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="latest-news" className="space-y-6">
                    <AdminBlogTabContent />
                </TabsContent>

            </Tabs>

            <Dialog open={certificateModalState?.open || false} onOpenChange={(open) => !open && setCertificateModalState(null)}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 gap-0">
                    <DialogTitle className="sr-only">Platform Achievement</DialogTitle>
                    <DialogDescription className="sr-only">Platform achievement milestone download view</DialogDescription>

                    <div ref={cardRef} className="relative p-8 flex flex-col items-center text-center bg-background min-h-[420px] justify-center">
                        <div className="absolute inset-0 z-0">
                            <Image
                                src="/achievement_bg.png"
                                alt="Background"
                                fill
                                sizes="100vw"
                                className="object-cover opacity-40"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-transparent" />
                        </div>

                        <div className="relative z-10 mb-4 px-3 py-1 bg-yellow-500/10 backdrop-blur-md border border-yellow-500/20 rounded-full">
                            <p className="text-xs font-bold text-yellow-600 tracking-wide">
                                Pinnacle Admin Analytics
                            </p>
                        </div>

                        <div className="relative z-10 w-32 h-32 bg-background/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl mb-6 ring-4 ring-yellow-500/20 text-yellow-500">
                            {certificateModalState?.icon && (
                                <div className="text-yellow-500 flex items-center justify-center">
                                    {(() => {
                                        const IconComponent = certificateModalState.icon;
                                        return <IconComponent className="h-16 w-16" />;
                                    })()}
                                </div>
                            )}
                        </div>

                        <div className="relative z-10 w-full mb-6">
                            <h2 className="text-2xl font-bold text-primary mb-2 leading-tight">
                                {certificateModalState?.title}
                            </h2>
                            <p className="text-base text-foreground/80 font-medium px-4">
                                {certificateModalState?.description}
                            </p>
                        </div>

                        <div className="relative z-10 grid grid-cols-1 gap-4 w-full bg-white/60 backdrop-blur-sm border border-white/20 p-4 rounded-xl shadow-sm">
                            <div className="text-center">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Current Metric</p>
                                <p className="text-sm font-bold mt-1 text-primary">
                                    {certificateModalState?.value}
                                </p>
                            </div>
                        </div>

                        <div className="absolute bottom-4 left-0 right-0 text-center">
                            <p className="text-[11px] font-black text-primary/80">
                                pinnacle-academia.com - Certified Result
                            </p>
                        </div>
                    </div>

                    <div className="p-4 bg-muted/30 border-t flex flex-col gap-3">
                        <Button variant="outline" className="w-full gap-2 h-11 border-primary/20 text-primary hover:bg-primary/10 hover:text-primary" onClick={async () => {
                            if (!cardRef.current) return;
                            setIsDownloading(true);
                            try {
                                const canvas = await html2canvas(cardRef.current, { useCORS: true, scale: 3, backgroundColor: null });
                                const dataUrl = canvas.toDataURL('image/png');
                                const link = document.createElement('a');
                                link.href = dataUrl;
                                link.download = `pinnacle-analytic-${(certificateModalState?.title || 'card').replace(/\s+/g, '-').toLowerCase()}.png`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                toast({ title: "Downloaded!", description: "Your card has been saved." });
                            } catch (e) {
                                toast({ variant: "destructive", title: "Failed", description: "Download failed." });
                            } finally {
                                setIsDownloading(false);
                            }
                        }} disabled={isDownloading}>
                            {isDownloading ? "Downloading..." : <><Download className="h-4 w-4" /> Download Result Card</>}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>


            <BusinessDetailDialog
                open={detailModalState.open}
                onOpenChange={(open) => setDetailModalState(prev => ({ ...prev, open }))}
                title={detailModalState.title}
                description={detailModalState.description}
                businesses={detailModalState.businesses}
                users={users}
                isInfoOnly={detailModalState.isInfoOnly}
            />

            <UserListDialog
                open={userListModalState.open}
                onOpenChange={(open) => setUserListModalState(prev => ({ ...prev, open }))}
                title={userListModalState.title}
                description={userListModalState.description}
                users={userListModalState.users}
                businesses={businesses}
            />

            <PinnacleMilestoneDialog
                open={isAgeMilestoneOpen}
                onOpenChange={setIsAgeMilestoneOpen}
                daysActive={analyticsData.daysActive}
                totalSessions={admissions?.length || 0}
                totalBusinesses={platformAnalytics.totalActiveBusinesses}
                totalUsers={analyticsData.totalUsers}
                launchDate={analyticsData.earliestBusiness}
                averageSalesPerDay={analyticsData.averageSalesPerDay}
                averageReceiptsPerDay={analyticsData.averageReceiptsPerDay}
                platformAOV={analyticsData.platformAOV}
                arr={analyticsData.arr}
                topLocation={platformAnalytics.topLocations?.[0]?.name || 'N/A'}
            />

            <UserDetailDialog
                user={selectedUserForDetail}
                academy={businesses?.find(b => b.id === selectedUserForDetail?.academyId)}
                open={isUserDetailOpen}
                onOpenChange={setIsUserDetailOpen}
            />

            <Dialog open={isSalesVelocityOpen} onOpenChange={setIsSalesVelocityOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            Platform Admission Velocity
                        </DialogTitle>
                        <DialogDescription>
                            Historical enrollment performance and registration frequency.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <StatCard title="Total Admissions Value" value={`₦${analyticsData.platformGmv.toLocaleString()}`} icon={DollarSign} />
                            <StatCard title="Total Admissions Count" value={analyticsData.totalReceipts.toLocaleString()} icon={FileText} />
                            <StatCard title="Overall ARPU" value={`₦${(analyticsData.platformGmv / (analyticsData.totalBusinesses || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={Users} />
                        </div>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Daily Admissions Value (Last 14 Days)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ReLineChart data={analyticsData.dailyGmvData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₦${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                                            <ReTooltip content={<CustomTooltip />} />
                                            <Line type="monotone" dataKey="Revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                        </ReLineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function AdminDashboardPage() {
    const firestore = useFirestore();

    const usersQuery = useMemoFirebase(() => query(collection(firestore, 'users')), [firestore]);
    const businessesQuery = useMemoFirebase(() => query(collection(firestore, 'businessInstances')), [firestore]);
    const subjectsQuery = useMemoFirebase(() => query(collection(firestore, 'subjects')), [firestore]);
    const applicationsQuery = useMemoFirebase(() => query(collection(firestore, 'job_applications'), orderBy('createdAt', 'desc')), [firestore]);
    const admissionsQuery = useMemoFirebase(() => query(collection(firestore, 'admissions'), orderBy('createdAt', 'desc')), [firestore]);
    const purchasesQuery = useMemoFirebase(() => query(collection(firestore, 'purchases'), orderBy('timestamp', 'desc')), [firestore]);
    const downloadClicksQuery = useMemoFirebase(() => query(collection(firestore, 'download_clicks')), [firestore]);

    const { data: users, isLoading: usersLoading } = useCollection<StudentProfile>(usersQuery);
    const { data: businesses, isLoading: businessesLoading } = useCollection<Academy>(businessesQuery);
    const { data: subjects, isLoading: productsLoading } = useCollection<Subject>(subjectsQuery);
    const { data: applications, isLoading: applicationsLoading } = useCollection<any>(applicationsQuery);
    const { data: admissions, isLoading: receiptsLoading } = useCollection<Admission>(admissionsQuery);
    const { data: purchases, isLoading: purchasesLoading } = useCollection<Purchase>(purchasesQuery);
    const { data: downloadClicks, isLoading: downloadClicksLoading } = useCollection<any>(downloadClicksQuery);

    const isLoading = usersLoading || businessesLoading || productsLoading || applicationsLoading || receiptsLoading || purchasesLoading || downloadClicksLoading;

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-lg">Loading Admin Dashboard...</p>
            </div>
        );
    }

    return <AdminDashboardContent users={users} businesses={businesses} subjects={subjects} admissions={admissions} purchases={purchases} applications={applications} downloadClicks={downloadClicks} />
}