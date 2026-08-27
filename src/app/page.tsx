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
  ListFilter,
  Eye,
  X,
  PlusCircle,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

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

export default function NetSentryDashboard() {
  const [isClient, setIsClient] = useState(false);
  const [processes, setProcesses] = useState<ProcessNetworkData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [chartData, setChartData] = useState<{ time: string; inbound: number; outbound: number }[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tauriStatus, setTauriStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
  // New States for Features
  const [selectedProcess, setSelectedProcess] = useState<ProcessNetworkData | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [quotaLimit, setQuotaLimit] = useState<number>(1000); // MB
  const [accumulatedUsage, setAccumulatedUsage] = useState<number>(0); // MB
  const [securityLogs, setSecurityLogs] = useState<LogEntry[]>([
    { timestamp: new Date().toLocaleTimeString(), message: "NetSentry security engine initialized.", type: "info" }
  ]);
  const [currentTab, setCurrentTab] = useState<'monitor' | 'logs'>('monitor');

  // Toggle Theme
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
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
        
        const unlisten = await listen<ProcessNetworkData[]>('network-data', (event) => {
          setProcesses(event.payload);
          
          // Calculate overall stats
          const totalInbound = event.payload.reduce((sum, p) => sum + p.inbound_rate, 0);
          const totalOutbound = event.payload.reduce((sum, p) => sum + p.outbound_rate, 0);
          
          // Accumulate usage (KB -> MB)
          const totalKB = totalInbound + totalOutbound;
          setAccumulatedUsage(prev => {
            const addedMB = (totalKB / 1024) / 10; // Divided by 10 roughly for 1-sec ticks
            const newTotal = prev + addedMB;
            if (newTotal >= quotaLimit && prev < quotaLimit) {
              addLog(`Alert: Bandwidth quota of ${quotaLimit} MB exceeded!`, 'alert');
            }
            return newTotal;
          });

          // Threat Audit logs (e.g. flag processes running from temp dirs or heavy ports)
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
          unlisten();
        };
      };

      setupTauri();
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

  // Theme configuration
  const isDark = theme === 'dark';
  const bgClass = isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900";
  const borderClass = isDark ? "border-slate-800/80" : "border-slate-200";
  const cardClass = isDark ? "bg-slate-900/40 backdrop-blur-xl border border-slate-800/80" : "bg-white border border-slate-200 shadow-sm";
  const headerBgClass = isDark ? "bg-slate-950/60" : "bg-white/80";
  const textMutedClass = isDark ? "text-slate-400" : "text-slate-500";
  const tableHeaderBg = isDark ? "bg-slate-950/40" : "bg-slate-100";
  const tableRowHover = isDark ? "hover:bg-slate-900/20" : "hover:bg-slate-50";

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${bgClass}`}>
      {/* Visual background glows */}
      {isDark && (
        <>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        </>
      )}

      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b px-6 py-4 flex items-center justify-between transition-colors duration-200 ${headerBgClass} ${borderClass}`}>
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-tr from-cyan-500 to-indigo-500 rounded-xl shadow-md">
            <Shield className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-500 to-indigo-500 bg-clip-text text-transparent">
              NetSentry
            </h1>
            <p className="text-[10px] text-cyan-500 tracking-widest uppercase font-semibold">
              Windows Security & Bandwidth Monitor
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Navigation Tabs */}
          <div className={`flex items-center border rounded-xl p-1 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
            <button 
              onClick={() => setCurrentTab('monitor')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                currentTab === 'monitor' 
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-sm' 
                  : textMutedClass
              }`}
            >
              Monitor Dashboard
            </button>
            <button 
              onClick={() => setCurrentTab('logs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                currentTab === 'logs' 
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-sm' 
                  : textMutedClass
              }`}
            >
              Security Logs ({securityLogs.length})
            </button>
          </div>

          {/* Theme Toggle Button */}
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              isDark 
                ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-850' 
                : 'bg-white border-slate-200 text-indigo-600 hover:bg-slate-100 shadow-sm'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className={`flex items-center space-x-2 text-xs border rounded-full px-3 py-1.5 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${tauriStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className={textMutedClass}>
              {tauriStatus === 'connected' ? 'Tauri Service Active' : 'Web Sandbox'}
            </span>
          </div>

          <button 
            onClick={handleResumeAll}
            disabled={actionLoading !== null || tauriStatus !== 'connected'}
            className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-md cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Firewall Rules</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        
        {/* Sandbox Warning */}
        {tauriStatus === 'disconnected' && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-amber-500/20 text-amber-500 rounded-xl mt-0.5 md:mt-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-500">Local Telemetry Unavailable</h3>
                <p className={`text-xs mt-1 ${textMutedClass}`}>
                  NetSentry requires process-level socket tracing and administrative capabilities to manage firewall rules and monitor network traffic. These components cannot run inside standard web browsers.
                </p>
              </div>
            </div>
          </div>
        )}

        {currentTab === 'monitor' ? (
          <>
            {/* Session Stats + Data Limit Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Data Quota Widget */}
              <div className={`${cardClass} p-5 flex flex-col justify-between`}>
                <div className="flex items-center justify-between">
                  <p className={`text-xs font-medium uppercase tracking-wider ${textMutedClass}`}>Bandwidth Quota</p>
                  <TrendingUp className="w-4 h-4 text-cyan-500" />
                </div>
                <div className="mt-3">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-2xl font-extrabold text-cyan-500">{accumulatedUsage.toFixed(1)} <span className="text-xs">MB</span></span>
                    <span className={`text-xs font-semibold ${textMutedClass}`}>Limit: {quotaLimit} MB</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-350 ${accumulatedUsage >= quotaLimit ? 'bg-red-500' : 'bg-cyan-500'}`}
                      style={{ width: `${Math.min((accumulatedUsage / quotaLimit) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3 border-slate-800/40">
                  <span className={`text-[10px] uppercase font-bold ${textMutedClass}`}>Adjust limit (MB):</span>
                  <input 
                    type="number"
                    value={quotaLimit}
                    onChange={(e) => setQuotaLimit(Math.max(1, Number(e.target.value)))}
                    className={`w-20 px-2 py-1 text-xs text-center border rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-100 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className={`${cardClass} p-5 flex items-center justify-between`}>
                <div>
                  <p className={`text-xs font-medium uppercase tracking-wider ${textMutedClass}`}>Total Inbound</p>
                  <h3 className="text-3xl font-extrabold text-cyan-500 mt-1">
                    {overallStats.inbound > 1024 
                      ? `${(overallStats.inbound / 1024).toFixed(2)} MB/s` 
                      : `${overallStats.inbound} KB/s`}
                  </h3>
                </div>
                <div className={`p-3 rounded-xl ${isDark ? 'bg-cyan-950/40 border border-cyan-800/30' : 'bg-cyan-50 border border-cyan-100'}`}>
                  <ArrowDown className="w-6 h-6 text-cyan-500" />
                </div>
              </div>

              <div className={`${cardClass} p-5 flex items-center justify-between`}>
                <div>
                  <p className={`text-xs font-medium uppercase tracking-wider ${textMutedClass}`}>Total Outbound</p>
                  <h3 className="text-3xl font-extrabold text-indigo-500 mt-1">
                    {overallStats.outbound > 1024 
                      ? `${(overallStats.outbound / 1024).toFixed(2)} MB/s` 
                      : `${overallStats.outbound} KB/s`}
                  </h3>
                </div>
                <div className={`p-3 rounded-xl ${isDark ? 'bg-indigo-950/40 border border-indigo-800/30' : 'bg-indigo-50 border border-indigo-100'}`}>
                  <ArrowUp className="w-6 h-6 text-indigo-500" />
                </div>
              </div>

              <div className={`${cardClass} p-5 flex items-center justify-between`}>
                <div>
                  <p className={`text-xs font-medium uppercase tracking-wider ${textMutedClass}`}>Active Sockets</p>
                  <h3 className="text-3xl font-extrabold text-purple-500 mt-1">
                    {overallStats.totalConnections}
                  </h3>
                </div>
                <div className={`p-3 rounded-xl ${isDark ? 'bg-purple-950/40 border border-purple-800/30' : 'bg-purple-50 border border-purple-100'}`}>
                  <Network className="w-6 h-6 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className={`${cardClass} p-6`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-cyan-500 animate-pulse" />
                    <span>Real-Time Traffic Telemetry</span>
                  </h2>
                  <p className={`text-xs ${textMutedClass}`}>Session telemetry of network throughput</p>
                </div>
              </div>
              <div className="h-60 w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorOutbound" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" stroke={isDark ? "#475569" : "#94a3b8"} fontSize={10} tickLine={false} />
                      <YAxis stroke={isDark ? "#475569" : "#94a3b8"} fontSize={10} tickLine={false} label={{ value: 'KB/s', angle: -90, position: 'insideLeft', fill: isDark ? '#475569' : '#94a3b8' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                          borderColor: isDark ? '#334155' : '#e2e8f0', 
                          borderRadius: '8px', 
                          color: isDark ? '#f8fafc' : '#0f172a' 
                        }}
                      />
                      <Area type="monotone" dataKey="inbound" name="Inbound Rate (KB/s)" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorInbound)" />
                      <Area type="monotone" dataKey="outbound" name="Outbound Rate (KB/s)" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorOutbound)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center text-xs text-slate-400 py-10 space-y-3">
                    <Network className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                    <span className="text-center font-medium max-w-sm">
                      {tauriStatus === 'connected' 
                        ? 'Awaiting live traffic signals from the Tauri service...' 
                        : 'Connect Tauri Desktop client to capture real-time traffic statistics.'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Controller Table */}
            <div className={`${cardClass} overflow-hidden`}>
              <div className={`p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 ${borderClass}`}>
                <div>
                  <h2 className="text-lg font-bold flex items-center space-x-2">
                    <Terminal className="w-5 h-5 text-indigo-500" />
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
                        ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-cyan-500 focus:ring-cyan-500 focus:bg-slate-950 placeholder-slate-500' 
                        : 'bg-white border-slate-200 text-slate-900 focus:border-cyan-500 focus:ring-cyan-500 focus:bg-white placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b text-xs font-semibold uppercase tracking-wider ${borderClass} ${tableHeaderBg} ${textMutedClass}`}>
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
                  <tbody className={`divide-y ${borderClass}`}>
                    {filteredProcesses.length > 0 ? (
                      filteredProcesses.map((proc) => {
                        const key = `proc-${proc.pid}`;
                        const isToggleLoading = actionLoading === `pause-${proc.pid}-${proc.exe_path}`;
                        const isKillLoading = actionLoading === `kill-${proc.pid}`;
                        const isSuspicious = proc.connections_count > 25 && proc.cpu_usage > 50 && proc.name !== 'chrome.exe' && proc.name !== 'msedge.exe' && proc.name !== 'firefox.exe';

                        return (
                          <tr 
                            key={key} 
                            className={`transition-all ${tableRowHover} ${proc.is_paused ? 'bg-red-500/5' : ''} ${isSuspicious ? 'bg-amber-500/5' : ''}`}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <span className={`w-2.5 h-2.5 rounded-full ${
                                  proc.is_paused ? 'bg-red-500 animate-pulse' : isSuspicious ? 'bg-amber-500 animate-bounce' : 'bg-emerald-500'
                                }`} />
                                <div>
                                  <div className="flex items-center space-x-1.5">
                                    <span className="font-bold text-sm">{proc.name}</span>
                                    {isSuspicious && (
                                      <span className="bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full tracking-wider uppercase">
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
                            <td className="px-6 py-4 font-mono text-sm text-cyan-500">
                              {proc.inbound_rate > 1024 
                                ? `${(proc.inbound_rate / 1024).toFixed(1)} MB/s` 
                                : `${proc.inbound_rate.toFixed(1)} KB/s`}
                            </td>
                            <td className="px-6 py-4 font-mono text-sm text-indigo-500">
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
                                  <FolderOpen className="w-3.5 h-3.5 text-slate-400 hover:text-cyan-500" />
                                </button>

                                {/* Connections Inspector */}
                                <button
                                  onClick={() => openInspector(proc)}
                                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                    isDark ? 'bg-slate-900 border-slate-800 hover:bg-slate-800' : 'bg-white border-slate-200 hover:bg-slate-100'
                                  }`}
                                  title="Inspect Active Sockets"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-400 hover:text-cyan-500" />
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
                                >
                                  {isToggleLoading ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : proc.is_paused ? (
                                    <Play className="w-3 h-3" />
                                  ) : (
                                    <Pause className="w-3 h-3" />
                                  )}
                                  <span>{proc.is_paused ? 'Resume' : 'Block'}</span>
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
          <div className={`${cardClass} p-6 space-y-4`}>
            <div className="flex items-center justify-between border-b border-slate-800/40 pb-4">
              <div>
                <h2 className="text-lg font-bold flex items-center space-x-2">
                  <Terminal className="w-5 h-5 text-indigo-500" />
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
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          : isDark ? 'bg-slate-900/40 border-slate-850 text-slate-300' : 'bg-slate-100/60 border-slate-200 text-slate-700'
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

      </main>

      {/* Sockets Details Modal */}
      {isInspectorOpen && selectedProcess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`px-6 py-4 border-b flex items-center justify-between ${borderClass}`}>
              <div>
                <h3 className="text-base font-bold flex items-center space-x-2">
                  <Eye className="w-5 h-5 text-cyan-500" />
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
                        <td className="py-3 font-semibold text-cyan-500">{sock.protocol}</td>
                        <td className="py-3 font-mono">{sock.local_address}</td>
                        <td className="py-3 font-mono">{sock.foreign_address}</td>
                        <td className="py-3 text-right font-mono text-slate-400">{sock.state}</td>
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
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-600 hover:to-indigo-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
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
    </div>
  );
}
