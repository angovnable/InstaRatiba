// ============================================================
// InstaRatiba — src/lib/pwa/syncQueue.ts
// Offline sync queue: persists mutations to IndexedDB while
// offline and replays them against Supabase when connectivity
// is restored.
// ============================================================

export type QueuedMutation = {
  id: string
  createdAt: string          // ISO timestamp
  type: 'upsert' | 'delete' | 'rpc'
  table?: string             // for upsert / delete
  payload?: unknown          // body for upsert
  filter?: Record<string, unknown>   // for delete
  rpcName?: string           // for rpc
  rpcArgs?: unknown          // for rpc
  retryCount: number
  label: string              // human-readable description shown in UI
}

const DB_NAME    = 'instaratiba-sync'
const STORE_NAME = 'queue'
const DB_VERSION = 1

// ── Open IndexedDB ────────────────────────────────────────────
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: 'id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror   = () => reject(req.error)
  })
}

// ── Enqueue a mutation ────────────────────────────────────────
export async function enqueue(
  mutation: Omit<QueuedMutation, 'id' | 'createdAt' | 'retryCount'>,
): Promise<void> {
  const db = await openDb()
  const entry: QueuedMutation = {
    ...mutation,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    retryCount: 0,
  }
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req   = store.add(entry)
    req.onsuccess = () => resolve()
    req.onerror   = () => reject(req.error)
  })
}

// ── Get all queued mutations ──────────────────────────────────
export async function getQueue(): Promise<QueuedMutation[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req   = store.getAll()
    req.onsuccess = () => resolve(req.result as QueuedMutation[])
    req.onerror   = () => reject(req.error)
  })
}

// ── Remove a mutation after successful replay ─────────────────
export async function dequeue(id: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req   = store.delete(id)
    req.onsuccess = () => resolve()
    req.onerror   = () => reject(req.error)
  })
}

// ── Increment retry counter ───────────────────────────────────
export async function incrementRetry(id: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const getReq = store.get(id)
    getReq.onsuccess = () => {
      const item = getReq.result as QueuedMutation | undefined
      if (!item) return resolve()
      item.retryCount += 1
      const putReq = store.put(item)
      putReq.onsuccess = () => resolve()
      putReq.onerror   = () => reject(putReq.error)
    }
    getReq.onerror = () => reject(getReq.error)
  })
}

// ── Clear entire queue (e.g. on sign-out) ─────────────────────
export async function clearQueue(): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req   = store.clear()
    req.onsuccess = () => resolve()
    req.onerror   = () => reject(req.error)
  })
}
