<div align="center">

# Pulse Tracker — Technical Reference

**A deep dive into the architecture, AI engineering, and security design of the Pulse Tracker platform.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?logo=openai&logoColor=white)](https://openai.com/)
[![Redis](https://img.shields.io/badge/Redis-Upstash-DC382D?logo=redis&logoColor=white)](https://upstash.com/)
[![Sentry](https://img.shields.io/badge/Sentry-Error%20Tracking-362D59?logo=sentry&logoColor=white)](https://sentry.io/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel&logoColor=white)](https://vercel.com/)

</div>

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Frontend Engineering](#2-frontend-engineering)
3. [Backend Engineering](#3-backend-engineering)
4. [Multi-Tenancy & Data Isolation](#4-multi-tenancy--data-isolation)
5. [AI Engineering — ECHO-P1](#5-ai-engineering--echo-p1)
   - [Context Router](#51-context-router--intent-classification)
   - [Guardrail Pipeline (6 Layers)](#52-guardrail-pipeline--6-layers)
   - [Tool Sandboxing & PII Scrubbing](#53-tool-sandboxing--pii-scrubbing)
   - [Token Budget Management](#54-token-budget-management)
6. [Human-in-the-Loop Monitoring](#6-human-in-the-loop-monitoring)
7. [Backend API Security](#7-backend-api-security)
8. [Infrastructure & Observability](#8-infrastructure--observability)
9. [Testing Strategy](#9-testing-strategy)

---

## 1. System Architecture

Pulse Tracker is built on the **Next.js 15 App Router** using a server-first architecture. Every data mutation and sensitive operation happens on the server — the client receives only properly-scoped, typed results.

```
┌─────────────────────────────────────────────────────────────┐
│                      VERCEL EDGE NETWORK                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │               Next.js App Router (SSR)               │   │
│  │                                                      │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │   │
│  │  │  Server     │  │  Server      │  │  API       │  │   │
│  │  │  Components │  │  Actions     │  │  Routes    │  │   │
│  │  └──────┬──────┘  └──────┬───────┘  └─────┬──────┘  │   │
│  └─────────┼────────────────┼────────────────┼─────────┘   │
│            │                │                │             │
│  ┌─────────▼────────────────▼────────────────▼─────────┐   │
│  │                   Middleware Layer                   │   │
│  │         (Auth, CSP Headers, Route Protection)       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
          │                    │                   │
          ▼                    ▼                   ▼
   ┌─────────────┐    ┌──────────────┐    ┌──────────────┐
   │  Supabase   │    │ Upstash Redis│    │  OpenAI API  │
   │ (PostgreSQL │    │ (Rate        │    │ (GPT-4o-mini │
   │  + RLS)     │    │  Limiting)   │    │  + Moderation│
   └─────────────┘    └──────────────┘    └──────────────┘
          │
   ┌─────────────┐
   │   Sentry    │
   │  (Error     │
   │  Tracking)  │
   └─────────────┘
```

**Key architectural decisions:**
- **Server Components by default** — data fetching happens on the server, minimizing client-side JavaScript and eliminating data-fetching race conditions
- **Server Actions for mutations** — form submissions and data writes go through typed, server-validated Server Actions rather than client-side `fetch` calls
- **Streaming AI responses** — the AI chat uses the Vercel AI SDK's streaming response system so tokens stream to the client in real-time without buffering

---

## 2. Frontend Engineering

### Dynamic Workout Resolution

The workout system stores structured workout templates in the database with tokenized placeholders rather than hardcoded values:

```json
{
  "segment": "Back Squat",
  "target": {
    "percent_1rm": 0.70,
    "sets": 3,
    "reps": 8
  }
}
```

At render time, the frontend resolves these tokens against the user's current PRs stored in their profile:

```typescript
// From src/lib/calculations/percentages.ts
calculateWorkingSet(exerciseName, percentOf1RM, userProfile)
// → { weight: 245, isEstimate: false }
```

This means the same program data outputs different targets for every user based on their individual benchmarks — no manual recalculation required.

### Analytics Dashboard

The analytics page (`src/app/(dashboard)/analytics/`) renders multiple data visualizations.

All chart data is fetched via Server Actions in `actions.ts`, which enforce the authenticated user context before querying.

### UI Tech Stack
- **Vanilla CSS** — custom CSS variables, responsive grid layouts, no framework overhead
- **Framer Motion** — page transitions and element entrance animations
- **No external chart library** — all charts are custom SVG for full design control and minimal bundle size

---

## 3. Backend Engineering

### Next.js App Router API Routes

Protected API routes live under `src/app/api/`. Each route independently validates:

1. **Authentication** — Supabase `getUser()` called on every request
2. **Input Validation** — Zod schemas enforce type and value bounds before any processing
3. **Rate Limiting** — Upstash Redis `@upstash/ratelimit` enforces per-user request caps

### Server Actions

Data mutations (logging workouts, saving biometrics, updating profile) use Next.js Server Actions defined in `src/app/actions/`. These run exclusively on the server, receive the authenticated user context, and use the Supabase server client with full RLS enforcement.

### Input Validation (Zod)

Every API surface has explicit Zod schemas. The chat endpoint schema (`chatRequestSchema`) validates:
- Message array structure and content types
- String length bounds (prevents oversized payloads)
- User configuration fields (week/phase numbers, day of week)

Validation errors return structured 400 responses — no raw error messages are exposed to the client.

---

## 4. Multi-Tenancy & Data Isolation

Every table in the Supabase database has **Row Level Security (RLS)** policies enforced at the database level. This means even if application code has a bug or the wrong user ID is passed, the database engine itself will reject the query.

```sql
-- Example RLS policy on the logs table
CREATE POLICY "Users can only view their own logs"
  ON logs FOR SELECT
  USING (auth.uid() = user_id);
```

**Why this matters:** In a serverless environment, RLS is the last line of defense. If an API route is misconfigured, if a cached server function executes with stale context, or if a dependency has a vulnerability — the database will still enforce isolation. No user can ever read another user's training data.

**The AI coach respects RLS automatically.** Every Supabase client created inside an AI tool call is a server client that inherits the authenticated user's JWT, meaning the AI can only query rows that belong to the current user — by database enforcement, not just application logic.

---

## 5. AI Engineering — ECHO-P1

ECHO-P1 is the AI coaching assistant built into Pulse Tracker. It is scoped exclusively to fitness-related conversations and enforces a layered safety architecture before, during, and after each AI response.

### 5.1 Context Router & Intent Classification

Before building the prompt, the system classifies the user's intent using keyword scoring and conversation carry-over logic:

```typescript
type IntentType = 'INJURY' | 'PROGRESS' | 'LOGISTICS' | 'GENERAL'
```

| Intent | Trigger | Context Injected | Tools Enabled |
| :--- | :--- | :--- | :--- |
| **INJURY** | Pain/modification keywords | Urgent injury protocol + current week | `getRecentLogs` |
| **LOGISTICS** | Today/schedule/workout keywords | Full today's workout (resolved targets) | None (context-only) |
| **PROGRESS** | History/stats/PR keywords | Tool schema and query instructions | 7 tools (full data access) |
| **GENERAL** | Default fallback | Phase overview | `getBiometrics` |

The router also detects **follow-up questions** — if a short message like "why?" follows a PROGRESS question, it inherits the PROGRESS intent rather than defaulting to GENERAL, preserving conversational continuity.

### 5.2 Guardrail Pipeline — 6 Layers

Every user message passes through all 6 layers sequentially before reaching the LLM. A block at any layer returns a controlled response immediately.

---

#### Layer 1 — Prompt Injection Detection

Pattern-matched against 16 carefully designed regex patterns targeting known jailbreak techniques:

```typescript
/ignore\s+(previous|all|your|the|my)\s+(instructions|rules|guidelines)/i,
/you\s+are\s+now\s+(a|in|unlocked|jailbroken)/i,
/pretend\s+(you\s+are|to\s+be)\s+(a|an)/i,
/\[system\]/i,
/###\s*(system|admin|override)\s*###/i,
/reveal\s+(your|the)\s+(system|original|initial)\s+(prompt|instructions)/i,
// + 10 more patterns
```

**Why regex first?** It's synchronous, near-zero latency, and catches the most common structural injection formats before spending any compute on downstream checks.

---

#### Layer 2 — Topic Guardrails (20+ Categories)

A priority-ordered keyword matching system with responses tailored to each sensitive topic. Categories cover:

| Category | Priority | Response Behavior |
| :--- | :--- | :--- |
| System extraction attempts | 200 (highest) | Hard refusal |
| API key / credential requests | 190 | Hard refusal |
| Database schema extraction | 180 | Hard refusal |
| PII extraction (other users' data) | 170 | Hard refusal + privacy statement |
| Mental health crisis | 160 | 988 Lifeline referral |
| Eating disorder indicators | 150 | NEDA helpline referral |
| Dangerous exercise practices | 140 | Safety warning |
| Extreme weight cutting | 130 | Medical referral |
| PEDs / banned substances | 120 | Hard refusal |
| Medical diagnosis requests | 110 | Healthcare professional referral |
| Nutrition / diet advice | 100 | Dietitian referral |
| Explicit content | 90 | Scope redirect |
| Illegal activities | 85 | Hard refusal |
| Off-topic tech / finance | 75 | Scope redirect |
| Off-topic sports questions | 70 | Scope redirect |
| Relationship personal questions | 65 | Scope redirect |

**Ambiguous keyword handling:** Keywords like `cut`, `fasting`, or `lean` that are legitimate in fitness contexts are only blocked when they appear *without* accompanying fitness context keywords — preventing false positives on phrases like "cutting weight for competition."

---

#### Layer 3 — Fuzzy Keyword Matching (Levenshtein Distance)

Guardrails catch correctly-spelled keywords, but an adversarial user might typo words intentionally to bypass them. The system uses Levenshtein distance to catch near-misses:

```typescript
function levenshteinDistance(a: string, b: string): number { ... }

// Tolerance scales with word length:
// 4-5 char keywords: exact match only (avoid "last"→"fast" false positives)
// 6-7 char keywords: 1 typo allowed
// 8+ char keywords: 2 typos allowed
```

Example: `steriods` (intentional misspelling) is caught and routed to the PED guardrail response.

---

#### Layer 4 — OpenAI Moderation API

The OpenAI Moderation API is called asynchronously with a 2-second timeout. It performs semantic analysis for harmful content categories that rule-based matching would miss:

- Harassment and hate speech
- Violence and graphic content
- Self-harm content
- Sexual content

**Fail-open design:** If the Moderation API times out or returns an error, the request continues to Layer 5. This prevents the API latency of an external service from degrading the user experience.

---

#### Layer 5 — Semantic Intent Classifier

A fast GPT-4o-mini call determines whether the message is genuinely fitness-related. Unlike keyword matching, this layer understands *meaning*:

```
"what's the capital of France?" → classified as OFF_TOPIC (geography)
"how do I improve my running economy?" → classified as FITNESS_RELATED
"can you help me with my Python script?" → classified as OFF_TOPIC (coding)
```

The classifier uses a 1.5-second timeout and fails open — if the classifier doesn't respond in time, the message is allowed through to the LLM (which has its own system prompt guardrails as a final backstop).

**Why a separate classifier call?** It is significantly more accurate than any keyword list for detecting disguised off-topic requests phrased in fitness-adjacent language.

---

#### Layer 6 — Output Validation & Filtering

After the LLM generates a response, the text is validated before delivery to the user. This catches cases where the LLM itself produces problematic output:

**PII Detection Patterns:**
- US phone numbers (various formats)
- Email addresses
- Social Security Numbers
- Credit card numbers
- IP addresses
- Street addresses

**Credential / Secret Detection:**
- OpenAI API keys (`sk-...`)
- Generic API key patterns
- Bearer tokens and JWTs
- Connection strings (postgres://, redis://)
- AWS access keys
- Supabase keys (`sbp_...`)

**System Prompt Leakage Detection:**
- References to "system prompt", "my instructions", "my programming"
- XML tag patterns from the system prompt structure
- Phrases like "I must follow" or "I am programmed to"

**Severity handling:**
- `critical` severity (credentials, SSNs) → response replaced entirely with a fallback
- `high` severity (PII, system leak) → response replaced
- `low` severity (markdown formatting violations) → response sanitized in place

---

### 5.3 Tool Sandboxing & PII Scrubbing

The AI has access to 8 tools that query the database. Every tool enforces the following:

**Explicit field selection:** Tools never do `SELECT *`. Every query specifies exactly which columns are returned:

```typescript
supabase
  .from('logs')
  .select('date, day_name, segment_name, segment_type, performance_data, week_number')
  // ↑ Explicitly excludes: id, user_id, session_id, created_at, updated_at
```

**PII sanitization before LLM exposure:** Even returned fields are passed through a sanitizer before being included in the AI's context:

```typescript
function sanitizeLogForAI(log) {
  return {
    date: log.date,
    day: log.day_name,
    segment: log.segment_name,
    type: log.segment_type,
    data: sanitizePerformanceData(log.performance_data),
    week: log.week_number,
    // Explicitly excluded: id, user_id, session_id, created_at
  };
}
```

**Result:** The LLM only ever sees anonymized training data — never user IDs, internal IDs, timestamps, or any other metadata that could identify the user or expose system internals.

**RLS enforced inside tools:** Each tool call creates a fresh Supabase server client. Since the user's JWT is present in the request context, RLS policies apply automatically — the AI literally cannot query another user's data, even if instructed to.

---

### 5.4 Token Budget Management

Context is expensive. The system dynamically allocates a token budget based on intent:

| Intent | Token Budget | Why |
| :--- | :--- | :--- |
| INJURY | 1,500 | Needs today's workout for modification suggestions |
| PROGRESS | 1,000 | Tool results provide the bulk of context dynamically |
| LOGISTICS | 800 | Only today's resolved workout needed |
| GENERAL | 600 | Phase overview only |

Context that exceeds the budget is truncated at token boundaries (not character boundaries) to avoid cutting mid-word. This reduces average token usage per request by ~80% compared to sending the full 52-week program on every call.

---

## 6. Human-in-the-Loop Monitoring

### Admin Diagnostic Terminal

A private admin dashboard at `/admin/ai-coach` provides real-time visibility into ECHO-P1's behavior. Access is gated at both the client and API level — non-admin users are immediately redirected.

**Dashboard Panels:**

| Panel | What It Shows |
| :--- | :--- |
| **User Sentiment** | Thumbs up/down satisfaction rate across all interactions |
| **Failure Audit Console** | Expandable log of every negatively-rated response, showing the user message, AI response, detected intent, tools used, and latency |
| **Cognitive Integrity Heatmap** | Per-intent success rate (INJURY / PROGRESS / LOGISTICS / GENERAL) with visual pass/fail bars |
| **Cost & Token Tracking** | Total tokens consumed, estimated API cost in USD, and per-request averages |
| **Tactical Tool Load** | Which tools are called most frequently |
| **Normalization Engine** | Live log of exercise typo corrections (e.g., `"benchpress"` → `BENCH PRESS`) |
| **Power Users** | Top users by request volume, shown as truncated UUIDs only |

**Privacy design of the admin view:** Users are identified only by the first 8 characters of their UUID — no names, emails, or other identifiers are exposed in the dashboard. The user messages and AI responses shown in the Failure Audit Console are retrieved directly from the `ai_logs` table, which stores only truncated content (capped at 1,000 characters).

### AI Interaction Telemetry (`ai_logs`)

Every chat request — successful or blocked — is logged to a `ai_logs` Supabase table. The schema captures:

```typescript
{
  user_id: string,            // Supabase auth UUID (RLS-protected)
  message_id: string,         // Unique request identifier
  model_id: string,           // e.g., 'gpt-4o-mini'
  prompt_tokens: number,
  completion_tokens: number,
  total_tokens: number,
  estimated_cost_usd: number, // Calculated from OpenAI pricing table
  latency_ms: number,
  intent: string,             // INJURY | PROGRESS | LOGISTICS | GENERAL | GUARDRAIL
  tools_used: string[],       // Names of tools called
  user_message: string,       // Truncated to 1,000 chars
  ai_response: string,        // Truncated to 1,000 chars
  status: 'success' | 'refusal',
  metadata: object            // Tool result summaries
}
```

This table is RLS-protected — users cannot query other users' logs, and the admin API route validates the `is_admin` flag from the user's profile before returning any aggregate data.

### Sentry Integration

Sentry is used for two distinct purposes in the AI pipeline:

**1. Output filter alerts:** When the post-generation output validator detects a `critical` or `high` severity issue (credentials, PII, system prompt leakage), Sentry is immediately notified:

```typescript
Sentry.captureMessage(`[Output Filter] ${severity.toUpperCase()} severity issue detected`, {
  level: severity === 'critical' ? 'error' : 'warning',
  tags: { 'output_filter.severity': severity },
  extra: {
    issues: [...],      // Issue types only — no sensitive match content logged
    userId,
    responseLength,
    responsePreview: text.substring(0, 100),  // First 100 chars only
  },
});
```

Notably, the actual sensitive match (e.g., the detected credential string) is **never sent to Sentry** — only the issue type, severity, and a safe preview. This prevents secrets from leaking into the error tracking system.

**2. Exception capture:** All unhandled errors in the chat route are caught and forwarded to Sentry for debugging, with internal details withheld from API responses.

---

## 7. Backend API Security

### Middleware Layer

`src/middleware.ts` runs on every request before it reaches any route handler:

- **Session Validation** — Refreshes and validates the Supabase session on each request
- **Route Protection** — Dashboard routes redirect unauthenticated users to `/login`
- **CSP Headers** — A strict Content-Security-Policy is generated with a per-request nonce:

```
default-src 'self';
script-src 'self' 'nonce-{request-nonce}' 'strict-dynamic';
img-src 'self' data: blob: https:;
object-src 'none';
frame-ancestors 'none';
```

### Rate Limiting

The AI chat endpoint is rate-limited using Upstash Redis, which is serverless-compatible (no in-memory state that resets on cold boots):

```typescript
import { Ratelimit } from '@upstash/ratelimit';

// 20 requests per minute per user IP
const RATE_LIMIT = RATE_LIMITS.CHAT; // { requests: 20, window: '1m' }
```

Auth endpoints (login, signup, password reset) have separate, stricter rate limits to prevent brute-force attacks.

### Input Validation

All inputs are validated with Zod before any processing:

```typescript
const chatRequestSchema = z.object({
  messages: z.array(messageSchema),
  currentWeek: z.number().int().min(1).max(52),
  currentPhase: z.number().int().min(1).max(5),
  userDay: z.string().optional(),
  settings: userSettingsSchema.optional(),
});
```

Malformed payloads return a 400 with a generic error message — no internal schema details are leaked.

### Error Handling

Production errors are captured by Sentry with automatic PII masking. Internal stack traces are never returned to clients — the API always returns a safe, generic error message while the full context is available in Sentry for debugging.

---

## 8. Infrastructure & Observability

| Concern | Solution |
| :--- | :--- |
| **Deployment** | Vercel (automatic preview deployments per PR) |
| **Database** | Supabase (managed PostgreSQL, edge functions available) |
| **Rate Limiting** | Upstash Redis (serverless-compatible) |
| **Error Tracking** | Sentry (with source maps for readable stack traces) |
| **CI/CD** | GitHub Actions (lint → type-check → test → build → deploy) |
| **Security Scanning** | Gitleaks (secret scanning in CI), `npm audit` |

---

## 9. Testing Strategy

### Unit Tests (Vitest)

```bash
npm run test
```

Covers: pace zone calculations, workout template resolution, validation logic, AI tool output sanitization, and rate limiting behavior.

### End-to-End Tests (Playwright)

```bash
npm run test:e2e
```

Full browser automation tests for: auth flows (login, signup, Google OAuth), onboarding, workout logging, and navigation.

### LLM Evaluation Suite (Promptfoo)

```bash
npx promptfoo eval
```

A dedicated suite of adversarial prompts tested against the AI guardrail system. Tests are organized into categories:

| Test Set | What It Tests |
| :--- | :--- |
| **Safety — Enabled Guardrails** | Injection attempts, jailbreaks, crisis content, PED requests, off-topic tech/finance |
| **Safety — Privacy** | PII extraction, other users' data requests, credential extraction |
| **Accuracy** | Correct tool selection, PR lookups, compliance questions |
| **Scope Adherence** | Off-topic questions, nutrition, medical diagnosis |

Every deployment should pass all promptfoo evaluations before merging to main.
