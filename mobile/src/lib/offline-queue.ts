// ============================================================
// STILL POINT Mobile Offline Queue (Mirroring src/lib/offline-db.ts)
// Uses expo-sqlite + expo-file-system + @react-native-community/netinfo
// Persists compressed photos and metadata locally while offline
// and synchronises automatically once connectivity returns.
// ============================================================

import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { Directory, File, Paths } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import { LocationSource, OfflineDraftRecord, OfflineSyncStatus } from '@/types';

const DB_NAME = 'piams-offline.db';
const OFFLINE_PHOTOS_DIR = 'offline-drafts';

export interface SQLiteRunResultLike {
  lastInsertRowId: number;
  changes: number;
}

export interface SQLiteDatabaseLike {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, ...params: unknown[]): Promise<SQLiteRunResultLike>;
  getAllAsync<T>(source: string, ...params: unknown[]): Promise<T[]>;
  getFirstAsync<T>(source: string, ...params: unknown[]): Promise<T | null>;
}

export interface OfflineFileStore {
  persistPhoto(sourceUri: string): Promise<string>;
  removePhoto(uri: string): Promise<void>;
}

interface RawDraftRow {
  id: number;
  photo_uri: string;
  lat: number | null;
  lng: number | null;
  location_source: string;
  timestamp: string;
  note: string;
  synced: number;
  sync_status: string;
  last_error: string | null;
  created_at: string;
}

export interface EnqueueOfflineDraftInput {
  photoUri: string;
  lat: number | null;
  lng: number | null;
  locationSource: LocationSource;
  timestamp?: string;
  note?: string;
}

export type DraftSyncProcessor = (draft: OfflineDraftRecord) => Promise<void>;

export interface SyncBatchSummary {
  syncedCount: number;
  failedCount: number;
  processedIds: number[];
  errors: Array<{ id: number; error: string }>;
}

function mapRowToDraft(row: RawDraftRow): OfflineDraftRecord {
  return {
    id: row.id,
    photoUri: row.photo_uri,
    lat: row.lat,
    lng: row.lng,
    locationSource: (row.location_source as LocationSource) || 'gps',
    timestamp: row.timestamp,
    note: row.note || '',
    synced: row.synced === 1,
    syncStatus: (row.sync_status as OfflineSyncStatus) || (row.synced === 1 ? 'synced' : 'pending'),
    lastError: row.last_error,
    createdAt: row.created_at,
  };
}

/**
 * Default Expo FileSystem adapter using SDK 58 Directory/File/Paths APIs.
 * Copies compressed photos from cache into durable document storage.
 */
