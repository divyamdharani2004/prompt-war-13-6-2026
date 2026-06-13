/**
 * Centralised application configuration. Single source of truth for every
 * tunable constant — no magic numbers scattered across modules.
 */

/** Claude model used for all generative features. */
export const MODEL = "claude-opus-4-8";

/** HTTP port (overridable via the PORT env var). */
export const PORT = Number(process.env.PORT) || 3000;

/** Maximum accepted JSON request body. */
export const JSON_BODY_LIMIT = "256kb";

/** Most recent entries retained per user (bounds storage). */
export const MAX_ENTRIES_PER_USER = 1000;

/** Number of recent messages of chat history sent to the model. */
export const CHAT_HISTORY_WINDOW = 12;

/** Rate-limit windows (ms) and max requests per window, per IP. */
export const RATE_LIMITS = {
  /** Expensive AI / write endpoints. */
  ai: { windowMs: 60_000, max: 15 },
  /** General read endpoints. */
  general: { windowMs: 60_000, max: 60 },
};

/** Paths that go through the stricter AI rate limiter. */
export const AI_ENDPOINTS = ["/api/journal", "/api/chat", "/api/exercise", "/api/insights/summary"];

/** Input length limits (characters / array sizes). */
export const INPUT_LIMITS = {
  text: 5000,
  note: 500,
  message: 4000,
  messages: 40,
};

/** Exam tracks the student can tag an entry with. */
export const ALLOWED_EXAMS = ["NEET", "JEE", "CUET", "CAT", "GATE", "UPSC", "Boards", "Other", ""];
