<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Design System

### Theme Colors
- **Accent (Royal Dark Emerald)**: `#1B4D3E` — primary brand color. Use CSS var `var(--color-accent)`.
- **Accent hover**: `#163F33` — `var(--color-accent-hover)`
- **Accent light**: `#E8F5EE` — `var(--color-accent-light)` for subtle backgrounds
- **Background**: white / `#F8F9FA` body, `#FFFFFF` card
- **Text**: near-black `#1A1A2E` (`var(--color-ink)`)
- **Status**: green (success), amber (warning), red (error), blue (info) — keep semantic

**Do NOT use** pink `#993556`, purple, or any off-theme accent. If you see it in existing code, replace with `var(--color-accent)`.

### Iconography
- **NEVER use emoji characters in JSX** (no ✅ ⚠️ ❌ 📝 🎯 💡 etc.)
- **ALWAYS use `lucide-react` icons** for all visual markers
- Common picks: `Check` (success), `AlertTriangle` (warning), `X` (error), `Lightbulb` (tip), `Sparkles` (AI), `ChevronDown` (collapsible), `ArrowRight` (next/improvement)

### Language
- **Current state**: App UI is in English. A Vietnamese version will be added later via i18n.
- **When writing new UI**: use English text only.
- **Server error messages** returned to the client may be in Vietnamese (user-facing friendly errors) — those stay as the source of truth for now.

### Typography Utilities (from globals.css)
- `heading-lg` — 24px bold, tight letter-spacing
- `heading-md` — 18px semibold
- `heading-sm` — 15px semibold
- `section-label` — 11px uppercase tracked
- `card-base` — white card, border, subtle shadow
- `card-interactive` — same + hover elevation
- Animations: `animate-fade-in`, `animate-fade-in-up`, `animate-scale-in`, `stagger-children`
