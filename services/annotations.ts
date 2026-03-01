/**
 * User Annotations and Highlights Service
 * Manages user-created annotations with cross-device synchronization
 */

import { KnowledgeChunk } from '../data/knowledgeBase';

// Database configuration
const DB_NAME = 'TikejimoSviesaAnnotationsDB';
const STORE_NAME = 'annotations';
const SYNC_STORE_NAME = 'syncQueue';
const DB_VERSION = 1;

export interface Annotation {
  id: string;
  userId: string;
  targetId: string; // ID of the text being annotated
  source: string;
  bookOrSection: string;
  chapterOrRef: string;
  type: 'highlight' | 'note' | 'bookmark' | 'tag';
  range: {
    startOffset: number;
    endOffset: number;
    selectedText: string;
  };
  content?: string; // For notes
  color?: string; // For highlights
  tags?: string[];
  createdAt: number;
  updatedAt: number;
  synced: boolean;
  version: number;
}

export interface AnnotationGroup {
  id: string;
  name: string;
  description?: string;
  annotationIds: string[];
  color: string;
  createdAt: number;
  updatedAt: number;
}

export interface SyncStatus {
  lastSyncedAt: number | null;
  pendingChanges: number;
  isOnline: boolean;
  syncInProgress: boolean;
}

// Color palette for highlights
export const HIGHLIGHT_COLORS = [
  { name: 'Geltona', value: '#fef3c7', border: '#f59e0b' },
  { name: 'Žalia', value: '#d1fae5', border: '#10b981' },
  { name: 'Mėlyna', value: '#dbeafe', border: '#3b82f6' },
  { name: 'Rožinė', value: '#fce7f3', border: '#ec4899' },
  { name: 'Violetinė', value: '#ede9fe', border: '#8b5cf6' },
  { name: 'Oranžinė', value: '#ffedd5', border: '#f97316' }
];

/**
 * Opens IndexedDB connection
 */
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Annotations store
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false });
        store.createIndex('targetId', 'targetId', { unique: false });
        store.createIndex('source', 'source', { unique: false });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('synced', 'synced', { unique: false });
      }
      
      // Sync queue store
      if (!db.objectStoreNames.contains(SYNC_STORE_NAME)) {
        const syncStore = db.createObjectStore(SYNC_STORE_NAME, { keyPath: 'id' });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    
    request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
    request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
  });
};

/**
 * Creates a new annotation
 */
