'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Suspense } from 'react';
import {
    ChevronLeft,
    Upload,
    Loader2,
    Barcode as BarcodeIcon,
    Plus,
    Trash,
    Trash2,
    Layers,
    QrCode,
    AlertCircle,
    Search,
    BookOpen,
    CheckSquare,
    Brain,
    UserCheck,
    Trophy,
    Play,
    CheckCircle2,
    HelpCircle,
    Check,
    Mail,
    ArrowRight
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useFieldArray } from "react-hook-form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { collection, query, where, orderBy, limit, onSnapshot, doc, getDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { Subject, StudentProfile, ActivityLog } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useAcademy } from '@/context/academy-context';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from 'date-fns';
import { History as HistoryIcon } from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import BarcodeDisplay from 'react-barcode';
import { Skeleton } from '@/components/ui/skeleton';
import { logAuditEvent } from '@/lib/audit';
import { BarcodeScanner } from '@/components/syllabus-tracker/barcode-scanner';
import { cn } from '@/lib/utils';
import { Combobox } from '@/components/ui/combobox';
import Papa from 'papaparse';

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UploadCloud, FileSpreadsheet, CheckCircle2 as CheckCircleIcon } from "lucide-react";

const productSchema = z.object({
    name: z.string().min(3, "Subject name must be at least 3 characters."),
    description: z.string().optional(),
    price: z.coerce.number().min(0, "Price must be a positive number."),
    costPrice: z.coerce.number().min(0, "Cost price must be a positive number.").optional(),
    stock: z.coerce.number().int("Stock must be a whole number."),
    sku: z.string().optional(),
    category: z.string().optional(),
    categoryType: z.enum(['product', 'service']).default('product'),

    // Advanced Features
    type: z.enum(['single', 'variant', 'composite']).default('single'),
    baseUnit: z.string().optional(),
    uomConversions: z.array(z.object({
        unitName: z.string().min(1, "Unit name required"),
        multiplier: z.coerce.number().min(1, "Multiplier must be at least 1"),
        price: z.coerce.number().optional()
    })).optional(),
    components: z.array(z.object({
        subjectId: z.string().min(1, "Subject required"),
        quantity: z.coerce.number().min(1, "Quantity required")
    })).optional(),
    questions: z.array(z.object({
        id: z.string(),
        questionText: z.string(),
        options: z.array(z.string()),
        correctAnswer: z.enum(['A', 'B', 'C', 'D']),
        explanation: z.string().optional(),
    })).optional(),
    tutorName: z.string().optional(),
    tutorEmail: z.string().optional(),
    tutorBio: z.string().optional(),
    modules: z.array(z.object({
        title: z.string().min(1, "Module title is required"),
        topics: z.array(z.object({
            id: z.string(),
            title: z.string().min(1, "Topic title is required")
        }))
    })).optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

const parseQuestionsCSV = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const headers = results.meta.fields || [];
                const lowerCaseHeaders = headers.map(h => h.toLowerCase().trim());
                
                const findHeader = (possibleNames: string[]): string | undefined => {
                    for (const name of possibleNames) {
                        const index = lowerCaseHeaders.indexOf(name.toLowerCase());
                        if (index !== -1) return headers[index];
                    }
                    return undefined;
                };

                const hQuestion = findHeader(['question', 'questiontext', 'text', 'body', 'question_text', 'question text']);
                const hA = findHeader(['a', 'option a', 'option_a', 'choice a', 'choice_a', 'option1', 'option_1']);
                const hB = findHeader(['b', 'option b', 'option_b', 'choice b', 'choice_b', 'option2', 'option_2']);
                const hC = findHeader(['c', 'option c', 'option_c', 'choice c', 'choice_c', 'option3', 'option_3']);
                const hD = findHeader(['d', 'option d', 'option_d', 'choice d', 'choice_d', 'option4', 'option_4']);
                const hAnswer = findHeader(['answer', 'correct', 'correctanswer', 'correct_answer', 'key', 'correct option']);
                const hExplanation = findHeader(['explanation', 'explain', 'reason', 'solution']);

                if (!hQuestion || !hA || !hB || !hC || !hD || !hAnswer) {
                    reject(new Error("CSV must contain columns for Question, Option A, Option B, Option C, Option D, and Correct Answer."));
                    return;
                }

                const questionsList = results.data.map((row: any) => {
                    let ans = String(row[hAnswer] || '').trim().toUpperCase();
                    if (ans.startsWith('A') || ans === '1') ans = 'A';
                    else if (ans.startsWith('B') || ans === '2') ans = 'B';
                    else if (ans.startsWith('C') || ans === '3') ans = 'C';
                    else if (ans.startsWith('D') || ans === '4') ans = 'D';
                    else ans = 'A';

                    return {
                        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
                        questionText: String(row[hQuestion] || '').trim(),
                        options: [
                            String(row[hA] || '').trim(),
                            String(row[hB] || '').trim(),
                            String(row[hC] || '').trim(),
                            String(row[hD] || '').trim()
                        ],
                        correctAnswer: ans as 'A' | 'B' | 'C' | 'D',
                        explanation: hExplanation ? String(row[hExplanation] || '').trim() : ''
                    };
                }).filter(q => q.questionText.length > 0);

                resolve(questionsList);
            },
            error: (err) => {
                reject(err);
            }
        });
    });
};

function useCurrentUserProfile() {
    const { user } = useUser();
    const firestore = useFirestore();
    const userDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    const { data: userProfile, isLoading } = useDoc<StudentProfile>(userDocRef);

    return { profile: userProfile, isLoading };
}

function EditProductSkeleton() {
    return (
        <div className="grid flex-1 auto-rows-max gap-4">
            <div className="flex items-center gap-4">
                <Skeleton className="h-7 w-7 rounded-md" />
                <Skeleton className="h-7 w-48" />
                <div className="hidden items-center gap-2 md:ml-auto md:flex">
                    <Skeleton className="h-9 w-20" />
                    <Skeleton className="h-9 w-24" />
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
                <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
                    <Card><CardHeader><Skeleton className="h-6 w-32 mb-2" /><Skeleton className="h-4 w-48" /></CardHeader><CardContent><div className="grid gap-6"><Skeleton className="h-10 w-full" /><Skeleton className="h-20 w-full" /></div></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-6 w-32 mb-2" /><Skeleton className="h-4 w-48" /></CardHeader><CardContent><div className="grid gap-6 sm:grid-cols-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div></CardContent></Card>
                </div>
                <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
                    <Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent><Skeleton className="h-10 w-full" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-6 w-32 mb-2" /><Skeleton className="h-4 w-48" /></CardHeader><CardContent><Skeleton className="aspect-square w-full" /></CardContent></Card>
                </div>
            </div>
        </div>
    )
}

function EditProductContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const subjectId = searchParams.get('id');

    const { toast } = useToast();
    const { currentUserProfile, academy, queuedActions, addToQueue, subjects } = useAcademy();
    const firestore = useFirestore();

    const productDocRef = useMemoFirebase(() => (firestore && subjectId ? doc(firestore, 'subjects', subjectId) : null), [firestore, subjectId]);
    const { data: remoteProduct, isLoading: isRemoteProductLoading } = useDoc<Subject>(productDocRef);

    const localProduct = React.useMemo(() => {
        return subjects?.find(p => p.id === subjectId) || null;
    }, [subjects, subjectId]);

    const product = remoteProduct || localProduct;
    const isProductLoading = isRemoteProductLoading && !localProduct;

    const [isSaving, setIsSaving] = React.useState(false);
    const isSubmitting = React.useRef(false);
    const [isMounted, setIsMounted] = React.useState(false);
    
    React.useEffect(() => {
        setIsMounted(true);
    }, []);
    const [imageFile, setImageFile] = React.useState<File | null>(null);
    const [imagePreview, setImagePreview] = React.useState<string | null>(null);
    const [isScannerOpen, setIsScannerOpen] = React.useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
    const [stockLogs, setStockLogs] = React.useState<ActivityLog[]>([]);
    const [isLogsLoading, setIsLogsLoading] = React.useState(true);

    // Fetch Stock Logs
    React.useEffect(() => {
        if (!academy?.id || !firestore || !product?.id) {
            if (!isProductLoading) setIsLogsLoading(false);
            return;
        }

        const stockQuery = query(
            collection(firestore, 'businessInstances', academy.id, 'activityLogs'),
            where('entityId', '==', product.id),
            where('action', 'in', ['product.stock_adjustment', 'product.create', 'product.update', 'product.bulk_update']),
            orderBy('createdAt', 'desc'),
            limit(50)
        );

        // Fallback timer for offline/slow connection to prevent infinite spinner
        const timeoutId = setTimeout(() => {
            setIsLogsLoading(false);
        }, 4000);


        const unsubscribe = onSnapshot(stockQuery, (snap) => {
            const logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));
            // Filter to ensure we only show logs that actually affected stock or are explicit adjustments
            const filtered = logs.filter(log => {
                if (log.action === 'product.stock_adjustment' || log.action === 'product.create') return true;
                if (log.action === 'product.update' || log.action === 'product.bulk_update') {
                    // Show if it explicitly mentions stock or adjustment
                    return log.details?.adjustment !== undefined || 
                           log.details?.newStock !== undefined || 
                           log.details?.stock !== undefined;
                }
                return false;
            });
            setStockLogs(filtered);
            setIsLogsLoading(false);
            clearTimeout(timeoutId);
        });

        return () => {
            unsubscribe();
            clearTimeout(timeoutId);
        };
    }, [academy?.id, firestore, product?.id, isProductLoading]);
    
    const combinedLogs = React.useMemo(() => {
        const pendingLogs = (queuedActions || [])
            .filter(a => a.type === 'add-audit-log' && a.payload.entityId === product?.id)
            .map(a => ({
                id: a.id,
                ...a.payload,
                isPending: true,
                createdAt: { toDate: () => new Date(a.timestamp) }
            }));

        const all = [...pendingLogs, ...stockLogs];
        return all.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date();
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date();
            return dateB.getTime() - dateA.getTime();
        });
    }, [queuedActions, stockLogs, product?.id]);



    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: "",
            description: "",
            price: 0,
            costPrice: 0,
            stock: 0,
            sku: "",
            category: "",
            categoryType: "product",
            type: "single",
            baseUnit: "Piece",
            uomConversions: [],
            components: [],
            questions: [],
            tutorName: "",
            tutorEmail: "",
            tutorBio: "",
            modules: [],
        },
    });

    const { fields: uomFields, append: appendUom, remove: removeUom } = useFieldArray({
        control: form.control,
        name: "uomConversions"
    });

    const { fields: componentFields, append: appendComponent, remove: removeComponent } = useFieldArray({
        control: form.control,
        name: "components"
    });

    const productType = form.watch("type");
    const categoryType = form.watch("categoryType");

    const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({
        control: form.control,
        name: "questions"
    });

    const [questionSearch, setQuestionSearch] = React.useState("");
    const [isCsvParsing, setIsCsvParsing] = React.useState(false);

    const watchedQuestions = form.watch("questions") || [];
    const filteredQuestions = React.useMemo(() => {
        return watchedQuestions.map((q, idx) => ({ q, idx })).filter(item => {
            return (item.q?.questionText || "").toLowerCase().includes(questionSearch.toLowerCase());
        });
    }, [watchedQuestions, questionSearch]);

    const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsCsvParsing(true);
        try {
            const parsedQuestions = await parseQuestionsCSV(file);
            if (parsedQuestions.length === 0) {
                toast({
                    variant: 'destructive',
                    title: 'Empty CSV',
                    description: 'No valid questions found in the CSV.'
                });
                return;
            }
            form.setValue('questions', parsedQuestions, { shouldDirty: true, shouldValidate: true });
            toast({
                variant: 'success',
                title: 'Import Successful',
                description: `Successfully loaded ${parsedQuestions.length} questions.`
            });
        } catch (err: any) {
            console.error(err);
            toast({
                variant: 'destructive',
                title: 'Parse Failed',
                description: err.message || 'Failed to parse CSV file.'
            });
        } finally {
            setIsCsvParsing(false);
            event.target.value = '';
        }
    };


    React.useEffect(() => {
        if (product) {
            form.reset({
                ...product,
                tutorName: product.tutorName || "",
                tutorEmail: product.tutorEmail || "",
                tutorBio: product.tutorBio || "",
                modules: product.modules || [],
            });
            if (product.imageUrl) {
                setImagePreview(product.imageUrl);
            }
        }
    }, [product, form]);

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > MAX_FILE_SIZE) {
                toast({
                    variant: 'destructive',
                    title: 'Image Too Large',
                    description: 'Please select an image smaller than 5MB.',
                });
                event.target.value = '';
                return;
            }
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = async (values: ProductFormValues) => {
        if (isSaving || isSubmitting.current) return;
        isSubmitting.current = true;
        setIsSaving(true);
        if (!product || !currentUserProfile || !academy) {
            isSubmitting.current = false;
            setIsSaving(false);
            return;
        }

        let imageUrl = product?.imageUrl || '';

        try {
            // 1. If we have an image, we try to upload it backgrounding if possible, 
            // but for simplicity here we'll do it sequentially if online.
            if (imageFile && navigator.onLine) {
                const formData = new FormData();
                formData.append('image', imageFile);
                const apiKey = '2ec1d17c7ad748bbb605eda60a54a896';
                const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, { method: 'POST', body: formData });
                const result = await response.json();
                if (result.success) {
                    imageUrl = result.data.url;
                }
            }

            const updatedValues = { ...values, imageUrl };
            const cleanData = Object.fromEntries(
                Object.entries(updatedValues).filter(([_, v]) => v !== undefined)
            );

            // 2. Queue the update instead of direct write
            addToQueue({
                type: 'update-product',
                payload: {
                    subjectId: product.id,
                    values: cleanData
                }
            }, `Updating product: ${values.name}`);

            // 3. Log stock adjustment if changed via queue for offline support
            if (values.stock !== product.stock) {
                addToQueue({
                    type: 'add-audit-log',
                    payload: {
                        academyId: academy.id,
                        userId: currentUserProfile.id,
                        userName: currentUserProfile.name,
                        userEmail: currentUserProfile.email,
                        userRole: currentUserProfile.role,
                        action: 'product.stock_adjustment',
                        entityType: 'Subject',
                        entityId: product.id,
                        details: { 
                            entityName: product.name,
                            oldStock: product.stock, 
                            newStock: values.stock, 
                            adjustment: values.stock - (product.stock || 0),
                            reason: 'Full Edit Page'
                        }
                    }
                }, `Logging stock adjustment for ${product.name}`);
            }

            toast({ 
                variant: 'success', 
                title: 'Changes Queued', 
                description: `${values.name} will be updated ${navigator.onLine ? 'momentarily' : 'when connection is restored'}.` 
            });
            
            isSubmitting.current = false;
            setIsSaving(false);
            
            router.push('/syllabus-tracker');

        } catch (error: any) {
            console.error("Failed to queue product update:", error);
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message || 'An unexpected error occurred.' });
            isSubmitting.current = false;
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!subjectId || !academy || !currentUserProfile) return;

        setIsDeleteDialogOpen(false);

        addToQueue({
            type: 'delete-product',
            payload: { productIds: [subjectId] }
        }, `Deleting product ${product?.name}`);

        toast({ variant: 'default', title: 'Deletion Queued', description: `${product?.name} will be deleted.` });
        router.push('/syllabus-tracker');
    };

    const isLoading = !isMounted || isProductLoading || !firestore;
    const canManageProduct = currentUserProfile?.role === 'admin' || currentUserProfile?.role === 'manager';

    if (isLoading) {
        return <EditProductSkeleton />;
    }

    if (!product) {
        return <div>Subject not found.</div>;
    }

    if (!canManageProduct) {
        const initialTab = searchParams.get('tab') || 'details';
        return <StudentLearningSpace product={product} router={router} initialTab={initialTab} />;
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid flex-1 auto-rows-max gap-4 w-full max-w-full px-1.5 sm:px-0 overflow-x-hidden">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                        <Link href="/syllabus-tracker">
                            <ChevronLeft className="h-4 w-4" />
                            <span className="sr-only">Back</span>
                        </Link>
                    </Button>
                    <h1 className="flex-1 min-w-0 text-xl font-semibold tracking-tight break-words leading-normal md:leading-relaxed">
                        Edit {categoryType === 'service' ? 'Service' : 'Subject'}: {product.name}
                    </h1>
                    <div className="hidden items-center gap-2 md:ml-auto md:flex">
                        <Button variant="outline" size="lg" type="button" onClick={() => router.push('/syllabus-tracker')}>
                            Discard
                        </Button>
                        {canManageProduct && (
                            <Button variant="destructive" size="lg" type="button" onClick={() => setIsDeleteDialogOpen(true)} disabled={isSaving}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </Button>
                        )}
                        {canManageProduct && (
                            <Button size="lg" type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save {categoryType === 'service' ? 'Service' : 'Subject'}
                            </Button>
                        )}
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
                    <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
                        <Tabs defaultValue="details" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="details">Subject Details</TabsTrigger>
                                <TabsTrigger value="syllabus">Syllabus & Tutors</TabsTrigger>
                                <TabsTrigger value="questions" className="relative">
                                    CBT Questions
                                    {watchedQuestions.length > 0 && (
                                        <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary hover:bg-primary/20 border-none">
                                            {watchedQuestions.length}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="details" className="space-y-4 lg:space-y-8 mt-4 animate-in fade-in-50 duration-200">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{categoryType === 'service' ? 'Service' : 'Subject'} Details</CardTitle>
                                        <CardDescription>
                                            Update the core details for your {categoryType === 'service' ? 'service' : 'product'}.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid gap-6">
                                            <FormField
                                                control={form.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Name</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="e.g. Quantum HD Monitor" {...field} disabled={!canManageProduct} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="description"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Description</FormLabel>
                                                        <FormControl>
                                                            <Textarea placeholder="A detailed description of the product." className="min-h-32" {...field} disabled={!canManageProduct} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                {categoryType === 'product' && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Inventory Configuration</CardTitle>
                                            <CardDescription>Configure how this item is organized and sold.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <FormField
                                                control={form.control}
                                                name="type"
                                                render={({ field }) => (
                                                    <FormItem className="space-y-3">
                                                        <FormLabel>Subject Type</FormLabel>
                                                        <FormControl>
                                                            <RadioGroup
                                                                onValueChange={field.onChange}
                                                                defaultValue={field.value}
                                                                className="flex flex-col sm:flex-row gap-4"
                                                                disabled={!canManageProduct}
                                                            >
                                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                                    <FormControl>
                                                                        <RadioGroupItem value="single" />
                                                                    </FormControl>
                                                                    <FormLabel className="font-normal">Standard Item</FormLabel>
                                                                </FormItem>
                                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                                    <FormControl>
                                                                        <RadioGroupItem value="composite" />
                                                                    </FormControl>
                                                                    <FormLabel className="font-normal">Composite (Bundle)</FormLabel>
                                                                </FormItem>
                                                            </RadioGroup>
                                                        </FormControl>
                                                        <FormDescription>
                                                            {productType === 'composite' ? "This item is built from other subjects. Stock is automatically managed." : "Standard individual product with its own stock."}
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <Separator />

                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <FormLabel>Units of Measure (UoM)</FormLabel>
                                                    <Button type="button" variant="outline" size="sm" onClick={() => appendUom({ unitName: "", multiplier: 1 })} disabled={!canManageProduct}>
                                                        <Plus className="h-4 w-4 mr-2" /> Add UoM
                                                    </Button>
                                                </div>

                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <FormField
                                                        control={form.control}
                                                        name="baseUnit"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-xs">Base Unit</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="e.g. Piece" {...field} disabled={!canManageProduct} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>

                                                {uomFields.map((field, index) => (
                                                    <div key={field.id} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end p-3 border rounded-lg bg-muted/30">
                                                        <FormField
                                                            control={form.control}
                                                            name={`uomConversions.${index}.unitName`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-xs">Unit Name</FormLabel>
                                                                    <FormControl><Input placeholder="e.g. Carton" {...field} disabled={!canManageProduct} /></FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={form.control}
                                                            name={`uomConversions.${index}.multiplier`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-xs">Contains (multiplier)</FormLabel>
                                                                    <FormControl><Input type="number" {...field} disabled={!canManageProduct} /></FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <div className="flex gap-2">
                                                            <FormField
                                                                control={form.control}
                                                                name={`uomConversions.${index}.price`}
                                                                render={({ field }) => (
                                                                    <FormItem className="flex-1">
                                                                        <FormLabel className="text-xs">Price (Opt.)</FormLabel>
                                                                        <FormControl><Input type="number" placeholder="Override" {...field} disabled={!canManageProduct} /></FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeUom(index)} className="text-destructive" disabled={!canManageProduct}><Trash className="h-4 w-4" /></Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {productType === 'composite' && (
                                                <>
                                                    <Separator />
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <FormLabel>Composite Components</FormLabel>
                                                            <Button type="button" variant="outline" size="sm" onClick={() => appendComponent({ subjectId: "", quantity: 1 })} disabled={!canManageProduct}>
                                                                <Plus className="h-4 w-4 mr-2" /> Add Component
                                                            </Button>
                                                        </div>
                                                        <FormDescription>Select subjects that make up this bundle.</FormDescription>

                                                        {componentFields.map((field, index) => (
                                                            <div key={field.id} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end p-3 border rounded-lg bg-muted/30">
                                                                <FormField
                                                                    control={form.control}
                                                                    name={`components.${index}.subjectId`}
                                                                    render={({ field }) => (
                                                                        <FormItem className="sm:col-span-3">
                                                                            <FormLabel className="text-xs">Subject</FormLabel>
                                                                                <FormControl>
                                                                                    <Combobox
                                                                                        options={subjects?.filter(p => (!p.type || p.type === 'single') && p.id !== subjectId).map(p => ({
                                                                                            label: `${p.name} (Stock: ${p.stock})`,
                                                                                            value: p.id
                                                                                        })) || []}
                                                                                        value={field.value || ""}
                                                                                        onChange={field.onChange}
                                                                                        placeholder="Select component"
                                                                                        searchPlaceholder="Search subjects..."
                                                                                        disabled={!canManageProduct}
                                                                                    />
                                                                                </FormControl>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                                <FormField
                                                                    control={form.control}
                                                                    name={`components.${index}.quantity`}
                                                                    render={({ field }) => (
                                                                        <FormItem>
                                                                            <FormLabel className="text-xs">Qty</FormLabel>
                                                                            <FormControl><Input type="number" {...field} disabled={!canManageProduct} /></FormControl>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeComponent(index)} className="text-destructive" disabled={!canManageProduct}><Trash className="h-4 w-4" /></Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Pricing{categoryType === 'product' && ' & Stock'}</CardTitle>
                                        <CardDescription>
                                            Manage {categoryType === 'service' ? 'pricing information for this service' : 'inventory and pricing information for this product'}.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
                                            {categoryType === 'product' && (
                                                <FormField
                                                    control={form.control}
                                                    name="sku"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Barcode (SKU)</FormLabel>
                                                            <div className="flex gap-2">
                                                                <FormControl>
                                                                    <Input placeholder="QHDM-001" {...field} disabled={!canManageProduct} />
                                                                </FormControl>
                                                                {canManageProduct && (
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="icon"
                                                                        onClick={() => setIsScannerOpen(true)}
                                                                        className="shrink-0"
                                                                    >
                                                                        <QrCode className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            )}
                                            {categoryType === 'product' && (
                                                <FormField
                                                    control={form.control}
                                                    name="stock"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Stock</FormLabel>
                                                            <FormControl>
                                                                <Input type="number" placeholder="25" {...field} disabled={!canManageProduct} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            )}
                                            <FormField
                                                control={form.control}
                                                name="price"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Price</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" step="0.01" placeholder="349.99" {...field} disabled={!canManageProduct} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="costPrice"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Cost Price</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" step="0.01" placeholder="250.00" {...field} disabled={!canManageProduct} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="syllabus" className="space-y-4 lg:space-y-8 mt-4 animate-in fade-in-50 duration-200">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Assigned Instructor Profile</CardTitle>
                                        <CardDescription>
                                            Configure tutor information for this subject. This will be shown on the student's dashboard.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <FormField
                                                control={form.control}
                                                name="tutorName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Instructor Name</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="e.g. Dr. Arthur Pendelton" {...field} disabled={!canManageProduct} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="tutorEmail"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Instructor Email</FormLabel>
                                                        <FormControl>
                                                            <Input type="email" placeholder="e.g. tutor@pinnacle.edu" {...field} disabled={!canManageProduct} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name="tutorBio"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Instructor Biography</FormLabel>
                                                    <FormControl>
                                                        <Textarea placeholder="Brief biography and credentials..." className="min-h-20" {...field} disabled={!canManageProduct} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle>Academic Syllabus Outline</CardTitle>
                                            <CardDescription>
                                                Design modules and nested learning topics for the curriculum.
                                            </CardDescription>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                const currentModules = form.getValues("modules") || [];
                                                form.setValue("modules", [
                                                    ...currentModules,
                                                    { title: `Module ${currentModules.length + 1}: New Module`, topics: [] }
                                                ], { shouldDirty: true, shouldValidate: true });
                                            }}
                                            disabled={!canManageProduct}
                                        >
                                            <Plus className="w-3.5 h-3.5 mr-1" /> Add Module
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <SyllabusModulesBuilder control={form.control} form={form} disabled={!canManageProduct} />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="questions" className="space-y-4 mt-4 animate-in fade-in-50 duration-200">
                                <Card>
                                    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div className="space-y-1">
                                            <CardTitle>CBT Questions Bank</CardTitle>
                                            <CardDescription>
                                                Upload, search, and edit multiple-choice questions for this subject.
                                            </CardDescription>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Input
                                                type="file"
                                                accept=".csv"
                                                className="hidden"
                                                id="questions-csv-file"
                                                onChange={handleCSVUpload}
                                                disabled={isCsvParsing || !canManageProduct}
                                            />
                                            <Button asChild variant="outline" size="sm" type="button" disabled={isCsvParsing || !canManageProduct}>
                                                <label htmlFor="questions-csv-file" className="flex items-center gap-1.5 cursor-pointer">
                                                    {isCsvParsing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                                                    Import CSV Template
                                                </label>
                                            </Button>
                                            
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => appendQuestion({
                                                    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
                                                    questionText: "",
                                                    options: ["", "", "", ""],
                                                    correctAnswer: "A",
                                                    explanation: ""
                                                })}
                                                disabled={!canManageProduct}
                                            >
                                                <Plus className="w-3.5 h-3.5 mr-1" /> Add Question
                                            </Button>

                                            {watchedQuestions.length > 0 && (
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => form.setValue('questions', [], { shouldDirty: true, shouldValidate: true })}
                                                    disabled={!canManageProduct}
                                                >
                                                    <Trash className="w-3.5 h-3.5 mr-1" /> Clear All
                                                </Button>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="bg-muted/40 p-4 rounded-lg border text-xs space-y-2 text-muted-foreground">
                                            <p className="font-semibold text-foreground flex items-center gap-1">
                                                <FileSpreadsheet className="w-3.5 h-3.5 text-primary" /> CSV Formatting Rules:
                                            </p>
                                            <p>Your CSV should contain the following column headers (case-insensitive):</p>
                                            <code className="block bg-muted p-2 rounded text-[10px] select-all overflow-x-auto text-primary">
                                                Question, Option A, Option B, Option C, Option D, Correct Answer, Explanation
                                            </code>
                                            <p>Correct Answer must be A, B, C, or D.</p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className="relative flex-1">
                                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type="search"
                                                    placeholder="Search questions..."
                                                    className="pl-8"
                                                    value={questionSearch}
                                                    onChange={e => setQuestionSearch(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <ScrollArea className="h-[500px] pr-4">
                                            <div className="space-y-4">
                                                {filteredQuestions.length === 0 ? (
                                                    <div className="text-center py-12 border border-dashed rounded-lg bg-muted/20">
                                                        <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                                                        <p className="text-sm font-semibold text-muted-foreground">No questions found</p>
                                                        <p className="text-xs text-muted-foreground/70 mt-1">
                                                            {questionSearch ? "Try refining your search keyword." : "Add a question manually or import from a CSV template."}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    filteredQuestions.map(({ q, idx }) => (
                                                        <div key={q.id || idx} className="border rounded-lg p-4 space-y-4 bg-card/60 backdrop-blur-sm shadow-sm relative hover:border-primary/20 transition-colors">
                                                            <div className="flex justify-between items-start gap-4">
                                                                <span className="font-semibold text-xs text-primary bg-primary/5 px-2.5 py-1 rounded-full border border-primary/10">
                                                                    Question {idx + 1}
                                                                </span>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="text-destructive h-8 w-8 hover:bg-destructive/10"
                                                                    onClick={() => removeQuestion(idx)}
                                                                    disabled={!canManageProduct}
                                                                >
                                                                    <Trash className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                            
                                                            <FormField
                                                                control={form.control}
                                                                name={`questions.${idx}.questionText`}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel className="text-xs font-medium">Question Text</FormLabel>
                                                                        <FormControl>
                                                                            <Textarea 
                                                                                placeholder="Type question text..." 
                                                                                className="min-h-16" 
                                                                                {...field} 
                                                                                disabled={!canManageProduct}
                                                                            />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />

                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                {['A', 'B', 'C', 'D'].map((opt, optIdx) => (
                                                                    <FormField
                                                                        key={opt}
                                                                        control={form.control}
                                                                        name={`questions.${idx}.options.${optIdx}`}
                                                                        render={({ field }) => (
                                                                            <FormItem>
                                                                                <FormLabel className="text-xs font-medium">Option {opt}</FormLabel>
                                                                                <FormControl>
                                                                                    <Input 
                                                                                        placeholder={`Option ${opt} text`} 
                                                                                        {...field} 
                                                                                        disabled={!canManageProduct}
                                                                                    />
                                                                                </FormControl>
                                                                                <FormMessage />
                                                                            </FormItem>
                                                                        )}
                                                                    />
                                                                ))}
                                                            </div>

                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                <FormField
                                                                    control={form.control}
                                                                    name={`questions.${idx}.correctAnswer`}
                                                                    render={({ field }) => (
                                                                        <FormItem>
                                                                            <FormLabel className="text-xs font-medium">Correct Option</FormLabel>
                                                                            <Select 
                                                                                onValueChange={field.onChange} 
                                                                                value={field.value}
                                                                                disabled={!canManageProduct}
                                                                            >
                                                                                <FormControl>
                                                                                    <SelectTrigger>
                                                                                        <SelectValue placeholder="Select correct answer" />
                                                                                    </SelectTrigger>
                                                                                </FormControl>
                                                                                <SelectContent>
                                                                                    <SelectItem value="A">Option A</SelectItem>
                                                                                    <SelectItem value="B">Option B</SelectItem>
                                                                                    <SelectItem value="C">Option C</SelectItem>
                                                                                    <SelectItem value="D">Option D</SelectItem>
                                                                                </SelectContent>
                                                                            </Select>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />

                                                                <FormField
                                                                    control={form.control}
                                                                    name={`questions.${idx}.explanation`}
                                                                    render={({ field }) => (
                                                                        <FormItem>
                                                                            <FormLabel className="text-xs font-medium">Explanation (Optional)</FormLabel>
                                                                            <FormControl>
                                                                                <Input 
                                                                                    placeholder="Why is this answer correct?" 
                                                                                    {...field} 
                                                                                    disabled={!canManageProduct}
                                                                                />
                                                                            </FormControl>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                    <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>{categoryType === 'service' ? 'Service' : 'Subject'} Category</CardTitle>
                                <div className="mt-4 space-y-4 px-2">
                                    <FormField
                                        control={form.control}
                                        name="categoryType"
                                        render={({ field }) => (
                                            <FormItem className="space-y-1">
                                                <FormLabel className="text-xs">Type</FormLabel>
                                                <FormControl>
                                                    <RadioGroup
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                        className="flex gap-4"
                                                        disabled={!canManageProduct}
                                                    >
                                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                                            <FormControl>
                                                                <RadioGroupItem value="product" />
                                                            </FormControl>
                                                            <FormLabel className="font-normal text-xs">Subject</FormLabel>
                                                        </FormItem>
                                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                                            <FormControl>
                                                                <RadioGroupItem value="service" />
                                                            </FormControl>
                                                            <FormLabel className="font-normal text-xs">Service</FormLabel>
                                                        </FormItem>
                                                    </RadioGroup>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <FormField
                                    control={form.control}
                                    name="category"
                                    render={({ field }) => (
                                        <FormItem>
                                            <Select onValueChange={field.onChange} value={field.value} disabled={!canManageProduct}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a category" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {academy?.settings?.productCategories && academy.settings.productCategories.length > 0 ? (
                                                        academy.settings.productCategories.map((cat: string) => (
                                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                        ))
                                                    ) : (
                                                        <div className="p-4 text-center text-sm text-muted-foreground">
                                                            No categories defined.
                                                            <Button variant="link" asChild className="p-0 h-auto ml-1">
                                                                <Link href="/settings">Create one now</Link>
                                                            </Button>
                                                        </div>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                        <Card className="overflow-hidden">
                            <CardHeader>
                                <CardTitle>{categoryType === 'service' ? 'Service' : 'Subject'} Image</CardTitle>
                                <CardDescription>
                                    Upload an image (max 5MB) for your {categoryType === 'service' ? 'service' : 'product'}.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-2">
                                    <div className="w-full aspect-square rounded-md border-2 border-dashed border-muted-foreground/50 flex items-center justify-center relative overflow-hidden">
                                        {imagePreview ? (
                                            <Image src={imagePreview} alt={categoryType === 'service' ? 'Service preview' : 'Subject preview'} fill style={{ objectFit: "cover" }} />
                                        ) : (
                                            <div className="text-center text-muted-foreground">
                                                <Upload className="mx-auto h-8 w-8" />
                                                <p className="mt-2 text-sm">Click to upload</p>
                                            </div>
                                        )}
                                        <Input
                                            id="file-upload"
                                            type="file"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            accept="image/png, image/jpeg, image/gif"
                                            onChange={handleImageChange}
                                            disabled={!canManageProduct}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        {categoryType === 'product' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Barcode</CardTitle>
                                    <CardDescription>
                                        This barcode is generated from the product's SKU.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {product.sku ? (
                                        <div className="flex justify-center bg-white p-2 rounded-md w-full overflow-x-auto">
                                            <BarcodeDisplay value={product.sku} width={1.5} height={60} />
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center">
                                            Add an SKU to generate a barcode for this product.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        )}


                    </div>
                </div>

                {categoryType === 'product' && (
                    <Card className="border-primary/10 shadow-sm overflow-hidden mt-4">
                        <CardHeader className="bg-primary/5 pb-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <HistoryIcon className="h-4 w-4 text-primary" />
                                        Stock Adjustment History
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Track manual additions and changes to stock quantity. Changes made offline will appear as "Syncing".
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow>
                                        <TableHead className="text-[10px] uppercase font-bold py-2 px-4">Action</TableHead>
                                        <TableHead className="text-[10px] uppercase font-bold py-2">Change</TableHead>
                                        <TableHead className="text-[10px] uppercase font-bold py-2">User</TableHead>
                                        <TableHead className="text-[10px] uppercase font-bold py-2 text-right px-4">Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLogsLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">
                                                <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
                                            </TableCell>
                                        </TableRow>
                                    ) : combinedLogs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center text-xs text-muted-foreground">
                                                No stock adjustment logs found for this product.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        combinedLogs.map((log: any) => {
                                            const adjustment = log.details?.adjustment !== undefined 
                                                ? log.details.adjustment 
                                                : (log.action === 'product.create' ? log.details?.stock : (log.details?.newStock !== undefined && log.details?.oldStock !== undefined ? log.details.newStock - log.details.oldStock : undefined));
                                            const isAddition = adjustment !== undefined && adjustment > 0;
                                            
                                            return (
                                                <TableRow key={log.id} className="hover:bg-muted/20">
                                                    <TableCell className="px-4">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-medium capitalize">
                                                                    {log.action.split('.').pop()?.replace('_', ' ')}
                                                                </span>
                                                                {log.isPending && (
                                                                    <Badge variant="outline" className="text-[8px] h-3.5 bg-yellow-500/10 text-yellow-600 border-yellow-500/20 px-1 animate-pulse">
                                                                        Syncing
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            {log.details?.reason && (
                                                                <span className="text-[10px] text-muted-foreground">{log.details.reason}</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                         {adjustment !== undefined ? (
                                                             <Badge 
                                                                 variant={isAddition ? "secondary" : "destructive"} 
                                                                 className={cn("text-[10px] h-5", isAddition && "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/10")}
                                                             >
                                                                {isAddition ? '+' : ''}{adjustment}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">Updated</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs">{log.userName}</span>
                                                            <span className="text-[9px] text-muted-foreground uppercase">{log.userRole?.replace('_', ' ')}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right text-[10px] text-muted-foreground px-4">
                                                        {log.createdAt ? formatDistanceToNow(log.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
                <div className="flex flex-wrap items-center justify-center gap-2 w-full px-4 md:hidden">
                    <Button variant="outline" size="lg" type="button" onClick={() => router.push('/syllabus-tracker')}>
                        Discard
                    </Button>
                    {canManageProduct && (
                        <Button variant="destructive" size="lg" type="button" onClick={() => setIsDeleteDialogOpen(true)} disabled={isSaving}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    )}
                    {canManageProduct && (
                        <Button size="lg" type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save {categoryType === 'service' ? 'Service' : 'Subject'}
                        </Button>
                    )}
                </div>
            </form>
            <BarcodeScanner
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScan={(code) => {
                    form.setValue('sku', code);
                    setIsScannerOpen(false);
                    toast({
                        title: "Barcode Scanned",
                        description: `SKU updated to: ${code}`,
                    });
                }}
            />
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete <strong>{product.name}</strong>. This action cannot be undone and will remove all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            Delete Subject
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Form>
    );
}

export default function EditProductPage() {
    return (
        <Suspense fallback={<EditProductSkeleton />}>
            <EditProductContent />
        </Suspense>
    );
}

function StudentLearningSpace({ product, router, initialTab }: { product: Subject; router: any; initialTab: string }) {
  const [activeTab, setActiveTab] = React.useState<string>(initialTab);
  const [progress, setProgress] = React.useState<number>(0);
  const [completedTopics, setCompletedTopics] = React.useState<string[]>([]);
  
  // CBT Test States
  const [isInTest, setIsInTest] = React.useState(false);
  const [testQuestions, setTestQuestions] = React.useState<any[]>([]);
  const [currentQIndex, setCurrentQIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const modules = product.modules || [];
  const totalTopicsCount = modules.reduce((acc, m) => acc + (m.topics?.length || 0), 0);

  React.useEffect(() => {
    const storedTopics = localStorage.getItem(`pinnacle_topics_${product.id}`);
    let completed: string[] = [];
    if (storedTopics) {
      try {
        completed = JSON.parse(storedTopics);
        setCompletedTopics(completed);
      } catch (e) {
        setCompletedTopics([]);
      }
    }

    if (totalTopicsCount > 0) {
      const allTopicIds = new Set(modules.flatMap(m => m.topics?.map(t => t.id) || []));
      const validCompleted = completed.filter(id => allTopicIds.has(id));
      const calculatedProgress = Math.round((validCompleted.length / totalTopicsCount) * 100);
      setProgress(calculatedProgress);
      localStorage.setItem(`pinnacle_progress_${product.id}`, calculatedProgress.toString());
    } else {
      const storedProgress = localStorage.getItem(`pinnacle_progress_${product.id}`);
      if (storedProgress !== null) {
        setProgress(parseInt(storedProgress, 10));
      } else {
        let hash = 0;
        for (let i = 0; i < product.id.length; i++) {
          hash = product.id.charCodeAt(i) + ((hash << 5) - hash);
        }
        const defaultProgress = Math.abs(hash % 11) * 10;
        setProgress(defaultProgress);
        localStorage.setItem(`pinnacle_progress_${product.id}`, defaultProgress.toString());
      }
    }
  }, [product.id, totalTopicsCount]);

  const handleSetProgress = (newProgress: number) => {
    setProgress(newProgress);
    localStorage.setItem(`pinnacle_progress_${product.id}`, newProgress.toString());
  };

  const toggleTopic = (topicId: string) => {
    let updated;
    if (completedTopics.includes(topicId)) {
      updated = completedTopics.filter(id => id !== topicId);
    } else {
      updated = [...completedTopics, topicId];
    }
    setCompletedTopics(updated);
    localStorage.setItem(`pinnacle_topics_${product.id}`, JSON.stringify(updated));

    // Update progress percentage
    if (totalTopicsCount > 0) {
      const newProgress = Math.round((updated.length / totalTopicsCount) * 100);
      setProgress(newProgress);
      localStorage.setItem(`pinnacle_progress_${product.id}`, newProgress.toString());
    }
  };

  const tutorName = product.tutorName || "No Tutor Assigned";
  const tutorEmail = product.tutorEmail || "";
  const tutorBio = product.tutorBio || "No instructor biography has been configured for this subject yet. Please contact academic support if you have any questions.";
  const totalQuestions = product.questions?.length || 0;

  const startTest = () => {
    if (!product.questions || product.questions.length === 0) return;
    setTestQuestions(product.questions);
    setCurrentQIndex(0);
    setAnswers({});
    setIsSubmitted(false);
    setIsInTest(true);
  };

  const submitTest = () => {
    setIsSubmitted(true);
  };

  const score = testQuestions.filter((q, idx) => answers[idx] === q.correctAnswer).length;

  return (
    <div className="space-y-6 w-full max-w-full px-1 sm:px-0">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.push('/syllabus-tracker')}>
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground truncate">{product.name}</h1>
          <p className="text-sm text-muted-foreground">{product.category || "General Academic"}</p>
        </div>
      </div>

      {!isInTest ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Syllabus & Material</TabsTrigger>
            <TabsTrigger value="questions" className="relative">
              CBT Practice Test
              {totalQuestions > 0 && (
                <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary hover:bg-primary/20 border-none">
                  {totalQuestions} Qs
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 mt-4 animate-in fade-in-50 duration-200">
            <div className="grid gap-6 md:grid-cols-3">
              {/* Left Column */}
              <div className="md:col-span-2 space-y-6">
                {/* Course Overview */}
                <Card className="shadow-premium border-none bg-background/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <BookOpen className="h-5 w-5 text-primary" />
                      Subject Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground leading-relaxed text-sm">
                      {product.description || "No subject description provided. Check back later for official syllabus outlines and textbook materials."}
                    </p>
                    {product.imageUrl && (
                      <div className="relative h-48 w-full rounded-md overflow-hidden border">
                        <Image src={product.imageUrl} fill style={{ objectFit: 'cover' }} alt={product.name} />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Modules Checklist */}
                <Card className="shadow-premium border-none bg-background/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CheckSquare className="h-5 w-5 text-primary" />
                      Syllabus Topic Checklist
                    </CardTitle>
                    <CardDescription>
                      Check off topics as you study them. Your learning progress updates automatically.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {modules.length === 0 ? (
                      <div className="text-center py-8">
                        <BookOpen className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                        <p className="text-sm font-medium text-muted-foreground">No syllabus topics configured</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          The instructor hasn't uploaded topics for this syllabus yet. Use the manual progress controls to track your work.
                        </p>
                      </div>
                    ) : (
                      modules.map((mod, modIdx) => (
                        <div key={modIdx} className="space-y-3">
                          <h3 className="font-semibold text-sm text-foreground">{mod.title}</h3>
                          <div className="grid gap-2 pl-2">
                            {mod.topics?.map((topic) => {
                              const isChecked = completedTopics.includes(topic.id);
                              return (
                                <div key={topic.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/30 transition-colors">
                                  <input
                                    type="checkbox"
                                    id={topic.id}
                                    checked={isChecked}
                                    onChange={() => toggleTopic(topic.id)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                                  />
                                  <label htmlFor={topic.id} className={cn("text-xs text-muted-foreground cursor-pointer select-none flex-1", isChecked && "line-through text-muted-foreground/55 font-medium")}>
                                    {topic.title}
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                          {modIdx < modules.length - 1 && <Separator className="my-2" />}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Learning Progress Card */}
                <Card className="shadow-premium border-none bg-background/50 backdrop-blur-sm text-center p-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Learning Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="relative flex items-center justify-center py-2">
                      <div className="w-28 h-28 rounded-full border-4 border-muted flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-foreground">{progress}%</span>
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Complete</span>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                    </div>
                    {totalTopicsCount === 0 ? (
                      <div className="grid grid-cols-3 gap-1.5 pt-2">
                        {[0, 50, 100].map((pct) => (
                          <Button
                            key={pct}
                            size="sm"
                            variant={progress === pct ? "default" : "outline"}
                            className="text-[10px] h-7 px-1.5"
                            onClick={() => handleSetProgress(pct)}
                          >
                            {pct === 100 ? "Finished" : `${pct}%`}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground/80 italic mt-2">
                        Progress computed automatically from syllabus topic checklist.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Assigned Tutor Card */}
                <Card className="shadow-premium border-none bg-background/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">Assigned Instructor</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                        {tutorName.split(' ').pop()?.substring(0, 2).toUpperCase() || "AC"}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">{tutorName}</h4>
                        <p className="text-[10px] text-muted-foreground">Subject Supervisor</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {tutorBio}
                    </p>
                    <Button variant="outline" size="sm" className="w-full text-xs h-9" asChild disabled={!tutorEmail}>
                      <a href={tutorEmail ? `mailto:${tutorEmail}` : '#'}>
                        <Mail className="h-3.5 w-3.5 mr-2 text-primary" />
                        Email Instructor
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="questions" className="space-y-6 mt-4 animate-in fade-in-50 duration-200">
            <Card className="shadow-premium border-none bg-background/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Brain className="h-5 w-5 text-primary" />
                  CBT Preparation Test
                </CardTitle>
                <CardDescription>
                  Practice multiple-choice questions loaded for this subject. Test your understanding under standard exam conditions.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                {totalQuestions > 0 ? (
                  <div className="space-y-6 max-w-md">
                    <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                      <Trophy className="h-8 w-8" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-foreground">Practice CBT Available</h3>
                      <p className="text-sm text-muted-foreground">
                        We found <strong>{totalQuestions}</strong> questions in the exam bank. Start the practice session to evaluate your skills.
                      </p>
                    </div>
                    <Button onClick={startTest} className="w-full h-10 shadow-md" type="button">
                      <Play className="h-4 w-4 mr-2" /> Start Practice Test
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 max-w-sm">
                    <HelpCircle className="h-12 w-12 text-muted-foreground/40 mx-auto" />
                    <h3 className="text-base font-semibold text-foreground">No Questions Added</h3>
                    <p className="text-xs text-muted-foreground">
                      The tutor has not uploaded CBT questions for this subject yet. Please check back later.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        /* CBT Testing Interface */
        <Card className="shadow-premium border-none bg-background/50 backdrop-blur-sm max-w-2xl mx-auto">
          {!isSubmitted ? (
            <>
              <CardHeader className="border-b pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">CBT Practice: {product.name}</CardTitle>
                  <CardDescription className="text-xs">
                    Question {currentQIndex + 1} of {testQuestions.length}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-xs text-destructive hover:bg-destructive/10" onClick={() => setIsInTest(false)} type="button">
                  Cancel Test
                </Button>
              </CardHeader>
              <CardContent className="py-6 space-y-6">
                {/* Question */}
                <div className="p-4 rounded-lg bg-muted/40 border">
                  <p className="text-sm font-semibold leading-relaxed text-foreground">
                    {testQuestions[currentQIndex]?.questionText}
                  </p>
                </div>

                {/* Options */}
                <div className="grid gap-3">
                  {['A', 'B', 'C', 'D'].map((opt, oIdx) => {
                    const optText = testQuestions[currentQIndex]?.options?.[oIdx] || '';
                    const isSelected = answers[currentQIndex] === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setAnswers(prev => ({ ...prev, [currentQIndex]: opt }))}
                        className={cn(
                          "w-full text-left p-3.5 rounded-lg border text-sm transition-all flex items-center justify-between hover:bg-muted/40",
                          isSelected ? "border-primary bg-primary/5 text-foreground font-semibold" : "bg-card/30 text-muted-foreground"
                        )}
                      >
                        <span><strong>{opt}.</strong> {optText}</span>
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQIndex === 0}
                >
                  Previous
                </Button>

                {currentQIndex === testQuestions.length - 1 ? (
                  <Button size="sm" onClick={submitTest} disabled={Object.keys(answers).length === 0} type="button">
                    Submit Test
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    type="button"
                    onClick={() => setCurrentQIndex(prev => Math.min(testQuestions.length - 1, prev + 1))}
                    disabled={!answers[currentQIndex]}
                  >
                    Next Question
                  </Button>
                )}
              </CardFooter>
            </>
          ) : (
            /* Results Screen */
            <>
              <CardHeader className="border-b pb-4 text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                  <Trophy className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">Practice Test Results</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-extrabold text-foreground">{score} / {testQuestions.length}</span>
                  <span className="text-sm text-muted-foreground ml-1.5">({Math.round((score / testQuestions.length) * 100)}%)</span>
                </div>
                <CardDescription className="text-xs mt-1">
                  Review your answers and correct options below.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <div className="p-6 space-y-6">
                    {testQuestions.map((q, idx) => {
                      const isCorrect = answers[idx] === q.correctAnswer;
                      return (
                        <div key={q.id || idx} className="space-y-3 p-4 border rounded-lg bg-muted/20">
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-semibold text-primary">Question {idx + 1}</span>
                            <Badge variant={isCorrect ? "secondary" : "destructive"} className={cn("text-[10px] uppercase font-bold", isCorrect && "bg-green-500/10 text-green-500 border-green-500/20")}>
                              {isCorrect ? "Correct" : "Incorrect"}
                            </Badge>
                          </div>
                          <p className="text-sm font-semibold text-foreground leading-relaxed">{q.questionText}</p>
                          <div className="grid gap-1.5 pl-2 text-xs">
                            <p className={cn(isCorrect ? "text-green-600 font-semibold" : "text-destructive font-medium")}>
                              Your Answer: {answers[idx] || "Unanswered"}. {q.options?.[['A','B','C','D'].indexOf(answers[idx])]}
                            </p>
                            {!isCorrect && (
                              <p className="text-green-600 font-semibold">
                                Correct Answer: {q.correctAnswer}. {q.options?.[['A','B','C','D'].indexOf(q.correctAnswer)]}
                              </p>
                            )}
                          </div>
                          {q.explanation && (
                            <div className="mt-2 text-[11px] text-muted-foreground leading-relaxed bg-muted/40 p-2.5 rounded border border-muted/80">
                              <strong>Explanation:</strong> {q.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="border-t pt-4 flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setIsInTest(false)} type="button">
                  Close Review
                </Button>
                <Button size="sm" onClick={startTest} type="button">
                  Retake Test
                </Button>
              </CardFooter>
            </>
          )}
        </Card>
      )}
    </div>
  );
}

function SyllabusModulesBuilder({ control, form, disabled }: { control: any; form: any; disabled: boolean }) {
    const modules = form.watch("modules") || [];

    const updateModuleTitle = (mIdx: number, val: string) => {
        const current = [...modules];
        current[mIdx].title = val;
        form.setValue("modules", current, { shouldDirty: true, shouldValidate: true });
    };

    const removeModule = (mIdx: number) => {
        const current = modules.filter((_: any, idx: number) => idx !== mIdx);
        form.setValue("modules", current, { shouldDirty: true, shouldValidate: true });
    };

    const addTopic = (mIdx: number) => {
        const current = [...modules];
        const topics = current[mIdx].topics || [];
        current[mIdx].topics = [
            ...topics,
            {
                id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
                title: `Topic ${topics.length + 1}`
            }
        ];
        form.setValue("modules", current, { shouldDirty: true, shouldValidate: true });
    };

    const updateTopicTitle = (mIdx: number, tIdx: number, val: string) => {
        const current = [...modules];
        current[mIdx].topics[tIdx].title = val;
        form.setValue("modules", current, { shouldDirty: true, shouldValidate: true });
    };

    const removeTopic = (mIdx: number, tIdx: number) => {
        const current = [...modules];
        current[mIdx].topics = current[mIdx].topics.filter((_: any, idx: number) => idx !== tIdx);
        form.setValue("modules", current, { shouldDirty: true, shouldValidate: true });
    };

    if (modules.length === 0) {
        return (
            <div className="text-center py-12 border border-dashed rounded-lg bg-muted/20">
                <BookOpen className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm font-semibold text-muted-foreground">No syllabus modules defined</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                    Click "Add Module" to start structuring the subject learning path.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {modules.map((mod: any, mIdx: number) => (
                <div key={mIdx} className="border rounded-lg p-4 bg-muted/10 space-y-4 relative hover:border-primary/20 transition-colors animate-in fade-in-50">
                    <div className="flex items-center gap-4">
                        <span className="font-semibold text-xs text-primary bg-primary/5 px-2.5 py-1 rounded-full border border-primary/10 text-center shrink-0">
                            Module {mIdx + 1}
                        </span>
                        <Input
                            placeholder="Module Title"
                            value={mod.title}
                            onChange={(e) => updateModuleTitle(mIdx, e.target.value)}
                            disabled={disabled}
                            className="font-medium flex-1 h-9"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive h-8 w-8 hover:bg-destructive/10 shrink-0"
                            onClick={() => removeModule(mIdx)}
                            disabled={disabled}
                        >
                            <Trash className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="pl-4 border-l-2 border-primary/10 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground">Topics Checklist ({mod.topics?.length || 0})</span>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs px-2"
                                onClick={() => addTopic(mIdx)}
                                disabled={disabled}
                            >
                                <Plus className="w-3 h-3 mr-1" /> Add Topic
                            </Button>
                        </div>

                        {mod.topics?.length === 0 ? (
                            <p className="text-xs text-muted-foreground/70 italic py-2">No topics added to this module yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {mod.topics.map((topic: any, tIdx: number) => (
                                    <div key={topic.id || tIdx} className="flex items-center gap-2 animate-in fade-in-50">
                                        <span className="text-xs font-mono text-muted-foreground/60 shrink-0 w-8">{mIdx + 1}.{tIdx + 1}</span>
                                        <Input
                                            placeholder="Topic Title"
                                            value={topic.title}
                                            onChange={(e) => updateTopicTitle(mIdx, tIdx, e.target.value)}
                                            disabled={disabled}
                                            className="h-8 text-xs flex-1"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive h-8 w-8 hover:bg-destructive/10 shrink-0"
                                            onClick={() => removeTopic(mIdx, tIdx)}
                                            disabled={disabled}
                                        >
                                            <Trash className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

