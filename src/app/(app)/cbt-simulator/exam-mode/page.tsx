
'use client';
import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useAcademy } from "@/context/academy-context";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Banknote, CreditCard, Landmark, Loader2, FileText } from "lucide-react";
import { useBusiness } from '@/context/academy-context';
import { useRouter } from 'next/navigation';

export default function PaymentPage() {
    const { subtotal, tax, taxRate, discount, total, setTax, setDiscount, paymentMethod, setPaymentMethod, currencySymbol, autoPrint, setAutoPrint } = useAcademy();
    const academy = useBusiness();
    const router = useRouter();
    const [isNavigating, setIsNavigating] = React.useState(false);

    const handleNext = () => {
        setIsNavigating(true);
        // Added a timeout safeguard to prevent the button from being stuck if navigation is slow
        const timer = setTimeout(() => setIsNavigating(false), 5000);
        
        if (autoPrint) {
            router.push('/cbt-simulator/generate-result?auto=true');
        } else {
            router.push('/cbt-simulator/generate-result');
        }
        
        return () => clearTimeout(timer);
    };

    return (
        <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Exam Simulation Mode</CardTitle>
                        <CardDescription>Select your CBT simulation mode.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Label htmlFor="cash" className="cursor-pointer">
                                <Card className={`flex flex-col items-center justify-center p-6 ${paymentMethod === 'Cash' ? 'border-primary ring-1 ring-primary' : ''} hover:border-primary hover:bg-muted transition-colors h-full`}>
                                    <RadioGroupItem value="Cash" id="cash" className="sr-only" />
                                    <Banknote className="h-8 w-8 mb-2" />
                                    <span className="font-semibold text-sm">Full Exam</span>
                                    <span className="text-[10px] text-muted-foreground mt-1">Standard UTME timing & controls</span>
                                </Card>
                            </Label>
                            <Label htmlFor="card" className="cursor-pointer">
                                <Card className={`flex flex-col items-center justify-center p-6 ${paymentMethod === 'Card' ? 'border-primary ring-1 ring-primary' : ''} hover:border-primary hover:bg-muted transition-colors h-full`}>
                                    <RadioGroupItem value="Card" id="card" className="sr-only" />
                                    <CreditCard className="h-8 w-8 mb-2" />
                                    <span className="font-semibold text-sm">Speed Battle</span>
                                    <span className="text-[10px] text-muted-foreground mt-1">Fast-paced mode vs AI / bots</span>
                                </Card>
                            </Label>
                            <Label htmlFor="bank" className="cursor-pointer">
                                <Card className={`flex flex-col items-center justify-center p-6 ${paymentMethod === 'Bank Transfer' ? 'border-primary ring-1 ring-primary' : ''} hover:border-primary hover:bg-muted transition-colors h-full`}>
                                    <RadioGroupItem value="Bank Transfer" id="bank" className="sr-only" />
                                    <Landmark className="h-8 w-8 mb-2" />
                                    <span className="font-semibold text-sm">Practice Mode</span>
                                    <span className="text-[10px] text-muted-foreground mt-1">Untimed practice with hints</span>
                                </Card>
                            </Label>
                            <Label htmlFor="invoice" className="cursor-pointer">
                                <Card className={`flex flex-col items-center justify-center p-6 ${paymentMethod === 'Invoice' ? 'border-primary ring-1 ring-primary' : ''} hover:border-primary hover:bg-muted transition-colors h-full`}>
                                    <RadioGroupItem value="Invoice" id="invoice" className="sr-only" />
                                    <FileText className="h-8 w-8 mb-2" />
                                    <span className="font-semibold text-sm">Offline Study</span>
                                    <span className="text-[10px] text-muted-foreground mt-1">Practice offline without data</span>
                                </Card>
                            </Label>
                        </RadioGroup>
                        {paymentMethod === 'Invoice' && (
                            <Alert className="mt-4 bg-blue-50 border-blue-200">
                                <FileText className="h-4 w-4 text-blue-600" />
                                <AlertTitle className="text-blue-800">Offline Synchronized Mode</AlertTitle>
                                <AlertDescription className="text-blue-700">
                                    This will download the syllabus and question pool offline. Results will synchronize automatically when you reconnect.
                                </AlertDescription>
                            </Alert>
                        )}
                        {paymentMethod === 'Bank Transfer' && (
                            <Alert className="mt-4">
                                <Landmark className="h-4 w-4" />
                                <AlertTitle>Practice Mode Tips</AlertTitle>
                                <AlertDescription>
                                    Get detailed explanation cards after every question. No time pressure, perfect for initial subject tracking and revision.
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle>Time Limit & Target Score</CardTitle>
                        <CardDescription>Set your custom simulation duration and target minimum score.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="discount">Exam Time (Minutes)</Label>
                            <Input id="discount" type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tax">Target Score (%)</Label>
                            <Input id="tax" type="number" value={taxRate} onChange={e => setTax(Number(e.target.value))} />
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div>
                <Card>
                    <CardHeader>
                        <CardTitle>Simulation Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Questions Count</span>
                            <span>{subtotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} Questions</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Target Score</span>
                            <span>{taxRate}% Target</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Time Limit</span>
                            <span className="text-destructive">-{discount} Minutes</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold text-lg">
                            <span>Exam Weight</span>
                            <span>{subtotal} Qs / {discount || 40} Mins</span>
                        </div>

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
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                        <Button className="w-full h-12 text-lg" onClick={handleNext} disabled={isNavigating}>
                            {isNavigating && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                            Confirm & Generate Slip
                        </Button>
                        <Button className="w-full" variant="outline" asChild>
                            <Link href="/cbt-simulator/student-details">Back</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
