# IELTS Self-Study Hub — Full Project Context

## What This Is
An all-in-one tracking, notes, and analytics platform for IELTS self-study. NOT a practice/test platform — it's a **command center** where students log results from external platforms (Study4, Cambridge, etc.), track progress, analyze weaknesses, and improve systematically.

## Target Users
- Vietnamese IELTS students (THPT, SV, người đi làm)
- Band 4.0 → 8.0+ range
- Self-study focused (no teacher dependency)

## Tech Stack
- **Next.js 16.2** (App Router, Server Components, Server Actions, Proxy middleware)
- **React 19.2** + TypeScript
- **Tailwind CSS 4** with CSS variables (dark/light mode via `[data-theme]`)
- **Supabase** (PostgreSQL + Auth + RLS on all tables)
- **Gemini AI** (Flash model — cost-efficient essay grading + speaking evaluation)
- **Recharts** (Line charts, Radar, Bar charts)
- **Lucide React** (Icons)

## Design System
- Extracted from parent project (UI workspace) — 9 reusable components
- Components: Button, Card, Badge, Input, Select, Modal, DataTable, Skeleton, EmptyState
- Theme: Emerald accent light (#1B4D3E) / Lime accent dark (#22C55E)
- Module colors: Listening #378ADD, Reading #D85A30, Speaking #1D9E75, Writing #993556
- Typography: Inter (UI) + Fira Code (data/scores)

## Architecture

### Routes (33 total)
```
/ (redirect to /dashboard or /auth)
/auth (Email/Password login + register)
/onboarding (first-time profile setup)
/dashboard (stats, streak calendar, exam countdown, module cards, quick actions)
/listening, /listening/new, /listening/[id], /listening/heatmap
/reading, /reading/new, /reading/[id], /reading/heatmap
/speaking, /speaking/new, /speaking/[id]
/writing, /writing/new, /writing/[id]
/vocab, /vocab/review (spaced repetition flashcards)
/grammar (14-category accordion with notes CRUD)
/topics (global marketplace — browse, contribute, upvote)
/analytics (band trends, skill radar, recommendations, DNA chart)
/analytics/simulator (score decomposition what-if tool)
/analytics/mistakes (error pattern recognition)
/admin (platform overview — users, avg bands, weakest/strongest types)
/admin/users, /admin/users/[id] (user detail drill-down)
/admin/forecast (Q2/2026 speaking forecast CRUD)
/admin/topics (admin topic view)
/admin/settings (AI toggle, model selection, daily limit)
```

### Database (15+ tables, 5 SQL migrations)
```
schema.sql         — profiles, listening (records/sections/types), vocab_cards, daily_activity + Phase 2 tables
schema-2.1.sql     — global_topics, topic_upvotes, admin role, is_admin() function, admin RLS
schema-2.2.sql     — app_settings (AI toggle)
seed-forecast.sql  — Q2/2026 speaking forecast (21 Part 1 + 15 Part 2+3 topics with sample questions)
```

Key tables:
- `profiles` — user data + role (user/admin) + XP + streak
- `listening_records` → `listening_section_details` → `listening_type_results` (27 question types × 4 sections)
- `reading_records` → `reading_passage_details` → `reading_type_results` (14 question types × 3 passages)
- `writing_entries` — Task 1/2 with 4 criteria scores (TA/CC/LR/GRA)
- `speaking_entries` → `speaking_part_details` — Part 1/2/3 with 4 criteria
- `vocab_cards` — spaced repetition (mastery 0-100, next_review date)
- `grammar_notes` — 14 categories with examples + mistakes
- `global_topics` — shared marketplace (speaking + vocab, user-contributed, upvotes, forecast flag)
- `topic_upvotes` — prevents double-voting
- `app_settings` — admin-managed key-value store (AI enabled, model, daily limit)
- `daily_activity` — per-user per-day XP tracking

### Security
- RLS enabled on ALL tables
- `is_admin()` SQL function with hardened `SECURITY DEFINER` + `REVOKE/GRANT`
- All delete/get actions have `user_id` ownership checks
- All admin actions have `checkIsAdmin()` guard
- AI responses validated (scores clamped 1-9, safe JSON parsing, input length cap 5000)
- `isAIEnabled()` fails closed (returns false on error)
- Security headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- Proxy middleware (Next.js 16) refreshes Supabase session + protects routes

### Key Features
- **Question Type Tracking**: 27 Listening types across 4 sections + 14 Reading types = 41 total, tracked per-type with correct/total/accuracy
- **Heatmaps**: Visual weakness grid per question type (green ≥75%, yellow 50-74%, red <50%, gray <3 data points)
- **Band Auto-Calculation**: Official IELTS conversion tables (Listening + Reading /40→band)
- **Spaced Repetition Vocab**: Intervals 1→3→7→14→30→60 days, mastery 0-100%
- **Smart Recommendations**: Priority formula = 0.4×weakness + 0.25×frequency + 0.2×recency + 0.15×exam_urgency
- **Question Type DNA**: Horizontal bar chart showing accuracy across all 41 types
- **Score Simulator**: Interactive what-if sliders (adjust type accuracy → see predicted band change)
- **Mistake Pattern Recognition**: Client-side error tag detection (spelling, distractor, vocab gap, etc.)
- **Streak Calendar**: GitHub-style 90-day contribution grid
- **Exam Countdown**: 4-phase system (Intensive→Consolidation→Revision→Confidence)
- **Gamification**: XP per action, 50 levels (Beginner→IELTS Master), 12 badge definitions
- **Global Topics Marketplace**: Users contribute + upvote, admin manages forecasts
- **AI Writing Grading**: Gemini Flash grades essays on 4 IELTS criteria + feedback
- **AI Speaking Evaluation**: Gemini evaluates speaking notes on 4 criteria + tips
- **Admin Dashboard**: Platform-wide avg bands, weakest/strongest types, user drill-down, AI settings toggle
- **PWA**: Installable web app with manifest

### What Was NOT Built (Future Phases)
- Edit routes (`/[module]/[id]/edit`) — detail pages show data but no inline edit
- AI rate limiting enforcement (setting exists in DB but not checked in code)
- Speaking/Writing heatmaps (no question-type breakdown in schema for those modules)
- Vocab ↔ Module FK linking (source is free-text, not relational)
- Grammar ↔ Writing cross-reference
- Export PDF reports
- Per-skill analytics sub-routes (`/analytics/listening`, etc.)
- Study Buddy matching
- Browser extension for auto-importing scores
- Cmd+K command palette

## Build Process Used
1. **SYSTEM_DESIGN.html** — 25-section product design doc (wireframes, flows, algorithms, features)
2. **Ralplan consensus** — Planner→Architect→Critic loop for major features
3. **Ultrawork** — Parallel executor agents for independent modules
4. **3-pass security audit** — Security + Code Quality + Architecture reviews
5. **12-blocker fix pass** — All security/quality issues resolved before public release

## Supabase Project
- URL: `https://qjzqfwmiuqrynisirtfe.supabase.co`
- Auth: Email/Password (no Google OAuth in MVP)
- Admin setup: `UPDATE profiles SET role='admin' WHERE id='<uuid>'`

## Key Files
```
src/lib/constants/listening-types.ts   — 27 question types with descriptions + frequency
src/lib/constants/reading-types.ts     — 14 question types grouped by category
src/lib/constants/speaking-types.ts    — criteria, topics, categories, entry types
src/lib/constants/writing-types.ts     — Task 1 (7 types), Task 2 (5 types), criteria
src/lib/constants/grammar-categories.ts — 14 grammar categories with band impact
src/lib/constants/band-tables.ts       — Official score→band conversion + color mapping
src/lib/constants/gamification.ts      — XP values, level thresholds, badge definitions
src/lib/ai/gemini.ts                   — Gemini Flash integration (grading, evaluation, analysis)
src/lib/ai/check-ai-enabled.ts        — Admin AI toggle check (fail-closed)
src/lib/streak.ts                      — Streak calculation with DB-sourced timezone
src/lib/supabase/client.ts            — Browser Supabase client
src/lib/supabase/server.ts            — Server Supabase client (cookies)
src/lib/supabase/middleware.ts        — Auth session refresh + route protection
src/proxy.ts                           — Next.js 16 proxy (replaces middleware.ts)
```

## Known Issues / Tech Debt
- `schema.sql` contains Phase 2 tables duplicated from `schema-phase2.sql` (both use IF NOT EXISTS, no conflict)
- Module accent colors hardcoded inline across ~15 files (should centralize)
- XP values hardcoded as literals in actions (should import from gamification.ts)
- `as Record<string, unknown>` casts in detail pages (should use typed Supabase joins)
- Recommendations engine only covers Listening + Reading (no Speaking/Writing input)
- `daily_activity.date` uses Node UTC in create actions but DB time in streak (timezone edge case mitigated but not eliminated)

## What Comes Next (Brainstorm Ideas for Future Phases)
- Phase 4: AI-powered study plans, export PDF, Speaking recorder + STT
- Phase 5: Social features (study buddy matching, leaderboard, peer essay review)
- Phase 6: Mobile app (React Native or PWA enhancement)
- Content: More forecast quarters, community topic curation, official IELTS prep integration
