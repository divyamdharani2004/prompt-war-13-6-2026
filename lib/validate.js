/** Input validation/normalisation. Pure functions — unit-tested. */

export const LIMITS = { text: 5000, note: 500, exam: 40, message: 4000, messages: 40 };
const ALLOWED_EXAMS = new Set(["NEET", "JEE", "CUET", "CAT", "GATE", "UPSC", "Boards", "Other", ""]);

// Control characters except tab (09), newline (0A), carriage return (0D).
const CONTROL_RE = new RegExp("[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]", "g");

/** Strip control characters that could corrupt logs/storage or enable log injection. */
export function clean(str) {
  return String(str ?? "").replace(CONTROL_RE, "");
}

export function clampMood(m) {
  const n = Math.round(Number(m));
  if (!Number.isFinite(n)) return 3;
  return Math.min(5, Math.max(1, n));
}

export function validateJournal(body = {}) {
  const text = clean(body.text).trim();
  if (!text) return { error: "Journal text is required." };
  if (text.length > LIMITS.text) return { error: `Entry is too long (max ${LIMITS.text} characters).` };
  const exam = ALLOWED_EXAMS.has(body.exam) ? body.exam : "";
  return { value: { text, mood: clampMood(body.mood), exam } };
}

export function validateChat(body = {}) {
  if (!Array.isArray(body.messages)) return { error: "messages must be an array." };
  const messages = body.messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-LIMITS.messages)
    .map((m) => ({ role: m.role, content: clean(m.content).slice(0, LIMITS.message) }));
  if (!messages.length) return { error: "No valid messages provided." };
  return { value: { messages } };
}

export function validateExercise(body = {}) {
  return { value: { mood: clampMood(body.mood), note: clean(body.note).slice(0, LIMITS.note) } };
}
