import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles, Trash2, Copy, Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SYSTEM_PROMPT = `You are a friendly AI assistant on Mattathias Abraham's portfolio website. You represent him and answer questions about him accurately, warmly, and in first-person when appropriate (e.g. "Matty is..." or "He..."). Never make up information — only use what is provided below.

═══════════════════════════════
WHO IS MATTATHIAS?
═══════════════════════════════
Mattathias Abraham (goes by Matty) is a software developer from Addis Ababa, Ethiopia. He finished high school at Saint Joseph School in 2019 and graduated with a BSc in Software Engineering from HiLCoE (Higher Learning College of Engineering) in 2025 with a GPA of 3.5/4.0.

He currently works at DAFTech Technologies (about 4 months in), building full-stack software and websites. He also does freelance work — he is available right now and actively looking for new opportunities. His dream job is a remote position focused on mobile app development, but he is equally capable of full-stack web development. He is also learning AI and plans to integrate AI into future projects and client solutions.

He is open to international relocation and remote work anywhere in the world.

═══════════════════════════════
WHAT HE DOES
═══════════════════════════════
- Mobile App Development (his passion — especially Flutter)
- Full-Stack Web Development (React, Next.js, Node.js, TypeScript)
- Freelance projects — he takes on client work, email him anytime
- Building software for football, anime, and music domains excites him especially
- Learning and implementing AI in software products

═══════════════════════════════
TECHNICAL SKILLS
═══════════════════════════════
Strongest skills:
- Flutter & Dart (his favourite — most passionate here)
- React Native, Expo
- React, Next.js, TypeScript, JavaScript
- Firebase (Realtime DB + Firestore)
- HTML/CSS, Tailwind CSS
- Dotnet 
- Angular

Also works with: Angular, Node.js, .NET, Java, Supabase, PostgreSQL, MongoDB, AWS, Azure, Docker, Git, Figma, Vercel, Android Studio, Xcode

═══════════════════════════════
PROJECTS
═══════════════════════════════
1. Ahaw Church Management System (web + mobile)
   - Built for Mahibere Ahaw — a planning, reporting, and finance management system
   - Currently in active development
   - Stack: React (web), Flutter (mobile), Firebase, TypeScript, Dart
   - Live web: https://mahibereahaw.vercel.app/
   - Features: 7 hierarchical user roles, real-time sync, 300+ members managed

2. Clashroller (web game)
   - A multiverse character-vs-character battle simulator featuring live-action, cartoon, and anime characters
   - Stack: React, TypeScript, Node.js, Framer Motion, Tailwind CSS
   - Live: https://mn-clashroller.vercel.app/
   - Technical highlight: custom event-driven state machine for real-time battle logic

3. Football Freestyle (content platform)
   - Matty's personal platform showcasing his football tricks, freestyles, and skill videos
   - Stack: React, TypeScript, Vite
   - Live: https://football-freestyle.vercel.app/

4. SKZPY Music Player (desktop app)
   - A cross-platform desktop music player with radar-chart "vibe ratings" and millisecond-accurate multi-language lyric synchronisation
   - Stack: Electron, React, Recharts, Zustand, Web Audio API
   - Live: https://skz-player.vercel.app/

═══════════════════════════════
WORK EXPERIENCE
═══════════════════════════════
1. DAFTech Technologies — Full Stack Developer (current, ~4 months)
   - Building full-stack software and websites
   - Working on web and mobile projects

2. African Union (AU) — IT Intern (3 months, 2024)
   - Data mining project: collected and structured data from Twitter/X for analysis
   - Built a website to parse AFP news files (AFP XML format) into readable HTML documents

3. Freelance — Mahibere Ahaw Church (ongoing since 2025)
   - Sole developer of the church's full management system (web + mobile)

═══════════════════════════════
PERSONAL INTERESTS
═══════════════════════════════
Football:
- Matty plays football and does freestyle tricks — he makes football trick shot and skill videos
- Check out his football freestyle portfolio: https://football-freestyle.vercel.app/
- He would LOVE to build software for football clubs, apps, or content platforms
- Supporter of Arsenal from 2008, die hard fan, been through a lot

Anime (his top list in order):
1. One Piece  2. Attack on Titan  3. Monster  4. JoJo's Bizarre Adventure  5. Black Clover
6. Bleach  7. Fire Force  8. Tokyo Ghoul  9. Blue Lock  10. Re:Zero
11. Dr. Stone  12. Demon Slayer  13. Chainsaw Man  14. Jujutsu Kaisen (JJK)  15. Clannad
- He would be excited to build anime-related apps or platforms
- when it comes to anime he loves psychological anime like Monster and Psycho Pass 

Music:
- Loves music broadly — would enjoy building music apps or platforms
- Mainly I love Gospel music like Forest Frank, Lecrae, KB, and such.. NF
- Also into secural music, through it is not much but love AJR, Lauv, Jon Bellion and Alec Benjamin
- slowly becoming a fan of Stray kids
- current favorite song- meant to be - bbno$
- current favorite album Ajr- OK Orchestra
- current favorite artist - Stray Kids

- If there is a questions about love interest say "sorry you are not his type"
- For physical activities other than football, he loves Volleyball and he plays as a setter
he is not too bad at table tennis though it has been a whole since he played
- 
═══════════════════════════════
CONTACT & AVAILABILITY
═══════════════════════════════
- Email: mattathiasabraham@gmail.com (best way to reach him — email anytime)
- Phone: +251 902 212 622
- GitHub: https://github.com/Mattathiasa
- LinkedIn: https://www.linkedin.com/in/mattathias-abraham-3707a0398/
- Instagram: https://www.instagram.com/mattathiasa/
- He is AVAILABLE — open to freelance, full-time remote, and contract work right now

═══════════════════════════════
COMMON QUESTIONS
═══════════════════════════════
Q: Is he available for hire?
A: Yes! Matty is available for freelance and full-time remote work. Email him at mattathiasabraham@gmail.com.

Q: What kind of work is he looking for?
A: Ideally remote mobile app development (Flutter preferred), but he also takes full-stack web projects and is expanding into AI-powered software.

Q: Does he do freelance?
A: Yes, he does freelance. Reach out at mattathiasabraham@gmail.com.

Q: What is his favourite technology?
A: Flutter — he is most passionate about mobile development with Flutter and Dart.

Q: Would he build an app for [football / anime / music]?
A: Absolutely — these are exactly the kinds of projects he gets most excited about.

═══════════════════════════════
INSTRUCTIONS FOR YOU (the AI)
═══════════════════════════════
- Keep replies to 2–4 sentences unless a list genuinely helps
- Be warm, enthusiastic, and reflect Matty's friendly personality
- If someone asks something you don't have data on, say so honestly and suggest they email mattathiasabraham@gmail.com
- Never invent projects, companies, or facts not listed above
- If someone asks about anime or football, feel free to be enthusiastic — Matty would love that
- IMPORTANT: Whenever someone asks about hiring Matty, building a project, working together, pricing, timelines, scope, or availability — always end your reply with: "You can reach him directly using the **Get in Touch** button below 👇" This is critical so visitors can easily contact him.`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
  ts: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'matty_chat_v2';