export const createAnnotation = async (
  userId: string,
  targetId: string,
  type: Annotation['type'],
  range: Annotation['range'],
  options: {
    content?: string;
    color?: string;
    tags?: string[];
    source?: string;
    bookOrSection?: string;
    chapterOrRef?: string;
  } = {}
): Promise<Annotation> => {
  const db = await openDB();
  const now = Date.now();
  
  const annotation: Annotation = {
    id: `anno-${userId}-${now}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    targetId,
    source: options.source || '',
    bookOrSection: options.bookOrSection || '',
    chapterOrRef: options.chapterOrRef || '',
    type,
    range,
    content: options.content,
    color: options.color || HIGHLIGHT_COLORS[0].value,
    tags: options.tags || [],
    createdAt: now,
    updatedAt: now,
    synced: false,
    version: 1
  };
  
  // Save to annotations store
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  await new Promise<void>((resolve, reject) => {
    const request = store.put(annotation);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  
  // Add to sync queue
  await addToSyncQueue(annotation.id, 'create', annotation);
  
  return annotation;
};

/**
 * Updates an existing annotation
 */
export const updateAnnotation = async (
  annotationId: string,
  updates: Partial<Omit<Annotation, 'id' | 'userId' | 'createdAt'>>
): Promise<Annotation | null> => {
  const db = await openDB();
  
  // Get existing annotation
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  
  const existing = await new Promise<Annotation | undefined>((resolve, reject) => {
    const request = store.get(annotationId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  
  if (!existing) return null;
  
  // Update annotation
  const updated: Annotation = {
    ...existing,
    ...updates,
    id: existing.id,
    userId: existing.userId,
    createdAt: existing.createdAt,
    updatedAt: Date.now(),
    synced: false,
    version: existing.version + 1
  };
  
  // Save updated annotation
  const updateTx = db.transaction(STORE_NAME, 'readwrite');
  const updateStore = updateTx.objectStore(STORE_NAME);
  await new Promise<void>((resolve, reject) => {
    const request = updateStore.put(updated);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  
  // Add to sync queue
  await addToSyncQueue(annotationId, 'update', updated);
  
  return updated;
};

/**
 * Deletes an annotation
 */
export const deleteAnnotation = async (annotationId: string): Promise<boolean> => {
  const db = await openDB();
  
  // Get annotation to check it exists
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  
  const existing = await new Promise<Annotation | undefined>((resolve, reject) => {
    const request = store.get(annotationId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  
  if (!existing) return false;
  
  // Delete annotation
  const deleteTx = db.transaction(STORE_NAME, 'readwrite');
  const deleteStore = deleteTx.objectStore(STORE_NAME);
  await new Promise<void>((resolve, reject) => {
    const request = deleteStore.delete(annotationId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  
  // Add to sync queue
  await addToSyncQueue(annotationId, 'delete', { id: annotationId });
  
  return true;
};

/**
 * Gets all annotations for a user
 */
export const getUserAnnotations = async (userId: string): Promise<Annotation[]> => {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const index = store.index('userId');
  
  return new Promise<Annotation[]>((resolve, reject) => {
    const request = index.getAll(userId);
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Gets annotations for a specific text/target
 */
export const getAnnotationsForTarget = async (
  targetId: string,
  userId?: string
): Promise<Annotation[]> => {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const index = store.index('targetId');
  
  const allAnnotations = await new Promise<Annotation[]>((resolve, reject) => {
    const request = index.getAll(targetId);
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
  
  if (userId) {
    return allAnnotations.filter(a => a.userId === userId);
  }
  
  return allAnnotations;
};

/**
 * Gets annotations by source (e.g., specific Bible book)
 */
export const getAnnotationsBySource = async (
  source: string,
  userId: string
): Promise<Annotation[]> => {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const index = store.index('source');
  
  const allAnnotations = await new Promise<Annotation[]>((resolve, reject) => {
    const request = index.getAll(source);
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
  
  return allAnnotations.filter(a => a.userId === userId);
};

/**
 * Adds operation to sync queue
 */
const addToSyncQueue = async (
  annotationId: string,
  operation: 'create' | 'update' | 'delete',
  data: any
): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction(SYNC_STORE_NAME, 'readwrite');
  const store = tx.objectStore(SYNC_STORE_NAME);
  
  const queueItem = {
    id: `sync-${annotationId}-${Date.now()}`,
    annotationId,
    operation,
    data,
    timestamp: Date.now(),
    attempts: 0
  };
  
  await new Promise<void>((resolve, reject) => {
    const request = store.put(queueItem);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  
  // Trigger sync if online
  if (navigator.onLine) {
    syncAnnotations();
  }
};

/**
 * Gets current sync status
 */
export const getSyncStatus = async (): Promise<SyncStatus> => {
  const db = await openDB();
  const tx = db.transaction(SYNC_STORE_NAME, 'readonly');
  const store = tx.objectStore(SYNC_STORE_NAME);
  
  const pendingItems = await new Promise<any[]>((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
  
  // Get last sync time from localStorage
  const lastSyncedAt = localStorage.getItem('lastSyncTime');
  
  return {
    lastSyncedAt: lastSyncedAt ? parseInt(lastSyncedAt) : null,
    pendingChanges: pendingItems.length,
    isOnline: navigator.onLine,
    syncInProgress: false
  };
};

/**
 * Synchronizes annotations with server
 */
export const syncAnnotations = async (): Promise<{
  success: boolean;
  synced: number;
  failed: number;
}> => {
  if (!navigator.onLine) {
    return { success: false, synced: 0, failed: 0 };
  }
  
  const db = await openDB();
  const tx = db.transaction(SYNC_STORE_NAME, 'readonly');
  const store = tx.objectStore(SYNC_STORE_NAME);
  const index = store.index('timestamp');
  
  const queueItems = await new Promise<any[]>((resolve, reject) => {
    const request = index.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
  
  let synced = 0;
  let failed = 0;
  
  for (const item of queueItems) {
    try {
      // In production, this would call your sync API
      const success = await syncWithServer(item);
      
      if (success) {
        // Remove from queue
        const deleteTx = db.transaction(SYNC_STORE_NAME, 'readwrite');
        const deleteStore = deleteTx.objectStore(SYNC_STORE_NAME);
        await new Promise<void>((resolve, reject) => {
          const request = deleteStore.delete(item.id);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
        
        // Mark annotation as synced
        const annoTx = db.transaction(STORE_NAME, 'readwrite');
        const annoStore = annoTx.objectStore(STORE_NAME);
        const annotation = await new Promise<Annotation | undefined>((resolve, reject) => {
          const request = annoStore.get(item.annotationId);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        
        if (annotation && item.operation !== 'delete') {
          annotation.synced = true;
          await new Promise<void>((resolve, reject) => {
            const request = annoStore.put(annotation);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
        }
        
        synced++;
      } else {
        failed++;
        // Increment attempt count
        item.attempts++;
        if (item.attempts < 5) {
          const updateTx = db.transaction(SYNC_STORE_NAME, 'readwrite');
          const updateStore = updateTx.objectStore(SYNC_STORE_NAME);
          await new Promise<void>((resolve, reject) => {
            const request = updateStore.put(item);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
        }
      }
    } catch (error) {
      failed++;
      console.error('Sync error:', error);
    }
  }
  
  // Update last sync time
  localStorage.setItem('lastSyncTime', Date.now().toString());
  
  return { success: failed === 0, synced, failed };
};

/**
 * Syncs a single item with the server
 * Placeholder for actual API call
 */
const syncWithServer = async (item: any): Promise<boolean> => {
  // In production, implement actual API call
  // For now, simulate success
  return new Promise(resolve => {
    setTimeout(() => resolve(true), 100);
  });
};

/**
 * Creates an annotation group
 */
export const createAnnotationGroup = async (
  userId: string,
  name: string,
  options: {
    description?: string;
    color?: string;
    annotationIds?: string[];
  } = {}
): Promise<AnnotationGroup> => {
  const now = Date.now();
  
  const group: AnnotationGroup = {
    id: `group-${userId}-${now}`,
    name,
    description: options.description,
    annotationIds: options.annotationIds || [],
    color: options.color || HIGHLIGHT_COLORS[0].value,
    createdAt: now,
    updatedAt: now
  };
  
  // Save to localStorage (groups are simpler, no need for IndexedDB)
  const groups = getAnnotationGroups(userId);
  groups.push(group);
  localStorage.setItem(`annotationGroups-${userId}`, JSON.stringify(groups));
  
  return group;
};

/**
 * Gets annotation groups for a user
 */
export const getAnnotationGroups = (userId: string): AnnotationGroup[] => {
  const stored = localStorage.getItem(`annotationGroups-${userId}`);
  return stored ? JSON.parse(stored) : [];
};

/**
 * Exports annotations to various formats
 */
export const exportAnnotations = (
  annotations: Annotation[],
  format: 'json' | 'csv' | 'txt'
): string => {
  switch (format) {
    case 'json':
      return JSON.stringify(annotations, null, 2);
    
    case 'csv':
      const headers = ['id', 'type', 'source', 'book', 'chapter', 'text', 'content', 'createdAt'];
      const rows = annotations.map(a => [
        a.id,
        a.type,
        a.source,
        a.bookOrSection,
        a.chapterOrRef,
        `"${a.range.selectedText.replace(/"/g, '""')}"`,
        `"${(a.content || '').replace(/"/g, '""')}"`,
        new Date(a.createdAt).toISOString()
      ]);
      return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    case 'txt':
      return annotations.map(a => 
        `[${a.type.toUpperCase()}] ${a.source} ${a.bookOrSection} ${a.chapterOrRef}\n` +
        `Text: ${a.range.selectedText}\n` +
        (a.content ? `Note: ${a.content}\n` : '') +
        `---`
      ).join('\n\n');
    
    default:
      return '';
  }
};

