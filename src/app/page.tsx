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
  Cpu, 
  Network,
  RefreshCw,
  Terminal,
  Grid
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

// Types matching the Rust backend
interface ProcessNetworkData {
  pid: number;
  name: string;
  exe_path: string;
  inbound_rate: number;
  outbound_rate: number;
  connections_count: number;
  is_paused: boolean;
}

export default function NetSentryDashboard() {
  const [isClient, setIsClient] = useState(false);
  const [processes, setProcesses] = useState<ProcessNetworkData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [chartData, setChartData] = useState<{ time: string; inbound: number; outbound: number }[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<ProcessNetworkData | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tauriStatus, setTauriStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  useEffect(() => {
    setIsClient(true);
    
    // Check if running in Tauri environment
    const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;
    
    if (isTauri) {
      setTauriStatus('connected');
      
      // Import Tauri API dynamically
      const setupTauri = async () => {
        const { listen } = await import('@tauri-apps/api/event');
        
        const unlisten = await listen<ProcessNetworkData[]>('network-data', (event) => {
          setProcesses(event.payload);
          
          // Calculate overall stats for the graph
          const totalInbound = event.payload.reduce((sum, p) => sum + p.inbound_rate, 0);
          const totalOutbound = event.payload.reduce((sum, p) => sum + p.outbound_rate, 0);
          
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
      // Mock data for development and web preview
      const interval = setInterval(() => {
        const mockProcesses: ProcessNetworkData[] = [
          { pid: 4812, name: 'chrome.exe', exe_path: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', inbound_rate: Math.random() * 250 + 10, outbound_rate: Math.random() * 80 + 2, connections_count: 14, is_paused: false },
          { pid: 9024, name: 'spotify.exe', exe_path: 'C:\\Users\\User\\AppData\\Roaming\\Spotify\\spotify.exe', inbound_rate: Math.random() * 120, outbound_rate: Math.random() * 12, connections_count: 5, is_paused: false },
          { pid: 1102, name: 'discord.exe', exe_path: 'C:\\Users\\User\\AppData\\Local\\Discord\\app-1.0.9001\\discord.exe', inbound_rate: Math.random() * 45, outbound_rate: Math.random() * 8, connections_count: 8, is_paused: false },
          { pid: 3412, name: 'steam.exe', exe_path: 'C:\\Program Files (x86)\\Steam\\steam.exe', inbound_rate: Math.random() * 950, outbound_rate: Math.random() * 40, connections_count: 12, is_paused: false },
          { pid: 2123, name: 'svchost.exe', exe_path: 'C:\\Windows\\System32\\svchost.exe', inbound_rate: Math.random() * 5, outbound_rate: Math.random() * 1, connections_count: 35, is_paused: false },
        ];

        mockProcesses.sort((a, b) => (b.inbound_rate + b.outbound_rate) - (a.inbound_rate + a.outbound_rate));
        setProcesses(mockProcesses);

        const totalInbound = mockProcesses.reduce((sum, p) => sum + p.inbound_rate, 0);
        const totalOutbound = mockProcesses.reduce((sum, p) => sum + p.outbound_rate, 0);

        setChartData(prev => {
          const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const newData = [...prev, { time: now, inbound: Math.round(totalInbound), outbound: Math.round(totalOutbound) }];
          if (newData.length > 20) newData.shift();
          return newData;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, []);

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
    const key = `${proc.pid}-${proc.exe_path}`;
    setActionLoading(key);
    
    try {
      if (tauriStatus === 'connected') {
        const { invoke } = await import('@tauri-apps/api/core');
        if (proc.is_paused) {
          await invoke('resume_inbound_traffic', { exePath: proc.exe_path, name: proc.name });
        } else {
          await invoke('pause_inbound_traffic', { exePath: proc.exe_path, name: proc.name });
        }
      } else {
        // Mock state toggle
        setProcesses(prev => prev.map(p => p.pid === proc.pid ? { ...p, is_paused: !p.is_paused } : p));
      }
    } catch (e) {
      console.error(e);
      alert(`Firewall action failed: ${e}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResumeAll = async () => {
    setActionLoading('resume-all');
    try {
      if (tauriStatus === 'connected') {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('resume_all_traffic');
      } else {
        setProcesses(prev => prev.map(p => ({ ...p, is_paused: false })));
      }
      alert('Successfully resumed all blocked inbound traffic rules!');
    } catch (e) {
      console.error(e);
      alert(`Resume action failed: ${e}`);
    } finally {
      setActionLoading(null);
    }
  };

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Neon Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/60 border-b border-slate-800/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-tr from-cyan-500 to-indigo-500 rounded-xl shadow-lg shadow-cyan-500/20">
            <Shield className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              NetSentry
            </h1>
            <p className="text-[10px] text-cyan-400 tracking-widest uppercase font-semibold">
              Windows Security & Bandwidth Monitor
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-xs bg-slate-900 border border-slate-800 rounded-full px-3 py-1.5">
            <span className={`w-2 h-2 rounded-full ${tauriStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="text-slate-400">
              {tauriStatus === 'connected' ? 'Tauri Service Active' : 'Sandbox Preview Mode'}
            </span>
          </div>

          <button 
            onClick={handleResumeAll}
            disabled={actionLoading !== null}
            className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 disabled:from-slate-800 disabled:to-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-lg shadow-red-500/10 hover:shadow-red-500/25 transition-all duration-200 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{actionLoading === 'resume-all' ? 'Resuming...' : 'Global Resume All'}</span>
          </button>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        
        {/* Real-time Network Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Overall Inbound</p>
              <h3 className="text-3xl font-extrabold text-cyan-400 mt-1">
                {overallStats.inbound > 1024 
                  ? `${(overallStats.inbound / 1024).toFixed(2)} MB/s` 
                  : `${overallStats.inbound} KB/s`}
              </h3>
            </div>
            <div className="p-3 bg-cyan-950/40 border border-cyan-800/30 rounded-xl">
              <ArrowDown className="w-6 h-6 text-cyan-400" />
            </div>
          </div>

          <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Overall Outbound</p>
              <h3 className="text-3xl font-extrabold text-indigo-400 mt-1">
                {overallStats.outbound > 1024 
                  ? `${(overallStats.outbound / 1024).toFixed(2)} MB/s` 
                  : `${overallStats.outbound} KB/s`}
              </h3>
            </div>
            <div className="p-3 bg-indigo-950/40 border border-indigo-800/30 rounded-xl">
              <ArrowUp className="w-6 h-6 text-indigo-400" />
            </div>
          </div>

          <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Sockets</p>
              <h3 className="text-3xl font-extrabold text-purple-400 mt-1">
                {overallStats.totalConnections}
              </h3>
            </div>
            <div className="p-3 bg-purple-950/40 border border-purple-800/30 rounded-xl">
              <Network className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Real-time Network Usage Chart */}
        <div className="bg-slate-900/20 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
                <span>Overall Real-Time Bandwidth</span>
              </h2>
              <p className="text-xs text-slate-400">Continuous telemetry of network throughput</p>
            </div>
          </div>
          <div className="h-64 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOutbound" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={10} tickLine={false} label={{ value: 'KB/s', angle: -90, position: 'insideLeft', fill: '#475569' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                  />
                  <Area type="monotone" dataKey="inbound" name="Inbound Rate (KB/s)" stroke="#22d3ee" strokeWidth={2} fillOpacity={1} fill="url(#colorInbound)" />
                  <Area type="monotone" dataKey="outbound" name="Outbound Rate (KB/s)" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#colorOutbound)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xs text-slate-500 space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Awaiting traffic signals...</span>
              </div>
            )}
          </div>
        </div>

        {/* Process Connection Table section */}
        <div className="bg-slate-900/30 backdrop-blur-xl border border-slate-800/80 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Terminal className="w-5 h-5 text-indigo-400" />
                <span>Process Network Controller</span>
              </h2>
              <p className="text-xs text-slate-400">Enable/disable inbound firewall block rules dynamically</p>
            </div>
            
            {/* Search Bar */}
            <div className="relative max-w-sm w-full">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-slate-500" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by name or PID..."
                className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-850 bg-slate-950/40 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Process Name</th>
                  <th className="px-6 py-4">PID</th>
                  <th className="px-6 py-4">Inbound Rate</th>
                  <th className="px-6 py-4">Outbound Rate</th>
                  <th className="px-6 py-4">Sockets</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredProcesses.length > 0 ? (
                  filteredProcesses.map((proc) => {
                    const key = `${proc.pid}-${proc.exe_path}`;
                    const isLoading = actionLoading === key;
                    
                    return (
                      <tr 
                        key={key} 
                        className={`hover:bg-slate-900/20 transition-all ${proc.is_paused ? 'bg-red-500/5' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <span className={`w-2.5 h-2.5 rounded-full ${proc.is_paused ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                            <div>
                              <div className="font-bold text-sm text-slate-200">{proc.name}</div>
                              <div className="text-[10px] text-slate-500 max-w-xs truncate" title={proc.exe_path}>
                                {proc.exe_path || 'System Process'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-400">{proc.pid}</td>
                        <td className="px-6 py-4 font-mono text-sm text-cyan-400">
                          {proc.inbound_rate > 1024 
                            ? `${(proc.inbound_rate / 1024).toFixed(1)} MB/s` 
                            : `${proc.inbound_rate.toFixed(1)} KB/s`}
                        </td>
                        <td className="px-6 py-4 font-mono text-sm text-indigo-400">
                          {proc.outbound_rate > 1024 
                            ? `${(proc.outbound_rate / 1024).toFixed(1)} MB/s` 
                            : `${proc.outbound_rate.toFixed(1)} KB/s`}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-400">{proc.connections_count}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleTogglePause(proc)}
                            disabled={actionLoading !== null}
                            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all border ${
                              proc.is_paused 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25' 
                                : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/25'
                            }`}
                          >
                            {isLoading ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : proc.is_paused ? (
                              <Play className="w-3.5 h-3.5" />
                            ) : (
                              <Pause className="w-3.5 h-3.5" />
                            )}
                            <span>
                              {isLoading 
                                ? 'Updating...' 
                                : proc.is_paused 
                                  ? 'Resume Inbound' 
                                  : 'Pause Inbound'}
                            </span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 text-sm">
                      No active processes detected
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      <footer className="mt-auto border-t border-slate-900 bg-slate-950 px-6 py-6 text-center text-xs text-slate-500">
        <p>© 2026 NetSentry. All rights reserved. Administrator privileges required for firewall changes.</p>
      </footer>
    </div>
  );
}
