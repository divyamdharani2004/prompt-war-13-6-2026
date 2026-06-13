import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { addEntry, loadEntries, getInsights, sanitizeUserId, _clearCache } from "../lib/store.js";
import { computeInsights } from "../lib/insights.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");

function entry(mood, triggers = []) {
  return {
    id: Math.random().toString(36).slice(2),
    createdAt: new Date().toISOString(),
    mood,
    exam: "",
    text: "t",
    analysis: { hidden_triggers: triggers, emotions: [] },
  };
}

// Clean up any test files we create.
after(async () => {
  for (const u of ["test-alice", "test-bob", "test-memo"]) {
    await fs.rm(path.join(DATA_DIR, `${u}.json`), { force: true });
  }
});

test("sanitizeUserId strips unsafe characters and defaults to anon", () => {
  assert.equal(sanitizeUserId("../../etc/passwd"), "etcpasswd");
  assert.equal(sanitizeUserId(""), "anon");
  assert.equal(sanitizeUserId(null), "anon");
  assert.equal(sanitizeUserId("Good_id-123"), "Good_id-123");
});

test("users are isolated from each other", async () => {
  _clearCache();
  await addEntry("test-alice", entry(2, ["Comparison & rank pressure"]));
  await addEntry("test-alice", entry(1, ["Comparison & rank pressure"]));
  await addEntry("test-bob", entry(5));

  assert.equal((await loadEntries("test-alice")).length, 2);
  assert.equal((await loadEntries("test-bob")).length, 1);
});

test("getInsights memoises and invalidates on write", async () => {
  _clearCache();
  await addEntry("test-memo", entry(3, ["Sleep & exhaustion"]));
  const first = await getInsights("test-memo", computeInsights);
  const cached = await getInsights("test-memo", computeInsights);
  assert.equal(first, cached, "should return the same memoised object");

  await addEntry("test-memo", entry(1, ["Sleep & exhaustion"]));
  const afterWrite = await getInsights("test-memo", computeInsights);
  assert.notEqual(afterWrite, first, "cache should be invalidated after a new entry");
  assert.equal(afterWrite.totalEntries, 2);
});
