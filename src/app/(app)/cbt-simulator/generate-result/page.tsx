
'use client';
import * as React from 'react';
import ReceiptDetails from "@/components/admissions/receipt-details";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAcademy } from "@/context/academy-context";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useBusiness } from '@/context/academy-context';
import { useUser, useFirestore } from '@/firebase';
import { collection, doc, writeBatch, serverTimestamp, DocumentReference, DocumentSnapshot } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid'; // To generate a unique receipt number
import { sendReceiptEmail } from '@/lib/email';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { logAuditEvent } from '@/lib/audit';


function ReviewPageContent() {
    const router = useRouter();
    const { toast } = useToast();
    const { syllabus, selectedStudent, subtotal, tax, taxRate, discount, total, paymentMethod, currencySymbol, resetSimulator, subjects, currentUserProfile, students, autoPrint, setAutoPrint, addToQueue, saveCurrentSession } = useAcademy();
    const firestore = useFirestore();
    const academy = useBusiness();
    const { user } = useUser();
    const [isCompleting, setIsCompleting] = React.useState(false);
    const [shouldSendEmail, setShouldSendEmail] = React.useState(false);
    const searchParams = useSearchParams();
    const isAutoPrompted = searchParams.get('auto') === 'true';
    const [backdate, setBackdate] = React.useState('');
    const isAdmin = currentUserProfile?.role === 'admin' || academy?.ownerId === currentUserProfile?.id;
    const receiptContentRef = React.useRef<HTMLDivElement>(null);
    const hasPrintedRef = React.useRef(false);
    const checkoutStartedRef = React.useRef(false);

    // Hydration fix
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => { setMounted(true); }, []);

    // Memoize the receipt number so it doesn't change on every render
    const stableReceiptNumber = React.useMemo(() => `rec-${uuidv4().split('-')[0]}`, []);

    // Create a temporary receipt object for display before saving
    const displayReceipt = React.useMemo(() => ({
        id: 'temp-id',
        academyId: academy?.id || 'temp-biz-id',
        receiptNumber: stableReceiptNumber,
        items: syllabus.map(item => ({
            subjectId: item.product.id,
            name: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
            costPrice: item.product.costPrice || 0,
        })),
        customer: selectedStudent || undefined,
        subtotal,
        tax,
        discount,
        total,
        paymentMethod: paymentMethod as 'Cash' | 'Card' | 'Bank Transfer' | 'Invoice',
        status: (paymentMethod === 'Bank Transfer' ? 'pending' : (paymentMethod === 'Invoice' ? 'unpaid' : 'paid')) as 'pending' | 'unpaid' | 'paid',
        createdAt: backdate ? new Date(backdate) : new Date(), // Use a real date for optimistic display
    }), [stableReceiptNumber, academy?.id, syllabus, selectedStudent, subtotal, tax, discount, total, paymentMethod, backdate]);

    const handleCompleteSale = React.useCallback(() => {
        if (checkoutStartedRef.current) return;
        
        if (!academy || !user || syllabus.length === 0 || !subjects || !currentUserProfile) {
            toast({ variant: 'destructive', title: 'Error', description: 'Cannot complete sale. Missing session data or empty syllabus.' });
            setIsCompleting(false);
            return;
        }

        checkoutStartedRef.current = true;

        // 1. Validations (Backorder & Operating Hours)
        for (const cartItem of syllabus) {
            const productFromCache = subjects.find(p => p.id === cartItem.product.id);
            const isService = productFromCache?.categoryType === 'service';
            if (!isService && (!productFromCache || (productFromCache.stock || 0) < cartItem.quantity)) {
                toast({
                    variant: 'backorder' as any,
                    title: 'Offline Simulation Mode',
                    description: `This simulation will register offline mode for ${cartItem.product.name}.`
                });
            }
        }

        const operatingHours = academy.settings?.operatingHours;
        let isOutsideHours = false;
        if (operatingHours?.enabled) {
            const saleDate = backdate ? new Date(backdate) : new Date();
            const [openH, openM] = operatingHours.openTime.split(':').map(Number);
            const [closeH, closeM] = operatingHours.closeTime.split(':').map(Number);
            const nowMinutes = saleDate.getHours() * 60 + saleDate.getMinutes();
            const openMinutes = openH * 60 + openM;
            const closeMinutes = closeH * 60 + closeM;

            if (closeMinutes < openMinutes) {
                isOutsideHours = !(nowMinutes >= openMinutes || nowMinutes <= closeMinutes);
            } else {
                isOutsideHours = nowMinutes < openMinutes || nowMinutes > closeMinutes;
            }

            if (isOutsideHours && operatingHours.preventSalesOutsideHours && !isAdmin) {
                toast({
                    variant: 'destructive',
                    title: 'Simulator Hours Violation',
                    description: `Simulations are not allowed outside of active hours (${operatingHours.openTime} - ${operatingHours.closeTime}).`
                });
                return;
            }
        }

        setIsCompleting(true);

        // 2. Prepare Data for Queue (Securely Recalculate)
        const newReceiptId = uuidv4();
        let secureSubtotal = 0;
        let secureTotalCost = 0;
        
        const itemsForReceipt = syllabus.map(cartItem => {
            const masterProduct = subjects.find(p => p.id === cartItem.product.id);
            const costPrice = masterProduct?.costPrice || 0;
            
            // SECURITY: If not a manual override, use the price from the master product list
            let finalPrice = cartItem.product.price;
            if (!cartItem.isPriceOverride && masterProduct) {
                if (cartItem.unit) {
                    // Check if there's a unit conversion with a specific price override
                    const conversion = masterProduct.uomConversions?.find(u => u.unitName === cartItem.unit);
                    finalPrice = conversion?.price ?? (masterProduct.price * (cartItem.multiplier || 1));
                } else {
                    finalPrice = masterProduct.price;
                }
            }

            // Detect if the price in syllabus was tampered with (different from expected)
            if (finalPrice !== cartItem.product.price) {
                console.warn(`Price mismatch detected for ${cartItem.product.name}. Expected ${finalPrice}, got ${cartItem.product.price}. Reverting to secure price.`);
            }

            secureSubtotal += finalPrice * cartItem.quantity;
            secureTotalCost += costPrice * cartItem.quantity;

            return {
                subjectId: cartItem.product.id,
                name: cartItem.unit ? `${cartItem.product.name} (${cartItem.unit})` : cartItem.product.name,
                quantity: cartItem.quantity,
                unit: cartItem.unit || null,
                multiplier: cartItem.multiplier || 1,
                price: finalPrice,
                costPrice: costPrice,
            };
        });

        const secureTax = secureSubtotal * (academy.settings?.defaultTaxRate || 0) / 100;
        const secureTotal = secureSubtotal + secureTax - discount;
        const profit = secureTotal - secureTotalCost;
        const status = paymentMethod === 'Bank Transfer' ? 'pending' : (paymentMethod === 'Invoice' ? 'unpaid' : 'paid');

        const receiptData = {
            id: newReceiptId,
            academyId: academy.id,
            receiptNumber: displayReceipt.receiptNumber,
            items: itemsForReceipt,
            customer: selectedStudent ? { id: selectedStudent.id, name: selectedStudent.name, email: selectedStudent.email } : null,
            subtotal: secureSubtotal, 
            tax: secureTax, 
            discount, 
            total: secureTotal, 
            totalCost: secureTotalCost, 
            profit, 
            paymentMethod,
            status,
            createdAt: backdate ? new Date(backdate) : new Date(),
            createdBy: user.uid,
            flagged: isOutsideHours ? { reason: 'outside_operating_hours', openTime: operatingHours?.openTime, closeTime: operatingHours?.closeTime } : null,
        };

        const productUpdates = syllabus.map(cartItem => {
            const product = subjects.find(p => p.id === cartItem.product.id);
            const multiplier = cartItem.multiplier || 1;
            const baseQuantitySold = cartItem.quantity * multiplier;
            return {
                id: cartItem.product.id,
                newStock: (product?.stock || 0) - baseQuantitySold,
                type: product?.type,
                components: product?.components
            };
        });

        const customerUpdate = selectedStudent ? {
            id: selectedStudent.id,
            loyaltyPoints: academy.settings?.loyaltyProgramEnabled ? (selectedStudent.loyaltyPoints || 0) + Math.floor(secureTotal * (academy.settings.pointsPerUnit || 0)) : (selectedStudent.loyaltyPoints || 0),
            totalSpent: secureTotal
        } : null;

        // 3. ADD TO QUEUE (This is now instant and handles SQLite)
        addToQueue({
            type: 'complete-registration',
            payload: {
                receiptData: { ...receiptData, createdAt: receiptData.createdAt.toISOString() }, // Stringify date for queue
                productUpdates,
                customerUpdate
            }
        }, `Starting Simulation: ${receiptData.receiptNumber}`);

        // 4. Handle Email Admission (Try sending immediately if online)
        if (navigator.onLine && shouldSendEmail && selectedStudent?.email) {
            const isEmailAllowed = academy.plan === 'academy' || academy.accessLevel === 'lifetime' || academy.plan === 'pro';
            if (isEmailAllowed) {
                const numberFormat = new Intl.NumberFormat('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                const items_html = syllabus.map(item =>
                    `<tr>
                        <td style="padding: 5px; border-bottom: 1px solid #eee;">
                            <div style="font-weight: bold;">${item.product.name}</div>
                            <div style="color: #666; font-size: 12px;">${item.quantity} x ${currencySymbol}${numberFormat.format(item.product.price)}</div>
                        </td>
                        <td style="padding: 5px; text-align: right; border-bottom: 1px solid #eee;">
                            ${currencySymbol}${numberFormat.format(item.product.price * item.quantity)}
                        </td>
                    </tr>`
                ).join('');

                sendReceiptEmail({
                    to_email: selectedStudent.email,
                    to_name: selectedStudent.name,
                    business_name: academy.name,
                    receipt_id: newReceiptId.substring(0, 8),
                    items_html,
                    currency_symbol: currencySymbol,
                    subtotal: numberFormat.format(secureSubtotal),
                    tax: numberFormat.format(secureTax),
                    discount: numberFormat.format(discount),
                    total: numberFormat.format(secureTotal),
                    payment_method: paymentMethod,
                    date: new Date().toLocaleString()
                }).catch(e => console.error("Email failed:", e));
            }
        }

        // Write active exam details to sessionStorage
        if (typeof window !== 'undefined') {
            const activeSession = {
                receiptNumber: displayReceipt.receiptNumber,
                subjects: syllabus.map(item => ({
                    id: item.product.id,
                    name: item.product.name,
                    questions: item.product.questions || []
                })),
                mode: paymentMethod, // Full Exam, Speed Battle, Practice Mode, Offline Study
                timeLimit: discount || 40, // standard duration
                targetScore: taxRate || 70, // target minimum score
                studentName: selectedStudent?.name || currentUserProfile?.name || 'Student'
            };
            sessionStorage.setItem('active_exam_session', JSON.stringify(activeSession));
        }

        // 5. Cleanup & Navigation
        if (autoPrint && !hasPrintedRef.current) {
            hasPrintedRef.current = true;
            setTimeout(() => {
                const handleAfterPrint = () => {
                    window.removeEventListener('afterprint', handleAfterPrint);
                    router.push('/cbt-simulator/active-test');
                    resetSimulator();
                };
                window.addEventListener('afterprint', handleAfterPrint);
                
                try {
                    if (typeof window !== 'undefined' && window.print) {
                        window.print();
                    } else {
                        handleAfterPrint();
                    }
                } catch (printError) {
                    console.warn("Printing failed or unsupported on this device:", printError);
                    handleAfterPrint();
                }
                
                // Fallback for browsers (especially mobile and standalone PWAs) that don't reliably fire afterprint
                const isMobile = typeof window !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
                setTimeout(() => {
                    window.removeEventListener('afterprint', handleAfterPrint);
                    // Check if we haven't already navigated (resetSimulator clears syllabus)
                    if (syllabus.length > 0) {
                       router.push('/cbt-simulator/active-test');
                       resetSimulator();
                    }
                }, isMobile ? 1500 : 3000); // 1.5s on mobile, 3s on desktop fallback instead of 60s
            }, 500);
        } else if (!autoPrint) {
            router.push('/cbt-simulator/active-test');
            resetSimulator();
        }

        toast({
            variant: navigator.onLine ? 'success' : 'default',
            title: navigator.onLine ? "Simulation Started" : "Simulation Queued (Offline)",
            description: navigator.onLine ? `Examination Slip ${receiptData.receiptNumber} generated.` : "Success! This simulation is registered locally and will sync to the cloud automatically.",
        });
        
        // Note: We don't set isCompleting(false) here if redirect is happening
        // to prevent the auto-submit useEffect from re-firing.
        // It will be reset when the component unmounts or POS is reset.

    }, [academy, user, syllabus, subjects, currentUserProfile, subtotal, tax, taxRate, discount, total, paymentMethod, currencySymbol, resetSimulator, router, autoPrint, backdate, shouldSendEmail, toast, addToQueue, displayReceipt.receiptNumber, selectedStudent]);

    // **Auto-Submit Logic**
    // We only want to trigger this ONCE when auto-prompted
    React.useEffect(() => {
        if (isAutoPrompted && !isCompleting && syllabus.length > 0) {
            handleCompleteSale();
        }
    }, [isAutoPrompted, isCompleting, syllabus.length, handleCompleteSale]);

    const canSendEmail = React.useMemo(() => {
        const plan = academy?.plan;
        const access = academy?.accessLevel;
        const allowed = plan === 'academy' || access === 'lifetime' || plan === 'pro'; 
        return allowed;
    }, [academy]);

    if (!mounted) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Preparing simulator...</p>
            </div>
        );
    }

    if (syllabus.length === 0 && !isCompleting) {
        return (
            <div className="text-center">
                <p>Selected subjects list is empty.</p>
                <Button asChild variant="link">
                    <Link href="/cbt-simulator/select-subjects">Start a new simulation</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
                <h2 className="text-2xl font-bold mb-4 font-headline no-print">Review Exam Slip</h2>
                <ReceiptDetails ref={receiptContentRef} receipt={displayReceipt} academy={academy} currencySymbol={currencySymbol} />
            </div>
            <div className="no-print">
                <div className="p-4 rounded-lg bg-card border space-y-4">
                    <h3 className="text-lg font-semibold">Ready to Begin?</h3>
                    <p className="text-sm text-muted-foreground">
                        This will finalize your subject setup, generate an examination slip, and initiate the CBT simulator. This works offline.
                    </p>

                    {isAdmin && (
                        <>
                            <Separator />
                            <div className="flex flex-col gap-2 py-2">
                                <Label htmlFor="backdate" className="text-sm font-semibold flex flex-col gap-1 cursor-pointer">
                                    <span>Backdate Examination (Admin/Owner Only)</span>
                                    <span className="font-normal text-muted-foreground text-xs">
                                        Record a simulated exam result from a previous date. This action will be flagged in the audit log.
                                    </span>
                                </Label>
                                <Input
                                    id="backdate"
                                    type="datetime-local"
                                    className="w-full mt-1"
                                    value={backdate}
                                    onChange={(e) => setBackdate(e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    {selectedStudent?.email && canSendEmail && (
                        <>
                            <Separator />
                            <div className="flex items-center justify-between py-2">
                                <Label htmlFor="send-email-receipt" className="flex flex-col gap-1 cursor-pointer">
                                    <span>Email Exam Slip</span>
                                    <span className="font-normal text-muted-foreground text-xs">
                                        Send a copy to {selectedStudent.email}
                                    </span>
                                </Label>
                                <Switch
                                    id="send-email-receipt"
                                    checked={shouldSendEmail}
                                    onCheckedChange={setShouldSendEmail}
                                />
                            </div>
                        </>
                    )}

                    <Separator />
                    <div className="flex items-center justify-between py-2">
                        <Label htmlFor="auto-print" className="cursor-pointer font-medium text-sm">
                            Print Examination Slip
                        </Label>
                        <input
                            type="checkbox"
                            id="auto-print"
                            className="w-4 h-4 cursor-pointer"
                            checked={autoPrint}
                            onChange={(e) => setAutoPrint(e.target.checked)}
                        />
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                        <Button size="lg" className="w-full text-lg h-12 shadow-md hover:shadow-lg transition-all" onClick={handleCompleteSale} disabled={isCompleting}>
                            {isCompleting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                            {isCompleting ? 'Preparing Exam...' : (paymentMethod === 'Invoice' ? 'Start Offline Exam' : 'Start Examination')}
                        </Button>
                        <Button size="lg" className="w-full h-12" variant="outline" onClick={() => {
                            saveCurrentSession();
                            router.push('/cbt-simulator/select-subjects');
                        }} disabled={isCompleting}>
                            Save Setup
                        </Button>
                        <Button size="lg" className="w-full" variant="outline" asChild>
                            <Link href="/cbt-simulator/exam-mode">Back to Mode Settings</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function ReviewPage() {
    return (
        <React.Suspense fallback={
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Preparing simulator...</p>
            </div>
        }>
            <ReviewPageContent />
        </React.Suspense>
    );
}
