/** Lightweight, dependency-free security middleware. */

/** Sensible security response headers + a Content-Security-Policy that allows
 *  our own scripts and Google Fonts, and nothing else. */
export function securityHeaders(_req, res, next) {
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data:",
      "connect-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; ")
  );
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  // HSTS: ignored by browsers over plain HTTP (localhost), enforced once behind TLS.
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
}

/** Fixed-window in-memory rate limiter (per IP). Protects token spend + abuse. */
export function rateLimit({ windowMs = 60_000, max = 40 } = {}) {
  const hits = new Map(); // ip -> { count, resetAt }
  // Periodic cleanup so the map can't grow unbounded.
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [ip, rec] of hits) if (rec.resetAt <= now) hits.delete(ip);
  }, windowMs);
  if (timer.unref) timer.unref();

  return function (req, res, next) {
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    const now = Date.now();
    let rec = hits.get(ip);
    if (!rec || rec.resetAt <= now) {
      rec = { count: 0, resetAt: now + windowMs };
      hits.set(ip, rec);
    }
    rec.count++;
    const remaining = Math.max(0, max - rec.count);
    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", remaining);
    if (rec.count > max) {
      res.setHeader("Retry-After", Math.ceil((rec.resetAt - now) / 1000));
      return res.status(429).json({ error: "Too many requests — please slow down for a moment." });
    }
    next();
  };
}
