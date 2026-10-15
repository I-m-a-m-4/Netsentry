import { doc, setDoc, addDoc, updateDoc, collection, serverTimestamp } from 'firebase/firestore';
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
  isDataSaverMode?: boolean;
  isFocusMode?: boolean;
  osName?: string;
  osVersion?: string;
  engineMemoryMb?: number;
  engineCpuPercent?: number;
  blockedThreatCount?: number;
  visitCount?: number;
  firstSeenAt?: string;
  lastVisitAt?: string;
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

// Track and retrieve visit/session count for retention insight
export function getDeviceVisitStats(): { visitCount: number; firstSeenAt: string; lastVisitAt: string } {
  if (typeof window === 'undefined') {
    return { visitCount: 1, firstSeenAt: new Date().toISOString(), lastVisitAt: new Date().toISOString() };
  }

  try {
    const countKey = 'nethelm_visit_count';
    const firstSeenKey = 'nethelm_first_seen';
    const sessionKey = 'nethelm_session_tracked';

    let firstSeen = localStorage.getItem(firstSeenKey);
    if (!firstSeen) {
      firstSeen = new Date().toISOString();
      localStorage.setItem(firstSeenKey, firstSeen);
    }

    let visitCount = parseInt(localStorage.getItem(countKey) || '0', 10);

    // Only increment once per browser / desktop launch session
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, 'true');
      visitCount = visitCount + 1;
      localStorage.setItem(countKey, String(visitCount));
    }

    if (visitCount <= 0) {
      visitCount = 1;
      localStorage.setItem(countKey, '1');
    }

    return {
      visitCount,
      firstSeenAt: firstSeen,
      lastVisitAt: new Date().toISOString()
    };
  } catch (e) {
    return { visitCount: 1, firstSeenAt: new Date().toISOString(), lastVisitAt: new Date().toISOString() };
  }
}

let lastSyncedTotalMb = -1;
let lastSyncedTime = 0;
let lastSyncedStatus = '';

// Push live telemetry snapshot to Firestore collection `client_devices`
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
    const visitStats = getDeviceVisitStats();
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
      visitCount: payload.visitCount ?? visitStats.visitCount,
      firstSeenAt: payload.firstSeenAt ?? visitStats.firstSeenAt,
      lastVisitAt: payload.lastVisitAt ?? visitStats.lastVisitAt,
      topApps: (payload.topApps || []).slice(0, 8),
      lastSeen: serverTimestamp(),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    lastSyncedTotalMb = totalMb;
    lastSyncedTime = now;
    lastSyncedStatus = currentStatus;
  } catch (error) {
    // Fail silently in telemetry loop so offline client works without interruption
    console.warn('NetHelm: Telemetry sync to Firebase skipped:', error);
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

export interface CoffeeAttemptPayload {
  supporterName?: string;
  email: string;
  amount: number;
  currency: string;
  gateway: 'flutterwave' | 'paystack';
  status: 'initiated' | 'completed' | 'cancelled' | 'failed';
  reference: string;
  platform: string;
  deviceId?: string;
  metadata?: Record<string, any>;
}

// Log coffee / donation attempt to Firestore `coffee_attempts`
export async function logCoffeeAttemptToFirebase(payload: CoffeeAttemptPayload): Promise<string | null> {
  if (!db || typeof window === 'undefined') return null;

  try {
    const deviceId = payload.deviceId || getOrCreateDeviceId();
    const docRef = await addDoc(collection(db, 'coffee_attempts'), {
      ...payload,
      deviceId,
      timestamp: serverTimestamp(),
      isoTime: new Date().toISOString(),
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.warn('NetHelm: Failed to log coffee attempt:', error);
    return null;
  }
}

// Update coffee attempt status
export async function updateCoffeeAttemptStatus(
  attemptId: string, 
  status: 'completed' | 'cancelled' | 'failed',
  additionalData?: Record<string, any>
): Promise<void> {
  if (!db || !attemptId || typeof window === 'undefined') return;

  try {
    const attemptRef = doc(db, 'coffee_attempts', attemptId);
    await updateDoc(attemptRef, {
      status,
      updatedAt: serverTimestamp(),
      isoUpdatedAt: new Date().toISOString(),
      ...(additionalData || {})
    });
  } catch (error) {
    console.warn('NetHelm: Failed to update coffee attempt status:', error);
  }
}
