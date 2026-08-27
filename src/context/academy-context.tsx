'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Student, Subject, SyllabusItem, Academy, Admission, StudentProfile, MentorshipBooking, QueuedAction, AcademyStats, ActivityLog, SavedSession } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { getAuth } from 'firebase/auth';
import { collection, doc, query, where, orderBy, limit, addDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp, increment, getDoc, setDoc, getDocs, startAfter, getAggregateFromServer, count, sum } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { logAuditEvent } from '@/lib/audit';
import { secureStorage } from '@/lib/secure-storage';
import { idb } from '@/lib/idb';
import {
  syncProductsToOffline,
  syncProductToOffline,
  deleteMultipleProductsFromOffline,
  getCachedProducts,
  getCachedCustomers,
  syncCustomersToOffline,
  syncReceiptsToOffline,
  getCachedReceipts,
  getCachedBusiness,
  syncBusinessToOffline,
  syncStatsToOffline,
  getCachedStats,
  getLastSyncMetadata,
  setLastSyncMetadata,
  saveActionToOfflineQueue,
  getOfflineQueue,
  removeActionFromOfflineQueue,
  getMonthlyRevenue,
  clearAllTables,
  deleteReceiptFromOffline
} from '@/lib/sqlite-sync';

import {
  ACADEMY_CART_KEY,
  ACADEMY_STUDENT_KEY,
  ACADEMY_TAX_RATE_KEY,
  ACADEMY_DISCOUNT_KEY,
  ACADEMY_PAYMENT_METHOD_KEY,
  ACADEMY_AUTO_PRINT_KEY,
  CURRENCY_SYMBOLS,
  USER_PROFILE_KEY,
  BUSINESS_INSTANCE_KEY,
  ACADEMY_SAVED_SESSIONS_KEY
} from '@/lib/constants';
import { safeToDate } from '@/lib/utils';

interface AcademyContextType {
  academy: Academy | null;
  subjects: Subject[] | null;
  admissions: Admission[] | null;
  students: Student[] | null;
  mentorshipBookings: MentorshipBooking[] | null;
  stats: AcademyStats | null;
  searchCustomers: (term: string) => Promise<Student[]>;
  searchCustomersByField: (field: string, value: string) => Promise<Student[]>;
  searchReceipts: (term: string) => Promise<Admission[]>;
  fetchReceiptsInRange: (from: Date, to: Date, limitCount?: number) => Promise<Admission[]>;
  searchProducts: (term: string) => Promise<Subject[]>;
  searchProductsByField: (field: string, value: string) => Promise<Subject[]>;
  findProductBySku: (sku: string) => Promise<Subject | null>;
  fetchDetailedAnalytics: (from: Date, to: Date) => Promise<{ revenue: number, count: number, students: number }>;
  fetchMonthlyAnalytics: (months: number) => Promise<{ month: string, revenue: number, count: number }[]>;
  fetchMoreReceipts: () => Promise<number>;
  fetchMoreCustomers: () => Promise<number>;
  fetchMoreProducts: () => Promise<number>;
  currentUserProfile: StudentProfile | null;
  isLoading: boolean;
  isUserLoading: boolean;
  user: any;
  syllabus: SyllabusItem[];
  addToCart: (product: Subject, unitName?: string, multiplier?: number, priceOverride?: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  selectedStudent: Student | null;
  selectStudent: (customer: Student | null) => void;
  subtotal: number;
  tax: number;
  taxRate: number;
  discount: number;
  total: number;
  setTax: (taxRate: number) => void;
  setDiscount: (discountAmount: number) => void;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  autoPrint: boolean;
  setAutoPrint: (autoPrint: boolean) => void;
  resetSimulator: () => void;
  currencySymbol: string;
  currencyCode: string;
  triggerRefresh: () => void;
  isConfettiActive: boolean;
  triggerConfetti: () => void;
  setIsConfettiActive: (active: boolean) => void;
  queuedActions: QueuedAction[];
  isQueueProcessing: boolean;
  addToQueue: (action: Omit<QueuedAction, 'id' | 'timestamp' | 'status' | 'description'>, description: string) => string | null;
  mutateBusiness: (data?: any) => Promise<any> | void;
  isSyncing: boolean;
  isFullSyncingStudents: boolean;
  isFullSyncingSubjects: boolean;
  isFullSyncingAdmissions: boolean;
  processQueue: () => Promise<void>;
  clearFailedActions: () => void;
  optimisticProducts: Subject[];
  updateQueuedAction: (id: string, updates: Partial<QueuedAction>) => void;
  addProductWithImage: (productData: any, imageFile: File | null) => Promise<void>;
  removeFromQueue: (id: string) => void;
  impersonatedUserId: string | null;
  impersonateUser: (userId: string) => void;
  stopImpersonation: () => void;
  isImpersonating: boolean;
  isSubscriptionActive: boolean;
  firestore: any;
  savedSessions: SavedSession[];
  saveCurrentSession: (notes?: string) => void;
  resumeSavedSession: (parkedSessionId: string) => void;
  deleteSavedSession: (parkedSessionId: string) => void;
  parkActiveExamSession: (sessionData: any) => void;
  voidReceipt: (admissionId: string) => Promise<void>;
  users: StudentProfile[];
  activityLogs: ActivityLog[];
  isOnline: boolean;
}

const AcademyContext = createContext<AcademyContextType | undefined>(undefined);

export function AcademyProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [refreshKey, setRefreshKey] = useState(0);

  // --- States ---
  const [impersonatedUserId, setImpersonatedUserId] = useState<string | null>(() => (typeof window !== 'undefined' ? sessionStorage.getItem('zeneva_impersonated_user_id') : null));
  const isImpersonating = !!impersonatedUserId;
  const effectiveUserId = impersonatedUserId || user?.uid;

  const [isMounted, setIsMounted] = useState(false);
  const [isConfettiActive, setIsConfettiActive] = useState(false);
  const hasShownSyncToast = useRef(false);
  const hasHydratedRef = useRef(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFullSyncingStudents, setIsFullSyncingCustomers] = useState(false);
  const [isFullSyncingSubjects, setIsFullSyncingProducts] = useState(false);
  const [isFullSyncingAdmissions, setIsFullSyncingReceipts] = useState(false);
  const [extraStats, setExtraStats] = useState({ totalProducts: 0, totalStockValue: 0, lowStockCount: 0 });

  const [queuedActions, setQueuedActions] = useState<QueuedAction[]>(() => secureStorage.getItem<QueuedAction[]>('pos_queued_actions') || []);
  const queuedActionsRef = useRef<QueuedAction[]>(queuedActions);
  const [isQueueProcessing, setIsQueueProcessing] = useState(false);
  const [syncedSubjects, setSyncedProducts] = useState<Subject[]>(() => secureStorage.getItem<Subject[]>('pos_synced_products') || []);
  const [syncedStudents, setSyncedCustomers] = useState<Student[]>(() => secureStorage.getItem<Student[]>('pos_synced_customers') || []);
  const [syncedAdmissions, setSyncedReceipts] = useState<Admission[]>(() => secureStorage.getItem<Admission[]>('pos_synced_receipts') || []);
  const [syncedStudentProfiles, setSyncedUsers] = useState<StudentProfile[]>(() => secureStorage.getItem<StudentProfile[]>('pos_synced_users') || []);
  const [syncedActivityLogs, setSyncedAuditLogs] = useState<ActivityLog[]>(() => secureStorage.getItem<ActivityLog[]>('pos_synced_audit_logs') || []);
  const [offlineProfile, setOfflineProfile] = useState<StudentProfile | null>(() => secureStorage.getItem<StudentProfile>(USER_PROFILE_KEY));
  const [offlineBusiness, setOfflineBusiness] = useState<Academy | null>(() => secureStorage.getItem<Academy>(BUSINESS_INSTANCE_KEY));
  const [offlineStats, setOfflineStats] = useState<AcademyStats | null>(() => secureStorage.getItem<AcademyStats>('pos_offline_stats'));
  const [lastSyncedTimestamp, setLastSyncedTimestamp] = useState<number>(() => {
    const stored = secureStorage.getItem<number>('pos_last_synced_timestamp');
    // If no previous sync, default to 24 hours ago to catch recent changes on first load
    return stored || (Date.now() - 24 * 60 * 60 * 1000);
  });

  // 🌐 INTELLIGENT CONNECTIVITY ENGINE
  // navigator.onLine can give false positives (e.g. connected to a WiFi hotspot with no cellular data)
  // We solve this by performing a direct lightweight WAN ping in the background to guarantee REAL internet!
  const [isRealOnline, setIsRealOnline] = useState<boolean>(() => {
    if (typeof navigator !== 'undefined') return navigator.onLine;
    return true;
  });

  const consecutiveFailuresRef = useRef<number>(0);

  const verifyConnectivity = useCallback(async () => {
    if (typeof window === 'undefined') return;

    // 1. Native Disconnect is absolute and immediate
    if (!navigator.onLine) {
      consecutiveFailuresRef.current = 2; // Force threshold ceiling
      setIsRealOnline(false);
      return false;
    }

    // Browser-native Image Beaconing (bypasses ALL CORS/CORB/CSP limitations)
    const checkImage = (url: string): Promise<boolean> => {
      return new Promise((resolve) => {
        const img = new Image();
        const timer = setTimeout(() => {
          img.onload = null;
          img.onerror = null;
          img.src = "";
          resolve(false);
        }, 8500); // Expanded timeout to 8.5s

        img.onload = () => {
          clearTimeout(timer);
          resolve(true);
        };
        img.onerror = () => {
          clearTimeout(timer);
          resolve(false);
        };
        // Force bypass local cache with timestamp query
        img.src = `${url}?cacheBust=${Date.now()}`;
      });
    };

    // Define multiple disparate endpoints to bypass any regional or provider blocks
    const tasks = [
      checkImage("https://www.google.com/favicon.ico"),
      checkImage("https://github.com/favicon.ico")
    ];

    // Custom Race: Resolve to TRUE immediately on the FIRST successful probe.
    let finishedCount = 0;
    const hasConnection = await new Promise<boolean>((resolve) => {
      let resolved = false;
      tasks.forEach(task => {
        task.then(isSuccessful => {
          if (resolved) return;
          if (isSuccessful) {
            resolved = true;
            resolve(true);
          } else {
            finishedCount++;
            if (finishedCount === tasks.length) {
              resolved = true;
              resolve(false);
            }
          }
        });
      });
    });

    if (hasConnection) {
      // SUCCESS: Instantly restore connection and reset fails!
      consecutiveFailuresRef.current = 0;
      setIsRealOnline(true);
    } else {
      // PROBE FAILURE: Log it, but BUFFER the decision!
      consecutiveFailuresRef.current += 1;

      // Only declare offline in UI if BOTH probes in CONSECUTIVE runs fail entirely!
      // This flawlessly prevents flickering on high-latency or weak connections.
      if (consecutiveFailuresRef.current >= 2) {
        setIsRealOnline(false);
      }
    }

    return hasConnection;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnlineEvent = () => {
      // Wait 500ms to allow interface initialization, then execute WAN ping
      setTimeout(verifyConnectivity, 500);
    };
    const handleOfflineEvent = () => {
      setIsRealOnline(false);
    };

    window.addEventListener('online', handleOnlineEvent);
    window.addEventListener('offline', handleOfflineEvent);

    // Periodic background check every 16 seconds to balance cellular data usage and responsiveness
    const interval = setInterval(verifyConnectivity, 16000);

    // Perform verification on component load
    verifyConnectivity();

    return () => {
      window.removeEventListener('online', handleOnlineEvent);
      window.removeEventListener('offline', handleOfflineEvent);
      clearInterval(interval);
    };
  }, [verifyConnectivity]);

