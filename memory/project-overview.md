---
name: project-overview
description: Tech stack, key files, Firebase setup status, and admin system architecture for the Mattathias portfolio
metadata:
  type: project
---

Vite + React 18 + TypeScript + TailwindCSS + shadcn/ui portfolio site deployed on Vercel.

Key libs: framer-motion, react-router-dom, @tanstack/react-query, firebase, emailjs, three.js, lucide-react.

**Firebase integration added (2026-05-29):**
- `src/lib/firebase.ts` — init (Firestore + Storage)
- `src/lib/firestore.ts` — all CRUD: projects, skills, tools, content, CV, image upload
- `src/types/portfolio.ts` — Project, Skill, PortfolioContent interfaces
- `/admin` route — `src/pages/Admin.tsx` — password-gated admin dashboard

**Admin page structure:**
- Login: password from `VITE_ADMIN_PASSWORD` env var, stored in sessionStorage
- Tabs: Projects (full CRUD + image upload), Skills & Tools (sliders + chip list), Content (hero/about text), CV (file upload)

**Portfolio components:**
- `Projects.tsx` and `Skills.tsx` fetch from Firestore via react-query; fall back to static arrays if Firebase not configured or Firestore is empty.

**Firebase setup still needed (user hasn't done this yet):**
1. Create project at firebase.google.com
2. Enable Firestore + Storage
3. Fill in `VITE_FIREBASE_*` vars in `.env`
4. Set `VITE_ADMIN_PASSWORD` in `.env`
5. Set Firestore rules: allow read all, write all (open for personal portfolio)
6. Use "Seed Initial Data" or add projects manually via /admin

**Why:** User wanted an admin page to do CRUD on portfolio content without editing code.
**How to apply:** When suggesting portfolio edits, prefer using the admin UI over code changes.
