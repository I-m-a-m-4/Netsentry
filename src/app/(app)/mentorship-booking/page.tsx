'use client';

import * as React from 'react';
import { useAcademy } from '@/context/academy-context';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, addDoc, serverTimestamp, updateDoc, getDocs } from 'firebase/firestore';
import type { MentorshipBooking } from '@/types';
import PageTitle from '@/components/shared/page-title';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
    Loader2, 
    Globe, 
    MoreHorizontal, 
    CheckCircle, 
    Clock, 
    Info, 
    XCircle, 
    DollarSign, 
    Calendar, 
    BookOpen, 
    Search,
    User,
    Check,
    AlertCircle,
    UserCheck,
    MessageSquare,
    Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

// Premium Fallback Mentors if none exist in the database
const DEFAULT_MENTORS = [
    {
        id: 'default-1',
        name: 'Dr. Sarah Alabi',
        specialization: 'Medicine & Surgery (OAU)',
        availability: 'Mondays & Wednesdays, 4 PM - 6 PM',
        bio: 'Scored 342 in UTME. Passionate about guiding aspiring medical students through high-yield biology and chemistry topics.',
        avatar: 'SA'
    },
    {
        id: 'default-2',
        name: 'Engr. David Okon',
        specialization: 'Software Engineering (UI)',
        availability: 'Tuesdays & Thursdays, 2 PM - 5 PM',
        bio: 'UTME Math score: 95/100. Expert tutor in algebraic functions, calculus, and physics concepts.',
        avatar: 'DO'
    },
    {
        id: 'default-3',
        name: 'Barr. Chidi Okafor',
        specialization: 'Law (UNILAG)',
        availability: 'Fridays, 3 PM - 7 PM',
        bio: 'Top scorer in Use of English and Literature. Offers coaching on comprehension, sentence structure, and literary analysis.',
        avatar: 'CO'
    },
    {
        id: 'default-4',
        name: 'Pharm. Evelyn Peters',
        specialization: 'Pharmacy (UNIBEN)',
        availability: 'Saturdays, 10 AM - 2 PM',
        bio: 'Chemistry expert with 5+ years of UTME coaching experience. Simplifies organic chemistry and stoichiometry.',
        avatar: 'EP'
    }
];

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
    pending: 'secondary',
    paid: 'default',
    shipped: 'outline',
    cancelled: 'destructive',
};

const statusLabel: { [key: string]: string } = {
    pending: 'Pending Approval',
    paid: 'Confirmed',
    shipped: 'Completed',
    cancelled: 'Cancelled',
};

