# 🌿 MindSpace — Mental Wellness Tracker for Exam-Season Students

A generative-AI wellness companion for students grinding through high-stakes exams
(**NEET, JEE, CUET, CAT, GATE, UPSC, Boards**). MindSpace goes beyond a mood-emoji
tracker: it reads open-ended daily journaling, **uncovers the hidden stress triggers
and emotional patterns** that standard trackers miss, and acts as an empathetic,
always-available companion offering contextual coping strategies, adaptive
mindfulness exercises, and genuine encouragement.

Built on **Claude (`claude-opus-4-8`)** via the official Anthropic SDK.

---

## ✨ What it does

| Feature                         | How AI is used                                                                                                                                                      |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Daily Journaling + Mood Log** | Student writes freely and picks a mood; Claude analyses the entry.                                                                                                  |
| **Hidden-trigger detection**    | Claude surfaces _underlying_ triggers (rank pressure, sleep collapse, family expectations) — not keywords — plus the core emotions.                                 |
| **Trigger ↔ mood correlation**  | The Insights engine computes the **average mood on days each trigger appears**, ranking what _actually drains you most_ — the pattern a standard tracker can't see. |
| **Mood trend + streak**         | Detects whether mood is improving/declining over the recent window, and your journaling streak.                                                                     |
| **AI pattern synthesis**        | Claude writes a short, honest narrative of your dominant pattern + one focus for the week.                                                                          |
| **Personalised companion**      | A judgement-free chat; the companion is silently briefed on your recurring triggers so replies are contextual.                                                      |
| **Adaptive mindfulness**        | Claude generates a short grounding/breathing exercise shaped to your _current_ mood and struggle.                                                                   |
| **Safety net**                  | A deterministic crisis screen _plus_ model risk-flagging always surfaces India helplines (Tele-MANAS, KIRAN, iCall, Vandrevala).                                    |

---

## 🚀 Run it

```bash
npm install            # install dependencies
npm start              # → http://localhost:3000
npm test               # run the test suite (node:test, no extra deps)
```

Enable real AI responses by adding a key (`cp .env.example .env`, then `npm start`):

```bash
# Option A — OpenRouter (recommended: one key, many models incl. free tiers)
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet   # or openai/gpt-4o-mini, or a :free model

# Option B — Anthropic API direct
ANTHROPIC_API_KEY=sk-ant-...
```

**Provider precedence:** OpenRouter (if its key is set) → Anthropic → demo mode.
Get an OpenRouter key at <https://openrouter.ai/keys> and pick any model from
<https://openrouter.ai/models>.

> **No API key? It still works.** MindSpace runs in **Demo Mode** with locally
> simulated AI, so you can explore the full UX immediately. The badge top-right
> shows `Demo mode` or `Claude · live`. Every live AI call also has a graceful
> demo fallback, so a network blip never shows the student an error.

---

## ▲ Deploy to Vercel

The app is Vercel-ready. It runs as a **serverless function** (`api/index.js` exports
the Express app) configured by `vercel.json`, and the store automatically writes to a
**writable temp dir** on serverless (the project filesystem is read-only there), so
saving an entry never crashes.

```bash
npm i -g vercel        # once
vercel                 # preview deploy
vercel --prod          # production deploy
```