  // --- POS Local States ---
  const [syllabus, setCart] = useState<SyllabusItem[]>(() => secureStorage.getItem<SyllabusItem[]>(ACADEMY_CART_KEY) || []);
  const [selectedStudent, setSelectedCustomer] = useState<Student | null>(() => secureStorage.getItem<Student>(ACADEMY_STUDENT_KEY));
  const [taxRate, setTaxRate] = useState<number>(() => secureStorage.getItem<number>(ACADEMY_TAX_RATE_KEY) || 0);
  const [discount, setDiscount] = useState<number>(() => secureStorage.getItem<number>(ACADEMY_DISCOUNT_KEY) || 0);
  const [paymentMethod, setPaymentMethod] = useState<string>(() => secureStorage.getItem<string>(ACADEMY_PAYMENT_METHOD_KEY) || 'Cash');
  const [autoPrint, setAutoPrint] = useState<boolean>(() => {
    const s = secureStorage.getItem<boolean>(ACADEMY_AUTO_PRINT_KEY);
    return s === null ? true : s;
  });
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>(() => secureStorage.getItem<SavedSession[]>(ACADEMY_SAVED_SESSIONS_KEY) || []);
  const [lastUserId, setLastUserId] = useState<string | null>(null);
  const [isSubscriptionActiveFromRust, setIsSubscriptionActiveFromRust] = useState(true);

  // --- Firebase Queries ---
  const userDocRef = useMemoFirebase(() => (user && effectiveUserId && (!isUserLoading || isImpersonating) ? doc(firestore, 'users', effectiveUserId) : null), [user, effectiveUserId, isUserLoading, isImpersonating, firestore, refreshKey]);
  const { data: currentUserProfile } = useDoc<StudentProfile>(userDocRef);
  const isProfileReady = !!(user && currentUserProfile && (currentUserProfile.id === user.uid || currentUserProfile.id === impersonatedUserId));
  const academyId = isProfileReady ? currentUserProfile.academyId : (offlineProfile?.academyId || null);

  const businessDocRef = useMemoFirebase(() => (user && academyId ? doc(firestore, 'businessInstances', academyId) : null), [user, academyId, firestore]);
  const { data: initialBusiness, isLoading: isLoadingBusiness, mutate: mutateBusiness } = useDoc<Academy>(businessDocRef);

  // Sync to local storage for fast subsequent loads
  useEffect(() => {
    if (currentUserProfile) secureStorage.setItem(USER_PROFILE_KEY, currentUserProfile);
  }, [currentUserProfile]);

  useEffect(() => {
    secureStorage.setItem('pos_queued_actions', queuedActions);
    queuedActionsRef.current = queuedActions;
  }, [queuedActions]);

  useEffect(() => {
    secureStorage.setItem('pos_synced_products', syncedSubjects);
    const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__;
    if (!isTauri) idb.set('pos_synced_products', syncedSubjects);
  }, [syncedSubjects]);

  useEffect(() => {
    secureStorage.setItem('pos_synced_customers', syncedStudents);
    const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__;
    if (!isTauri) idb.set('pos_synced_customers', syncedStudents);
  }, [syncedStudents]);

  useEffect(() => {
    secureStorage.setItem('pos_synced_receipts', syncedAdmissions);
    const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__;
    if (!isTauri) idb.set('pos_synced_receipts', syncedAdmissions);
  }, [syncedAdmissions]);

  useEffect(() => {
    secureStorage.setItem('pos_synced_users', syncedStudentProfiles);
  }, [syncedStudentProfiles]);

  useEffect(() => {
    secureStorage.setItem('pos_synced_audit_logs', syncedActivityLogs);
  }, [syncedActivityLogs]);

  useEffect(() => {
    if (initialBusiness) secureStorage.setItem(BUSINESS_INSTANCE_KEY, initialBusiness);
  }, [initialBusiness]);

  const canFetchSubData = !!academyId && !!initialBusiness && initialBusiness.status !== 'deleted' && !!user && isProfileReady;

  // Optimized: Disabled real-time listener for large collection to cut Firestore read costs. 
  // System relies on fast local SQLite cache (syncedSubjects) and periodic background/delta syncs.
  const subjectsQuery = useMemoFirebase(() => null, []);
  const { data: initialSubjects, isLoading: isLoadingSubjects, mutate: mutateSubjects } = useCollection<Subject>(subjectsQuery);

  const statsDocRef = useMemoFirebase(() => (canFetchSubData ? doc(firestore, 'businessInstances', academyId, 'stats', 'overall') : null), [canFetchSubData, academyId, firestore]);
  const { data: initialStats } = useDoc<AcademyStats>(statsDocRef);

  useEffect(() => {
    if (initialStats) secureStorage.setItem('pos_offline_stats', initialStats);
  }, [initialStats]);

  // Background Stats Reconciliation
  useEffect(() => {
    if (!canFetchSubData || !firestore || !academyId || !initialStats) return;

    const reconcileStats = async () => {
      try {
        if (!getAuth().currentUser) return;
        const studentsCount = await getAggregateFromServer(query(collection(firestore, "students"), where("academyId", "==", academyId)), { total: count() });
        if (!getAuth().currentUser) return;
        const productsCount = await getAggregateFromServer(query(collection(firestore, "subjects"), where("academyId", "==", academyId)), { total: count() });
        if (!getAuth().currentUser) return;

        const realTotalStudents = studentsCount.data().total;
        const realTotalProducts = productsCount.data().total;

        if (realTotalStudents !== initialStats.totalCustomers || realTotalProducts !== initialStats.totalProducts) {
          await setDoc(statsDocRef!, {
            totalCustomers: realTotalStudents,
            totalProducts: realTotalProducts
          }, { merge: true });
        }
      } catch (e) {
        // Only log error if the user is actually still logged in (to suppress normal abort/logout permission errors)
        if (getAuth().currentUser) {
          console.error("Failed to reconcile stats:", e);
        }
      }
    };

    // Run reconciliation 5 seconds after load to avoid initial contention
    const timer = setTimeout(reconcileStats, 5000);
    return () => clearTimeout(timer);
  }, [canFetchSubData, academyId, !!initialStats]);

  // Optimized: Disabled real-time listener to avoid quadratic listener scaling cost.
  const admissionsQuery = useMemoFirebase(() => null, []);
  const { data: initialAdmissions, isLoading: isLoadingAdmissions, mutate: mutateAdmissions } = useCollection<Admission>(admissionsQuery);

  // Optimized: Disabled real-time listener for students to minimize daily reads.
  const studentsQuery = useMemoFirebase(() => null, []);
  const { data: initialStudents, isLoading: isLoadingStudents, mutate: mutateStudents } = useCollection<Student>(studentsQuery);


  const mentorshipBookingsQuery = useMemoFirebase(() => (canFetchSubData ? query(collection(firestore, 'businessInstances', academyId, 'mentorshipBookings')) : null), [canFetchSubData, academyId, firestore]);
  const { data: mentorshipBookings } = useCollection<MentorshipBooking>(mentorshipBookingsQuery);

  const subjects = useMemo(() => {
    if (initialSubjects === null && syncedSubjects.length === 0 && isRealOnline && !!academyId && isFullSyncingSubjects) return null;
    let merged = [...(initialSubjects || [])];
    const existingIds = new Set(merged.map(p => p.id));
    syncedSubjects.forEach(p => { if (!existingIds.has(p.id)) merged.push(p); else { const idx = merged.findIndex(m => m.id === p.id); if (idx !== -1) merged[idx] = p; } });
    const deletedIds = new Set(queuedActions.filter(a => a.type === 'delete-product').flatMap(a => a.payload.productIds));
    if (deletedIds.size > 0) merged = merged.filter(p => !deletedIds.has(p.id));
    queuedActions.forEach(action => {
      if (action.type === 'update-product') { const idx = merged.findIndex(p => p.id === action.payload.subjectId); if (idx !== -1) merged[idx] = { ...merged[idx], ...action.payload.values }; }
      else if (action.type === 'bulk-update-subjects') { action.payload.productIds.forEach((id: string) => { const idx = merged.findIndex(p => p.id === id); if (idx !== -1) merged[idx] = { ...merged[idx], ...action.payload.values }; }); }
      else if (action.type === 'add-product') { if (!merged.find(p => p.id === action.payload.id)) merged.push({ ...action.payload, isOptimistic: true }); }
      else if (action.type === 'complete-registration') {
        const items = action.payload.receiptData?.items || action.payload.items;
        if (Array.isArray(items)) items.forEach((item: any) => { const idx = merged.findIndex(p => p.id === item.subjectId); if (idx !== -1) merged[idx] = { ...merged[idx], stock: (merged[idx].stock || 0) - item.quantity }; });
      }
    });
    // Client-side sort by createdAt desc
    return merged.sort((a, b) => {
      const dateA = a.createdAt?.toMillis?.() || a.createdAt?.seconds || 0;
      const dateB = b.createdAt?.toMillis?.() || b.createdAt?.seconds || 0;
      return dateB - dateA;
    });
  }, [initialSubjects, syncedSubjects, queuedActions, isRealOnline, academyId]);

  const profile = useMemo(() => {
    if (currentUserProfile) return currentUserProfile;
    if (offlineProfile && user && offlineProfile.id === user.uid) return offlineProfile;
    return null;
  }, [currentUserProfile, offlineProfile, user?.uid]);

  const academy = useMemo(() => {
    const base = initialBusiness || offlineBusiness;
    if (!base) return null;
    const settingsUpdates = queuedActions.filter(a => a.type === 'update-settings');
    if (settingsUpdates.length === 0) return base;
    let result = { ...base };
    settingsUpdates.forEach(action => {
      Object.keys(action.payload).forEach(key => {
        if (key.includes('.')) {
          const parts = key.split('.'); let curr: any = result;
          for (let i = 0; i < parts.length - 1; i++) { curr[parts[i]] = { ...curr[parts[i]] }; curr = curr[parts[i]]; }
          curr[parts[parts.length - 1]] = action.payload[key];
        } else (result as any)[key] = action.payload[key];
      });
    });
    return result;
  }, [initialBusiness, offlineBusiness, queuedActions]);

  const admissions = useMemo(() => {
    const queuedRegistrations = queuedActions.filter(a => a.type === 'complete-registration');
    if (initialAdmissions === null && syncedAdmissions.length === 0 && queuedRegistrations.length === 0 && isRealOnline && !!academyId) return null;

    let merged = [...(initialAdmissions || [])];
    const existingIds = new Set(merged.map(r => r.id));
    syncedAdmissions.forEach(r => {
      if (!existingIds.has(r.id)) {
        merged.push(r);
        existingIds.add(r.id);
      }
    });
    queuedRegistrations.forEach(action => {
      const receipt = action.payload.receiptData;
      if (receipt && !existingIds.has(receipt.id)) {
        merged.push({
          ...receipt,
          isOptimistic: true,
          createdAt: receipt.createdAt || new Date(action.timestamp)
        });
        existingIds.add(receipt.id);
      }
    });

    // Filter out voided admissions currently in the sync queue
    const voidedIds = new Set(queuedActions.filter(a => a.type === 'delete-receipt').map(a => a.payload.admissionId));
    if (voidedIds.size > 0) {
      merged = merged.filter(r => !voidedIds.has(r.id));
    }

    // Client-side sort by createdAt desc
    return merged.sort((a, b) => {
      const getMillis = (dateVal: any) => {
        const date = safeToDate(dateVal);
        return date.getTime();
      };
      return getMillis(b.createdAt) - getMillis(a.createdAt);
    });
  }, [initialAdmissions, syncedAdmissions, queuedActions, isRealOnline, academyId]);

