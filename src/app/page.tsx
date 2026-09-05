"use client";

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useTheme } from 'next-themes';
import { NetSentryLogo } from '@/components/ui/netsentry-logo';
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
  Radio,
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
  Zap,
  LayoutList,
  LayoutGrid,
  Layers,
  ChevronDown,
  ChevronUp
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
import { AppIcon, getProcessBrandMeta, SYSTEM_PROCESS_NAMES } from '@/components/desktop/app-icons';
import AnalyticsDashboard from '@/components/desktop/analytics-dashboard';
import { syncClientTelemetryToFirebase, logSecurityEventToFirebase } from '@/lib/firebase-telemetry';

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
  cpu_usage?: number;
  memory_usage?: number;
  total_data_mb: number; // Cumulative MB transferred by this process
  connections_count: number;
  is_paused: boolean;
  sockets: ConnectionInfo[];
}

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'warning' | 'alert';
}

/// System-wide telemetry measured at the physical adapters by the Rust backend.
/// Every total here is ABSOLUTE — assign it, never accumulate it. Accumulating is
/// what allowed a duplicated listener to inflate "Total Data Used" to ~180 MB.
interface SystemTelemetry {
  rx_rate_kbps: number;
  tx_rate_kbps: number;
  interval_ms: number;
  session_rx_mb: number;
  session_tx_mb: number;
  today_rx_mb: number;
  today_tx_mb: number;
  week_rx_mb?: number;
  week_tx_mb?: number;
  month_rx_mb?: number;
  month_tx_mb?: number;
}

interface NetworkDataPayload {
  processes: ProcessNetworkData[];
  system: SystemTelemetry;
}

interface DailyTotal {
  date: string;
  total_inbound_mb: number;
  total_outbound_mb: number;
}

export interface GroupedProcess {
  key: string;
  name: string;
  exe_path: string;
  pids: number[];
  total_data_mb: number;
  inbound_rate: number;
  outbound_rate: number;
  connections_count: number;
  memory_usage: number;
  cpu_usage: number;
  is_paused: boolean;
  instances: ProcessNetworkData[];
  sockets: ConnectionInfo[];
}

/// Render a throughput figure without rounding small real values away to "0 KB/s" —
/// a rate that read 0 while the total climbed is what made the old build look broken.
const formatRate = (kbps: number) => {
  if (!Number.isFinite(kbps) || kbps <= 0) return '0 KB/s';
  if (kbps >= 1024) return `${(kbps / 1024).toFixed(2)} MB/s`;
  if (kbps >= 10) return `${Math.round(kbps)} KB/s`;
  return `${kbps.toFixed(1)} KB/s`;
};

