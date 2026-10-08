# CareerPilot AI — Supabase Setup (manual steps)

The code is fully wired for Supabase Auth + Postgres + RLS. You must create the
free Supabase project and paste 4 values into local `.env` files. Nothing in
this guide asks for secret keys beyond your own dashboard — never share them.

> Time needed: ~10 minutes. No CLI, no credit card.

---

## 1. Create the project

1. Open **https://supabase.com/dashboard** and log in (or sign up).
2. Click **New project**.
3. Pick any **Name** (e.g. `careerpilot-ai`), set a strong **Database Password**
   (save it in your password manager), choose the closest **Region**.
4. Click **Create new project** and wait ~2 minutes for provisioning.

## 2. Run the database migration

1. In your new project, open **SQL Editor** (left sidebar) → **New query**.
2. Open this file in the repo: **`supabase/migrations/001_initial_schema.sql`**.
3. Copy its **entire contents**, paste into the Supabase SQL editor, click **Run**.
4. Confirm success (no red errors). It creates:
   `profiles`, `analyses`, `resume_improvements`, `interview_sessions`,
   `interview_messages`, `user_preferences` — plus indexes, the profile
   auto-creation trigger, and RLS policies on every table.

## 3. Copy your API credentials

1. Open **Project Settings** (gear icon) → **API**.
2. Copy these two values:
   - **Project URL** → looks like `https://xyzcompany.supabase.co`
   - **Publishable / anon key** → a long `eyJ…` token (safe for browsers)
3. You need the **same two values in two places** (frontend + backend).

## 4. Configure the frontend

1. Copy `frontend/.env.example` → `frontend/.env` (same folder).
2. Fill in:
   ```ini
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY
   ```
3. Restart the Vite dev server after saving.

## 5. Configure the backend

1. Open `backend/.env` (copy from `backend/.env.example` if missing).
2. Add — keeping your existing `LLM_*` lines untouched:
   ```ini
   SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   SUPABASE_ANON_KEY=YOUR-ANON-KEY
   ```
   The backend uses these **only to verify user JWTs**. The Gemini key
   (`LLM_API_KEY`, model `gemini-3.5-flash-lite`) stays exactly as it is.
3. Restart the backend (`npm start`).

> `SUPABASE_SERVICE_ROLE_KEY` is **not required**. Only add it to
> `backend/.env` (never `VITE_`-prefixed, never in the frontend) if a future
> server-side admin task needs it.

## 6. Configure Auth (email + redirects)

1. Open **Authentication** → **Providers** → **Email**: leave **enabled**.
2. **Confirm email**: your choice —
   - **ON** (recommended for production): users see *“Account created. Please
     check your email…”* and must verify before first login. The app handles
     this message automatically.
   - **OFF** (easiest for local testing): users land in the app immediately.
3. Open **Authentication** → **URL Configuration**:
   - **Site URL**: `http://localhost:5173` (local) — your production domain later.
   - **Redirect URLs** → add **both** (one per line):
     - `http://localhost:5173/**`
     - `https://YOUR-PRODUCTION-DOMAIN/**` (placeholder — replace when you deploy)
4. These redirects power the password-reset email → `/reset-password` flow.

## 7. Verify it works

1. Start backend (`cd backend; npm start`) and frontend (`cd frontend; npm run dev`).
2. Open `http://localhost:5173/register` → create **User A** → log in.
3. Run an analysis on `/analyze` → open `/dashboard` → history appears.
4. Log out → log in as a **different User B** → dashboard is empty (isolation works).
5. `GET /api/health` stays public; `POST /api/analyze/full` without a login
   now returns `401 NOT_AUTHENTICATED`.

## Troubleshooting

| Symptom | Fix |
|---|---|
| “Authentication is not configured yet” | `frontend/.env` missing vars or dev server not restarted |
| Backend `401` even when logged in | `backend/.env` missing the same Supabase URL/anon key; restart backend |
| Empty history tables / “Could not load” | Migration SQL not run, or run in the wrong project |
| Reset-password link goes nowhere | Redirect URLs (§6) not added |
| Register says “check your email” forever | Email confirmation is ON — click the inbox link, or turn it OFF for testing |

## Security notes

- RLS uses `auth.uid()` on every table — User A can never read User B's rows,
  even with crafted IDs. Frontend filtering is convenience, not protection.
- Raw resume text is **not** stored — only structured scores/skills/roadmaps.
- Passwords are hashed by Supabase Auth; the app never sees or stores them.
- `.env` files are git-ignored (`.env`, `.env.*`); only placeholders ship in
  `.env.example` files.
