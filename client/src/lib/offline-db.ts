import type { Link } from "./types";

// Offline cache of the user's links in IndexedDB, so the shelf
// can still be viewed when the API is unreachable.

const DB_NAME = "highlights-offline";
const DB_VERSION = 1;
const LINKS_STORE = "links";

// Read the non-httpOnly uid cookie set by the server actions on login.
export function getCurrentUserId(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)hl_uid=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(LINKS_STORE)) {
        db.createObjectStore(LINKS_STORE, { keyPath: "_id" });
      }
      const store = request.transaction!.objectStore(LINKS_STORE);
      if (!store.indexNames.contains("userId")) {
        store.createIndex("userId", "userId", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveLinks(links: Link[]): Promise<void> {
  if (typeof indexedDB === "undefined") return;

  const userId = getCurrentUserId();
  if (!userId) return;

  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(LINKS_STORE, "readwrite");
    const store = transaction.objectStore(LINKS_STORE);

    store.clear();
    for (const link of links) {
      store.put({ ...link, userId });
    }

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getLinks(): Promise<Link[]> {
  if (typeof indexedDB === "undefined") return [];

  const userId = getCurrentUserId();
  if (!userId) return [];

  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(LINKS_STORE, "readonly");
    const store = transaction.objectStore(LINKS_STORE);
    const index = store.index("userId");
    const request = index.getAll(userId);

    request.onsuccess = () => {
      // Strip the injected userId before handing the links back to the UI.
      const rows = (request.result as (Link & { userId: string })[]).map(
        ({ userId: _uid, ...link }) => link,
      );
      resolve(rows);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function clearLinks(): Promise<void> {
  if (typeof indexedDB === "undefined") return;

  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(LINKS_STORE, "readwrite");
    const store = transaction.objectStore(LINKS_STORE);
    store.clear();

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}
