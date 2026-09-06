'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Activity, 
  ArrowDown, 
  ArrowUp, 
  HardDrive, 
  Cpu, 
  Zap, 
  FolderOpen, 
  Trash2, 
  Pause, 
  Play, 
  RefreshCw, 
  Calendar, 
  Radio, 
  Layers 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip as ReTooltip, 
  ResponsiveContainer 
} from 'recharts';
import { AppIcon, getProcessBrandMeta } from './app-icons';
import type { ProcessNetworkData, GroupedProcess } from '@/app/page';

export interface AppHistoryEntry {
  date: string;
  inbound_mb: number;
  outbound_mb: number;
  total_mb: number;
}

interface AppDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  process: ProcessNetworkData | GroupedProcess | null;
  isDark: boolean;
  tauriStatus: 'connected' | 'disconnected' | 'checking';
  actionLoading: string | null;
  onTogglePause: (proc: ProcessNetworkData | GroupedProcess) => void;
  onKillProcess: (proc: ProcessNetworkData | GroupedProcess) => void;
  onOpenFileLocation: (proc: ProcessNetworkData | GroupedProcess) => void;
}

export default function AppDetailsDialog({
  isOpen,
  onClose,
  process,
  isDark,
  tauriStatus,
  actionLoading,
  onTogglePause,
  onKillProcess,
  onOpenFileLocation,
}: AppDetailsDialogProps) {
  const [historyDays, setHistoryDays] = useState<number>(7);
  const [historyData, setHistoryData] = useState<AppHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'sockets'>('overview');

  const procName = process?.name || 'Unknown Application';
  const exePath = process?.exe_path || '';
  const brand = getProcessBrandMeta(procName, exePath);
  const primaryPid = process ? ('pids' in process ? process.pids[0] : process.pid) : 0;
  const pidsList = process ? ('pids' in process ? process.pids : [process.pid]) : [];
  const iconUrl = process ? ('icon' in process ? process.icon : null) : null;

  const isToggleLoading = actionLoading === `pause-${primaryPid}-${exePath}`;
  const isKillLoading = actionLoading === `kill-${primaryPid}`;

  // Fetch application history from SQLite
  useEffect(() => {
    if (!isOpen || !process) return;

    let isMounted = true;
    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        if (tauriStatus === 'connected') {
          const { invoke } = await import('@tauri-apps/api/core');
          const lookupKey = exePath || procName;
          const data = await invoke<AppHistoryEntry[]>('get_app_history', { 
            appKey: lookupKey, 
            days: historyDays 
          });
          if (isMounted) {
            setHistoryData(data.reverse()); // oldest to newest for chart
          }
        } else {
          // Fallback demo data for non-Tauri preview
          if (isMounted) {
            const today = new Date();
            const demo = Array.from({ length: historyDays }).map((_, i) => {
              const d = new Date(today);
              d.setDate(d.getDate() - (historyDays - 1 - i));
              const dateStr = d.toISOString().split('T')[0];
              const inMb = Number((Math.random() * 5 + 0.5).toFixed(1));
              const outMb = Number((Math.random() * 2 + 0.2).toFixed(1));
              return {
                date: dateStr.slice(5),
                inbound_mb: inMb,
                outbound_mb: outMb,
                total_mb: Number((inMb + outMb).toFixed(1))
              };
            });
            setHistoryData(demo);
          }
        }
      } catch (err) {
        console.warn('Failed to load app history:', err);
      } finally {
        if (isMounted) setLoadingHistory(false);
      }
    };

    fetchHistory();
    return () => { isMounted = false; };
  }, [isOpen, process, historyDays, tauriStatus, exePath, procName]);

  if (!isOpen || !process) return null;

  const sockets = process.sockets || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-4xl max-h-[90vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden transition-all ${
          isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header with Native App Icon & Metadata */}
        <div className={`px-6 py-5 border-b flex items-start justify-between gap-4 ${isDark ? 'border-slate-850 bg-slate-900/40' : 'border-slate-100 bg-slate-50/50'}`}>
          <div className="flex items-start gap-4 min-w-0">
            <AppIcon 
              name={procName} 
              exePath={exePath} 
              iconUrl={iconUrl}
              large 
            />
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bricolage text-xl font-extrabold tracking-tight truncate">
                  {brand.label || procName}
                </h2>
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${brand.badgeBg}`}>
                  {brand.category}
                </span>
                {process.is_paused ? (
                  <span className="bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    Firewall Blocked
                  </span>
                ) : (
                  <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Active
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground font-mono truncate max-w-lg" title={exePath}>
                {exePath || 'System Process'}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground pt-0.5">
                <span>{pidsList.length > 1 ? `${pidsList.length} Running Instances` : `PID ${primaryPid}`}</span>
                <span>•</span>
                <span>{sockets.length} Active Sockets</span>
                <span>•</span>
                <span>{process.memory_usage} MB RAM</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className={`p-2 rounded-xl border transition-colors ${
                isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className={`px-6 py-3 border-b flex items-center justify-between gap-3 flex-wrap ${isDark ? 'border-slate-850 bg-slate-900/20' : 'border-slate-100 bg-slate-50/30'}`}>
          <div className="flex items-center gap-2">
            {/* Toggle Pause / Block Button */}
            <button
              onClick={() => onTogglePause(process)}
              disabled={isToggleLoading || tauriStatus !== 'connected'}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                process.is_paused
                  ? 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 shadow-md shadow-emerald-500/20'
                  : 'bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20'
              } disabled:opacity-50`}
            >
              {isToggleLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : process.is_paused ? (
                <Play className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Pause className="w-3.5 h-3.5 fill-current" />
              )}
              <span>{process.is_paused ? 'Resume Network Access' : 'Pause & Block Data'}</span>
            </button>

            {/* Open Folder Button */}
            {exePath && (
              <button
                onClick={() => onOpenFileLocation(process)}
                disabled={tauriStatus !== 'connected'}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  isDark ? 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300' : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                }`}
                title="Locate Executable in File Explorer"
              >
                <FolderOpen className="w-3.5 h-3.5 text-primary" />
                <span>Show in Folder</span>
              </button>
            )}

            {/* Force Kill Button */}
            <button
              onClick={() => onKillProcess(process)}
              disabled={isKillLoading || tauriStatus !== 'connected'}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                isDark ? 'border-red-500/20 bg-red-500/5 hover:bg-red-500/15 text-red-400' : 'border-red-200 bg-red-50 hover:bg-red-100 text-red-600'
              } disabled:opacity-50`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Terminate Process</span>
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/50">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'overview' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Usage & Analytics
            </button>
            <button
              onClick={() => setActiveTab('sockets')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'sockets' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>Active Sockets</span>
              <span className="px-1.5 py-0.2 bg-primary/20 text-primary text-[10px] rounded-full font-bold">
                {sockets.length}
              </span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'overview' ? (
            <>
              {/* Telemetry Metric KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className={`p-4 rounded-2xl border space-y-1.5 ${isDark ? 'border-slate-850 bg-slate-900/30' : 'border-slate-200/80 bg-slate-50/70'}`}>
                  <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                    <span>Total Transferred</span>
                    <HardDrive className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="text-2xl font-black text-primary font-mono">
                    {process.total_data_mb >= 1024 
                      ? `${(process.total_data_mb / 1024).toFixed(2)} GB` 
                      : `${process.total_data_mb.toFixed(1)} MB`}
                  </div>
                  <p className="text-[10px] text-muted-foreground">Cumulative session & recorded</p>
                </div>

                <div className={`p-4 rounded-2xl border space-y-1.5 ${isDark ? 'border-slate-850 bg-slate-900/30' : 'border-slate-200/80 bg-slate-50/70'}`}>
                  <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                    <span>Inbound Download</span>
                    <ArrowDown className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-black text-emerald-500 font-mono">
                    {process.inbound_rate.toFixed(1)} <span className="text-xs font-normal">KB/s</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Live incoming packet stream</p>
                </div>

                <div className={`p-4 rounded-2xl border space-y-1.5 ${isDark ? 'border-slate-850 bg-slate-900/30' : 'border-slate-200/80 bg-slate-50/70'}`}>
                  <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                    <span>Outbound Upload</span>
                    <ArrowUp className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="text-2xl font-black text-primary font-mono">
                    {process.outbound_rate.toFixed(1)} <span className="text-xs font-normal">KB/s</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Live outgoing packet stream</p>
                </div>

                <div className={`p-4 rounded-2xl border space-y-1.5 ${isDark ? 'border-slate-850 bg-slate-900/30' : 'border-slate-200/80 bg-slate-50/70'}`}>
                  <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                    <span>Hardware Usage</span>
                    <Cpu className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="text-2xl font-black text-foreground font-mono">
                    {process.cpu_usage.toFixed(1)}%
                  </div>
                  <p className="text-[10px] text-muted-foreground">{process.memory_usage} MB Working Memory</p>
                </div>
              </div>

              {/* Data Usage Over Time (SQLite Persistence Chart) */}
              <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'border-slate-850 bg-slate-900/20' : 'border-slate-200/80 bg-slate-50/40'}`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="font-bricolage text-sm font-bold flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      Historical Data Usage Over Time
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Stored in local SQLite database ({historyDays} days retention)
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 bg-background border border-border/70 rounded-xl p-1 text-xs">
                    {[
                      { days: 7, label: '7 Days' },
                      { days: 14, label: '14 Days' },
                      { days: 30, label: '30 Days' },
                    ].map(d => (
                      <button
                        key={d.days}
                        onClick={() => setHistoryDays(d.days)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                          historyDays === d.days
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* History Timeline Chart */}
                <div className="h-56 w-full">
                  {historyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={historyData}>
                        <defs>
                          <linearGradient id="appHistoryGradIn" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="appHistoryGradOut" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="date" 
                          stroke="currentColor" 
                          className="text-muted-foreground" 
                          fontSize={10} 
                          tickLine={false} 
                        />
                        <YAxis 
                          stroke="currentColor" 
                          className="text-muted-foreground" 
                          fontSize={10} 
                          tickLine={false} 
                          unit=" MB"
                        />
                        <ReTooltip 
                          contentStyle={{ 
                            backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                            borderColor: isDark ? '#334155' : '#e2e8f0', 
                            borderRadius: '12px',
                            fontSize: '12px',
                            color: isDark ? '#f8fafc' : '#0f172a'
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="inbound_mb" 
                          name="Download (MB)" 
                          stroke="#10b981" 
                          strokeWidth={2} 
                          fillOpacity={1} 
                          fill="url(#appHistoryGradIn)" 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="outbound_mb" 
                          name="Upload (MB)" 
                          stroke="#f97316" 
                          strokeWidth={2} 
                          fillOpacity={1} 
                          fill="url(#appHistoryGradOut)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs space-y-2">
                      <Activity className="w-6 h-6 text-muted-foreground/40 animate-pulse" />
                      <span>{loadingHistory ? 'Loading historical bandwidth telemetry...' : 'No historical data recorded yet for this application today.'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Running Process Instances breakdown */}
              {pidsList.length > 1 && (
                <div className={`p-4 rounded-2xl border space-y-2.5 ${isDark ? 'border-slate-850 bg-slate-900/20' : 'border-slate-200/80 bg-slate-50/50'}`}>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary" />
                      Active Process Instances ({pidsList.length} PIDs)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {pidsList.map(pid => (
                      <span 
                        key={pid} 
                        className={`font-mono text-xs px-2.5 py-1 rounded-lg border font-semibold ${
                          isDark ? 'border-slate-800 bg-slate-900 text-slate-300' : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        PID {pid}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Active Sockets Table View */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bricolage text-sm font-bold flex items-center gap-2">
                    <Radio className="w-4 h-4 text-primary" />
                    Open Network Sockets & Ports
                  </h3>
                  <p className="text-xs text-muted-foreground">Real-time TCP/UDP socket telemetry for this program</p>
                </div>
                <span className="text-xs font-mono text-muted-foreground">{sockets.length} Sockets Open</span>
              </div>

              {sockets.length > 0 ? (
                <div className="border border-border/80 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className={`border-b border-border/80 ${isDark ? 'bg-slate-900/60' : 'bg-slate-100/70'} text-muted-foreground uppercase tracking-wider font-semibold text-[10px]`}>
                        <th className="px-4 py-3">Protocol</th>
                        <th className="px-4 py-3">Local Address</th>
                        <th className="px-4 py-3">Foreign Address</th>
                        <th className="px-4 py-3 text-right">State</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 font-mono">
                      {sockets.map((s, idx) => (
                        <tr 
                          key={idx} 
                          className={`transition-colors ${isDark ? 'hover:bg-slate-900/40' : 'hover:bg-slate-50'}`}
                        >
                          <td className="px-4 py-2.5 font-bold">
                            <span className={s.protocol === 'TCP' ? 'text-cyan-500' : 'text-amber-500'}>
                              {s.protocol}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground">{s.local_address}</td>
                          <td className="px-4 py-2.5 font-semibold text-foreground">{s.foreign_address}</td>
                          <td className="px-4 py-2.5 text-right">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              s.state === 'ESTABLISHED' 
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                                : s.state === 'LISTEN'
                                  ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                  : 'bg-muted text-muted-foreground'
                            }`}>
                              {s.state}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground text-xs space-y-2">
                  <Zap className="w-6 h-6 mx-auto text-muted-foreground/30" />
                  <p>No active network sockets currently open by this application.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
