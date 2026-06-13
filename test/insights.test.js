import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeInsights,
  computeStreak,
  computeMoodTrend,
  computeTriggerImpact,
} from "../lib/insights.js";

function entry(date, mood, triggers = [], emotions = []) {
  return { createdAt: date, mood, analysis: { hidden_triggers: triggers, emotions } };
}

test("triggerImpact surfaces the most draining trigger first (lowest avg mood)", () => {
  const entries = [
    entry("2026-06-01T10:00:00Z", 2, ["Comparison & rank pressure"]),
    entry("2026-06-02T10:00:00Z", 1, ["Comparison & rank pressure"]),
    entry("2026-06-03T10:00:00Z", 4, ["Time / syllabus pressure"]),
  ];
  const impact = computeTriggerImpact(entries);
  assert.equal(impact[0].label, "Comparison & rank pressure");
  assert.equal(impact[0].avgMood, 1.5);
  assert.equal(impact[0].count, 2);
});

test("moodTrend detects an improving streak", () => {
  const entries = [1, 1, 2, 2, 4, 5].map((m, i) =>
    entry(`2026-06-0${i + 1}T10:00:00Z`, m)
  );
  assert.equal(computeMoodTrend(entries).label, "improving");
});

test("moodTrend detects a decline", () => {
  const entries = [5, 5, 4, 2, 1, 1].map((m, i) =>
    entry(`2026-06-0${i + 1}T10:00:00Z`, m)
  );
  assert.equal(computeMoodTrend(entries).label, "declining");
});

test("streak counts consecutive days and stops at a gap", () => {
  const entries = [
    entry("2026-06-01T10:00:00Z", 3),
    entry("2026-06-03T10:00:00Z", 3), // gap on the 2nd
    entry("2026-06-04T10:00:00Z", 3),
    entry("2026-06-05T10:00:00Z", 3),
  ];
  assert.equal(computeStreak(entries), 3);
});

test("computeInsights returns safe defaults for an empty store", () => {
  const i = computeInsights([]);
  assert.equal(i.totalEntries, 0);
  assert.equal(i.avgMood, null);
  assert.deepEqual(i.topTriggers, []);
  assert.equal(i.streak, 0);
});
