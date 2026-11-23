import Dexie, { type EntityTable } from 'dexie';

// Offline draft for field capture
export interface OfflineDraft {
  id?: number;
  photoBlob: Blob;
  photoPreview: string;
  lat: number | null;
  lng: number | null;
  locationSource: 'exif' | 'manual' | 'gps';
  timestamp: string;
  note: string;
  synced: boolean;
  createdAt: string;
}

const db = new Dexie('piams-offline') as Dexie & {
  drafts: EntityTable<OfflineDraft, 'id'>;
};

db.version(1).stores({
  drafts: '++id, synced, createdAt',
});

export { db };
