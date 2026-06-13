/**
 * Safety layer. This is the single most important path in the app, so it is a
 * standalone, fully unit-tested module with no external dependencies.
 *
 * The model is also instructed to flag risk, but this deterministic keyword pass
 * guarantees a helpline is always surfaced — even in demo mode or if a model
 * call fails. Safety must never depend on a network call succeeding.
 */

export const CRISIS_PATTERNS = [
  /\bkill(ing)? (myself|me)\b/i,
  /\bend (my life|it all|my own life)\b/i,
  /\bsuicid/i,
  /\bself[-\s]?harm/i,
  /\bcut(ting)? myself\b/i,
  /\bno reason to live\b/i,
  /\b(want|wanted|wanting) to die\b/i,
  /\bdon'?t want to (be alive|live|exist)\b/i,
  /\bbetter off (dead|without me)\b/i,
  /\bhurt(ing)? myself\b/i,
  /\bcan'?t go on\b/i,
];

/** Returns true if the text shows signals of self-harm / suicidal ideation. */
export function screenForCrisis(text = "") {
  if (typeof text !== "string") return false;
  return CRISIS_PATTERNS.some((re) => re.test(text));
}

export const CRISIS_RESOURCES = {
  message:
    "It sounds like you're carrying something really heavy right now, and you don't have to carry it alone. " +
    "Please reach out to someone who can support you right away.",
  helplines: [
    { name: "Tele-MANAS (Govt. of India, 24×7)", contact: "14416 or 1-800-891-4416" },
    { name: "KIRAN Mental Health Helpline", contact: "1800-599-0019" },
    { name: "iCall (TISS) Psychosocial Helpline", contact: "9152987821" },
    { name: "Vandrevala Foundation (24×7)", contact: "1860-2662-345 / 9999-666-555" },
  ],
  note: "If you are in immediate danger, please call your local emergency number or reach out to someone you trust nearby.",
};