const formatVolume = (mb: number) =>
  mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(1)} MB`;

export default function NetSentryDashboard() {
  const [isClient, setIsClient] = useState(false);
  const [processes, setProcesses] = useState<ProcessNetworkData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [chartData, setChartData] = useState<{ time: string; inbound: number; outbound: number }[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tauriStatus, setTauriStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  // next-themes wires this to the actual class on <html> so the whole page reacts
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  // States
  const [selectedProcess, setSelectedProcess] = useState<ProcessNetworkData | GroupedProcess | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [quotaLimit, setQuotaLimit] = useState<number>(1000); // MB
  // Absolute telemetry from Rust. Assigned wholesale each tick, never accumulated.
  const [system, setSystem] = useState<SystemTelemetry | null>(null);
  // Read inside the event handler, so the quota can change without tearing down
  // and re-registering the listener (which is how listeners used to get duplicated).
  const quotaRef = useRef<number>(1000);
  // Latches the quota alert so it fires on crossing, not once per tick.
  const alertedRef = useRef<boolean>(false);
  // PIDs already reported as suspicious, so each one is logged on transition only.
  const flaggedPidsRef = useRef<Set<number>>(new Set());
  const [securityLogs, setSecurityLogs] = useState<LogEntry[]>([
    { timestamp: new Date().toLocaleTimeString(), message: "NetSentry security engine initialized.", type: "info" }
  ]);
  const [currentTab, setCurrentTab] = useState<'monitor' | 'logs' | 'analytics'>('monitor');
  const [timeRangeFilter, setTimeRangeFilter] = useState<'today' | 'session' | 'week' | 'month'>('today');
  const [filterCategory, setFilterCategory] = useState<'all' | 'user' | 'system' | 'active' | 'paused'>('all');
  const [hideSystemNoise, setHideSystemNoise] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<'data_usage' | 'inbound' | 'outbound' | 'name' | 'pid'>('data_usage');
  const [groupByApp, setGroupByApp] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isMetered, setIsMetered] = useState<boolean>(false);
  const [isWwan, setIsWwan] = useState<boolean>(false);
  const [isDataSaverMode, setIsDataSaverMode] = useState<boolean>(false);
  const [dataSaverLoading, setDataSaverLoading] = useState<boolean>(false);
  const [dailyTotals, setDailyTotals] = useState<DailyTotal[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(false);

  const toggleGroupExpand = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  // Default whitelist: common browsers + system
  const [allowedApps, setAllowedApps] = useState<string>(
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe\nC:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe\nC:\\Program Files\\Mozilla Firefox\\firefox.exe'
  );

  // Toggle Theme — setTheme from next-themes updates the <html class> directly
  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
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
    ].slice(0, 500));
    if (type === 'warning' || type === 'alert') {
      logSecurityEventToFirebase(message, type).catch(() => {});
    }
  };

  // Keep the ref in sync so the telemetry listener can read the current quota
  // without needing to be re-registered when the limit changes.
  useEffect(() => {
    quotaRef.current = quotaLimit;
  }, [quotaLimit]);

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
        
        const unlisten = await listen<NetworkDataPayload>('network-data', (event) => {
          const { processes: procs, system: sys } = event.payload;

          setProcesses(procs);
          // Plain assignment. Rust owns the byte counters and sends absolute values,
          // so even a duplicated listener writing the same number is a no-op rather
          // than doubling the total.
          setSystem(sys);

          // Quota alert on the crossing only.
          const usedMb = sys.today_rx_mb + sys.today_tx_mb;
          const limit = quotaRef.current;
          if (usedMb >= limit) {
            if (!alertedRef.current) {
              alertedRef.current = true;
              addLog(`Alert: Bandwidth quota of ${limit} MB exceeded!`, 'alert');
            }
          } else {
            alertedRef.current = false;
          }

          // Threat audit: log a PID when it *becomes* suspicious. The previous version
          // re-logged every offending process on every tick, flooding the list once a second.
          const previouslyFlagged = flaggedPidsRef.current;
          const nowFlagged = new Set<number>();
          procs.forEach(p => {
            const suspicious =
              p.connections_count > 25 &&
              (p.cpu_usage || 0) > 50 &&
              p.name !== 'chrome.exe' &&
              p.name !== 'msedge.exe' &&
              p.name !== 'firefox.exe';
            if (!suspicious) return;
            nowFlagged.add(p.pid);
            if (!previouslyFlagged.has(p.pid)) {
              addLog(`Warning: Process ${p.name} (PID ${p.pid}) shows suspicious socket counts (${p.connections_count}) and high CPU usage (${p.cpu_usage}%).`, 'warning');
            }
          });
          flaggedPidsRef.current = nowFlagged;

          setChartData(prev => {
            const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const newData = [...prev, { time: now, inbound: sys.rx_rate_kbps, outbound: sys.tx_rate_kbps }];
            if (newData.length > 20) newData.shift();
            return newData;
          });
        });

        return () => {
          clearInterval(costInterval);
          unlisten();
        };
      };

      let cancelled = false;
      let cleanup: (() => void) | undefined;
      setupTauri().then(cb => {
        // setupTauri awaits several IPC round-trips. If the effect was torn down while
        // it was still in flight, dispose immediately — otherwise the listener and the
        // 2.5s interval leak, which is exactly how duplicate listeners accumulated.
        if (cancelled) cb?.();
        else cleanup = cb;
      }).catch(e => {
        console.error('NetSentry: telemetry subscription failed', e);
        setTauriStatus('disconnected');
      });

      return () => {
        cancelled = true;
        cleanup?.();
      };
    } else {
      setTauriStatus('disconnected');
      setProcesses([]);
    }
  }, []);

  const filteredProcesses = useMemo(() => {
    return processes
      .filter(p => {
        const meta = getProcessBrandMeta(p.name, p.exe_path);
        
        // Hide system noise toggle
        if (hideSystemNoise && meta.isSystem && !searchQuery.trim()) {
          return false;
        }

        // Category filter
        if (filterCategory === 'user' && meta.isSystem) return false;
        if (filterCategory === 'system' && !meta.isSystem) return false;
        if (filterCategory === 'active' && (p.inbound_rate + p.outbound_rate) <= 0 && (p.total_data_mb || 0) <= 0) return false;
        if (filterCategory === 'paused' && !p.is_paused) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchPath = p.exe_path.toLowerCase().includes(q);
          const matchPid = p.pid.toString().includes(q);
          return matchName || matchPath || matchPid;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'data_usage') {
          return (b.total_data_mb || 0) - (a.total_data_mb || 0);
        }
        if (sortBy === 'inbound') {
          return b.inbound_rate - a.inbound_rate;
        }
        if (sortBy === 'outbound') {
          return b.outbound_rate - a.outbound_rate;
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'pid') {
          return a.pid - b.pid;
        }
        return 0;
      });
  }, [processes, searchQuery, filterCategory, hideSystemNoise, sortBy]);

  const displayProcesses = useMemo((): GroupedProcess[] => {
    if (!groupByApp) {
      return filteredProcesses.map(p => ({
        key: `proc-${p.pid}`,
        name: p.name,
        exe_path: p.exe_path,
        pids: [p.pid],
        total_data_mb: p.total_data_mb || 0,
        inbound_rate: p.inbound_rate || 0,
        outbound_rate: p.outbound_rate || 0,
        connections_count: p.connections_count || 0,
        memory_usage: p.memory_usage || 0,
        cpu_usage: p.cpu_usage || 0,
        is_paused: p.is_paused,
        instances: [p],
        sockets: p.sockets || []
      }));
    }

    const map = new Map<string, GroupedProcess>();
    filteredProcesses.forEach(p => {
      const normKey = (p.exe_path || p.name).toLowerCase();
      const existing = map.get(normKey);
      if (existing) {
        existing.pids.push(p.pid);
        existing.total_data_mb += (p.total_data_mb || 0);
        existing.inbound_rate += (p.inbound_rate || 0);
        existing.outbound_rate += (p.outbound_rate || 0);
        existing.connections_count += (p.connections_count || 0);
        existing.memory_usage += (p.memory_usage || 0);
        existing.cpu_usage = Math.max(existing.cpu_usage, p.cpu_usage || 0);
        existing.is_paused = existing.is_paused || p.is_paused;
        existing.instances.push(p);
        if (p.sockets && p.sockets.length > 0) {
          existing.sockets = existing.sockets.concat(p.sockets);
        }
      } else {
        map.set(normKey, {
          key: `group-${normKey}`,
          name: p.name,
          exe_path: p.exe_path,
          pids: [p.pid],
          total_data_mb: p.total_data_mb || 0,
          inbound_rate: p.inbound_rate || 0,
          outbound_rate: p.outbound_rate || 0,
          connections_count: p.connections_count || 0,
          memory_usage: p.memory_usage || 0,
          cpu_usage: p.cpu_usage || 0,
          is_paused: p.is_paused,
          instances: [p],
          sockets: p.sockets || []
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      if (sortBy === 'data_usage') return b.total_data_mb - a.total_data_mb;
      if (sortBy === 'inbound') return b.inbound_rate - a.inbound_rate;
      if (sortBy === 'outbound') return b.outbound_rate - a.outbound_rate;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [filteredProcesses, groupByApp, sortBy]);

  // Firebase Live Telemetry Synchronization
  useEffect(() => {
    if (tauriStatus !== 'connected' || processes.length === 0) return;

    const syncTelemetry = () => {
      const topApps = displayProcesses.slice(0, 8).map(p => {
        const meta = getProcessBrandMeta(p.name, p.exe_path);
        return {
          name: p.name,
          label: meta.label,
          category: meta.category,
          totalMb: p.total_data_mb,
          inboundRate: p.inbound_rate,
          outboundRate: p.outbound_rate,
          sockets: p.connections_count
        };
      });

      syncClientTelemetryToFirebase({
        deviceName: 'Windows-Client',
        clientVersion: 'v2.0.0',
        todayRxMb: system?.today_rx_mb || 0,
        todayTxMb: system?.today_tx_mb || 0,
        totalDataMb: (system?.today_rx_mb || 0) + (system?.today_tx_mb || 0),
        inboundRateKbps: system?.rx_rate_kbps || 0,
        outboundRateKbps: system?.tx_rate_kbps || 0,
        activeSockets: processes.reduce((acc, p) => acc + (p.connections_count || 0), 0),
        activeProcesses: processes.length,
        isMetered,
        isWwan,
        isDataSaverMode,
        topApps
      }).catch(() => {});
    };

    syncTelemetry();
    const interval = setInterval(syncTelemetry, 30000);
    return () => clearInterval(interval);
  }, [tauriStatus, processes, system, isMetered, isWwan, isDataSaverMode, displayProcesses]);

  const overallStats = useMemo(() => {
    let totalConnections = 0;
    processes.forEach(p => {
      totalConnections += p.connections_count;
    });
    return {
      // Straight from the adapter measurement. Summing the per-process values instead
      // would lose every share that rounded to 0 across ~90 processes.
      inbound: system?.rx_rate_kbps ?? 0,
      outbound: system?.tx_rate_kbps ?? 0,
      totalConnections
    };
  }, [processes, system]);

  // "Total Data Used" — dynamically reacts to timeRangeFilter (today, session, week, month)
  const usedMb = useMemo(() => {
    if (timeRangeFilter === 'session') return (system?.session_rx_mb ?? 0) + (system?.session_tx_mb ?? 0);
    if (timeRangeFilter === 'week') return (system?.week_rx_mb ?? 0) + (system?.week_tx_mb ?? 0);
    if (timeRangeFilter === 'month') return (system?.month_rx_mb ?? 0) + (system?.month_tx_mb ?? 0);
    return (system?.today_rx_mb ?? 0) + (system?.today_tx_mb ?? 0);
  }, [system, timeRangeFilter]);

  const handleTogglePause = async (proc: ProcessNetworkData | GroupedProcess) => {
    const primaryPid = 'pids' in proc ? proc.pids[0] : proc.pid;
    const key = `pause-${primaryPid}-${proc.exe_path}`;
    setActionLoading(key);
    
    try {
      if (tauriStatus === 'connected') {
        const { invoke } = await import('@tauri-apps/api/core');
        if (proc.is_paused) {
          await invoke('resume_inbound_traffic', { exePath: proc.exe_path, name: proc.name });
          addLog(`Inbound rules resumed for ${proc.name}`, 'info');
        } else {
          await invoke('pause_inbound_traffic', { exePath: proc.exe_path, name: proc.name });
          addLog(`Firewall blocked inbound traffic for ${proc.name}`, 'warning');
        }
      }
    } catch (e) {
      console.error(e);
      alert(`Firewall action failed: ${e}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleKillProcess = async (proc: ProcessNetworkData | GroupedProcess) => {
    const pidsToKill = 'pids' in proc ? proc.pids : [proc.pid];
    if (!confirm(`Are you sure you want to force terminate ${proc.name} (${pidsToKill.length > 1 ? `${pidsToKill.length} processes` : `PID ${pidsToKill[0]}`})?`)) return;
    
    const key = `kill-${pidsToKill[0]}`;
    setActionLoading(key);
    
    try {
      if (tauriStatus === 'connected') {
        const { invoke } = await import('@tauri-apps/api/core');
        for (const pid of pidsToKill) {
          await invoke('kill_process', { pid });
        }
        addLog(`Force terminated ${proc.name} (${pidsToKill.length} instance(s))`, 'alert');
      }
    } catch (e) {
      console.error(e);
      alert(`Failed to kill process: ${e}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenFileLocation = async (proc: ProcessNetworkData | GroupedProcess) => {
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

  const openInspector = (proc: ProcessNetworkData | GroupedProcess) => {
    setSelectedProcess(proc);
    setIsInspectorOpen(true);
  };

  if (!isClient) return null;

  // Theme configuration — use resolvedTheme so 'system' preference is respected
  const isDark = resolvedTheme === 'dark';
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
          <NetSentryLogo className="w-10 h-10 shadow-md rounded-xl" />
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
                  <div className="flex items-center justify-between text-muted-foreground gap-2">
                    <span className="text-xs font-semibold">Total Data Used</span>
                    <select
                      value={timeRangeFilter}
                      onChange={(e) => setTimeRangeFilter(e.target.value as any)}
                      className={`text-[11px] font-semibold border rounded-lg px-2 py-0.5 outline-none cursor-pointer transition-all ${
                        isDark ? 'bg-slate-900 border-slate-750 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <option value="today">Today (00:00)</option>
                      <option value="session">Live Session</option>
                      <option value="week">7 Days (Week)</option>
                      <option value="month">30 Days (Month)</option>
                    </select>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-foreground">
                      {formatVolume(usedMb)}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                      {timeRangeFilter === 'today' && 'Today · since 00:00'}
                      {timeRangeFilter === 'session' && 'Session · since launch'}
                      {timeRangeFilter === 'week' && 'Past 7 Days aggregate'}
                      {timeRangeFilter === 'month' && 'Past 30 Days aggregate'}
                    </p>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Quota Usage</span>
                      <span className="font-semibold">{Math.min(Math.round((usedMb / quotaLimit) * 100), 100)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${usedMb >= quotaLimit ? 'bg-red-500' : 'bg-primary'}`}
                        style={{ width: `${Math.min((usedMb / quotaLimit) * 100, 100)}%` }}
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
                      {Math.max(0, quotaLimit - usedMb).toFixed(1)} MB buffer remaining
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
                      {formatRate(overallStats.inbound)}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Live incoming packet stream
                    </p>
                  </div>
                  <div className="text-[10px] text-muted-foreground pt-1 border-t border-border/60">
                    Measured at the physical adapter
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
                      {formatRate(overallStats.outbound)}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Live outgoing packet stream
                    </p>
                  </div>
                  <div className="text-[10px] text-muted-foreground pt-1 border-t border-border/60">
                    {system ? `Sampled every ${system.interval_ms.toLocaleString()}ms` : 'Awaiting telemetry'}
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
                    <span className="text-muted-foreground">Inbound: <strong className="text-foreground">{formatRate(overallStats.inbound)}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-muted-foreground">Outbound: <strong className="text-foreground">{formatRate(overallStats.outbound)}</strong></span>
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
              <div className={`p-6 border-b space-y-4 ${borderClass}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-bricolage text-lg font-bold flex items-center space-x-2">
                      <Terminal className="w-5 h-5 text-primary" />
                      <span>Process Network Controller</span>
                    </h2>
                    <p className={`text-xs ${textMutedClass}`}>Monitor live bandwidth consumption & manage per-app firewall rules</p>
                  </div>
                  
                  {/* View Switcher, Sort Dropdown & Search Bar */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    {/* View Switcher (Table vs Grid) */}
                    <div className={`flex items-center border rounded-xl overflow-hidden p-0.5 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <button
                        onClick={() => setViewMode('table')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          viewMode === 'table' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
                        }`}
                        title="Classic Table View"
                      >
                        <LayoutList className="w-3.5 h-3.5" />
                        <span>Table</span>
                      </button>
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          viewMode === 'grid' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
                        }`}
                        title="Modern Card Grid View"
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span>Grid</span>
                      </button>
                    </div>

                    {/* Sort Selector */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Sort:</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className={`text-xs border rounded-xl px-3 py-2 outline-none font-medium cursor-pointer transition-all ${
                          isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <option value="data_usage">🔥 Total Data Usage</option>
                        <option value="inbound">⬇️ Inbound Speed</option>
                        <option value="outbound">⬆️ Outbound Speed</option>
                        <option value="name">🔤 App Name</option>
                        <option value="pid">🔢 Process ID (PID)</option>
                      </select>
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full sm:w-60">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="w-4 h-4 text-slate-400" />
                      </span>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search app, path, PID..."
                        className={`w-full border focus:ring-1 rounded-xl pl-9 pr-4 py-2 text-xs outline-none transition-all ${
                          isDark 
                            ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-primary focus:ring-primary focus:bg-slate-950 placeholder-slate-500' 
                            : 'bg-white border-slate-200 text-slate-900 focus:border-primary focus:ring-primary focus:bg-white placeholder-slate-400'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Filter Controls, Group by App Toggle & System Noise Toggle */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/40">
                  {/* Category Filter Tabs & Group Toggle */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Group by App Toggle */}
                    <button
                      onClick={() => setGroupByApp(prev => !prev)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all border ${
                        groupByApp 
                          ? 'bg-primary/10 border-primary/30 text-primary' 
                          : 'bg-muted/40 border-transparent text-muted-foreground hover:bg-muted/70'
                      }`}
                      title={groupByApp ? "Application Grouping ON: Merges duplicate instances" : "Showing raw individual PIDs"}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>{groupByApp ? 'Grouped by App' : 'Raw PIDs'}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-extrabold">
                        {displayProcesses.length}
                      </span>
                    </button>

                    <span className="h-4 w-[1px] bg-border mx-1" />

                    <button
                      onClick={() => setFilterCategory('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                        filterCategory === 'all'
                          ? 'bg-primary text-white shadow-sm'
                          : 'bg-muted/40 text-muted-foreground hover:bg-muted/70'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setFilterCategory('user')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                        filterCategory === 'user'
                          ? 'bg-primary text-white shadow-sm'
                          : 'bg-muted/40 text-muted-foreground hover:bg-muted/70'
                      }`}
                    >
                      💻 Desktop Apps
                    </button>
                    <button
                      onClick={() => setFilterCategory('active')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                        filterCategory === 'active'
                          ? 'bg-primary text-white shadow-sm'
                          : 'bg-muted/40 text-muted-foreground hover:bg-muted/70'
                      }`}
                    >
                      ⚡ Active
                    </button>
                    <button
                      onClick={() => setFilterCategory('paused')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                        filterCategory === 'paused'
                          ? 'bg-red-500 text-white shadow-sm'
                          : 'bg-muted/40 text-muted-foreground hover:bg-muted/70'
                      }`}
                    >
                      🚫 Blocked ({processes.filter(p => p.is_paused).length})
                    </button>
                    <button
                      onClick={() => setFilterCategory('system')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                        filterCategory === 'system'
                          ? 'bg-primary text-white shadow-sm'
                          : 'bg-muted/40 text-muted-foreground hover:bg-muted/70'
                      }`}
                    >
                      ⚙️ Daemons
                    </button>
                  </div>

                  {/* Hide System Noise Toggle */}
                  <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hideSystemNoise}
                      onChange={(e) => setHideSystemNoise(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                    />
                    <span>Hide System Background Noise</span>
                  </label>
                </div>
              </div>

              {/* View Rendering: Table View or Grid View */}
              {viewMode === 'table' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`border-b border-border/50 text-xs font-semibold uppercase tracking-wider ${tableHeaderBg} ${textMutedClass}`}>
                        <th className="px-6 py-4">Application / Process</th>
                        <th className="px-6 py-4">PID</th>
                        <th className="px-6 py-4" title="Cumulative network data transferred by this application in this session">Data Usage</th>
                        <th className="px-6 py-4" title="Live inbound download rate">Inbound Rate</th>
                        <th className="px-6 py-4" title="Live outbound upload rate">Outbound Rate</th>
                        <th className="px-6 py-4">Sockets</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {displayProcesses.length > 0 ? (
                        displayProcesses.map((proc) => {
                          const brand = getProcessBrandMeta(proc.name, proc.exe_path);
                          const isExpanded = expandedGroups.has(proc.key);
                          const primaryPid = proc.pids[0];
                          const isToggleLoading = actionLoading === `pause-${primaryPid}-${proc.exe_path}`;
                          const isKillLoading = actionLoading === `kill-${primaryPid}`;
                          const isHighestDrain = proc.inbound_rate > 50;

                          return (
                            <React.Fragment key={proc.key}>
                              <tr 
                                className={`transition-all ${tableRowHover} ${proc.is_paused ? 'bg-red-500/5' : ''} ${isHighestDrain ? 'bg-amber-500/5' : ''}`}
                              >
                                <td className="px-6 py-4">
                                  <div className="flex items-center space-x-3">
                                    <AppIcon name={proc.name} exePath={proc.exe_path} />
                                    <div>
                                      <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                                        <span className="font-bold text-sm text-foreground">{brand.label || proc.name}</span>
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${brand.badgeBg}`}>
                                          {brand.category}
                                        </span>
                                        {proc.pids.length > 1 && (
                                          <button
                                            onClick={() => toggleGroupExpand(proc.key)}
                                            className="bg-primary/10 border border-primary/30 text-primary text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 hover:bg-primary/20 transition-all cursor-pointer"
                                            title="Click to view child process instances"
                                          >
                                            <span>{proc.pids.length} Instances</span>
                                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                          </button>
                                        )}
                                        {isHighestDrain && (
                                          <span className="bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full tracking-wider uppercase flex items-center gap-0.5">
                                            🔥 Data Drain
                                          </span>
                                        )}
                                      </div>
                                      <div className={`text-[10px] max-w-xs truncate ${textMutedClass} mt-0.5`} title={proc.exe_path}>
                                        {proc.exe_path || 'System Executable'}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className={`px-6 py-4 font-mono text-xs ${textMutedClass}`}>
                                  {proc.pids.length > 1 ? (
                                    <span className="font-bold text-primary">{proc.pids[0]} +{proc.pids.length - 1}</span>
                                  ) : (
                                    proc.pids[0]
                                  )}
                                </td>
                                <td className="px-6 py-4 font-mono text-xs font-bold text-primary">
                                  <span className="bg-primary/10 border border-primary/20 text-primary px-2.5 py-1 rounded-lg">
                                    {formatVolume(proc.total_data_mb || 0)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 font-mono text-xs text-emerald-500 font-semibold">
                                  {formatRate(proc.inbound_rate)}
                                </td>
                                <td className="px-6 py-4 font-mono text-xs text-primary font-semibold">
                                  {formatRate(proc.outbound_rate)}
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

                              {/* Expanded Child Sub-Processes Breakdown */}
                              {isExpanded && proc.instances.length > 1 && (
                                <tr className={`${isDark ? 'bg-slate-950/60' : 'bg-slate-50/80'} border-b border-border/30`}>
                                  <td colSpan={7} className="px-10 py-3">
                                    <div className="space-y-1.5">
                                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                        <Layers className="w-3 h-3 text-primary" />
                                        <span>Consolidated Instances ({proc.instances.length} Sub-Processes)</span>
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                        {proc.instances.map(inst => (
                                          <div key={inst.pid} className="flex items-center justify-between p-2 rounded-lg border border-border/60 bg-background/60 font-mono text-xs">
                                            <div>
                                              <span className="font-bold text-foreground">PID {inst.pid}</span>
                                              <span className="text-[10px] text-muted-foreground ml-2">({inst.connections_count} sockets)</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <span className="text-primary font-semibold text-[11px]">{formatVolume(inst.total_data_mb)}</span>
                                              <button
                                                onClick={() => handleKillProcess(inst)}
                                                className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                                title={`Terminate PID ${inst.pid}`}
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-slate-500 text-sm">
                            {tauriStatus === 'connected' 
                              ? 'No active desktop applications match your current filters.' 
                              : 'Please run NetSentry as a Windows Desktop application to monitor connections.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Modern Card Grid View */
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {displayProcesses.length > 0 ? (
                    displayProcesses.map((proc) => {
                      const brand = getProcessBrandMeta(proc.name, proc.exe_path);
                      const isExpanded = expandedGroups.has(proc.key);
                      const primaryPid = proc.pids[0];
                      const isToggleLoading = actionLoading === `pause-${primaryPid}-${proc.exe_path}`;
                      const isKillLoading = actionLoading === `kill-${primaryPid}`;

                      return (
                        <div 
                          key={proc.key}
                          className={`relative border rounded-2xl p-5 shadow-sm transition-all hover:shadow-md ${
                            isDark ? 'bg-slate-900/50 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'
                          } ${proc.is_paused ? 'border-red-500/30 bg-red-500/5' : ''}`}
                        >
                          {/* Top Brand & Title */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center space-x-3 min-w-0">
                              <AppIcon name={proc.name} exePath={proc.exe_path} large />
                              <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-sm truncate text-foreground" title={proc.name}>
                                  {brand.label || proc.name}
                                </h3>
                                <p className="text-[10px] text-muted-foreground truncate" title={proc.exe_path}>
                                  {proc.exe_path ? proc.exe_path.split('\\').pop() : 'System Process'}
                                </p>
                              </div>
                            </div>

                            {/* Badges */}
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${brand.badgeBg}`}>
                                {brand.category}
                              </span>
                              {proc.pids.length > 1 && (
                                <button
                                  onClick={() => toggleGroupExpand(proc.key)}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1 hover:bg-primary/20 transition-all cursor-pointer"
                                  title="Toggle sub-processes"
                                >
                                  <span>{proc.pids.length} PIDs</span>
                                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Metrics Body */}
                          <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                            {/* Data Usage Big Counter */}
                            <div className="flex items-baseline justify-between">
                              <span className="text-xs text-muted-foreground font-medium">Data Used:</span>
                              <span className="font-mono text-lg font-extrabold text-primary">
                                {formatVolume(proc.total_data_mb || 0)}
                              </span>
                            </div>

                            {/* Inbound & Outbound Speeds */}
                            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                              <div className="p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                                  <ArrowDown className="w-3 h-3 text-emerald-500" />
                                  Down
                                </span>
                                <span className="font-bold text-emerald-500">{formatRate(proc.inbound_rate)}</span>
                              </div>
                              <div className="p-2 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                                  <ArrowUp className="w-3 h-3 text-primary" />
                                  Up
                                </span>
                                <span className="font-bold text-primary">{formatRate(proc.outbound_rate)}</span>
                              </div>
                            </div>

                            {/* Concurrency & Sockets */}
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                              <span className="flex items-center gap-1">
                                <Radio className="w-3 h-3 text-sky-400" />
                                <span>{proc.connections_count} Active Sockets</span>
                              </span>
                              <span className="font-mono">{proc.memory_usage ? `${proc.memory_usage} MB RAM` : `PID: ${proc.pids[0]}`}</span>
                            </div>
                          </div>

                          {/* Expanded Sub-Processes Drawer */}
                          {isExpanded && proc.instances.length > 1 && (
                            <div className="mt-3 pt-3 border-t border-border/40 space-y-1.5 max-h-40 overflow-y-auto font-mono text-[10px]">
                              <div className="text-muted-foreground font-semibold uppercase text-[9px]">Sub-Processes ({proc.instances.length})</div>
                              {proc.instances.map(inst => (
                                <div key={inst.pid} className="flex items-center justify-between p-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                  <span>PID: {inst.pid}</span>
                                  <span className="text-primary">{formatVolume(inst.total_data_mb)}</span>
                                  <span className="text-emerald-500">{formatRate(inst.inbound_rate)}</span>
                                  <button
                                    onClick={() => handleKillProcess(inst)}
                                    className="text-slate-400 hover:text-red-500 p-1"
                                    title="Kill PID"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Card Actions Footer */}
                          <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between gap-2">
                            <div className="flex items-center space-x-1.5">
                              <button
                                onClick={() => handleOpenFileLocation(proc)}
                                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                                  isDark ? 'bg-slate-900 border-slate-800 hover:bg-slate-800' : 'bg-white border-slate-200 hover:bg-slate-100'
                                }`}
                                title="Open Executable Location"
                              >
                                <FolderOpen className="w-3.5 h-3.5 text-slate-400 hover:text-primary" />
                              </button>
                              <button
                                onClick={() => openInspector(proc)}
                                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                                  isDark ? 'bg-slate-900 border-slate-800 hover:bg-slate-800' : 'bg-white border-slate-200 hover:bg-slate-100'
                                }`}
                                title="Inspect Active Sockets"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-400 hover:text-primary" />
                              </button>
                              <button
                                onClick={() => handleKillProcess(proc)}
                                disabled={isKillLoading || tauriStatus !== 'connected'}
                                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                                  isDark ? 'bg-slate-900 border-slate-800 hover:bg-slate-800' : 'bg-white border-slate-200 hover:bg-slate-100'
                                } disabled:opacity-50`}
                                title="Force Terminate"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
                              </button>
                            </div>

                            <button
                              onClick={() => handleTogglePause(proc)}
                              disabled={isToggleLoading || tauriStatus !== 'connected'}
                              className={`flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer border transition-all ${
                                proc.is_paused
                                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20'
                                  : 'bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20'
                              } disabled:opacity-50`}
                            >
                              {isToggleLoading ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : proc.is_paused ? (
                                <Play className="w-3.5 h-3.5" />
                              ) : (
                                <Pause className="w-3.5 h-3.5" />
                              )}
                              <span>{proc.is_paused ? 'Resume' : 'Pause Data'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full py-12 text-center text-slate-500 text-sm">
                      {tauriStatus === 'connected' 
                        ? 'No active desktop applications match your current filters.' 
                        : 'Please run NetSentry as a Windows Desktop application to monitor connections.'}
                    </div>
                  )}
                </div>
              )}
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

        {/* 21-Chart Comprehensive Analytics Intelligence Dashboard */}
        {currentTab === 'analytics' && (
          <AnalyticsDashboard
            processes={processes}
            system={system}
            dailyTotals={dailyTotals}
            liveChartData={chartData}
            isDark={isDark}
            tauriStatus={tauriStatus}
            isDataSaverMode={isDataSaverMode}
            allowedApps={allowedApps}
            setAllowedApps={setAllowedApps}
            handleEnableDataSaver={handleEnableDataSaver}
            handleDisableDataSaver={handleDisableDataSaver}
            dataSaverLoading={dataSaverLoading}
            loadDailyTotals={loadDailyTotals}
            analyticsLoading={analyticsLoading}
          />
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
                <p className={`text-xs ${textMutedClass}`}>PID: {'pids' in selectedProcess ? selectedProcess.pids[0] : selectedProcess.pid} | Path: {selectedProcess.exe_path || 'System'}</p>
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