  const students = useMemo(() => {
    let merged = [...(initialStudents || [])];
    const existingIds = new Set(merged.map(c => c.id));
    syncedStudents.forEach(c => {
      if (!existingIds.has(c.id)) {
        merged.push(c);
      } else {
        // Only overwrite if the local data is actually newer (using updatedAt)
        const idx = merged.findIndex(m => m.id === c.id);
        if (idx !== -1) {
          const serverDate = safeToDate(merged[idx].updatedAt).getTime();
          const localDate = safeToDate(c.updatedAt).getTime();
          if (localDate > serverDate) {
            merged[idx] = { ...merged[idx], ...c };
          }
        }
      }
    });
    const deletedIds = new Set(queuedActions.filter(a => a.type === 'delete-customer').map(a => a.payload.id));
    merged = merged.filter(c => !deletedIds.has(c.id));
    queuedActions.forEach(action => {
      if (action.type === 'update-customer') {
        const idx = merged.findIndex(c => c.id === action.payload.id);
        if (idx !== -1) merged[idx] = { ...merged[idx], ...action.payload.values };
      }
      else if (action.type === 'add-customer') {
        if (!merged.find(c => c.id === action.payload.id)) merged.push({ ...action.payload, isOptimistic: true });
      }
      else if (action.type === 'complete-registration') {
        const { selectedStudent, secureTotal } = action.payload;
        if (selectedStudent?.id) {
          const idx = merged.findIndex(c => c.id === selectedStudent.id);
          if (idx !== -1) {
            const current = merged[idx];
            merged[idx] = {
              ...current,
              totalSpent: (Number(current.totalSpent) || 0) + secureTotal,
              loyaltyPoints: (current.loyaltyPoints || 0) + (action.payload.pointsEarned || 0),
              lastPurchaseDate: action.timestamp
            };
          }
        }
      }
    });
    return merged.sort((a, b) => (Number(b.totalSpent) || 0) - (Number(a.totalSpent) || 0));
  }, [initialStudents, syncedStudents, queuedActions]);

  const users = useMemo(() => {
    if (syncedStudentProfiles.length > 0) return syncedStudentProfiles;
    return [];
  }, [syncedStudentProfiles]);

  const activityLogs = useMemo(() => {
    if (syncedActivityLogs.length > 0) return syncedActivityLogs;
    return [];
  }, [syncedActivityLogs]);

  const stats = useMemo(() => {
    const baseStats = initialStats || offlineStats;
    if (!baseStats) return null;

    const queuedRegistrations = queuedActions.filter(a => a.type === 'complete-registration' && a.status === 'pending');
    if (queuedRegistrations.length === 0) return baseStats;

    // Optimistically apply pending offline sales to display metrics
    let pendingRevenue = 0;
    let pendingUnits = 0;

    queuedRegistrations.forEach(sale => {
      const data = sale.payload.receiptData || sale.payload;
      pendingRevenue += Number(data.total) || 0;
      const items = data.items || [];
      items.forEach((i: any) => pendingUnits += (Number(i.quantity) || 0));
    });

    return {
      ...baseStats,
      totalBookingValue: (baseStats.totalBookingValue || 0) + pendingRevenue,
      totalSessions: (baseStats.totalSessions || 0) + queuedRegistrations.length,
      totalUnitsCompleted: (baseStats.totalUnitsCompleted || 0) + pendingUnits,
    };
  }, [initialStats, offlineStats, queuedActions]);

  // --- Functions ---
  const refreshData = useCallback(async (silent = false) => {
    const isOnline = isRealOnline;
    if (!user || !academyId || !firestore || isSyncing || !isOnline) return;

    if (!silent) setIsSyncing(true);
    try {
      // Delta Sync: Only fetch documents updated since our last check
      // This turns 10,000 reads into 1-10 reads.
      const lastCheck = new Date(lastSyncedTimestamp);

      const pQuery = query(collection(firestore, "subjects"), where("academyId", "==", academyId), where("updatedAt", ">", lastCheck), limit(500));
      const cQuery = query(collection(firestore, "students"), where("academyId", "==", academyId), where("updatedAt", ">", lastCheck), limit(500));
      const rQuery = query(collection(firestore, "admissions"), where("academyId", "==", academyId), where("createdAt", ">", lastCheck), limit(100));

      const [pSnap, cSnap, rSnap] = await Promise.all([getDocs(pQuery), getDocs(cQuery), getDocs(rQuery)]);

      const newProducts = pSnap.docs.map(d => ({ ...d.data(), id: d.id } as Subject));
      const newCustomers = cSnap.docs.map(d => ({ ...d.data(), id: d.id } as Student));
      const newReceipts = rSnap.docs.map(d => ({ ...d.data(), id: d.id } as Admission));

      // Anti-Ghosting Guard: Prevent network delta-sync from re-injecting items currently pending deletion
      const deletedProductIds = new Set(queuedActionsRef.current.filter(a => a.type === 'delete-product').flatMap(a => a.payload.productIds));
      const deletedCustomerIds = new Set(queuedActionsRef.current.filter(a => a.type === 'delete-customer').map(a => a.payload.id));
      const voidedReceiptIds = new Set(queuedActionsRef.current.filter(a => a.type === 'delete-receipt').map(a => a.payload.admissionId));

      const filteredProducts = newProducts.filter(p => !deletedProductIds.has(p.id));
      const filteredCustomers = newCustomers.filter(c => !deletedCustomerIds.has(c.id));
      const filteredReceipts = newReceipts.filter(r => !voidedReceiptIds.has(r.id));

      if (filteredProducts.length > 0) {
        setSyncedProducts(prev => {
          const merged = [...prev];
          filteredProducts.forEach(np => {
            const idx = merged.findIndex(p => p.id === np.id);
            if (idx !== -1) merged[idx] = np;
            else merged.push(np);
          });
          return merged;
        });
      }

      if (filteredCustomers.length > 0) {
        setSyncedCustomers(prev => {
          const merged = [...prev];
          filteredCustomers.forEach(nc => {
            const idx = merged.findIndex(c => c.id === nc.id);
            if (idx !== -1) merged[idx] = nc;
            else merged.push(nc);
          });
          return merged;
        });
      }
      if (filteredReceipts.length > 0) {
        setSyncedReceipts(prev => {
          const merged = [...prev];
          filteredReceipts.forEach(nr => {
            const idx = merged.findIndex(r => r.id === nr.id);
            if (idx !== -1) merged[idx] = nr;
            else merged.push(nr);
          });
          return merged;
        });
      }
      const now = Date.now();
      setLastSyncedTimestamp(now);
      secureStorage.setItem('pos_last_synced_timestamp', now);

      if ((newProducts.length > 0 || newCustomers.length > 0 || newReceipts.length > 0) && !hasShownSyncToast.current && !silent) {
        toast({ title: "Operational Sync Complete", description: `Successfully synchronized subjects, students, and recent enrollment data.` });
        hasShownSyncToast.current = true;
      }
    } catch (error) {
      if (!silent) console.error("Delta Sync Failed:", error);
    } finally {
      if (!silent) setIsSyncing(false);
    }
  }, [academyId, firestore, isSyncing, lastSyncedTimestamp, toast, isRealOnline]);

