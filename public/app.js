/* MindSpace front-end logic ------------------------------------------------ */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

/* --- Anonymous per-user id (privacy isolation, no login needed) ----------- */
function getUserId() {
  let id = localStorage.getItem("mindspace_uid");
  if (!id) {
    id = (
      crypto.randomUUID?.() || "u" + Date.now().toString(36) + Math.random().toString(36).slice(2)
    ).replace(/-/g, "");
    localStorage.setItem("mindspace_uid", id);
  }
  return id;
}

/** fetch wrapper that always attaches the user id + JSON headers. */
async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json", "x-user-id": getUserId() },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

const state = {
  mood: 3,
  exMood: 2,
  chat: [
    {
      role: "assistant",
      content:
        "Hi, I'm really glad you're here. Whatever today has been like — heavy, scattered, or just tiring — you can put it down here. What's on your mind?",
    },
  ],
};

/* --- Status announcements (screen-reader) + error toast -------------------- */
function announce(msg) {
  $("#status").textContent = msg;
}
let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add("hidden"), 5000);
}

/* --- Tabs (ARIA tab pattern + arrow-key navigation) ------------------------ */
const tabs = [...$$(".tab")];
function selectTab(tab, focus = false) {
  tabs.forEach((t) => {
    const on = t === tab;
    t.classList.toggle("active", on);
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
  });
  $$(".panel").forEach((p) => p.classList.remove("active"));
  $("#" + tab.dataset.tab).classList.add("active");
  if (focus) tab.focus();
  if (tab.dataset.tab === "insights") loadInsights();
}
tabs.forEach((tab, i) => {
  tab.addEventListener("click", () => selectTab(tab));
  tab.addEventListener("keydown", (e) => {
    let next = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = tabs[(i + 1) % tabs.length];
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = tabs[(i - 1 + tabs.length) % tabs.length];
    else if (e.key === "Home") next = tabs[0];
    else if (e.key === "End") next = tabs[tabs.length - 1];
    if (next) {
      e.preventDefault();
      selectTab(next, true);
    }
  });
});

/* --- Mood selectors: ARIA radiogroup w/ roving tabindex + arrow keys ------- */
function wireMood(containerSel, key) {
  const btns = [...$$(`${containerSel} button`)];
  const select = (b, focus = false) => {
    btns.forEach((x) => {
      const on = x === b;
      x.classList.toggle("selected", on);
      x.setAttribute("aria-checked", String(on));
      x.tabIndex = on ? 0 : -1;
    });
    state[key] = Number(b.dataset.mood);
    if (focus) b.focus();
  };
  btns.forEach((b, i) => {
    b.tabIndex = b.getAttribute("aria-checked") === "true" ? 0 : -1;
    b.addEventListener("click", () => select(b));
    b.addEventListener("keydown", (e) => {
      let next = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next = btns[(i + 1) % btns.length];
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = btns[(i - 1 + btns.length) % btns.length];
      if (next) {
        e.preventDefault();
        select(next, true);
      }
    });
  });
}
wireMood("#mood", "mood");
wireMood("#ex-mood", "exMood");

/* --- Health / mode pill ---------------------------------------------------- */
(async () => {
  try {
    const d = await api("/api/health");
    const pill = $("#mode-pill");
    if (d.demo) {
      pill.textContent = "Demo mode";
      pill.className = "pill demo";
    } else {
      pill.textContent = d.provider === "openrouter" ? "Live · OpenRouter" : "Live · Claude";
      pill.title = `Model: ${d.model}`;
      pill.className = "pill live";
    }
  } catch {
    $("#mode-pill").textContent = "offline";
  }
})();

