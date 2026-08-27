
'use client';
import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAcademy } from "@/context/academy-context";
import { PlusCircle, Search, User, UserCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Student, StudentProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';


function AddCustomerForm({ academyId, onCustomerAdded }: { academyId: string, onCustomerAdded: (customer: Student) => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { triggerRefresh, students, addToQueue } = useAcademy();
    const [name, setName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [phone, setPhone] = React.useState('');
    const [code, setCode] = React.useState('');
    const [isSaving, setIsSaving] = React.useState(false);
    const isSavingRef = React.useRef(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) {
            toast({ title: 'Missing fields', description: 'Student name is required.', variant: 'destructive' });
            return;
        }

        if (email) {
            const emailExists = students?.some(c => c.email.toLowerCase() === email.toLowerCase());
            if (emailExists) {
                toast({ title: 'Student Exists', description: 'A student with this email already exists.', variant: 'destructive' });
                return;
            }
        }

        if (phone) {
            const phoneExists = students?.some(c => c.phone === phone);
            if (phoneExists) {
                toast({ title: 'Duplicate Phone Number', description: 'A student with this phone number already exists.', variant: 'destructive' });
                return;
            }
        }

        if (code) {
            const codeExists = students?.some(c => c.code?.toLowerCase() === code.toLowerCase());
            if (codeExists) {
                toast({ title: 'Duplicate Code', description: 'A student with this unique code already exists.', variant: 'destructive' });
                return;
            }
        }

        if (isSaving || isSavingRef.current) return;
        isSavingRef.current = true;
        setIsSaving(true);
        try {
            const id = uuidv4();
            const newCustomerData = {
                name,
                email,
                phone,
                code: code.trim().toUpperCase(),
                academyId,
                loyaltyPoints: 0,
                totalSpent: 0,
                id,
                createdAt: new Date(),
                lowercaseName: name.toLowerCase(),
                lowercaseEmail: email ? email.toLowerCase() : '',
            };

            // Use unified offline-first queue for BOTH PWA/Web and Desktop.
            // This ensures optimistic UI rendering, offline robustness,
            // proper lowercase indexing, and reliable cross-environment syncing.
            addToQueue({
                type: 'add-customer',
                payload: newCustomerData,
            }, `Adding student: ${name}`);

            toast({ title: 'Student Registered', description: `${name} has been registered successfully.`, variant: 'success' });
            triggerRefresh();
            onCustomerAdded(newCustomerData as Student);

        } catch (error) {
            toast({ title: 'Error', description: 'Could not register student.', variant: 'destructive' });
            isSavingRef.current = false;
            setIsSaving(false);
        }
    }

    return (
        <form onSubmit={handleSave}>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="name" className="text-right">Student Name</label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="email" className="text-right">Email <span className="text-[10px] text-muted-foreground">(Optional)</span></label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="phone" className="text-right">Phone <span className="text-[10px] text-muted-foreground">(Optional)</span></label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="code" className="text-right">Student ID <span className="text-[10px] text-muted-foreground">(Optional)</span></label>
                    <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. PIN-2026-001" className="col-span-3" />
                </div>
            </div>
            <DialogFooter>
                <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Register Student
                </Button>
            </DialogFooter>
        </form>
    );
}

export default function CustomerPage() {
    const { selectedStudent, selectStudent, students, isLoading: isPosLoading, currentUserProfile: currentUser, searchCustomers } = useAcademy();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [searchedCustomers, setSearchedCustomers] = React.useState<Student[] | null>(null);
    const [isSearching, setIsSearching] = React.useState(false);
    const [isAddCustomerOpen, setIsAddCustomerOpen] = React.useState(false);
    const [isNavigating, setIsNavigating] = React.useState(false);

    const filteredCustomers = React.useMemo(() => {
        if (!searchTerm.trim()) return students || [];

        const lowerTerm = searchTerm.toLowerCase();
        const localResults = students?.filter(customer => {
            return (
                (customer.name && customer.name.toLowerCase().includes(lowerTerm)) ||
                (customer.email && customer.email.toLowerCase().includes(lowerTerm)) ||
                (customer.code && customer.code.toLowerCase().includes(lowerTerm)) ||
                (customer.phone && customer.phone.toLowerCase().includes(lowerTerm))
            );
        }) || [];

        // Combine with results from Firestore search for cases where customer might not be in the initial batch
        const combined = [...localResults, ...(searchedCustomers || [])];
        
        // Ensure uniqueness by ID
        const uniqueMap = new Map();
        combined.forEach(item => {
            if (item && item.id) uniqueMap.set(item.id, item);
        });
        const uniqueItems = Array.from(uniqueMap.values());

        // Sort by createdAt descending to show newest first
        return uniqueItems.sort((a, b) => {
            const safeDate = (obj: any) => {
                if (!obj?.createdAt) return 0;
                if (obj.createdAt.toDate) return obj.createdAt.toDate().getTime();
                if (obj.createdAt instanceof Date) return obj.createdAt.getTime();
                if (typeof obj.createdAt === 'string' || typeof obj.createdAt === 'number') return new Date(obj.createdAt).getTime();
                return 0;
            };
            return safeDate(b) - safeDate(a);
        });
    }, [searchTerm, students, searchedCustomers]);


    const isLoading = isPosLoading || (searchTerm.trim() && isSearching && (!filteredCustomers || filteredCustomers.length === 0));

    React.useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.trim()) {
                setIsSearching(true);
                // We still call searchCustomers to hit the DB for potential students outside the initial 10k batch
                const results = await searchCustomers(searchTerm);
                setSearchedCustomers(results);
                setIsSearching(false);
            } else {
                setSearchedCustomers(null);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, searchCustomers]);



    const handleNext = () => {
        setIsNavigating(true);
        router.push('/cbt-simulator/exam-mode');
    };

    return (
        <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Select a Peer / Mentor</CardTitle>
                        <CardDescription>Search for an existing peer, mentor, or classmate.</CardDescription>
                        <div className="flex items-center gap-4 pt-4">
                            <div className="relative w-full">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name, email, or student ID..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline">
                                        <PlusCircle className="mr-2 h-4 w-4" /> Register Student
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px]">
                                    <DialogHeader>
                                        <DialogTitle>Register Student</DialogTitle>
                                        <DialogDescription>
                                            Enter the details for the new student/peer.
                                        </DialogDescription>
                                    </DialogHeader>
                                    {currentUser?.academyId && (
                                        <AddCustomerForm 
                                            academyId={currentUser.academyId} 
                                            onCustomerAdded={(c) => {
                                                selectStudent(c);
                                                setIsAddCustomerOpen(false);
                                            }} 
                                        />
                                    )}

                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                        {isLoading ? (
                            <div className="space-y-2">
                                <Skeleton className="h-16 w-full" />
                                <Skeleton className="h-16 w-full" />
                                <Skeleton className="h-16 w-full" />
                            </div>
                        ) : filteredCustomers && filteredCustomers.length > 0 ? (
                            filteredCustomers.map(customer => (
                                <button key={customer.id} onClick={() => selectStudent(customer)} className="w-full text-left">
                                    <Card className={selectedStudent?.id === customer.id ? "border-primary" : ""}>
                                        <CardContent className="p-3 flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium">{customer.name}</p>
                                                    {customer.code && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono font-bold text-muted-foreground">{customer.code}</span>}
                                                </div>
                                                <p className="text-sm text-muted-foreground">{customer.email}</p>
                                            </div>
                                            {selectedStudent?.id === customer.id && <UserCheck className="h-5 w-5 text-primary" />}
                                        </CardContent>
                                    </Card>
                                </button>
                            ))
                        ) : (
                            <p className="text-muted-foreground text-center pt-8">{searchTerm ? "No students/peers found." : "No students/peers registered yet."}</p>
                        )}
                    </CardContent>
                </Card>
            </div>
            <div>
                <Card>
                    <CardHeader>
                        <CardTitle>Selected Peer / Mentor</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        {selectedStudent ? (
                            <div>
                                <User className="mx-auto h-12 w-12 text-muted-foreground" />
                                <p className="font-semibold mt-2">{selectedStudent.name}</p>
                                <p className="text-sm text-muted-foreground">{selectedStudent.email}</p>
                                <Button variant="link" onClick={() => selectStudent(null)}>Clear selection</Button>
                            </div>
                        ) : (
                            <div className="py-8">
                                <User className="mx-auto h-12 w-12 text-muted-foreground" />
                                <p className="text-muted-foreground mt-2">No peer/mentor selected.</p>
                                <p className="text-xs text-muted-foreground">This is optional (for battles or mentorship validation).</p>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex gap-2">
                        <Button className="w-full" variant="outline" asChild>
                            <Link href="/cbt-simulator/select-subjects">Back</Link>
                        </Button>
                        <Button className="w-full" onClick={handleNext} disabled={isNavigating}>
                            {isNavigating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Next: Select Exam Mode
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
