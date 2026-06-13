/** Per-user store with in-memory caches and best-effort disk persistence.
 *
 *  Privacy: each anonymous user's journal lives in its own file, keyed by a
 *  sanitised client-supplied id. No user can read another's entries.
 *
 *  Efficiency: entries are cached in memory after first read (no disk hit per
 *  request), and computed insights are memoised and invalidated only when the
 *  user adds an entry.
 *
 *  Portability: on serverless platforms (e.g. Vercel) the project directory is
 *  read-only, so we write to the OS temp dir and treat disk writes as
 *  best-effort — the in-memory cache is the source of truth for the running
 *  instance, so a read-only filesystem can never crash a request. For durable,
 *  cross-instance persistence in production, swap this module for a database
 *  (e.g. Vercel KV / Postgres) — the interface stays the same.
 */

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MAX_ENTRIES_PER_USER } from "./config.js";

/** @typedef {import("./types.js").Entry} Entry */
/** @typedef {import("./types.js").Insights} Insights */

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// On Vercel/Lambda the bundle is read-only; only the temp dir is writable.
const IS_SERVERLESS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = IS_SERVERLESS
  ? path.join(os.tmpdir(), "mindspace-data")
  : path.join(__dirname, "..", "data");

/** @type {Map<string, Entry[]>} */
const cache = new Map();
/** @type {Map<string, Insights>} */
const insightsCache = new Map();

/** Restrict the client-supplied id to a safe filename token. */
export function sanitizeUserId(raw) {
  const clean = String(raw || "")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 64);
  return clean || "anon";
}

function fileFor(userId) {
  return path.join(DATA_DIR, `${userId}.json`);
}

/**
 * Load a user's entries (cached in memory after first read).
 * @param {string} userId
 * @returns {Promise<Entry[]>}
 */
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

/**
 * Append an entry for a user, trim to the cap, and invalidate derived data.
 * Disk persistence is best-effort; the in-memory cache always reflects the write.
 * @param {string} userId
 * @param {Entry} entry
 * @returns {Promise<Entry>}
 */
export async function addEntry(userId, entry) {
  let entries = await loadEntries(userId);
  entries.push(entry);
  if (entries.length > MAX_ENTRIES_PER_USER) entries = entries.slice(-MAX_ENTRIES_PER_USER);
  cache.set(userId, entries);
  insightsCache.delete(userId); // invalidate derived data

  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(fileFor(userId), JSON.stringify(entries, null, 2));
  } catch (e) {
    // Read-only FS (serverless) or disk error — keep serving from memory.
    console.warn(`Entry persisted in memory only (disk write failed): ${e.message}`);
  }
  return entry;
}

/**
 * Memoised insights — recomputed only after a new entry is added.
 * @param {string} userId
 * @param {(entries: Entry[]) => Insights} compute
 * @returns {Promise<Insights>}
 */
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
