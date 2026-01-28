# Release 1.0 - Production Readiness

**Date:** January 27, 2026
**Status:** Production Candidate

## 🚀 Major Features

### Infrastructure Persistence
- **Redis Rate Limiting:** Migrated from in-memory `Map` to `@upstash/ratelimit` for serverless-compatible, persistent rate limiting.
- **Unified Client:** Created `src/lib/redis.ts` as a single source of truth for Redis connections.
- **Coverage:** Applied to both AI Chat (`/api/chat`) and Auth Actions (`login`, `signup`, `reset`).

### Validation Guardrails (Data Integrity)
- **Unit-Aware Logic:** Implemented conditional validation in `src/lib/validation.ts`.
    - `km` limit: 100km
    - `m` limit: 100,000m
    - `mi` limit: 300mi
- **Anomaly Prevention:** Specifically targets and prevents the recurrence of "5000" distance outliers identified in the Jan Audit.
- **Frontend Sync:** Updated `LogInput.tsx` to explicitly pass unit context during workout logging.

### Observability
- **Sentry Integration:** Replaced critical `console.error` calls with `Sentry.captureException` in:
    - AI Chat API (`route.ts`)
    - Auth Actions (`auth.ts`)
    - AI Tools (`tools.ts`)
    - Redis Utility (`redis.ts`)
- **Error Tracking:** Now capturing stream failures, rate limit fallback errors, and external tool failures.
