---
name: project-chatbot
description: Portfolio AI chatbot using Grok (xAI) API, floats on bottom-right of the main portfolio page
metadata:
  type: project
---

A floating chatbot widget lives at `src/components/PortfolioChat.tsx`, rendered inside `src/pages/Index.tsx` after the loading screen completes.

**Implementation details:**
- Dual-mode API key flow:
  - Local dev: `VITE_XAI_API_KEY` in `.env.local` → calls `https://api.x.ai/v1/chat/completions` directly from the browser
  - Production: falls back to `POST /api/chat` → Vercel Edge function (`api/chat.ts`) which reads `XAI_API_KEY` server-side and proxies the SSE stream
- Model: `grok-3-mini`
- System prompt defaults to `DEFAULT_CHAT_SYSTEM_PROMPT` in `src/data/defaults.ts`, editable at runtime via Admin → AI chat tab (stored in Firestore `content/main`)
- Three suggested question chips shown before user sends their first message

**Why:** User wanted visitors to be able to ask questions about Mattathias's portfolio and background without having to read through the whole site.

**How to apply:** If the user wants to change the chatbot model, system prompt, or behavior — edit `src/components/PortfolioChat.tsx`. If they want to add the chatbot to other pages, import `PortfolioChat` there too.