const VISITED_KEY = 'matty_chat_visited';
const MAX_CONTEXT = 10;

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi! I'm Matty's AI assistant. Ask me anything about his work, projects, or skills!",
  ts: Date.now(),
};

function loadMessages(): Message[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch { }
  return [WELCOME];
}

// ─── Markdown renderer ───────────────────────────────────────────────────────

function parseInline(text: string): React.ReactNode[] {
  const pattern = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`|\[[^\]]+\]\([^)]+\))/g;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const s = m[0];
    if (s.startsWith('**'))
      parts.push(<strong key={m.index} className="font-semibold text-foreground">{s.slice(2, -2)}</strong>);
    else if (s.startsWith('*'))
      parts.push(<em key={m.index}>{s.slice(1, -1)}</em>);
    else if (s.startsWith('`'))
      parts.push(<code key={m.index} className="px-1.5 py-0.5 rounded-md bg-secondary font-mono text-xs text-accent/90">{s.slice(1, -1)}</code>);
    else {
      const lm = s.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (lm) parts.push(<a key={m.index} href={lm[2]} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2 hover:text-accent/80 transition-colors">{lm[1]}</a>);
    }
    last = m.index + s.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function MarkdownContent({ text, streaming }: { text: string; streaming?: boolean }) {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    // Bullet list block
    if (/^[-*•] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*•] /.test(lines[i]))
        items.push(lines[i++].replace(/^[-*•] /, ''));
      nodes.push(<ul key={`ul-${i}`} className="list-disc pl-5 space-y-0.5 my-1">{items.map((it, j) => <li key={j}>{parseInline(it)}</li>)}</ul>);
      continue;
    }
    // Numbered list block
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i]))
        items.push(lines[i++].replace(/^\d+\. /, ''));
      nodes.push(<ol key={`ol-${i}`} className="list-decimal pl-5 space-y-0.5 my-1">{items.map((it, j) => <li key={j}>{parseInline(it)}</li>)}</ol>);
      continue;
    }
    // Headers
    if (line.startsWith('### ')) { nodes.push(<p key={i} className="font-semibold text-foreground mt-2">{parseInline(line.slice(4))}</p>); i++; continue; }
    if (line.startsWith('## ')) { nodes.push(<p key={i} className="font-bold text-foreground mt-2">{parseInline(line.slice(3))}</p>); i++; continue; }
    if (line.startsWith('# ')) { nodes.push(<p key={i} className="font-bold text-foreground mt-2">{parseInline(line.slice(2))}</p>); i++; continue; }
    // Empty line
    if (line.trim() === '') { i++; continue; }
    // Paragraph
    nodes.push(<p key={i}>{parseInline(line)}</p>);
    i++;
  }
  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {nodes}
      {streaming && <span className="inline-block w-0.5 h-[1em] bg-accent/80 animate-pulse rounded-full align-middle ml-0.5" />}
    </div>
  );
}

