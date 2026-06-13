/** Pattern analytics over a student's entries. Pure, fully unit-tested.
 *
 *  Beyond simple counts, this surfaces the patterns a standard mood tracker
 *  misses: which triggers correlate with the *lowest* moods, and whether the
 *  student's mood is trending up or down.
 */

function topN(counts, n = 6) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([label, count]) => ({ label, count }));
}

/** Consecutive-day journaling streak ending at the most recent entry. */
export function computeStreak(entries) {
  if (!entries.length) return 0;
  const days = [...new Set(entries.map((e) => e.createdAt.slice(0, 10)))].sort();
  let streak = 1;
  for (let i = days.length - 1; i > 0; i--) {
    const cur = new Date(days[i]);
    const prev = new Date(days[i - 1]);
    const diff = Math.round((cur - prev) / 86_400_000);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

/** Direction of mood over the recent window (first half vs second half). */
export function computeMoodTrend(entries) {
  const recent = entries.slice(-14);
  if (recent.length < 4) return { label: "steady", delta: 0 };
  const mid = Math.floor(recent.length / 2);
  const avg = (arr) => arr.reduce((s, e) => s + e.mood, 0) / arr.length;
  const earlier = avg(recent.slice(0, mid));
  const later = avg(recent.slice(mid));
  const delta = +(later - earlier).toFixed(2);
  const label = delta >= 0.4 ? "improving" : delta <= -0.4 ? "declining" : "steady";
  return { label, delta };
}

/**
 * For each trigger, the average mood on entries where it appears, sorted so the
 * most draining triggers (lowest avg mood) come first. This is the core
 * "hidden pattern" insight.
 */
export function computeTriggerImpact(entries) {
  const buckets = {};
  for (const e of entries) {
    for (const t of e.analysis?.hidden_triggers ?? []) {
      (buckets[t] ||= []).push(e.mood);
    }
  }
  return Object.entries(buckets)
    .map(([label, moods]) => ({
      label,
      count: moods.length,
      avgMood: +(moods.reduce((s, m) => s + m, 0) / moods.length).toFixed(2),
    }))
    .filter((t) => t.count >= 1)
    .sort((a, b) => a.avgMood - b.avgMood || b.count - a.count);
}

export function computeInsights(entries = []) {
  const triggerCounts = {};
  const emotionCounts = {};
  const moodSeries = [];
  for (const e of entries) {
    moodSeries.push({ date: e.createdAt, mood: e.mood });
    for (const t of e.analysis?.hidden_triggers ?? []) triggerCounts[t] = (triggerCounts[t] || 0) + 1;
    for (const em of e.analysis?.emotions ?? []) emotionCounts[em] = (emotionCounts[em] || 0) + 1;
  }

  return {
    totalEntries: entries.length,
    avgMood: entries.length ? +(entries.reduce((s, e) => s + e.mood, 0) / entries.length).toFixed(2) : null,
    streak: computeStreak(entries),
    moodTrend: computeMoodTrend(entries),
    moodSeries: moodSeries.slice(-30),
    topTriggers: topN(triggerCounts),
    topEmotions: topN(emotionCounts),
    triggerImpact: computeTriggerImpact(entries).slice(0, 6),
    recent: entries.slice(-5).reverse(),
  };
}
