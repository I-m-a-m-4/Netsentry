"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { 
  Activity, 
  Search, 
  Play, 
  Pause, 
  RotateCcw, 
  ArrowUp, 
  ArrowDown, 
  Shield, 
  Network,
  RefreshCw,
  Terminal,
  Sun,
  Moon,
  AlertTriangle,
  FolderOpen,
  Trash2,
  Eye,
  X,
  TrendingUp,
  Monitor,
  Coffee,
  Heart,
  Globe,
  AppWindow,
  Cpu,
  MessageSquare,
  Music,
  Code,
  Cloud,
  BarChart2,
  ShieldOff,
  Zap
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart,
  Bar,
  Cell,
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import DonateModal from '@/components/donate/donate-modal';

interface ConnectionInfo {
  protocol: string;
  local_address: string;
  foreign_address: string;
  state: string;
  pid: number;
}

interface ProcessNetworkData {
  pid: number;
  name: string;
  exe_path: string;
  inbound_rate: number;
  outbound_rate: number;
  cpu_usage: number;
  memory_usage: number; // in MB
  connections_count: number;
  is_paused: boolean;
  sockets: ConnectionInfo[];
}

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'warning' | 'alert';
}

interface DailyTotal {
  date: string;
  total_inbound_mb: number;
  total_outbound_mb: number;
}

const getProcessIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('chrome') || n.includes('msedge') || n.includes('firefox') || n.includes('brave') || n.includes('opera')) return <Globe className="w-4 h-4" />;
  if (n.includes('discord') || n.includes('slack') || n.includes('teams') || n.includes('whatsapp') || n.includes('telegram')) return <MessageSquare className="w-4 h-4" />;
  if (n.includes('spotify') || n.includes('itunes')) return <Music className="w-4 h-4" />;
  if (n.includes('code') || n.includes('ide') || n.includes('language_server') || n.includes('antigravity')) return <Code className="w-4 h-4" />;
  if (n.includes('system') || n.includes('svchost') || n.includes('ntoskrnl')) return <Cpu className="w-4 h-4" />;
  if (n.includes('onedrive') || n.includes('dropbox') || n.includes('drive')) return <Cloud className="w-4 h-4" />;
  return <AppWindow className="w-4 h-4" />;
};