export const ExpoOfflineFileStore: OfflineFileStore = {
  async persistPhoto(sourceUri: string): Promise<string> {
    const draftsDir = new Directory(Paths.document, OFFLINE_PHOTOS_DIR);
    if (!draftsDir.exists) {
      draftsDir.create({ intermediates: true, idempotent: true });
    }

    const fileName = `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const destFile = new File(draftsDir, fileName);
    const sourceFile = new File(sourceUri);

    if (sourceFile.exists) {
      await sourceFile.copy(destFile);
      return destFile.uri;
    }

    return sourceUri;
  },

  async removePhoto(uri: string): Promise<void> {
    try {
      const file = new File(uri);
      if (file.exists) {
        file.delete();
      }
    } catch {
      // Ignore cleanup errors for already-removed files
    }
  },
};

export class OfflineQueueService {
  private dbPromise: Promise<SQLiteDatabaseLike> | null = null;
  private isSyncing = false;
  private readonly openDb: () => Promise<SQLiteDatabaseLike>;
  private readonly fileStore: OfflineFileStore;

  constructor(options?: {
    openDb?: () => Promise<SQLiteDatabaseLike>;
    fileStore?: OfflineFileStore;
  }) {
    this.openDb =
      options?.openDb ??
      (async () => SQLite.openDatabaseAsync(DB_NAME) as unknown as SQLiteDatabaseLike);
    this.fileStore = options?.fileStore ?? ExpoOfflineFileStore;
  }

  private async getDb(): Promise<SQLiteDatabaseLike> {
    if (!this.dbPromise) {
      this.dbPromise = (async () => {
        const db = await this.openDb();
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS offline_drafts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            photo_uri TEXT NOT NULL,
            lat REAL,
            lng REAL,
            location_source TEXT NOT NULL DEFAULT 'gps',
            timestamp TEXT NOT NULL,
            note TEXT NOT NULL DEFAULT '',
            synced INTEGER NOT NULL DEFAULT 0,
            sync_status TEXT NOT NULL DEFAULT 'pending',
            last_error TEXT,
            created_at TEXT NOT NULL
          );
        `);
        return db;
      })();
    }
    return this.dbPromise;
  }

  /**
   * Copies the compressed photo into durable storage and inserts a pending draft row.
   */
  async enqueueDraft(input: EnqueueOfflineDraftInput): Promise<OfflineDraftRecord> {
    const db = await this.getDb();
    const persistedUri = await this.fileStore.persistPhoto(input.photoUri);
    const nowIso = new Date().toISOString();
    const timestamp = input.timestamp || nowIso;
    const note = input.note ?? '';

    const result = await db.runAsync(
      `INSERT INTO offline_drafts
        (photo_uri, lat, lng, location_source, timestamp, note, synced, sync_status, last_error, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, 'pending', NULL, ?)`,
      persistedUri,
      input.lat,
      input.lng,
      input.locationSource,
      timestamp,
      note,
      nowIso
    );

    return {
      id: result.lastInsertRowId,
      photoUri: persistedUri,
      lat: input.lat,
      lng: input.lng,
      locationSource: input.locationSource,
      timestamp,
      note,
      synced: false,
      syncStatus: 'pending',
      lastError: null,
      createdAt: nowIso,
    };
  }

  async getPendingDrafts(): Promise<OfflineDraftRecord[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<RawDraftRow>(
      `SELECT * FROM offline_drafts WHERE synced = 0 ORDER BY created_at ASC`
    );
    return rows.map(mapRowToDraft);
  }

  async getAllDrafts(): Promise<OfflineDraftRecord[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<RawDraftRow>(
      `SELECT * FROM offline_drafts ORDER BY created_at DESC`
    );
    return rows.map(mapRowToDraft);
  }

  async getDraftById(id: number): Promise<OfflineDraftRecord | null> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<RawDraftRow>(
      `SELECT * FROM offline_drafts WHERE id = ?`,
      id
    );
    return row ? mapRowToDraft(row) : null;
  }

  async markSyncing(id: number): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(
      `UPDATE offline_drafts SET sync_status = 'syncing', last_error = NULL WHERE id = ?`,
      id
    );
  }

  async markSynced(id: number): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(
      `UPDATE offline_drafts SET synced = 1, sync_status = 'synced', last_error = NULL WHERE id = ?`,
      id
    );
  }

  async markFailed(id: number, errorMessage: string): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(
      `UPDATE offline_drafts SET synced = 0, sync_status = 'failed', last_error = ? WHERE id = ?`,
      errorMessage,
      id
    );
  }

  async deleteDraft(id: number): Promise<void> {
    const db = await this.getDb();
    const existing = await this.getDraftById(id);
    await db.runAsync(`DELETE FROM offline_drafts WHERE id = ?`, id);
    if (existing?.photoUri) {
      await this.fileStore.removePhoto(existing.photoUri);
    }
  }

  /**
   * Sequentially synchronizes all unsynced drafts (pending or previously failed).
   * Transitions each draft: pending/failed -> syncing -> synced | failed.
   */
  async syncPendingDrafts(processor: DraftSyncProcessor): Promise<SyncBatchSummary> {
    if (this.isSyncing) {
      return { syncedCount: 0, failedCount: 0, processedIds: [], errors: [] };
    }

    this.isSyncing = true;
    const summary: SyncBatchSummary = {
      syncedCount: 0,
      failedCount: 0,
      processedIds: [],
      errors: [],
    };

    try {
      const pending = await this.getPendingDrafts();
      for (const draft of pending) {
        await this.markSyncing(draft.id);
        summary.processedIds.push(draft.id);
        try {
          await processor(draft);
          await this.markSynced(draft.id);
          summary.syncedCount += 1;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Sync failed';
          await this.markFailed(draft.id, message);
          summary.failedCount += 1;
          summary.errors.push({ id: draft.id, error: message });
        }
      }
      return summary;
    } finally {
      this.isSyncing = false;
    }
  }
}

export const offlineQueue = new OfflineQueueService();

export function isNetStateOnline(state: NetInfoState): boolean {
  return Boolean(state.isConnected) && state.isInternetReachable !== false;
}

/**
 * Checks current connectivity via NetInfo.
 */
export async function checkIsOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return isNetStateOnline(state);
}

/**
 * Subscribes to NetInfo connectivity transitions and automatically synchronizes
 * queued offline drafts whenever connectivity returns.
 */
export function subscribeToOfflineAutoSync(
  processor: DraftSyncProcessor,
  onSyncComplete?: (summary: SyncBatchSummary) => void
): () => void {
  return NetInfo.addEventListener((state) => {
    if (isNetStateOnline(state)) {
      offlineQueue
        .syncPendingDrafts(processor)
        .then((summary) => {
          if (summary.processedIds.length > 0) {
            onSyncComplete?.(summary);
          }
        })
        .catch((err) => {
          console.warn('[offline-queue] auto-sync warning:', err);
        });
    }
  });
}