  const fetchInitialAdmissions = useCallback(async () => {
    if (!user || !academyId || !firestore || !isRealOnline) return;
    try {
      const q = query(collection(firestore, "admissions"), where("academyId", "==", academyId), orderBy("createdAt", "desc"), limit(200));
      const snap = await getDocs(q);
      const fetchedRecs = snap.docs.map(d => ({ ...d.data(), id: d.id } as Admission));

      // 1. Anti-Ghosting Guard: Prevent re-injecting admissions that this CLIENT has queued for deletion
      const voidedReceiptIds = new Set(queuedActionsRef.current.filter(a => a.type === 'delete-receipt').map(a => a.payload.admissionId));
      const filteredRecs = fetchedRecs.filter(r => !voidedReceiptIds.has(r.id));

      // 2. Server Deletion Reconciliation: Detect and purge items deleted from Firestore by OTHER clients
      const serverIds = new Set(fetchedRecs.map(r => r.id));
      const purgedLocalIds: string[] = [];

      setSyncedReceipts(prev => {
        if (fetchedRecs.length === 0) return prev;

        // Extract the timestamp of the oldest server document in our top 200 retrieval window
        const oldestFetchedDate = safeToDate(fetchedRecs[fetchedRecs.length - 1].createdAt).getTime();

        const prunedPrev = prev.filter(localR => {
          // If it exists in the fetched payload, keep it (it will be updated below)
          if (serverIds.has(localR.id)) return true;

          // If the local client is actively pending a write/complete-sale for this receipt, DO NOT delete it
          const pendingRegistration = queuedActionsRef.current.some(a => a.type === 'complete-registration' && (a.payload.receiptData?.id === localR.id || a.payload.id === localR.id));
          if (pendingRegistration) return true;

          const localTime = safeToDate(localR.createdAt).getTime();

          // If the receipt timestamp is newer than the oldest retrieved document BUT the document is MISSING
          // from the server payload, it must have been deleted from Firestore by another client!
          if (localTime >= oldestFetchedDate) {
            purgedLocalIds.push(localR.id);
            return false; // Prune it from the array!
          }

          // Keep older historical records that are beyond the 200-item retrieval window limit
          return true;
        });

        const merged = [...prunedPrev];
        filteredRecs.forEach(nr => {
          const idx = merged.findIndex(r => r.id === nr.id);
          if (idx !== -1) {
            merged[idx] = nr;
          } else {
            merged.push(nr);
          }
        });

        return merged
          .sort((a, b) => safeToDate(b.createdAt).getTime() - safeToDate(a.createdAt).getTime());
      });

      // 3. Sync changes and propagate deletions down to offline SQLite storage if in Tauri desktop environment
      if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
        await syncReceiptsToOffline(academyId, fetchedRecs);

        for (const idToPurge of purgedLocalIds) {
          await deleteReceiptFromOffline(idToPurge);
        }
      }
    } catch (error) {
      console.error("Failed to fetch initial admissions:", error);
    }
  }, [academyId, firestore, user, isRealOnline]);

  // Effect to pull initial historical admissions once on startup if the local array is empty.
  useEffect(() => {
    const isOnline = isRealOnline;
    if (user && academyId && firestore && isOnline) {
      fetchInitialAdmissions();
    }
  }, [academyId, firestore, fetchInitialAdmissions, refreshKey, user, isRealOnline]);

  const fetchInitialUsers = useCallback(async () => {
    const isOnline = isRealOnline;
    if (!user || !academyId || !firestore || !isOnline) return;
    try {
      const snap = await getDocs(query(collection(firestore, "users"), where("academyId", "==", academyId)));
      const fetched = snap.docs.map(d => ({ ...d.data(), id: d.id } as StudentProfile));
      if (fetched.length > 0) {
        setSyncedUsers(prev => {
          const merged = [...prev];
          fetched.forEach(nu => {
            const idx = merged.findIndex(u => u.id === nu.id);
            if (idx !== -1) merged[idx] = nu;
            else merged.push(nu);
          });
          return merged;
        });
      }
    } catch (e: any) {
      if (e?.code === 'permission-denied' || e?.message?.includes('permission')) return;
      console.error("Fetch initial users failed:", e);
    }
  }, [academyId, firestore, user, isRealOnline]);

  const fetchInitialAuditLogs = useCallback(async () => {
    const isOnline = isRealOnline;
    if (!user || !academyId || !firestore || !isOnline) return;
    try {
      const snap = await getDocs(query(collection(firestore, 'businessInstances', academyId, 'activityLogs'), orderBy('createdAt', 'desc'), limit(50)));
      const fetched = snap.docs.map(d => ({ ...d.data(), id: d.id } as ActivityLog));
      if (fetched.length > 0) {
        setSyncedAuditLogs(prev => {
          const merged = [...prev];
          fetched.forEach(na => {
            const idx = merged.findIndex(a => a.id === na.id);
            if (idx !== -1) merged[idx] = na;
            else merged.push(na);
          });
          return merged.sort((a, b) => safeToDate(b.createdAt).getTime() - safeToDate(a.createdAt).getTime()).slice(0, 200);
        });
      }
    } catch (e: any) {
      if (e?.code === 'permission-denied' || e?.message?.includes('permission')) return;
      console.error("Fetch initial audit logs failed:", e);
    }
  }, [academyId, firestore, user, isRealOnline]);

  useEffect(() => {
    const isOnline = isRealOnline;
    if (user && academyId && firestore && isOnline) {
      fetchInitialUsers();
      fetchInitialAuditLogs();
    }
  }, [academyId, firestore, fetchInitialUsers, fetchInitialAuditLogs, refreshKey, user, isRealOnline]);

  const fetchFullStudents = useCallback(async () => {
    const isOnline = isRealOnline;
    if (!user || !academyId || !firestore || isFullSyncingStudents || !isOnline) return;

    setIsFullSyncingCustomers(true);
    let allFetched: Student[] = [];
    let lastDoc: any = null;
    let hasMore = true;
    const BATCH_SIZE = 5000;

    try {
      while (hasMore) {
        let q = query(
          collection(firestore, "students"),
          where("academyId", "==", academyId),
          limit(BATCH_SIZE)
        );

        if (lastDoc) q = query(q, startAfter(lastDoc));

        const snap = await getDocs(q);
        if (snap.empty) {
          hasMore = false;
        } else {
          const batch = snap.docs.map(d => ({ ...d.data(), id: d.id } as Student));
          allFetched = [...allFetched, ...batch];

          setSyncedCustomers(prev => {
            const merged = [...prev];
            batch.forEach(nc => {
              const idx = merged.findIndex(c => c.id === nc.id);
              if (idx !== -1) merged[idx] = nc;
              else merged.push(nc);
            });
            return merged;
          });

          lastDoc = snap.docs[snap.docs.length - 1];
          if (snap.docs.length < BATCH_SIZE) hasMore = false;
        }
      }

      setLastSyncMetadata(academyId, 'full_customers_sync', Date.now());

      // Only show the toast if it's been more than 24 hours since the last success
      // to avoid annoying the user on every app start.
      const lastToast = Number(localStorage.getItem('last_sync_toast_time') || 0);
      if (Date.now() - lastToast > 24 * 60 * 60 * 1000) {
        toast({ title: "Full Sync Successful", description: `Synchronized ${allFetched.length} students for offline access.` });
        localStorage.setItem('last_sync_toast_time', Date.now().toString());
      }
    } catch (error) {
      console.error("Full Student Sync Failed:", error);
    } finally {
      setIsFullSyncingCustomers(false);
    }
  }, [academyId, firestore, isFullSyncingStudents, toast, user, isRealOnline]);

  const fetchFullSubjects = useCallback(async () => {
    const isOnline = isRealOnline;
    if (!user || !academyId || !firestore || isFullSyncingSubjects || !isOnline) return;

    setIsFullSyncingProducts(true);
    let allFetched: Subject[] = [];
    let lastDoc: any = null;
    let hasMore = true;
    const BATCH_SIZE = 2000; // Smaller batch for subjects due to potential image data/complexity

    try {
      while (hasMore) {
        let q = query(
          collection(firestore, "subjects"),
          where("academyId", "==", academyId),
          orderBy("name", "asc"),
          limit(BATCH_SIZE)
        );

        if (lastDoc) q = query(q, startAfter(lastDoc));

        const snap = await getDocs(q);
        if (snap.empty) {
          hasMore = false;
        } else {
          const batch = snap.docs.map(d => ({ ...d.data(), id: d.id } as Subject));
          allFetched = [...allFetched, ...batch];

          setSyncedProducts(prev => {
            const merged = [...prev];
            batch.forEach(np => {
              const idx = merged.findIndex(p => p.id === np.id);
              if (idx !== -1) merged[idx] = np;
              else merged.push(np);
            });
            return merged;
          });

          lastDoc = snap.docs[snap.docs.length - 1];
          if (snap.docs.length < BATCH_SIZE) hasMore = false;
        }
      }

      setLastSyncMetadata(academyId, 'full_products_sync', Date.now());

      const lastToast = Number(localStorage.getItem('last_product_sync_toast_time') || 0);
      if (Date.now() - lastToast > 24 * 60 * 60 * 1000) {
        toast({ title: "Subject Catalog Synced", description: `Synchronized ${allFetched.length} subjects for offline access.` });
        localStorage.setItem('last_product_sync_toast_time', Date.now().toString());
      }
    } catch (error) {
      console.error("Full Subject Sync Failed:", error);
    } finally {
      setIsFullSyncingProducts(false);
    }
  }, [academyId, firestore, isFullSyncingSubjects, toast, user, isRealOnline]);

  const fetchFullReceipts = useCallback(async () => {
    const isOnline = isRealOnline;
    if (!user || !academyId || !firestore || isFullSyncingAdmissions || !isOnline) return;

    setIsFullSyncingReceipts(true);
    let allFetched: Admission[] = [];
    let lastDoc: any = null;
    let hasMore = true;
    const BATCH_SIZE = 2500;

    try {
      while (hasMore) {
        let q = query(
          collection(firestore, "admissions"),
          where("academyId", "==", academyId),
          orderBy("createdAt", "desc"),
          limit(BATCH_SIZE)
        );

        if (lastDoc) q = query(q, startAfter(lastDoc));

        const snap = await getDocs(q);
        if (snap.empty) {
          hasMore = false;
        } else {
          const batch = snap.docs.map(d => ({ ...d.data(), id: d.id } as Admission));
          allFetched = [...allFetched, ...batch];

          setSyncedReceipts(prev => {
            const merged = [...prev];
            batch.forEach(nr => {
              const idx = merged.findIndex(r => r.id === nr.id);
              if (idx !== -1) merged[idx] = nr;
              else merged.push(nr);
            });
            return merged.sort((a, b) => safeToDate(b.createdAt).getTime() - safeToDate(a.createdAt).getTime());
          });

          if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
            await syncReceiptsToOffline(academyId, batch);
          } else {
            const cumulative = await idb.get<Admission[]>('pos_synced_receipts') || [];
            const mergedIndexed = [...cumulative];
            batch.forEach(nr => {
              const idx = mergedIndexed.findIndex(r => r.id === nr.id);
              if (idx !== -1) mergedIndexed[idx] = nr;
              else mergedIndexed.push(nr);
            });
            await idb.set('pos_synced_receipts', mergedIndexed);
          }

          lastDoc = snap.docs[snap.docs.length - 1];
          if (snap.docs.length < BATCH_SIZE) hasMore = false;
        }
      }

      setLastSyncMetadata(academyId, 'full_receipts_sync', Date.now());

      const lastToast = Number(localStorage.getItem('last_receipt_sync_toast_time') || 0);
      if (Date.now() - lastToast > 24 * 60 * 60 * 1000) {
        toast({ title: "Enrollment History Synced", description: `Synchronized ${allFetched.length} admissions for full offline access.` });
        localStorage.setItem('last_receipt_sync_toast_time', Date.now().toString());
      }
    } catch (error) {
      console.error("Full Admission Sync Failed:", error);
    } finally {
      setIsFullSyncingReceipts(false);
    }
  }, [academyId, firestore, isFullSyncingAdmissions, toast, user, isRealOnline]);

  const triggerRefresh = useCallback(() => {
    refreshData();
    setRefreshKey(prev => prev + 1); // Keep for legacy triggers
  }, [refreshData]);

  const triggerConfetti = useCallback(() => setIsConfettiActive(true), []);

  const calculateLoyaltyPoints = useCallback(async (amount: number) => {
    if (!academy?.settings?.loyaltyProgramEnabled) return 0;
    if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
      try { const { invoke } = await import('@tauri-apps/api/core'); return await invoke<number>('calculate_secure_loyalty', { amount }); } catch { }
    }
    return Math.floor(amount * (academy?.settings?.pointsPerUnit || 0));
  }, [academy]);

  const processQueue = useCallback(async () => {
    const effectiveProfile = currentUserProfile || offlineProfile;
    if (isQueueProcessing || !isRealOnline || !firestore || !academyId || !effectiveProfile) return;
    const pending = queuedActions.filter(a => a.status === 'pending');
    if (pending.length === 0) return;
    setIsQueueProcessing(true);

    try {
      // PERFORMANCE & COST OPTIMIZATION:
      // Efficiently gather sequential 'complete-registration' triggers into unified Firestore batches.
      // This guarantees transactional consistency while collapsing high-traffic writes.
      const operationalSequence: any[][] = [];
      let activeRegistrationsAccum: any[] = [];

      for (const action of pending) {
        if (action.type === 'complete-registration') {
          activeRegistrationsAccum.push(action);
          if (activeRegistrationsAccum.length >= 10) { // Groups up to 10 sales into ONE network payload
            operationalSequence.push(activeRegistrationsAccum);
            activeRegistrationsAccum = [];
          }
        } else {
          // Flush cumulative sale block before interrupting with different operations
          if (activeRegistrationsAccum.length > 0) {
            operationalSequence.push(activeRegistrationsAccum);
            activeRegistrationsAccum = [];
          }
          operationalSequence.push([action]); // Individual execution path for administrative security
        }
      }
      if (activeRegistrationsAccum.length > 0) operationalSequence.push(activeRegistrationsAccum);

      const successfullyCommitIds: string[] = [];

      // Execute each defined operation sequence loop
      for (const chunk of operationalSequence) {
        const batch = writeBatch(firestore);

        // ----------------------------------------------------------------
        // MODE A: The Sale Aggregation Pipeline
        // ----------------------------------------------------------------
        if (chunk.length > 1 || (chunk.length === 1 && chunk[0].type === 'complete-registration')) {

          const combinedStocks = new Map<string, number>();
          const consolidatedCust = new Map<string, { totalSpent: number, loyaltyPoints?: number }>();
          let aggregateSales = 0;
          let aggregateRev = 0;
          let aggregateUnits = 0;

          try {
            chunk.forEach(action => {
              // Write Discrete Admission Record
              const rRef = doc(firestore, 'admissions', action.payload.receiptData.id);
              batch.set(rRef, { ...action.payload.receiptData, academyId: academyId, createdAt: serverTimestamp() });

              // Cascade product stock values (LIFO sequence logic applies naturally via Map overwrite)
              action.payload.productUpdates.forEach((u: any) => combinedStocks.set(u.id, u.newStock));

              // Cumulate operational metrics
              aggregateSales += 1;
              aggregateRev += (action.payload.receiptData.total || 0);
              aggregateUnits += (action.payload.receiptData.items?.reduce((a: number, item: any) => a + (item.quantity || 0), 0) || 0);

              // Aggregate Student Ledger Deltas
              const cu = action.payload.customerUpdate;
              if (cu && cu.id) {
                const existing = consolidatedCust.get(cu.id) || { totalSpent: 0 };
                consolidatedCust.set(cu.id, {
                  totalSpent: existing.totalSpent + (cu.totalSpent || 0),
                  loyaltyPoints: cu.loyaltyPoints !== undefined ? cu.loyaltyPoints : existing.loyaltyPoints
                });
              }
            });

            // Step B: Flush all cumulative values from the local aggregation buffer into Firestore batch commands.
            combinedStocks.forEach((stockVal, pId) => {
              batch.update(doc(firestore, 'subjects', pId), { stock: stockVal, updatedAt: serverTimestamp() });
            });

            consolidatedCust.forEach((data, cId) => {
              const updatesObj: any = { updatedAt: serverTimestamp() };
              if (data.totalSpent > 0) updatesObj.totalSpent = increment(data.totalSpent);
              if (data.loyaltyPoints !== undefined) updatesObj.loyaltyPoints = data.loyaltyPoints;
              batch.update(doc(firestore, 'students', cId), updatesObj);
            });

            // Ship the final, lightweight consolidated payload!
            await batch.commit();

            // ----------------------------------------------------------------
            // Secondary Non-Critical Operations (Stats & Notifications)
            // We run these separately so a permission error for a vendor operator
            // doesn't cause the entire sale batch to fail and get stuck in the queue.
            // ----------------------------------------------------------------
            try {
              const secondaryBatch = writeBatch(firestore);
              let hasSecondaryWrites = false;

              if (aggregateSales > 0 || aggregateRev > 0 || aggregateUnits > 0) {
                secondaryBatch.set(doc(firestore, 'businessInstances', academyId, 'stats', 'overall'), {
                  totalSessions: increment(aggregateSales),
                  totalBookingValue: increment(aggregateRev),
                  totalUnitsCompleted: increment(aggregateUnits)
                }, { merge: true });
                hasSecondaryWrites = true;
              }

              chunk.forEach(action => {
                action.payload.productUpdates.forEach((u: any) => {
                  const currentProduct = subjects?.find(p => p.id === u.id);
                  if (currentProduct && currentProduct.lowStockThreshold && u.newStock <= currentProduct.lowStockThreshold) {
                    const alertRef = doc(collection(firestore, `users/${effectiveProfile.id}/notifications`));
                    secondaryBatch.set(alertRef, {
                      title: "Low Stock Alert",
                      body: `${currentProduct.name} is running low. Remaining: ${u.newStock}`,
                      createdAt: serverTimestamp(),
                      read: false,
                      type: 'inventory',
                      subjectId: currentProduct.id
                    });
                    hasSecondaryWrites = true;
                  }
                });
              });

              if (hasSecondaryWrites) await secondaryBatch.commit();
            } catch (secondaryError) {
              console.warn("POS Queue :: Non-critical stats/notification update failed (likely RBAC). Sale was safely recorded.", secondaryError);
            }

            // Mark chunk as successfully processed
            chunk.forEach(c => successfullyCommitIds.push(c.id));

            // 🚀 OPTIMIZATION FIX: Re-inject transaction records into the local edge cache
            // since real-time Firestore listeners have been severed to eliminate cost overruns.
            const finalizedReceipts = chunk.map(c => {
              const rd = c.payload.receiptData;
              return {
                ...rd,
                createdAt: safeToDate(rd.createdAt) || new Date() // Formally coerce timestamps into healthy JS Dates
              };
            });

            // 1. Instant UI population for the Receipts Page
            setSyncedReceipts(prev => {
              const deduped = [...prev];
              finalizedReceipts.forEach(r => {
                const exists = deduped.some(d => d.id === r.id);
                if (!exists) deduped.unshift(r); // Adds new records to top
              });
              return deduped;
            });

            // 2. Fast-track locally synchronized stock reductions to avoid edge-desync
            if (combinedStocks.size > 0) {
              setSyncedProducts(prev => {
                const fresh = [...prev];
                combinedStocks.forEach((stockVal, subjectId) => {
                  const idx = fresh.findIndex(p => p.id === subjectId);
                  if (idx !== -1) fresh[idx] = { ...fresh[idx], stock: stockVal };
                });
                return fresh;
              });
            }

            // 3. Cascade customer total-spend velocity changes directly to local state
            if (consolidatedCust.size > 0) {
              setSyncedCustomers(prev => {
                const fresh = [...prev];
                consolidatedCust.forEach((cData, cId) => {
                  const idx = fresh.findIndex(c => c.id === cId);
                  if (idx !== -1) {
                    fresh[idx] = {
                      ...fresh[idx],
                      totalSpent: (Number(fresh[idx].totalSpent) || 0) + cData.totalSpent,
                      loyaltyPoints: cData.loyaltyPoints !== undefined ? cData.loyaltyPoints : fresh[idx].loyaltyPoints
                    };
                  }
                });
                return fresh;
              });
            }

          } catch (execError: any) {
            console.error("❌ POS Queue Engine :: Batch write execution failed.", execError);

            // Detect non-retryable permanent errors (e.g. Permission Denied, Resource Exhausted, Failed Precondition)
            const errCode = execError?.code || '';
            const isPermanentError = ['permission-denied', 'not-found', 'already-exists', 'invalid-argument', 'failed-precondition'].includes(errCode);

            if (isPermanentError) {
              console.warn("⚠️ Permanent Firestore rejection on aggregate batch. Discarding chunk to unblock queue.");
              chunk.forEach(action => successfullyCommitIds.push(action.id)); // Discard to unblock queue

              toast({
                title: "Sync Rejection",
                description: `The server rejected a batch of actions: ${execError.message || 'Permission Denied'}.`,
                variant: "destructive"
              });
              continue; // Skip breaking, continue processing remainder
            }

            break; // Stop further processing on this tick for temporary network/server blips to preserve safe retry
          }
        }

        // ----------------------------------------------------------------
        // MODE B: Single Secure Command (Inherits 100% of original logic)
        // ----------------------------------------------------------------
        else if (chunk.length === 1) {
          const action = chunk[0];
          try {
            switch (action.type) {
              case 'add-customer': {
                const cRef = doc(firestore, 'students', action.payload.id);
                batch.set(cRef, { ...action.payload, lowercaseName: action.payload.name?.toLowerCase() || '', lowercaseEmail: action.payload.email?.toLowerCase() || '', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
                batch.set(doc(firestore, 'businessInstances', academyId, 'stats', 'overall'), { totalCustomers: increment(1) }, { merge: true });
                break;
              }
              case 'update-customer': {
                const updateVals = { ...action.payload.values, updatedAt: serverTimestamp() };
                if (updateVals.name) updateVals.lowercaseName = updateVals.name.toLowerCase();
                if ('email' in updateVals) updateVals.lowercaseEmail = updateVals.email?.toLowerCase() || '';
                batch.update(doc(firestore, 'students', action.payload.id), updateVals);
                break;
              }
              case 'delete-customer':
                batch.delete(doc(firestore, 'students', action.payload.id));
                batch.set(doc(firestore, 'businessInstances', academyId, 'stats', 'overall'), { totalCustomers: increment(-1) }, { merge: true });
                break;
              case 'add-product':
                batch.set(doc(firestore, 'subjects', action.payload.id), { ...action.payload, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
                batch.set(doc(firestore, 'businessInstances', academyId, 'stats', 'overall'), { totalProducts: increment(1) }, { merge: true });
                setSyncedProducts(prev => [...prev, action.payload]);
                if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) syncProductToOffline(academyId, action.payload);
                break;
              case 'delete-product':
                action.payload.productIds.forEach((id: string) => batch.delete(doc(firestore, 'subjects', id)));
                batch.set(doc(firestore, 'businessInstances', academyId, 'stats', 'overall'), { totalProducts: increment(-action.payload.productIds.length) }, { merge: true });
                break;
              case 'update-product':
                batch.update(doc(firestore, 'subjects', action.payload.subjectId), { ...action.payload.values, updatedAt: serverTimestamp() });
                setSyncedProducts(prev => prev.map(p => p.id === action.payload.subjectId ? { ...p, ...action.payload.values } : p));
                if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
                  const current = syncedSubjects.find(p => p.id === action.payload.subjectId);
                  if (current) syncProductToOffline(academyId, { ...current, ...action.payload.values });
                }
                break;
              case 'bulk-update-subjects':
                action.payload.productIds.forEach((id: string) => {
                  batch.update(doc(firestore, 'subjects', id), { ...action.payload.values, updatedAt: serverTimestamp() });
                });
                setSyncedProducts(prev => prev.map(p => action.payload.productIds.includes(p.id) ? { ...p, ...action.payload.values } : p));
                if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
                  action.payload.productIds.forEach((id: string) => {
                    const current = syncedSubjects.find(p => p.id === id);
                    if (current) syncProductToOffline(academyId, { ...current, ...action.payload.values });
                  });
                }
                break;
              case 'add-audit-log': {
                const auditLogRef = collection(firestore, 'businessInstances', academyId, 'activityLogs');
                batch.set(doc(auditLogRef), { ...action.payload, createdAt: serverTimestamp() });
                break;
              }
              case 'delete-receipt': {
                batch.delete(doc(firestore, 'admissions', action.payload.admissionId));
                break;
              }
              case 'add-post-utme-mapping': {
                batch.set(doc(firestore, 'postUtmeMappings', action.payload.id), {
                  ...action.payload,
                  createdAt: serverTimestamp()
                });
                break;
              }
              case 'delete-post-utme-mapping': {
                batch.delete(doc(firestore, 'postUtmeMappings', action.payload.id));
                break;
              }
            }

            await batch.commit();
            successfullyCommitIds.push(action.id);

          } catch (singularErr: any) {
            console.error(`❌ Standalone sync step failed [${action.type}]:`, singularErr);

            // Detect non-retryable permanent errors (e.g. Permission Denied, Not Found, Failed Precondition)
            const errCode = singularErr?.code || '';
            const isPermanentError = ['permission-denied', 'not-found', 'already-exists', 'invalid-argument', 'failed-precondition'].includes(errCode);

            if (isPermanentError) {
              console.warn(`⚠️ Permanent Firestore rejection for ${action.type} [ID: ${action.id}]. Discarding to unblock queue.`);
              successfullyCommitIds.push(action.id); // Remove from state queue to unblock remaining actions

              toast({
                title: "Operation Denied",
                description: `Server rejected: "${action.description || action.type}". Reason: ${singularErr.message || 'Permission Denied'}.`,
                variant: "destructive"
              });
              continue; // Resume execution of the remaining queue
            }

            break; // Preserve synchronous safety for temporary network errors
          }
        }
      }

      // State Resolution Phase
      setQueuedActions(prev => {
        const successes = new Set(successfullyCommitIds);
        const failCount = pending.length - successfullyCommitIds.length;

        if (failCount > 0) {
          // We simply notify internal log and naturally leave unresolved items in React state queue to auto-trigger retry 
          console.warn(`Queue resolved with ${failCount} items remaining due to retry conditions.`);
        }

        if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
          successfullyCommitIds.forEach(id => removeActionFromOfflineQueue(id));
        }

        // Retain non-committed items for safe transparent retries
        return prev.filter(a => !successes.has(a.id));
      });

    } finally {
      setIsQueueProcessing(false);
    }
  }, [isQueueProcessing, queuedActions, firestore, academyId, currentUserProfile, offlineProfile, subjects, syncedSubjects, toast, isRealOnline]);


  const addToQueue = useCallback((action: any, description: string) => {
    const isSubscriptionActive = academy ? (academy.accessLevel === 'lifetime' || (academy.trialExpiresAt && safeToDate(academy.trialExpiresAt).getTime() > Date.now())) : true;
    if (!isSubscriptionActive) { toast({ variant: 'destructive', title: 'Action Blocked', description: 'Your subscription has expired.' }); return null; }

    // --- RBAC Permission Check ---
    const effectiveProfile = currentUserProfile || offlineProfile;
    const permissions = effectiveProfile?.permissions || {};
    const userRole = effectiveProfile?.role;
    const isSuperAdmin = effectiveProfile?.email === 'belloimam431@gmail.com' || effectiveProfile?.email === 'ibrahimakinola10@gmail.com';

    // Debug Log to catch the culprit
    if (action.type === 'complete-registration' || action.type === 'add-product' || action.type === 'update-product' || action.type === 'delete-product') {
      console.log(`[POS RBAC] Checking action: ${action.type}`, {
        userRole,
        permissions,
        isSuperAdmin,
        isProfileReady
      });
    }

    if (!isSuperAdmin && isProfileReady) {
      // 1. Record Sales check
      if (action.type === 'complete-registration' && permissions.record_sales === false) {
        console.warn(`[POS RBAC] Blocked ${action.type} due to record_sales: false`);
        toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have permission to record sales.' });
        return null;
      }

      // 2. Manage Inventory check
      const inventoryActions = ['add-product', 'update-product', 'delete-product', 'bulk-update-subjects'];
      if (inventoryActions.includes(action.type) && permissions.manage_inventory === false) {
        console.warn(`[POS RBAC] Blocked ${action.type} due to manage_inventory: false`);
        toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have permission to manage inventory.' });
        return null;
      }

      // 3. Student Management check
      const studentActions = ['add-customer', 'update-customer', 'delete-customer'];
      if (studentActions.includes(action.type) && permissions.view_customers === false) {
        console.warn(`[POS RBAC] Blocked ${action.type} due to view_customers: false`);
        toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have permission to manage students.' });
        return null;
      }
    }
    // --- End RBAC Check ---

    const id = uuidv4();
    const newAction: QueuedAction = { ...action, description, id, timestamp: Date.now(), status: 'pending' };
    if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ && academyId) saveActionToOfflineQueue(newAction).catch(console.error);

    setQueuedActions(prev => [...prev, newAction]);

    // Proactive Sync: If online, trigger processQueue in the next tick
    if (isRealOnline) {
      setTimeout(() => processQueue(), 100);
    }

    return id;
  }, [academyId, academy, toast, processQueue, currentUserProfile, isRealOnline]);

  const addProductWithImage = useCallback(async (productData: any, imageFile: File | null) => {
    // If there's an image, we handle it. Ideally in background but for now let's just queue the data.
    // In a real scenario, we might want to upload to Firebase Storage first if online,
    // or store locally in Tauri if offline.

    // For now, let's keep it simple: Add to queue.
    const description = `Added product: ${productData.name}`;

    // If we have an image, we'd normally want to process it. 
    // But since the user wants it to be fast and offline-first, 
    // we'll just queue the data and handle image upload in the processQueue if possible, 
    // or just save the product data.

    // TODO: Handle image persistence for offline

    addToQueue({
      type: 'add-product',
      payload: {
        ...productData,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    }, description);

    toast({
      title: "Subject Saved",
      description: `${productData.name} has been added and will sync when online.`,
    });
  }, [addToQueue, toast]);

  const resetSimulator = useCallback(async () => {
    setCart([]); setSelectedCustomer(null); setDiscount(0); setTaxRate(0); setPaymentMethod('Cash');
    secureStorage.removeItem(ACADEMY_CART_KEY);
    secureStorage.removeItem(ACADEMY_STUDENT_KEY);
  }, []);

  const nuclearReset = useCallback(async () => {
    await resetSimulator(); setQueuedActions([]); setSyncedProducts([]); setSyncedCustomers([]); setSyncedReceipts([]);
    idb.clear();
    if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) clearAllTables();
  }, [resetSimulator]);

  const searchCustomers = useCallback(async (term: string) => {
    if (!term.trim()) return [];
    const lower = term.toLowerCase().trim();
    const isOnline = isRealOnline;

    let local: Student[] = [];
    if (students && students.length > 0) {
      local = students.filter(c => c.name?.toLowerCase().includes(lower) || c.email?.toLowerCase().includes(lower) || c.phone?.includes(term) || c.code?.toLowerCase().includes(lower));
    }

    if (!user || !academyId || !firestore || !isOnline) return local.slice(0, 20);
    try {
      const q = (field: string) => query(collection(firestore, 'students'), where('academyId', '==', academyId), where(field, '>=', lower), where(field, '<=', lower + '\uf8ff'), limit(20));
      const [nameSnap, emailSnap] = await Promise.all([getDocs(q('lowercaseName')), getDocs(q('lowercaseEmail'))]);
      const combined = [...local, ...nameSnap.docs.map(d => ({ ...d.data() as any, id: d.id } as Student)), ...emailSnap.docs.map(d => ({ ...d.data() as any, id: d.id } as Student))];
      return Array.from(new Map(combined.map(item => [item.id, item])).values()).slice(0, 20);
    } catch { return local.slice(0, 20); }
  }, [academyId, firestore, students, isFullSyncingStudents, user, isRealOnline]);

  const searchCustomersByField = useCallback(async (field: string, value: string) => {
    if (!value) return [];
    const isOnline = isRealOnline;

    if (students && students.length > 0) {
      const local = students.filter(c => (c as any)[field] === value);
      if (local.length > 0 || !isOnline) return local;
    }

    if (!user || !academyId || !firestore || !isOnline) return [];
    try {
      const q = query(collection(firestore, 'students'), where('academyId', '==', academyId), where(field, '==', value), limit(50));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as Student));
    } catch { return []; }
  }, [academyId, firestore, students, isRealOnline]);

  const searchProducts = useCallback(async (term: string) => {
    if (!term.trim()) return [];
    const lower = term.toLowerCase().trim();
    const isOnline = isRealOnline;

    if (subjects && subjects.length > 0) {
      const local = subjects.filter(p => p.name.toLowerCase().includes(lower) || p.sku?.toLowerCase().includes(lower));
      if (local.length >= 10 || !isOnline) return local.slice(0, 30);
    }

    if (!user || !academyId || !firestore || !isOnline) return [];
    try {
      const q = query(collection(firestore, 'subjects'), where('academyId', '==', academyId), where('lowercaseName', '>=', lower), where('lowercaseName', '<=', lower + '\uf8ff'), limit(30));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Subject));
    } catch { return []; }
  }, [academyId, firestore, subjects, isSyncing, isRealOnline]);

  const searchProductsByField = useCallback(async (field: string, value: string) => {
    if (!value) return [];
    const isOnline = isRealOnline;

    if (subjects && subjects.length > 0) {
      const local = subjects.filter(p => (p as any)[field] === value);
      if (local.length > 0 || !isOnline) return local;
    }

    if (!user || !academyId || !firestore || !isOnline) return [];
    try {
      const q = query(collection(firestore, 'subjects'), where('academyId', '==', academyId), where(field, '==', value), limit(100));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as Subject));
    } catch { return []; }
  }, [academyId, firestore, subjects, isRealOnline]);

  const findProductBySku = useCallback(async (sku: string) => {
    if (!sku) return null;
    const isOnline = isRealOnline;

    if (subjects && subjects.length > 0) {
      const local = subjects.find(p => p.sku === sku);
      if (local) return local;
    }

    if (!user || !academyId || !firestore || !isOnline) return null;
    try {
      const q = query(collection(firestore, 'subjects'), where('academyId', '==', academyId), where('sku', '==', sku), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      return { ...snap.docs[0].data(), id: snap.docs[0].id } as Subject;
    } catch { return null; }
  }, [academyId, firestore, subjects, isRealOnline]);

  const fetchDetailedAnalytics = useCallback(async (from: Date, to: Date) => {
    if (!user || !academyId || !firestore) return { revenue: 0, count: 0, students: 0 };

    let result = { revenue: 0, count: 0, students: 0 };
    let uniqueCustomerIds = new Set<string>();

    const isOnline = isRealOnline;
    if (isOnline) {
      try {
        const q = query(
          collection(firestore, "admissions"),
          where("academyId", "==", academyId),
          where("createdAt", ">=", safeToDate(from)),
          where("createdAt", "<=", safeToDate(to))
        );

        // 100% Accurate Aggregation for Big Numbers
        const aggregateSnap = await getAggregateFromServer(q, {
          totalBookingValue: sum('total'),
          totalOrders: count()
        });

        result.revenue = aggregateSnap.data().totalBookingValue || 0;
        result.count = aggregateSnap.data().totalOrders || 0;

        // For unique students, we cap this at 5,000 due to Firestore structured query limits
        const docSnap = await getDocs(query(q, limit(5000)));
        docSnap.docs.forEach(d => {
          const cId = d.data().customer?.id;
          if (cId) uniqueCustomerIds.add(cId);
        });
        result.students = uniqueCustomerIds.size;
      } catch (err) {
        console.error("fetchDetailedAnalytics online failed:", err);
      }
    }

    // Fallback 1: SQLite (Tauri)
    if (result.count === 0) {
      const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__;
      if (isTauri) {
        try {
          const cached = await getCachedReceipts(academyId, 10000);
          if (cached && cached.length > 0) {
            const fromTime = from.getTime();
            const toTime = to.getTime();
            const filtered = cached.filter(r => {
              const rt = safeToDate(r.createdAt).getTime();
              return rt >= fromTime && rt <= toTime;
            });
            result.revenue = filtered.reduce((acc, r) => acc + r.total, 0);
            result.count = filtered.length;
            uniqueCustomerIds.clear();
            filtered.forEach(r => { if (r.customer?.id) uniqueCustomerIds.add(r.customer.id); });
            result.students = uniqueCustomerIds.size;
          }
        } catch (err) {
          console.error("fetchDetailedAnalytics SQLite fallback failed:", err);
        }
      }
    }

    // Fallback 2: State / SecureStorage admissions (Web/PWA)
    if (result.count === 0) {
      const targetReceipts = syncedAdmissions.length > 0 ? syncedAdmissions : (admissions || []);
      if (targetReceipts && targetReceipts.length > 0) {
        const fromTime = from.getTime();
        const toTime = to.getTime();
        const filtered = targetReceipts.filter(r => {
          const rt = safeToDate(r.createdAt).getTime();
          return rt >= fromTime && rt <= toTime;
        });
        result.revenue = filtered.reduce((acc, r) => acc + r.total, 0);
        result.count = filtered.length;
        uniqueCustomerIds.clear();
        filtered.forEach(r => { if (r.customer?.id) uniqueCustomerIds.add(r.customer.id); });
        result.students = uniqueCustomerIds.size;
      }
    }

    // 🚨 Inject ALL Pending Offline Sales into metrics to guarantee immediate 100% consistent accuracy!
    const fromTime = from.getTime();
    const toTime = to.getTime();

    queuedActions.filter(a => a.type === 'complete-registration' && a.status === 'pending').forEach(action => {
      const receipt = action.payload.receiptData;
      if (receipt) {
        const rDate = safeToDate(receipt.createdAt || new Date(action.timestamp));
        const rTime = rDate.getTime();
        if (rTime >= fromTime && rTime <= toTime) {
          result.revenue += (receipt.total || 0);
          result.count += 1;
          if (receipt.customer?.id) {
            uniqueCustomerIds.add(receipt.customer.id);
          }
        }
      }
    });

    result.students = uniqueCustomerIds.size;

    return result;
  }, [academyId, firestore, syncedAdmissions, admissions, user, queuedActions, isRealOnline]);

  const addToCart = useCallback((product: Subject, unitName?: string, multiplier?: number, priceOverride?: number) => {
    const cartItemId = unitName ? `${product.id}-${unitName}` : product.id;
    const isService = product.categoryType === 'service';
    const existingItem = syllabus.find(item => (item.unit ? `${item.product.id}-${item.unit}` : item.product.id) === cartItemId);
    const newQuantity = (existingItem?.quantity || 0) + 1;
    const totalQuantityInBaseUnit = newQuantity * (multiplier || 1);

    if (!isService && totalQuantityInBaseUnit > (product.stock || 0)) {
      toast({ title: existingItem ? 'Backorder recorded' : 'Backorder started', description: `${product.name} is out of stock. Recording as debt.`, variant: 'backorder' as any });
    }

    setCart(prev => {
      const exists = prev.find(item => (item.unit ? `${item.product.id}-${item.unit}` : item.product.id) === cartItemId);
      if (exists) return prev.map(item => (item.unit ? `${item.product.id}-${item.unit}` : item.product.id) === cartItemId ? { ...item, quantity: item.quantity + 1 } : item);
      const finalProduct = priceOverride ? { ...product, price: priceOverride } : product;
      return [...prev, {
        product: finalProduct,
        quantity: 1,
        unit: unitName,
        multiplier,
        isPriceOverride: !!priceOverride,
        originalPrice: product.price
      }];
    });
  }, [toast, syllabus]);

  const removeFromCart = useCallback((cartItemId: string) => setCart(prev => prev.filter(item => (item.unit ? `${item.product.id}-${item.unit}` : item.product.id) !== cartItemId)), []);

  const updateQuantity = useCallback((cartItemId: string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(cartItemId); return; }

    // Stock Check for Backorder Notification
    const item = syllabus.find(i => (i.unit ? `${i.product.id}-${i.unit}` : i.product.id) === cartItemId);
    if (item && item.product.categoryType !== 'service') {
      const multiplier = item.multiplier || 1;
      if (quantity * multiplier > (item.product.stock || 0)) {
        toast({
          title: 'Entering Backorder',
          description: `You are requesting more than the ${item.product.stock || 0} units available. This will be recorded as debt.`,
          variant: 'backorder' as any
        });
      }
    }

    setCart(prev => prev.map(item => (item.unit ? `${item.product.id}-${item.unit}` : item.product.id) === cartItemId ? { ...item, quantity } : item));
  }, [removeFromCart, syllabus, toast]);

  const clearCart = useCallback(() => setCart([]), []);

  // --- Effects ---
  useEffect(() => { setIsMounted(true); }, []);
  useEffect(() => { secureStorage.setItem(ACADEMY_CART_KEY, syllabus); }, [syllabus]);
  useEffect(() => { secureStorage.setItem(ACADEMY_STUDENT_KEY, selectedStudent); }, [selectedStudent]);
  useEffect(() => { secureStorage.setItem(ACADEMY_TAX_RATE_KEY, taxRate); }, [taxRate]);
  useEffect(() => { secureStorage.setItem(ACADEMY_DISCOUNT_KEY, discount); }, [discount]);
  useEffect(() => { secureStorage.setItem(ACADEMY_PAYMENT_METHOD_KEY, paymentMethod); }, [paymentMethod]);
  useEffect(() => { secureStorage.setItem(ACADEMY_AUTO_PRINT_KEY, autoPrint); }, [autoPrint]);
  useEffect(() => { secureStorage.setItem('pos_synced_products', syncedSubjects); }, [syncedSubjects]);
  useEffect(() => { secureStorage.setItem('pos_synced_customers', syncedStudents); }, [syncedStudents]);
  useEffect(() => { secureStorage.setItem('pos_synced_receipts', syncedAdmissions); }, [syncedAdmissions]);
  useEffect(() => { secureStorage.setItem('pos_synced_users', syncedStudentProfiles); }, [syncedStudentProfiles]);
  useEffect(() => { secureStorage.setItem('pos_synced_audit_logs', syncedActivityLogs); }, [syncedActivityLogs]);
  useEffect(() => { secureStorage.setItem(ACADEMY_SAVED_SESSIONS_KEY, savedSessions); }, [savedSessions]);
  useEffect(() => { secureStorage.setItem('pos_queued_actions', queuedActions); }, [queuedActions]);

  // Background online-to-offline syncing effects for instant offline availability on all pages
  useEffect(() => {
    if (initialSubjects && initialSubjects.length > 0) {
      setSyncedProducts(prev => {
        const merged = [...prev];
        const existingIds = new Set(merged.map(p => p.id));
        initialSubjects.forEach(p => {
          const idx = merged.findIndex(m => m.id === p.id);
          if (idx !== -1) merged[idx] = p;
          else merged.push(p);
        });
        return merged;
      });
    }
  }, [initialSubjects]);

  useEffect(() => {
    if (initialStudents && initialStudents.length > 0) {
      setSyncedCustomers(prev => {
        const merged = [...prev];
        const existingIds = new Set(merged.map(c => c.id));
        initialStudents.forEach(c => {
          const idx = merged.findIndex(m => m.id === c.id);
          if (idx !== -1) merged[idx] = c;
          else merged.push(c);
        });
        return merged;
      });
    }
  }, [initialStudents]);

  useEffect(() => {
    if (initialAdmissions && initialAdmissions.length > 0) {
      setSyncedReceipts(prev => {
        const merged = [...prev];
        const existingIds = new Set(merged.map(r => r.id));
        initialAdmissions.forEach(r => {
          const idx = merged.findIndex(m => m.id === r.id);
          if (idx !== -1) merged[idx] = r;
          else merged.push(r);
        });
        return merged;
      });
    }
  }, [initialAdmissions]);

  useEffect(() => {
    if (initialStats) {
      setOfflineStats(initialStats);
      secureStorage.setItem('pos_offline_stats', initialStats);
    }
  }, [initialStats]);

  useEffect(() => {
    if (!isMounted || !academyId || hasHydratedRef.current) return;
    hasHydratedRef.current = true;

    const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__;
    if (isTauri) {
      // 1. Load Queue
      getOfflineQueue().then(queue => {
        if (queue.length > 0) {
          setQueuedActions(prev => [...prev, ...queue.filter(a => !prev.find(p => p.id === a.id))]);
          if (isRealOnline) processQueue();
        }
      });

      // 2. Hydrate POS from SQLite for instant start
      getCachedProducts(academyId).then(p => { if (p.length > 0) setSyncedProducts(p); });
      getCachedCustomers(academyId).then(c => { if (c.length > 0) setSyncedCustomers(c); });
      getCachedReceipts(academyId, 10000).then(r => { if (r.length > 0) setSyncedReceipts(r); });
      getCachedBusiness(academyId).then(b => { if (b) setOfflineBusiness(b); });
      getCachedStats(academyId).then(s => { if (s) setOfflineStats(s); });
    } else {
      // 2. Hydrate POS from IndexedDB for instant startup on Web/PWA (Evades 5MB LocalStorage Cap)
      idb.get<Subject[]>('pos_synced_products').then(p => { if (p && p.length > 0) setSyncedProducts(p); });
      idb.get<Student[]>('pos_synced_customers').then(c => { if (c && c.length > 0) setSyncedCustomers(c); });
      idb.get<Admission[]>('pos_synced_receipts').then(r => { if (r && r.length > 0) setSyncedReceipts(r); });
    }
  }, [isMounted, academyId, processQueue, isRealOnline]);


  useEffect(() => {
    if (isUserLoading) return;
    if (!user) {
      if (lastUserId) nuclearReset();
      setLastUserId(null);
      setImpersonatedUserId(null);
      if (typeof window !== 'undefined') sessionStorage.removeItem('zeneva_impersonated_user_id');
      return;
    }
    if (effectiveUserId !== lastUserId) {
      if (lastUserId) resetSimulator();
      setLastUserId(effectiveUserId || null);
    }

    // Safety check: only allow impersonation if current user is super admin
    const isSuperAdmin = user?.email === 'belloimam431@gmail.com' || user?.email === 'ibrahimakinola10@gmail.com';
    if (impersonatedUserId && !isSuperAdmin) {
      setImpersonatedUserId(null);
      if (typeof window !== 'undefined') sessionStorage.removeItem('zeneva_impersonated_user_id');
    }
  }, [user, isUserLoading, effectiveUserId, lastUserId, resetSimulator, nuclearReset]);

  useEffect(() => {
    const handleOnline = () => processQueue();
    window.addEventListener('online', handleOnline);

    // Auto-trigger processQueue when actions are added if online
    if (isRealOnline && queuedActions.some(a => a.status === 'pending') && !isQueueProcessing) {
      processQueue();
    }

    return () => window.removeEventListener('online', handleOnline);
  }, [processQueue, queuedActions, isQueueProcessing, isRealOnline]);

  // SQLite Continuity Sync
  useEffect(() => {
    const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__;
    if (isTauri && academyId) {
      if (subjects && subjects.length > 0) syncProductsToOffline(academyId, subjects);
      if (students && students.length > 0) syncCustomersToOffline(academyId, students);
      if (admissions && admissions.length > 0) syncReceiptsToOffline(academyId, admissions);
      if (academy) syncBusinessToOffline(academy);
      if (stats) syncStatsToOffline(academyId, stats);
    }
  }, [academyId, subjects, students, admissions, academy, stats]);

  useEffect(() => {
    if (!isMounted || !academyId || !firestore || isFullSyncingStudents || !isRealOnline) return;

    const checkFullSyncStatus = async () => {
      const [lastCustSync, lastProdSync, lastReceiptSync] = await Promise.all([
        getLastSyncMetadata(academyId, 'full_customers_sync'),
        getLastSyncMetadata(academyId, 'full_products_sync'),
        getLastSyncMetadata(academyId, 'full_receipts_sync')
      ]);

      const now = Date.now();
      const dayInterval = 24 * 60 * 60 * 1000; // Changed from 1 hour to 24 hours to save reads

      if (now - lastCustSync > dayInterval && !isFullSyncingStudents) {
        fetchFullStudents();
      }

      if (now - lastProdSync > dayInterval && !isFullSyncingSubjects) {
        fetchFullSubjects();
      }

      if (now - lastReceiptSync > dayInterval && !isFullSyncingAdmissions) {
        fetchFullReceipts();
      }
    };

    checkFullSyncStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, academyId, firestore, isRealOnline]);

  // Initial Delta Sync (Silent Catch-up on mount)
  useEffect(() => {
    if (!academyId || !isRealOnline || !firestore) return;

    const timeout = setTimeout(() => {
      refreshData(true); // Run silently to avoid flickering or showing messages
    }, 2000);

    return () => clearTimeout(timeout);
  }, [academyId, isRealOnline, firestore, refreshData]);


  const subtotal = useMemo(() => syllabus.reduce((acc, item) => acc + item.product.price * item.quantity, 0), [syllabus]);
  const tax = useMemo(() => subtotal * (taxRate / 100), [subtotal, taxRate]);
  const total = useMemo(() => subtotal + tax - discount, [subtotal, tax, discount]);

  const impersonateUser = useCallback((userId: string) => {
    setImpersonatedUserId(userId);
    sessionStorage.setItem('zeneva_impersonated_user_id', userId);
    toast({ title: 'Impersonating User', description: 'Redirecting to their view...' });
    triggerRefresh();
  }, [toast, triggerRefresh]);

  const stopImpersonation = useCallback(() => {
    setImpersonatedUserId(null);
    sessionStorage.removeItem('zeneva_impersonated_user_id');
    toast({ title: 'Impersonation Ended', description: 'Returning to your administrator view.' });
    nuclearReset();
    triggerRefresh();
  }, [toast, nuclearReset, triggerRefresh]);

  const saveCurrentSession = useCallback((notes?: string) => {
    if (syllabus.length === 0) return;

    const newSavedSession: SavedSession = {
      id: uuidv4(),
      items: [...syllabus],
      customer: selectedStudent,
      timestamp: Date.now(),
      total: total,
      notes
    };

    setSavedSessions(prev => {
      const updated = [newSavedSession, ...prev];
      secureStorage.setItem(ACADEMY_SAVED_SESSIONS_KEY, updated);
      return updated;
    });

    resetSimulator();
    toast({
      title: "Session Saved",
      description: "You can resume this session later from the 'Saved Sessions' list.",
    });
  }, [syllabus, selectedStudent, total, resetSimulator, toast]);

  const resumeSavedSession = useCallback((parkedSessionId: string) => {
    const sessionToResume = savedSessions.find(s => s.id === parkedSessionId);
    if (!sessionToResume) return;

    // Clear current POS state then set to resumed sale
    setCart(sessionToResume.items);
    setSelectedCustomer(sessionToResume.customer || null);

    // Remove from held sales
    const updatedSavedSessions = savedSessions.filter(s => s.id !== parkedSessionId);
    setSavedSessions(updatedSavedSessions);
    secureStorage.setItem(ACADEMY_SAVED_SESSIONS_KEY, updatedSavedSessions);
  }, [savedSessions]);

  const deleteSavedSession = useCallback((parkedSessionId: string) => {
    const updated = savedSessions.filter(s => s.id !== parkedSessionId);
    setSavedSessions(updated);
    secureStorage.setItem(ACADEMY_SAVED_SESSIONS_KEY, updated);
  }, [savedSessions]);

  const parkActiveExamSession = useCallback((sessionData: any) => {
    const newSavedSession: SavedSession = {
      id: uuidv4(),
      items: sessionData.subjects.map((sub: any) => ({
        product: { id: sub.id || 'sub-manual', name: sub.name, price: sub.questions.length },
        quantity: 1
      })),
      customer: { name: sessionData.studentName || 'Student', id: 'temp-std', lowercaseName: 'student', lowercaseEmail: '', email: '', phone: '', loyaltyPoints: 0, totalSpent: 0, createdAt: new Date(), academyId: academy?.id || '' },
      timestamp: Date.now(),
      total: sessionData.subjects.reduce((acc: number, sub: any) => acc + sub.questions.length, 0),
      notes: `Active Exam Session`
    };

    // Flag it as an exam session so the resume handler loads it correctly
    (newSavedSession as any).isExamSession = true;
    (newSavedSession as any).examSessionData = sessionData;

    setSavedSessions(prev => {
      const updated = [newSavedSession, ...prev];
      secureStorage.setItem(ACADEMY_SAVED_SESSIONS_KEY, updated);
      return updated;
    });

    toast({
      title: "Exam Session Parked",
      description: "You can resume this test from the top bar 'Saved Sessions' menu at any time.",
    });
  }, [toast]);

  const voidReceipt = useCallback(async (admissionId: string) => {
    // 1. Optimistic local state updates
    setSyncedReceipts(prev => prev.filter(r => r.id !== admissionId));
    try {
      const currentSynced = secureStorage.getItem<any[]>('pos_synced_receipts') || [];
      const updatedSynced = currentSynced.filter(r => r.id !== admissionId);
      secureStorage.setItem('pos_synced_receipts', updatedSynced);
    } catch (err) {
      console.error("Failed to update secureStorage for voided receipt:", err);
    }

    // 2. Local SQLite removal
    try {
      await deleteReceiptFromOffline(admissionId);
    } catch (err) {
      console.error("Failed to delete receipt from SQLite:", err);
    }

    // 3. Dispatch global delete command to Firestore sync engine
    addToQueue({
      type: 'delete-receipt',
      payload: { admissionId }
    }, `Voided receipt ${admissionId}`);

    toast({
      title: "Admission Voided",
      description: "The sale has been voided and will be removed globally.",
    });
  }, [addToQueue, toast]);



  const fetchReceiptsInRange = useCallback(async (from: Date, to: Date, limitCount: number = 5000) => {
    if (!academyId || !firestore) return [];

    let results: Admission[] = [];

    const isOnline = isRealOnline;
    if (isOnline) {
      try {
        const q = query(
          collection(firestore, 'admissions'),
          where('academyId', '==', academyId),
          where('createdAt', '>=', safeToDate(from)),
          where('createdAt', '<=', safeToDate(to)),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );

        const snap = await getDocs(q);
        results = snap.docs.map(d => ({ ...d.data(), id: d.id } as Admission));

        // Sync these to offline for future use
        if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
          syncReceiptsToOffline(academyId, results);
        }
      } catch (err) {
        console.error("Fetch Receipts In Range online failed:", err);
      }
    }

    // Fallback 1: SQLite (Tauri)
    if (results.length === 0) {
      const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__;
      if (isTauri) {
        try {
          const cached = await getCachedReceipts(academyId, limitCount);
          if (cached && cached.length > 0) {
            const fromTime = from.getTime();
            const toTime = to.getTime();
            results = cached.filter(r => {
              const rt = safeToDate(r.createdAt).getTime();
              return rt >= fromTime && rt <= toTime;
            });
          }
        } catch (err) {
          console.error("Fetch Receipts In Range SQLite fallback failed:", err);
        }
      }
    }

    // Fallback 2: State / SecureStorage admissions (Web/PWA)
    if (results.length === 0) {
      const targetReceipts = syncedAdmissions.length > 0 ? syncedAdmissions : (admissions || []);
      if (targetReceipts && targetReceipts.length > 0) {
        const fromTime = from.getTime();
        const toTime = to.getTime();
        results = targetReceipts.filter(r => {
          const rt = safeToDate(r.createdAt).getTime();
          return rt >= fromTime && rt <= toTime;
        });
      }
    }

    // 🚨 Inject ALL Pending Offline Receipts into the results for realtime calculations!
    const fromTime = from.getTime();
    const toTime = to.getTime();
    const existingIds = new Set(results.map(r => r.id));

    queuedActions.filter(a => a.type === 'complete-registration' && a.status === 'pending').forEach(action => {
      const receipt = action.payload.receiptData;
      if (receipt && !existingIds.has(receipt.id)) {
        const rDate = safeToDate(receipt.createdAt || new Date(action.timestamp));
        const rTime = rDate.getTime();
        if (rTime >= fromTime && rTime <= toTime) {
          results.push({ ...receipt, isOptimistic: true, createdAt: rDate });
          existingIds.add(receipt.id);
        }
      }
    });

    // Sort final outputs descendingly by Date
    return results.sort((a, b) => safeToDate(b.createdAt).getTime() - safeToDate(a.createdAt).getTime());
  }, [academyId, firestore, syncedAdmissions, admissions, queuedActions, isRealOnline]);

  const currencyCode = academy?.settings?.currency || 'NGN';

  const currencySymbol = CURRENCY_SYMBOLS[currencyCode] || '₦';

  const fetchMonthlyAnalytics = useCallback(async (monthCount: number = 12) => {
    if (!academyId || !firestore) return [];

    const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__;
    const isOnline = isRealOnline;
    let results: { month: string, revenue: number, count: number }[] = [];

    // 1. If Online, fetch precise aggregates from Firestore
    if (isOnline) {
      try {
        const now = new Date();
        const currentYear = now.getFullYear();

        const monthPromises = [];
        for (let i = 0; i <= now.getMonth(); i++) {
          const startDate = new Date(currentYear, i, 1);
          const endDate = new Date(currentYear, i + 1, 0, 23, 59, 59, 999);

          const q = query(
            collection(firestore, "admissions"),
            where("academyId", "==", academyId),
            where("createdAt", ">=", startDate),
            where("createdAt", "<=", endDate)
          );

          monthPromises.push(getAggregateFromServer(q, {
            revenue: sum('total'),
            totalCount: count()
          }).then(snap => ({
            month: `${currentYear}-${String(i + 1).padStart(2, '0')}`,
            revenue: snap.data().revenue || 0,
            count: snap.data().totalCount || 0
          })));
        }

        results = await Promise.all(monthPromises);
      } catch (err) {
        console.error("Firestore Aggregate Fetch Failed:", err);
      }
    }

    // 2. Fallback to SQLite (Last 12 months among synced admissions)
    if (results.length === 0 && isTauri) {
      try {
        const res = await getMonthlyRevenue(academyId, monthCount);
        if (res && res.length > 0) {
          results = res.map((r: any) => ({
            month: r.month,
            revenue: r.revenue,
            count: r.sales || r.count || 0
          }));
        }
      } catch (err) {
        console.error("SQLite Monthly Fetch Failed:", err);
      }
    }

    // 3. Fallback to synced admissions (volatile or cached)
    if (results.length === 0) {
      const targetReceipts = syncedAdmissions.length > 0 ? syncedAdmissions : (admissions || []);
      if (targetReceipts && targetReceipts.length > 0) {
        const monthly: Record<string, { revenue: number, count: number }> = {};
        targetReceipts.forEach(r => {
          const date = safeToDate(r.createdAt);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (!monthly[key]) {
            monthly[key] = { revenue: 0, count: 0 };
          }
          monthly[key].revenue += (r.total || 0);
          monthly[key].count += 1;
        });
        results = Object.entries(monthly).map(([month, val]) => ({ month, revenue: val.revenue, count: val.count }));
      }
    }

    // 🚨 Inject ALL Pending Offline Revenue into corresponding month aggregates!
    queuedActions.filter(a => a.type === 'complete-registration' && a.status === 'pending').forEach(action => {
      const receipt = action.payload.receiptData;
      if (receipt) {
        const rDate = safeToDate(receipt.createdAt || new Date(action.timestamp));
        const key = `${rDate.getFullYear()}-${String(rDate.getMonth() + 1).padStart(2, '0')}`;

        const existing = results.find(m => m.month === key);
        if (existing) {
          existing.revenue += (receipt.total || 0);
          existing.count += 1;
        } else {
          results.push({ month: key, revenue: receipt.total || 0, count: 1 });
        }
      }
    });

    return results.sort((a, b) => b.month.localeCompare(a.month)).slice(0, monthCount);
  }, [academyId, firestore, syncedAdmissions, admissions, queuedActions, isRealOnline]);


  const value: AcademyContextType = useMemo(() => ({
    academy, subjects, admissions, students, mentorshipBookings, currentUserProfile: profile,
    isLoading: (isUserLoading && !offlineProfile) ||
      (!!user && !profile && !offlineProfile) ||
      (isLoadingBusiness && !academy && !!academyId) ||
      !isMounted,
    isUserLoading: isUserLoading || (!!user && !profile),
    user, firestore,
    isProfileReady,
    syllabus, addToCart, removeFromCart, updateQuantity, clearCart,
    selectedStudent, selectStudent: setSelectedCustomer,
    subtotal, tax, taxRate, discount, total, setTax: setTaxRate, setDiscount,
    paymentMethod, setPaymentMethod, autoPrint, setAutoPrint, resetSimulator, currencySymbol, currencyCode, triggerRefresh,
    isConfettiActive, triggerConfetti, setIsConfettiActive,
    queuedActions, isQueueProcessing, addToQueue, processQueue, clearFailedActions: () => { }, updateQueuedAction: () => { }, addProductWithImage, removeFromQueue: () => { },
    mutateBusiness, isSyncing, isFullSyncingStudents, isFullSyncingSubjects, isFullSyncingAdmissions, optimisticProducts: [],

    impersonatedUserId, impersonateUser, stopImpersonation, isImpersonating,
    searchCustomers, searchCustomersByField, searchReceipts: async () => [],
    fetchReceiptsInRange, searchProducts, searchProductsByField, findProductBySku,
    fetchDetailedAnalytics,
    fetchMonthlyAnalytics,
    fetchMoreReceipts: async () => 0, fetchMoreCustomers: async () => 0, fetchMoreProducts: async () => 0,

    savedSessions, saveCurrentSession, resumeSavedSession, deleteSavedSession, parkActiveExamSession, voidReceipt,
    users, activityLogs,
    isOnline: isRealOnline,
 
    stats,
    isSubscriptionActive: academy ? (academy.accessLevel === 'lifetime' || (academy.trialExpiresAt && safeToDate(academy.trialExpiresAt).getTime() > Date.now())) : true
  }), [academy, subjects, admissions, students, mentorshipBookings, currentUserProfile, isUserLoading, user, firestore, syllabus, selectedStudent, taxRate, discount, paymentMethod, autoPrint, isConfettiActive, triggerRefresh, triggerConfetti, queuedActions, isQueueProcessing, addToQueue, processQueue, mutateBusiness, isSyncing, isFullSyncingStudents, isFullSyncingSubjects, isFullSyncingAdmissions, impersonatedUserId, isImpersonating, stats, currencySymbol, currencyCode, subtotal, tax, total, impersonateUser, stopImpersonation, searchCustomers, searchProducts, fetchDetailedAnalytics, fetchMonthlyAnalytics, isProfileReady, isLoadingBusiness, isLoadingSubjects, isLoadingStudents, isMounted, savedSessions, parkActiveExamSession, voidReceipt, users, activityLogs, isRealOnline]);

  return <AcademyContext.Provider value={value}>{children}</AcademyContext.Provider>;
}

export const useAcademy = () => {
  const context = useContext(AcademyContext);
  if (context === undefined) throw new Error('useAcademy must be used within a AcademyProvider');
  return context;
};

export const useBusiness = () => {
  const context = useContext(AcademyContext);
  if (context === undefined) throw new Error('useBusiness must be used within a AcademyProvider');
  return context.academy;
};