export default function NetSentryDashboard() {
  const [isClient, setIsClient] = useState(false);
  const [processes, setProcesses] = useState<ProcessNetworkData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [chartData, setChartData] = useState<{ time: string; inbound: number; outbound: number }[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tauriStatus, setTauriStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
  // States
  const [selectedProcess, setSelectedProcess] = useState<ProcessNetworkData | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [quotaLimit, setQuotaLimit] = useState<number>(1000); // MB
  const [accumulatedUsage, setAccumulatedUsage] = useState<number>(0); // MB
  const [securityLogs, setSecurityLogs] = useState<LogEntry[]>([
    { timestamp: new Date().toLocaleTimeString(), message: "NetSentry security engine initialized.", type: "info" }
  ]);
  const [currentTab, setCurrentTab] = useState<'monitor' | 'logs' | 'analytics'>('monitor');
  const [isMetered, setIsMetered] = useState<boolean>(false);
  const [isWwan, setIsWwan] = useState<boolean>(false);
  const [isDataSaverMode, setIsDataSaverMode] = useState<boolean>(false);
  const [dataSaverLoading, setDataSaverLoading] = useState<boolean>(false);
  const [dailyTotals, setDailyTotals] = useState<DailyTotal[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(false);
  // Default whitelist: common browsers + system
  const [allowedApps, setAllowedApps] = useState<string>(
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe\nC:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe\nC:\\Program Files\\Mozilla Firefox\\firefox.exe'
  );

  // Toggle Theme
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const loadDailyTotals = async () => {
    if (tauriStatus !== 'connected') return;
    setAnalyticsLoading(true);
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const totals = await invoke<DailyTotal[]>('get_daily_totals', { days: 30 });
      setDailyTotals(totals.reverse()); // ascending for chart
    } catch (e) {
      console.error('Failed to load analytics', e);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleEnableDataSaver = async () => {
    setDataSaverLoading(true);
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const paths = allowedApps.split('\n').map(s => s.trim()).filter(Boolean);
      await invoke('enable_data_saver_mode', { allowedExePaths: paths });
      setIsDataSaverMode(true);
      addLog(`Data Saver Mode ENABLED. Whitelisted ${paths.length} app(s).`, 'warning');
    } catch (e) {
      alert(`Failed to enable Data Saver Mode: ${e}`);
    } finally {
      setDataSaverLoading(false);
    }
  };

  const handleDisableDataSaver = async () => {
    setDataSaverLoading(true);
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('disable_data_saver_mode');
      setIsDataSaverMode(false);
      addLog('Data Saver Mode DISABLED. Normal outbound traffic restored.', 'info');
    } catch (e) {
      alert(`Failed to disable Data Saver Mode: ${e}`);
    } finally {
      setDataSaverLoading(false);
    }
  };

  const addLog = (message: string, type: 'info' | 'warning' | 'alert' = 'info') => {
    setSecurityLogs(prev => [
      { timestamp: new Date().toLocaleTimeString(), message, type },
      ...prev
    ]);
  };

  useEffect(() => {
    setIsClient(true);
    
    // Check if running in Tauri environment
    const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;
    
    if (isTauri) {
      setTauriStatus('connected');
      
      const setupTauri = async () => {
        const { listen } = await import('@tauri-apps/api/event');
        const { invoke } = await import('@tauri-apps/api/core');
        
        // Initial connection type check
        const checkConnectionStatus = async () => {
          try {
            const status = await invoke<{ is_metered: boolean; is_wwan: boolean }>('is_metered_connection');
            setIsMetered(status.is_metered);
            setIsWwan(status.is_wwan);
          } catch (e) {
            console.error('Failed to check connection status', e);
          }
        };

        await checkConnectionStatus();

        // Poll every 2.5s for connection type changes (e.g. switching from Wi-Fi to hotspot)
        const costInterval = setInterval(checkConnectionStatus, 2500);
        
        const unlisten = await listen<ProcessNetworkData[]>('network-data', (event) => {
          setProcesses(event.payload);
          
          // Calculate overall stats
          const totalInbound = event.payload.reduce((sum, p) => sum + p.inbound_rate, 0);
          const totalOutbound = event.payload.reduce((sum, p) => sum + p.outbound_rate, 0);
          
          // Accumulate usage: event fires every 1 s, rates are in KB/s
          // so per-tick usage in MB = totalKB / 1024 (no further division)
          const totalKB = totalInbound + totalOutbound;
          setAccumulatedUsage(prev => {
            const addedMB = totalKB / 1024;
            const newTotal = prev + addedMB;
            if (newTotal >= quotaLimit && prev < quotaLimit) {
              addLog(`Alert: Bandwidth quota of ${quotaLimit} MB exceeded!`, 'alert');
            }
            return newTotal;
          });

          // Threat Audit logs
          event.payload.forEach(p => {
            if (p.connections_count > 25 && p.cpu_usage > 50 && p.name !== 'chrome.exe' && p.name !== 'msedge.exe' && p.name !== 'firefox.exe') {
              addLog(`Warning: Process ${p.name} (PID ${p.pid}) shows suspicious socket counts (${p.connections_count}) and high CPU usage (${p.cpu_usage}%).`, 'warning');
            }
          });

          setChartData(prev => {
            const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const newData = [...prev, { time: now, inbound: Math.round(totalInbound), outbound: Math.round(totalOutbound) }];
            if (newData.length > 20) newData.shift();
            return newData;
          });
        });

        return () => {
          clearInterval(costInterval);
          unlisten();
        };
      };

      let cleanup: (() => void) | undefined;
      setupTauri().then(cb => {
        cleanup = cb;
      });

      return () => {
        if (cleanup) cleanup();
      };
    } else {
      setTauriStatus('disconnected');
      setProcesses([]);
    }
  }, [quotaLimit]);

  const filteredProcesses = useMemo(() => {
    return processes.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.pid.toString().includes(searchQuery)
    );
  }, [processes, searchQuery]);

  const overallStats = useMemo(() => {
    let inbound = 0;
    let outbound = 0;
    let totalConnections = 0;
    processes.forEach(p => {
      inbound += p.inbound_rate;
      outbound += p.outbound_rate;
      totalConnections += p.connections_count;
    });
    return {
      inbound: Math.round(inbound),
      outbound: Math.round(outbound),
      totalConnections
    };
  }, [processes]);

  const handleTogglePause = async (proc: ProcessNetworkData) => {
    const key = `pause-${proc.pid}-${proc.exe_path}`;
    setActionLoading(key);
    
    try {
      if (tauriStatus === 'connected') {
        const { invoke } = await import('@tauri-apps/api/core');
        if (proc.is_paused) {
          await invoke('resume_inbound_traffic', { exePath: proc.exe_path, name: proc.name });
          addLog(`Inbound rules resumed for ${proc.name} (PID ${proc.pid})`, 'info');
        } else {
          await invoke('pause_inbound_traffic', { exePath: proc.exe_path, name: proc.name });
          addLog(`Firewall blocked inbound traffic for ${proc.name} (PID ${proc.pid})`, 'warning');
        }
      }
    } catch (e) {
      console.error(e);
      alert(`Firewall action failed: ${e}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleKillProcess = async (proc: ProcessNetworkData) => {
    if (!confirm(`Are you sure you want to force terminate ${proc.name} (PID ${proc.pid})?`)) return;
    
    const key = `kill-${proc.pid}`;
    setActionLoading(key);
    
    try {
      if (tauriStatus === 'connected') {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('kill_process', { pid: proc.pid });
        addLog(`Force terminated process ${proc.name} (PID ${proc.pid})`, 'alert');
      }
    } catch (e) {
      console.error(e);
      alert(`Failed to kill process: ${e}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenFileLocation = async (proc: ProcessNetworkData) => {
    try {
      if (tauriStatus === 'connected') {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('open_file_location', { exePath: proc.exe_path });
        addLog(`Opened folder location for ${proc.name}`, 'info');
      }
    } catch (e) {
      console.error(e);
      alert(`Failed to open location: ${e}`);
    }
  };

  const handleResumeAll = async () => {
    setActionLoading('resume-all');
    try {
      if (tauriStatus === 'connected') {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('resume_all_traffic');
        addLog(`Global reset: Resumed traffic rules for all paused programs.`, 'info');
      }
      alert('Successfully resumed all blocked inbound traffic rules!');
    } catch (e) {
      console.error(e);
      alert(`Resume action failed: ${e}`);
    } finally {
      setActionLoading(null);
    }
  };

  const openInspector = (proc: ProcessNetworkData) => {
    setSelectedProcess(proc);
    setIsInspectorOpen(true);
  };

  if (!isClient) return null;

  // Theme configuration (Zeneva Orange theme values)
  const isDark = theme === 'dark';
  const bgClass = "bg-background text-foreground";
  const borderClass = "border-border";
  const cardClass = "bg-card border border-border/70 rounded-2xl shadow-sm p-6 hover:shadow-md transition-all duration-200";
  const cardClassNoPadding = "bg-card border border-border/70 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-200";
  const headerBgClass = "bg-background/80 border-border";
  const textMutedClass = "text-muted-foreground";
  const tableHeaderBg = "bg-muted/40";
  const tableRowHover = "hover:bg-muted/30";

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${bgClass}`}>
      {/* Background Glows */}
      {isDark ? (
        <>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
        </>
      ) : (
        <>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
        </>
      )}

      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b px-6 py-4 flex items-center justify-between transition-colors duration-200 ${headerBgClass} ${borderClass}`}>
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary rounded-xl shadow-md">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bricolage text-xl font-black tracking-tight text-primary">
              NetSentry
            </h1>
            <p className="text-[10px] text-muted-foreground tracking-wider uppercase font-semibold">
              Data Saver & Windows Bandwidth Monitor
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Navigation Tabs */}
          <div className={`flex items-center border rounded-xl p-1 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <button 
              onClick={() => setCurrentTab('monitor')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                currentTab === 'monitor' 
                  ? 'bg-primary text-white shadow-sm' 
                  : textMutedClass
              }`}
            >
              Monitor Dashboard
            </button>
            <button 
              onClick={() => { setCurrentTab('logs'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                currentTab === 'logs' 
                  ? 'bg-primary text-white shadow-sm' 
                  : textMutedClass
              }`}
            >
              Security Logs ({securityLogs.length})
            </button>
            <button 
              onClick={() => { setCurrentTab('analytics'); loadDailyTotals(); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                currentTab === 'analytics' 
                  ? 'bg-primary text-white shadow-sm' 
                  : textMutedClass
              }`}
            >
              Analytics
            </button>
          </div>

          {/* Buy Us a Coffee Button */}
          <button 
            onClick={() => setIsDonateOpen(true)}
            className="flex items-center space-x-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-all shadow-sm active:scale-95"
            title="Support NetSentry Development"
          >
            <Coffee className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Buy Us a Coffee</span>
          </button>

          {/* Theme Toggle Button */}
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              isDark 
                ? 'bg-slate-900 border-slate-800 text-primary hover:bg-slate-850' 
                : 'bg-white border-slate-200 text-primary hover:bg-slate-100 shadow-sm'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className={`flex items-center space-x-2 text-xs border rounded-full px-3 py-1.5 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <span className={`w-2 h-2 rounded-full ${tauriStatus === 'connected' ? 'bg-primary animate-pulse' : 'bg-orange-400'}`} />
            <span className={textMutedClass}>
              {tauriStatus === 'connected' ? 'Tauri Service Active' : 'Web Sandbox'}
            </span>
          </div>

          <button 
            onClick={handleResumeAll}
            disabled={actionLoading !== null || tauriStatus !== 'connected'}
            className="flex items-center space-x-2 bg-primary hover:bg-primary/90 disabled:bg-slate-400 disabled:cursor-not-allowed text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-md cursor-pointer transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Firewall Rules</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 w-full p-6 space-y-6">
        
        {/* Sandbox Warning */}
        {tauriStatus === 'disconnected' && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-primary/10 text-primary rounded-xl mt-0.5 md:mt-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bricolage text-sm font-bold text-primary">Local Telemetry Offline</h3>
                <p className={`text-xs mt-1 ${textMutedClass}`}>
                  NetSentry requires process-level socket tracing and administrative capabilities to manage firewall rules and monitor network traffic. These components cannot run inside standard web browsers.
                </p>
              </div>
            </div>
          </div>
        )}

        {currentTab === 'monitor' ? (
          <>
            {/* Platform Overview Command Container */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-primary/10 text-primary border border-primary/20 rounded-xl">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bricolage text-lg font-bold text-foreground">
                      Network Overview Command
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Real-time telemetry, session quota tracking, and socket inspection
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {tauriStatus === 'connected' && (
                    <Badge variant="outline" className={`text-xs px-2.5 py-1 ${
                      isWwan
                        ? 'border-amber-500 text-amber-500 bg-amber-500/5'
                        : isMetered
                          ? 'border-orange-500 text-orange-500 bg-orange-500/5'
                          : 'border-emerald-500 text-emerald-500 bg-emerald-500/5'
                    }`}>
                      {isWwan
                        ? '📶 Mobile Data Active'
                        : isMetered
                          ? '⚡ Metered Connection'
                          : '🌐 Unmetered'}
                    </Badge>
                  )}
                  <Badge variant="outline" className="border-primary/40 text-primary text-xs px-2.5 py-1">
                    {tauriStatus === 'connected' ? '● Engine Active' : '○ Web Mode'}
                  </Badge>
                </div>
              </div>

              {/* Row 1: Primary Telemetry & Data Usage Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Total Data Consumed */}
                <div className="p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/30 transition-all flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs font-semibold">Total Data Used</span>
                    <Activity className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-foreground">
                      {accumulatedUsage >= 1024 
                        ? `${(accumulatedUsage / 1024).toFixed(2)} GB` 
                        : `${accumulatedUsage.toFixed(1)} MB`}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Session bandwidth consumed
                    </p>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Quota Usage</span>
                      <span className="font-semibold">{Math.min(Math.round((accumulatedUsage / quotaLimit) * 100), 100)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${accumulatedUsage >= quotaLimit ? 'bg-red-500' : 'bg-primary'}`}
                        style={{ width: `${Math.min((accumulatedUsage / quotaLimit) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card 2: Quota Limit Control */}
                <div className="p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/30 transition-all flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs font-semibold">Bandwidth Quota</span>
                    <TrendingUp className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-foreground">
                      {quotaLimit} MB
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {Math.max(0, quotaLimit - accumulatedUsage).toFixed(1)} MB buffer remaining
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-2">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Set Limit:</span>
                    <input 
                      type="number"
                      value={quotaLimit}
                      onChange={(e) => setQuotaLimit(Math.max(1, Number(e.target.value)))}
                      className="w-20 px-2 py-0.5 text-xs text-center border border-border rounded-lg bg-background text-foreground outline-none focus:ring-1 focus:ring-primary focus:border-primary font-mono"
                    />
                  </div>
                </div>

                {/* Card 3: Download Flow */}
                <div className="p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/30 transition-all flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs font-semibold">Inbound Download</span>
                    <ArrowDown className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-emerald-500">
                      {overallStats.inbound > 1024 
                        ? `${(overallStats.inbound / 1024).toFixed(2)} MB/s` 
                        : `${overallStats.inbound} KB/s`}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Live incoming packet stream
                    </p>
                  </div>
                  <div className="text-[10px] text-muted-foreground pt-1 border-t border-border/60">
                    Calculated across all active sockets
                  </div>
                </div>

                {/* Card 4: Upload Flow */}
                <div className="p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/30 transition-all flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs font-semibold">Outbound Upload</span>
                    <ArrowUp className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-primary">
                      {overallStats.outbound > 1024 
                        ? `${(overallStats.outbound / 1024).toFixed(2)} MB/s` 
                        : `${overallStats.outbound} KB/s`}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Live outgoing packet stream
                    </p>
                  </div>
                  <div className="text-[10px] text-muted-foreground pt-1 border-t border-border/60">
                    Telemetry updated every 1,000ms
                  </div>
                </div>
              </div>

              {/* Row 2: Secondary Metric Stack */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                <div className="p-3.5 rounded-xl border border-border bg-muted/10 space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground text-xs">
                    <span>Active Sockets</span>
                    <Network className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xl font-bold text-foreground">{overallStats.totalConnections}</div>
                  <p className="text-[10px] text-muted-foreground">Open TCP/UDP ports</p>
                </div>

                <div className="p-3.5 rounded-xl border border-border bg-muted/10 space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground text-xs">
                    <span>Processes Tracked</span>
                    <Terminal className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xl font-bold text-foreground">{processes.length}</div>
                  <p className="text-[10px] text-muted-foreground">System application handles</p>
                </div>

                <div className="p-3.5 rounded-xl border border-border bg-muted/10 space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground text-xs">
                    <span>Paused Inbound Rules</span>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="text-xl font-bold text-amber-500">
                    {processes.filter(p => p.is_paused).length}
                  </div>
                  <p className="text-[10px] text-muted-foreground">Firewall-blocked programs</p>
                </div>

                <div className="p-3.5 rounded-xl border border-border bg-muted/10 space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground text-xs">
                    <span>Audit Events</span>
                    <Eye className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xl font-bold text-foreground">{securityLogs.length}</div>
                  <p className="text-[10px] text-muted-foreground">Logged telemetry signals</p>
                </div>
              </div>
            </div>

            {/* Real-Time Traffic Telemetry Area Chart */}
            <div className={cardClass}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-border/60 pb-4">
                <div>
                  <h2 className="font-bricolage text-lg font-bold flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-primary animate-pulse" />
                    <span>Real-Time Traffic Telemetry</span>
                  </h2>
                  <p className="text-xs text-muted-foreground">Live throughput telemetry and bandwidth volume</p>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <span className="text-muted-foreground">Inbound: <strong className="text-foreground">{overallStats.inbound} KB/s</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-muted-foreground">Outbound: <strong className="text-foreground">{overallStats.outbound} KB/s</strong></span>
                  </div>
                </div>
              </div>

              <div className="h-64 w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorOutbound" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" stroke="currentColor" className="text-muted-foreground" fontSize={10} tickLine={false} />
                      <YAxis stroke="currentColor" className="text-muted-foreground" fontSize={10} tickLine={false} label={{ value: 'KB/s', angle: -90, position: 'insideLeft', fill: 'currentColor' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          borderColor: 'hsl(var(--border))', 
                          borderRadius: '12px', 
                          color: 'hsl(var(--foreground))',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Area type="monotone" dataKey="inbound" name="Inbound Rate (KB/s)" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorInbound)" />
                      <Area type="monotone" dataKey="outbound" name="Outbound Rate (KB/s)" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorOutbound)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center text-xs text-muted-foreground py-10 space-y-3">
                    <Network className="w-10 h-10 text-muted-foreground/40 stroke-[1.5]" />
                    <span className="text-center font-medium max-w-sm">
                      {tauriStatus === 'connected'
                        ? (isWwan || isMetered)
                          ? 'Awaiting live traffic signals from the mobile data connection...'
                          : 'No metered/mobile connection detected. Connect via mobile hotspot or cellular to track data usage.'
                        : 'Connect Tauri Desktop client to capture real-time traffic statistics.'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Controller Table */}
            <div className={cardClassNoPadding}>
              <div className={`p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 ${borderClass}`}>
                <div>
                  <h2 className="font-bricolage text-lg font-bold flex items-center space-x-2">
                    <Terminal className="w-5 h-5 text-primary" />
                    <span>Process Network & System Controller</span>
                  </h2>
                  <p className={`text-xs ${textMutedClass}`}>Enable/disable inbound firewall block rules dynamically</p>
                </div>
                
                {/* Search Bar */}
                <div className="relative max-w-sm w-full">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-slate-400" />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by name or PID..."
                    className={`w-full border focus:ring-1 rounded-xl pl-9 pr-4 py-2 text-sm outline-none transition-all ${
                      isDark 
                        ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-primary focus:ring-primary focus:bg-slate-950 placeholder-slate-500' 
                        : 'bg-white border-slate-200 text-slate-900 focus:border-primary focus:ring-primary focus:bg-white placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b border-border/50 text-xs font-semibold uppercase tracking-wider ${tableHeaderBg} ${textMutedClass}`}>
                      <th className="px-6 py-4">Process Name</th>
                      <th className="px-6 py-4">PID</th>
                      <th className="px-6 py-4">CPU</th>
                      <th className="px-6 py-4">Memory</th>
                      <th className="px-6 py-4">Inbound Rate</th>
                      <th className="px-6 py-4">Outbound Rate</th>
                      <th className="px-6 py-4">Sockets</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredProcesses.length > 0 ? (
                      filteredProcesses.map((proc) => {
                        const key = `proc-${proc.pid}`;
                        const isToggleLoading = actionLoading === `pause-${proc.pid}-${proc.exe_path}`;
                        const isKillLoading = actionLoading === `kill-${proc.pid}`;
                        const isHighestDrain = proc.inbound_rate > 50 && proc.inbound_rate === Math.max(...processes.map(p => p.inbound_rate));
                        const isSuspicious = proc.connections_count > 25 && proc.cpu_usage > 50 && proc.name !== 'chrome.exe' && proc.name !== 'msedge.exe' && proc.name !== 'firefox.exe';

                        return (
                          <tr 
                            key={key} 
                            className={`transition-all ${tableRowHover} ${proc.is_paused ? 'bg-red-500/5' : ''} ${isHighestDrain ? 'bg-amber-500/5' : ''}`}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div className={`p-1.5 rounded-lg border bg-background/50 ${
                                  proc.is_paused ? 'border-red-500/50 text-red-500 animate-pulse' : 
                                  isHighestDrain ? 'border-amber-500/50 text-amber-500 animate-ping' : 
                                  isSuspicious ? 'border-primary/50 text-primary animate-bounce' : 
                                  'border-border/50 text-emerald-500'
                                }`}>
                                  {getProcessIcon(proc.name)}
                                </div>
                                <div>
                                  <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                                    <span className="font-bold text-sm">{proc.name}</span>
                                    {isHighestDrain && (
                                      <span className="bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full tracking-wider uppercase flex items-center gap-0.5">
                                        🔥 Data Drain
                                      </span>
                                    )}
                                    {isSuspicious && (
                                      <span className="bg-primary/10 border border-primary/30 text-primary text-[9px] font-extrabold px-1.5 py-0.5 rounded-full tracking-wider uppercase">
                                        Suspicious
                                      </span>
                                    )}
                                  </div>
                                  <div className={`text-[10px] max-w-xs truncate ${textMutedClass}`} title={proc.exe_path}>
                                    {proc.exe_path || 'System Path'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className={`px-6 py-4 font-mono text-xs ${textMutedClass}`}>{proc.pid}</td>
                            <td className="px-6 py-4 font-mono text-xs font-semibold">{proc.cpu_usage.toFixed(1)}%</td>
                            <td className="px-6 py-4 font-mono text-xs font-semibold">{proc.memory_usage} MB</td>
                            <td className="px-6 py-4 font-mono text-sm text-primary font-semibold">
                              {proc.inbound_rate > 1024 
                                ? `${(proc.inbound_rate / 1024).toFixed(1)} MB/s` 
                                : `${proc.inbound_rate.toFixed(1)} KB/s`}
                            </td>
                            <td className="px-6 py-4 font-mono text-sm text-primary font-semibold">
                              {proc.outbound_rate > 1024 
                                ? `${(proc.outbound_rate / 1024).toFixed(1)} MB/s` 
                                : `${proc.outbound_rate.toFixed(1)} KB/s`}
                            </td>
                            <td className={`px-6 py-4 font-mono text-xs ${textMutedClass}`}>{proc.connections_count}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="inline-flex items-center space-x-2">
                                {/* Open Location */}
                                <button
                                  onClick={() => handleOpenFileLocation(proc)}
                                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                    isDark ? 'bg-slate-900 border-slate-800 hover:bg-slate-800' : 'bg-white border-slate-200 hover:bg-slate-100'
                                  }`}
                                  title="Open File Location"
                                >
                                  <FolderOpen className="w-3.5 h-3.5 text-slate-400 hover:text-primary" />
                                </button>

                                {/* Connections Inspector */}
                                <button
                                  onClick={() => openInspector(proc)}
                                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                    isDark ? 'bg-slate-900 border-slate-800 hover:bg-slate-800' : 'bg-white border-slate-200 hover:bg-slate-100'
                                  }`}
                                  title="Inspect Active Sockets"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-400 hover:text-primary" />
                                </button>

                                {/* Force Kill */}
                                <button
                                  onClick={() => handleKillProcess(proc)}
                                  disabled={isKillLoading || tauriStatus !== 'connected'}
                                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                    isDark ? 'bg-slate-900 border-slate-800 hover:bg-slate-800' : 'bg-white border-slate-200 hover:bg-slate-100'
                                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                                  title="Force Terminate Process"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
                                </button>

                                {/* Toggle Inbound Traffic */}
                                <button
                                  onClick={() => handleTogglePause(proc)}
                                  disabled={isToggleLoading || tauriStatus !== 'connected'}
                                  className={`inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all ${
                                    proc.is_paused 
                                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/25' 
                                      : 'bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/25'
                                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                                  title={proc.is_paused ? 'Resume Inbound Data Flow' : 'Pause Inbound Data Flow'}
                                >
                                  {isToggleLoading ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : proc.is_paused ? (
                                    <Play className="w-3 h-3" />
                                  ) : (
                                    <Pause className="w-3 h-3" />
                                  )}
                                  <span>{proc.is_paused ? 'Resume Data' : 'Pause Data'}</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-slate-500 text-sm">
                          {tauriStatus === 'connected' 
                            ? 'No active network processes detected.' 
                            : 'Please run NetSentry as a Windows Desktop application to monitor connections.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          /* Logs Panel */
          <div className={`${cardClass} space-y-4`}>
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <div>
                <h2 className="font-bricolage text-lg font-bold flex items-center space-x-2">
                  <Terminal className="w-5 h-5 text-primary" />
                  <span>Security & Activity Audit Logs</span>
                </h2>
                <p className={`text-xs ${textMutedClass}`}>Real-time activity audit history</p>
              </div>
              <button 
                onClick={() => setSecurityLogs([])}
                className={`text-xs px-3 py-1.5 border rounded-lg hover:bg-slate-900 transition-all ${
                  isDark ? 'border-slate-850 bg-slate-900 text-slate-300' : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                Clear History
              </button>
            </div>
            
            <div className="space-y-2 max-h-[500px] overflow-y-auto font-mono text-xs">
              {securityLogs.length > 0 ? (
                securityLogs.map((log, index) => (
                  <div 
                    key={index}
                    className={`flex items-start space-x-3 p-3 rounded-lg border ${
                      log.type === 'alert' 
                        ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                        : log.type === 'warning'
                          ? 'bg-primary/10 border-primary/20 text-primary'
                          : isDark ? 'bg-slate-900/40 border-slate-855 text-slate-300' : 'bg-slate-100/60 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="text-[10px] text-slate-500 mt-0.5">[{log.timestamp}]</span>
                    <span className="flex-1">{log.message}</span>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-500 py-10">No log entries recorded in this session.</div>
              )}
            </div>
          </div>
        )}

        {currentTab === 'analytics' && (
          <div className="space-y-6">
            {/* Data Saver Mode Card */}
            <div className={`bg-card border rounded-2xl p-6 shadow-sm ${isDataSaverMode ? 'border-amber-500/40 bg-amber-500/5' : 'border-border'}`}>
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl border ${isDataSaverMode ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-primary/10 border-primary/20 text-primary'}`}>
                      {isDataSaverMode ? <ShieldOff className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                    </div>
                    <div>
                      <h2 className="font-bricolage text-lg font-bold">Data Saver Mode</h2>
                      <p className="text-xs text-muted-foreground">Block all outbound traffic except whitelisted apps via Windows Firewall</p>
                    </div>
                    {isDataSaverMode && (
                      <span className="ml-auto text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 animate-pulse">
                        🔒 ACTIVE
                      </span>
                    )}
                  </div>

                  <div className="pt-2 space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Whitelisted Executables (one per line)</label>
                    <textarea
                      value={allowedApps}
                      onChange={e => setAllowedApps(e.target.value)}
                      disabled={isDataSaverMode}
                      rows={4}
                      placeholder={`C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe\nC:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe`}
                      className={`w-full font-mono text-xs p-3 rounded-xl border bg-background resize-none outline-none focus:ring-1 focus:ring-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        isDark ? 'border-slate-800 text-slate-100' : 'border-slate-200 text-slate-900'
                      }`}
                    />
                    <p className="text-[10px] text-muted-foreground">⚠️ Requires Administrator privileges. Blocking all outbound will stop background updates, cloud sync, etc.</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 md:w-48">
                  {!isDataSaverMode ? (
                    <button
                      onClick={handleEnableDataSaver}
                      disabled={dataSaverLoading || tauriStatus !== 'connected'}
                      className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold px-5 py-3 rounded-xl shadow-lg transition-all active:scale-95"
                    >
                      {dataSaverLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                      Enable Data Saver
                    </button>
                  ) : (
                    <button
                      onClick={handleDisableDataSaver}
                      disabled={dataSaverLoading || tauriStatus !== 'connected'}
                      className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold px-5 py-3 rounded-xl shadow-lg transition-all active:scale-95"
                    >
                      {dataSaverLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />}
                      Disable Data Saver
                    </button>
                  )}
                  <button
                    onClick={loadDailyTotals}
                    disabled={analyticsLoading || tauriStatus !== 'connected'}
                    className={`flex items-center justify-center gap-2 border text-xs font-semibold px-4 py-2 rounded-xl transition-all disabled:opacity-50 ${
                      isDark ? 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300' : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${analyticsLoading ? 'animate-spin' : ''}`} />
                    Refresh Analytics
                  </button>
                </div>
              </div>
            </div>

            {/* Historical Usage Chart */}
            <div className={`bg-card border border-border rounded-2xl p-6 shadow-sm`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-border/60 pb-4">
                <div>
                  <h2 className="font-bricolage text-lg font-bold flex items-center space-x-2">
                    <BarChart2 className="w-5 h-5 text-primary" />
                    <span>Historical Bandwidth Usage</span>
                  </h2>
                  <p className="text-xs text-muted-foreground">Daily inbound + outbound totals (last 30 days, stored locally)</p>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <span className="text-muted-foreground">Inbound (MB)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-muted-foreground">Outbound (MB)</span>
                  </div>
                </div>
              </div>

              <div className="h-72 w-full">
                {analyticsLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-primary/40 animate-spin" />
                  </div>
                ) : dailyTotals.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyTotals} barGap={4}>
                      <XAxis dataKey="date" stroke="currentColor" className="text-muted-foreground" fontSize={10} tickLine={false} tickFormatter={v => v.slice(5)} />
                      <YAxis stroke="currentColor" className="text-muted-foreground" fontSize={10} tickLine={false} label={{ value: 'MB', angle: -90, position: 'insideLeft', fill: 'currentColor' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--foreground))' }}
                        formatter={(value: number, name: string) => [`${value.toFixed(2)} MB`, name === 'total_inbound_mb' ? 'Inbound' : 'Outbound']}
                      />
                      <Bar dataKey="total_inbound_mb" name="Inbound" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="total_outbound_mb" name="Outbound" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center space-y-3 text-muted-foreground">
                    <BarChart2 className="w-10 h-10 text-muted-foreground/30" />
                    <p className="text-sm font-medium">No historical data yet</p>
                    <p className="text-xs text-center max-w-xs">Usage is saved every 60 seconds. Come back after the app has been running for a minute, or click Refresh Analytics.</p>
                  </div>
                )}
              </div>

              {/* Summary table */}
              {dailyTotals.length > 0 && (
                <div className="mt-6 border-t border-border/60 pt-4">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className={`text-muted-foreground uppercase tracking-wider font-semibold border-b border-border/50`}>
                        <th className="py-2 text-left">Date</th>
                        <th className="py-2 text-right">Inbound</th>
                        <th className="py-2 text-right">Outbound</th>
                        <th className="py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {[...dailyTotals].reverse().slice(0, 10).map(row => (
                        <tr key={row.date} className="hover:bg-muted/20 transition-colors">
                          <td className="py-2.5 font-mono">{row.date}</td>
                          <td className="py-2.5 text-right font-mono text-primary">{row.total_inbound_mb.toFixed(2)} MB</td>
                          <td className="py-2.5 text-right font-mono text-amber-500">{row.total_outbound_mb.toFixed(2)} MB</td>
                          <td className="py-2.5 text-right font-mono font-bold">{(row.total_inbound_mb + row.total_outbound_mb).toFixed(2)} MB</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Sockets Details Modal */}
      {isInspectorOpen && selectedProcess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`px-6 py-4 border-b flex items-center justify-between ${borderClass}`}>
              <div>
                <h3 className="font-bricolage text-base font-bold flex items-center space-x-2">
                  <Eye className="w-5 h-5 text-primary" />
                  <span>Sockets Inspector: {selectedProcess.name}</span>
                </h3>
                <p className={`text-xs ${textMutedClass}`}>PID: {selectedProcess.pid} | Path: {selectedProcess.exe_path || 'System'}</p>
              </div>
              <button 
                onClick={() => setIsInspectorOpen(false)}
                className={`p-1.5 rounded-lg border hover:bg-slate-900 transition-all ${
                  isDark ? 'border-slate-800 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 max-h-[400px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`border-b ${borderClass} ${textMutedClass} uppercase tracking-wider font-semibold`}>
                    <th className="py-2.5">Protocol</th>
                    <th className="py-2.5">Local Address</th>
                    <th className="py-2.5">Foreign Address</th>
                    <th className="py-2.5 text-right">State</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${borderClass}`}>
                  {selectedProcess.sockets && selectedProcess.sockets.length > 0 ? (
                    selectedProcess.sockets.map((sock, i) => (
                      <tr key={i} className="hover:bg-slate-900/10">
                        <td className="py-3 font-semibold text-primary">{sock.protocol}</td>
                        <td className="py-3 font-mono">{sock.local_address}</td>
                        <td className="py-3 font-mono">{sock.foreign_address}</td>
                        <td className="py-3 text-right font-mono text-slate-450">{sock.state}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-500">
                        No active connection sockets found for this process.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className={`px-6 py-4 border-t flex justify-end bg-slate-950/20 ${borderClass}`}>
              <button
                onClick={() => setIsInspectorOpen(false)}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className={`mt-auto border-t px-6 py-6 text-center text-xs ${borderClass} ${textMutedClass} ${isDark ? 'bg-slate-950' : 'bg-white shadow-inner'}`}>
        <p>© 2026 NetSentry. All rights reserved. Administrator privileges required for firewall adjustments.</p>
      </footer>

      {/* Buy Me a Coffee / Donation Modal */}
      <DonateModal open={isDonateOpen} onOpenChange={setIsDonateOpen} />
    </div>
  );
}
