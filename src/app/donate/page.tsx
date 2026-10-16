'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
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
  Sparkles,
  RefreshCw,
  Copy,
  CheckCheck
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

  const paramGateway = searchParams.get('gateway')?.toLowerCase();
  const initialGateway: 'flutterwave' | 'paystack' = paramGateway === 'paystack' ? 'paystack' : 'flutterwave';
  const initialAmount = searchParams.get('amount') ? Number(searchParams.get('amount')) : 1000;
  const initialEmail = searchParams.get('email') || '';
  const initialName = searchParams.get('name') || '';

  const [amount, setAmount] = useState<number | ''>(initialAmount);
  const [email, setEmail] = useState<string>(initialEmail);
  const [name, setName] = useState<string>(initialName);
  const [gateway, setGateway] = useState<'flutterwave' | 'paystack'>(initialGateway);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [completedTxRef, setCompletedTxRef] = useState<string>('');
  const [copiedRef, setCopiedRef] = useState<boolean>(false);

  const { initializePayment: initializePaystack, isScriptLoaded: isPaystackLoaded } = usePaystack();
  const { initializePayment: initializeFlutterwave, isScriptLoaded: isFlutterwaveLoaded } = useFlutterwave();

  // Sync state if query parameters change
  useEffect(() => {
    const gw = searchParams.get('gateway')?.toLowerCase();
    if (gw === 'paystack') {
      setGateway('paystack');
    } else if (gw === 'flutterwave') {
      setGateway('flutterwave');
    }

    const amt = searchParams.get('amount');
    if (amt && !isNaN(Number(amt)) && Number(amt) > 0) {
      setAmount(Number(amt));
    }

    const em = searchParams.get('email');
    if (em) setEmail(em);

    const nm = searchParams.get('name');
    if (nm) setName(nm);
  }, [searchParams]);

  // Update URL query parameters on gateway switch
  const handleGatewayChange = (newGateway: 'flutterwave' | 'paystack') => {
    setGateway(newGateway);
    const params = new URLSearchParams(searchParams.toString());
    params.set('gateway', newGateway);
    if (amount) params.set('amount', String(amount));
    if (email) params.set('email', email);
    if (name) params.set('name', name);
    router.replace(`/donate?${params.toString()}`, { scroll: false });
  };

  const copyReferenceToClipboard = () => {
    if (!completedTxRef) return;
    navigator.clipboard.writeText(completedTxRef);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
    toast({
      title: 'Copied to Clipboard',
      description: 'Transaction reference copied.',
    });
  };

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

    // 1. FLUTTERWAVE GATEWAY
    if (gateway === 'flutterwave') {
      try {
        const flwPublicKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK_TEST-SANDBOXDEMOKEY-X';
        
        initializeFlutterwave({
          public_key: flwPublicKey,
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
      } catch (err: any) {
        console.error('Flutterwave payment error:', err);
        if (attemptId) await updateCoffeeAttemptStatus(attemptId, 'failed');
        toast({
          title: 'Flutterwave Unavailable',
          description: 'Could not launch Flutterwave checkout. You can switch to Paystack with 1 click below.',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
      return;
    }

    // 2. PAYSTACK GATEWAY
    try {
      const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_live_cb1d65dd8c8fae496d3aa59eec7f0bb6a4db46f0';
      
      initializePaystack({
        key: paystackKey,
        email: finalEmail,
        amount: Math.round(numAmount * 100),
        currency: 'NGN',
        ref: reference,
        metadata: {
          custom_fields: [
            { display_name: "Supporter Name", variable_name: "supporter_name", value: finalName },
            { display_name: "Platform", variable_name: "platform", value: "Web Portal (/donate)" }
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
    } catch (err: any) {
      console.error('Paystack error:', err);
      if (attemptId) await updateCoffeeAttemptStatus(attemptId, 'failed');
      toast({
        title: 'Paystack Checkout Error',
        description: 'Failed to open Paystack window. Please check your internet connection.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Preload Gateway SDKs for ultra-fast modal execution */}
      <Script 
        src="https://checkout.flutterwave.com/v3.js" 
        strategy="afterInteractive" 
      />
      <Script 
        src="https://js.paystack.co/v1/inline.js" 
        strategy="afterInteractive" 
      />

      <div className="min-h-screen bg-[#050507] text-white flex flex-col items-center justify-center p-4 selection:bg-primary selection:text-white relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-[380px] h-[380px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Navigation Top */}
        <div className="w-full max-w-lg mb-6 flex items-center justify-between z-10">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to NetHelm</span>
          </Link>
          <div className="flex items-center gap-2">
            <NetSentryLogo className="w-7 h-7 rounded-md shadow-md" />
            <span className="font-bricolage text-sm font-black text-primary tracking-tight">NetHelm</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="w-full max-w-lg rounded-2xl border border-[#18181C] bg-[#0A0A0C] shadow-2xl p-6 md:p-8 z-10 backdrop-blur-xl">
          {!isSuccess ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center space-y-2">
                <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20 mb-1 animate-pulse">
                  <Coffee className="w-7 h-7" />
                </div>
                <h1 className="font-bricolage text-2xl md:text-3xl font-extrabold tracking-tight">
                  Buy Us a Coffee
                </h1>
                <p className="text-xs md:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                  Support NetHelm &amp; NetSentry engineering. Direct support keeps our software fast, independent, and 100% ad-free.
                </p>
              </div>

              {/* Gateway Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Choose Payment Gateway
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Active: {gateway === 'flutterwave' ? 'Flutterwave' : 'Paystack'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleGatewayChange('flutterwave')}
                    className={`py-3 px-3.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                      gateway === 'flutterwave'
                        ? 'border-amber-500 bg-amber-500/15 text-amber-400 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/30'
                        : 'border-[#18181C] bg-[#0D0D10] text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="font-bold">Flutterwave</span>
                    {gateway === 'flutterwave' && <Check className="w-4 h-4 ml-auto text-amber-500" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGatewayChange('paystack')}
                    className={`py-3 px-3.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                      gateway === 'paystack'
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                        : 'border-[#18181C] bg-[#0D0D10] text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-emerald-500" />
                    <span className="font-bold">Paystack</span>
                    {gateway === 'paystack' && <Check className="w-4 h-4 ml-auto text-emerald-500" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 text-center">
                  {gateway === 'flutterwave' 
                    ? '⚡ Flutterwave supports Cards (Mastercard, Visa, Verve), Bank Transfers, and USSD.' 
                    : '🛡️ Paystack supports Cards, Bank Accounts, and USSD with instant confirmation.'}
                </p>
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
                          ? 'border-primary bg-primary/15 text-primary shadow-sm ring-1 ring-primary/30'
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
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-slate-400">
                    ₦
                  </span>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    placeholder="e.g. 10000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                    className="w-full pl-9 pr-3 py-3 text-base font-mono font-bold rounded-xl border border-[#18181C] bg-[#0D0D10] text-white outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              {/* Supporter Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bello"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#18181C] bg-[#0D0D10] text-white outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Email (For Receipt)
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#18181C] bg-[#0D0D10] text-white outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleDonate}
                  disabled={isLoading || !amount || Number(amount) < 100}
                  className="w-full py-3.5 px-4 font-black text-sm bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600 text-white rounded-xl flex items-center justify-center gap-2.5 shadow-lg shadow-orange-500/25 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.99]"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Coffee className="w-5 h-5" />
                      <span>
                        Pay ₦{amount ? Number(amount).toLocaleString() : '0'} via {gateway === 'flutterwave' ? 'Flutterwave' : 'Paystack'}
                      </span>
                      <ArrowRight className="w-4 h-4 ml-auto" />
                    </>
                  )}
                </button>

                {/* Alternative gateway quick link */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => handleGatewayChange(gateway === 'flutterwave' ? 'paystack' : 'flutterwave')}
                    className="text-[11px] text-slate-400 hover:text-white transition-colors underline underline-offset-2"
                  >
                    Prefer to pay with {gateway === 'flutterwave' ? 'Paystack' : 'Flutterwave'} instead? Click here
                  </button>
                </div>
              </div>

              {/* Security Note */}
              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 pt-3 border-t border-[#18181C]">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span>256-bit encrypted checkout via {gateway === 'flutterwave' ? 'Flutterwave' : 'Paystack'}. Instant receipt &amp; zero storage of card details.</span>
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
                  Thank You for Your Coffee! ☕🧡
                </h2>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Your contribution of <strong className="text-white">₦{Number(amount).toLocaleString()}</strong> was received successfully. It directly fuels NetHelm &amp; NetSentry performance and updates.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-[#18181C] bg-[#0D0D10] text-xs font-mono text-slate-400 flex items-center justify-between gap-2">
                <div className="truncate">
                  Ref: <span className="text-white">{completedTxRef}</span>
                </div>
                <button
                  type="button"
                  onClick={copyReferenceToClipboard}
                  className="p-1.5 rounded-lg hover:bg-[#18181C] text-slate-400 hover:text-white transition-colors"
                  title="Copy Reference"
                >
                  {copiedRef ? <CheckCheck className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs transition-all shadow-lg shadow-primary/20"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to NetHelm</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setIsSuccess(false);
                    setCompletedTxRef('');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors py-1"
                >
                  Make another contribution
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
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
