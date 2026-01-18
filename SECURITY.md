# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in Pulse Tracker, please report it responsibly:

1. **DO NOT** open a public GitHub issue
2. Email the maintainers directly with details
3. Allow reasonable time for a fix before public disclosure

## Security Measures Implemented

### Authentication & Authorization

- **Supabase Auth** - Secure authentication with support for email/password and OAuth
- **Row Level Security (RLS)** - All database tables have RLS policies enabled
- **Session Management** - Server-side session validation via Supabase
- **Demo Mode** - Sandboxed guest access with isolated demo data

### API Security

- **Rate Limiting** - 20 requests/minute on AI endpoints
- **Input Validation** - All inputs validated with Zod schemas
- **Authentication Required** - Protected endpoints verify user sessions
- **Error Handling** - Internal errors don't leak sensitive information

### AI Security

- **Prompt Injection Detection** - 15+ patterns checked on every request
- **Input Sanitization** - XSS and malicious content stripped
- **Context Isolation** - AI can only access the authenticated user's data
- **Tool Safety** - AI tools have hard limits and data filtering

### Data Protection

- **Environment Variables** - All secrets stored in environment variables
- **No Hardcoded Secrets** - Zero API keys or credentials in source code
- **HTTPS Only** - All production traffic encrypted via Vercel
- **Minimal Data Exposure** - AI tools filter out sensitive fields

## Environment Variables

The following environment variables are required:

| Variable | Type | Description |
|----------|------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anonymous key (safe for client) |
| `NEXT_PUBLIC_SITE_URL` | Public | Application URL for redirects |
| `OPENAI_API_KEY` | **Secret** | OpenAI API key (server-side only) |

**Never commit `.env.local` to version control.**

## Security Best Practices for Contributors

1. **Never hardcode secrets** - Use environment variables
2. **Validate all inputs** - Use schemas from `src/lib/validation.ts`
3. **Check authentication** - Verify user sessions in protected routes
4. **Sanitize outputs** - Prevent XSS in user-generated content
5. **Test security** - Run `npm test` to execute security tests

## Security Testing

Run security tests:

```bash
npm run test -- tests/security/
```

Tests cover:
- Authentication flows
- Authorization checks
- Prompt injection detection
- Content moderation
- Input/output encoding
- Rate limiting
- Data privacy

## Dependencies

Regularly audit dependencies:

```bash
npm audit
```

## Version History

| Version | Date | Security Updates |
|---------|------|------------------|
| 1.0.0 | 2026-01-18 | Initial security implementation |
