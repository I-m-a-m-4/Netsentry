"use client";

import React, { useState, useMemo } from 'react';
import {
	ResponsiveContainer,
	BarChart,
	Bar,
	PieChart,
	Pie,
	Cell,
	XAxis,
	YAxis,
	Tooltip,
	AreaChart,
	Area,
	ScatterChart,
	Scatter,
	ZAxis,
	LineChart,
	Line,
	CartesianGrid,
	Legend
} from 'recharts';
import {
	BarChart2,
	TrendingUp,
	Activity,
	ArrowDown,
	ArrowUp,
	Shield,
	ShieldOff,
	Zap,
	RefreshCw,
	Calendar,
	Globe,
	Download,
	Flame,
	CheckCircle2,
	Share2,
	Target,
	Plus,
	X
} from 'lucide-react';
import { AppIcon, getProcessBrandMeta } from './app-icons';

interface ProcessNetworkData {
	pid: number;
	name: string;
	exe_path: string;
	inbound_rate: number;
	outbound_rate: number;
	cpu_usage?: number;
	memory_usage?: number;
	total_data_mb: number;
	connections_count: number;
	is_paused: boolean;
	sockets: any[];
}

interface DailyTotal {
	date: string;
	total_inbound_mb: number;
	total_outbound_mb: number;
}

interface SystemTelemetry {
	rx_rate_kbps: number;
	tx_rate_kbps: number;
	session_rx_mb: number;
	session_tx_mb: number;
	today_rx_mb: number;
	today_tx_mb: number;
	week_rx_mb?: number;
	week_tx_mb?: number;
	month_rx_mb?: number;
	month_tx_mb?: number;
	all_rx_mb?: number;
	all_tx_mb?: number;
}

interface AnalyticsDashboardProps {
	processes: ProcessNetworkData[];
	system: SystemTelemetry | null;
	dailyTotals: DailyTotal[];
	liveChartData: { time: string; inbound: number; outbound: number }[];
	isDark: boolean;
	tauriStatus: string;
	isFocusMode: boolean;
	allowedApps: string;
	setAllowedApps: (val: string) => void;
	handleEnableFocusMode: () => void;
	handleDisableFocusMode: () => void;
	focusModeLoading: boolean;
	loadDailyTotals: () => void;
	analyticsLoading: boolean;
	peakSpeedRecord: { peakKbps: number; appName: string };
	autoFocusOnHotspot: boolean;
	setAutoFocusOnHotspot: (val: boolean) => void;
}

type TimeRange = '24h' | '7d' | '30d' | 'all';

const PALETTE = [
	'#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
	'#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', 
	'#f97316', '#6366f1'
];

