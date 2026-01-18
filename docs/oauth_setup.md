# OAuth Configuration Guide

This guide walks you through setting up Google and Apple authentication for your Supabase project.

## 1. Google OAuth Setup (Free)

You will need a Google Cloud account.

### Step A: Create Google Cloud Project
1. Go to the **[Google Cloud Console](https://console.cloud.google.com/)**.
2. Click the project dropdown in the top-left and select **"New Project"**.
3. Name it "Pulse Tracker" (or similar) and click **Create**.

### Step B: Configure Consent Screen
1. In the left sidebar, go to **APIs & Services > OAuth consent screen**.
2. Select **External** (unless you have a G-Suite organization) and click **Create**.
3. Fill in the App Information:
   - **App Name**: Pulse
   - **User Support Email**: Your email
   - **Developer Contact Email**: Your email
4. Click **Save and Continue**.
5. **Scopes**: You can skip this (default scopes are fine). Click **Save and Continue**.
6. **Test Users**: Add your own email so you can test it. Click **Save and Continue**.

### Step C: Create Credentials
1. Go to **APIs & Services > Credentials** in the left sidebar.
2. Click **+ CREATE CREDENTIALS** (top) > **OAuth client ID**.
3. **Application Type**: Select **Web application**.
4. **Name**: "Pulse Web Client"
5. **Authorized JavaScript origins**:
   - Add: `http://localhost:3000`
   - Add: `https://<YOUR-PROJECT-REF>.supabase.co` (Found in Supabase Settings)
6. **Authorized redirect URIs**:
   - Add: `http://localhost:3000/auth/callback`
   - Add: `https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback`
   - *Note: Find your exact callback URL in Supabase Dashboard > Authentication > Providers > Google.*
7. Click **Create**.

### Step D: Add to Supabase
1. Copy the **Client ID** and **Client Secret** displayed.
2. Go to **Supabase Dashboard > Authentication > Providers > Google**.
3. Enable Google.
4. Paste the Client ID and Client Secret.
5. Click **Save**.

---

## 2. Apple OAuth Setup (Requires $99/yr Account)

*Note: You need an active Apple Developer Program membership.*

### Step A: Register App ID
1. Go to **[Apple Developer Portal](https://developer.apple.com/account/resources/identifiers/list)**.
2. Click **+** (Identifiers).
3. Check **App IDs** > Continue.
4. Select **App** > Continue.
5. Description: "Pulse Web", Bundle ID: `com.yourname.pulse-web` (explicit).
6. Enable **Sign In with Apple** capability (scroll down).
7. Click **Register**.

### Step B: Create Service ID
1. Go back to **Identifiers**.
2. Click **+**.
3. Check **Service IDs** > Continue.
4. Description: "Pulse Auth", Identifier: `com.yourname.pulse-web.auth`.
5. Click **Register**.
6. Click the newly created Service ID to edit it.
7. Enable **Sign In with Apple** and click **Configure**.
8. **Primary App ID**: Select the App ID from Step A.
9. **Domains and Subdomains**: `<YOUR-PROJECT-REF>.supabase.co` (no https://).
10. **Return URLs**: `https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback`.
11. Click **Next** > **Done** > **Save**.

### Step C: Generate Private Key
1. Go to **Keys** (left sidebar).
2. Click **+**.
3. Key Name: "Supabase Auth".
4. Enable **Sign In with Apple**.
5. Click **Configure**, select your Primary App ID.
6. Click **Save** > **Continue** > **Register**.
7. **Download the Key (.p8 file)**. *Save this! You can't download it again.*
8. Note the **Key ID** shown on this page.
9. Note your **Team ID** (top right of developer portal).

### Step D: Generate Secret & Add to Supabase
Supabase handles the Secret generation for you if you provide the key.

1. Go to **Supabase Dashboard > Authentication > Providers > Apple**.
2. Enable Apple.
3. **Services ID**: `com.yourname.pulse-web.auth` (from Step B).
4. **Secret Key**: Paste the contents of the `.p8` file you downloaded.
5. **Key ID**: From Step C.
6. **Team ID**: From Step C.
7. Click **Save**.

---

## 3. Final Supabase Configuration

1. Go to **Authentication > URL Configuration**.
2. **Site URL**: `http://localhost:3000`
3. **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback`
4. Click **Save**.
