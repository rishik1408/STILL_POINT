// ============================================================
// Jest Unit Tests: Offline SQLite Queue & Sync State Transitions
// Verifies mobile/src/lib/offline-queue.ts insertion, listing,
// state transitions (pending -> syncing -> synced | failed), and retry.
// ============================================================

import {
  OfflineFileStore,
  OfflineQueueService,
  SQLiteDatabaseLike,
} from '@/lib/offline-queue';

interface MockRow {
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

/**
 * In-memory SQLite stub adhering strictly to the SQLiteDatabaseLike contract.
 */
function createInMemorySQLite(): SQLiteDatabaseLike & { rows: MockRow[] } {
  let seq = 0;
  const rows: MockRow[] = [];

  return {
    rows,
    async execAsync() {
      // Schema creation no-op
    },
    async runAsync(source: string, ...params: unknown[]) {
      const sql = source.trim().toUpperCase();

      if (sql.startsWith('INSERT INTO OFFLINE_DRAFTS')) {
        seq += 1;
        const [photo_uri, lat, lng, location_source, timestamp, note, created_at] = params;
        rows.push({
          id: seq,
          photo_uri: String(photo_uri),
          lat: lat as number | null,
          lng: lng as number | null,
          location_source: String(location_source),
          timestamp: String(timestamp),
          note: String(note),
          synced: 0,
          sync_status: 'pending',
          last_error: null,
          created_at: String(created_at),
        });
        return { lastInsertRowId: seq, changes: 1 };
      }

      if (sql.includes("SET SYNC_STATUS = 'SYNCING'")) {
        const id = Number(params[0]);
        const target = rows.find((r) => r.id === id);
        if (target) {
          target.sync_status = 'syncing';
          target.last_error = null;
          return { lastInsertRowId: id, changes: 1 };
        }
        return { lastInsertRowId: 0, changes: 0 };
      }

      if (sql.includes("SET SYNCED = 1, SYNC_STATUS = 'SYNCED'")) {
        const id = Number(params[0]);
        const target = rows.find((r) => r.id === id);
        if (target) {
          target.synced = 1;
          target.sync_status = 'synced';
          target.last_error = null;
          return { lastInsertRowId: id, changes: 1 };
        }
        return { lastInsertRowId: 0, changes: 0 };
      }

      if (sql.includes("SET SYNCED = 0, SYNC_STATUS = 'FAILED'")) {
        const [errorMsg, idRaw] = params;
        const id = Number(idRaw);
        const target = rows.find((r) => r.id === id);
        if (target) {
          target.synced = 0;
          target.sync_status = 'failed';
          target.last_error = String(errorMsg);
          return { lastInsertRowId: id, changes: 1 };
        }
        return { lastInsertRowId: 0, changes: 0 };
      }

      if (sql.startsWith('DELETE FROM OFFLINE_DRAFTS')) {
        const id = Number(params[0]);
        const idx = rows.findIndex((r) => r.id === id);
        if (idx >= 0) {
          rows.splice(idx, 1);
          return { lastInsertRowId: 0, changes: 1 };
        }
        return { lastInsertRowId: 0, changes: 0 };
      }

      throw new Error(`Unhandled SQL in test stub: ${source}`);
    },
    async getAllAsync<T>(source: string): Promise<T[]> {
      const sql = source.trim().toUpperCase();
      if (sql.includes('WHERE SYNCED = 0')) {
        return rows.filter((r) => r.synced === 0) as unknown as T[];
      }
      return [...rows] as unknown as T[];
    },
    async getFirstAsync<T>(_source: string, ...params: unknown[]): Promise<T | null> {
      const id = Number(params[0]);
      return (rows.find((r) => r.id === id) as unknown as T) || null;
    },
  };
}

function createMockFileStore(): OfflineFileStore & { removed: string[] } {
  const removed: string[] = [];
  return {
    removed,
    async persistPhoto(sourceUri: string) {
      return sourceUri.replace('file:///cache/', 'file:///documents/offline-drafts/');
    },
    async removePhoto(uri: string) {
      removed.push(uri);
    },
  };
}

describe('OfflineQueueService', () => {
  it('persists photo to durable storage and inserts a pending draft row', async () => {
    const mockDb = createInMemorySQLite();
    const mockFs = createMockFileStore();
    const queue = new OfflineQueueService({
      openDb: async () => mockDb,
      fileStore: mockFs,
    });

    const draft = await queue.enqueueDraft({
      photoUri: 'file:///cache/pothole-1.jpg',
      lat: 18.922,
      lng: 72.833,
      locationSource: 'gps',
      timestamp: '2026-11-23T18:00:00.000Z',
      note: 'Deep cavity near bus bay',
    });

    expect(draft.id).toBe(1);
    expect(draft.photoUri).toBe('file:///documents/offline-drafts/pothole-1.jpg');
    expect(draft.synced).toBe(false);
    expect(draft.syncStatus).toBe('pending');
    expect(draft.note).toBe('Deep cavity near bus bay');

    const pending = await queue.getPendingDrafts();
    expect(pending).toHaveLength(1);
    expect(pending[0].id).toBe(1);
  });

  it('transitions draft states cleanly from pending -> syncing -> synced', async () => {
    const mockDb = createInMemorySQLite();
    const mockFs = createMockFileStore();
    const queue = new OfflineQueueService({
      openDb: async () => mockDb,
      fileStore: mockFs,
    });

    const draft = await queue.enqueueDraft({
      photoUri: 'file:///cache/footpath.jpg',
      lat: 19.118,
      lng: 72.862,
      locationSource: 'gps',
      note: 'Broken tactile slab',
    });

    const observedStates: string[] = [];
    const summary = await queue.syncPendingDrafts(async (item) => {
      const liveRecord = await queue.getDraftById(item.id);
      if (liveRecord) observedStates.push(liveRecord.syncStatus);
    });

    expect(observedStates).toEqual(['syncing']);
    expect(summary.syncedCount).toBe(1);
    expect(summary.failedCount).toBe(0);
    expect(summary.processedIds).toEqual([draft.id]);

    const after = await queue.getDraftById(draft.id);
    expect(after?.synced).toBe(true);
    expect(after?.syncStatus).toBe('synced');
    expect(after?.lastError).toBeNull();
    expect(await queue.getPendingDrafts()).toHaveLength(0);
  });

  it('records failed transition on network error and retries cleanly on next sync', async () => {
    const mockDb = createInMemorySQLite();
    const mockFs = createMockFileStore();
    const queue = new OfflineQueueService({
      openDb: async () => mockDb,
      fileStore: mockFs,
    });

    const draft = await queue.enqueueDraft({
      photoUri: 'file:///cache/drain.jpg',
      lat: 19.078,
      lng: 72.875,
      locationSource: 'gps',
      note: 'Blocked drain',
    });

    // First sync fails
    const failSummary = await queue.syncPendingDrafts(async () => {
      throw new Error('503 Service Unavailable');
    });

    expect(failSummary.syncedCount).toBe(0);
    expect(failSummary.failedCount).toBe(1);
    expect(failSummary.errors[0]).toEqual({
      id: draft.id,
      error: '503 Service Unavailable',
    });

    const failedRecord = await queue.getDraftById(draft.id);
    expect(failedRecord?.synced).toBe(false);
    expect(failedRecord?.syncStatus).toBe('failed');
    expect(failedRecord?.lastError).toBe('503 Service Unavailable');

    // Second sync succeeds once service recovers
    const retrySummary = await queue.syncPendingDrafts(async () => {
      // Upload succeeds
    });

    expect(retrySummary.syncedCount).toBe(1);
    expect(retrySummary.failedCount).toBe(0);

    const recovered = await queue.getDraftById(draft.id);
    expect(recovered?.synced).toBe(true);
    expect(recovered?.syncStatus).toBe('synced');
    expect(recovered?.lastError).toBeNull();
  });

  it('deletes draft row and removes persisted photo file', async () => {
    const mockDb = createInMemorySQLite();
    const mockFs = createMockFileStore();
    const queue = new OfflineQueueService({
      openDb: async () => mockDb,
      fileStore: mockFs,
    });

    const draft = await queue.enqueueDraft({
      photoUri: 'file:///cache/delete-me.jpg',
      lat: 19.0,
      lng: 72.8,
      locationSource: 'manual',
    });

    await queue.deleteDraft(draft.id);

    expect(await queue.getAllDrafts()).toHaveLength(0);
    expect(mockFs.removed).toEqual(['file:///documents/offline-drafts/delete-me.jpg']);
  });
});
