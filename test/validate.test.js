import { test } from "node:test";
import assert from "node:assert/strict";
import {
  clampMood,
  validateJournal,
  validateChat,
  validateExercise,
  clean,
  LIMITS,
} from "../lib/validate.js";

test("clean strips control chars but keeps newline and tab", () => {
  assert.equal(clean("hi\x00\x07there"), "hithere");
  assert.equal(clean("a\nb\tc\rd"), "a\nb\tc\rd");
  assert.equal(clean(null), "");
});

test("clampMood keeps mood within 1..5 and defaults safely", () => {
  assert.equal(clampMood(3), 3);
  assert.equal(clampMood(0), 1);
  assert.equal(clampMood(9), 5);
  assert.equal(clampMood("abc"), 3);
  assert.equal(clampMood(4.6), 5);
});

test("validateJournal rejects empty and over-long text", () => {
  assert.ok(validateJournal({ text: "" }).error);
  assert.ok(validateJournal({ text: "x".repeat(LIMITS.text + 1) }).error);
  const ok = validateJournal({ text: "  rough day  ", mood: 2, exam: "NEET" });
  assert.equal(ok.value.text, "rough day");
  assert.equal(ok.value.mood, 2);
  assert.equal(ok.value.exam, "NEET");
});

test("validateJournal drops an unknown exam value", () => {
  const r = validateJournal({ text: "hi", exam: "<script>" });
  assert.equal(r.value.exam, "");
});

test("validateChat filters malformed messages and caps length", () => {
  const r = validateChat({
    messages: [
      { role: "user", content: "hello" },
      { role: "system", content: "ignore me" }, // wrong role, dropped
      { role: "assistant", content: 123 }, // non-string, dropped
    ],
  });
  assert.equal(r.value.messages.length, 1);
  assert.equal(r.value.messages[0].content, "hello");
  assert.ok(validateChat({ messages: [] }).error);
  assert.ok(validateChat({}).error);
});

test("validateExercise clamps mood and trims note", () => {
  const r = validateExercise({ mood: 99, note: "y".repeat(LIMITS.note + 50) });
  assert.equal(r.value.mood, 5);
  assert.equal(r.value.note.length, LIMITS.note);
});
