/**
 * Shared JSDoc type definitions. This file has no runtime code — it documents
 * the data shapes used across the app so editors and reviewers get type hints.
 *
 * @module types
 */

/**
 * AI analysis of a single journal entry.
 * @typedef {Object} Analysis
 * @property {string}   reflection       Empathetic reflection of the entry.
 * @property {string[]} hidden_triggers  Inferred underlying stress triggers.
 * @property {string[]} emotions         Core emotions present.
 * @property {string}   coping_strategy  One small, tailored coping action.
 * @property {string}   encouragement    Genuine, non-toxic encouragement.
 * @property {"normal"|"elevated"|"high"} risk_level  Safety risk level.
 */

/**
 * A stored journal + mood entry.
 * @typedef {Object} Entry
 * @property {string}   id         Short unique id.
 * @property {string}   createdAt  ISO-8601 timestamp.
 * @property {number}   mood       Mood 1–5.
 * @property {string}   exam       Exam track (may be empty).
 * @property {string}   text       The journal text.
 * @property {Analysis} analysis   AI analysis of the entry.
 */

/**
 * A trigger with the average mood on the days it appeared.
 * @typedef {Object} TriggerImpact
 * @property {string} label    Trigger label.
 * @property {number} count    Times it appeared.
 * @property {number} avgMood  Average mood (1–5) when present (lower = more draining).
 */

/**
 * Aggregated insights over a user's entries.
 * @typedef {Object} Insights
 * @property {number}      totalEntries
 * @property {number|null} avgMood
 * @property {number}      streak                 Consecutive-day journaling streak.
 * @property {{label:string, delta:number}} moodTrend
 * @property {{date:string, mood:number}[]} moodSeries
 * @property {{label:string, count:number}[]} topTriggers
 * @property {{label:string, count:number}[]} topEmotions
 * @property {TriggerImpact[]} triggerImpact
 * @property {Entry[]}     recent
 */

export {};
