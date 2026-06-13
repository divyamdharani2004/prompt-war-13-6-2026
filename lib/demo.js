/** Locally-simulated AI responses used when no API key is present (DEMO MODE),
 *  and as a graceful fallback if any live model call fails. Pure functions. */

import { screenForCrisis } from "./safety.js";

export function demoAnalysis(text, mood) {
  const lc = String(text).toLowerCase();
  const triggers = [];
  const add = (kw, label) => kw.some((k) => lc.includes(k)) && triggers.push(label);
  add(["mock", "test", "exam", "paper", "result"], "Mock-test / exam performance");
  add(["sleep", "tired", "awake", "insomnia", "exhaust"], "Sleep & exhaustion");
  add(["rank", "topper", "everyone", "compare", "behind", "ahead"], "Comparison & rank pressure");
  add(["parent", "family", "father", "mother", "expect"], "Family expectations");
  add(["time", "syllabus", "cover", "left", "backlog"], "Time / syllabus pressure");
  add(["alone", "lonely", "no one"], "Isolation");
  if (triggers.length === 0) triggers.push("General study stress");

  const emotions =
    mood <= 2
      ? ["overwhelm", "self-doubt", "fatigue"]
      : mood === 3
      ? ["restlessness", "uncertainty"]
      : ["determination", "mild anxiety"];

  return {
    reflection:
      "I hear how much you're carrying right now. What you wrote isn't 'overreacting' — it's the weight of " +
      "doing something genuinely hard, day after day. Naming it the way you just did is itself a strong step.",
    hidden_triggers: triggers,
    emotions,
    coping_strategy:
      "Try a 'one-block' reset: pick the single next 25-minute task, close everything else, and tell yourself you " +
      "only owe these 25 minutes — nothing beyond them. After the block, stand up and take 5 slow breaths before deciding what's next.",
    encouragement:
      "You don't have to win the whole year today. You just have to show up for the next small thing — and you already are.",
    risk_level: screenForCrisis(text) ? "high" : mood <= 1 ? "elevated" : "normal",
  };
}

export function demoChat(message) {
  if (screenForCrisis(message)) {
    return (
      "I'm really glad you told me this, and I want you to know you matter. " +
      "What you're feeling right now is heavy, but you don't have to face it alone — please reach out to someone you " +
      "trust and one of the helplines shown here, right now. I'm staying right here with you."
    );
  }
  return (
    "That sounds genuinely draining, and it makes sense you'd feel this way given everything you're balancing. " +
    "Let's make the next step smaller than the mountain in your head: what's the one task that, if you finished just that, " +
    "would let you breathe a little easier tonight? We can start there — together."
  );
}

export function demoExercise(mood) {
  const low = mood <= 2;
  return {
    title: low ? "Grounding: 5-4-3-2-1" : "Reset breath: Box breathing",
    duration: "3 minutes",
    why: low
      ? "Picked because your mood is low and a short sensory anchor can interrupt the spiral faster than trying to 'think' your way calm."
      : "A steady breathing rhythm to settle a busy, slightly anxious mind before you get back to studying.",
    steps: low
      ? [
          "Name 5 things you can see around you, slowly.",
          "Name 4 things you can physically feel (chair, feet, air).",
          "Name 3 things you can hear.",
          "Name 2 things you can smell (or like the smell of).",
          "Take 1 slow breath — in for 4, out for 6.",
        ]
      : [
          "Breathe in through your nose for 4 counts.",
          "Hold gently for 4 counts.",
          "Breathe out slowly for 4 counts.",
          "Hold empty for 4 counts.",
          "Repeat for 6 rounds, letting your shoulders drop each time.",
        ],
    closing:
      "When you're done, you don't have to feel 'fixed' — just one notch steadier is enough to take the next step.",
  };
}

export function demoSummary(insights) {
  const trigger = insights.triggerImpact?.[0];
  const trend = insights.moodTrend?.label ?? "steady";
  return {
    headline: trigger
      ? `"${trigger.label}" keeps weighing on you the most.`
      : "Your reflections are building a clearer picture.",
    pattern: trigger
      ? `Across your entries, "${trigger.label}" shows up often, and your mood averages ${trigger.avgMood.toFixed(
          1
        )}/5 on the days you mention it. Your overall mood has been ${trend} recently.`
      : `Your mood has been ${trend} recently. Keep journaling — patterns get clearer with a few more entries.`,
    focus: trigger
      ? `This week, when "${trigger.label}" comes up, pause and write one line about what specifically triggered it. Naming the precise moment makes it smaller.`
      : "Keep showing up to journal daily — even two lines. Consistency is what reveals the patterns worth acting on.",
  };
}
