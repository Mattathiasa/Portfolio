# Resume Project — Context & Progress

## Status: WAITING FOR USER ANSWERS
We are in the middle of building Mattathias's resume. The HTML file exists but needs a full rewrite based on the improvement guidelines below.

---

## What's Done
- Analyzed portfolio (Hero, About, Skills, Projects components)
- Created initial resume at `public/resume.html`
- Fixed "Download CV" button in `Hero.tsx` to link to `/resume.html` instead of `/resume.pdf`
- User reviewed resume and provided 10 improvement guidelines (see below)
- Asked follow-up questions — **waiting for answers**

---

## Known Info (from portfolio + user)

### Personal
- **Name**: Mattathias Abraham
- **Email**: mattathiasabraham@gmail.com
- **Phone**: +251 902 212 622
- **Location**: Addis Ababa, Ethiopia
- **LinkedIn**: https://www.linkedin.com/in/mattathias-abraham-3707a0398/
- **Portfolio**: https://mattathiasportfolio.vercel.app/
- **GitHub**: https://github.com/Mattathiasa
- **Languages**: Amharic (Native), English (Professional)
- **Target roles**: Mobile App Dev (primary), Full Stack, Frontend

### Education
- **Degree**: BSc Software Engineering
- **School**: HiLCoE — Higher Learning College of Engineering, Addis Ababa
- **Graduated**: 2025
- **GPA**: 3.5 / 4.0

### Work Experience

#### DAFTech Computer Engineering — Full Stack Developer (Feb 2026 – Present)
- Porting Android Java app to Flutter
- Implemented Inventory module for Water Billing system
- Built sample/prototype mobile apps
- **MISSING**: App purpose, architecture (BLoC/MVVM?), DB/backend, scale/user numbers

#### Mahibere Ahaw Church — Freelance Developer (Oct 2025 – Present)
- Building a Church Management System from scratch
- **MISSING**: Tech stack, features (membership/attendance/roles?), number of users, role-based access?

#### African Union — IT Intern (Mar 2024 – May 2024)
- Data mining assignment
- Converted AFP XML files to user-friendly HTML
- **MISSING**: Tools/languages used, scale of the XML conversion work

### Projects (from portfolio)
1. **Clashroller** — React, TypeScript, Node.js, Framer Motion | https://mn-clashroller.vercel.app/
2. **SKZPY Music Player** — Electron, React, Recharts, Zustand, Web Audio API | https://skz-player.vercel.app/
3. **Football Freestyle** — React, TypeScript, Vite, Video-React | https://football-freestyle.vercel.app/

### Skills (from portfolio)
- JS/TS (90%), React & Next.js (85%), Flutter (83%), Mobile Dev (89%), Angular (80%), Java (75%), UI/UX (80%)
- Tools: Git, Docker, Figma, Postman, AWS, MongoDB, PostgreSQL, Firebase, Supabase, Vercel, Android Studio, Xcode, .NET, SQL, Azure Data Studio, Notion

---

## Improvement Guidelines (user provided)
1. **Impact-driven bullets** — replace "Worked on / Helped with" with "Built X that improved Y by Z"
2. **Technical depth** — mention architecture (MVVM, BLoC), tools, features (auth, RBAC, CRUD)
3. **Add numbers** — users, scale, performance improvements
4. **Fix structure** — Header → Summary → Skills → Projects → Experience → Education
5. **Church/community leadership** — convert to professional experience if applicable
6. **Tailor for mobile-first** jobs
7. **Remove weak filler words** — "hardworking", "team player", etc.
8. **Reality check** — only include things user can explain
9. **Projects section** — include Studymate app, Church app, Flutter conversion work
10. **1 page, consistent formatting, bullet points only**

---

## Pending Questions (answers needed before rewriting)

### DAFTech
- Q1: What does the Flutter app do? (what is the business purpose?)
- Q2: How many records/users does the Water Billing system handle?
- Q3: What architecture in Flutter? (BLoC, MVVM, Provider, GetX?)
- Q4: What backend/database does the water billing system use?

### Church Management System
- Q5: What features? (membership, attendance, events, finance, roles?)
- Q6: Tech stack? (React? Flutter? Firebase?)
- Q7: How many members/users will it serve?
- Q8: Any role-based access control or hierarchy?

### Church / Community Leadership
- Q9: Any personal role in church or community? (Sunday school teacher, team leader, event organizer?)
- Q10: How many people in events/programs you helped with?
- Q11: Did you lead or train any volunteers or teams?

### Studymate App
- Q12: What is Studymate? What does it do?
- Q13: Tech stack?
- Q14: Is it deployed/live? How many users?

### African Union
- Q15: What tools/languages for the data mining task?
- Q16: Scale of the XML conversion work?

### Other
- Q17: Any other projects (school projects, personal apps)?
- Q18: Any certifications or courses completed?

---

## Next Steps (when user returns with answers)
1. Rewrite all bullets to be impact-driven with numbers and technical depth
2. Restructure: Header → Summary → Skills → Projects → Experience → Education
3. Add Studymate and any other missing projects
4. Add church/community leadership as experience if applicable
5. Keep to 1 page, bullet points only
6. Update `public/resume.html` with the final version