/* --- Crisis modal (focus-trapped, Esc to close) ---------------------------- */
let lastFocused = null;
function showCrisis(resources) {
  if (!resources) return;
  $("#crisis-message").textContent = resources.message;
  $("#crisis-note").textContent = resources.note;
  const ul = $("#crisis-helplines");
  ul.innerHTML = "";
  resources.helplines.forEach((h) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${escapeHtml(h.name)}</strong>${escapeHtml(h.contact)}`;
    ul.appendChild(li);
  });
  lastFocused = document.activeElement;
  $("#crisis-modal").classList.remove("hidden");
  $("#crisis-close").focus();
}
function closeCrisis() {
  $("#crisis-modal").classList.add("hidden");
  if (lastFocused) lastFocused.focus();
}
$("#crisis-close").addEventListener("click", closeCrisis);
$("#crisis-modal").addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeCrisis();
  if (e.key === "Tab") {
    // simple focus trap — only one focusable element, so keep focus on it
    e.preventDefault();
    $("#crisis-close").focus();
  }
});

/* --- Journal --------------------------------------------------------------- */
$("#save-journal").addEventListener("click", async () => {
  const text = $("#journal-text").value.trim();
  if (!text) {
    $("#journal-text").focus();
    return;
  }
  const btn = $("#save-journal");
  btn.disabled = true;
  btn.textContent = "Reflecting…";
  try {
    const d = await api("/api/journal", {
      method: "POST",
      body: { text, mood: state.mood, exam: $("#exam").value },
    });
    renderAnalysis(d.entry.analysis);
    announce("Your reflection is ready below.");
    if (d.crisis) showCrisis(d.resources);
    $("#journal-text").value = "";
  } catch (e) {
    toast("Sorry, something went wrong: " + e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Reflect with my companion";
  }
});

function renderAnalysis(a) {
  const el = $("#analysis");
  el.classList.remove("hidden");
  el.innerHTML = `
    <p class="reflection">"${escapeHtml(a.reflection)}"</p>
    <h4>Hidden stress triggers</h4>
    <div class="chips">${a.hidden_triggers.map((t) => `<span class="chip">${escapeHtml(t)}</span>`).join("")}</div>
    <h4>What you might be feeling</h4>
    <div class="chips">${a.emotions.map((e) => `<span class="chip emotion">${escapeHtml(e)}</span>`).join("")}</div>
    <h4>A small thing to try</h4>
    <div class="box">${escapeHtml(a.coping_strategy)}</div>
    <h4>From your companion</h4>
    <div class="box encourage">${escapeHtml(a.encouragement)}</div>
  `;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* --- Companion chat -------------------------------------------------------- */
$("#chat-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = $("#chat-text");
  const msg = input.value.trim();
  if (!msg) return;
  input.value = "";
  state.chat.push({ role: "user", content: msg });
  appendBubble("user", msg);
  const typing = appendBubble("bot typing", "…");
  try {
    const d = await api("/api/chat", { method: "POST", body: { messages: state.chat } });
    typing.remove();
    state.chat.push({ role: "assistant", content: d.reply });
    appendBubble("bot", d.reply);
    if (d.crisis) showCrisis(d.resources);
  } catch {
    typing.remove();
    appendBubble("bot", "I'm having trouble responding right now, but I'm still here with you.");
  }
});

function appendBubble(cls, text) {
  const div = document.createElement("div");
  div.className = "bubble " + cls;
  div.textContent = text;
  const log = $("#chat-log");
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
  return div;
}

/* --- Exercise -------------------------------------------------------------- */
$("#get-exercise").addEventListener("click", async () => {
  const btn = $("#get-exercise");
  btn.disabled = true;
  btn.textContent = "Shaping it…";
  try {
    const d = await api("/api/exercise", {
      method: "POST",
      body: { mood: state.exMood, note: $("#ex-note").value },
    });
    renderExercise(d.exercise);
    announce("Your exercise is ready below.");
  } catch {
    toast("Could not generate an exercise right now.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Give me an exercise";
  }
});

function renderExercise(ex) {
  const el = $("#exercise");
  el.classList.remove("hidden");
  el.innerHTML = `
    <h3>${escapeHtml(ex.title)}</h3>
    <div class="dur">${escapeHtml(ex.duration)}</div>
    <p class="why">${escapeHtml(ex.why)}</p>
    <ol>${ex.steps.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ol>
    <p class="closing">${escapeHtml(ex.closing)}</p>
  `;
  el.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/* --- Insights -------------------------------------------------------------- */
const moodFaces = ["", "😞", "😟", "😐", "🙂", "😄"];

async function loadInsights() {
  const body = $("#insights-body");
  const summaryEl = $("#ai-summary");
  try {
    const d = await api("/api/insights");
    if (!d.totalEntries) {
      summaryEl.classList.add("hidden");
      body.innerHTML = `<p class="muted">No entries yet. Your patterns will appear here once you start journaling.</p>`;
      return;
    }

    const maxT = Math.max(...d.topTriggers.map((t) => t.count), 1);
    const maxE = Math.max(...d.topEmotions.map((e) => e.count), 1);
    const trendArrow = { improving: "↗", declining: "↘", steady: "→" }[d.moodTrend.label] || "→";

    body.innerHTML = `
      <div class="stat-row">
        <div class="stat"><div class="num">${d.totalEntries}</div><div class="lbl">entries</div></div>
        <div class="stat"><div class="num">${d.avgMood.toFixed(1)}/5 ${moodFaces[Math.round(d.avgMood)] || ""}</div><div class="lbl">average mood</div></div>
        <div class="stat"><div class="num">${d.streak}🔥</div><div class="lbl">day streak</div></div>
        <div class="stat"><div class="num">${trendArrow}</div><div class="lbl">mood ${escapeHtml(d.moodTrend.label)}</div></div>
      </div>

      <h4 style="margin-top:24px">Mood over your last entries</h4>
      <div class="sparkline">
        ${d.moodSeries.map((m) => `<div class="spark" style="height:${(m.mood / 5) * 100}%" title="${moodFaces[m.mood]}"></div>`).join("")}
      </div>

      <h4 style="margin-top:24px">What drains you most</h4>
      <p class="muted small">Average mood on days each trigger appears — lower means it weighs on you more.</p>
      ${d.triggerImpact
        .map((t) => {
          const pct = (t.avgMood / 5) * 100;
          const tone = t.avgMood <= 2 ? "low" : t.avgMood >= 4 ? "high" : "";
          return `<div class="bar-item">
            <div class="bar-top"><span>${escapeHtml(t.label)}</span><span>${t.avgMood.toFixed(1)}/5 · ${t.count}×</span></div>
            <div class="bar-track"><div class="bar-fill ${tone}" style="width:${pct}%"></div></div>
          </div>`;
        })
        .join("")}

      <div class="insights-grid">
        <div>
          <h4>Recurring triggers</h4>
          ${d.topTriggers
            .map(
              (t) => `<div class="bar-item">
                <div class="bar-top"><span>${escapeHtml(t.label)}</span><span>${t.count}</span></div>
                <div class="bar-track"><div class="bar-fill" style="width:${(t.count / maxT) * 100}%"></div></div>
              </div>`
            )
            .join("")}
        </div>
        <div>
          <h4>Recurring emotions</h4>
          ${d.topEmotions
            .map(
              (e) => `<div class="bar-item">
                <div class="bar-top"><span>${escapeHtml(e.label)}</span><span>${e.count}</span></div>
                <div class="bar-track"><div class="bar-fill sage" style="width:${(e.count / maxE) * 100}%"></div></div>
              </div>`
            )
            .join("")}
        </div>
      </div>

      <h4 style="margin-top:24px">Recent reflections</h4>
      ${d.recent
        .map(
          (e) => `<div class="recent-entry">
            <div class="date">${new Date(e.createdAt).toLocaleString()} · ${moodFaces[e.mood]} ${e.exam ? "· " + escapeHtml(e.exam) : ""}</div>
            <div>${escapeHtml((e.text || "").slice(0, 140))}${e.text.length > 140 ? "…" : ""}</div>
          </div>`
        )
        .join("")}
    `;

    // AI-written pattern synthesis (loads after the dashboard).
    summaryEl.classList.remove("hidden");
    summaryEl.innerHTML = `<div class="ai-summary-loading">Reading your patterns…</div>`;
    try {
      const s = await api("/api/insights/summary");
      if (s.summary) {
        summaryEl.innerHTML = `
          <div class="ai-summary-tag">Your companion noticed</div>
          <p class="ai-summary-head">${escapeHtml(s.summary.headline)}</p>
          <p>${escapeHtml(s.summary.pattern)}</p>
          <div class="ai-summary-focus"><strong>This week:</strong> ${escapeHtml(s.summary.focus)}</div>
        `;
      } else {
        summaryEl.classList.add("hidden");
      }
    } catch {
      summaryEl.classList.add("hidden");
    }
  } catch {
    summaryEl.classList.add("hidden");
    body.innerHTML = `<p class="muted">Could not load insights right now.</p>`;
  }
}

/* --- util ------------------------------------------------------------------ */
function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
