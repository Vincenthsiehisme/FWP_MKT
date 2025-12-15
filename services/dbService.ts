
import { CustomerRecord } from '../types';

const DB_NAME = 'FWP_CRM_DB';
const STORE_NAME = 'customers';
const DB_VERSION = 1;
const LS_FALLBACK_KEY = 'fwp_crm_backup_data';

/**
 * Open the IndexedDB database.
 */
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    // Check support
    if (!('indexedDB' in window)) {
      return reject(new Error("IndexedDB not supported"));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // Create the store with 'id' as the primary key
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

/**
 * LocalStorage Helper for Fallback Scenarios
 */
const lsFallback = {
  getAll: (): CustomerRecord[] => {
    try {
      const raw = localStorage.getItem(LS_FALLBACK_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("LS Read Error:", e);
      return [];
    }
  },
  
  save: (record: CustomerRecord) => {
    try {
      const items = lsFallback.getAll();
      const idx = items.findIndex(r => r.id === record.id);
      
      if (idx >= 0) items[idx] = record;
      else items.push(record);
      
      try {
        localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(items));
      } catch (e: any) {
        // QuotaExceededError handling
        if (e.name === 'QuotaExceededError' || e.code === 22) {
          console.warn("LocalStorage quota exceeded. Stripping image data to save critical metadata.");
          
          // Create a lightweight record without the heavy image string
          const lightweightRecord = { 
            ...record, 
            generatedImageUrl: undefined, // Remove image
            // Add a note in analysis so admin knows why image is missing
            analysis: {
                ...record.analysis!,
                visualDescription: record.analysis?.visualDescription + " [IMAGE_NOT_SAVED_DUE_TO_STORAGE_LIMIT]"
            }
          };
          
          if (idx >= 0) items[idx] = lightweightRecord;
          else items[items.length - 1] = lightweightRecord;
          
          // Try saving again without image
          localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(items));
        } else {
            throw e;
        }
      }
    } catch (error) {
      console.error("LS Save Critical Error:", error);
    }
  },

  delete: (id: string) => {
    try {
      const items = lsFallback.getAll().filter(r => r.id !== id);
      localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("LS Delete Error:", e);
    }
  }
};

/**
 * Service to handle high-capacity local storage operations with fallback.
 */
export const dbService = {
  
  /**
   * Get all customer records sorted by createdAt descending.
   * Merges data from both IndexedDB and LocalStorage to ensure nothing is lost.
   */
  getAllCustomers: async (): Promise<CustomerRecord[]> => {
    let dbRecords: CustomerRecord[] = [];
    
    // 1. Try IndexedDB
    try {
      const db = await openDB();
      dbRecords = await new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result as CustomerRecord[]);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn("IndexedDB read failed, relying on LocalStorage:", e);
    }

    // 2. Try LocalStorage
    const lsRecords = lsFallback.getAll();

    // 3. Merge (Map by ID to deduplicate)
    const recordMap = new Map<string, CustomerRecord>();
    
    // Load LS first
    lsRecords.forEach(r => recordMap.set(r.id, r));
    
    // Load DB second (Overwrites LS if ID matches, assuming DB has better quality data like images)
    dbRecords.forEach(r => recordMap.set(r.id, r));

    const results = Array.from(recordMap.values());
    results.sort((a, b) => b.createdAt - a.createdAt);
    
    return results;
  },

  /**
   * Add a new customer record.
   * Tries DB first, falls back to LS on failure.
   */
  addCustomer: async (record: CustomerRecord): Promise<void> => {
    let successDB = false;
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(record);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      successDB = true;
    } catch (e) {
      console.error("IndexedDB Add Failed (Safari Private Mode?):", e);
    }

    // If DB failed, MUST save to LS
    if (!successDB) {
        lsFallback.save(record);
    }
  },

  /**
   * Update an existing customer record.
   */
  updateCustomer: async (record: CustomerRecord): Promise<void> => {
    let successDB = false;
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(record);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      successDB = true;
    } catch (e) {
      console.error("IndexedDB Update Failed:", e);
    }

    // Fallback update
    if (!successDB) {
        lsFallback.save(record);
    } else {
        // Optional: Keep LS in sync if record exists there?
        // To be safe and simple: If we rely on hybrid getAll, we don't strictly need to sync both 
        // unless we want double backup. For now, fallback on failure is sufficient.
    }
  },

  /**
   * Delete a customer record by ID.
   */
  deleteCustomer: async (id: string): Promise<void> => {
    // Try delete from DB
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
       console.warn("IndexedDB Delete Failed:", e);
    }
    
    // Always try delete from LS too
    lsFallback.delete(id);
  },
  
  /**
   * Clear all data (Admin util).
   */
  clearAll: async (): Promise<void> => {
     try {
       const db = await openDB();
       const transaction = db.transaction(STORE_NAME, 'readwrite');
       transaction.objectStore(STORE_NAME).clear();
     } catch {}
     
     localStorage.removeItem(LS_FALLBACK_KEY);
  }
};
