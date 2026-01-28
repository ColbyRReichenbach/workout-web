# Security Policy

## Vulnerability Disclosure

Security is a primary concern for the Pulse Tracker platform. If you identify a potential security vulnerability, please report it through the following protocol:

1. **Confidentiality**: Do not disclose the vulnerability in public forums or open GitHub issues.
2. **Reporting**: Send a detailed report to the maintenance team via the official contact channels.
3. **Remediation**: Allow the development team reasonable time to investigate and rectify the issue before public disclosure.

## Implemented Security Architecture

### Authentication and Access Control
- **Identity Provider**: Integration with Supabase Auth for multi-factor authentication (email, password, and OAuth 2.0).
- **Data Isolation**: Strict enforcement of Row Level Security (RLS) across all PostgreSQL tables to ensure tenant-level data isolation.
- **Session Management**: Server-side session validation ensuring high-entropy token persistence.

### API Security & Resilience
- **Traffic Governance**: Rate limiting enforced through Upstash Redis (20 requests/minute on sensitive AI endpoints).
- **Schema Validation**: Comprehensive input validation using Zod to prevent malformed or malicious payloads from reaching the backend.
- **Error Redaction**: Standardized API error responses that prevent stack trace or internal configuration leakage.

### AI & Prompt Security
- **Injection Detection**: Real-time analysis of over 15 known prompt injection patterns using regex-based filtration.
- **Payload Sanitization**: Automated removal of XSS vectors and control characters from user inputs.
- **Context Sandboxing**: Strict data scoping that limits the AI model's access only to the context of the authenticated user.

### Data Protection Standards
- **Encryption**: Mandatory HTTPS for all production traffic; data-at-rest encryption provided via Supabase/AWS.
- **Secret Management**: Zero-hardcoding policy; all sensitive credentials managed through environment variables and encrypted vault storage.
- **Privacy Filtering**: Automated redaction of PII and sensitive internal identifiers before data is transmitted to third-party AI APIs.

## Compliance and Best Practices

Contributors are required to adhere to the following standards:
- **Validation**: Utilize schemas from `src/lib/validation.ts` for all entry points.
- **Authorization**: Explicitly verify user context in every server-side action and API route.
- **Testing**: Maintain 100% pass rate in security-related Vitest suites located in `tests/security`.

## Security Validation
To execute the dedicated security test suite:
```bash
npm run test -- tests/security/
```

## Security Version History

| Version | Date | Updates |
| :--- | :--- | :--- |
| 1.0.0 | 2026-01-18 | Initial security implementation |
| 1.1.0 | 2026-01-27 | Enhanced prompt injection detection and rate limiting refactor |
