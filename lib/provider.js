/**
 * LLM provider gateway. Chooses a backend at startup and exposes one unified
 * `complete()` call, so the rest of the app is provider-agnostic.
 *
 * Precedence:
 *   1. OPENROUTER_API_KEY  → OpenRouter (openrouter.ai, OpenAI-compatible)
 *   2. ANTHROPIC_API_KEY   → Anthropic API direct
 *   3. neither             → DEMO mode (locally simulated responses)
 */

import Anthropic from "@anthropic-ai/sdk";
import { MODEL as ANTHROPIC_MODEL, OPENROUTER_BASE_URL, OPENROUTER_MODEL, APP_URL } from "./config.js";

const openrouterKey = process.env.OPENROUTER_API_KEY;
const anthropicKey = process.env.ANTHROPIC_API_KEY;

/** @type {"openrouter" | "anthropic" | "demo"} */
export const PROVIDER = openrouterKey ? "openrouter" : anthropicKey ? "anthropic" : "demo";

/** True when no real provider is configured. */
export const DEMO = PROVIDER === "demo";

/** Human-readable model label for status/logging. */
export const ACTIVE_MODEL =
  PROVIDER === "openrouter" ? OPENROUTER_MODEL : PROVIDER === "anthropic" ? ANTHROPIC_MODEL : "demo";

const anthropic = PROVIDER === "anthropic" ? new Anthropic({ apiKey: anthropicKey }) : null;

if (DEMO) {
  console.log(
    "\n⚠️  No OPENROUTER_API_KEY or ANTHROPIC_API_KEY found — running in DEMO MODE.\n" +
      "   The app is fully usable; AI responses are simulated locally.\n" +
      "   Add a key to .env to enable real model-powered analysis.\n"
  );
}

/**
 * Generate a completion. Returns the assistant's text content.
 *
 * @param {Object}   opts
 * @param {string}   opts.system        System prompt.
 * @param {{role:"user"|"assistant", content:string}[]} opts.messages
 * @param {number}   [opts.maxTokens]   Output cap.
 * @param {object}   [opts.schema]      JSON schema — when present, the response is JSON.
 * @returns {Promise<string>}
 */
export async function complete({ system, messages, maxTokens = 1024, schema }) {
  if (PROVIDER === "openrouter") return completeOpenRouter({ system, messages, maxTokens, schema });
  if (PROVIDER === "anthropic") return completeAnthropic({ system, messages, maxTokens, schema });
  throw new Error("No LLM provider configured (demo mode).");
}

async function completeAnthropic({ system, messages, maxTokens, schema }) {
  const resp = await anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: maxTokens,
    thinking: { type: "adaptive" },
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
    ...(schema ? { output_config: { format: { type: "json_schema", schema } } } : {}),
    messages,
  });
  return resp.content.find((b) => b.type === "text")?.text ?? "";
}

async function completeOpenRouter({ system, messages, maxTokens, schema }) {
  const sys = schema
    ? `${system}\n\nRespond with ONLY a single valid JSON object — no prose, no markdown fences.`
    : system;

  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openrouterKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": APP_URL, // optional ranking metadata for OpenRouter
      "X-Title": "MindSpace",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      max_tokens: maxTokens,
      messages: [{ role: "system", content: sys }, ...messages],
      ...(schema ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || `OpenRouter request failed (${res.status})`);
  }
  return data?.choices?.[0]?.message?.content ?? "";
}
