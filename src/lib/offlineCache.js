/**
 * WASSCEPrep — Offline Question Cache (IndexedDB)
 *
 * Stores questions locally so students can practice without internet.
 * Questions are cached the first time a subject is loaded online,
 * then served instantly from the local cache on subsequent visits.
 *
 * Usage:
 *   import { cacheQuestions, getCachedQuestions, hasCachedSubject } from '@/lib/offlineCache'
 *
 *   // After fetching from Supabase:
 *   await cacheQuestions(subjectName, paperNumber, questions)
 *
 *   // When offline (or to speed up load):
 *   const questions = await getCachedQuestions(subjectName, paperNumber)
 */

const DB_NAME    = 'wassceprep-offline'
const DB_VERSION = 1
const STORE_QUESTIONS = 'questions'
const STORE_META      = 'meta'

// ── Open (or create) the database ───────────────────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)

    req.onupgradeneeded = (event) => {
      const db = event.target.result

      // questions store — keyed by "subject::paperNumber"
      if (!db.objectStoreNames.contains(STORE_QUESTIONS)) {
        db.createObjectStore(STORE_QUESTIONS, { keyPath: 'cacheKey' })
      }

      // meta store — tracks when each subject was last cached
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' })
      }
    }

    req.onsuccess  = () => resolve(req.result)
    req.onerror    = () => reject(req.error)
  })
}

// ── Build the cache key ──────────────────────────────────────────────────────
function cacheKey(subject, paperNumber) {
  return `${subject}::${paperNumber}`
}

// ── Save questions to IndexedDB ──────────────────────────────────────────────
export async function cacheQuestions(subject, paperNumber, questions) {
  if (!questions?.length) return
  try {
    const db = await openDB()
    const tx = db.transaction([STORE_QUESTIONS, STORE_META], 'readwrite')

    tx.objectStore(STORE_QUESTIONS).put({
      cacheKey: cacheKey(subject, paperNumber),
      subject,
      paperNumber,
      questions,
      cachedAt: Date.now(),
    })

    tx.objectStore(STORE_META).put({
      key: cacheKey(subject, paperNumber),
      cachedAt: Date.now(),
      count: questions.length,
    })

    await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej })
    db.close()
  } catch (err) {
    console.warn('offlineCache: failed to save questions', err)
  }
}

// ── Retrieve cached questions ────────────────────────────────────────────────
export async function getCachedQuestions(subject, paperNumber) {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_QUESTIONS, 'readonly')
    const store = tx.objectStore(STORE_QUESTIONS)

    return new Promise((resolve) => {
      const req = store.get(cacheKey(subject, paperNumber))
      req.onsuccess = () => {
        db.close()
        resolve(req.result?.questions || [])
      }
      req.onerror = () => { db.close(); resolve([]) }
    })
  } catch {
    return []
  }
}

// ── Check if a subject/paper combo is cached ────────────────────────────────
export async function hasCachedSubject(subject, paperNumber) {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_META, 'readonly')

    return new Promise((resolve) => {
      const req = tx.objectStore(STORE_META).get(cacheKey(subject, paperNumber))
      req.onsuccess = () => { db.close(); resolve(!!req.result) }
      req.onerror   = () => { db.close(); resolve(false) }
    })
  } catch {
    return false
  }
}

// ── Get cache status for all subjects ───────────────────────────────────────
// Returns { 'Mathematics::1': { cachedAt, count }, ... }
export async function getCacheStatus() {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_META, 'readonly')

    return new Promise((resolve) => {
      const req = tx.objectStore(STORE_META).getAll()
      req.onsuccess = () => {
        db.close()
        const map = {}
        ;(req.result || []).forEach(entry => { map[entry.key] = entry })
        resolve(map)
      }
      req.onerror = () => { db.close(); resolve({}) }
    })
  } catch {
    return {}
  }
}

// ── Clear all cached data (e.g. when user logs out) ─────────────────────────
export async function clearCache() {
  try {
    const db = await openDB()
    const tx = db.transaction([STORE_QUESTIONS, STORE_META], 'readwrite')
    tx.objectStore(STORE_QUESTIONS).clear()
    tx.objectStore(STORE_META).clear()
    await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej })
    db.close()
  } catch (err) {
    console.warn('offlineCache: failed to clear cache', err)
  }
}

// ── Pending quiz results queue (for offline sync) ────────────────────────────
const STORE_PENDING = 'pending_results'

export async function queuePendingResult(sessionData) {
  try {
    const db = await openDB()
    // Ensure the pending_results store exists (added lazily)
    if (!db.objectStoreNames.contains(STORE_PENDING)) {
      db.close()
      // Bump version to add the new store
      const newDb = await new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION + 1)
        req.onupgradeneeded = (e) => {
          const d = e.target.result
          if (!d.objectStoreNames.contains(STORE_PENDING)) {
            d.createObjectStore(STORE_PENDING, { keyPath: 'id', autoIncrement: true })
          }
        }
        req.onsuccess = () => resolve(req.result)
        req.onerror   = () => reject(req.error)
      })
      const tx = newDb.transaction(STORE_PENDING, 'readwrite')
      tx.objectStore(STORE_PENDING).add({ ...sessionData, queuedAt: Date.now() })
      await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej })
      newDb.close()
      return
    }
    const tx = db.transaction(STORE_PENDING, 'readwrite')
    tx.objectStore(STORE_PENDING).add({ ...sessionData, queuedAt: Date.now() })
    await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej })
    db.close()
  } catch (err) {
    console.warn('offlineCache: failed to queue result', err)
  }
}
