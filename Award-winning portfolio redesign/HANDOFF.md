# Portfolio redesign — handoff for Claude Code

Repo: `Mattathiasa/Portfolio` (main). Goal: re-skin the existing React + Vite + Tailwind + Firebase site to match the design in this folder **without touching Firebase config, Firestore schema, EmailJS, the `/api/chat` function, or the admin auth**.

## Reference files (open these in a browser first)
- `Portfolio.dc.html` — the new homepage. Data-driven; reads the same Firestore docs the current site uses.
- `Admin.dc.html` — the new `/admin`. Same 11 tabs as `src/pages/Admin.tsx` + two new ones (Site copy, AI chat).
- `portfolio-data.js` — the **data contract**: `DEFAULTS` mirrors `src/data/defaults.ts` plus new copy fields; `loadPortfolio()`/`save.*` mirror `src/lib/firestore.ts`.
- `firebase-config.js` — where the design expects env values (`VITE_FIREBASE_*`, `VITE_ADMIN_HASH`, `VITE_EMAILJS_*`, `VITE_GROK_API_KEY`). In the real app keep using `import.meta.env`.

## Design tokens (replace `src/index.css` :root values)
```
--background: #0E191D   (surface-2: #112025, surface-3: #14232A)
--foreground: #F3EFE2
--muted-foreground: rgba(243,239,226,.6)  (.72 for body copy, .55 for mono labels)
--border: rgba(243,239,226,.14)           (.10 for section dividers, .08 hairlines)
--accent: #DDEB9D  (hover #E9F3B8)  accent-foreground: #0E191D
--success #A6E3A1  --warning #F0DB8A  --destructive #F0A6A6
radius: 6px cards/inputs, 8px panels, 999px pills/buttons
```
Fonts (Google): **Instrument Serif** (400, italic) for h1/h2/h3 and big numbers · **DM Sans** (300–500) body · **JetBrains Mono** (400/500) for labels, indices, nav. Drop Inter and Pacifico.

Type scale: h1 `clamp(44px,9vw,128px)` line-height .98 letter-spacing -.02em · section h2 `clamp(36px,5vw,64px)` · project h3 `clamp(28px,3.2vw,44px)` · body 16–17px/1.55 · mono labels 11–12px, `letter-spacing:.06em`, uppercase.

Accent rule: one lime element per viewport (status dot, italic word, or CTA). Everything else cream/white on dark.

## Page structure (`src/pages/Index.tsx`)
Order and anchors: `#home` Hero → `#work` Selected work → `#about` About → `#experience` Experience → `#skills` Stack → `#contact` Contact (+ inline form) → footer row. Sections are `max-width:1280px`, gutters `clamp(20px,4vw,48px)`, vertical padding `clamp(72px,10vh,140px)`. Remove Blog, Testimonials, Football video button and the loading screen. Nav: fixed, 64px, transparent → `rgba(14,25,29,.8)` + blur after 24px scroll; <900px collapses to a "Menu" pill and full-width serif list.

Component map (keep file names, rewrite markup):
| Component | Design notes |
|---|---|
| `Hero.tsx` | Bottom-aligned, `min-height:100svh`. Mono status line (`currentlyWorking / heroSubtitle / location · heroTimezone`) → serif headline from `heroHeadline` (parse `*word*` → lime italic) → hairline → description + two pill CTAs. |
| `Projects.tsx` | Vertical list, not a grid. Each row: 16:10 image left, meta/title/longDescription/"Hard part" callout (left lime border, uses `challenges`)/tags/Live+Source links right. No category filter buttons. |
| `About.tsx` | Two columns. Left: index label, heading, italic subtitle, **tall image** (`flex:1; min-height:clamp(420px,60vh,640px)`, cover). Right: two paragraphs, stats (count-up), 2×2 highlight cards, CTA pill. |
| `Certifications.tsx` + new Experience | Vertical timeline from `cv.experience` (+ `cv.education` as an "Education" badge row). Dot filled lime when date contains "Present". |
| `Skills.tsx` | Grid of category cells from `cv.skills` (label + comma-split chips). Credentials row from `certifications`. **No percentage bars.** |
| `Contact.tsx` | Two columns: serif headline (from `contactHeading`, `*accent*` supported) + big mono email + Elsewhere/Direct link lists; right: form card (name, email, subject, message/500, submit). Keep the existing EmailJS `send()` call and toast. |
| `PortfolioChat.tsx` | Same logic (Groq/`/api/chat`, streaming, localStorage `matty_chat_v2`, 3s auto-open). New skin: 56px lime FAB with serif italic "m"; 420px panel, `rgba(17,32,37,.96)` + blur, user bubbles lime `14px 14px 4px 14px`, assistant plain text with "m" avatar; suggestion pills; contact CTA. Title/subtitle/welcome/suggestions/system prompt now come from `content` (see below). |
| `SceneCanvas.tsx` / `three/` | Replace formations with an ambient point field: ~1600 points (700 on mobile), 35% lime / 65% cream, size .09, opacity .55, `FogExp2(0x0E191D,.028)`, slow y-rotation, x-rotation tied to scroll, camera eased to mouse. Throttle to 30fps, `powerPreference:'low-power'`, skip under `prefers-reduced-motion`. Keep it behind all content at opacity 1; add the radial lime glow div on top. |
| `Navigation.tsx`, `Footer.tsx` | Nav as above; footer collapses to one mono row (© · credit · discreet `admin` link). |

