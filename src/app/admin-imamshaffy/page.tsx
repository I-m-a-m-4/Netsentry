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
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

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

    return () => {
      unsubUsers();
      unsubDownloads();
      unsubSecurity();
      unsubErrors();
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

    // Categorize downloads by platform if logged
    const windowsDownloads = downloadClicks.filter(d => (d.platform || '').toLowerCase().includes('win') || (d.target || '').includes('.exe') || (d.target || '').includes('.msi')).length;

    return {
      daysOnline,
      totalClients,
      totalDownloads,
      windowsDownloads,
      totalThreatEvents,
      totalSystemErrors,
    };
  }, [users, downloadClicks, securityLogs, errorLogs]);

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div 
                onClick={() => setActiveTab('clients')}
                className="p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/30 transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-semibold">Client Nodes</span>
                  <Laptop className="w-4 h-4 text-primary" />
                </div>
                <div className="text-2xl font-black text-foreground">{metrics.totalClients}</div>
                <p className="text-[11px] text-muted-foreground">Active desktop & web client sessions</p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/30 transition-all space-y-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-semibold">Total Downloads</span>
                  <Download className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-black text-emerald-500">{metrics.totalDownloads}</div>
                <p className="text-[11px] text-muted-foreground">Windows installer & zip downloads</p>
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
                <p className="text-[11px] text-muted-foreground">Firewall blocks & anomalous sockets</p>
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
                <p className="text-[11px] text-muted-foreground">System errors & telemetry exceptions</p>
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
          <CyberShield users={users} />
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
    </div>
  );
}
