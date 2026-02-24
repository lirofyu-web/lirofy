// utils/offlineSync.ts
import { doc, setDoc, updateDoc, deleteDoc, collection, Timestamp, writeBatch } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { db } from '../firebase';

const DB_NAME = 'montanha-gestao-db';
const STORE_NAME = 'mutations';
const DB_VERSION = 1;

interface QueuedMutation {
  id?: number;
  action: 'add' | 'update' | 'delete';
  collectionPath: string;
  docId?: string;
  payload: any;
  targetUserId?: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

const getDb = (): Promise<IDBDatabase> => {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = (event) => reject(new Error(`IndexedDB error: ${(event.target as any).errorCode}`));
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const dbInstance = (event.target as any).result;
        if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
          dbInstance.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }
  return dbPromise;
};

export const queueMutation = async (mutation: QueuedMutation): Promise<void> => {
    const dbInstance = await getDb();
    const transaction = dbInstance.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    await new Promise<void>((resolve, reject) => {
        const request = store.add(mutation);
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(new Error(`Failed to queue mutation: ${(event.target as any).error}`));
    });
};

// NOTE: This helper is now the single source of truth.
// Other files like App.tsx should import it from here to avoid duplication.
export const processPayloadForFirestore = (data: any): any => {
    if (data === null || typeof data !== 'object') {
        return data; // Primitives are returned as is.
    }
    if (data instanceof Date) {
        return Timestamp.fromDate(data);
    }
    if (Array.isArray(data)) {
        return data.map(item => processPayloadForFirestore(item));
    }

    const newObj: { [key: string]: any } = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const value = data[key];
            if (value !== undefined) {
                newObj[key] = processPayloadForFirestore(value);
            }
        }
    }
    return newObj;
}

export const clearOfflineQueue = async (): Promise<void> => {
  const dbInstance = await getDb();
  const transaction = dbInstance.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  await new Promise<void>((resolve, reject) => {
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = (e) => reject((e.target as any).error);
  });
};

export const processSyncQueue = async (currentUserId: string | null): Promise<number> => {
  if (!currentUserId) return 0;
  
  const dbInstance = await getDb();
  const transaction = dbInstance.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  const mutations = await new Promise<QueuedMutation[]>((resolve) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve([]);
  });

  if (mutations.length === 0) return 0;

  // BUG FIX: Firestore batches have a 500-operation limit.
  // Process the queue in chunks to avoid hitting this limit.
  const chunkSize = 490; // A safe chunk size below the 500 limit.
  
  try {
    for (let i = 0; i < mutations.length; i += chunkSize) {
        const chunk = mutations.slice(i, i + chunkSize);
        const batch = writeBatch(db);

        chunk.forEach((mutation) => {
          const userIdForPath = mutation.targetUserId || currentUserId;
          const collectionPath = `users/${userIdForPath}/${mutation.collectionPath}`;
          let docRef;
          
          const cleanPayload = processPayloadForFirestore(mutation.payload);

          if (mutation.action === 'add') {
            const docId = cleanPayload.id;
            if (docId && typeof docId === 'string') {
                docRef = doc(db, collectionPath, docId);
                batch.set(docRef, cleanPayload);
            } else {
                docRef = doc(collection(db, collectionPath));
                batch.set(docRef, cleanPayload);
            }
          } else if (mutation.action === 'update' && mutation.docId) {
            docRef = doc(db, collectionPath, mutation.docId);
            batch.update(docRef, cleanPayload);
          } else if (mutation.action === 'delete' && mutation.docId) {
            docRef = doc(db, collectionPath, mutation.docId);
            batch.delete(docRef);
          }
        });

        await batch.commit();
    }

    await clearOfflineQueue();
    
    return mutations.length;
  } catch (error) {
    console.error("Error processing sync queue. The queue has not been cleared and will be retried.", error);
    throw error;
  }
};