# IELTS Self-Study Hub

All-in-one tracking, notes, and analytics platform for IELTS self-study.

## Features

- **4 Modules** — Listening, Reading, Speaking, Writing with full CRUD
- **Question Type Tracking** — 27 Listening types + 14 Reading types with per-type accuracy
- **Heatmap Analysis** — Visual weakness detection across question types
- **Vocab Bank** — Spaced repetition flashcards with mastery tracking
- **Grammar Notes** — 14 categories with examples and common mistakes
- **Analytics** — Band trend charts, skill radar, recommendations engine, Question Type DNA
- **Score Simulator** — What-if tool to see which improvements have highest band impact
- **Topics Marketplace** — Global topic bank where users contribute and upvote topics
- **Speaking Forecast** — Quarterly forecast with sample questions (admin-managed)
- **AI Grading** — Gemini Flash-powered essay grading and speaking evaluation
- **Rich-Text Notes** — Tiptap-powered editor in grammar notes, writing essays, and mistake journal (bold, italic, bullet lists, headings)
- **Smart Notifications** — DB-backed in-app bell with streak-at-risk, vocab review due, writing reminder, and achievement-unlocked alerts
- **Achievement Sharing** — Canvas-generated PNG cards (1200×630) with download and clipboard copy buttons
- **Admin Dashboard** — User stats, activity feed, AI settings toggle, forecast management
- **Gamification** — XP, streaks, levels, badges, customizable dashboard widgets
- **PWA** — Installable web app

## Tech Stack

- **Next.js 16** (App Router, Server Components, Server Actions)
- **React 19** + **TypeScript**
- **Tailwind CSS 4**
- **Supabase** (PostgreSQL + Auth + RLS)
- **Gemini AI** (Flash model for cost efficiency)
- **Tiptap v3** (Rich-text editor)
- **Recharts** (Charts and visualizations)

## Getting Started

### Prerequisites

- Node.js 22+
- A [Supabase](https://supabase.com) project
- A [Google AI Studio](https://aistudio.google.com) API key (for AI features)

### Setup

1. **Clone and install**
   ```bash
   git clone <repo-url>
   cd IELTS_Web
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Supabase URL, anon key, and Gemini API key.

3. **Run database migrations** (in Supabase SQL Editor, in order)
   ```
   supabase/schema.sql
   supabase/schema-2.1.sql
   supabase/schema-2.2.sql
   supabase/schema-2.3.sql
   supabase/schema-2.4.sql
   supabase/schema-notifications.sql
   supabase/seed-forecast-q2-2026.sql
   ```

4. **Start dev server**
   ```bash
   npm run dev
   ```

5. **Set yourself as admin** (optional)
   ```sql
   UPDATE public.profiles SET role = 'admin' WHERE id = '<your-user-uuid>';
   ```

## Project Structure

```
src/
├── app/
│   ├── (app)/          # Authenticated routes
│   ├── admin/          # Admin dashboard
│   └── auth/           # Login / Register
├── components/
│   ├── ui/             # Design system
│   ├── layout/         # Sidebar, mobile nav
│   ├── analytics/      # Charts, recommendations
│   └── topics/         # Marketplace, forecast
└── lib/
    ├── ai/             # Gemini integration
    ├── constants/      # IELTS types, bands
    └── supabase/       # DB clients
```

## License

MIT — see [LICENSE](LICENSE)
