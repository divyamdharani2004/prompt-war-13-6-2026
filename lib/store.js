/** Per-user, file-based store with in-memory caches.
 *
 *  Privacy: each anonymous user's journal lives in its own file, keyed by a
 *  sanitised client-supplied id. No user can read another's entries.
 *
 *  Efficiency: entries are cached in memory after first read (no disk hit per
 *  request), and computed insights are memoised and invalidated only when the
 *  user adds an entry — so repeated reads and chat-context builds are free.
 *
 *  Safety: per-user entry count is capped to bound storage (storage-DoS guard).
 *  (For multi-instance production, swap this module for a real database — the
 *  interface stays the same.)
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
const MAX_ENTRIES = 1000; // keep the most recent N per user

const cache = new Map(); // userId -> entries[]
const insightsCache = new Map(); // userId -> computed insights

/** Restrict the client-supplied id to a safe filename token. */
export function sanitizeUserId(raw) {
  const clean = String(raw || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  return clean || "anon";
}

function fileFor(userId) {
  return path.join(DATA_DIR, `${userId}.json`);
}

export async function loadEntries(userId) {
  if (cache.has(userId)) return cache.get(userId);
  let entries = [];
  try {
    entries = JSON.parse(await fs.readFile(fileFor(userId), "utf8"));
  } catch {
    entries = [];
  }
  cache.set(userId, entries);
  return entries;
}

export async function addEntry(userId, entry) {
  let entries = await loadEntries(userId);
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) entries = entries.slice(-MAX_ENTRIES);
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(fileFor(userId), JSON.stringify(entries, null, 2));
  cache.set(userId, entries);
  insightsCache.delete(userId); // invalidate derived data
  return entry;
}

/** Memoised insights — recomputed only after a new entry is added. */
export async function getInsights(userId, compute) {
  if (insightsCache.has(userId)) return insightsCache.get(userId);
  const ins = compute(await loadEntries(userId));
  insightsCache.set(userId, ins);
  return ins;
}

/** Test-only: reset in-memory caches. */
export function _clearCache() {
  cache.clear();
  insightsCache.clear();
}
