'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { 
	Coffee, 
	Heart, 
	Sparkles, 
	Shield, 
	ArrowRight, 
	Check, 
	Loader2, 
	X, 
	ExternalLink,
	CreditCard,
	Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import usePaystack from '@/hooks/use-paystack';
import useFlutterwave from '@/hooks/use-flutterwave';
import { logCoffeeAttemptToFirebase, updateCoffeeAttemptStatus } from '@/lib/firebase-telemetry';

interface DonateModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	isDark?: boolean;
}

export default function DonateModal({ open, onOpenChange, isDark: propIsDark }: DonateModalProps) {
	const { toast } = useToast();
	const { resolvedTheme } = useTheme();
	const isDark = propIsDark !== undefined ? propIsDark : resolvedTheme === 'dark';

	const { initializePayment: initializePaystack, isScriptLoaded: isPaystackLoaded } = usePaystack();
	const { initializePayment: initializeFlutterwave, isScriptLoaded: isFlutterwaveLoaded } = useFlutterwave();

	const [amount, setAmount] = useState<number | ''>(1000);
	const [email, setEmail] = useState<string>('');
	const [name, setName] = useState<string>('');
	const [gateway, setGateway] = useState<'flutterwave' | 'paystack'>('flutterwave');
	const [isLoading, setIsLoading] = useState<boolean>(false);

	if (!open) return null;

	const isTauri = typeof window !== 'undefined' && !!(window as any).__TAURI_INTERNALS__;

	const openInBrowser = async (targetUrl: string) => {
		try {
			if (isTauri) {
				const { invoke } = await import('@tauri-apps/api/core');
				await invoke('open_external_url', { url: targetUrl });
			} else {
				window.open(targetUrl, '_blank', 'noopener,noreferrer');
			}
		} catch (e) {
			window.open(targetUrl, '_blank', 'noopener,noreferrer');
		}
	};

	const handleDonate = async () => {
		if (!amount || Number(amount) < 100) {
			toast({
				title: 'Invalid Amount',
				description: 'Please enter a donation amount of at least ₦100.',
				variant: 'destructive',
			});
			return;
		}

		const numAmount = Number(amount);
		const finalEmail = (email && email.includes('@')) ? email.trim() : 'supporter@nethelm.app';
		const finalName = name.trim() || 'Generous Supporter';
		const reference = `coffee_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

		setIsLoading(true);

		// Record the attempt in Firestore so the admin can see who attempted to buy coffee!
		const attemptId = await logCoffeeAttemptToFirebase({
			supporterName: finalName,
			email: finalEmail,
			amount: numAmount,
			currency: 'NGN',
			gateway,
			status: 'initiated',
			reference,
			platform: isTauri ? 'Windows Desktop App' : 'Web Client'
		});

		// 1. FLUTTERWAVE GATEWAY
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
						description: 'NetHelm Developer Support',
						logo: 'https://netsentry-psi.vercel.app/app-icon.svg',
					},
					onSuccess: async (response: any) => {
						if (attemptId) {
							await updateCoffeeAttemptStatus(attemptId, 'completed', { response });
						}
						toast({
							title: 'Thank You for Your Coffee! ☕🧡',
							description: `We appreciate your support of ₦${numAmount.toLocaleString()}.`,
						});
						setIsLoading(false);
						onOpenChange(false);
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
				const webUrl = `https://netsentry-psi.vercel.app/?donate=true&gateway=flutterwave&amount=${numAmount}&email=${encodeURIComponent(finalEmail)}`;
				await openInBrowser(webUrl);
				setIsLoading(false);
			}
			return;
		}

		// 2. PAYSTACK GATEWAY
		try {
			initializePaystack({
				key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_live_cb1d65dd8c8fae496d3aa59eec7f0bb6a4db46f0',
				email: finalEmail,
				amount: Math.round(numAmount * 100), // kobo
				currency: 'NGN',
				ref: reference,
				metadata: {
					custom_fields: [
						{ display_name: "Supporter Name", variable_name: "supporter_name", value: finalName },
						{ display_name: "Platform", variable_name: "platform", value: isTauri ? "Windows Desktop App" : "Web Client" }
					]
				},
				onSuccess: async (transaction: any) => {
					if (attemptId) {
						await updateCoffeeAttemptStatus(attemptId, 'completed', { transaction });
					}
					toast({
						title: 'Thank You for Your Coffee! ☕🧡',
						description: `We appreciate your support of ₦${numAmount.toLocaleString()}.`,
					});
					setIsLoading(false);
					onOpenChange(false);
				},
				onClose: async () => {
					if (attemptId) {
						await updateCoffeeAttemptStatus(attemptId, 'cancelled');
					}
					setIsLoading(false);
				}
			});
		} catch (error: any) {
			console.error('Paystack checkout error:', error);
			if (attemptId) await updateCoffeeAttemptStatus(attemptId, 'failed');
			const webCheckoutUrl = `https://netsentry-psi.vercel.app/?donate=true&gateway=paystack&amount=${numAmount}&email=${encodeURIComponent(finalEmail)}`;
			await openInBrowser(webCheckoutUrl);
			setIsLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
			<div 
				className={`w-full max-w-md rounded-2xl border flex flex-col overflow-hidden shadow-2xl transition-all ${
					isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
				}`}
			>
				{/* Modal Header */}
				<div className={`px-6 py-5 border-b flex items-center justify-between ${isDark ? 'border-slate-850 bg-slate-900/40' : 'border-slate-100 bg-slate-50/50'}`}>
					<div className="flex items-center gap-3">
						<div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md">
							<Coffee className="w-5 h-5" />
						</div>
						<div>
							<h3 className="font-bricolage text-lg font-bold flex items-center gap-2">
								<span>Buy Us a Coffee</span>
								<Heart className="w-4 h-4 text-primary fill-primary animate-pulse" />
							</h3>
							<p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
								Support NetHelm development & high-performance server network
							</p>
						</div>
					</div>
					<button
						onClick={() => onOpenChange(false)}
						className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
						title="Close modal"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Modal Body */}
				<div className="p-6 space-y-4">
					{/* Payment Gateway Toggle */}
					<div className="space-y-1.5">
						<label className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
							Select Payment Gateway
						</label>
						<div className="grid grid-cols-2 gap-2">
							<button
								type="button"
								onClick={() => setGateway('flutterwave')}
								className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
									gateway === 'flutterwave'
										? 'border-amber-500 bg-amber-500/10 text-amber-500 shadow-sm'
										: isDark
											? 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
											: 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
								}`}
							>
								<Zap className="w-3.5 h-3.5" />
								<span>Flutterwave</span>
								{gateway === 'flutterwave' && <Check className="w-3.5 h-3.5 ml-auto text-amber-500" />}
							</button>

							<button
								type="button"
								onClick={() => setGateway('paystack')}
								className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
									gateway === 'paystack'
										? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 shadow-sm'
										: isDark
											? 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
											: 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
								}`}
							>
								<CreditCard className="w-3.5 h-3.5" />
								<span>Paystack</span>
								{gateway === 'paystack' && <Check className="w-3.5 h-3.5 ml-auto text-emerald-500" />}
							</button>
						</div>
					</div>

					{/* Preset Amounts */}
					<div className="space-y-1.5">
						<label className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
							Quick Coffee Amounts (NGN)
						</label>
						<div className="grid grid-cols-4 gap-2">
							{[500, 1000, 2500, 5000].map(val => (
								<button
									key={val}
									type="button"
									onClick={() => setAmount(val)}
									className={`py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
										amount === val
											? 'border-primary bg-primary/10 text-primary'
											: isDark
												? 'border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700'
												: 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
									}`}
								>
									₦{val.toLocaleString()}
								</button>
							))}
						</div>
					</div>

					{/* Custom Amount Input */}
					<div className="space-y-1.5">
						<label className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
							Or Enter Custom Amount (NGN)
						</label>
						<div className="relative">
							<span className={`absolute left-3 top-1/2 -translate-y-1/2 font-bold text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
								₦
							</span>
							<input
								type="number"
								min="100"
								step="100"
								placeholder="e.g. 5000"
								value={amount}
								onChange={(e) => setAmount(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
								className={`w-full pl-8 pr-3 py-2.5 text-base font-mono font-bold rounded-xl border outline-none focus:ring-1 focus:ring-primary ${
									isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
								}`}
							/>
						</div>
					</div>

					{/* Supporter Details */}
					<div className="grid grid-cols-2 gap-2.5">
						<div className="space-y-1">
							<label className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
								Your Name
							</label>
							<input
								type="text"
								placeholder="e.g. John"
								value={name}
								onChange={(e) => setName(e.target.value)}
								className={`w-full px-3 py-2 text-xs rounded-xl border outline-none focus:ring-1 focus:ring-primary ${
									isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
								}`}
							/>
						</div>
						<div className="space-y-1">
							<label className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
								Email (Receipt)
							</label>
							<input
								type="email"
								placeholder="name@example.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className={`w-full px-3 py-2 text-xs rounded-xl border outline-none focus:ring-1 focus:ring-primary ${
									isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
								}`}
							/>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="space-y-2 pt-1">
						<button
							onClick={handleDonate}
							disabled={isLoading || !amount || Number(amount) < 100}
							className="w-full py-3 px-4 font-black text-sm bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600 text-white rounded-xl flex items-center justify-center gap-2.5 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all cursor-pointer disabled:opacity-50"
						>
							{isLoading ? (
								<Loader2 className="w-5 h-5 animate-spin" />
							) : (
								<>
									<Coffee className="w-5 h-5 animate-bounce" />
									<span>
										Buy Coffee with {gateway === 'flutterwave' ? 'Flutterwave' : 'Paystack'} (₦{amount ? Number(amount).toLocaleString() : '0'})
									</span>
									<ArrowRight className="w-4 h-4 ml-auto" />
								</>
							)}
						</button>

						{isTauri && (
							<button
								type="button"
								onClick={() => {
									const params = new URLSearchParams();
									params.set('gateway', 'flutterwave');
									if (amount) params.set('amount', String(amount));
									if (email) params.set('email', email.trim());
									if (name) params.set('name', name.trim());
									openInBrowser(`https://netsentry-psi.vercel.app/donate?${params.toString()}`);
								}}
								className={`w-full py-2 text-center text-xs font-semibold rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
									isDark 
										? 'border-[#18181C] text-muted-foreground hover:text-foreground hover:bg-[#0E0E12]' 
										: 'border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
								}`}
							>
								<ExternalLink className="w-3.5 h-3.5" />
								<span>Or complete in default browser</span>
							</button>
						)}
					</div>

					{/* Footer Security Badge */}
					<div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
						<Shield className="w-3 h-3 text-emerald-500" />
						<span>256-bit encrypted checkout via {gateway === 'flutterwave' ? 'Flutterwave' : 'Paystack'} · Direct developer support</span>
					</div>
				</div>
			</div>
		</div>
	);
}
