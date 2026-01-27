# Production Readiness Audit Report for Pulse

## 1. Executive Summary
**Current Grade: B+**

The `pulse-v4` codebase is in an **Advanced MVP** state. It demonstrates high architectural maturity with strong foundational practices (Type Safety, CI/CD, Modular Design). It is significantly ahead of a "prototype" but lacks specific infrastructure components required for robust, scalable production usage.

**Strengths:**
- **Code Quality**: Strict TypeScript usage, central type definitions (`types.ts`), and modern React patterns.
- **CI/CD**: A fully configured GitHub Action (`deploy.yml`) covering linting, type checking, security scanning (Gitleaks/Audit), and Vercel deployments.
- **Security**: "Defense in Depth" strategy in API routes (Rate limiting, Input Validation via Zod, Prompt Injection Detection).

**Critical Gaps (The "Last Mile"):**
- **Observability**: Currently relies on `console.log`. No centralized logging or error tracking (e.g., Sentry) is implemented.
- **State Persistence**: The Rate Limiting implementation is in-memory (`new Map`), which will fail in a Serverless/Edge environment (Next.js/Vercel) as state is not shared between lambda instances.
- **Resilience**: Lack of structured retry mechanisms for 3rd party APIs (Supabase/OpenAI) beyond basic error catching.
- **Cost/Scaling Optimization**: Implemented dynamic context slicing for the AI System Prompt. Instead of sending the full "Master Plan" (5k+ tokens) on every request, we now intelligently extract only the relevant "Phase" context, reducing token usage by ~80% per request and preventing quota exhaustion.

---

## 2. Roadmap to Production

To transition from MVP to Production Candidate (Release 1.0), the following actions are required.

### A. ADDITIONS (New Features/Infrastructure)
1.  **Structured Logging & Error Tracking**
    *   **Requirement**: Integrate **Sentry** or **LogRocket**.
    *   **Why**: `console.error` is insufficient for diagnosing issues in user production environments. We need stack traces, breadcrumbs, and user context.
    *   **Action**: Install `@sentry/nextjs` and configure `next.config.mjs` + Middleware.

2.  **Persistent Rate Limiting**
    *   **Requirement**: Migrate from In-Memory Map to **Redis (Upstash)**.
    *   **Why**: The current `rateLimitMap` in `api/chat/route.ts` resets every time the serverless function cold boots. It offers zero protection against distributed attacks or high-traffic bursts in a serverless environment.
    *   **Action**: Integrate `@upstash/ratelimit`.

3.  **Database Migration Pipeline**
    *   **Requirement**: Formalized SQL Migration workflow.
    *   **Why**: While Supabase handles the DB, we need a tracked history of schema changes in the repo (currently relying on direct dashboard edits or untracked queries).
    *   **Action**: Initialize `supabase` CLI and pull remote schema to `supabase/migrations`.

### B. MODIFICATIONS (Refinements)
1.  **Environment Variable Hardening**
    *   **Current**: `NEXT_PUBLIC_SUPABASE_ANON_KEY` is exposed (normal), but we need to ensure Service Role keys are strictly managed in CI secrets (verified in `deploy.yml`, but needs double-check in Vercel project settings).
    *   **Action**: Audit Vercel Environment Variables.

2.  **Auth & Middleware Optimization**
    *   **Current**: `middleware.ts` handles Guest/User logic.
    *   **Refinement**: Ensure the "Guest Mode" (`0000...01` ID) doesn't pollute production metrics. Add a `is_demo` flag to Analytics events.

### C. DELETIONS (Cleanup)
1.  **Unused "Test" Files**
    *   **Target**: `tests/setup.ts` (if not strictly used by Vitest config) or any temporary scratchpad files.
    *   **Action**: Strict cleanup of `console.log` debug statements in `userSettingsServer.ts` ("Got settings...").

---

## 3. Implementation Plan

### Phase 1: Infrastructure (Priority: High)
- [ ] Install & Configure Sentry.
- [ ] Set up Upstash Redis.
- [ ] Rewrite `checkRateLimit` in `api/chat/route.ts` to use Redis.

### Phase 2: Observability (Priority: Medium)
- [ ] Replace `console.error` with `Sentry.captureException`.
- [ ] Add "Breadcrumbs" to key user actions (Log Workout, Save Biometrics).

### Phase 3: Final Polish (Priority: Low)
- [ ] Run full `npm audit fix`.
- [ ] Lock dependencies (`package-lock.json`).

---

**Recommendation:** Proceed immediately with **Phase 1 (Infrastructure)**. The current rate limiting is a false sense of security in a Vercel deployment.