export default function MentorshipBookingsPage() {
    const { academy, isLoading: isContextLoading, currencySymbol, currentUserProfile } = useAcademy();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [activeTab, setActiveTab] = React.useState('browse');
    const [searchQuery, setSearchQuery] = React.useState('');
    const [selectedMentor, setSelectedMentor] = React.useState<any>(null);
    const [isBookingOpen, setIsBookingOpen] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    // Form inputs
    const [bookingDate, setBookingDate] = React.useState('');
    const [bookingTime, setBookingTime] = React.useState('');
    const [bookingNotes, setBookingNotes] = React.useState('');

    // Fetch registered mentors
    const [dbMentors, setDbMentors] = React.useState<any[]>([]);
    const [isLoadingMentors, setIsLoadingMentors] = React.useState(true);

    React.useEffect(() => {
        if (!firestore) return;
        const fetchMentors = async () => {
            try {
                const snap = await getDocs(query(collection(firestore, 'mentors'), orderBy('name', 'asc')));
                const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setDbMentors(list);
            } catch (e) {
                console.error("Error loading mentors:", e);
            } finally {
                setIsLoadingMentors(false);
            }
        };
        fetchMentors();
    }, [firestore]);

    const mentorsList = dbMentors.length > 0 ? dbMentors : DEFAULT_MENTORS;

    // Fetch all bookings for the academy
    const bookingsQuery = useMemoFirebase(
        () => academy?.id ? query(collection(firestore, 'businessInstances', academy.id, 'mentorshipBookings'), orderBy('createdAt', 'desc')) : null,
        [academy?.id, firestore]
    );
    const { data: allBookings, isLoading: isLoadingBookings } = useCollection<MentorshipBooking>(bookingsQuery);

    // Filter bookings for the current logged-in student
    const studentBookings = React.useMemo(() => {
        if (!allBookings || !currentUserProfile) return [];
        return allBookings.filter(b => b.studentId === currentUserProfile.id);
    }, [allBookings, currentUserProfile]);

    const filteredMentors = React.useMemo(() => {
        return mentorsList.filter(m => 
            m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.specialization.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [mentorsList, searchQuery]);

    const handleOpenBooking = (mentor: any) => {
        setSelectedMentor(mentor);
        setIsBookingOpen(true);
        // Reset form
        setBookingDate('');
        setBookingTime('');
        setBookingNotes('');
    };

    const handleCreateBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!academy?.id || !currentUserProfile || !selectedMentor) return;

        if (!bookingDate || !bookingTime) {
            toast({
                variant: 'destructive',
                title: 'Missing Fields',
                description: 'Please select a date and time for your consultation.',
            });
            return;
        }

        setIsSubmitting(true);

        const fee = 2500; // Standard nominal fee for elite mentorship consultations
        const formattedDate = format(new Date(`${bookingDate}T${bookingTime}`), 'PPPPp');

        try {
            await addDoc(collection(firestore, 'businessInstances', academy.id, 'mentorshipBookings'), {
                academyId: academy.id,
                studentId: currentUserProfile.id,
                customerName: currentUserProfile.name || 'Anonymous Student',
                customerEmail: currentUserProfile.email || '',
                customerPhone: currentUserProfile.phone || '',
                customerAddress: `Consultation Slot: ${formattedDate} | Discussion Topic: ${bookingNotes || 'General Academic Mentorship'}`,
                items: [{
                    subjectId: selectedMentor.id,
                    name: `1-on-1 Mentorship with ${selectedMentor.name}`,
                    quantity: 1,
                    price: fee
                }],
                total: fee,
                status: 'pending',
                createdAt: serverTimestamp()
            });

            toast({
                variant: 'success',
                title: 'Mentorship Booked Successfully!',
                description: `Your session with ${selectedMentor.name} has been scheduled for approval.`,
            });

            setIsBookingOpen(false);
            setActiveTab('my-bookings');
        } catch (error: any) {
            console.error("Booking error:", error);
            toast({
                variant: 'destructive',
                title: 'Booking Failed',
                description: error.message || 'Could not complete booking session registration.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isLoading = isContextLoading || isLoadingBookings || isLoadingMentors;

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-16">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <PageTitle 
                    title="Mentor Desk" 
                    subtitle="Connect 1-on-1 with elite student mentors from top universities to guide your preparation." 
                />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <div className="flex justify-between items-center border-b pb-1">
                    <TabsList className="bg-muted/40 p-1 rounded-xl">
                        <TabsTrigger value="browse" className="rounded-lg font-bold text-xs px-4 py-2">
                            <UserCheck className="h-4 w-4 mr-2" /> Book a Mentor
                        </TabsTrigger>
                        <TabsTrigger value="my-bookings" className="rounded-lg font-bold text-xs px-4 py-2">
                            <Calendar className="h-4 w-4 mr-2" /> My Sessions ({studentBookings.length})
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Tab: Browse and Book */}
                <TabsContent value="browse" className="space-y-6">
                    <div className="flex items-center gap-2 max-w-md bg-card border rounded-2xl px-3.5 py-1.5 shadow-sm">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by mentor name or specialization..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm w-full text-foreground placeholder:text-muted-foreground"
                        />
                    </div>

                    {isLoading ? (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {[1, 2, 3].map(i => (
                                <Card key={i} className="border border-border/40 bg-card/40 backdrop-blur-md rounded-2xl p-5 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-12 w-12 rounded-full" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-28" />
                                            <Skeleton className="h-3 w-36" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-12 w-full rounded-xl" />
                                    <Skeleton className="h-9 w-full rounded-xl" />
                                </Card>
                            ))}
                        </div>
                    ) : filteredMentors.length > 0 ? (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredMentors.map((mentor) => (
                                <Card 
                                    key={mentor.id} 
                                    className="relative overflow-hidden flex flex-col justify-between transition-all duration-300 border border-border/40 bg-card/40 hover:bg-card/75 hover:shadow-xl hover:border-primary/30 rounded-2xl p-5 group shadow-sm"
                                >
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-4">
                                            <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-base">
                                                {mentor.avatar || (mentor.name ? mentor.name.split(' ').map((n: string) => n[0]).join('') : 'M')}
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">{mentor.name}</h3>
                                                <Badge className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 text-xs py-0 px-2 font-medium" variant="outline">
                                                    {mentor.specialization}
                                                </Badge>
                                            </div>
                                        </div>

                                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                                            {mentor.bio || 'Professional peer mentor available to support your academic learning path.'}
                                        </p>

                                        <div className="space-y-2 pt-2 text-[11px] border-t border-border/40 text-muted-foreground">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5 text-primary" />
                                                <span>{mentor.availability}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <CardFooter className="p-0 pt-5 mt-auto">
                                        <Button 
                                            onClick={() => handleOpenBooking(mentor)}
                                            className="w-full rounded-xl h-10 font-bold text-xs shadow-sm hover:scale-102 hover:shadow-md transition-all duration-200"
                                        >
                                            <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Book Consultation
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="h-48 flex flex-col items-center justify-center text-center p-12 border border-dashed rounded-2xl bg-card/10">
                            <User className="h-10 w-10 text-muted-foreground/40 animate-pulse" />
                            <h3 className="text-base font-bold mt-4">No Mentors Found</h3>
                            <p className="text-xs text-muted-foreground mt-1">Try adjusting your search filters.</p>
                        </div>
                    )}
                </TabsContent>

                {/* Tab: My Bookings */}
                <TabsContent value="my-bookings" className="space-y-6">
                    <Card className="border border-border/40 bg-card/40 backdrop-blur-md shadow-sm rounded-2xl">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Globe className="text-primary h-5 w-5" /> Consultation Log
                            </CardTitle>
                            <CardDescription className="text-xs">All your booked sessions with elite mentors.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2">
                            {isLoading ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Booking ID</TableHead>
                                            <TableHead>Date Booked</TableHead>
                                            <TableHead>Mentor</TableHead>
                                            <TableHead>Session Details</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Consultation Fee</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {[1, 2].map(i => (
                                            <TableRow key={i}>
                                                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                                                <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : studentBookings.length > 0 ? (
                                <TooltipProvider>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-xs">Booking ID</TableHead>
                                                <TableHead className="text-xs">Date Booked</TableHead>
                                                <TableHead className="text-xs">Mentor</TableHead>
                                                <TableHead className="text-xs">Session Details</TableHead>
                                                <TableHead className="text-xs">Status</TableHead>
                                                <TableHead className="text-right text-xs">Consultation Fee</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {studentBookings.map((booking) => (
                                                <TableRow key={booking.id} className="hover:bg-muted/10 transition-colors">
                                                    <TableCell className="font-mono text-xs font-semibold text-muted-foreground">
                                                        #{booking.id.substring(0, 8).toUpperCase()}
                                                    </TableCell>
                                                    <TableCell className="text-xs">
                                                        {booking.createdAt ? format(booking.createdAt.toDate ? booking.createdAt.toDate() : new Date(booking.createdAt), 'PP') : 'N/A'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-bold text-xs text-foreground">
                                                            {booking.items?.[0]?.name.replace('1-on-1 Mentorship with ', '') || 'Elite Mentor'}
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground">Qty: {booking.items?.[0]?.quantity || 1}</div>
                                                    </TableCell>
                                                    <TableCell className="max-w-xs">
                                                        <div className="text-xs text-foreground font-medium truncate">
                                                            {booking.customerAddress}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={statusVariant[booking.status]} className="capitalize text-[10px] font-bold py-0.5 px-2">
                                                            {statusLabel[booking.status] || booking.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-xs text-foreground">
                                                        {currencySymbol}{booking.total.toLocaleString()}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TooltipProvider>
                            ) : (
                                <div className="h-40 flex flex-col items-center justify-center text-center p-8">
                                    <Calendar className="h-10 w-10 text-muted-foreground/30" />
                                    <h3 className="text-sm font-bold mt-3">No Scheduled Sessions</h3>
                                    <p className="text-xs text-muted-foreground mt-1">Book a consultation session to get started.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Booking Modal Dialog */}
            <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
                <DialogContent className="sm:max-w-[480px] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold flex items-center gap-2 text-primary">
                            <Sparkles className="h-5 w-5 text-primary" /> Book Consultation Slot
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Select date, time, and discuss topics with <strong>{selectedMentor?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateBooking} className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="date" className="text-xs font-bold">Select Date</Label>
                                <Input 
                                    id="date" 
                                    type="date"
                                    required
                                    min={format(new Date(), 'yyyy-MM-dd')}
                                    value={bookingDate}
                                    onChange={(e) => setBookingDate(e.target.value)}
                                    className="rounded-xl h-10 text-xs"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="time" className="text-xs font-bold">Select Time Slot</Label>
                                <Input 
                                    id="time" 
                                    type="time"
                                    required
                                    value={bookingTime}
                                    onChange={(e) => setBookingTime(e.target.value)}
                                    className="rounded-xl h-10 text-xs"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="notes" className="text-xs font-bold">Discussion Topic & Notes</Label>
                            <Textarea 
                                id="notes"
                                placeholder="E.g., I need help setting up a study plan for UTME Physics, specifically on thermodynamics."
                                value={bookingNotes}
                                onChange={(e) => setBookingNotes(e.target.value)}
                                className="rounded-xl text-xs min-h-[90px]"
                            />
                        </div>

                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 space-y-1">
                            <div className="flex justify-between items-center text-xs font-bold">
                                <span className="text-muted-foreground">Standard Session Fee:</span>
                                <span className="text-primary">{currencySymbol}2,500</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-normal">
                                Session booking requests will be approved by the admin. Payment can be settled upon session verification.
                            </p>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button 
                                type="button" 
                                variant="ghost" 
                                onClick={() => setIsBookingOpen(false)}
                                className="rounded-xl text-xs hover:bg-muted/80 hover:text-foreground"
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="rounded-xl text-xs font-bold"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Scheduling...
                                    </>
                                ) : (
                                    'Request Booking'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