Motion (GSAP, already in repo): hero children `from {y:28,opacity:0}` stagger .06; every section block `data-reveal` → `from {y:24,opacity:0}` on `ScrollTrigger start:'top 88%' once`; timeline line `scaleY 0→1`; stats count-up. Nothing longer than .9s. Respect reduced motion.

## Firestore additions (no schema breaks — all new keys live in `content/main`)
Add to `PortfolioContent` in `src/types/portfolio.ts` and `DEFAULT_CONTENT` in `src/data/defaults.ts` (values in `portfolio-data.js → DEFAULTS.content`):
```
brandLabel, navWork, navAbout, navExperience, navStack, navContact, navResume, navHire,
heroHeadline, heroCtaPrimary, heroCtaSecondary, heroTimezone,
workHeading, workHardPartLabel, workLiveLabel, workSourceLabel, workMoreText,
aboutIndexLabel, experienceHeading, experienceIndexLabel, educationBadge,
skillsHeading, skillsIndexLabel,
contactIndexLabel, contactHeading, formHeading, formIntro, formName, formEmail, formSubject,
formMessage, formSubmit, formSuccess, formError, elsewhereLabel, directLabel, footerCredit,
chatTitle, chatSubtitle, chatWelcome, chatPlaceholder, chatCta, chatSuggestions: string[], chatSystemPrompt
```
Every component reads its strings via `getContent()` with the default as fallback (same pattern `Contact.tsx` already uses). Move `SYSTEM_PROMPT` and `SUGGESTED` out of `PortfolioChat.tsx` into these fields.

## Admin (`src/pages/Admin.tsx`)
Re-skin with the same tokens: left sidebar (240px, grouped Site / Career / Private) on ≥900px, horizontal pill strip below a sticky header on mobile. Cards `#112025` with hairline borders; inputs `#0E191D`, 40px, focus border lime; primary buttons lime pills; destructive actions as quiet text that turns `#F0A6A6` on hover. Login: single card, serif "Welcome back.", same SHA-256 check and `sessionStorage` key.

Add two tabs (both write to `content/main` via `saveContent`):
- **Site copy** — every field in the list above, grouped Navigation / Hero / Work / Section indices / Contact & form. Show the hint "wrap a word in *asterisks* for the lime italic accent".
- **AI chat** — title, subtitle, placeholder, CTA, welcome, suggestions (one per line), system prompt (large textarea).

Keep Projects (grid + slide-over editor, visibility toggle, reorder), Develop (autosave), Scheduler (status columns), CV, Skills, Certs, Testimonials, Blog, Contact, Hero/About exactly as functional today.

## Acceptance checklist
- [ ] Lighthouse mobile ≥ 90 perf; three.js loads after first paint; no layout shift from fonts (`display=swap`, size-adjust ok).
- [ ] 360px, 768px, 1024px, 1440px — nothing horizontal-scrolls; nav collapses <900px.
- [ ] `prefers-reduced-motion` disables GSAP + canvas.
- [ ] Editing any string in Admin → Site copy changes the homepage after refresh.
- [ ] Contact form sends via EmailJS; chat streams via `/api/chat`; both unchanged env names.
- [ ] Hidden projects (`visible:false`) don't render; order respected.
