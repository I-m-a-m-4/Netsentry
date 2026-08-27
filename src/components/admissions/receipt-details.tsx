import * as React from "react";
import type { Admission } from "@/types";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import type { Academy } from "@/types";
import { safeToDate } from "@/lib/utils";

interface ReceiptDetailsProps {
    receipt: Admission;
    academy?: Academy | null;
    currencySymbol?: string;
    isInvoice?: boolean;
}

const Watermark = ({ businessName }: { businessName: string }) => (
    <div className="watermark absolute inset-0 flex items-center justify-center text-gray-200 text-8xl font-bold uppercase select-none -z-10 opacity-30 -rotate-45 pointer-events-none">
        PINNACLE
    </div>
);

const ReceiptDetails = React.memo(React.forwardRef<HTMLDivElement, ReceiptDetailsProps>(
    ({ receipt, academy, currencySymbol = '₦', isInvoice = false }, ref) => {
        const businessName = academy?.name || 'Pinnacle Academia';
        const businessAddress = academy?.address || '';

        const displayStatus = receipt.status === 'paid' ? 'Active / Ready' : (receipt.status === 'pending' ? 'Pending Setup' : 'Offline Mode');
        const displayMode = receipt.paymentMethod === 'Cash' ? 'Full Exam' : (receipt.paymentMethod === 'Card' ? 'Speed Battle' : (receipt.paymentMethod === 'Bank Transfer' ? 'Practice Mode' : 'Offline Study'));

        // If it's an invoice, we use a slightly more structured layout but keep it simple as requested
        if (isInvoice) {
            return (
                <div ref={ref}>
                    <Card className="w-full max-w-2xl mx-auto relative overflow-hidden print-receipt p-6">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h1 className="text-xl font-bold text-primary">{businessName}</h1>
                                <p className="text-muted-foreground whitespace-pre-wrap text-[11px]">{businessAddress}</p>
                                {academy?.settings?.phone && <p className="text-[10px]">Tel: {academy.settings.phone}</p>}
                            </div>
                            <div className="text-right">
                                <h2 className="text-lg font-bold uppercase text-primary">Examination Slip</h2>
                                <p className="font-medium text-sm">Slip ID: #{receipt.receiptNumber || receipt.id.substring(0, 8).toUpperCase()}</p>
                                <p className="text-[10px] text-muted-foreground">
                                    {receipt.createdAt ? format(safeToDate(receipt.createdAt), 'PPP') : 'N/A'}
                                </p>
                            </div>
                        </div>

                        <Separator className="my-6" />

                        <div className="grid grid-cols-2 gap-8 mb-8">
                            <div>
                                <h3 className="text-[9px] font-bold uppercase text-muted-foreground mb-1">Student Profile:</h3>
                                <p className="font-semibold text-sm">{receipt.customer?.name || 'Standard Student'}</p>
                                <p className="text-[11px] text-muted-foreground">{receipt.customer?.email || ''}</p>
                            </div>
                            <div className="text-right">
                                <h3 className="text-[9px] font-bold uppercase text-muted-foreground mb-1">Registration Status:</h3>
                                <p className="font-semibold capitalize text-sm">{displayStatus}</p>
                                <p className="text-[11px] text-muted-foreground">Mode: {displayMode}</p>
                            </div>
                        </div>

                        <table className="w-full mb-8 text-[11px]">
                            <thead className="border-b">
                                <tr className="text-left">
                                    <th className="py-2">Selected UTME Subject</th>
                                    <th className="py-2 text-center">Papers</th>
                                    <th className="py-2 text-right">Questions</th>
                                    <th className="py-2 text-right">Subtotal Qs</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {receipt.items.map((item, index) => (
                                    <tr key={item.subjectId + index}>
                                        <td className="py-3 font-medium">{item.name}</td>
                                        <td className="py-3 text-center">{item.quantity}</td>
                                        <td className="py-3 text-right">{item.price} Qs</td>
                                        <td className="py-3 text-right">{(item.quantity * item.price)} Qs</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="flex justify-end mb-8">
                            <div className="w-64 space-y-2">
                                <div className="flex justify-between text-[11px]">
                                    <span>Total Base Questions</span>
                                    <span>{receipt.subtotal.toLocaleString()} Questions</span>
                                </div>
                                <div className="flex justify-between text-[11px]">
                                    <span>Target Score Minimum</span>
                                    <span>{receipt.tax}% Minimum</span>
                                </div>
                                {receipt.discount > 0 && (
                                    <div className="flex justify-between text-[11px] text-destructive font-medium">
                                        <span>Exam Time Limit</span>
                                        <span>{receipt.discount} Minutes</span>
                                    </div>
                                )}
                                <Separator />
                                <div className="flex justify-between text-sm font-bold">
                                    <span>Exam Weight</span>
                                    <span>{receipt.subtotal} Qs / {receipt.discount || 40} Mins</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 text-center text-[9px] text-muted-foreground border-t pt-2">
                            <p>Excellence is our goal!</p>
                            <p>Powered by Pinnacle Academia CBT Engine</p>
                        </div>
                    </Card>
                </div>
            );
        }

        // Default Admission View (Classic) - Optimized for Thermal Printers
        return (
            <div ref={ref} className="w-full bg-white sm:py-4 print:py-0">
                <Card className="w-full max-w-[300px] mx-auto relative overflow-hidden print-receipt shadow-none border-dashed border-2 border-gray-200 bg-white text-black print:border-none print:shadow-none">
                    <Watermark businessName={businessName} />
                    <CardHeader className="text-center pb-2 pt-4 px-4">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider">Pinnacle Academia CBT</CardTitle>
                        {businessAddress && <CardDescription className="text-[9px]">{businessAddress}</CardDescription>}
                    </CardHeader>
                    <CardContent className="text-[10px] px-4 pb-4">
                        <div className="flex justify-between mb-1">
                            <span className="text-gray-500">Examination Slip ID:</span>
                            <span className="font-mono">{receipt.receiptNumber || receipt.id.substring(0, 8).toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between mb-3">
                            <span className="text-gray-500">Date:</span>
                            <span className="font-mono">{receipt.createdAt ? format(safeToDate(receipt.createdAt), 'dd/MM/yy HH:mm') : 'N/A'}</span>
                        </div>

                        {receipt.customer && (
                            <>
                                <Separator className="my-2 border-dashed border-gray-300" />
                                <div className="mb-2">
                                    <h3 className="font-semibold text-gray-500 uppercase text-[9px]">Student Profile:</h3>
                                    <p className="font-medium text-[11px]">{receipt.customer.name}</p>
                                    <p className="text-gray-500 text-[9px]">{receipt.customer.email}</p>
                                </div>
                            </>
                        )}

                        <Separator className="my-3 border-dashed border-gray-300" />

                        <div className="space-y-2">
                            {receipt.items.map((item, index) => (
                                <div key={item.subjectId + index} className="flex justify-between items-start mb-1 text-[10px]">
                                    <div className="flex-1 pr-2">
                                        <p className="font-medium leading-tight">{item.name}</p>
                                        <p className="text-gray-500 text-[9px] mt-0.5">
                                            {item.quantity} x {item.price} Qs
                                        </p>
                                    </div>
                                    <p className="font-medium pt-0.5">{(item.quantity * item.price)} Qs</p>
                                </div>
                            ))}
                        </div>

                        <Separator className="my-3 border-dashed border-gray-300" />

                        <div className="space-y-1.5 text-[10px] font-medium text-gray-600">
                            <div className="flex justify-between">
                                <span>Total Questions</span>
                                <span>{receipt.subtotal} Qs</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Target Score</span>
                                <span>{receipt.tax}%</span>
                            </div>
                            {receipt.discount > 0 && (
                                <div className="flex justify-between">
                                    <span>Time Limit</span>
                                    <span className="text-red-500 font-bold">-{receipt.discount} min</span>
                                </div>
                            )}
                        </div>

                        <Separator className="my-3 border-dashed border-gray-300" />

                        <div className="flex justify-between font-bold text-sm pt-1">
                            <span>Total Weight</span>
                            <span>{receipt.subtotal} Qs / {receipt.discount || 40} min</span>
                        </div>

                    </CardContent>
                    <div className="bg-gray-50/50 p-4 pt-2 text-center text-[9px] border-t border-dashed border-gray-200">
                        <p className="font-medium text-gray-600 mb-1">Prepare to excel, Pinnacle Student!</p>
                        <p className="text-gray-500">Mode: <span className="font-semibold uppercase">{displayMode}</span></p>
                    </div>
                </Card>
            </div>
        );
    }
));
ReceiptDetails.displayName = "ReceiptDetails";

export default ReceiptDetails;
