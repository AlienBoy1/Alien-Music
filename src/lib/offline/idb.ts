import {
  OFFLINE_DB_NAME,
  OFFLINE_DB_VERSION,
  OFFLINE_STORE,
  type OfflineDownloadRecord,
} from "@/lib/offline/types";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_DB_NAME, OFFLINE_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(OFFLINE_STORE)) {
        db.createObjectStore(OFFLINE_STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function idbGetAllDownloads(): Promise<OfflineDownloadRecord[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OFFLINE_STORE, "readonly");
    const store = tx.objectStore(OFFLINE_STORE);
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result as OfflineDownloadRecord[]) ?? []);
    req.onerror = () => reject(req.error);
  });
}

export async function idbPutDownload(record: OfflineDownloadRecord): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OFFLINE_STORE, "readwrite");
    tx.objectStore(OFFLINE_STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function idbRemoveDownload(trackId: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OFFLINE_STORE, "readwrite");
    tx.objectStore(OFFLINE_STORE).delete(trackId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function idbGetDownload(
  trackId: string,
): Promise<OfflineDownloadRecord | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OFFLINE_STORE, "readonly");
    const req = tx.objectStore(OFFLINE_STORE).get(trackId);
    req.onsuccess = () => resolve(req.result as OfflineDownloadRecord | undefined);
    req.onerror = () => reject(req.error);
  });
}
