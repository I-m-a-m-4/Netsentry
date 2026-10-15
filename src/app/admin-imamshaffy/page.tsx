'use client';

import React, { useMemo, useState, useEffect } from 'react';
import CyberShield from '@/components/admin/cyber-shield';
import BroadcastPopupManager from '@/components/admin/broadcast-popup-manager';

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from '@/components/ui/card';
import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	Tooltip as ReTooltip,
	ResponsiveContainer,
} from 'recharts';
import {
	Users,
	Activity,
	Shield,
	ShieldAlert,
	ShieldCheck,
	Download,
	Terminal,
	Bug,
	Radio,
	Server,
	Eye,
	RefreshCw,
	TrendingUp,
	ArrowDown,
	ArrowUp,
	Clock,
	Laptop,
	CheckCircle2,
	AlertTriangle,
	Monitor,
	Wifi,
	Zap,
	Cpu,
	Coffee,
	Heart,
	Repeat,
	CreditCard,
	Check,
	Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AppIcon } from '@/components/desktop/app-icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { useFirestore } from '@/firebase';
import { 
	collection, 
	onSnapshot, 
	query, 
	orderBy, 
	limit 
} from 'firebase/firestore';
import { format, differenceInDays } from 'date-fns';

export default function AdminDashboardPage() {
	const firestore = useFirestore();
	const { toast } = useToast();

	const [activeTab, setActiveTab] = useState('overview');
	const [users, setUsers] = useState<any[]>([]);
	const [downloadClicks, setDownloadClicks] = useState<any[]>([]);
	const [securityLogs, setSecurityLogs] = useState<any[]>([]);
	const [errorLogs, setErrorLogs] = useState<any[]>([]);
	const [desktopDevices, setDesktopDevices] = useState<any[]>([]);
	const [coffeeAttempts, setCoffeeAttempts] = useState<any[]>([]);
	const [selectedUser, setSelectedUser] = useState<any | null>(null);
	const [selectedDevice, setSelectedDevice] = useState<any | null>(null);
	const [selectedCoffee, setSelectedCoffee] = useState<any | null>(null);

	// Fetch genuine telemetry collections from Firestore
	useEffect(() => {
		if (!firestore) return;

		const unsubUsers = onSnapshot(collection(firestore, 'users'), (snap) => {
			setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
		}, () => {});

		const unsubDownloads = onSnapshot(collection(firestore, 'download_clicks'), (snap) => {
			setDownloadClicks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
		}, () => {});

		const unsubSecurity = onSnapshot(
			query(collection(firestore, 'security_logs'), orderBy('timestamp', 'desc'), limit(100)),
			(snap) => {
				setSecurityLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
			},
			() => {}
		);

		const unsubErrors = onSnapshot(
			query(collection(firestore, 'error_logs'), orderBy('createdAt', 'desc'), limit(100)),
			(snap) => {
				setErrorLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
			},
			() => {}
		);

		const unsubDevices = onSnapshot(
			collection(firestore, 'client_devices'),
			(snap) => {
				setDesktopDevices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
			},
			(err) => {
				console.warn('Desktop devices sync error:', err);
			}
		);

		const unsubCoffee = onSnapshot(
			query(collection(firestore, 'coffee_attempts'), orderBy('timestamp', 'desc'), limit(150)),
			(snap) => {
				setCoffeeAttempts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
			},
			(err) => {
				console.warn('Coffee attempts sync error:', err);
			}
		);

		return () => {
			unsubUsers();
			unsubDownloads();
			unsubSecurity();
			unsubErrors();
			unsubDevices();
			unsubCoffee();
		};
	}, [firestore]);

	// Aggregate NetSentry Operational Metrics
	const metrics = useMemo(() => {
		const launchDate = new Date('2026-02-01');
		const daysOnline = Math.max(1, differenceInDays(new Date(), launchDate));

		const totalClients = Math.max(users.length, desktopDevices.length);
		const totalDownloads = downloadClicks.length;
		const totalThreatEvents = securityLogs.length;
		const totalSystemErrors = errorLogs.length;

		const totalDesktopNodes = desktopDevices.length;
		const onlineDesktopNodes = desktopDevices.filter(d => {
			if (!d.updatedAt && !d.lastSeen) return false;
			const time = d.updatedAt ? new Date(d.updatedAt).getTime() : (d.lastSeen?.seconds ? d.lastSeen.seconds * 1000 : 0);
			return (Date.now() - time) < 5 * 60 * 1000;
		}).length;

		const dailyActiveNodes = desktopDevices.filter(d => {
			if (!d.updatedAt && !d.lastSeen) return false;
			const time = d.updatedAt ? new Date(d.updatedAt).getTime() : (d.lastSeen?.seconds ? d.lastSeen.seconds * 1000 : 0);
			return (Date.now() - time) < 24 * 60 * 60 * 1000;
		}).length;

		const monthlyActiveNodes = desktopDevices.filter(d => {
			if (!d.updatedAt && !d.lastSeen) return false;
			const time = d.updatedAt ? new Date(d.updatedAt).getTime() : (d.lastSeen?.seconds ? d.lastSeen.seconds * 1000 : 0);
			return (Date.now() - time) < 30 * 24 * 60 * 60 * 1000;
		}).length;

		const totalFleetTrafficMb = desktopDevices.reduce((acc, d) => acc + (d.totalDataMb || ((d.todayRxMb || 0) + (d.todayTxMb || 0))), 0);
		const meteredDesktopNodes = desktopDevices.filter(d => d.isMetered || d.isWwan).length;
		const focusModeNodes = desktopDevices.filter(d => d.isFocusMode).length;

		const avgEngineMemoryMb = desktopDevices.length > 0
			? (desktopDevices.reduce((acc, d) => acc + (d.engineMemoryMb || 14.8), 0) / desktopDevices.length).toFixed(1)
			: '14.8';

		// User Retention & Visit / Return Frequency
		const totalAppChecks = desktopDevices.reduce((acc, d) => acc + (Number(d.visitCount) || 1), 0);
		const returningUsersCount = desktopDevices.filter(d => (Number(d.visitCount) || 1) > 1).length;
		const retentionRate = desktopDevices.length > 0
			? Math.round((returningUsersCount / desktopDevices.length) * 100)
			: 0;
		const avgVisitsPerUser = desktopDevices.length > 0
			? (totalAppChecks / desktopDevices.length).toFixed(1)
			: '1.0';

		// Coffee & Supporter Insights
		const totalCoffeeAttempts = coffeeAttempts.length;
		const completedCoffeeAttempts = coffeeAttempts.filter(c => c.status === 'completed');
		const completedCoffeeCount = completedCoffeeAttempts.length;
		const totalCoffeeRaised = completedCoffeeAttempts.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
		const totalCoffeePledged = coffeeAttempts.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
		const flutterwaveAttempts = coffeeAttempts.filter(c => c.gateway === 'flutterwave').length;
		const paystackAttempts = coffeeAttempts.filter(c => c.gateway === 'paystack').length;
		const coffeeConversionRate = totalCoffeeAttempts > 0 
			? Math.round((completedCoffeeCount / totalCoffeeAttempts) * 100) 
			: 0;

		return {
			daysOnline,
			totalClients,
			totalDownloads,
			totalThreatEvents,
			totalSystemErrors,
			totalDesktopNodes,
			onlineDesktopNodes,
			dailyActiveNodes,
			monthlyActiveNodes,
			totalFleetTrafficMb,
			meteredDesktopNodes,
			focusModeNodes,
			avgEngineMemoryMb,
			totalAppChecks,
			returningUsersCount,
			retentionRate,
			avgVisitsPerUser,
			totalCoffeeAttempts,
			completedCoffeeCount,
			totalCoffeeRaised,
			totalCoffeePledged,
			flutterwaveAttempts,
			paystackAttempts,
			coffeeConversionRate
		};
	}, [users, downloadClicks, securityLogs, errorLogs, desktopDevices, coffeeAttempts]);

	return (
		<div className="space-y-6 w-full max-w-full">
			{/* Title & Status */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="font-bricolage text-2xl md:text-3xl font-extrabold tracking-tight">
						NetSentry Admin Command
					</h1>
					<p className="text-sm text-muted-foreground">
						Telemetry, user retention, coffee supporters, and client fleet metrics.
					</p>
				</div>

				<div className="flex items-center gap-2">
					<Badge variant="outline" className="border-emerald-500/40 text-emerald-500 text-xs px-3 py-1 flex items-center gap-1.5">
						<span className="w-2 h-2 rounded-md bg-emerald-500 animate-ping" />
						Live Cluster Online
					</Badge>
				</div>
			</div>

			{/* Main Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<div className="border-b border-border/80 pb-1 overflow-x-auto scrollbar-none">
					<TabsList className="bg-transparent h-auto p-0 flex gap-2">
						{[
							{ id: 'overview', label: 'Overview Telemetry', icon: Activity },
							{ id: 'fleet', label: 'Desktop Fleet & Retention', icon: Monitor },
							{ id: 'coffee', label: 'Coffee & Supporters', icon: Coffee },
							{ id: 'clients', label: 'Client Nodes', icon: Users },
							{ id: 'popups', label: 'User Screen Popups', icon: Radio },
							{ id: 'shield', label: 'Cyber Shield & Security', icon: ShieldCheck },
							{ id: 'logs', label: 'Diagnostic Logs', icon: Bug },
						].map(tab => (
							<TabsTrigger
								key={tab.id}
								value={tab.id}
								className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary border border-transparent rounded-md px-4 py-2 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
							>
								<tab.icon className="h-4 w-4" />
								{tab.label}
								{tab.id === 'coffee' && metrics.totalCoffeeAttempts > 0 && (
									<span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-mono">
										{metrics.totalCoffeeAttempts}
									</span>
								)}
							</TabsTrigger>
						))}
					</TabsList>
				</div>

				{/* OVERVIEW TELEMETRY TAB */}
				<TabsContent value="overview" className="space-y-6 pt-4">
					{/* Top Command Stats */}
					<div className="bg-card border border-border rounded-lg p-6 space-y-6">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2.5">
								<div className="p-2 bg-primary/10 text-primary border border-primary/20 rounded-md">
									<ShieldAlert className="w-5 h-5" />
								</div>
								<div>
									<h2 className="font-bricolage text-lg font-bold">Platform Overview Command</h2>
									<p className="text-xs text-muted-foreground">Live operations across all NetSentry desktop and web instances</p>
								</div>
							</div>

							<Badge variant="outline" className="border-primary/40 text-primary text-xs">
								Active Node
							</Badge>
						</div>

						{/* Primary Metric Cards */}
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
							<div 
								onClick={() => setActiveTab('fleet')}
								className="p-4 rounded-md border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 transition-all cursor-pointer space-y-2 group"
							>
								<div className="flex items-center justify-between text-muted-foreground">
									<span className="text-xs font-semibold text-cyan-500">Desktop Fleet</span>
									<Monitor className="w-4 h-4 text-cyan-500 group-hover:scale-110 transition-transform" />
								</div>
								<div className="text-2xl font-black text-cyan-500">{metrics.totalDesktopNodes} Nodes</div>
								<div className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-medium">
									<span className="w-1.5 h-1.5 rounded-md bg-emerald-500 animate-ping" />
									{metrics.onlineDesktopNodes} live streaming
								</div>
							</div>

							<div 
								onClick={() => setActiveTab('fleet')}
								className="p-4 rounded-md border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 transition-all cursor-pointer space-y-2"
							>
								<div className="flex items-center justify-between text-muted-foreground">
									<span className="text-xs font-semibold text-purple-400">User Retention</span>
									<Repeat className="w-4 h-4 text-purple-400" />
								</div>
								<div className="text-2xl font-black text-purple-400">{metrics.retentionRate}%</div>
								<p className="text-[11px] text-muted-foreground">
									{metrics.returningUsersCount} returning ({metrics.totalAppChecks} total app checks)
								</p>
							</div>

							<div 
								onClick={() => setActiveTab('coffee')}
								className="p-4 rounded-md border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-all cursor-pointer space-y-2"
							>
								<div className="flex items-center justify-between text-muted-foreground">
									<span className="text-xs font-semibold text-amber-500">Coffee Supporters</span>
									<Coffee className="w-4 h-4 text-amber-500" />
								</div>
								<div className="text-2xl font-black text-amber-500">{metrics.totalCoffeeAttempts} Attempts</div>
								<p className="text-[11px] text-muted-foreground">
									₦{metrics.totalCoffeeRaised.toLocaleString()} raised ({metrics.completedCoffeeCount} completed)
								</p>
							</div>

							<div 
								onClick={() => setActiveTab('shield')}
								className="p-4 rounded-md border border-border bg-muted/20 hover:bg-muted/30 transition-all cursor-pointer space-y-2"
							>
								<div className="flex items-center justify-between text-muted-foreground">
									<span className="text-xs font-semibold">Threat Signals</span>
									<ShieldAlert className="w-4 h-4 text-amber-500" />
								</div>
								<div className="text-2xl font-black text-amber-500">{metrics.totalThreatEvents}</div>
								<p className="text-[11px] text-muted-foreground">Firewall blocks & anomalies</p>
							</div>

							<div 
								onClick={() => setActiveTab('logs')}
								className="p-4 rounded-md border border-border bg-muted/20 hover:bg-muted/30 transition-all cursor-pointer space-y-2"
							>
								<div className="flex items-center justify-between text-muted-foreground">
									<span className="text-xs font-semibold">Diagnostic Events</span>
									<Bug className="w-4 h-4 text-red-500" />
								</div>
								<div className="text-2xl font-black text-red-500">{metrics.totalSystemErrors}</div>
								<p className="text-[11px] text-muted-foreground">System errors & exceptions</p>
							</div>
						</div>

						{/* Retention & Telemetry Pillars */}
						<div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-1">
							<div className="p-3.5 rounded-md border border-border bg-muted/10 space-y-1">
								<div className="flex items-center justify-between text-muted-foreground text-xs">
									<span>Average Checks Per User</span>
									<Repeat className="w-3.5 h-3.5 text-purple-400" />
								</div>
								<div className="text-xl font-bold text-purple-400 font-mono">
									{metrics.avgVisitsPerUser} <span className="text-xs text-muted-foreground font-normal">checks/device</span>
								</div>
								<p className="text-[10px] text-muted-foreground">Times users returned to check NetHelm</p>
							</div>

							<div className="p-3.5 rounded-md border border-border bg-muted/10 space-y-1">
								<div className="flex items-center justify-between text-muted-foreground text-xs">
									<span>Fleet Traffic Monitored</span>
									<Activity className="w-3.5 h-3.5 text-blue-500" />
								</div>
								<div className="text-xl font-bold text-foreground font-mono">
									{metrics.totalFleetTrafficMb >= 1024 
										? `${(metrics.totalFleetTrafficMb / 1024).toFixed(2)} GB` 
										: `${metrics.totalFleetTrafficMb.toFixed(1)} MB`}
								</div>
								<p className="text-[10px] text-muted-foreground">Cumulative monitored data transfer</p>
							</div>

							<div className="p-3.5 rounded-md border border-border bg-muted/10 space-y-1">
								<div className="flex items-center justify-between text-muted-foreground text-xs">
									<span>Payment Gateways</span>
									<CreditCard className="w-3.5 h-3.5 text-amber-500" />
								</div>
								<div className="text-xl font-bold text-foreground font-mono">
									{metrics.flutterwaveAttempts} FW <span className="text-xs text-muted-foreground font-normal">/ {metrics.paystackAttempts} PS</span>
								</div>
								<p className="text-[10px] text-muted-foreground">Flutterwave vs Paystack coffee clicks</p>
							</div>

							<div className="p-3.5 rounded-md border border-border bg-muted/10 space-y-1">
								<div className="flex items-center justify-between text-muted-foreground text-xs">
									<span>Engine RAM Overhead</span>
									<Cpu className="w-3.5 h-3.5 text-emerald-500" />
								</div>
								<div className="text-xl font-bold text-emerald-500 font-mono">
									~{metrics.avgEngineMemoryMb} MB
								</div>
								<p className="text-[10px] text-muted-foreground">Average Rust process footprint</p>
							</div>
						</div>
					</div>
				</TabsContent>

				{/* DESKTOP FLEET & RETENTION TAB */}
				<TabsContent value="fleet" className="space-y-4 pt-4">
					<Card className="bg-card border border-border rounded-lg">
						<CardHeader className="flex flex-row items-center justify-between pb-4">
							<div>
								<CardTitle className="text-base font-bold flex items-center gap-2">
									<Monitor className="w-4 h-4 text-cyan-500" />
									Active Desktop Fleet Nodes & Return Frequency
								</CardTitle>
								<CardDescription className="text-xs">
									Inspect how many times each individual user has returned to check the app and their live bandwidth usage.
								</CardDescription>
							</div>
							<Badge variant="outline" className="text-cyan-500 border-cyan-500/40 text-xs">
								{desktopDevices.length} Hardware Nodes Synced
							</Badge>
						</CardHeader>
						<CardContent className="p-0">
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow className="border-border">
											<TableHead>Device / Hostname</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Times Returned (Checks)</TableHead>
											<TableHead>Live Rates</TableHead>
											<TableHead>Today's Traffic</TableHead>
											<TableHead>Sockets</TableHead>
											<TableHead>Network</TableHead>
											<TableHead>Last Pulse</TableHead>
											<TableHead className="text-right">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{desktopDevices.map((dev) => {
											const time = dev.updatedAt 
												? new Date(dev.updatedAt).getTime() 
												: (dev.lastSeen?.seconds ? dev.lastSeen.seconds * 1000 : 0);
											const isOnline = time > 0 && (Date.now() - time) < 5 * 60 * 1000;
											const todayMb = (dev.todayRxMb || 0) + (dev.todayTxMb || 0);
											const visits = Number(dev.visitCount) || 1;

											return (
												<TableRow key={dev.id} className="hover:bg-muted/30 border-border">
													<TableCell>
														<div className="flex items-center gap-2.5">
															<div className="p-2 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-500">
																<Monitor className="w-4 h-4" />
															</div>
															<div>
																<div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
																	{dev.deviceName || 'Windows PC'}
																</div>
																<div className="text-[10px] font-mono text-muted-foreground">
																	{dev.deviceId || dev.id}
																</div>
															</div>
														</div>
													</TableCell>
													<TableCell>
														{isOnline ? (
															<Badge variant="outline" className="border-emerald-500/40 text-emerald-500 text-[10px] flex items-center gap-1 w-fit">
																<span className="w-1.5 h-1.5 rounded-md bg-emerald-500 animate-ping" />
																Online
															</Badge>
														) : (
															<Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground text-[10px] w-fit">
																Offline
															</Badge>
														)}
													</TableCell>
													<TableCell>
														<div className="space-y-0.5">
															<div className="flex items-center gap-1.5">
																{visits >= 10 ? (
																	<Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-bold">
																		🔥 {visits} Checks (Loyal)
																	</Badge>
																) : visits >= 3 ? (
																	<Badge variant="outline" className="border-purple-500/40 text-purple-400 text-[10px] font-semibold">
																		{visits} Checks (Returning)
																	</Badge>
																) : (
																	<Badge variant="outline" className="text-[10px] text-muted-foreground">
																		1st Check
																	</Badge>
																)}
															</div>
															{dev.firstSeenAt && (
																<div className="text-[9px] text-muted-foreground">
																	Since {format(new Date(dev.firstSeenAt), 'MMM d, yyyy')}
																</div>
															)}
														</div>
													</TableCell>
													<TableCell>
														<div className="text-xs space-y-0.5 font-mono">
															<div className="text-emerald-500 flex items-center gap-1 text-[11px]">
																<ArrowDown className="w-3 h-3" />
																{(dev.inboundRateKbps || 0).toFixed(1)} KB/s
															</div>
															<div className="text-blue-500 flex items-center gap-1 text-[11px]">
																<ArrowUp className="w-3 h-3" />
																{(dev.outboundRateKbps || 0).toFixed(1)} KB/s
															</div>
														</div>
													</TableCell>
													<TableCell className="font-mono text-xs">
														<div className="font-bold">
															{todayMb >= 1024 ? `${(todayMb / 1024).toFixed(2)} GB` : `${todayMb.toFixed(1)} MB`}
														</div>
														<div className="text-[10px] text-muted-foreground">
															↓ {(dev.todayRxMb || 0).toFixed(1)} MB | ↑ {(dev.todayTxMb || 0).toFixed(1)} MB
														</div>
													</TableCell>
													<TableCell className="font-mono text-xs">
														<Badge variant="outline" className="text-[10px]">
															{dev.activeSockets || 0} sockets
														</Badge>
													</TableCell>
													<TableCell>
														<div className="flex flex-wrap gap-1">
															{dev.isMetered && (
																<Badge variant="destructive" className="text-[9px] py-0 px-1.5">
																	Metered
																</Badge>
															)}
															{dev.isWwan && (
																<Badge variant="outline" className="border-amber-500 text-amber-500 text-[9px] py-0 px-1.5">
																	WWAN
																</Badge>
															)}
															{dev.isDataSaverMode && (
																<Badge variant="secondary" className="text-[9px] py-0 px-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
																	Data Saver
																</Badge>
															)}
															{!dev.isMetered && !dev.isWwan && (
																<Badge variant="outline" className="text-[9px] py-0 px-1.5">
																	LAN
																</Badge>
															)}
														</div>
													</TableCell>
													<TableCell className="text-xs text-muted-foreground">
														{time > 0 ? format(new Date(time), 'PP p') : 'Never'}
													</TableCell>
													<TableCell className="text-right">
														<Button 
															variant="ghost" 
															size="sm" 
															onClick={() => setSelectedDevice(dev)}
															className="h-8 px-2.5 text-xs text-primary hover:text-primary hover:bg-primary/10 cursor-pointer"
														>
															<Eye className="w-3.5 h-3.5 mr-1" /> Telemetry
														</Button>
													</TableCell>
												</TableRow>
											);
										})}

										{desktopDevices.length === 0 && (
											<TableRow>
												<TableCell colSpan={9} className="text-center py-12 text-muted-foreground text-xs">
													<div className="max-w-sm mx-auto space-y-2">
														<Monitor className="w-8 h-8 text-muted-foreground/50 mx-auto" />
														<p className="font-semibold text-foreground">No desktop devices synced yet</p>
														<p className="text-[11px] text-muted-foreground">
															When users launch NetSentry Desktop v2.0, telemetry and return visit counters will automatically sync here.
														</p>
													</div>
												</TableCell>
											</TableRow>
										)}
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* COFFEE & SUPPORTERS TAB */}
				<TabsContent value="coffee" className="space-y-4 pt-4">
					{/* KPI Cards */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						<div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1">
							<div className="flex items-center justify-between text-muted-foreground text-xs">
								<span className="font-semibold text-amber-500">Total Coffee Attempts</span>
								<Coffee className="w-4 h-4 text-amber-500" />
							</div>
							<div className="text-2xl font-black text-amber-500 font-mono">
								{metrics.totalCoffeeAttempts}
							</div>
							<p className="text-[11px] text-muted-foreground">Supporters who opened & submitted coffee modal</p>
						</div>

						<div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-1">
							<div className="flex items-center justify-between text-muted-foreground text-xs">
								<span className="font-semibold text-emerald-500">Completed Contributions</span>
								<Heart className="w-4 h-4 text-emerald-500 fill-emerald-500" />
							</div>
							<div className="text-2xl font-black text-emerald-500 font-mono">
								₦{metrics.totalCoffeeRaised.toLocaleString()}
							</div>
							<p className="text-[11px] text-muted-foreground">{metrics.completedCoffeeCount} successful coffee donations</p>
						</div>

						<div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 space-y-1">
							<div className="flex items-center justify-between text-muted-foreground text-xs">
								<span className="font-semibold text-purple-400">Total Pledged / Initiated</span>
								<Sparkles className="w-4 h-4 text-purple-400" />
							</div>
							<div className="text-2xl font-black text-purple-400 font-mono">
								₦{metrics.totalCoffeePledged.toLocaleString()}
							</div>
							<p className="text-[11px] text-muted-foreground">Gross amount entered across all attempts</p>
						</div>

						<div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-1">
							<div className="flex items-center justify-between text-muted-foreground text-xs">
								<span className="font-semibold text-blue-500">Gateway Breakdown</span>
								<CreditCard className="w-4 h-4 text-blue-500" />
							</div>
							<div className="text-xl font-black text-foreground font-mono">
								{metrics.flutterwaveAttempts} FW <span className="text-xs text-muted-foreground font-normal">/ {metrics.paystackAttempts} PS</span>
							</div>
							<p className="text-[11px] text-muted-foreground">Flutterwave vs Paystack checkout attempts</p>
						</div>
					</div>

					{/* Supporters List */}
					<Card className="bg-card border border-border rounded-lg">
						<CardHeader className="flex flex-row items-center justify-between pb-4">
							<div>
								<CardTitle className="text-base font-bold flex items-center gap-2">
									<Coffee className="w-4 h-4 text-amber-500" />
									People Who Attempted to Buy You Coffee
								</CardTitle>
								<CardDescription className="text-xs">
									Real-time record of all users who clicked "Buy Us a Coffee", entered details, or completed transactions.
								</CardDescription>
							</div>
							<Badge variant="outline" className="border-amber-500/30 text-amber-500 text-xs">
								{coffeeAttempts.length} Records
							</Badge>
						</CardHeader>
						<CardContent className="p-0">
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow className="border-border">
											<TableHead>Supporter Name & Email</TableHead>
											<TableHead>Amount</TableHead>
											<TableHead>Gateway</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Platform</TableHead>
											<TableHead>Device ID</TableHead>
											<TableHead>Date / Time</TableHead>
											<TableHead className="text-right">Details</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{coffeeAttempts.map((attempt) => {
											const isCompleted = attempt.status === 'completed';
											const isCancelled = attempt.status === 'cancelled';
											const isFailed = attempt.status === 'failed';

											const time = attempt.timestamp?.seconds 
												? attempt.timestamp.seconds * 1000 
												: (attempt.isoTime ? new Date(attempt.isoTime).getTime() : 0);

											return (
												<TableRow key={attempt.id} className="hover:bg-muted/30 border-border">
													<TableCell>
														<div className="flex items-center gap-2">
															<div className="p-1.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
																<Coffee className="w-3.5 h-3.5" />
															</div>
															<div>
																<div className="font-semibold text-xs text-foreground">
																	{attempt.supporterName || 'Generous Supporter'}
																</div>
																<div className="text-[10px] text-muted-foreground font-mono">
																	{attempt.email || 'Anonymous'}
																</div>
															</div>
														</div>
													</TableCell>
													<TableCell className="font-mono font-bold text-xs text-foreground">
														₦{Number(attempt.amount || 0).toLocaleString()}
													</TableCell>
													<TableCell>
														{attempt.gateway === 'flutterwave' ? (
															<Badge variant="outline" className="border-amber-500/40 text-amber-500 bg-amber-500/5 text-[10px] flex items-center gap-1 w-fit">
																<Zap className="w-3 h-3" /> Flutterwave
															</Badge>
														) : (
															<Badge variant="outline" className="border-emerald-500/40 text-emerald-500 bg-emerald-500/5 text-[10px] flex items-center gap-1 w-fit">
																<CreditCard className="w-3 h-3" /> Paystack
															</Badge>
														)}
													</TableCell>
													<TableCell>
														{isCompleted ? (
															<Badge className="bg-emerald-500 text-white text-[10px] flex items-center gap-1 w-fit font-bold">
																<Check className="w-3 h-3" /> Completed
															</Badge>
														) : isCancelled ? (
															<Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground text-[10px] w-fit">
																Cancelled
															</Badge>
														) : isFailed ? (
															<Badge variant="destructive" className="text-[10px] w-fit">
																Failed
															</Badge>
														) : (
															<Badge variant="outline" className="border-amber-500/50 text-amber-500 bg-amber-500/10 text-[10px] w-fit font-semibold">
																Initiated
															</Badge>
														)}
													</TableCell>
													<TableCell className="text-xs text-muted-foreground">
														{attempt.platform || 'Desktop App'}
													</TableCell>
													<TableCell className="text-[10px] font-mono text-muted-foreground truncate max-w-[120px]">
														{attempt.deviceId || '—'}
													</TableCell>
													<TableCell className="text-xs text-muted-foreground">
														{time > 0 ? format(new Date(time), 'PP p') : 'Recently'}
													</TableCell>
													<TableCell className="text-right">
														<Button 
															variant="ghost" 
															size="sm" 
															onClick={() => setSelectedCoffee(attempt)}
															className="h-7 px-2 text-xs text-primary cursor-pointer"
														>
															<Eye className="w-3 h-3 mr-1" /> View
														</Button>
													</TableCell>
												</TableRow>
											);
										})}

										{coffeeAttempts.length === 0 && (
											<TableRow>
												<TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-xs">
													<div className="max-w-sm mx-auto space-y-2">
														<Coffee className="w-8 h-8 text-amber-500/40 mx-auto" />
														<p className="font-semibold text-foreground">No coffee purchase attempts yet</p>
														<p className="text-[11px] text-muted-foreground">
															When users open the "Buy Us a Coffee" button in the app or website, their attempts and transactions will appear here in real time.
														</p>
													</div>
												</TableCell>
											</TableRow>
										)}
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* CLIENT NODES TAB */}
				<TabsContent value="clients" className="space-y-4 pt-4">
					<Card className="bg-card border border-border rounded-lg">
						<CardHeader className="flex flex-row items-center justify-between pb-4">
							<div>
								<CardTitle className="text-base font-bold">Client Nodes Directory</CardTitle>
								<CardDescription className="text-xs">Live and registered NetSentry instance sessions</CardDescription>
							</div>
						</CardHeader>
						<CardContent className="p-0">
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow className="border-border">
											<TableHead>Node ID / User</TableHead>
											<TableHead>Auth Type</TableHead>
											<TableHead>Role</TableHead>
											<TableHead>Registered</TableHead>
											<TableHead className="text-right">Inspect</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{users.map((u) => (
											<TableRow key={u.id} className="hover:bg-muted/30 border-border">
												<TableCell className="font-semibold font-mono text-xs">
													{u.name || u.email || u.id.slice(0, 12) + '...'}
												</TableCell>
												<TableCell>
													<Badge variant="outline" className="text-[10px]">
														{u.isAnonymous ? 'Anonymous' : (u.email ? 'Authenticated' : 'Session Node')}
													</Badge>
												</TableCell>
												<TableCell>
													<Badge variant="secondary" className="capitalize text-[10px]">
														{u.role || 'Client'}
													</Badge>
												</TableCell>
												<TableCell className="text-xs text-muted-foreground">
													{u.createdAt ? format(new Date(u.createdAt.seconds ? u.createdAt.seconds * 1000 : u.createdAt), 'PP') : 'Live Node'}
												</TableCell>
												<TableCell className="text-right">
													<Button 
														variant="ghost" 
														size="sm" 
														onClick={() => setSelectedUser(u)}
														className="h-8 px-2 text-xs text-primary"
													>
														<Eye className="w-3.5 h-3.5 mr-1" /> View Details
													</Button>
												</TableCell>
											</TableRow>
										))}
										{users.length === 0 && (
											<TableRow>
												<TableCell colSpan={5} className="text-center py-10 text-muted-foreground text-xs">
													No client nodes registered yet.
												</TableCell>
											</TableRow>
										)}
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* CYBER SHIELD TAB */}
				<TabsContent value="shield" className="space-y-4 pt-4">
					<CyberShield allBusinesses={[]} allUsers={users} isLoadingBusinesses={false} />
				</TabsContent>

				{/* DIAGNOSTIC LOGS TAB */}
				<TabsContent value="logs" className="space-y-4 pt-4">
					<Card className="bg-card border border-border rounded-lg">
						<CardHeader>
							<CardTitle className="text-base font-bold flex items-center gap-2">
								<Bug className="w-4 h-4 text-red-500" />
								Live System & Error Logs
							</CardTitle>
							<CardDescription className="text-xs">
								Real-time exception tracking and anomalous telemetry captured from clients
							</CardDescription>
						</CardHeader>
						<CardContent className="p-0">
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow className="border-border">
											<TableHead>Type</TableHead>
											<TableHead>Message</TableHead>
											<TableHead>Time</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{errorLogs.map((log) => (
											<TableRow key={log.id} className="hover:bg-muted/30 border-border">
												<TableCell>
													<Badge variant={log.type === 'anomaly' ? 'destructive' : 'outline'} className="text-[10px]">
														{log.type || 'Error'}
													</Badge>
												</TableCell>
												<TableCell className="font-mono text-xs text-foreground max-w-md truncate">
													{log.message || log.errorMessage || 'System error recorded.'}
												</TableCell>
												<TableCell className="text-xs text-muted-foreground">
													{log.createdAt ? format(new Date(log.createdAt.seconds ? log.createdAt.seconds * 1000 : log.createdAt), 'PP p') : 'Just now'}
												</TableCell>
											</TableRow>
										))}
										{errorLogs.length === 0 && (
											<TableRow>
												<TableCell colSpan={3} className="text-center py-10 text-muted-foreground text-xs">
													No errors or anomaly logs recorded. System healthy.
												</TableCell>
											</TableRow>
										)}
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* USER SCREEN POPUPS TAB */}
				<TabsContent value="popups" className="space-y-6 pt-4">
					<BroadcastPopupManager />
				</TabsContent>
			</Tabs>

			{/* Coffee Detail Dialog */}
			{selectedCoffee && (
				<Dialog open={!!selectedCoffee} onOpenChange={() => setSelectedCoffee(null)}>
					<DialogContent className="max-w-md">
						<DialogHeader>
							<div className="flex items-center gap-2.5">
								<div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
									<Coffee className="w-5 h-5" />
								</div>
								<div>
									<DialogTitle className="text-base font-bold">Coffee Donation Attempt</DialogTitle>
									<DialogDescription className="text-xs">
										Reference: {selectedCoffee.reference || selectedCoffee.id}
									</DialogDescription>
								</div>
							</div>
						</DialogHeader>
						<div className="space-y-3 py-2 text-xs">
							<div className="flex justify-between border-b pb-2">
								<span className="text-muted-foreground">Supporter Name:</span>
								<span className="font-bold text-foreground">{selectedCoffee.supporterName || 'Generous Supporter'}</span>
							</div>
							<div className="flex justify-between border-b pb-2">
								<span className="text-muted-foreground">Email:</span>
								<span className="font-mono">{selectedCoffee.email || 'None provided'}</span>
							</div>
							<div className="flex justify-between border-b pb-2">
								<span className="text-muted-foreground">Amount:</span>
								<span className="font-bold font-mono text-emerald-500 text-sm">₦{Number(selectedCoffee.amount || 0).toLocaleString()}</span>
							</div>
							<div className="flex justify-between border-b pb-2">
								<span className="text-muted-foreground">Gateway:</span>
								<span className="capitalize font-semibold">{selectedCoffee.gateway || 'Flutterwave'}</span>
							</div>
							<div className="flex justify-between border-b pb-2">
								<span className="text-muted-foreground">Status:</span>
								<Badge className="capitalize text-[10px]">{selectedCoffee.status || 'Initiated'}</Badge>
							</div>
							<div className="flex justify-between border-b pb-2">
								<span className="text-muted-foreground">Device ID:</span>
								<span className="font-mono text-[10px] text-muted-foreground">{selectedCoffee.deviceId || '—'}</span>
							</div>
							<div className="flex justify-between border-b pb-2">
								<span className="text-muted-foreground">Platform:</span>
								<span>{selectedCoffee.platform || 'Windows Desktop'}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Attempt Time:</span>
								<span>{selectedCoffee.isoTime ? new Date(selectedCoffee.isoTime).toLocaleString() : 'Just now'}</span>
							</div>
						</div>
					</DialogContent>
				</Dialog>
			)}

			{/* Node Detail Dialog */}
			{selectedUser && (
				<Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
					<DialogContent className="max-w-md">
						<DialogHeader>
							<DialogTitle>Client Node Details</DialogTitle>
							<DialogDescription>{selectedUser.id}</DialogDescription>
						</DialogHeader>
						<div className="space-y-3 py-2 text-sm">
							<div className="flex justify-between border-b pb-2">
								<span className="text-muted-foreground">Node ID:</span>
								<span className="font-mono text-xs">{selectedUser.id}</span>
							</div>
							<div className="flex justify-between border-b pb-2">
								<span className="text-muted-foreground">Type:</span>
								<span className="capitalize font-semibold">{selectedUser.isAnonymous ? 'Anonymous Client' : (selectedUser.email || 'Client Node')}</span>
							</div>
							<div className="flex justify-between border-b pb-2">
								<span className="text-muted-foreground">Role:</span>
								<Badge variant="outline" className="text-[10px]">{selectedUser.role || 'Client'}</Badge>
							</div>
						</div>
					</DialogContent>
				</Dialog>
			)}

			{/* Desktop Device Detail Dialog */}
			{selectedDevice && (
				<Dialog open={!!selectedDevice} onOpenChange={() => setSelectedDevice(null)}>
					<DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
						<DialogHeader>
							<div className="flex items-center gap-3">
								<div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 rounded-md">
									<Monitor className="w-5 h-5" />
								</div>
								<div>
									<DialogTitle className="text-lg font-bold">
										{selectedDevice.deviceName || 'Windows PC'}
									</DialogTitle>
									<DialogDescription className="font-mono text-xs text-muted-foreground">
										Hardware ID: {selectedDevice.deviceId || selectedDevice.id}
									</DialogDescription>
								</div>
							</div>
						</DialogHeader>

						<div className="space-y-5 py-2 text-sm">
							{/* Device Quick Stats */}
							<div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
								<div className="p-3 rounded-md border border-border bg-muted/20 space-y-1">
									<div className="text-[10px] uppercase font-semibold text-muted-foreground">Today's Data</div>
									<div className="text-base font-black text-foreground">
										{((selectedDevice.todayRxMb || 0) + (selectedDevice.todayTxMb || 0)) >= 1024 
											? `${(((selectedDevice.todayRxMb || 0) + (selectedDevice.todayTxMb || 0)) / 1024).toFixed(2)} GB` 
											: `${((selectedDevice.todayRxMb || 0) + (selectedDevice.todayTxMb || 0)).toFixed(1)} MB`}
									</div>
									<div className="text-[10px] text-muted-foreground">
										↓ {(selectedDevice.todayRxMb || 0).toFixed(1)} | ↑ {(selectedDevice.todayTxMb || 0).toFixed(1)} MB
									</div>
								</div>

								<div className="p-3 rounded-md border border-border bg-muted/20 space-y-1">
									<div className="text-[10px] uppercase font-semibold text-purple-400">Times Returned</div>
									<div className="text-base font-black text-purple-400 font-mono">
										{selectedDevice.visitCount || 1} <span className="text-[10px] text-muted-foreground font-normal">checks</span>
									</div>
									<div className="text-[10px] text-muted-foreground">
										{Number(selectedDevice.visitCount) >= 10 ? '🔥 Highly Loyal' : (Number(selectedDevice.visitCount) > 1 ? 'Returning User' : 'New User')}
									</div>
								</div>

								<div className="p-3 rounded-md border border-border bg-muted/20 space-y-1">
									<div className="text-[10px] uppercase font-semibold text-muted-foreground">Active Sockets</div>
									<div className="text-base font-black text-foreground">
										{selectedDevice.activeSockets || 0}
									</div>
									<div className="text-[10px] text-muted-foreground">
										{selectedDevice.activeProcesses || 0} processes
									</div>
								</div>

								<div className="p-3 rounded-md border border-border bg-muted/20 space-y-1">
									<div className="text-[10px] uppercase font-semibold text-muted-foreground">Data Mode</div>
									<div className="text-base font-black text-foreground">
										{selectedDevice.isMetered ? (
											<span className="text-red-500">Metered</span>
										) : (
											<span className="text-emerald-500">Unmetered</span>
										)}
									</div>
									<div className="text-[10px] text-muted-foreground">
										{selectedDevice.isDataSaverMode ? 'Data Saver Active' : 'Standard'}
									</div>
								</div>
							</div>

							{/* Top Consuming Applications */}
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
										Top Consuming Applications on Host
									</h3>
									<Badge variant="outline" className="text-[10px]">
										{(selectedDevice.topApps || []).length} Reported
									</Badge>
								</div>

								<div className="space-y-2 max-h-64 overflow-y-auto pr-1">
									{(selectedDevice.topApps || []).map((app: any, idx: number) => {
										const totalDevMb = Math.max(1, (selectedDevice.todayRxMb || 0) + (selectedDevice.todayTxMb || 0));
										const appPct = Math.min(100, Math.max(1, Math.round(((app.totalMb || 0) / totalDevMb) * 100)));

										return (
											<div key={idx} className="p-3 rounded-md border border-border bg-muted/10 space-y-2">
												<div className="flex items-center justify-between">
													<div className="flex items-center gap-2.5">
														<AppIcon name={app.name} iconUrl={app.icon} />
														<div>
															<div className="font-semibold text-xs text-foreground">
																{app.label || app.name}
															</div>
															<div className="text-[10px] text-muted-foreground">
																<Badge variant="outline" className="text-[9px] py-0 px-1 mr-1.5">
																	{app.category || 'Application'}
																</Badge>
																{app.sockets || 0} sockets
															</div>
														</div>
													</div>
													<div className="text-right font-mono">
														<div className="font-bold text-xs">
															{(app.totalMb || 0) >= 1024 
																? `${((app.totalMb || 0) / 1024).toFixed(2)} GB` 
																: `${(app.totalMb || 0).toFixed(1)} MB`}
														</div>
														<div className="text-[10px] text-muted-foreground">
															{appPct}% of today
														</div>
													</div>
												</div>
												<Progress value={appPct} className="h-1.5 bg-muted" />
											</div>
										);
									})}

									{(!selectedDevice.topApps || selectedDevice.topApps.length === 0) && (
										<div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-md">
											No app breakdown telemetry reported yet from this device.
										</div>
									)}
								</div>
							</div>

							{/* Hardware, Retention & Network Properties */}
							<div className="border-t border-border pt-3 space-y-2 text-xs">
								<div className="flex justify-between">
									<span className="text-muted-foreground">First Checked In:</span>
									<span className="font-mono text-muted-foreground">
										{selectedDevice.firstSeenAt ? format(new Date(selectedDevice.firstSeenAt), 'PP p') : 'Unknown'}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Total Visit Frequency:</span>
									<span className="font-bold text-purple-400 font-mono">
										{selectedDevice.visitCount || 1} return visits recorded
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Client Version:</span>
									<Badge variant="secondary" className="text-[10px]">
										{selectedDevice.clientVersion || 'v2.0.0'} (Tauri + Rust)
									</Badge>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">WWAN Cellular Roaming:</span>
									<span className="font-semibold">{selectedDevice.isWwan ? 'Active' : 'Disabled / LAN'}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Data Saver Mode:</span>
									<span className="font-semibold">{selectedDevice.isDataSaverMode ? 'Enabled' : 'Disabled'}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Last Telemetry Heartbeat:</span>
									<span className="font-mono text-muted-foreground">
										{selectedDevice.updatedAt ? new Date(selectedDevice.updatedAt).toLocaleString() : 'Just now'}
									</span>
								</div>
							</div>
						</div>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
}
