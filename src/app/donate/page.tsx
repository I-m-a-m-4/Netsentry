'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Coffee, 
  Heart, 
  Shield, 
  ArrowRight, 
  Check, 
  Loader2, 
  ExternalLink,
  CreditCard,
  Zap,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { NetSentryLogo } from '@/components/ui/netsentry-logo';
import { useToast } from '@/hooks/use-toast';
import usePaystack from '@/hooks/use-paystack';
import useFlutterwave from '@/hooks/use-flutterwave';
import { logCoffeeAttemptToFirebase, updateCoffeeAttemptStatus } from '@/lib/firebase-telemetry';

function DonatePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const initialAmount = searchParams.get('amount') ? Number(searchParams.get('amount')) : 1000;
  const initialEmail = searchParams.get('email') || '';
  const initialName = searchParams.get('name') || '';
  const initialGateway = (searchParams.get('gateway') === 'paystack' ? 'paystack' : 'flutterwave') as 'flutterwave' | 'paystack';

  const [amount, setAmount] = useState<number | ''>(initialAmount);
  const [email, setEmail] = useState<string>(initialEmail);
  const [name, setName] = useState<string>(initialName);
  const [gateway, setGateway] = useState<'flutterwave' | 'paystack'>(initialGateway);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [completedTxRef, setCompletedTxRef] = useState<string>('');

  const { initializePayment: initializePaystack } = usePaystack();
  const { initializePayment: initializeFlutterwave } = useFlutterwave();

  const handleDonate = async () => {
    if (!amount || Number(amount) < 100) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a contribution of at least ₦100.',
        variant: 'destructive',
      });
      return;
    }

    const numAmount = Number(amount);
    const finalEmail = (email && email.includes('@')) ? email.trim() : 'supporter@nethelm.app';
    const finalName = name.trim() || 'Generous Supporter';
    const reference = `coffee_web_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

    setIsLoading(true);

    const attemptId = await logCoffeeAttemptToFirebase({
      supporterName: finalName,
      email: finalEmail,
      amount: numAmount,
      currency: 'NGN',
      gateway,
      status: 'initiated',
      reference,
      platform: 'Web Portal (/donate)'
    });

    if (gateway === 'flutterwave') {
      try {
        initializeFlutterwave({
          public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK_TEST-SANDBOXDEMOKEY-X',
          tx_ref: reference,
          amount: numAmount,
          currency: 'NGN',
          payment_options: 'card,banktransfer,ussd,mobilemoney',
          customer: {
            email: finalEmail,
            name: finalName,
          },
          customizations: {
            title: 'Buy Us a Coffee',
            description: 'Support NetHelm / NetSentry Development',
            logo: 'https://netsentry-psi.vercel.app/app-icon.svg',
          },
          onSuccess: async (response: any) => {
            if (attemptId) {
              await updateCoffeeAttemptStatus(attemptId, 'completed', { response });
            }
            setCompletedTxRef(reference);
            setIsSuccess(true);
            setIsLoading(false);
          },
          onClose: async (incomplete?: boolean) => {
            if (attemptId && incomplete) {
              await updateCoffeeAttemptStatus(attemptId, 'cancelled');
            }
            setIsLoading(false);
          }
        });
      } catch (err) {
        console.error('Flutterwave payment error:', err);
        if (attemptId) await updateCoffeeAttemptStatus(attemptId, 'failed');
        setIsLoading(false);
      }
      return;
    }

    // Paystack
    try {
      initializePaystack({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_live_cb1d65dd8c8fae496d3aa59eec7f0bb6a4db46f0',
        email: finalEmail,
        amount: Math.round(numAmount * 100),
        currency: 'NGN',
        ref: reference,
        metadata: {
          custom_fields: [
            { display_name: "Supporter Name", variable_name: "supporter_name", value: finalName },
            { display_name: "Platform", variable_name: "platform", value: "Web Portal" }
          ]
        },
        onSuccess: async (transaction: any) => {
          if (attemptId) {
            await updateCoffeeAttemptStatus(attemptId, 'completed', { transaction });
          }
          setCompletedTxRef(reference);
          setIsSuccess(true);
          setIsLoading(false);
        },
        onClose: async () => {
          if (attemptId) {
            await updateCoffeeAttemptStatus(attemptId, 'cancelled');
          }
          setIsLoading(false);
        }
      });
    } catch (err) {
      console.error('Paystack error:', err);
      if (attemptId) await updateCoffeeAttemptStatus(attemptId, 'failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] text-white flex flex-col items-center justify-center p-4 selection:bg-primary selection:text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[350px] h-[350px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation Top */}
      <div className="w-full max-w-lg mb-6 flex items-center justify-between z-10">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <div className="flex items-center gap-2">
          <NetSentryLogo className="w-7 h-7 rounded-md" />
          <span className="font-bricolage text-sm font-black text-primary">NetHelm</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-lg rounded-2xl border border-[#18181C] bg-[#0A0A0C] shadow-2xl p-6 md:p-8 z-10">
        {!isSuccess ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/20 mb-1">
                <Coffee className="w-7 h-7" />
              </div>
              <h1 className="font-bricolage text-2xl md:text-3xl font-extrabold tracking-tight">
                Buy Us a Coffee
              </h1>
              <p className="text-xs md:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                Your direct contribution keeps NetHelm high-speed, 100% ad-free, and independently engineered.
              </p>
            </div>

            {/* Gateway Toggle */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Choose Payment Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGateway('flutterwave')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    gateway === 'flutterwave'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-500 shadow-md shadow-amber-500/10'
                      : 'border-[#18181C] bg-[#0D0D10] text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  <span>Flutterwave</span>
                  {gateway === 'flutterwave' && <Check className="w-4 h-4 ml-auto text-amber-500" />}
                </button>

                <button
                  type="button"
                  onClick={() => setGateway('paystack')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    gateway === 'paystack'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 shadow-md shadow-emerald-500/10'
                      : 'border-[#18181C] bg-[#0D0D10] text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Paystack</span>
                  {gateway === 'paystack' && <Check className="w-4 h-4 ml-auto text-emerald-500" />}
                </button>
              </div>
            </div>

            {/* Preset Amounts */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Select Coffee Size
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[500, 1000, 2500, 5000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      amount === val
                        ? 'border-primary bg-primary/10 text-primary shadow-sm'
                        : 'border-[#18181C] bg-[#0D0D10] text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    ₦{val.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Or Custom Amount (NGN)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-sm text-slate-400">
                  ₦
                </span>
                <input
                  type="number"
                  min="100"
                  step="100"
                  placeholder="e.g. 5000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                  className="w-full pl-8 pr-3 py-3 text-base font-mono font-bold rounded-xl border border-[#18181C] bg-[#0D0D10] text-white outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Supporter Details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Your Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bello"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#18181C] bg-[#0D0D10] text-white outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Email (Receipt)
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#18181C] bg-[#0D0D10] text-white outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleDonate}
              disabled={isLoading || !amount || Number(amount) < 100}
              className="w-full py-3.5 px-4 font-black text-sm bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600 text-white rounded-xl flex items-center justify-center gap-2.5 shadow-lg shadow-orange-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Coffee className="w-5 h-5" />
                  <span>
                    Buy Coffee with {gateway === 'flutterwave' ? 'Flutterwave' : 'Paystack'} (₦{amount ? Number(amount).toLocaleString() : '0'})
                  </span>
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </>
              )}
            </button>

            {/* Security Note */}
            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 pt-2 border-t border-[#18181C]">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>Direct 256-bit encrypted checkout via {gateway === 'flutterwave' ? 'Flutterwave' : 'Paystack'}. Instant confirmation.</span>
            </div>
          </div>
        ) : (
          /* Thank You State */
          <div className="text-center space-y-5 py-6">
            <div className="inline-flex p-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 shadow-xl shadow-emerald-500/10">
              <Sparkles className="w-10 h-10 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h2 className="font-bricolage text-2xl font-black text-white">
                Thank You for Your Support! ☕🧡
              </h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Your contribution of <strong className="text-white">₦{Number(amount).toLocaleString()}</strong> was received successfully. It directly powers NetHelm development.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-[#18181C] bg-[#0D0D10] text-xs font-mono text-slate-400">
              Transaction Ref: <span className="text-white">{completedTxRef}</span>
            </div>

            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs transition-all shadow-lg shadow-primary/20"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to NetHelm</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DonatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050507] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <DonatePageContent />
    </Suspense>
  );
}
