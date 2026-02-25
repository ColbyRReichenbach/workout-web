# Security Policy

## Vulnerability Disclosure

Security is a primary concern for the Pulse Tracker platform. If you identify a potential security vulnerability, please report it through the following protocol:

1. **Confidentiality**: Do not disclose the vulnerability in public forums or open GitHub issues.
2. **Reporting**: Email the maintainers directly with a detailed report.
3. **Remediation**: Allow the development team reasonable time to investigate and rectify the issue before public disclosure.

## Implemented Security Architecture

### Authentication & Authorization
- **Identity Provider**: Integration with Supabase Auth for secure multi-factor and OAuth (Google) authentication.
- **Data Isolation**: Strict enforcement of Row Level Security (RLS) across all PostgreSQL tables ensures tenant-level data isolation.
- **Session Management**: Server-side session validation ensuring high-entropy token persistence via Supabase SSR.

### API Security & Resilience
- **Distributed Rate Limiting**: Implemented via Upstash Redis to prevent abuse across serverless instances (20 requests/minute on sensitive AI endpoints).
- **Schema Validation**: Comprehensive input validation using Zod to prevent malformed or malicious payloads.
- **Error Obfuscation**: Production errors are captured by Sentry with PII masking; internal stack traces are NEVER leaked to the client.

### AI Governance & Safety
- **Prompt Injection Detection**: 16-pattern regex matching for jailbreak and injection attempts on every message.
- **Topic Guardrails**: Priority-ordered keyword and pattern matching across 20+ categories, with fuzzy matching (Levenshtein distance) to catch deliberate typo-based bypasses.
- **Semantic Safety Net**: OpenAI Moderation API and a GPT-4o-mini intent classifier run on every message lacking clear fitness context.
- **Output Validation**: Post-generation response scanning for PII, credentials, and system prompt leakage before delivery to the client.
- **Privacy Layer**: AI tools use explicit field selection and sanitization functions — user IDs, internal IDs, and session data are never included in LLM context.
- **Interaction Auditing**: Every AI request is logged to `ai_logs` (intent, tools used, tokens, latency, status) for monitoring via the admin diagnostic terminal.

### Data Protection Standards
- **Encryption**: Mandatory HTTPS (TLS 1.3) for all production traffic; data-at-rest encryption (AES-256) provided via Supabase/AWS.
- **Secret Management**: Zero-hardcoding policy; all sensitive credentials managed through environment variables and encrypted vault storage.
- **Secure Defaults**: Strict security headers and optimized CSP policies.

## Environment Variables (Security Critical)

| Variable | Scope | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anonymous key |
| `OPENAI_API_KEY` | **Secret** | OpenAI API key (Server only) |
| `UPSTASH_REDIS_REST_URL` | **Secret** | Redis URL for rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | **Secret** | Redis Token for rate limiting |
| `SENTRY_DSN` | **Secret** | Sentry DSN for error monitoring |

## Best Practices for Contributors

1. **Validate All Inputs** - Use schemas in `src/lib/validation.ts`.
2. **Context-Aware Auth** - Always verify the `user` context from Supabase before performing data operations.
3. **Redact Sensitive Data** - Ensure any new AI tools use the standard `redact` utilities.
4. **Test for Regressions** - Run both security unit tests and `promptfoo` evaluations.

## Security Testing

Run the security-focused evaluation suite:

```bash
# General security tests
npm run test -- tests/security/

# AI safety/injection evaluations
npx promptfoo eval
```

## Version History

| Version | Date | Security Updates |
| :--- | :--- | :--- |
| 1.0.0 | 2026-01-18 | Initial security implementation |
| 1.1.0 | 2026-01-28 | Production hardening: Redis rate limiting, Sentry integration, Privacy Layer, and Immutable Auditing |
| 1.2.0 | 2026-02-25 | AI safety enhancements: 6-layer guardrail pipeline, semantic intent classifier, Levenshtein fuzzy matching for keyword bypass prevention, output validation with PII/credential detection |

---

For a detailed breakdown of the AI guardrail architecture, including all 6 safety layers, tool sandboxing, and PII scrubbing, see [TECHNICAL.md](./TECHNICAL.md).

