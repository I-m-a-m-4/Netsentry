
import Database from '@tauri-apps/plugin-sql';

/**
 * Zeneva SQLite Sync Utility
 * This ensures that critical academy data is mirrored to a local SQLite database
 * for absolute continuity even if IndexedDB (Firebase) is cleared or fails.
 */

let db: Database | null = null;
let initPromise: Promise<Database | null> | null = null;

export async function getOfflineDb() {
  if (db) return db;
  if (typeof window === 'undefined' || !(window as any).__TAURI_INTERNALS__) return null;
  
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const loadedDb = await Database.load('sqlite:zeneva.db');
      
      // Initialize tables
      await loadedDb.execute(`
        CREATE TABLE IF NOT EXISTS sync_metadata (
          id TEXT PRIMARY KEY,
          business_id TEXT,
          last_sync_timestamp INTEGER
        );
        
        CREATE TABLE IF NOT EXISTS academy (
          id TEXT PRIMARY KEY,
          data TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS subjects (
          id TEXT PRIMARY KEY,
          business_id TEXT,
          data TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS students (
          id TEXT PRIMARY KEY,
          business_id TEXT,
          data TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS admissions (
          id TEXT PRIMARY KEY,
          business_id TEXT,
          data TEXT,
          created_at INTEGER,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS stats (
          id TEXT PRIMARY KEY,
          data TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS sync_queue (
          id TEXT PRIMARY KEY,
          action_type TEXT,
          payload TEXT,
          description TEXT,
          timestamp INTEGER,
          status TEXT DEFAULT 'pending'
        );
      `);
      
      db = loadedDb;
      return db;
    } catch (err) {
      console.error('Failed to initialize SQLite offline DB:', err);
      initPromise = null; // Reset so we can attempt to load again
      return null;
    }
  })();

  return initPromise;
}

export async function syncBusinessToOffline(academy: any) {
  const db = await getOfflineDb();
  if (!db || !academy?.id) return;
  
  try {
    await db.execute(
      'INSERT OR REPLACE INTO academy (id, data, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP)',
      [academy.id, JSON.stringify(academy)]
    );
  } catch (err) {
    console.error('SQLite Sync Error (Business):', err);
  }
}

export async function syncProductsToOffline(academyId: string, subjects: any[]) {
  const db = await getOfflineDb();
  if (!db || subjects.length === 0) return;
  
  for (const product of subjects) {
    if (!product || !product.id) continue;
    try {
      await db.execute(
        'INSERT OR REPLACE INTO subjects (id, business_id, data, updated_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
        [product.id, academyId, JSON.stringify(product)]
      );
    } catch (err) {
      console.error(`SQLite Sync Error (Subject ${product.id}):`, err);
    }
  }
}

export async function syncProductToOffline(academyId: string, product: any) {
  const db = await getOfflineDb();
  if (!db || !product?.id) return;
  
  try {
    await db.execute(
      'INSERT OR REPLACE INTO subjects (id, business_id, data, updated_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
      [product.id, academyId, JSON.stringify(product)]
    );
  } catch (err) {
    console.error('SQLite Sync Error (Single Subject):', err);
  }
}

export async function deleteProductFromOffline(subjectId: string) {
  const db = await getOfflineDb();
  if (!db) return;
  
  try {
    await db.execute('DELETE FROM subjects WHERE id = $1', [subjectId]);
  } catch (err) {
    console.error('SQLite Delete Error (Subject):', err);
  }
}

export async function deleteMultipleProductsFromOffline(productIds: string[]) {
  const db = await getOfflineDb();
  if (!db) return;
  
  try {
    for (const id of productIds) {
      await db.execute('DELETE FROM subjects WHERE id = $1', [id]);
    }
  } catch (err) {
    console.error('SQLite Delete Error (Multiple Products):', err);
  }
}

export async function getCachedProducts(academyId: string) {
  const db = await getOfflineDb();
  if (!db) return [];
  
  try {
    const result: any[] = await db.select('SELECT data FROM subjects WHERE business_id = $1', [academyId]);
    return result.map(r => JSON.parse(r.data));
  } catch (err) {
    console.error('SQLite Retrieval Error (Products):', err);
    return [];
  }
}

