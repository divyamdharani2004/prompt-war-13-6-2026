import express from "express";
import compression from "compression";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { JSON_BODY_LIMIT, RATE_LIMITS, AI_ENDPOINTS } from "./lib/config.js";
import { securityHeaders, rateLimit } from "./middleware/security.js";
import { router as api } from "./routes/api.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Build the Express app (without calling listen). Exported so tests can run it
 * on an ephemeral port without starting the real server.
 * @returns {import("express").Express}
 */
export function createApp() {
  const app = express();
  app.disable("x-powered-by");

  app.use(securityHeaders);
  app.use(compression()); // gzip JSON + asset responses
  app.use(express.json({ limit: JSON_BODY_LIMIT }));

  // Expensive AI / write endpoints get a stricter limiter (token-spend guard);
  // it runs before the general limiter + router below.
  app.use(AI_ENDPOINTS, rateLimit(RATE_LIMITS.ai));

  // General API limiter (reads) + routes.
  app.use("/api", rateLimit(RATE_LIMITS.general), api);

  // Unknown API routes get a structured 404 (not the static handler).
  app.use("/api", (_req, res) => res.status(404).json({ error: "Not found." }));

  // Static assets: long cache for fingerprintable files; HTML stays fresh.
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
