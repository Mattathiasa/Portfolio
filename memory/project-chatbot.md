---
name: project-chatbot
description: Portfolio AI chatbot using Grok (xAI) API, floats on bottom-right of the main portfolio page
metadata:
  type: project
---

A floating chatbot widget lives at `src/components/PortfolioChat.tsx`, rendered inside `src/pages/Index.tsx` after the loading screen completes.

**Implementation details:**
- Calls `https://api.x.ai/v1/chat/completions` directly from the client using `VITE_GROK_API_KEY` (OpenAI-compatible API)
- Model: `grok-3-mini`
- System prompt is hardcoded in the component with all portfolio data from `defaults.ts`
- API key lives in `.env` (gitignored) as `VITE_GROK_API_KEY`
- Three suggested question chips shown before user sends their first message

**Why:** User wanted visitors to be able to ask questions about Mattathias's portfolio and background without having to read through the whole site.

**How to apply:** If the user wants to change the chatbot model, system prompt, or behavior — edit `src/components/PortfolioChat.tsx`. If they want to add the chatbot to other pages, import `PortfolioChat` there too.
