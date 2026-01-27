# Supabase Database Migration Guide

This guide outlines the workflow for managing database schema changes using the Supabase CLI. This ensures reproducible environments and production reliability.

## Prerequisites

1.  **Supabase CLI**: Ensure it's installed.
    ```bash
    npm install supabase --save-dev
    # or
    brew install supabase/tap/supabase
    ```

2.  **Login**:
    ```bash
    npx supabase login
    ```

## Workflow

### 1. Initialize Supabase (One-time)
If your project is not yet initialized locally:
```bash
npx supabase init
```

### 2. Link to Remote Project
Link your local environment to the remote Supabase project using your Project Reference ID (found in Dashboard > Settings > General).
```bash
npx supabase link --project-ref your-project-ref
```
*Note: You will need your Database Password.*

### 3. Pull Remote Schema
Sync your local migration history with the current state of the remote database.
```bash
npx supabase db pull
```
This creates a new migration file in `supabase/migrations` representing the current snapshot.

### 4. Making Changes (The Flow)

**Option A: Dashboard-First (Easier for Prototyping)**
1.  Make changes in the Supabase Dashboard (Table Editor, SQL Editor).
2.  Pull the changes to your local repo:
    ```bash
    npx supabase db pull
    ```
3.  Commit the generated migration file.

**Option B: Code-First (Recommended for Production)**
1.  Create a new migration file:
    ```bash
    npx supabase migration new add_new_table
    ```
2.  Write your SQL in the generated file (`supabase/migrations/timestamp_add_new_table.sql`).
3.  Apply it locally (if running Supabase locally):
    ```bash
    npx supabase db reset
    ```
4.  Push to remote (Automated via GitHub Actions usually, or manually):
    ```bash
    npx supabase db push
    ```

## CI/CD Integration

For production, we should automate migrations. Add this step to `deploy.yml`:

```yaml
- name: Apply Supabase Migrations
  uses: supabase/setup-cli@v1
  with:
    version: latest
- run: supabase db push
  env:
    SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
    SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
    PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }} # Adjust variable map
```
