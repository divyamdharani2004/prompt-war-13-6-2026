import Anthropic from "@anthropic-ai/sdk";
import { MODEL } from "./config.js";

export { MODEL };

const apiKey = process.env.ANTHROPIC_API_KEY;

/** Anthropic client, or `null` when no API key is configured. */
export const client = apiKey ? new Anthropic({ apiKey }) : null;

/** True when running without a key — AI responses are simulated locally. */
export const DEMO = !client;

if (DEMO) {
  console.log(
    "\n⚠️  No ANTHROPIC_API_KEY found — running in DEMO MODE.\n" +
      "   The app is fully usable; AI responses are simulated locally.\n" +
      "   Add a key to .env to enable real Claude-powered analysis.\n"
  );
}
