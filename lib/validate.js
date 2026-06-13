/** Input validation/normalisation. Pure functions — unit-tested. */

import { INPUT_LIMITS, ALLOWED_EXAMS } from "./config.js";

/** @type {typeof INPUT_LIMITS} Re-exported for callers/tests. */
export const LIMITS = INPUT_LIMITS;

const EXAM_SET = new Set(ALLOWED_EXAMS);

// Control characters except tab (09), newline (0A), carriage return (0D).
// Intentionally matches control chars (sanitisation), so the rule is disabled here.
// eslint-disable-next-line no-control-regex
const CONTROL_RE = new RegExp("[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]", "g");

/**
 * Strip control characters that could corrupt logs/storage or enable log injection.
 * @param {unknown} str
 * @returns {string}
 */
export function clean(str) {
  return String(str ?? "").replace(CONTROL_RE, "");
}

/**
 * Clamp a value to a valid mood (integer 1–5), defaulting to 3.
 * @param {unknown} m
 * @returns {number}
 */
export function clampMood(m) {
  const n = Math.round(Number(m));
  if (!Number.isFinite(n)) return 3;
  return Math.min(5, Math.max(1, n));
}

/** @typedef {{error: string} | {value: any}} Validated */

/**
 * Validate a journal-entry request body.
 * @param {{text?: string, mood?: unknown, exam?: string}} [body]
 * @returns {Validated}
 */
export function validateJournal(body = {}) {
  const text = clean(body.text).trim();
  if (!text) return { error: "Journal text is required." };
  if (text.length > LIMITS.text) return { error: `Entry is too long (max ${LIMITS.text} characters).` };
  const exam = EXAM_SET.has(body.exam) ? body.exam : "";
  return { value: { text, mood: clampMood(body.mood), exam } };
}

/**
 * Validate a chat request body, dropping malformed messages.
 * @param {{messages?: unknown}} [body]
 * @returns {Validated}
 */
export function validateChat(body = {}) {
  if (!Array.isArray(body.messages)) return { error: "messages must be an array." };
  const messages = body.messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-LIMITS.messages)
    .map((m) => ({ role: m.role, content: clean(m.content).slice(0, LIMITS.message) }));
  if (!messages.length) return { error: "No valid messages provided." };
  return { value: { messages } };
}

/**
 * Validate an exercise request body.
 * @param {{mood?: unknown, note?: string}} [body]
 * @returns {Validated}
 */
export function validateExercise(body = {}) {
  return { value: { mood: clampMood(body.mood), note: clean(body.note).slice(0, LIMITS.note) } };
}
