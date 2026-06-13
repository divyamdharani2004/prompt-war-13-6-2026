import { test } from "node:test";
import assert from "node:assert/strict";
import { screenForCrisis, CRISIS_RESOURCES } from "../lib/safety.js";

test("detects explicit self-harm / suicidal ideation", () => {
  const positives = [
    "I want to die",
    "sometimes I feel like I want to die",
    "I think about killing myself",
    "I keep thinking about suicide",
    "I've been cutting myself",
    "everyone would be better off without me",
    "there's no reason to live anymore",
    "I just can't go on like this",
    "I want to hurt myself",
  ];
  for (const t of positives) assert.equal(screenForCrisis(t), true, `should flag: ${t}`);
});

test("does not flag ordinary exam stress", () => {
  const negatives = [
    "My rank dropped and I'm exhausted",
    "I'm so stressed about NEET",
    "This syllabus is killing my schedule", // figurative, not self-directed
    "I feel like I'm falling behind everyone",
    "",
  ];
  for (const t of negatives) assert.equal(screenForCrisis(t), false, `should NOT flag: ${t}`);
});

// Safety policy: the screen is intentionally biased toward over-flagging.
// A false positive (showing a helpline when not strictly needed) is a minor
// annoyance; a false negative (missing a real crisis) is unacceptable. So we
// deliberately accept that rare phrases like "die-cast" may trigger the screen.
test("errs toward over-flagging on ambiguous phrasing", () => {
  assert.equal(screenForCrisis("I want to die-cast this metal"), true);
});

test("handles non-string input safely", () => {
  assert.equal(screenForCrisis(null), false);
  assert.equal(screenForCrisis(undefined), false);
  assert.equal(screenForCrisis(42), false);
});

test("crisis resources always include working helplines", () => {
  assert.ok(CRISIS_RESOURCES.helplines.length >= 3);
  for (const h of CRISIS_RESOURCES.helplines) {
    assert.ok(h.name && h.contact);
  }
});