export async function setLastSyncMetadata(academyId: string, type: string, timestamp: number) {
  const key = `zeneva_sync_metadata_${academyId}_${type}`;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, timestamp.toString());
    } catch (e) {}
  }
 
  const db = await getOfflineDb();
  if (!db) return;
  const id = `${academyId}_${type}`;
  try {
    await db.execute(
      'INSERT OR REPLACE INTO sync_metadata (id, business_id, last_sync_timestamp) VALUES ($1, $2, $3)',
      [id, academyId, timestamp]
    );
  } catch (err) {
    console.error('SQLite Metadata Sync Error:', err);
  }
}

export async function getLastSyncMetadata(academyId: string, type: string): Promise<number> {
  const key = `zeneva_sync_metadata_${academyId}_${type}`;
  
  // 1. Attempt SQLite retrieval first if available
  const db = await getOfflineDb();
  if (db) {
    const id = `${academyId}_${type}`;
    try {
      const result: any[] = await db.select('SELECT last_sync_timestamp FROM sync_metadata WHERE id = $1', [id]);
      if (result.length > 0 && result[0].last_sync_timestamp) {
        return Number(result[0].last_sync_timestamp);
      }
    } catch (err) {}
  }

  // 2. Perfect fallback to localStorage if on Web or SQLite metadata is missing
  if (typeof window !== 'undefined') {
    try {
      const localVal = localStorage.getItem(key);
      if (localVal) return Number(localVal);
    } catch (e) {}
  }

  return 0;
}

export async function getCachedCustomers(academyId: string) {
  const db = await getOfflineDb();
  if (!db) return [];
  
  try {
    const result: any[] = await db.select('SELECT data FROM students WHERE business_id = $1', [academyId]);
    return result.map(r => JSON.parse(r.data));
  } catch (err) {
    console.error('SQLite Retrieval Error (Customers):', err);
    return [];
  }
}

export async function getCachedBusiness(academyId: string) {
  const db = await getOfflineDb();
  if (!db) return null;
  
  try {
    const result: any[] = await db.select('SELECT data FROM academy WHERE id = $1', [academyId]);
    return result.length > 0 ? JSON.parse(result[0].data) : null;
  } catch (err) {
    console.error('SQLite Retrieval Error (Business):', err);
    return null;
  }
}

export async function syncStatsToOffline(academyId: string, stats: any) {
  const db = await getOfflineDb();
  if (!db || !academyId) return;
  
  try {
    await db.execute(
      'INSERT OR REPLACE INTO stats (id, data, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP)',
      [academyId, JSON.stringify(stats)]
    );
  } catch (err) {
    console.error('SQLite Sync Error (Stats):', err);
  }
}

export async function getCachedStats(academyId: string) {
  const db = await getOfflineDb();
  if (!db) return null;
  
  try {
    const result: any[] = await db.select('SELECT data FROM stats WHERE id = $1', [academyId]);
    return result.length > 0 ? JSON.parse(result[0].data) : null;
  } catch (err) {
    console.error('SQLite Retrieval Error (Stats):', err);
    return null;
  }
}

export async function syncCustomersToOffline(academyId: string, students: any[]) {
  const db = await getOfflineDb();
  if (!db || students.length === 0) return;
  
  for (const customer of students) {
    if (!customer || !customer.id) continue;
    try {
      await db.execute(
        'INSERT OR REPLACE INTO students (id, business_id, data, updated_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
        [customer.id, academyId, JSON.stringify(customer)]
      );
    } catch (err) {
      console.error(`SQLite Sync Error (Student ${customer.id}):`, err);
    }
  }
}

export async function syncReceiptsToOffline(academyId: string, admissions: any[]) {
  const db = await getOfflineDb();
  if (!db || admissions.length === 0) return;
  
  for (const receipt of admissions) {
    if (!receipt || !receipt.id) continue;
    try {
      const createdAt = receipt.createdAt?.seconds || Math.floor(Date.now() / 1000);
      await db.execute(
        'INSERT OR REPLACE INTO admissions (id, business_id, data, created_at, updated_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)',
        [receipt.id, academyId, JSON.stringify(receipt), createdAt]
      );
    } catch (err) {
      console.error(`SQLite Sync Error (Admission ${receipt.id}):`, err);
    }
  }
}

