# CareerPilot AI

AI-powered career readiness platform for students, freshers, and job seekers. Upload your resume, pick a target role, and get an honest readiness score, skill-gap analysis, personalized roadmap, resume improvements, and AI mock interviews — all private to your account.

## Features

- AI Resume Analysis with a weighted career-readiness score
- Job Matching against a target role or pasted job description
- Skill Gap Analysis with prioritized, evidence-backed gaps
- Personalized Career Roadmap in ordered stages
- AI Resume Improvement (truth-preserving: nothing invented)
- AI Interview Coach (adaptive text chatbot)
- Voice Interview (browser speech recognition + synthesis, text fallback)
- User Authentication (Supabase Auth: register, login, password reset)
- User Profiles (name, target role, experience level)
- Personal History (analyses, resume improvements, interview sessions)
- Multi-user data isolation (PostgreSQL Row Level Security)
- Supabase persistence (structured results, no raw-resume retention)
- Gemini-powered AI through a server-side backend

## Technology Stack

**Frontend:** React 18, Vite, React Router, custom CSS design system, Three.js (career-trajectory visual), Supabase JS client (auth + database)

**Backend:** Node.js, Express, Gemini API (OpenAI-compatible chat-completions interface), PDF parsing, request validation, rate limiting

**Database / Auth:** Supabase (PostgreSQL, Supabase Auth, Row Level Security, auto-created user profiles)

## Project Structure

```
careerpilot-ai/
├── frontend/                 # React + Vite app
│   ├── src/
│   │   ├── components/       # Layout, nav, dashboard, auth + history UI
│   │   ├── context/          # AuthContext (session, profile, sign in/out)
│   │   ├── hooks/            # useVoiceInterview
│   │   ├── lib/              # Supabase client (public anon key only)
│   │   ├── pages/            # All routes (product + auth + dashboard)
│   │   ├── services/         # Backend API client, user-data layer
│   │   └── styles/           # Design system (global.css)
│   ├── index.html
│   ├── vite.config.js        # Dev server + /api proxy to backend
│   └── .env.example          # Public placeholder values only
├── backend/                  # Express API
│   ├── controllers/          # Analyze, interview, resume, health
│   ├── middleware/           # requireAuth (JWT), upload (PDF), errors
│   ├── prompts/              # Versioned prompt layer + score weights
│   ├── routes/               # /api/health, /api/analyze, /api/interview, /api/resume
│   ├── services/             # LLM service, analysis orchestration, schemas
│   ├── utils/                # Validation, PDF extraction
│   └── .env.example          # Server placeholder values only
├── supabase/
│   └── migrations/           # 001_initial_schema.sql (tables + RLS + trigger)
├── SUPABASE_SETUP.md         # Manual Supabase project setup walkthrough
├── README.md
├── robots.txt
└── sitemap.xml
```

## Local Development

Requirements: Node.js 18+.

**Backend** (http://localhost:5000):

```powershell
cd careerpilot-ai/backend
npm install
npm start
```

**Frontend** (http://localhost:5173, proxies `/api` to the backend):

```powershell
cd careerpilot-ai/frontend
npm install
npm run dev
```

Production frontend check: `npm run build`.

## Environment Variables

Both apps need local `.env` files. Copy the structure from the examples and fill in your own values:

- Copy `frontend/.env.example` → `frontend/.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- Copy `backend/.env.example` → `backend/.env` (`PORT`, `CLIENT_URL`, `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, optional `SUPABASE_SERVICE_ROLE_KEY`)

> **NEVER commit `.env` files or API keys.** They are git-ignored. Only `.env.example` files (placeholders, no real values) belong in the repository. See `SUPABASE_SETUP.md` for the full Supabase setup.

## AI Provider

CareerPilot AI uses Gemini (`gemini-3.5-flash-lite`) exclusively through the server-side backend over an OpenAI-compatible chat-completions interface. The API key lives only in `backend/.env` and is never sent to the browser. The backend validates and recomputes all scores server-side (readiness weights 20/25/20/15/20); AI outages surface as honest errors, never fabricated results.

## Supabase

Supabase provides authentication (email register/login/password reset with persisted sessions), PostgreSQL persistence for profiles, analyses, resume improvements, interview sessions/messages, and preferences, plus Row Level Security so every row belongs to exactly one user (`auth.uid()` ownership on all policies). The backend verifies the Supabase JWT on every AI endpoint and never trusts a client-supplied user ID.

## Security

- AI credentials server-side only; service-role key never touches the frontend
- RLS on all user-owned tables; authenticated API routes return 401 without a valid session
- PDF-only uploads, 5 MB limit, 1 MB JSON body limit, rate limiting, restrictive CORS
- No permanent raw-resume storage (structured results only); no resume content in logs
- No secrets in source, git history, console output, or build artifacts committed to the repo

## Deployment

Intended architecture (not yet deployed):

- **Frontend:** static hosting such as Vercel (`npm run build` output), pointing at the backend URL
- **Backend:** Node hosting such as Render or equivalent (`npm start`), with production env vars configured on the host
- **Database/Auth:** hosted Supabase project with the migration applied and production redirect URLs configured

Configure production Supabase redirect URLs and `CLIENT_URL`/CORS for your domains before going live.