/**
 * Imports annotations from JSON
 */
export const importAnnotations = async (
  userId: string,
  jsonData: string
): Promise<{ imported: number; errors: string[] }> => {
  const errors: string[] = [];
  let imported = 0;
  
  try {
    const annotations: Annotation[] = JSON.parse(jsonData);
    
    for (const annotation of annotations) {
      try {
        // Create new annotation with current user ID
        await createAnnotation(userId, annotation.targetId, annotation.type, annotation.range, {
          content: annotation.content,
          color: annotation.color,
          tags: annotation.tags,
          source: annotation.source,
          bookOrSection: annotation.bookOrSection,
          chapterOrRef: annotation.chapterOrRef
        });
        imported++;
      } catch (error) {
        errors.push(`Failed to import annotation ${annotation.id}: ${error}`);
      }
    }
  } catch (error) {
    errors.push(`Failed to parse JSON: ${error}`);
  }
  
  return { imported, errors };
};

/**
 * Sets up online/offline event listeners for auto-sync
 */
export const setupAutoSync = (
  onStatusChange?: (status: SyncStatus) => void
): () => void => {
  const handleOnline = () => {
    syncAnnotations();
    if (onStatusChange) {
      getSyncStatus().then(onStatusChange);
    }
  };
  
  const handleOffline = () => {
    if (onStatusChange) {
      getSyncStatus().then(onStatusChange);
    }
  };
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};