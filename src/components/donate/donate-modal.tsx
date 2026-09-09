'use client';

import React, { useState } from 'react';
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Coffee, Heart, Sparkles, Shield, ArrowRight, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import usePaystack from '@/hooks/use-paystack';

interface DonateModalProps {
 open: boolean;
 onOpenChange: (open: boolean) => void;
}

export default function DonateModal({ open, onOpenChange }: DonateModalProps) {
 const { toast } = useToast();
 const { initializePayment, isScriptLoaded } = usePaystack();

 const [amount, setAmount] = useState<string>('');
 const [name, setName] = useState<string>('');
 const [email, setEmail] = useState<string>('');
 const [message, setMessage] = useState<string>('');
 const [isLoading, setIsLoading] = useState<boolean>(false);

 const finalAmount = parseFloat(amount) || 0;

 const handleDonate = async () => {
 if (finalAmount <= 0) {
 toast({
 title: 'Invalid Amount',
 description: 'Please select or enter a donation amount greater than $0.',
 variant: 'destructive',
 });
 return;
 }

 if (!email) {
 toast({
 title: 'Email Required',
 description: 'Please enter your email to proceed.',
 variant: 'destructive',
 });
 return;
 }

 if (!isScriptLoaded) {
 toast({ title: "Payment gateway is loading...", description: "Please wait a moment and try again." });
 return;
 }

 setIsLoading(true);

 try {
 initializePayment({
 key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_live_cb1d65dd8c8fae496d3aa59eec7f0bb6a4db46f0',
 email: email.trim(),
 amount: Math.round(finalAmount * 100), // Paystack uses kobo for NGN
 currency: 'NGN',
 metadata: {
 custom_fields: [
 { display_name: "Supporter Name", variable_name: "supporter_name", value: name.trim() || "Anonymous" },
 { display_name: "Message", variable_name: "message", value: message.trim() }
 ]
 },
 onSuccess: (transaction: any) => {
 toast({
 title: 'Thank You for Your Support! 🧡',
 description: `Your contribution helps keep NetSentry fast, secure, and independent.`,
 variant: 'success',
 });
 onOpenChange(false);
 setIsLoading(false);
 },
 onClose: () => {
 setIsLoading(false);
 }
 });
 } catch (error: any) {
 console.error('Donation checkout error:', error);
 toast({
 title: 'Payment Error',
 description: `There was an error initiating the payment.`,
 variant: 'destructive',
 });
 setIsLoading(false);
 }
 };

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent className="max-w-md bg-card border-border sm:rounded-lg p-6">
 <DialogHeader className="text-left space-y-2">
 <div className="flex items-center gap-2.5">
 <div className="p-2.5 rounded-md bg-primary/10 text-primary border border-primary/20">
 <Coffee className="w-5 h-5" />
 </div>
 <div>
 <DialogTitle className="font-bricolage text-xl font-bold flex items-center gap-2">
 Buy Us a Coffee
 <Heart className="w-4 h-4 text-primary fill-primary animate-pulse" />
 </DialogTitle>
 <DialogDescription className="text-xs text-muted-foreground">
 Support the development and maintenance of NetSentry.
 </DialogDescription>
 </div>
 </div>
 </DialogHeader>

 <div className="space-y-4 pt-2">
 {/* Custom Amount */}
 <div>
 <div className="flex items-center justify-between mb-1.5">
 <span className="text-xs font-semibold text-muted-foreground">Donation Amount (₦ NGN):</span>
 </div>
 <div className="relative">
 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">₦</span>
 <Input
 type="number"
 min="1"
 step="1"
 placeholder="Enter amount"
 value={amount}
 onChange={(e) => setAmount(e.target.value)}
 className="pl-7 bg-muted/10 border-border text-sm font-semibold"
 />
 </div>
 </div>

 {/* Supporter Details */}
 <div className="space-y-2.5 pt-1">
 <div className="grid grid-cols-2 gap-2">
 <Input
 placeholder="Your Name (Optional)"
 value={name}
 onChange={(e) => setName(e.target.value)}
 className="text-xs bg-muted/10 border-border"
 />
 <Input
 type="email"
 placeholder="Email (for receipt)"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 className="text-xs bg-muted/10 border-border"
 />
 </div>
 <Textarea
 placeholder="Say something nice or suggest a feature..."
 value={message}
 onChange={(e) => setMessage(e.target.value)}
 rows={2}
 className="text-xs bg-muted/10 border-border resize-none"
 />
 </div>

 {/* Action CTA */}
 <Button
 onClick={handleDonate}
 disabled={isLoading || finalAmount <= 0}
 className="w-full h-16 mt-4 font-black text-lg bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600 text-white rounded-xl flex items-center justify-center gap-3 shadow-xl hover:shadow-orange-500/25 transition-all"
 >
 {isLoading ? (
 <Loader2 className="w-6 h-6 animate-spin" />
 ) : (
 <>
 <Coffee className="w-6 h-6 animate-bounce" />
 <span>Support NetSentry with ₦{finalAmount || 0}</span>
 <ArrowRight className="w-6 h-6 ml-auto" />
 </>
 )}
 </Button>

 <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
 <Shield className="w-3 h-3 text-primary" />
 Secured globally via Paystack. No hidden fees.
 </p>
 </div>
 </DialogContent>
 </Dialog>
 );
}
