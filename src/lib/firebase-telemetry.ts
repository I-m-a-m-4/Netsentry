import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/instance';

export interface ClientTelemetryPayload {
  deviceName: string;
  clientVersion: string;
  todayRxMb: number;
  todayTxMb: number;
  totalDataMb: number;
  inboundRateKbps: number;
  outboundRateKbps: number;
  activeSockets: number;
  activeProcesses: number;
  isMetered: boolean;
  isWwan: boolean;
  isDataSaverMode: boolean;
  isFocusMode?: boolean;
  osName?: string;
  osVersion?: string;
  engineMemoryMb?: number;
  engineCpuPercent?: number;
  blockedThreatCount?: number;
  topApps: Array<{
    name: string;
    label: string;
    category: string;
    totalMb: number;
    inboundRate: number;
    outboundRate: number;
    sockets: number;
  }>;
}

// Generate or retrieve persistent local device ID
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'server_instance';
  try {
    const key = 'netsentry_desktop_device_id';
    let id = localStorage.getItem(key);
    if (!id) {
      id = 'pc_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
      localStorage.setItem(key, id);
    }
    return id;
  } catch (e) {
    return 'client_' + Date.now();
  }
}

let lastSyncedTotalMb = -1;
let lastSyncedTime = 0;
let lastSyncedStatus = '';

// Push live telemetry snapshot to Firestore collection `client_devices`
// Optimized to only write when data changes significantly or on heartbeat (saves ~80% writes)
export async function syncClientTelemetryToFirebase(payload: ClientTelemetryPayload): Promise<void> {
  if (!db || typeof window === 'undefined') return;

  const now = Date.now();
  const currentStatus = `${payload.isMetered}-${payload.isWwan}-${payload.isDataSaverMode}-${payload.isFocusMode}`;
  const totalMb = Number(payload.totalDataMb.toFixed(2));

  // Optimization: Skip write if data change is under 0.2 MB, status unchanged, and last sync was under 2 minutes ago
  const deltaMb = Math.abs(totalMb - lastSyncedTotalMb);
  const isHeartbeatDue = now - lastSyncedTime > 120000; // 2 minutes heartbeat
  const statusChanged = currentStatus !== lastSyncedStatus;

  if (lastSyncedTime > 0 && deltaMb < 0.2 && !isHeartbeatDue && !statusChanged) {
    return; // Skip redundant Firestore write to conserve quota & billing
  }

  try {
    const deviceId = getOrCreateDeviceId();
    const deviceRef = doc(db, 'client_devices', deviceId);

    await setDoc(deviceRef, {
      deviceId,
      deviceName: payload.deviceName || 'Windows PC',
      clientVersion: payload.clientVersion || 'v2.0.0',
      osName: payload.osName || 'Windows',
      osVersion: payload.osVersion || 'Windows 11',
      engineMemoryMb: payload.engineMemoryMb || 14.8,
      engineCpuPercent: payload.engineCpuPercent || 0.4,
      blockedThreatCount: payload.blockedThreatCount || 0,
      status: 'online',
      todayRxMb: Number(payload.todayRxMb.toFixed(2)),
      todayTxMb: Number(payload.todayTxMb.toFixed(2)),
      totalDataMb: totalMb,
      inboundRateKbps: Number(payload.inboundRateKbps.toFixed(1)),
      outboundRateKbps: Number(payload.outboundRateKbps.toFixed(1)),
      activeSockets: payload.activeSockets || 0,
      activeProcesses: payload.activeProcesses || 0,
      isMetered: Boolean(payload.isMetered),
      isWwan: Boolean(payload.isWwan),
      isDataSaverMode: Boolean(payload.isDataSaverMode),
      isFocusMode: Boolean(payload.isFocusMode),
      topApps: (payload.topApps || []).slice(0, 8),
      lastSeen: serverTimestamp(),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    lastSyncedTotalMb = totalMb;
    lastSyncedTime = now;
    lastSyncedStatus = currentStatus;
  } catch (error) {
    // Fail silently in telemetry loop so offline client works without interruption
    console.warn('NetSentry: Telemetry sync to Firebase skipped:', error);
  }
}

// Push security audit log to Firestore `security_logs`
export async function logSecurityEventToFirebase(message: string, type: 'info' | 'warning' | 'alert'): Promise<void> {
  if (!db || typeof window === 'undefined') return;

  try {
    const deviceId = getOrCreateDeviceId();
    await addDoc(collection(db, 'security_logs'), {
      deviceId,
      message,
      type,
      timestamp: serverTimestamp(),
      isoTime: new Date().toISOString(),
      source: 'desktop_agent'
    });
  } catch (error) {
    console.warn('NetSentry: Security log push failed:', error);
  }
}
