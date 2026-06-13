/** End-to-end route tests: boot the real app on an ephemeral port and hit it
 *  over HTTP. No API key needed — AI calls use the demo fallback. */

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "../app.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");

let server, base;

before(async () => {
  server = createApp().listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((r) => server.close(r));
  for (const u of ["rt-alice", "rt-bob"]) {
    await fs.rm(path.join(DATA_DIR, `${u}.json`), { force: true });
  }
});

function post(path, body, userId) {
  return fetch(base + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-user-id": userId },
    body: JSON.stringify(body),
  });
}
const get = (path, userId) => fetch(base + path, { headers: { "x-user-id": userId } });

test("health reports status and sets security headers", async () => {
  const res = await get("/api/health", "rt-alice");
  assert.equal(res.status, 200);
  assert.ok(res.headers.get("content-security-policy"));
  assert.equal(res.headers.get("x-frame-options"), "DENY");
  assert.equal(res.headers.get("x-powered-by"), null);
});

test("journal rejects empty text with 400", async () => {
  const res = await post("/api/journal", { text: "   ", mood: 3 }, "rt-alice");
  assert.equal(res.status, 400);
});

test("journal saves and returns hidden-trigger analysis", async () => {
  const res = await post(
    "/api/journal",
    { text: "Rank dropped, everyone ahead, no sleep", mood: 2, exam: "JEE" },
    "rt-alice"
  );
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(data.entry.analysis.hidden_triggers));
  assert.ok(data.entry.analysis.hidden_triggers.length > 0);
});

test("journal with crisis language flags risk and returns helplines", async () => {
  const res = await post("/api/journal", { text: "I want to die", mood: 1 }, "rt-alice");
  const data = await res.json();
  assert.equal(data.crisis, true);
  assert.ok(data.resources.helplines.length >= 3);
  assert.equal(data.entry.analysis.risk_level, "high");
});

test("insights are isolated per user", async () => {
  await post("/api/journal", { text: "Felt calm today", mood: 4 }, "rt-bob");
  const alice = await (await get("/api/insights", "rt-alice")).json();
  const bob = await (await get("/api/insights", "rt-bob")).json();
  assert.ok(alice.totalEntries >= 2);
  assert.equal(bob.totalEntries, 1);
});

test("chat returns a reply and crisis flag", async () => {
  const res = await post(
    "/api/chat",
    { messages: [{ role: "user", content: "I feel like I'm falling behind" }] },
    "rt-alice"
  );
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.ok(typeof data.reply === "string" && data.reply.length > 0);
  assert.equal(data.crisis, false);
});

test("exercise endpoint returns a structured exercise", async () => {
  const res = await post("/api/exercise", { mood: 2, note: "can't focus" }, "rt-alice");
  const data = await res.json();
  assert.ok(data.exercise.title && Array.isArray(data.exercise.steps));
});