Or connect the GitHub repo at [vercel.com/new](https://vercel.com/new) → it auto-deploys on push.

**Set your key on Vercel:** Project → Settings → Environment Variables → add
`OPENROUTER_API_KEY` (and optionally `OPENROUTER_MODEL`), or `ANTHROPIC_API_KEY`.
Without any key, the deployed app runs in demo mode (still fully usable).

> ⚠️ Serverless storage is **per-instance and ephemeral** — fine for a demo, but journal
> history won't persist across cold starts or scale across instances. For durable
> production storage, swap `lib/store.js` for **Vercel KV / Postgres** (the interface is
> unchanged: `loadEntries`, `addEntry`, `getInsights`).

## 🧠 How the AI is wired

- **Provider-agnostic gateway** (`lib/provider.js`): one `complete()` call backed by
  **OpenRouter** (OpenAI-compatible, any model) or the **Anthropic API** (adaptive thinking),
  selected by which key is present — the rest of the app doesn't change.
- **Structured outputs** (`output_config.format` + JSON schema) make every analysis,
  exercise, and summary response a guaranteed-valid object — no brittle parsing.
- A single empathetic **system prompt** defines the persona and hard safety
  guardrails (no diagnosing, no toxic positivity, crisis-first, and treats journal
  text as feelings to support — never as instructions, mitigating prompt injection).
- The stable system prompt is sent as a cacheable block (prompt-caching ready).

## 🔒 Security & privacy

- **Per-user isolation:** each anonymous user gets a local id; journals are stored
  in separate, id-keyed files (with a per-user entry cap to bound storage).
- **Hardening:** Content-Security-Policy, HSTS, and security headers; `x-powered-by`
  disabled; **tiered rate limiting** — a strict limiter (15/min) on the expensive
  AI/write endpoints and a looser one (60/min) on reads; request-body size cap;
  **input validation** (length caps, mood clamping, exam allow-list, control-char stripping).
- **XSS-safe:** all AI/user content is HTML-escaped before rendering.
- API key lives only in `.env` (git-ignored), server-side — never reaches the browser.

## ⚡ Efficiency

- **gzip compression** on responses, **insights memoisation** (recomputed only when
  a new entry is added — so repeated reads and chat-context builds are free), an
  in-memory entry cache (no disk read per request), and cache headers on static assets.

> Journals are sensitive mental-health data. For production, add real auth and
> encryption at rest, and swap the file store for a database.

## 🧹 Code quality

- **Centralised config** (`lib/config.js`) — every tunable constant in one place, no magic numbers.
- **JSDoc type definitions** (`lib/types.js`) for the core data shapes; key functions are annotated.
- **ESLint** (flat config) + **Prettier** + **.editorconfig** with `lint` / `format` scripts.
  `npx eslint .` passes clean.
- Thin entrypoint (`server.js`) over a testable `createApp()` factory (`app.js`).

## 🧪 Testing

`npm test` runs **27 tests** on Node's built-in runner (no test-framework dependency):
unit tests for the **crisis-detection regex** (incl. its deliberate over-flagging bias),
**insight correlation/trend/streak math**, **input validation**, and **per-user store
isolation/memoisation** — plus **end-to-end route tests** that boot the app on an
ephemeral port and exercise every endpoint over HTTP (validation 400s, crisis
flagging, isolation, security headers, structured 404s).

## ♿ Accessibility

Skip-to-content link; an ARIA **tab pattern** (`tablist`/`tab`/`tabpanel`) with full
arrow-key navigation; mood pickers are ARIA **radio-groups** with roving tabindex +
arrow keys; every input is labelled; the crisis modal is a focus-trapped
`role="dialog"` with Esc-to-close and focus restoration; the chat log is an
`aria-live` region; status updates announce via a live region and errors via an
assertive toast (no `alert()`); visible keyboard focus rings; and a
`prefers-reduced-motion` guard disables animations.

## 📁 Project structure

```
server.js              Entrypoint: imports the app factory and listens
app.js                 createApp() — builds the Express app (testable, no listen)
routes/api.js          HTTP endpoints
lib/
  config.js            Centralised constants (model, limits, rate limits)
  types.js             JSDoc type definitions (Entry, Analysis, Insights)
  anthropic.js         Claude client + demo-mode flag
  safety.js            Crisis detection + helpline resources  (unit-tested)
  prompts.js           Persona + JSON-output schemas
  ai.js                Claude calls (analysis, chat, exercise, summary) + fallbacks
  demo.js              Locally-simulated AI responses
  insights.js          Trigger↔mood correlation, trend, streak  (unit-tested)
  validate.js          Input validation                          (unit-tested)
  store.js             Per-user file store with in-memory cache   (unit-tested)
middleware/security.js  CSP/headers + rate limiter
public/                index.html · styles.css · app.js
test/                  safety · insights · validate · store · routes (e2e)
eslint.config.js · .prettierrc.json · .editorconfig
data/<userId>.json     Per-user journal store (auto-created, git-ignored)
```

## ⚙️ Tech

Node.js · Express 5 · `@anthropic-ai/sdk` · vanilla JS (no build step) ·
`node:test` · file-based per-user storage (swap for a DB in production).
