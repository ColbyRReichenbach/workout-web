# Branch Protection Rules

This document outlines the recommended branch protection rules for the Pulse Tracker repository.

## Main Branch Protection

The `main` branch should have the following protections enabled:

### Required Status Checks

Enable **"Require status checks to pass before merging"** with the following checks:

- `lint` - ESLint must pass
- `type-check` - TypeScript compilation must succeed
- `test` - All unit tests must pass
- `build` - Production build must complete successfully

### Pull Request Reviews

Enable **"Require pull request reviews before merging"**:

- Required approving reviews: **1**
- Dismiss stale pull request approvals when new commits are pushed: **Yes**
- Require review from code owners: **Optional** (if CODEOWNERS file exists)

### Conversation Resolution

Enable **"Require conversation resolution before merging"**:

- All comments on a PR must be resolved before merging

### Branch Restrictions

Enable **"Restrict who can push to matching branches"**:

- Only allow administrators and designated maintainers to push directly

### Additional Protections

- **Require signed commits**: Optional but recommended for security
- **Do not allow bypassing the above settings**: Enabled
- **Allow force pushes**: Disabled
- **Allow deletions**: Disabled

## Develop Branch Protection (if used)

The `develop` branch should have lighter protections:

### Required Status Checks

- `lint` - ESLint must pass
- `type-check` - TypeScript compilation must succeed
- `test` - All unit tests must pass

### Pull Request Reviews

- Required approving reviews: **1**

## Setting Up Branch Protection

### Via GitHub UI

1. Go to **Settings** > **Branches**
2. Click **Add rule** under "Branch protection rules"
3. Enter `main` as the branch name pattern
4. Configure the settings as described above
5. Click **Create** or **Save changes**

### Via GitHub CLI

```bash
# Create branch protection rule for main
gh api repos/{owner}/{repo}/branches/main/protection \
  -X PUT \
  -f required_status_checks='{"strict":true,"contexts":["lint","type-check","test","build"]}' \
  -f enforce_admins=true \
  -f required_pull_request_reviews='{"dismiss_stale_reviews":true,"require_code_owner_reviews":false,"required_approving_review_count":1}' \
  -f restrictions=null \
  -f allow_force_pushes=false \
  -f allow_deletions=false
```

## Environment Protection

For production deployments, create a protected environment:

1. Go to **Settings** > **Environments**
2. Click **New environment**
3. Name it `production`
4. Add **Required reviewers** (at least 1 maintainer)
5. Add **Wait timer** if desired (e.g., 5 minutes)
6. Restrict deployments to `main` branch only

## Secrets Management

Required secrets for CI/CD:

| Secret | Description | Required For |
|--------|-------------|--------------|
| `VERCEL_TOKEN` | Vercel API token | Deployment |
| `VERCEL_ORG_ID` | Vercel organization ID | Deployment |
| `VERCEL_PROJECT_ID` | Vercel project ID | Deployment |
| `CODECOV_TOKEN` | Codecov upload token | Coverage reports |

### Adding Secrets

1. Go to **Settings** > **Secrets and variables** > **Actions**
2. Click **New repository secret**
3. Add each required secret

## Workflow

With these protections in place, the typical workflow is:

1. Create feature branch from `main` (or `develop`)
2. Make changes and commit
3. Push branch and open PR
4. CI runs: lint, type-check, tests, build
5. Request review from team member
6. Address any feedback
7. Merge once all checks pass and review approved
8. Automatic deployment to Vercel (on merge to `main`)
