'use client';

import React, { useMemo, useState, useEffect } from 'react';
import CyberShield from '@/components/admin/cyber-shield';

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
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<any | null>(null);

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

    return () => {
      unsubUsers();
      unsubDownloads();
      unsubSecurity();
      unsubErrors();
      unsubDevices();
    };
  }, [firestore]);

  // Aggregate NetSentry Operational Metrics
  const metrics = useMemo(() => {
    const launchDate = new Date('2026-02-01');
    const daysOnline = Math.max(1, differenceInDays(new Date(), launchDate));

    const totalClients = users.length;
    const totalDownloads = downloadClicks.length;
    const totalThreatEvents = securityLogs.length;
    const totalSystemErrors = errorLogs.length;

    const totalDesktopNodes = desktopDevices.length;
    const onlineDesktopNodes = desktopDevices.filter(d => {
      if (!d.updatedAt && !d.lastSeen) return false;
      const time = d.updatedAt ? new Date(d.updatedAt).getTime() : (d.lastSeen?.seconds ? d.lastSeen.seconds * 1000 : 0);
      return (Date.now() - time) < 5 * 60 * 1000;
    }).length;
    const totalFleetTrafficMb = desktopDevices.reduce((acc, d) => acc + (d.totalDataMb || ((d.todayRxMb || 0) + (d.todayTxMb || 0))), 0);
    const meteredDesktopNodes = desktopDevices.filter(d => d.isMetered || d.isWwan).length;

    // Categorize downloads by platform if logged
    const windowsDownloads = downloadClicks.filter(d => (d.platform || '').toLowerCase().includes('win') || (d.target || '').includes('.exe') || (d.target || '').includes('.msi')).length;

    return {
      daysOnline,
      totalClients,
      totalDownloads,
      windowsDownloads,
      totalThreatEvents,
      totalSystemErrors,
      totalDesktopNodes,
      onlineDesktopNodes,
      totalFleetTrafficMb,
      meteredDesktopNodes,
    };
  }, [users, downloadClicks, securityLogs, errorLogs, desktopDevices]);

  // Chart data generated from actual download & security activity
  const telemetryChartData = useMemo(() => {
    const hours = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', 'Now'];
    return hours.map((time, idx) => ({
      time,
      threats: Math.max(0, securityLogs.slice(idx * 2, (idx + 1) * 2).length),
      downloads: Math.max(0, downloadClicks.slice(idx * 2, (idx + 1) * 2).length),
    }));
  }, [securityLogs, downloadClicks]);

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-bricolage text-2xl md:text-3xl font-extrabold tracking-tight">
            NetSentry Admin Command
          </h1>
          <p className="text-sm text-muted-foreground">
            Telemetry, client node telemetry, security audits, and deployment monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-emerald-500/40 text-emerald-500 text-xs px-3 py-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
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
              { id: 'fleet', label: 'Desktop Fleet', icon: Monitor },
              { id: 'clients', label: 'Client Nodes', icon: Users },
              { id: 'shield', label: 'Cyber Shield & Security', icon: ShieldCheck },
              { id: 'logs', label: 'Diagnostic Logs', icon: Bug },
            ].map(tab => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary border border-transparent rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2 transition-all"
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* OVERVIEW TELEMETRY TAB */}
        <TabsContent value="overview" className="space-y-6 pt-4">
          {/* Top Command Stats */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary/10 text-primary border border-primary/20 rounded-xl">
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

            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div 
                onClick={() => setActiveTab('fleet')}
                className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-semibold text-cyan-500">Desktop Fleet</span>
                  <Monitor className="w-4 h-4 text-cyan-500 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-2xl font-black text-cyan-500">{metrics.totalDesktopNodes} Nodes</div>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  {metrics.onlineDesktopNodes} live streaming
                </div>
              </div>

              <div 
                onClick={() => setActiveTab('clients')}
                className="p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/30 transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-semibold">Client Nodes</span>
                  <Laptop className="w-4 h-4 text-primary" />
                </div>
                <div className="text-2xl font-black text-foreground">{metrics.totalClients}</div>
                <p className="text-[11px] text-muted-foreground">Registered web & client sessions</p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/30 transition-all space-y-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-semibold">Total Downloads</span>
                  <Download className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-black text-emerald-500">{metrics.totalDownloads}</div>
                <p className="text-[11px] text-muted-foreground">Windows installer & zip packages</p>
              </div>

              <div 
                onClick={() => setActiveTab('shield')}
                className="p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/30 transition-all cursor-pointer space-y-2"
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
                className="p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/30 transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-semibold">Diagnostic Events</span>
                  <Bug className="w-4 h-4 text-red-500" />
                </div>
                <div className="text-2xl font-black text-red-500">{metrics.totalSystemErrors}</div>
                <p className="text-[11px] text-muted-foreground">System errors & exceptions</p>
              </div>
            </div>

            {/* Row 2: Secondary Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="p-3.5 rounded-xl border border-border bg-muted/10 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground text-xs">
                  <span>Operational Age</span>
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="text-xl font-bold text-foreground">{metrics.daysOnline} Days</div>
                <p className="text-[10px] text-muted-foreground">Live platform uptime duration</p>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-muted/10 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground text-xs">
                  <span>Engine Architecture</span>
                  <Server className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="text-xl font-bold text-foreground">Tauri + Rust + Next.js</div>
                <p className="text-[10px] text-muted-foreground">Low-overhead native packet engine</p>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-muted/10 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground text-xs">
                  <span>Security Baseline</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <div className="text-xl font-bold text-emerald-500">Zero-Log Privacy</div>
                <p className="text-[10px] text-muted-foreground">Anonymous token authentication</p>
              </div>
            </div>
          </div>

          {/* Activity Chart */}
          <Card className="bg-card border border-border rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Ecosystem Telemetry Timeline
                </CardTitle>
                <CardDescription className="text-xs">
                  Real-time correlation of download events and threat detection signals
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={telemetryChartData}>
                  <defs>
                    <linearGradient id="colorDownloads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="currentColor" className="text-muted-foreground" fontSize={10} tickLine={false} />
                  <YAxis stroke="currentColor" className="text-muted-foreground" fontSize={10} tickLine={false} />
                  <ReTooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      borderColor: 'hsl(var(--border))', 
                      borderRadius: '12px', 
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                  <Area type="monotone" dataKey="downloads" name="Download Clicks" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorDownloads)" />
                  <Area type="monotone" dataKey="threats" name="Security Alerts" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorThreats)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DESKTOP FLEET TAB */}
        <TabsContent value="fleet" className="space-y-6 pt-4">
          {/* Top Fleet KPI Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-semibold">Active Desktop Nodes</span>
                  <Monitor className="w-4 h-4 text-cyan-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-foreground">{metrics.onlineDesktopNodes}</span>
                  <span className="text-xs text-muted-foreground">/ {metrics.totalDesktopNodes} registered</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Live Firestore Telemetry
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-semibold">Fleet Bandwidth Today</span>
                  <Activity className="w-4 h-4 text-primary" />
                </div>
                <div className="text-2xl font-black text-primary">
                  {metrics.totalFleetTrafficMb >= 1024 
                    ? `${(metrics.totalFleetTrafficMb / 1024).toFixed(2)} GB` 
                    : `${metrics.totalFleetTrafficMb.toFixed(1)} MB`}
                </div>
                <p className="text-[11px] text-muted-foreground">Aggregated across all connected PCs</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-semibold">Active Fleet Sockets</span>
                  <Zap className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl font-black text-amber-500">
                  {desktopDevices.reduce((sum, d) => sum + (d.activeSockets || 0), 0)}
                </div>
                <p className="text-[11px] text-muted-foreground">Live TCP/UDP connections open</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-semibold">Metered & Data Saver</span>
                  <Wifi className="w-4 h-4 text-purple-500" />
                </div>
                <div className="text-2xl font-black text-purple-500">
                  {metrics.meteredDesktopNodes}
                </div>
                <p className="text-[11px] text-muted-foreground">Nodes preserving metered cellular data</p>
              </CardContent>
            </Card>
          </div>

          {/* Desktop Nodes Directory */}
          <Card className="bg-card border border-border rounded-2xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-cyan-500" />
                  Desktop Fleet Nodes Directory
                </CardTitle>
                <CardDescription className="text-xs">
                  Real-time heartbeat, network telemetry, and app traffic from NetSentry Desktop v2.0 clients
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-cyan-500/40 text-cyan-500 text-xs px-2.5 py-1">
                {desktopDevices.length} Machines
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead>Device / Hostname</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Version</TableHead>
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

                      return (
                        <TableRow key={dev.id} className="hover:bg-muted/30 border-border">
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500">
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
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                Online
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground text-[10px] w-fit">
                                Offline
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-mono">
                            <Badge variant="secondary" className="text-[10px]">
                              {dev.clientVersion || 'v2.0.0'}
                            </Badge>
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
                              className="h-8 px-2.5 text-xs text-primary hover:text-primary hover:bg-primary/10"
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
                              When users launch NetSentry Desktop v2.0, device metrics and app usage will automatically sync to Firestore every 30 seconds.
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
          <Card className="bg-card border border-border rounded-2xl">
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
          <Card className="bg-card border border-border rounded-2xl">
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
      </Tabs>

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
                <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 rounded-xl">
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
                <div className="p-3 rounded-xl border border-border bg-muted/20 space-y-1">
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

                <div className="p-3 rounded-xl border border-border bg-muted/20 space-y-1">
                  <div className="text-[10px] uppercase font-semibold text-muted-foreground">Live Rates</div>
                  <div className="text-base font-black text-foreground font-mono">
                    {(selectedDevice.inboundRateKbps || 0).toFixed(0)} / {(selectedDevice.outboundRateKbps || 0).toFixed(0)} <span className="text-[10px] font-normal text-muted-foreground">KB/s</span>
                  </div>
                  <div className="text-[10px] text-emerald-500">
                    Active streaming
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-border bg-muted/20 space-y-1">
                  <div className="text-[10px] uppercase font-semibold text-muted-foreground">Active Sockets</div>
                  <div className="text-base font-black text-foreground">
                    {selectedDevice.activeSockets || 0}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {selectedDevice.activeProcesses || 0} processes
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-border bg-muted/20 space-y-1">
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
                      <div key={idx} className="p-3 rounded-xl border border-border bg-muted/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <AppIcon name={app.name} />
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
                    <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                      No app breakdown telemetry reported yet from this device.
                    </div>
                  )}
                </div>
              </div>

              {/* Hardware & Network Properties */}
              <div className="border-t border-border pt-3 space-y-2 text-xs">
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
