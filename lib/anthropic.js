import Anthropic from "@anthropic-ai/sdk";

export const MODEL = "claude-opus-4-8";

const apiKey = process.env.ANTHROPIC_API_KEY;
export const client = apiKey ? new Anthropic({ apiKey }) : null;
export const DEMO = !client;

if (DEMO) {
  console.log(
    "\n⚠️  No ANTHROPIC_API_KEY found — running in DEMO MODE.\n" +
      "   The app is fully usable; AI responses are simulated locally.\n" +
      "   Add a key to .env to enable real Claude-powered analysis.\n"
  );
}
