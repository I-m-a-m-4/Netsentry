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
	CreditCard
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import usePaystack from '@/hooks/use-paystack';

interface DonateModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	isDark?: boolean;
}

const PRESET_TIERS = [
	{ count: 1, label: '1 Coffee', amount: 2000, emoji: '☕' },
	{ count: 3, label: '3 Coffees', amount: 5000, emoji: '☕☕', popular: true },
	{ count: 5, label: 'Supporter', amount: 10000, emoji: '🚀' },
];

export default function DonateModal({ open, onOpenChange, isDark: propIsDark }: DonateModalProps) {
	const { toast } = useToast();
	const { resolvedTheme } = useTheme();
	const isDark = propIsDark !== undefined ? propIsDark : resolvedTheme === 'dark';
	const { initializePayment, isScriptLoaded } = usePaystack();

	const [amount, setAmount] = useState<number>(5000);
	const [customMode, setCustomMode] = useState<boolean>(false);
	const [name, setName] = useState<string>('');
	const [email, setEmail] = useState<string>('');
	const [message, setMessage] = useState<string>('');
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
		if (!amount || amount <= 0) {
			toast({
				title: 'Invalid Amount',
				description: 'Please select or enter a donation amount greater than ₦0.',
				variant: 'destructive',
			});
			return;
		}

		if (!email || !email.includes('@')) {
			toast({
				title: 'Email Required',
				description: 'Please enter a valid email address for your donation receipt.',
				variant: 'destructive',
			});
			return;
		}

		setIsLoading(true);

		// If running in Tauri and script not ready, offer direct web checkout
		if (isTauri && !isScriptLoaded) {
			const webCheckoutUrl = `https://netsentry-psi.vercel.app/?donate=true&amount=${amount}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name || 'Supporter')}`;
			await openInBrowser(webCheckoutUrl);
			toast({
				title: 'Opening Secure Checkout',
				description: 'Redirecting to your default browser for safe bank/card payment...',
			});
			setIsLoading(false);
			onOpenChange(false);
			return;
		}

		try {
			initializePayment({
				key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_live_cb1d65dd8c8fae496d3aa59eec7f0bb6a4db46f0',
				email: email.trim(),
				amount: Math.round(amount * 100), // Paystack uses kobo
				currency: 'NGN',
				metadata: {
					custom_fields: [
						{ display_name: "Supporter Name", variable_name: "supporter_name", value: name.trim() || "Anonymous Supporter" },
						{ display_name: "Message", variable_name: "message", value: message.trim() },
						{ display_name: "Platform", variable_name: "platform", value: isTauri ? "Windows Desktop App" : "Web Client" }
					]
				},
				onSuccess: (_transaction: any) => {
					toast({
						title: 'Thank You for Your Support! 🧡',
						description: `Your contribution helps keep NetSentry fast, independent, and free.`,
					});
					onOpenChange(false);
					setIsLoading(false);
				},
				onClose: () => {
					setIsLoading(false);
				}
			});
		} catch (error: any) {
			console.error('Payment checkout error:', error);
			// Fallback to browser checkout
			const webCheckoutUrl = `https://netsentry-psi.vercel.app/?donate=true&amount=${amount}&email=${encodeURIComponent(email)}`;
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
								Support NetSentry development & server maintenance
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
				<div className="p-6 space-y-5">
					{/* Coffee Tiers */}
					<div className="space-y-2">
						<label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
							Select Support Amount
						</label>
						<div className="grid grid-cols-3 gap-2.5">
							{PRESET_TIERS.map(tier => {
								const isSelected = !customMode && amount === tier.amount;
								return (
									<button
										key={tier.count}
										type="button"
										onClick={() => {
											setAmount(tier.amount);
											setCustomMode(false);
										}}
										className={`relative p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
											isSelected
												? 'border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary'
												: isDark 
													? 'border-slate-800 bg-slate-900/40 hover:border-slate-700 text-slate-300' 
													: 'border-slate-200 bg-slate-50 hover:border-slate-300 text-slate-700'
										}`}
									>
										{tier.popular && (
											<span className="absolute -top-2 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-black uppercase tracking-wider shadow">
												Popular
											</span>
										)}
										<span className="text-xl">{tier.emoji}</span>
										<span className="text-xs font-bold">{tier.label}</span>
										<span className="text-[11px] font-mono font-semibold opacity-80">₦{tier.amount.toLocaleString()}</span>
									</button>
								);
							})}
						</div>

						{/* Custom Amount Toggle & Input */}
						<div className="pt-1">
							{!customMode ? (
								<button
									type="button"
									onClick={() => setCustomMode(true)}
									className={`text-xs font-medium hover:underline text-primary cursor-pointer flex items-center gap-1`}
								>
									<span>Custom amount?</span>
								</button>
							) : (
								<div className="relative mt-2 animate-in fade-in duration-150">
									<span className={`absolute left-3 top-1/2 -translate-y-1/2 font-bold text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
										₦
									</span>
									<input
										type="number"
										min="500"
										step="500"
										placeholder="Enter custom amount in NGN"
										value={amount}
										onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
										className={`w-full pl-8 pr-3 py-2 text-sm font-mono font-bold rounded-xl border outline-none focus:ring-1 focus:ring-primary ${
											isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
										}`}
									/>
								</div>
							)}
						</div>
					</div>

					{/* Supporter Details */}
					<div className="space-y-2.5">
						<div className="grid grid-cols-2 gap-2.5">
							<input
								type="text"
								placeholder="Your Name (Optional)"
								value={name}
								onChange={(e) => setName(e.target.value)}
								className={`px-3 py-2 text-xs rounded-xl border outline-none focus:ring-1 focus:ring-primary ${
									isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
								}`}
							/>
							<input
								type="email"
								placeholder="Email (for receipt) *"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								className={`px-3 py-2 text-xs rounded-xl border outline-none focus:ring-1 focus:ring-primary ${
									isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
								}`}
							/>
						</div>
						<textarea
							placeholder="Leave a message or feature wish (Optional)..."
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							rows={2}
							className={`w-full px-3 py-2 text-xs rounded-xl border outline-none focus:ring-1 focus:ring-primary resize-none ${
								isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
							}`}
						/>
					</div>

					{/* Action Buttons */}
					<div className="space-y-2 pt-1">
						<button
							onClick={handleDonate}
							disabled={isLoading || amount <= 0}
							className="w-full py-3.5 px-4 font-black text-sm bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600 text-white rounded-xl flex items-center justify-center gap-2.5 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all cursor-pointer disabled:opacity-50"
						>
							{isLoading ? (
								<Loader2 className="w-5 h-5 animate-spin" />
							) : (
								<>
									<Coffee className="w-5 h-5 animate-bounce" />
									<span>Support NetSentry with ₦{amount.toLocaleString()}</span>
									<ArrowRight className="w-4 h-4 ml-auto" />
								</>
							)}
						</button>

						{isTauri && (
							<button
								type="button"
								onClick={() => openInBrowser(`https://netsentry-psi.vercel.app/?donate=true&amount=${amount}`)}
								className={`w-full py-2 text-center text-xs font-semibold rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
									isDark 
										? 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900' 
										: 'border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
								}`}
							>
								<ExternalLink className="w-3.5 h-3.5" />
								<span>Or complete in default browser</span>
							</button>
						)}
					</div>

					{/* Footer Security Badge */}
					<div className={`flex items-center justify-center gap-2 text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
						<Shield className="w-3 h-3 text-emerald-500" />
						<span>Bank-grade 256-bit encryption via Paystack · Direct contribution to NetSentry</span>
					</div>
				</div>
			</div>
		</div>
	);
}
