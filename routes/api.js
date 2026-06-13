import express from "express";
import { DEMO, MODEL } from "../lib/anthropic.js";
import { screenForCrisis, CRISIS_RESOURCES } from "../lib/safety.js";
import { addEntry, getInsights, sanitizeUserId } from "../lib/store.js";
import { computeInsights } from "../lib/insights.js";
import {
  analyzeEntry,
  chatWithCompanion,
  generateExercise,
  summarizePatterns,
  buildContextNote,
} from "../lib/ai.js";
import { validateJournal, validateChat, validateExercise } from "../lib/validate.js";

export const router = express.Router();

/** Resolve the anonymous per-user id from a request header. */
function userOf(req) {
  return sanitizeUserId(req.get("x-user-id"));
}

router.get("/health", (_req, res) => res.json({ ok: true, demo: DEMO, model: MODEL }));

router.post("/journal", async (req, res) => {
  const { value, error } = validateJournal(req.body);
  if (error) return res.status(400).json({ error });

  const userId = userOf(req);
  const crisis = screenForCrisis(value.text);
  const analysis = await analyzeEntry(value.text, value.mood);
  if (crisis) analysis.risk_level = "high";

  const entry = {
    id: Date.now().toString(36),
    createdAt: new Date().toISOString(),
    mood: value.mood,
    exam: value.exam,
    text: value.text,
    analysis,
  };
  await addEntry(userId, entry);

  const atRisk = crisis || analysis.risk_level === "high";
  res.json({ entry, crisis: atRisk, resources: atRisk ? CRISIS_RESOURCES : null });
});

router.post("/chat", async (req, res) => {
  const { value, error } = validateChat(req.body);
  if (error) return res.status(400).json({ error });

  const userId = userOf(req);
  const lastUser = [...value.messages].reverse().find((m) => m.role === "user");
  const crisis = screenForCrisis(lastUser?.content ?? "");

  const insights = await getInsights(userId, computeInsights);
  const contextNote = buildContextNote(insights);
  const reply = await chatWithCompanion(value.messages.slice(-12), contextNote);

  res.json({ reply, crisis, resources: crisis ? CRISIS_RESOURCES : null });
});

router.post("/exercise", async (req, res) => {
  const { value } = validateExercise(req.body);
  const exercise = await generateExercise(value.mood, value.note);
  res.json({ exercise });
});

router.get("/insights", async (req, res) => {
  res.json(await getInsights(userOf(req), computeInsights));
});

router.get("/insights/summary", async (req, res) => {
  const insights = await getInsights(userOf(req), computeInsights);
  if (!insights.totalEntries) return res.json({ summary: null });
  const summary = await summarizePatterns(insights);
  res.json({ summary });
});
