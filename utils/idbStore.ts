// ============================================================
// Petit magasin clé/valeur basé sur IndexedDB.
//
// Le stock (avec les photos en base64) vivait uniquement dans
// localStorage via AsyncStorage, limité à quelques Mo par origine
// (bien moins sur iOS Safari). Dès que le blob total dépassait ce
// quota, TOUTE sauvegarde échouait (même un simple changement de
// prix), car il faut réécrire le tableau entier à chaque fois.
// IndexedDB n'a pas cette limite pratique (des centaines de Mo,
// généralement calculés sur l'espace disque libre).
// ============================================================

const DB_NAME = "stock01";
const STORE_NAME = "kv";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB indisponible"));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbGet(key: string): Promise<string | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve((req.result as string | undefined) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function idbSet(key: string, value: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
