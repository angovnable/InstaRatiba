# InstaRatiba — Automated CBC-Compliant School Timetable Generator

> **"Your timetable, instantly."**  
> by AG Computer Solutions | Version 1.1.0 | April 2026

InstaRatiba is a Progressive Web Application (PWA) built for Kenyan comprehensive schools to generate fully CBC-compliant timetables in under 5 minutes. It enforces MoE timetabling rules for Grade 1–9, handles teacher conflicts, lesson allocation, PDF export, approval workflows, and works offline.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Folder Structure](#folder-structure)
4. [Getting Started](#getting-started)
5. [Environment Variables](#environment-variables)
6. [Supabase Setup](#supabase-setup)
7. [Running the App](#running-the-app)
8. [Segment Map](#segment-map)
9. [timetableStore Patch (Segment 9)](#timetablestore-patch)
10. [Export Patch Note (Segment 8)](#export-patch-note)
11. [PWA & Deployment](#pwa--deployment)
12. [CI/CD (GitHub Actions)](#cicd-github-actions)
13. [Monetisation Tiers](#monetisation-tiers)

---

## Project Overview

InstaRatiba targets Kenyan **comprehensive schools** running Lower Primary (Gr 1–3), Upper Primary (Gr 4–6), and Junior Secondary (Gr 7–9) under one roof. It automates what currently takes 2–5 days manually into a guided wizard flow:

```
Account → School Setup → Classes → Teachers → Lesson Allocation → Generate → Export
```

Key features:
- ✅ Full CBC constraint engine (lesson counts, PPI, doubles, breaks, morning priority)
- ✅ Real-time conflict detection (teacher, room, subject)
- ✅ CSP-based timetable generator with heuristic backtracking
- ✅ Master / Class / Teacher timetable views with manual overrides
- ✅ Approval & publishing workflow (Deputy Head → Head Teacher)
- ✅ Plain B&W PDF export (jsPDF), CSV (SheetJS), JSON backup
- ✅ Duty roster generation
- ✅ Substitute teacher quick-swap
- ✅ Multi-term versioning
- ✅ Shareable read-only link (no login required for viewers)
- ✅ PWA — fully offline capable, installable on Android & iOS
- ✅ Role-based access control (Head Teacher / Deputy / HOD / Class Teacher)

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 18 + Vite |
| Language | TypeScript 5.x |
| Styling | Tailwind CSS v3 |
| State | Zustand |
| Routing | React Router v6 |
| Animation | Framer Motion |
| Server State | TanStack Query |
| Backend / Auth | Supabase (PostgreSQL + Auth + Storage) |
| PDF Export | jsPDF + html2canvas |
| CSV Export | SheetJS (xlsx) |
| Forms | React Hook Form + Zod |
| Icons | Bootstrap Icons (CDN) |
| Toasts | Sonner |
| Onboarding | Shepherd.js |
| PWA | vite-plugin-pwa (Workbox) |
| Deployment | Vercel |
| CI/CD | GitHub Actions |

---

## Folder Structure

```
instaratiba/
├── .github/
│   └── workflows/
│       ├── deploy.yml            # Vercel auto-deploy on push to main
│       └── lighthouse.yml        # Lighthouse CI performance audit
├── public/
│   ├── manifest.json             # PWA manifest
│   ├── favicon.svg
│   ├── robots.txt
│   └── icons/
│       └── README.md             # Instructions for generating PWA icons
├── supabase/
│   ├── 00_full_migration.sql     # ⭐ Run this — complete DB setup (all segments)
│   ├── supabase_migration_s3_s4.sql
│   ├── supabase_migration_s5.sql
│   ├── supabase_migration_s6.sql
│   └── supabase_migration_s9.sql
├── src/
│   ├── main.tsx
│   ├── App.tsx                   # Router + protected routes (final: Segment 10)
│   ├── index.css                 # CSS variables + Tailwind directives
│   ├── assets/                   # Fonts, SVGs, Lottie JSON files
│   ├── types/
│   │   └── index.ts              # All TypeScript interfaces and enums
│   ├── store/
│   │   ├── authStore.ts
│   │   ├── schoolStore.ts
│   │   ├── timetableStore.ts
│   │   ├── timetableStore.patch.ts  # ⚠️ See "timetableStore Patch" below
│   │   ├── teacherStore.ts
│   │   ├── allocationStore.ts
│   │   ├── validationStore.ts
│   │   ├── uiStore.ts
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useToast.ts
│   │   ├── useOnlineStatus.ts
│   │   ├── usePwaInstall.ts
│   │   ├── usePwaSync.ts
│   │   └── index.ts
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── auth.ts
│   │   │   ├── school.ts
│   │   │   ├── classes.ts
│   │   │   ├── rooms.ts
│   │   │   ├── teachers.ts
│   │   │   ├── timetable.ts
│   │   │   ├── approvalComments.ts
│   │   │   ├── settings.ts
│   │   │   ├── dashboard.ts
│   │   │   └── index.ts
│   │   ├── cbc/
│   │   │   ├── subjects.ts       # Grade 1–9 subject allocation tables
│   │   │   ├── timing.ts         # Daily slot timings per level
│   │   │   ├── validators.ts     # Hard + soft constraint validators
│   │   │   └── index.ts
│   │   ├── generator/
│   │   │   ├── engine.ts         # CSP + backtracking algorithm
│   │   │   ├── postConflicts.ts  # Post-generation conflict checker
│   │   │   └── index.ts
│   │   └── pwa/
│   │       ├── syncQueue.ts      # Offline action queue
│   │       ├── replayQueue.ts    # Sync replay on reconnect
│   │       └── index.ts
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── StepWizard.tsx
│   │   │   ├── SkeletonLoader.tsx
│   │   │   ├── SubjectChip.tsx
│   │   │   ├── ConflictAlert.tsx
│   │   │   └── index.ts
│   │   └── layout/
│   │       ├── AppShell.tsx
│   │       ├── Sidebar.tsx
│   │       ├── Navbar.tsx
│   │       ├── GlobalFooter.tsx
│   │       ├── WizardLayout.tsx
│   │       ├── OfflineBanner.tsx
│   │       ├── PwaProvider.tsx
│   │       ├── PwaInstallBanner.tsx
│   │       ├── ErrorBoundary.tsx
│   │       └── index.ts
│   └── features/
│       ├── auth/
│       │   ├── LandingPage.tsx
│       │   ├── LoginPage.tsx
│       │   ├── RegisterPage.tsx
│       │   ├── AuthCard.tsx
│       │   ├── AuthCallbackPage.tsx
│       │   ├── OnboardingTour.tsx
│       │   └── index.ts
│       ├── school/
│       │   ├── SchoolSetupPage.tsx
│       │   ├── TimingEditorPage.tsx
│       │   └── index.ts
│       ├── classes/
│       │   ├── ClassManagerPage.tsx
│       │   └── index.ts
│       ├── rooms/
│       │   ├── RoomManagerPage.tsx
│       │   └── index.ts
│       ├── teachers/
│       │   ├── TeacherManagerPage.tsx
│       │   └── index.ts
│       ├── allocation/
│       │   ├── AllocationPage.tsx
│       │   └── index.ts
│       ├── review/
│       │   ├── PreGenerateReviewPage.tsx
│       │   ├── useGenerate.ts
│       │   └── index.ts
│       ├── timetable/
│       │   ├── TimetablePage.tsx
│       │   ├── MasterGrid.tsx
│       │   ├── ClassView.tsx
│       │   ├── TeacherView.tsx
│       │   ├── ApprovalPanel.tsx
│       │   ├── SlotEditModal.tsx
│       │   ├── SharedTimetableView.tsx
│       │   ├── useTimetable.ts
│       │   ├── cellHelpers.ts
│       │   └── index.ts
│       ├── export/
│       │   ├── ExportPage.tsx
│       │   ├── ExportModal.tsx
│       │   ├── pdfExport.ts
│       │   ├── csvExport.ts
│       │   ├── jsonExport.ts
│       │   ├── exportHelpers.ts
│       │   ├── useExport.ts
│       │   ├── TimetablePage.patch.md  # ⚠️ See "Export Patch Note" below
│       │   └── index.ts
│       ├── dashboard/
│       │   ├── DashboardPage.tsx
│       │   ├── DutyRosterPanel.tsx
│       │   ├── SubstituteSwapModal.tsx
│       │   ├── VersioningPanel.tsx
│       │   └── index.ts
│       └── settings/
│           ├── SettingsPage.tsx
│           └── index.ts
├── index.html
├── vite.config.ts                # Final version from Segment 10 (includes PWA plugin)
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
├── postcss.config.js
├── vercel.json
├── lighthouserc.json
├── package.json                  # ⭐ Merged — all segment dependencies
├── .gitignore
└── .env.local.example
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18.x
- npm ≥ 9.x (or pnpm / yarn)
- A [Supabase](https://supabase.com) project
- A [Google Cloud Console](https://console.cloud.google.com) project (for OAuth)
- A [Vercel](https://vercel.com) account (for deployment)

### 1. Clone / extract the project

```bash
unzip InstaRatiba_merged.zip
cd instaratiba
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run database migrations

In your **Supabase Dashboard → SQL Editor**, paste and run the contents of:

```
supabase/00_full_migration.sql
```

This single file runs all four migration parts in the correct dependency order (S3/4 → S5 → S6 → S9).

> **Alternative**: If you prefer incremental runs, execute the individual files in this exact order:
> 1. `supabase_migration_s3_s4.sql`
> 2. `supabase_migration_s5.sql`
> 3. `supabase_migration_s6.sql`
> 4. `supabase_migration_s9.sql`

### 5. Configure Google OAuth (for Sign In with Google)

1. In Google Cloud Console, create an OAuth 2.0 Client ID.
2. Set authorised redirect URI to: `https://your-project.supabase.co/auth/v1/callback`
3. In Supabase Dashboard → Authentication → Providers → Google, paste your Client ID and Secret.
4. Add your app domain to the allowed redirect URLs in Supabase Auth settings.

### 6. Configure Supabase Storage

The migration already creates the `school-assets` bucket. Verify in Supabase Dashboard → Storage that the bucket exists and is set to **public**.

---

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous (public) key |

> **Do not commit `.env.local`** — it is listed in `.gitignore`.

---

## Running the App

```bash
# Development server (hot reload)
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview
```

The dev server starts at `http://localhost:5173`.

---

## Segment Map

This project was built across 10 development segments. Here is what each contributed to the final codebase:

| Segment | Feature Area | Key Files Added |
|---|---|---|
| **S1** | Foundation | UI components, layout, stores, routing scaffold, Tailwind config |
| **S2** | Authentication | LandingPage, LoginPage, RegisterPage, Google OAuth, OnboardingTour |
| **S3+4** | School, Classes, Rooms | SchoolSetupPage, TimingEditorPage, ClassManagerPage, RoomManagerPage, CBC subjects |
| **S5** | Teachers & Allocation | TeacherManagerPage, AllocationPage, teacherStore, allocationStore |
| **S6** | CBC Engine + Generator | validators.ts, timing.ts, engine.ts, postConflicts.ts, PreGenerateReviewPage |
| **S7** | Timetable Viewer | TimetablePage, MasterGrid, ClassView, TeacherView, ApprovalPanel, SlotEditModal, SharedTimetableView |
| **S8** | Export System | pdfExport.ts (jsPDF B&W), csvExport.ts (SheetJS), jsonExport.ts, ExportModal |
| **S9** | Dashboard & Settings | DashboardPage, DutyRosterPanel, SubstituteSwapModal, VersioningPanel, SettingsPage |
| **S10** | PWA & Deployment | vite.config.ts (PWA plugin), manifest.json, PwaProvider, PwaInstallBanner, syncQueue, GitHub Actions |

---

## timetableStore Patch

**File:** `src/store/timetableStore.patch.ts`

Segment 9 ships a **patch** to `timetableStore.ts` rather than replacing it wholesale. This file documents the additive fields and actions that Segment 9 requires (versioning state, substitute swap state, duty roster state).

**Action required before running:**  
Merge the contents of `timetableStore.patch.ts` into `timetableStore.ts`. The patch file contains inline comments showing exactly where each addition goes. Once merged, you can delete `timetableStore.patch.ts`.

---

## Export Patch Note

**File:** `src/features/export/TimetablePage.patch.md`

Segment 8's export system requires a small addition to `TimetablePage.tsx` (from Segment 7) to wire in the `<ExportModal>` component and the export button. This markdown file documents exactly what lines to add and where.

**Action required before running:**  
Read `TimetablePage.patch.md` and apply the described changes to `src/features/timetable/TimetablePage.tsx`. Once done, delete the patch file.

---

## PWA & Deployment

### PWA Icons

Before deploying, generate the required PWA icon set:

1. Create a 512×512 PNG of the InstaRatiba logo.
2. Use a tool like [Maskable.app](https://maskable.app) or `sharp` to generate the sizes listed in `public/icons/README.md`.
3. Place the generated icons in `public/icons/`.

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Or connect your GitHub repository to Vercel for automatic deployments on push to `main`.

The `vercel.json` in the project root is pre-configured with SPA rewrites so React Router works correctly.

### Environment Variables on Vercel

In your Vercel project settings → Environment Variables, add:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## CI/CD (GitHub Actions)

Two workflows are included in `.github/workflows/`:

| Workflow | File | Trigger | Action |
|---|---|---|---|
| Deploy | `deploy.yml` | Push to `main` | Builds and deploys to Vercel |
| Lighthouse | `lighthouse.yml` | Pull Request | Runs Lighthouse CI performance audit |

To activate, add these secrets to your GitHub repository settings:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## Monetisation Tiers

| Tier | Price | Features |
|---|---|---|
| Free (Starter) | KES 0 | 1 school, 1 timetable version, basic B&W export |
| School Pro | KES 2,500/term | Unlimited classes/teachers, 5 versions, all exports, duty roster, WhatsApp share, shareable link, priority support |
| County Bundle | KES 25,000/yr | Up to 50 schools, county analytics dashboard, bulk export |

---

## Colour Palette Reference

| Token | Hex | Usage |
|---|---|---|
| `--color-primary` | `#2E7D32` | Navbars, primary CTAs, headings |
| `--color-mid` | `#4CAF50` | Hover states, active items |
| `--color-accent-light` | `#A5D6A7` | Backgrounds, section fills |
| `--color-surface` | `#E8F5E9` | Card backgrounds, table alt rows |
| `--color-warn` | `#FFB300` | Warning badges, conflict indicators |
| `--color-error` | `#E53935` | Error states, hard conflicts |
| `--color-info` | `#1565C0` | Info banners, link text |

---

## CBC Compliance Summary

InstaRatiba enforces the **Kenya MoE CBC Timetabling & Curriculum Based Establishment Guidelines**:

| Level | Grades | Lesson Length | Lessons/Week |
|---|---|---|---|
| Lower Primary | 1–3 | 30 min | 31 |
| Upper Primary | 4–6 | 30 min | 38–40 |
| Junior Secondary | 7–9 | 40 min | 40 |

Hard constraints enforced: teacher conflicts, room conflicts, subject lesson counts, PPI placement, break slots, double lesson placement, Creative Arts before breaks, no similar subjects consecutively.

---

## Developer

**Brian — AG Computer Solutions, Nairobi, Kenya**  
GitHub: [@angovnable](https://github.com/angovnable)

---

*InstaRatiba — Developed in strict compliance with the Kenya Ministry of Education CBC Timetabling & Curriculum Based Establishment Guidelines.*  
*Document Version 1.1 — April 2026 | Confidential — AG Computer Solutions © 2026*
