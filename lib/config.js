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

/** OpenRouter (openrouter.ai) — unified gateway to many models. */
export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

/** Default OpenRouter model. Override with the OPENROUTER_MODEL env var.
 *  Examples: "anthropic/claude-3.5-sonnet", "openai/gpt-4o-mini",
 *  free tiers like "meta-llama/llama-3.3-70b-instruct:free". */
export const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-sonnet";

/** Public app URL, used for OpenRouter ranking headers. */
export const APP_URL = process.env.APP_URL || "http://localhost:3000";
