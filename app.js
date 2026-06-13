import express from "express";
import compression from "compression";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { securityHeaders, rateLimit } from "./middleware/security.js";
import { router as api } from "./routes/api.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Build the Express app (no listen). Exported so tests can run it on an
 *  ephemeral port without starting the real server. */
export function createApp() {
  const app = express();
  app.disable("x-powered-by");

  app.use(securityHeaders);
  app.use(compression()); // gzip JSON + asset responses
  app.use(express.json({ limit: "256kb" }));

  // Expensive AI / write endpoints get a stricter limiter (token-spend guard);
  // it runs before the general limiter + router below.
  const aiLimiter = rateLimit({ windowMs: 60_000, max: 15 });
  app.use(
    ["/api/journal", "/api/chat", "/api/exercise", "/api/insights/summary"],
    aiLimiter
  );

  // General API limiter (reads) + routes.
  app.use("/api", rateLimit({ windowMs: 60_000, max: 60 }), api);

  // Static assets with long cache for fingerprintable files; HTML stays fresh.
  app.use(
    express.static(path.join(__dirname, "public"), {
      maxAge: "1h",
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html")) res.setHeader("Cache-Control", "no-cache");
      },
    })
  );

  // Structured JSON 500 handler — never leak internals to the client.
  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  });

  return app;
}
