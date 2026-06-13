import "dotenv/config";
import { createApp } from "./app.js";
import { MODEL, DEMO } from "./lib/anthropic.js";
import { PORT } from "./lib/config.js";

createApp().listen(PORT, () => {
  console.log(`\n🌿 MindSpace running at http://localhost:${PORT}`);
  console.log(`   Model: ${MODEL}  |  Mode: ${DEMO ? "DEMO (no API key)" : "LIVE (Claude)"}\n`);
});
