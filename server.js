import "dotenv/config";
import { createApp } from "./app.js";
import { ACTIVE_MODEL, DEMO, PROVIDER } from "./lib/provider.js";
import { PORT } from "./lib/config.js";

const mode = DEMO ? "DEMO (no API key)" : `LIVE via ${PROVIDER}`;

createApp().listen(PORT, () => {
  console.log(`\n🌿 MindSpace running at http://localhost:${PORT}`);
  console.log(`   Model: ${ACTIVE_MODEL}  |  Mode: ${mode}\n`);
});