// ─── Suggestion chips ────────────────────────────────────────────────────────

const SUGGESTED = [
  'Is he available for hire?',
  'What can he build for me?',
  "What's his favourite anime?",
];

// ─── Main component ───────────────────────────────────────────────────────────

export function PortfolioChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(loadMessages);
  const [input, setInput] = useState('');
  const [streamText, setStreamText] = useState('');   // live streaming content
  const [waiting, setWaiting] = useState(false); // waiting for first chunk
  const [streaming, setStreaming] = useState(false); // stream in progress
  const [hasUnread, setHasUnread] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lastUserMsg, setLastUserMsg] = useState('');   // for retry

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const msgAreaRef = useRef<HTMLDivElement>(null);

  const busy = waiting || streaming;

  // ── Persist messages ──────────────────────────────────────────────────────
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch { }
  }, [messages]);

  // ── Auto-open on first visit (3 s delay) ─────────────────────────────────
  useEffect(() => {
    if (!localStorage.getItem(VISITED_KEY)) {
      const t = setTimeout(() => {
        setOpen(true);
        localStorage.setItem(VISITED_KEY, '1');
      }, 3000);
      return () => clearTimeout(t);
    }
  }, []);

  // ── Unread dot ────────────────────────────────────────────────────────────
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!open && last?.role === 'assistant' && messages.length > 1) setHasUnread(true);
  }, [messages, open]);

  useEffect(() => { if (open) setHasUnread(false); }, [open]);

  // ── Scroll to bottom ──────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamText, waiting]);

  // ── Focus input on open ───────────────────────────────────────────────────
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  // ── Clear chat ────────────────────────────────────────────────────────────
  const clearChat = useCallback(() => {
    abortRef.current?.abort();
    setMessages([WELCOME]);
    setStreamText('');
    setWaiting(false);
    setStreaming(false);
    try { localStorage.removeItem(STORAGE_KEY); } catch { }
  }, []);

  // ── Copy message ──────────────────────────────────────────────────────────
  const copyMsg = useCallback((id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }, []);

  // ── Send / stream ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: trimmed, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLastUserMsg(trimmed);
    setWaiting(true);

    // Context trimming — last MAX_CONTEXT messages
    const context = messages.slice(-MAX_CONTEXT).map(m => ({ role: m.role, content: m.content }));

    const payload = {
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...context,
        { role: 'user', content: trimmed },
      ],
      max_tokens: 500,
      temperature: 0.7,
      stream: true,
    };

    abortRef.current = new AbortController();

    try {
      const devKey = import.meta.env.VITE_GROK_API_KEY;
      const res = await fetch(
        devKey ? 'https://api.groq.com/openai/v1/chat/completions' : '/api/chat',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(devKey ? { Authorization: `Bearer ${devKey}` } : {}),
          },
          body: JSON.stringify(payload),
          signal: abortRef.current.signal,
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message ?? `HTTP ${res.status}`);
      }

      setWaiting(false);
      setStreaming(true);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const delta = JSON.parse(data).choices?.[0]?.delta?.content ?? '';
            if (delta) { full += delta; setStreamText(full); }
          } catch { }
        }
      }

      setMessages(prev => [...prev, {
        id: Date.now().toString(), role: 'assistant', content: full || '…', ts: Date.now(),
      }]);
      setStreamText('');
      setStreaming(false);
      setLastUserMsg('');

    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setWaiting(false);
      setStreaming(false);
      setStreamText('');
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Sorry, I couldn't connect right now. Tap **Retry** or email Matty at mattathiasabraham@gmail.com",
        isError: true,
        ts: Date.now(),
      }]);
    }
  }, [busy, messages]);

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const showSuggestions = messages.length === 1 && !busy;
  const overLimit = input.length > 400;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── FAB ── */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Pulse ring — shown on first visit until opened */}
        {!open && !localStorage.getItem(VISITED_KEY) && (
          <span className="absolute inset-0 rounded-full bg-accent/40 animate-ping" />
        )}
        <motion.button
          className="relative w-14 h-14 rounded-full bg-accent text-accent-foreground shadow-[0_8px_32px_hsl(var(--accent)/0.4)] flex items-center justify-center"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setOpen(v => !v)}
          aria-label={open ? 'Close chat' : 'Open chat'}
        >
          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}>
                <X className="w-6 h-6" />
              </motion.span>
            ) : (
              <motion.span key="msg" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }}>
                <MessageCircle className="w-6 h-6" />
              </motion.span>
            )}
          </AnimatePresence>
          {/* Unread dot */}
          {hasUnread && !open && (
            <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-green-400 border-2 border-background" />
          )}
        </motion.button>
      </div>

      {/* ── Chat panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed z-50 flex flex-col bottom-[5.5rem] right-3 left-3 sm:left-auto sm:right-6 sm:w-[420px] max-h-[78dvh] sm:max-h-[74vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[hsl(var(--background)/0.98)] backdrop-blur-2xl"
          >

            {/* ── Header ── */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30 bg-secondary/20 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground leading-tight">Matty's AI</p>
                <p className="text-[11px] text-muted-foreground">
                  {busy ? <span className="text-accent/80">Thinking…</span> : 'Ask about his portfolio'}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={clearChat}
                  title="Clear conversation"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── Messages ── */}
            <div
              ref={msgAreaRef}
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 space-y-5
                         [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-border/40
                         [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
            >
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start items-start'}`}
                >
                  {/* Assistant avatar */}
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-accent" />
                    </div>
                  )}

                  {/* Bubble / text */}
                  <div className={`group relative ${msg.role === 'user' ? 'max-w-[82%]' : 'flex-1 min-w-0'}`}>
                    {msg.role === 'user' ? (
                      /* User — accent bubble */
                      <div className="bg-accent text-accent-foreground rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed break-words">
                        {msg.content}
                      </div>
                    ) : (
                      /* Assistant — no bubble, clean text like Claude */
                      <div className="text-foreground pr-6">
                        <MarkdownContent text={msg.content} />
                        {msg.isError && lastUserMsg && (
                          <button
                            onClick={() => sendMessage(lastUserMsg)}
                            className="mt-2 flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" /> Retry
                          </button>
                        )}
                      </div>
                    )}

                    {/* Copy button — assistant only, appears on hover */}
                    {msg.role === 'assistant' && (
                      <button
                        onClick={() => copyMsg(msg.id, msg.content)}
                        className="absolute top-0 right-0 w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground hover:bg-secondary transition-all"
                        title="Copy"
                      >
                        {copiedId === msg.id
                          ? <Check className="w-3 h-3 text-green-400" />
                          : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Streaming message */}
              {(waiting || streaming) && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 items-start"
                >
                  <div className="w-7 h-7 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0 text-foreground">
                    {waiting ? (
                      /* Waiting for first chunk — 3 dots */
                      <div className="flex gap-1 items-center pt-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent/50 animate-bounce [animation-delay:0ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-accent/50 animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-accent/50 animate-bounce [animation-delay:300ms]" />
                      </div>
                    ) : (
                      /* Streaming — live markdown with cursor */
                      <MarkdownContent text={streamText} streaming />
                    )}
                  </div>
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* ── Suggestion chips ── */}
            {showSuggestions && (
              <div className="px-4 pb-2 pt-1 flex flex-wrap gap-1.5 shrink-0">
                {SUGGESTED.map(q => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-xs px-3 py-1.5 rounded-full border border-accent/25 text-accent/90 bg-accent/5 hover:bg-accent/15 active:bg-accent/20 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* ── Contact CTA ── */}
            <div className="px-4 pb-3 shrink-0">
              <a
                href="/#contact"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-accent/8 border border-accent/20 text-accent/90 text-xs font-medium hover:bg-accent/15 active:bg-accent/25 transition-colors"
              >
                Want Matty to build something? <span className="font-semibold">Get in Touch →</span>
              </a>
            </div>

            {/* ── Input ── */}
            <div className="flex flex-col gap-1.5 px-4 pb-4 shrink-0 border-t border-border/20 pt-3">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={onKey}
                  placeholder="Message Matty's AI…"
                  disabled={busy}
                  maxLength={600}
                  className={`flex-1 h-10 px-3.5 rounded-xl text-sm bg-secondary/30 border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 transition-colors disabled:opacity-50 ${overLimit ? 'border-destructive/50 focus:ring-destructive/50' : 'border-border/40 focus:ring-accent/50'
                    }`}
                />
                <Button
                  size="icon"
                  className="h-10 w-10 bg-accent text-accent-foreground hover:bg-accent/90 shrink-0 rounded-xl disabled:opacity-40"
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || busy || overLimit}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              {/* Char counter */}
              {input.length > 200 && (
                <p className={`text-right text-[11px] ${overLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {input.length} / 600
                </p>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
