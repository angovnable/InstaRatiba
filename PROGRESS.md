# InstaRatiba — UI/UX Redesign Handoff

## What this file is
Paste this into the **start** of any new Claude chat to restore full context about this redesign.

---

## Project
**InstaRatiba** — CBC-compliant school timetable generator for Kenyan schools  
**By:** AG Computer Solutions  
**Stack:** React 18 · TypeScript · Vite · Tailwind CSS · Zustand · Supabase · Framer Motion · vite-plugin-pwa

---

## Redesign Scope
Complete visual layer redesign — Kenyan/EAC flag theme. **No business logic, routing, Supabase, or TypeScript types were touched.**

---

## New Design Token System

| Token Name | Hex | Name |
|---|---|---|
| `--color-primary` | `#0D3D23` | Mau Forest |
| `--color-gold` | `#C8922A` | Savanna Gold |
| `--color-red` | `#A01F1F` | Rift Red |
| `--color-surface` | `#F7F5EF` | Kilimanjaro Ivory |
| `--color-dark` | `#0F1B14` | Nairobi Night |
| `--color-ocean` | `#1E5C8A` | Indian Ocean |
| `--color-text` | `#1C2B22` | Charcoal |
| `--color-muted` | `#7A8C82` | Dust |
| `--color-accent-light` | `#EDE7D9` | Savanna Mist |

---

## New Typography

| Role | Font | Weights |
|---|---|---|
| Display / Headings | Plus Jakarta Sans | 700, 800 |
| UI Labels / Sections | Outfit | 400, 500, 600 |
| Body / Forms | Figtree | 400, 500 |
| Grid / Mono | Space Mono | 400, 700 |

CSS variables: `--font-display`, `--font-ui`, `--font-body`, `--font-mono`

---

## Files Modified (complete list)

### Root
- `index.html` — new Google Fonts (Plus Jakarta Sans, Outfit, Figtree, Space Mono), Kenyan flag stripe CSS
- `tailwind.config.js` — new colour palette, font families, shadows, animations

### src/
- `index.css` — full token redesign, dot-grid bg, skeleton shimmer in ivory/gold, btn-* utilities, mobile tab bar CSS

### src/components/layout/
- `Sidebar.tsx` — Nairobi Night bg, gold active state, Space Mono logo, gold-ring avatar
- `Navbar.tsx` — glassmorphism ivory, green-tinted shadow, dark mode toggle, gold term badge, Mau Forest avatar
- `AppShell.tsx` — AnimatePresence page transitions (y+opacity), mobile tab bar, loading skeleton
- `GlobalFooter.tsx` — ivory glassmorphism, gold social icon hover, WhatsApp FAB
- `OfflineBanner.tsx` — gold accent, Mau Forest sync-done state
- `PwaInstallBanner.tsx` — dark card (Nairobi Night), gold icon, Figtree font
- `WizardLayout.tsx` — ivory bg with dot grid, new step wizard colors

### src/components/ui/
- `Button.tsx` — 5 variants: primary (Mau Forest), gold, ghost, secondary, danger; Framer Motion whileTap
- `Card.tsx` — gold CardHeader accent bar, green-tinted shadow, hover lift
- `Input.tsx` — Outfit labels, Figtree body, Mau Forest focus ring, Rift Red errors
- `Badge.tsx` — new variant styles with Kenyan palette
- `Modal.tsx` — green-tinted backdrop, spring entrance, gold accent bar in header
- `SkeletonLoader.tsx` — ivory/savanna mist shimmer (warm, not grey)
- `StepWizard.tsx` — gold completed dots, Mau Forest active dot, connecting line
- `SubjectChip.tsx` — semantic category colours (Languages: ocean, Sciences: forest, Humanities: gold, Creative: red)
- `ConflictAlert.tsx` — Rift Red hard conflicts, Savanna Gold warnings, left border accent

### src/features/auth/
- `LandingPage.tsx` — Nairobi Night bg, 3-orb mesh animation (forest/gold/ocean), Kenya map SVG watermark, dark feature cards, gold CTA
- `AuthCard.tsx` — dark bg, glassmorphism card, gold underline gradient

### src/features/dashboard/
- `DashboardPage.tsx` — StatCard: gold left border + gold icon box + green stat value + watermark icon; LevelCard hover gold border
- (TermPlanner, RecentActivity inline subcomponents also updated)
- `VersioningPanel.tsx` — status badge palette updated

### src/features/timetable/
- `cellHelpers.ts` — SUBJECT_COLOURS updated to Kenyan semantic palette
- `MasterGrid.tsx` — Nairobi Night header row, Space Mono time column, day tabs in gold, staggered cell animation
- `ClassView.tsx` — Nairobi Night/Space Mono thead, Outfit/Figtree cell content, Rift Red conflict border
- `TeacherView.tsx` — matching dark header
- `ApprovalPanel.tsx` — StatusBadge inline styles with new palette, comment row updated

### src/features/review/
- `PreGenerateReviewPage.tsx` — progress ring stroke → Savanna Gold, conflict/warning panels → Kenyan palette

### src/features/school/
- `SchoolSetupPage.tsx`, `TimingEditorPage.tsx` — toggle off-state colour updated

### src/features/settings/
- `SettingsPage.tsx` — danger zone styled with Rift Red, toggle colours updated

### src/App.tsx
- Sonner Toaster — Figtree font, green-tinted shadow, ivory border

---

## Build Segments Status

| Segment | Name | Status |
|---|---|---|
| 1 | Project Foundation | ✅ Done |
| 2 | Auth | ✅ Done |
| 3 | School Setup | ✅ Done |
| 4 | Classes & Rooms | ✅ Done |
| 5 | Teachers & Allocation | ✅ Done |
| 6 | CBC Rules Engine | ✅ Done |
| 7 | Timetable Viewer & Approval | ✅ Done |
| 8 | Export System | ✅ Done |
| 9 | Dashboard & Extra Features | ✅ Done |
| 10 | PWA & Deployment | ✅ Done |
| UI | Full Visual Redesign | ✅ Done |

---

## Continuity Notes
- All CSS variable references (`--color-primary`, `--color-text`, etc.) throughout unchanged files automatically pick up the new values from `index.css`
- PDF/print export intentionally kept in B&W — do not apply brand colours there
- Dark mode: add `data-theme="dark"` to `<html>` — sidebar stays Nairobi Night in both modes
- Mobile: sidebar hidden via CSS at <768px; bottom tab bar (MobileTabBar in AppShell) shown instead
