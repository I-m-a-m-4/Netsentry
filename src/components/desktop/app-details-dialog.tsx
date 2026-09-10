'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Calendar
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip as ReTooltip, 
  ResponsiveContainer 
} from 'recharts';
import type { ProcessNetworkData, GroupedProcess } from '@/app/dashboard/page';
import { AppIcon, getProcessBrandMeta } from './app-icons';

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
  volumeUnit?: 'auto' | 'mb';
}

// Preset definitions matching Zeneva pattern
type HistoryPreset = 'today' | '7d' | '30d' | 'all';
const PRESETS: { key: HistoryPreset; label: string; days: number }[] = [
  { key: 'today', label: 'Today',        days: 1   },
  { key: '7d',    label: 'Last 7 Days',  days: 7   },
  { key: '30d',   label: 'Last 30 Days', days: 30  },
  { key: 'all',   label: 'All Time',     days: 365 },
];

function fmtMb(mb: number): string {
  if (!Number.isFinite(mb) || mb <= 0) return '0 MB';
  if (mb >= 1024) {
    return `${(mb / 1024).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} GB`;
  }
  const rounded = mb >= 10 ? Math.round(mb) : Number(mb.toFixed(1));
  return `${rounded.toLocaleString()} MB`;
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
  const [preset, setPreset]           = useState<HistoryPreset>('7d');
  const [historyData, setHistoryData] = useState<AppHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const procName = process?.name || 'Unknown Application';
  const exePath  = process?.exe_path || '';
  const brand    = getProcessBrandMeta(procName, exePath);
  const primaryPid = process ? ('pids' in process ? process.pids[0] : process.pid) : 0;
  const pidsList   = process ? ('pids' in process ? process.pids : [process.pid]) : [];
  const iconUrl    = process ? ('icon' in process ? process.icon : null) : null;

  const isToggleLoading = actionLoading === `pause-${primaryPid}-${exePath}`;
  const isKillLoading   = actionLoading === `kill-${primaryPid}`;

  // Compute today's local date string (YYYY-MM-DD) for live merge
  const todayStr = useMemo(() => new Date().toLocaleDateString('en-CA'), []); // "2026-09-08"

  // Fetch application history from SQLite
  useEffect(() => {
    if (!isOpen || !process) return;

    let isMounted = true;
    const currentPreset = PRESETS.find(p => p.key === preset)!;

    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        if (tauriStatus === 'connected') {
          const { invoke } = await import('@tauri-apps/api/core');
          const lookupKey = exePath || procName;
          const rawData = await invoke<AppHistoryEntry[]>('get_app_history', {
            appKey: lookupKey,
            days: currentPreset.days,
          });
          if (isMounted) {
            // Sort ascending (oldest → newest) for chart
            const sorted = [...rawData].sort((a, b) => a.date.localeCompare(b.date));

            // Merge live today session data so "Today" is always accurate
            const liveTotalMb = ('total_data_mb' in process) ? (process.total_data_mb || 0) : 0;
            const liveRxMb    = ('inbound_rate'  in process) ? 0 : 0; // rates not cumulative; only total matters
            if (liveTotalMb > 0) {
              const todayIdx = sorted.findIndex(d => d.date === todayStr);
              if (todayIdx !== -1) {
                // Today row already in SQLite — the DB value IS the authoritative persisted total;
                // total_data_mb from the live feed is the session accumulator (reset on restart).
                // We keep DB value as-is since it's already being flushed every 15s.
              } else if (preset === 'today') {
                // No SQLite row yet (first 15s of usage) — inject live data as a synthetic today row
                sorted.push({
                  date: todayStr,
                  inbound_mb: liveTotalMb * 0.7,
                  outbound_mb: liveTotalMb * 0.3,
                  total_mb: liveTotalMb,
                });
              }
            }
            setHistoryData(sorted);
          }
        } else {
          // Fallback demo data for non-Tauri preview
          if (isMounted) {
            const today = new Date();
            const days = currentPreset.key === 'today' ? 1 : currentPreset.days;
            const demo = Array.from({ length: days }).map((_, i) => {
              const d = new Date(today);
              d.setDate(d.getDate() - (days - 1 - i));
              const inMb  = Number((Math.random() * 120 + 5).toFixed(1));
              const outMb = Number((Math.random() * 40  + 2).toFixed(1));
              return {
                date: d.toLocaleDateString('en-CA'),
                inbound_mb: inMb,
                outbound_mb: outMb,
                total_mb: Number((inMb + outMb).toFixed(1)),
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
  }, [isOpen, process, preset, tauriStatus, exePath, procName, todayStr]);

  // Period total for "% of period" column
  const periodTotal = useMemo(
    () => historyData.reduce((acc, d) => acc + d.total_mb, 0),
    [historyData]
  );

  if (!isOpen || !process) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-4xl max-h-[90vh] rounded-3xl border flex flex-col overflow-hidden transition-all ${
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
              large={true}
              className="shrink-0"
            />
            <div className="min-w-0">
              <h2 className="font-bricolage text-lg font-black truncate">{brand.label || procName.replace(/\.exe$/i, '')}</h2>
              {exePath && (
                <p className={`text-[10px] font-mono truncate mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} title={exePath}>{exePath}</p>
              )}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${
                  process.is_paused
                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                    : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                }`}>
                  {process.is_paused ? '● Blocked' : '● Network Active'}
                </span>
                {pidsList.length > 1 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-primary/10 text-primary border border-primary/20">
                    {pidsList.length} instances
                  </span>
                )}
                <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {brand.category}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg shrink-0 transition-colors cursor-pointer ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className={`px-6 py-3 border-b flex items-center gap-2 flex-wrap ${isDark ? 'border-slate-900 bg-slate-950/60' : 'border-slate-100 bg-slate-50/30'}`}>
          {/* Pause / Resume Button */}
          <button
            onClick={() => onTogglePause(process)}
            disabled={isToggleLoading || tauriStatus !== 'connected'}
            className={`px-3.5 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              process.is_paused
                ? 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 shadow-emerald-500/20'
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
              className={`px-3.5 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
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
            className={`px-3.5 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              isDark ? 'border-red-500/20 bg-red-500/5 hover:bg-red-500/15 text-red-400' : 'border-red-200 bg-red-50 hover:bg-red-100 text-red-600'
            } disabled:opacity-50`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Close App</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Telemetry Metric KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className={`p-4 rounded-lg border space-y-1.5 ${isDark ? 'border-slate-850 bg-slate-900/30' : 'border-slate-200/80 bg-slate-50/70'}`}>
                  <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                    <span>Total Data Used</span>
                    <HardDrive className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="text-2xl font-black text-primary font-mono">
                    {fmtMb(process.total_data_mb)}
                  </div>
                  <p className="text-[10px] text-muted-foreground">Live session total</p>
                </div>

                <div className={`p-4 rounded-lg border space-y-1.5 ${isDark ? 'border-slate-850 bg-slate-900/30' : 'border-slate-200/80 bg-slate-50/70'}`}>
                  <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                    <span>Download Speed</span>
                    <ArrowDown className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-black text-emerald-500 font-mono">
                    {process.inbound_rate.toFixed(1)} <span className="text-xs font-normal">KB/s</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Current incoming speed</p>
                </div>

                <div className={`p-4 rounded-lg border space-y-1.5 ${isDark ? 'border-slate-850 bg-slate-900/30' : 'border-slate-200/80 bg-slate-50/70'}`}>
                  <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                    <span>Upload Speed</span>
                    <ArrowUp className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="text-2xl font-black text-primary font-mono">
                    {process.outbound_rate.toFixed(1)} <span className="text-xs font-normal">KB/s</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Current outgoing speed</p>
                </div>

                <div className={`p-4 rounded-lg border space-y-1.5 ${isDark ? 'border-slate-850 bg-slate-900/30' : 'border-slate-200/80 bg-slate-50/70'}`}>
                  <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                    <span>CPU Usage</span>
                    <Cpu className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="text-2xl font-black text-amber-500 font-mono">
                    {process.cpu_usage.toFixed(1)}<span className="text-xs font-normal">%</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{process.memory_usage.toLocaleString()} MB RAM used</p>
                </div>
              </div>

              {/* Data Usage Over Time (SQLite Persistence Chart) */}
              <div className={`p-5 rounded-lg border space-y-4 ${isDark ? 'border-slate-850 bg-slate-900/20' : 'border-slate-200/80 bg-slate-50/40'}`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="font-bricolage text-sm font-bold flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      Historical Data Usage
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Stored daily in local database · showing {preset === 'today' ? 'today' : preset === '7d' ? 'last 7 days' : preset === '30d' ? 'last 30 days' : 'all recorded history'}
                    </p>
                  </div>

                  {/* Zeneva-style preset pills */}
                  <div className="flex items-center gap-1 bg-background border border-border/70 rounded-md p-1 text-xs">
                    {PRESETS.map(p => (
                      <button
                        key={p.key}
                        onClick={() => setPreset(p.key)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                          preset === p.key
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* History Timeline Chart */}
                <div className="h-56 w-full">
                  {loadingHistory ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs space-y-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-primary/60" />
                      <span>Loading usage history…</span>
                    </div>
                  ) : historyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={historyData}>
                        <defs>
                          <linearGradient id="appHistoryGradIn" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#10b981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="appHistoryGradOut" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#f97316" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="date" 
                          stroke="currentColor" 
                          className="text-muted-foreground" 
                          fontSize={10} 
                          tickLine={false}
                          tickFormatter={v => v.slice(5)} // MM-DD
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
                          formatter={(value: number) => [`${value.toLocaleString()} MB`]}
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
                      <span>No historical data recorded yet for this application in this period.</span>
                    </div>
                  )}
                </div>

                {/* Daily Breakdown Table */}
                {historyData.length > 0 && (
                  <div className={`rounded-lg border overflow-hidden ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className={`border-b ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-100/70 border-slate-200'} text-muted-foreground uppercase tracking-wider font-semibold text-[10px]`}>
                          <th className="px-4 py-2.5">Date</th>
                          <th className="px-4 py-2.5 text-right">Total</th>
                          <th className="px-4 py-2.5 text-right">Download</th>
                          <th className="px-4 py-2.5 text-right">Upload</th>
                          <th className="px-4 py-2.5 text-right">% of Period</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
                        {[...historyData].reverse().map((row, idx) => {
                          const pct = periodTotal > 0 ? Math.round((row.total_mb / periodTotal) * 100) : 0;
                          const isToday = row.date === todayStr;
                          return (
                            <tr
                              key={row.date + idx}
                              className={`transition-colors ${isDark ? 'hover:bg-slate-900/40' : 'hover:bg-slate-50'} ${isToday ? (isDark ? 'bg-primary/5' : 'bg-primary/5') : ''}`}
                            >
                              <td className="px-4 py-2.5 font-mono font-semibold">
                                {row.date.slice(5)}
                                {isToday && (
                                  <span className="ml-2 text-[9px] bg-primary/15 text-primary px-1.5 py-0.5 rounded font-bold">Today</span>
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-right font-bold text-foreground">{fmtMb(row.total_mb)}</td>
                              <td className="px-4 py-2.5 text-right text-emerald-500 font-mono">{fmtMb(row.inbound_mb)}</td>
                              <td className="px-4 py-2.5 text-right text-orange-400 font-mono">{fmtMb(row.outbound_mb)}</td>
                              <td className="px-4 py-2.5 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className={`h-1.5 rounded-full overflow-hidden w-16 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                                    <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                                  </div>
                                  <span className="text-muted-foreground font-semibold w-8 text-right">{pct}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
        </div>
      </div>
    </div>
  );
}