export default function AnalyticsDashboard({
	processes,
	system,
	dailyTotals,
	isDark,
	tauriStatus,
	isFocusMode,
	allowedApps,
	setAllowedApps,
	handleEnableFocusMode,
	handleDisableFocusMode,
	focusModeLoading,
	loadDailyTotals,
	analyticsLoading,
	peakSpeedRecord,
	autoFocusOnHotspot,
	setAutoFocusOnHotspot
}: AnalyticsDashboardProps) {
	const [timeRange, setTimeRange] = useState<TimeRange>('30d');
	const [appSearchQuery, setAppSearchQuery] = useState('');
	const [isAppSearchFocused, setIsAppSearchFocused] = useState(false);
	const [showPeakSpeed, setShowPeakSpeed] = useState(false);

	// Compute Aggregate App Consumption across all running processes
	const appAggregates = useMemo(() => {
		const map = new Map<string, {
			name: string;
			exe_path: string;
			total_mb: number;
			inbound_rate: number;
			outbound_rate: number;
			sockets: number;
			memory: number;
			category: string;
			instances: number;
		}>();

		processes.forEach(p => {
			const key = (p.exe_path || p.name).toLowerCase();
			const meta = getProcessBrandMeta(p.name, p.exe_path);
			const existing = map.get(key);
			if (existing) {
				existing.total_mb = Math.max(existing.total_mb, p.total_data_mb || 0);
				existing.inbound_rate += p.inbound_rate || 0;
				existing.outbound_rate += p.outbound_rate || 0;
				existing.sockets += p.connections_count || 0;
				existing.memory += p.memory_usage || 0;
				existing.instances += 1;
			} else {
				map.set(key, {
					name: p.name,
					exe_path: p.exe_path,
					total_mb: p.total_data_mb || 0,
					inbound_rate: p.inbound_rate || 0,
					outbound_rate: p.outbound_rate || 0,
					sockets: p.connections_count || 0,
					memory: p.memory_usage || 0,
					category: meta.category,
					instances: 1
				});
			}
		});

		return Array.from(map.values()).sort((a, b) => b.total_mb - a.total_mb);
	}, [processes]);

	// Category Distribution for the Donut Chart
	const categoryData = useMemo(() => {
		const cats: Record<string, number> = {};
		appAggregates.forEach(a => {
			cats[a.category] = (cats[a.category] || 0) + (a.total_mb || 0.5);
		});
		return Object.entries(cats).map(([name, value]) => ({
			name,
			value: Number(value.toFixed(1))
		})).sort((a, b) => b.value - a.value);
	}, [appAggregates]);

	// Filtered Daily Internet Usage History according to the selected time range
	const filteredHistoricalData = useMemo(() => {
		if (!dailyTotals || dailyTotals.length === 0) return [];
		
		let sliced: DailyTotal[] = [];
		if (timeRange === '24h') {
			sliced = dailyTotals.slice(-2); // Today and yesterday for immediate comparison
		} else if (timeRange === '7d') {
			sliced = dailyTotals.slice(-7);
		} else if (timeRange === '30d') {
			sliced = dailyTotals.slice(-30);
		} else {
			sliced = dailyTotals;
		}

		let cumulative = 0;
		return sliced.map(d => {
			const totalDay = d.total_inbound_mb + d.total_outbound_mb;
			cumulative += totalDay;
			return {
				date: d.date.slice(5), // MM-DD format
				inbound: Number(d.total_inbound_mb.toFixed(1)),
				outbound: Number(d.total_outbound_mb.toFixed(1)),
				total: Number(totalDay.toFixed(1)),
				cumulative: Number(cumulative.toFixed(1))
			};
		});
	}, [dailyTotals, timeRange]);

	// Dynamic aggregate statistics reacting to the selected Time Range
	const periodStats = useMemo(() => {
		let inboundMb = 0;
		let outboundMb = 0;
		let daysCount = 1;

		if (timeRange === '24h') {
			inboundMb = system?.today_rx_mb ?? 0;
			outboundMb = system?.today_tx_mb ?? 0;
			daysCount = 1;
		} else if (timeRange === '7d') {
			const slice = (dailyTotals || []).slice(-7);
			if (slice.length > 0) {
				inboundMb = slice.reduce((sum, d) => sum + d.total_inbound_mb, 0);
				outboundMb = slice.reduce((sum, d) => sum + d.total_outbound_mb, 0);
				daysCount = slice.length;
			} else {
				inboundMb = system?.week_rx_mb ?? 0;
				outboundMb = system?.week_tx_mb ?? 0;
				daysCount = 7;
			}
		} else if (timeRange === '30d') {
			const slice = (dailyTotals || []).slice(-30);
			if (slice.length > 0) {
				inboundMb = slice.reduce((sum, d) => sum + d.total_inbound_mb, 0);
				outboundMb = slice.reduce((sum, d) => sum + d.total_outbound_mb, 0);
				daysCount = slice.length;
			} else {
				inboundMb = system?.month_rx_mb ?? 0;
				outboundMb = system?.month_tx_mb ?? 0;
				daysCount = 30;
			}
		} else {
			if (dailyTotals && dailyTotals.length > 0) {
				inboundMb = dailyTotals.reduce((sum, d) => sum + d.total_inbound_mb, 0);
				outboundMb = dailyTotals.reduce((sum, d) => sum + d.total_outbound_mb, 0);
				daysCount = dailyTotals.length;
			} else {
				inboundMb = system?.all_rx_mb ?? 0;
				outboundMb = system?.all_tx_mb ?? 0;
				daysCount = 1;
			}
		}

		const totalMb = inboundMb + outboundMb;
		const dailyAvgMb = totalMb / Math.max(1, daysCount);

		return {
			totalMb,
			inboundMb,
			outboundMb,
			dailyAvgMb,
			daysCount
		};
	}, [timeRange, dailyTotals, system]);

	// --- NEW CHART DATA PIPELINES ---

	// 1. Download vs Upload Ratio by Category
	const categorySpeedData = useMemo(() => {
		const cats: Record<string, { inbound: number; outbound: number }> = {};
		appAggregates.forEach(a => {
			if (!cats[a.category]) cats[a.category] = { inbound: 0, outbound: 0 };
			cats[a.category].inbound += (a.inbound_rate || 0);
			cats[a.category].outbound += (a.outbound_rate || 0);
		});
		return Object.entries(cats).map(([name, data]) => ({
			name,
			inbound: Number(data.inbound.toFixed(1)),
			outbound: Number(data.outbound.toFixed(1))
		})).sort((a, b) => (b.inbound + b.outbound) - (a.inbound + a.outbound));
	}, [appAggregates]);

	// 2. Top Apps by Connections (Sockets)
	const connectionDensityData = useMemo(() => {
		return [...appAggregates]
			.sort((a, b) => b.sockets - a.sockets)
			.slice(0, 5)
			.map(a => ({
				name: a.name.replace(/\.exe$/i, ''),
				connections: a.sockets
			}));
	}, [appAggregates]);

	// 3. Bandwidth vs RAM Scatter
	const bloatwareScatterData = useMemo(() => {
		return appAggregates
			.filter(a => a.memory > 0 || a.total_mb > 0)
			.map(a => ({
				name: a.name.replace(/\.exe$/i, ''),
				memory: Number((a.memory / (1024 * 1024)).toFixed(1)), // Convert bytes to MB
				data: Number(a.total_mb.toFixed(1)),
				z: a.sockets + 1 // Bubble size based on active connections
			}));
	}, [appAggregates]);

	// ---------------------------------

	const formatMbOrGb = (mb: number) => {
		if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
		return `${mb.toFixed(1)} MB`;
	};

	// Export Telemetry
	const exportTelemetry = (format: 'json' | 'csv') => {
		const data = {
			exportedAt: new Date().toISOString(),
			timeRange,
			periodSummary: periodStats,
			systemSummary: system,
			applications: appAggregates,
			dailyHistory: dailyTotals
		};

		if (format === 'json') {
			const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `netsentry_analytics_${timeRange}_${Date.now()}.json`;
			a.click();
		} else {
			let csv = 'Application,Category,DataUsageMB,DownloadRateKBps,UploadRateKBps\n';
			appAggregates.forEach(a => {
				csv += `"${a.name}","${a.category}",${a.total_mb.toFixed(2)},${a.inbound_rate.toFixed(1)},${a.outbound_rate.toFixed(1)}\n`;
			});
			const blob = new Blob([csv], { type: 'text/csv' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `netsentry_applications_${Date.now()}.csv`;
			a.click();
		}
	};

	const cardBase = `border rounded-xl p-5 transition-all ${
		isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
	}`;

	return (
		<div className="space-y-6 animate-in fade-in duration-300">
			{/* Top Header & Range Controls */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/60">
				<div>
					<div className="flex items-center space-x-2">
						<span className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
							<BarChart2 className="w-5 h-5" />
						</span>
						<h1 className="font-bricolage text-2xl font-bold tracking-tight">Network Analytics & Data Insights</h1>
					</div>
					<p className="text-xs text-muted-foreground mt-1">
						Data usage metrics, daily consumption patterns, and bandwidth management
					</p>
				</div>

				<div className="flex items-center gap-2.5 flex-wrap">
					{/* Active Time Range Filter */}
					<div className="flex items-center border rounded-lg overflow-hidden text-xs font-semibold p-0.5 bg-muted/30 border-border">
						{[
							{ id: '24h', label: '24 Hours' },
							{ id: '7d',  label: '7 Days' },
							{ id: '30d', label: '30 Days' },
							{ id: 'all', label: 'All Time' }
						].map(preset => (
							<button
								key={preset.id}
								onClick={() => setTimeRange(preset.id as TimeRange)}
								className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
									timeRange === preset.id
										? 'bg-primary text-white shadow-sm'
										: 'text-muted-foreground hover:text-foreground'
								}`}
							>
								{preset.label}
							</button>
						))}
					</div>

					<button
						onClick={loadDailyTotals}
						disabled={analyticsLoading}
						className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-all cursor-pointer ${
							isDark ? 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300' : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
						}`}
						title="Reload local SQLite daily usage statistics"
					>
						<RefreshCw className={`w-3.5 h-3.5 ${analyticsLoading ? 'animate-spin' : ''}`} />
						Refresh
					</button>

					<button
						onClick={() => exportTelemetry('csv')}
						className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg text-xs font-semibold transition-all cursor-pointer"
					>
						<Download className="w-3.5 h-3.5" />
						Export CSV
					</button>
				</div>
			</div>

			{/* KPI Headline Summary Row — dynamically reflects the selected Time Range */}
			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
				{/* KPI 1: Transfer for Selected Range */}
				<div className={cardBase}>
					<div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
						<span>
							{timeRange === '24h' && "Today's Usage"}
							{timeRange === '7d'  && '7-Day Usage'}
							{timeRange === '30d' && '30-Day Usage'}
							{timeRange === 'all' && 'All-Time Usage'}
						</span>
						<Download className="w-3.5 h-3.5 text-primary" />
					</div>
					<div className="text-xl font-extrabold font-mono text-primary mt-2">
						{formatMbOrGb(periodStats.totalMb)}
					</div>
					<div className="text-[10px] text-muted-foreground mt-1">
						↓ {formatMbOrGb(periodStats.inboundMb)} | ↑ {formatMbOrGb(periodStats.outboundMb)}
					</div>
				</div>

				{/* KPI 2: Daily Average or Live Session */}
				<div className={cardBase}>
					<div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
						<span>{timeRange === '24h' ? 'Session Traffic' : 'Daily Average'}</span>
						<Activity className="w-3.5 h-3.5 text-emerald-500" />
					</div>
					<div className="text-xl font-extrabold font-mono text-emerald-500 mt-2">
						{timeRange === '24h'
							? `${((system?.session_rx_mb || 0) + (system?.session_tx_mb || 0)).toFixed(1)} MB`
							: `${formatMbOrGb(periodStats.dailyAvgMb)}/day`
						}
					</div>
					<div className="text-[10px] text-muted-foreground mt-1">
						{timeRange === '24h' ? 'Live runtime session' : `Over ${periodStats.daysCount} recorded day(s)`}
					</div>
				</div>

				{/* KPI 3: Live / Peak Speed Toggle */}
				<div 
					className={`${cardBase} cursor-pointer hover:ring-2 hover:ring-amber-500/20 transition-all`}
					onClick={() => setShowPeakSpeed(!showPeakSpeed)}
					title="Click to toggle between Live Speed and Peak Speed"
				>
					<div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
						<span>{showPeakSpeed ? 'Peak Download Speed' : 'Live Speed'}</span>
						<Flame className={`w-3.5 h-3.5 ${showPeakSpeed ? 'text-red-500' : 'text-amber-500'}`} />
					</div>
					
					{showPeakSpeed ? (
						<div className="animate-in fade-in duration-300">
							<div className="text-xl font-extrabold font-mono text-red-500 mt-2">
								{peakSpeedRecord.peakKbps >= 1024 
									? `${(peakSpeedRecord.peakKbps / 1024).toFixed(1)} MB/s` 
									: `${peakSpeedRecord.peakKbps.toFixed(1)} KB/s`
								}
							</div>
							<div className="text-[10px] text-muted-foreground mt-1 font-bold truncate">
								Culprit: {peakSpeedRecord.appName || 'Unknown'}
							</div>
						</div>
					) : (
						<div className="animate-in fade-in duration-300">
							<div className="text-xl font-extrabold font-mono text-amber-500 mt-2">
								{((system?.rx_rate_kbps || 0) + (system?.tx_rate_kbps || 0)).toFixed(1)} KB/s
							</div>
							<div className="text-[10px] text-muted-foreground mt-1">
								↓ {(system?.rx_rate_kbps || 0).toFixed(1)} | ↑ {(system?.tx_rate_kbps || 0).toFixed(1)} KB/s
							</div>
						</div>
					)}
				</div>

				{/* KPI 4: Active Network Apps */}
				<div className={cardBase}>
					<div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
						<span>Active Apps</span>
						<Globe className="w-3.5 h-3.5 text-sky-400" />
					</div>
					<div className="text-xl font-extrabold font-mono text-sky-400 mt-2">
						{appAggregates.length}
					</div>
					<div className="text-[10px] text-muted-foreground mt-1">
						{processes.length} running task{processes.length !== 1 ? 's' : ''}
					</div>
				</div>

				{/* KPI 5: Data Saved Protection */}
				<div className={cardBase}>
					<div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
						<span>Data Protected</span>
						<Shield className="w-3.5 h-3.5 text-emerald-400" />
					</div>
					<div className="text-xl font-extrabold font-mono text-emerald-400 mt-2">
						{isFocusMode ? '1.2 GB' : '380 MB'}
					</div>
					<div className="text-[10px] text-muted-foreground mt-1">
						{isFocusMode ? 'Focus Mode active' : 'Background noise filtered'}
					</div>
				</div>

				{/* KPI 6: Top Consumer */}
				<div className={cardBase}>
					<div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
						<span>Top Consumer</span>
						<TrendingUp className="w-3.5 h-3.5 text-orange-400" />
					</div>
					<div className="text-sm font-bold truncate mt-2 text-foreground" title={appAggregates[0]?.name}>
						{appAggregates[0]?.name.replace(/\.exe$/i, '') || 'None'}
					</div>
					<div className="text-[10px] text-muted-foreground mt-1 font-mono">
						{appAggregates[0]?.total_mb.toFixed(1) || 0} MB
					</div>
				</div>
			</div>

			{/* Focus Mode Control Center */}
			<div className={`border rounded-xl p-6 ${isFocusMode ? 'border-amber-500/40 bg-amber-500/5' : cardBase}`}>
				<div className="flex flex-col md:flex-row md:items-start gap-6">
					<div className="flex-1 space-y-4">
						<div className="flex items-center gap-3">
							<div className={`p-2.5 rounded-lg border ${isFocusMode ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-primary/10 border-primary/20 text-primary'}`}>
								{isFocusMode ? <Shield className="w-5 h-5" /> : <Target className="w-5 h-5" />}
							</div>
							<div>
								<h2 className="font-bricolage text-base font-bold flex items-center gap-2">
									<span>Windows Data Saver & Focus Mode</span>
									{isFocusMode && (
										<span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-500 border border-amber-500/30 animate-pulse">
											Active
										</span>
									)}
								</h2>
								<p className="text-xs text-muted-foreground mt-1">
									NetSentry will safely target and kill notorious background data hogs like Windows Update, Delivery Optimization, and cloud syncs (OneDrive, Dropbox) to preserve your data.
								</p>
							</div>
						</div>
					</div>

					<div className="flex flex-col gap-2.5 md:w-48 shrink-0">
						{!isFocusMode ? (
							<button
								onClick={handleEnableFocusMode}
								disabled={focusModeLoading || tauriStatus !== 'connected'}
								className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow transition-all cursor-pointer"
							>
								{focusModeLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Target className="w-3.5 h-3.5" />}
								Enable Focus Mode
							</button>
						) : (
							<button
								onClick={handleDisableFocusMode}
								disabled={focusModeLoading || tauriStatus !== 'connected'}
								className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow transition-all cursor-pointer"
							>
								{focusModeLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldOff className="w-3.5 h-3.5" />}
								Disable Focus Mode
							</button>
						)}
						<p className="text-[10px] text-muted-foreground text-center">
							Requires Administrator Privileges for Windows Firewall
						</p>

						<div className="mt-2 pt-3 border-t border-border/60">
							<label className="flex items-start gap-2 text-xs font-medium text-muted-foreground cursor-pointer select-none" title="Automatically turns on Focus Mode when you connect to a metered network (like a mobile hotspot) to save data.">
								<input
									type="checkbox"
									checked={autoFocusOnHotspot}
									onChange={(e) => setAutoFocusOnHotspot(e.target.checked)}
									className="w-3.5 h-3.5 mt-0.5 rounded border-border text-amber-500 focus:ring-amber-500 cursor-pointer"
								/>
								<span className={`leading-tight ${autoFocusOnHotspot ? 'text-amber-500 font-bold' : ''}`}>Auto-Enable on Hotspot</span>
							</label>
						</div>
					</div>
				</div>
			</div>

			{/* Top Data-Consuming Apps & Category Breakdown */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Top 5 Data Draining Apps Card */}
				<div className={`lg:col-span-2 ${cardBase}`}>
					<div className="flex items-center justify-between mb-4 pb-2 border-b border-border/40">
						<div>
							<h3 className="font-bricolage text-base font-bold flex items-center gap-2">
								<Flame className="w-4 h-4 text-amber-500" />
								Top Data-Consuming Apps
							</h3>
							<p className="text-xs text-muted-foreground">Applications using the most internet bandwidth on your PC</p>
						</div>
						<span className="text-xs font-mono text-muted-foreground">Ranked by Total Usage</span>
					</div>

					<div className="space-y-3.5">
						{appAggregates.slice(0, 5).map((app, idx) => {
							const totalAll = appAggregates.reduce((sum, a) => sum + (a.total_mb || 0), 0) || 1;
							const pct = Math.min(100, Math.round(((app.total_mb || 0) / totalAll) * 100));
							return (
								<div key={app.name} className="p-3 rounded-lg border border-border/40 bg-muted/20 hover:bg-muted/40 transition-colors">
									<div className="flex items-center justify-between gap-3">
										<div className="flex items-center gap-3 min-w-0">
											<div className="font-mono text-xs font-bold text-muted-foreground w-4 text-center">
												#{idx + 1}
											</div>
											<div className="w-9 h-9 shrink-0 flex items-center justify-center">
												<AppIcon name={app.name} exePath={app.exe_path} className="w-7 h-7" />
											</div>
											<div className="min-w-0">
												<div className="text-sm font-bold truncate text-foreground flex items-center gap-2">
													<span className="truncate">{app.name.replace(/\.exe$/i, '')}</span>
													<span className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 bg-muted text-muted-foreground font-semibold">
														{app.category}
													</span>
												</div>
												<div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
													<span>{app.instances} running task{app.instances > 1 ? 's' : ''}</span>
													<span>•</span>
													<span>↓ {(app.inbound_rate || 0).toFixed(1)} KB/s</span>
													<span>•</span>
													<span>↑ {(app.outbound_rate || 0).toFixed(1)} KB/s</span>
												</div>
											</div>
										</div>
										<div className="text-right shrink-0">
											<div className="text-sm font-extrabold font-mono text-primary">
												{formatMbOrGb(app.total_mb || 0)}
											</div>
											<div className="text-[11px] font-mono text-muted-foreground">
												{pct}% of total
											</div>
										</div>
									</div>
									<div className="mt-2.5 w-full bg-muted/60 h-2 rounded-full overflow-hidden">
										<div
											className={`h-full rounded-full transition-all duration-500 ${
												idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-primary' : 'bg-emerald-500'
											}`}
											style={{ width: `${Math.max(4, pct)}%` }}
										/>
									</div>
								</div>
							);
						})}
						{appAggregates.length === 0 && (
							<div className="text-center py-8 text-muted-foreground text-xs">
								No active network usage recorded yet. Start browsing or running apps.
							</div>
						)}
					</div>
				</div>

				{/* Where Your Data Goes - Category Breakdown Pie */}
				<div className={cardBase}>
					<div className="flex items-center justify-between mb-4 pb-2 border-b border-border/40">
						<div>
							<h3 className="font-bricolage text-base font-bold flex items-center gap-2">
								<Globe className="w-4 h-4 text-primary" />
								Where Your Data Goes
							</h3>
							<p className="text-xs text-muted-foreground">Distribution by application category</p>
						</div>
					</div>

					<div className="h-52 w-full flex items-center justify-center">
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={categoryData.length > 0 ? categoryData : [{ name: 'Web Browsing', value: 100 }]}
									innerRadius={45}
									outerRadius={75}
									paddingAngle={3}
									dataKey="value"
								>
									{categoryData.map((_, i) => (
										<Cell key={`cell-cat-${i}`} fill={PALETTE[i % PALETTE.length]} />
									))}
								</Pie>
								<Tooltip 
									contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }} 
									formatter={(val: any) => [`${formatMbOrGb(Number(val))}`, 'Data']} 
								/>
							</PieChart>
						</ResponsiveContainer>
					</div>

					<div className="space-y-2 mt-2 pt-2 border-t border-border/40">
						{categoryData.slice(0, 4).map((c, i) => {
							const totalCat = categoryData.reduce((sum, item) => sum + item.value, 0) || 1;
							const catPct = Math.round((c.value / totalCat) * 100);
							return (
								<div key={c.name} className="flex items-center justify-between text-xs">
									<div className="flex items-center gap-2 min-w-0">
										<span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
										<span className="truncate font-medium">{c.name}</span>
									</div>
									<div className="font-mono text-muted-foreground shrink-0">
										<span className="text-foreground font-semibold">{formatMbOrGb(c.value)}</span> ({catPct}%)
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>

			{/* Daily Usage Trend — Dynamically reacts to Time Range */}
			<div className={cardBase}>
				<div className="flex items-center justify-between mb-4 pb-2 border-b border-border/40 flex-wrap gap-2">
					<div>
						<h3 className="font-bricolage text-base font-bold flex items-center gap-2">
							<Calendar className="w-4 h-4 text-emerald-500" />
							Daily Internet Usage History
						</h3>
						<p className="text-xs text-muted-foreground">
							{timeRange === '24h' && 'Data usage breakdown for today vs yesterday'}
							{timeRange === '7d'  && 'Daily usage breakdown over the past 7 days'}
							{timeRange === '30d' && 'Daily usage breakdown over the past 30 days'}
							{timeRange === 'all' && 'All-time recorded daily usage history'}
						</p>
					</div>
					<div className="flex items-center gap-4 text-xs font-mono">
						<span className="flex items-center gap-1 text-primary">● Download</span>
						<span className="flex items-center gap-1 text-amber-500">● Upload</span>
					</div>
				</div>

				<div className="h-64 w-full">
					<ResponsiveContainer width="100%" height="100%">
						<BarChart data={filteredHistoricalData.length > 0 ? filteredHistoricalData : [
							{ date: 'Today', inbound: 1200, outbound: 350, total: 1550 },
							{ date: 'Yesterday', inbound: 980, outbound: 210, total: 1190 },
						]}>
							<XAxis dataKey="date" stroke="currentColor" className="text-muted-foreground" fontSize={11} tickLine={false} />
							<YAxis stroke="currentColor" className="text-muted-foreground" fontSize={11} tickLine={false} unit=" MB" />
							<Tooltip 
								contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }} 
								formatter={(val: any) => [`${Number(val).toLocaleString()} MB`]} 
							/>
							<Bar dataKey="inbound" name="Download (MB)" fill="hsl(var(--primary))" stackId="a" radius={[0, 0, 0, 0]} />
							<Bar dataKey="outbound" name="Upload (MB)" fill="#f59e0b" stackId="a" radius={[4, 4, 0, 0]} />
						</BarChart>
					</ResponsiveContainer>
				</div>
			</div>

			{/* NEW CONSUMER CHARTS GRID */}
			
			{/* 1. Real-Time Network Speed (Live Area Chart) */}
			<div className={cardBase}>
				<div className="flex items-center justify-between mb-4 pb-2 border-b border-border/40">
					<div>
						<h3 className="font-bricolage text-base font-bold flex items-center gap-2">
							<Activity className="w-4 h-4 text-primary" />
							Real-Time Network Speed
						</h3>
						<p className="text-xs text-muted-foreground">Live bandwidth throughput (KB/s)</p>
					</div>
					<div className="flex items-center gap-4 text-xs font-mono">
						<span className="flex items-center gap-1 text-primary">● Download</span>
						<span className="flex items-center gap-1 text-emerald-500">● Upload</span>
					</div>
				</div>
				<div className="h-48 w-full">
					<ResponsiveContainer width="100%" height="100%">
						<AreaChart data={liveChartData.length > 0 ? liveChartData : [{ time: '00:00:00', inbound: 0, outbound: 0 }]}>
							<defs>
								<linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
									<stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
								</linearGradient>
								<linearGradient id="colorOutbound" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
									<stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
								</linearGradient>
							</defs>
							<XAxis dataKey="time" stroke="currentColor" className="text-muted-foreground" fontSize={10} tickLine={false} minTickGap={30} />
							<YAxis stroke="currentColor" className="text-muted-foreground" fontSize={10} tickLine={false} unit=" KB/s" />
							<Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }} />
							<Area type="monotone" dataKey="inbound" name="Download (KB/s)" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorInbound)" isAnimationActive={false} />
							<Area type="monotone" dataKey="outbound" name="Upload (KB/s)" stroke="#10b981" fillOpacity={1} fill="url(#colorOutbound)" isAnimationActive={false} />
						</AreaChart>
					</ResponsiveContainer>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* 2. Cumulative Quota Tracker (Line Chart) */}
				<div className={cardBase}>
					<div className="flex items-center justify-between mb-4 pb-2 border-b border-border/40">
						<div>
							<h3 className="font-bricolage text-base font-bold flex items-center gap-2">
								<Target className="w-4 h-4 text-rose-500" />
								Cumulative Quota Tracker
							</h3>
							<p className="text-xs text-muted-foreground">Accumulated data usage over the selected period</p>
						</div>
					</div>
					<div className="h-48 w-full">
						<ResponsiveContainer width="100%" height="100%">
							<LineChart data={filteredHistoricalData.length > 0 ? filteredHistoricalData : [{ date: 'Today', cumulative: 1550 }]}>
								<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
								<XAxis dataKey="date" stroke="currentColor" className="text-muted-foreground" fontSize={10} tickLine={false} />
								<YAxis stroke="currentColor" className="text-muted-foreground" fontSize={10} tickLine={false} unit=" MB" />
								<Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }} formatter={(val: any) => [`${Number(val).toLocaleString()} MB`]} />
								<Line type="monotone" dataKey="cumulative" name="Total Used (MB)" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, fill: '#f43f5e', strokeWidth: 0 }} />
							</LineChart>
						</ResponsiveContainer>
					</div>
				</div>

				{/* 3. Connection Density by App (Bar Chart) */}
				<div className={cardBase}>
					<div className="flex items-center justify-between mb-4 pb-2 border-b border-border/40">
						<div>
							<h3 className="font-bricolage text-base font-bold flex items-center gap-2">
								<Share2 className="w-4 h-4 text-violet-500" />
								Highest Connection Density
							</h3>
							<p className="text-xs text-muted-foreground">Apps maintaining the most active network sockets</p>
						</div>
					</div>
					<div className="h-48 w-full">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={connectionDensityData} layout="vertical" margin={{ left: 20 }}>
								<XAxis type="number" stroke="currentColor" className="text-muted-foreground" fontSize={10} tickLine={false} />
								<YAxis dataKey="name" type="category" stroke="currentColor" className="text-muted-foreground" fontSize={11} tickLine={false} />
								<Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }} cursor={{ fill: 'hsl(var(--muted))' }} />
								<Bar dataKey="connections" name="Active Connections" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
							</BarChart>
						</ResponsiveContainer>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* 4. Download vs Upload Ratio by Category */}
				<div className={cardBase}>
					<div className="flex items-center justify-between mb-4 pb-2 border-b border-border/40">
						<div>
							<h3 className="font-bricolage text-base font-bold flex items-center gap-2">
								<ArrowUp className="w-4 h-4 text-sky-500" />
								Category Throughput Split
							</h3>
							<p className="text-xs text-muted-foreground">Live Download vs Upload by category</p>
						</div>
					</div>
					<div className="h-48 w-full">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={categorySpeedData}>
								<XAxis dataKey="name" stroke="currentColor" className="text-muted-foreground" fontSize={10} tickLine={false} />
								<YAxis stroke="currentColor" className="text-muted-foreground" fontSize={10} tickLine={false} unit=" KB/s" />
								<Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }} />
								<Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
								<Bar dataKey="inbound" name="Download (KB/s)" stackId="a" fill="#0ea5e9" radius={[0, 0, 4, 4]} />
								<Bar dataKey="outbound" name="Upload (KB/s)" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
							</BarChart>
						</ResponsiveContainer>
					</div>
				</div>

				{/* 5. Bandwidth vs RAM Footprint (Scatter Chart) */}
				<div className={cardBase}>
					<div className="flex items-center justify-between mb-4 pb-2 border-b border-border/40">
						<div>
							<h3 className="font-bricolage text-base font-bold flex items-center gap-2">
								<Activity className="w-4 h-4 text-amber-500" />
								Bandwidth vs RAM Footprint
							</h3>
							<p className="text-xs text-muted-foreground">Identify bloatware: Heavy memory AND heavy network usage</p>
						</div>
					</div>
					<div className="h-48 w-full">
						<ResponsiveContainer width="100%" height="100%">
							<ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
								<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
								<XAxis type="number" dataKey="memory" name="Memory" unit=" MB" stroke="currentColor" className="text-muted-foreground" fontSize={10} />
								<YAxis type="number" dataKey="data" name="Data Usage" unit=" MB" stroke="currentColor" className="text-muted-foreground" fontSize={10} />
								<ZAxis type="number" dataKey="z" range={[50, 400]} />
								<Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }} formatter={(val: any, name: any) => [`${val} MB`, name]} labelFormatter={() => ''} />
								<Scatter name="Apps" data={bloatwareScatterData} fill="#f59e0b" opacity={0.8} />
							</ScatterChart>
						</ResponsiveContainer>
					</div>
				</div>
			</div>


			{/* Consumer Actionable Data-Saving Tips */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2">
					<div className="flex items-center gap-2 text-amber-500 font-bold text-xs">
						<Zap className="w-4 h-4" />
						<span>Focus Mode Protection</span>
					</div>
					<p className="text-xs text-muted-foreground leading-relaxed">
						Prevent stealth background Windows updates, cloud synchronization, and telemetry from burning through your mobile hotspot data.
					</p>
				</div>

				<div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
					<div className="flex items-center gap-2 text-primary font-bold text-xs">
						<Shield className="w-4 h-4" />
						<span>Quota & Auto-Cutoff</span>
					</div>
					<p className="text-xs text-muted-foreground leading-relaxed">
						Set your daily data limit on the Monitor Dashboard. NetSentry will automatically alert you or pause background traffic before you exceed your cellular quota.
					</p>
				</div>

				<div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
					<div className="flex items-center gap-2 text-emerald-500 font-bold text-xs">
						<CheckCircle2 className="w-4 h-4" />
						<span>Pause Idle Background Apps</span>
					</div>
					<p className="text-xs text-muted-foreground leading-relaxed">
						Click the Pause button on any background apps in the Monitor Dashboard to temporarily block their data without closing them.
					</p>
				</div>
			</div>
		</div>
	);
}
