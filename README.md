# InstaRatiba 🗓️ v3.0

> Generate conflict-free, Ministry-of-Education-compliant CBC timetables for Kenyan schools — in minutes.  
> **Fully offline PWA · Google Sign-in · Firebase sync · Kiswahili/English · 6 PDF export types**

---

## ✨ What's New in v3

| Feature | Details |
|---|---|
| **Firebase Auth** | Google Sign-in + email/password |
| **Offline PWA** | Full offline support via IndexedDB + Service Worker |
| **Auto-sync** | Data syncs to Firestore when you reconnect |
| **6 PDF Export Types** | Stream, Teacher, All Classes, All Teachers, Master, MoE Report |
| **Excel Export** | .xlsx with all classes, master sheet, teacher loads |
| **Analytics Dashboard** | Workload bars, subject distribution, compliance summary |
| **WhatsApp Share** | Share timetable link via WhatsApp |
| **Room Allocation** | Assign room names to streams |
| **Kiswahili UI** | Toggle EN/SW in the header |
| **School-themed Design** | Black · Gold · Orange · Sky Blue palette |

---

## 🚀 Quick Start

### 1. Clone & install
```bash
git clone https://github.com/YOUR_USERNAME/instaratiba.git
cd instaratiba
npm install
```

### 2. Create Firebase project
1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **New project**
2. Enable **Authentication** → Sign-in methods → **Google** ✓ and **Email/Password** ✓
3. Enable **Firestore Database** → Start in **production mode**
4. Add a **Web app** → copy the config

### 3. Set up environment
```bash
cp .env.example .env
# Edit .env and paste your Firebase config values
```

### 4. Firestore security rules
In Firebase Console → Firestore → Rules, paste:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /timetables/{id} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### 5. Run locally
```bash
npm run dev
# Open http://localhost:5173
```

> 💡 The app works **fully offline without signing in** — data lives in localStorage.  
> Sign in to enable cloud sync across devices.

---

## 🌐 Deploy to Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (choose "Hosting", public dir = "dist", SPA = yes)
firebase init hosting

# Build & deploy
npm run build
firebase deploy
```

Your app will be live at `https://YOUR_PROJECT_ID.web.app`

---

## 📄 PDF Export Types

| Export | Description |
|---|---|
| **Stream PDF** | Single class timetable — colour-coded by subject |
| **Teacher PDF** | Individual teacher schedule with workload summary |
| **All Classes PDF** | Every stream, one page each |
| **All Teachers PDF** | Every teacher, one page each |
| **Master PDF** | All streams side-by-side on one landscape page |
| **MoE Compliance Report** | Period compliance + teacher workload (inspection-ready) |

All PDFs use the **InstaRatiba brand** (navy/gold header, orange accents).

---

## 📁 Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx        # Auth, offline badge, lang toggle, theme
│   │   ├── StepNav.tsx       # Animated step indicators + mobile bottom nav
│   │   └── Footer.tsx        # Social links + WhatsApp FAB
│   ├── steps/
│   │   ├── StepSchool.tsx    # Step 0: School info + county picker
│   │   ├── StepClasses.tsx   # Step 1: Streams, subjects, room allocation
│   │   ├── StepTeachers.tsx  # Step 2: Teachers, workload rings, assignments
│   │   └── StepGenerate.tsx  # Step 3: Generate, view, all exports
│   ├── timetable/
│   │   └── TimetableGrid.tsx # Class + teacher timetable views
│   └── ui/
│       ├── AuthModal.tsx     # Google + email/password auth
│       └── AnalyticsDashboard.tsx # Workload charts, compliance, coverage
├── hooks/
│   └── useAuth.ts            # Firebase auth listener + online/offline sync
├── lib/
│   ├── constants.ts          # CBC presets, i18n strings (EN/SW), colours
│   ├── excel.ts              # XLSX export (SheetJS)
│   ├── firebase.ts           # Firebase init, Firestore helpers
│   ├── pdf.ts                # 6 PDF export functions (jsPDF)
│   └── solver.ts             # CBC timetable generation engine
├── store/
│   └── index.ts              # Zustand + Firebase persistence + offline sync
├── types/
│   └── index.ts              # TypeScript types
├── App.tsx
├── main.tsx
└── index.css                 # Full design system (school theme)
```

---

## 🧑‍💻 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS + CSS custom properties |
| Fonts | Roboto → Inter → Open Sans → Montserrat |
| State | Zustand (localStorage persist) |
| Backend | Firebase (Auth + Firestore + Hosting) |
| Offline | IndexedDB persistence + Service Worker (Workbox) |
| PDF | jsPDF + jspdf-autotable |
| Excel | SheetJS (xlsx) |
| PWA | vite-plugin-pwa |

---

## 📜 License
MIT — free to use, modify, and deploy for Kenyan schools.

© 2026–2028 InstaRatiba · Powered by AG Computer Systems
