# Security Implementation Plan for S.P.E.C. Pulse Tracker

This document outlines the security architecture and implementation steps to ensure user data isolation, proper authentication, and data privacy in line with industry standards.

## 1. Current Security Audit Findings
- **Critical Vulnerability**: Database tables (biometrics, logs, profiles, etc.) currently have permissive RLS policies (`USING (true)`), allowing public access to all data.
- **Missing Auth Guards**: No middleware to protect routes or refresh sessions.
- **Client-Side Auth**: Currently relying on basic client-side checks or demo mode without robust server-side verification.

## 2. Security Architecture

### A. Database Layer (Supabase RLS)
Row Level Security (RLS) will be the primary defense line.
- **Policies**: All tables must have strict RLS policies ensuring users can only read/write their own data.
  - `SELECT`: `auth.uid() = user_id`
  - `INSERT`: `auth.uid() = user_id`
  - `UPDATE`: `auth.uid() = user_id`
  - `DELETE`: `auth.uid() = user_id`
- **Guest/Demo Mode**: A specific policy will handle the "Demo User" (`00000000-0000-0000-0000-000000000001`) to allow public read-only access (or simulated write actions in temporary sessions, though we'll likely restrict writes to client-only state for true guests).

### B. Authentication Layer (OAuth)
- **Providers**: Google and Apple OAuth will be implemented.
- **Flow**: PKCE Auth Flow for increased security.
- **Redirects**: Strict allowlist for callback URLs.

### C. Application Layer (Next.js)
- **Middleware**: `middleware.ts` will be implemented to:
  - Refresh auth sessions (Supabase requirement for Server Components).
  - Protect private routes (`/dashboard`, `/analytics`, `/settings`).
  - Redirect unauthenticated users to `/login`.
- **API Routes**: All API handlers must verify session using `createServerClient` before processing requests.

## 3. Step-by-Step Implementation

### Phase 1: Database Lockdown (Immediate Priority)
1.  **Drop Insecure Policies**: Remove existing `Allow all` policies.
2.  **Enable RLS**: Confirm RLS is enabled on all tables.
3.  **Apply Strict Policies**:
    - `profiles`: Users read/write own.
    - `logs` / `session_logs`: Users read/write own.
    - `biometrics`: Users read/write own.
    - `workout_library`: Public read (if shared) or User read own.
4.  **Triggers**:
    - `handle_new_user`: Auto-create `profiles` entry on signup.

### Phase 2: Supabase Auth Configuration
1.  Set up Google OAuth credentials in Supabase Dashboard.
2.  Set up Apple OAuth credentials.
3.  Configure URL Configuration (Site URL & Redirect URLs).

### Phase 3: Frontend Implementation
1.  **Middleware**: Create `src/middleware.ts`.
2.  **Auth UI**:
    - Login Page (`/login`)
    - Signup Page (`/signup` - or combined)
    - Onboarding Flow (`/onboarding`) for new users to set initials metrics (height, weight, etc.).
3.  **Guest Mode Logic**: Ensure the "Try as Guest" button logs them in as the specific Demo User or sets a client-side "guest" state that mocks DB calls. *Recommendation: Use the specific Demo User UUID for read-only preview, but prompt to sign up for saving data.*

## 4. Maintenance & Monitoring
- Regular audits of RLS policies.
- Monitoring Supabase Auth logs for suspicious activity.