export async function syncReceiptToOffline(academyId: string, receipt: any) {
  const db = await getOfflineDb();
  if (!db || !receipt?.id) return;
  
  try {
    const createdAt = receipt.createdAt?.seconds || Math.floor(Date.now() / 1000);
    await db.execute(
      'INSERT OR REPLACE INTO admissions (id, business_id, data, created_at, updated_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)',
      [receipt.id, academyId, JSON.stringify(receipt), createdAt]
    );
  } catch (err) {
    console.error('SQLite Sync Error (Single Admission):', err);
  }
}

export async function deleteReceiptFromOffline(admissionId: string) {
  const db = await getOfflineDb();
  if (!db) return;
  
  try {
    await db.execute('DELETE FROM admissions WHERE id = $1', [admissionId]);
  } catch (err) {
    console.error('SQLite Delete Error (Admission):', err);
  }
}


export async function getCachedReceipts(academyId: string, limit: number = 50) {
  const db = await getOfflineDb();
  if (!db) return [];
  
  try {
    const result: any[] = await db.select(
      'SELECT data FROM admissions WHERE business_id = $1 ORDER BY created_at DESC LIMIT $2', 
      [academyId, limit]
    );
    return result.map(r => JSON.parse(r.data));
  } catch (err) {
    console.error('SQLite Retrieval Error (Receipts):', err);
    return [];
  }
}

export async function getCachedCustomerReceipts(academyId: string, studentId: string) {
  const db = await getOfflineDb();
  if (!db) return [];
  
  try {
    const result: any[] = await db.select(
      `SELECT data FROM admissions 
       WHERE business_id = $1 
       AND json_extract(data, '$.customer.id') = $2
       ORDER BY created_at DESC`, 
      [academyId, studentId]
    );
    return result.map(r => JSON.parse(r.data));
  } catch (err) {
    console.error('SQLite Student Receipts Error:', err);
    return [];
  }
}

export async function saveActionToOfflineQueue(action: any) {
  const db = await getOfflineDb();
  if (!db) return;
  
  try {
    await db.execute(
      'INSERT OR REPLACE INTO sync_queue (id, action_type, payload, description, timestamp, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [action.id, action.type, JSON.stringify(action.payload), action.description, action.timestamp, action.status]
    );
  } catch (err) {
    console.error('SQLite Queue Save Error:', err);
  }
}

export async function getOfflineQueue() {
  const db = await getOfflineDb();
  if (!db) return [];
  
  try {
    const result: any[] = await db.select('SELECT * FROM sync_queue WHERE status != $1 ORDER BY timestamp ASC', ['synced']);
    return result.map(r => ({
      id: r.id,
      type: r.action_type,
      payload: JSON.parse(r.payload),
      description: r.description,
      timestamp: r.timestamp,
      status: r.status
    }));
  } catch (err) {
    console.error('SQLite Queue Retrieval Error:', err);
    return [];
  }
}

export async function getMonthlyRevenue(academyId: string, monthCount: number = 12) {
  const db = await getOfflineDb();
  if (!db) return [];
  
  try {
    // Group by month and sum totals from JSON data
    const result: any[] = await db.select(`
      SELECT 
        strftime('%Y-%m', datetime(created_at, 'unixepoch')) as month,
        SUM(CAST(json_extract(data, '$.total') AS REAL)) as revenue
      FROM admissions 
      WHERE business_id = $1
      GROUP BY month
      ORDER BY month DESC
      LIMIT $2
    `, [academyId, monthCount]);
    
    return result.map(r => ({
      month: r.month,
      revenue: r.revenue || 0
    }));
  } catch (err) {
    console.error('SQLite Monthly Revenue Error:', err);
    return [];
  }
}

export async function removeActionFromOfflineQueue(actionId: string) {
  const db = await getOfflineDb();
  if (!db) return;
  
  try {
    await db.execute('DELETE FROM sync_queue WHERE id = $1', [actionId]);
  } catch (err) {
    console.error('SQLite Queue Delete Error:', err);
  }
}

export async function clearAllTables() {
  const db = await getOfflineDb();
  if (!db) return;
  
  try {
    await db.execute('DELETE FROM subjects');
    await db.execute('DELETE FROM students');
    await db.execute('DELETE FROM admissions');
    await db.execute('DELETE FROM academy');
    await db.execute('DELETE FROM sync_metadata');
    await db.execute('DELETE FROM stats');
    console.log("SQLite: All tables cleared.");
  } catch (err) {
    console.error('SQLite Clear Error:', err);
  }
}
