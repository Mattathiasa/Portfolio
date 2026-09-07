import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { Copy, Check, RotateCcw } from 'lucide-react';
import { useContent } from '@/hooks/useContent';

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

function welcomeMessage(content: string): Message {
  return { id: 'welcome', role: 'assistant', content, ts: Date.now() };
}

function loadMessages(fallbackWelcome: string): Message[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch { }
  return [welcomeMessage(fallbackWelcome)];
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
      parts.push(<strong key={m.index} className="font-medium text-foreground">{s.slice(2, -2)}</strong>);
    else if (s.startsWith('*'))
      parts.push(<em key={m.index}>{s.slice(1, -1)}</em>);
    else if (s.startsWith('`'))
      parts.push(<code key={m.index} className="px-1.5 py-0.5 rounded bg-background font-mono text-xs text-accent/90">{s.slice(1, -1)}</code>);
    else {
      const lm = s.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (lm) parts.push(<a key={m.index} href={lm[2]} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2 hover:text-accent-hover transition-colors">{lm[1]}</a>);
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
    if (line.startsWith('### ')) { nodes.push(<p key={i} className="font-medium text-foreground mt-2">{parseInline(line.slice(4))}</p>); i++; continue; }
    if (line.startsWith('## ')) { nodes.push(<p key={i} className="font-medium text-foreground mt-2">{parseInline(line.slice(3))}</p>); i++; continue; }
    if (line.startsWith('# ')) { nodes.push(<p key={i} className="font-medium text-foreground mt-2">{parseInline(line.slice(2))}</p>); i++; continue; }
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

// ─── Avatar ──────────────────────────────────────────────────────────────────

const Avatar = ({ size }: { size: number }) => (
  <span
    className="flex shrink-0 items-center justify-center rounded-full border border-accent/50 font-serif italic text-accent"
    style={{ width: size, height: size, fontSize: size * 0.55 }}
    aria-hidden
  >
    m
  </span>
);

// ─── Main component ───────────────────────────────────────────────────────────

export function PortfolioChat() {
  const { c } = useContent();

  const chatWelcome = c('chatWelcome');
  const suggestions = c('chatSuggestions');

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => loadMessages(chatWelcome));
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

  const busy = waiting || streaming;

  // ── Persist messages ──────────────────────────────────────────────────────
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch { }
  }, [messages]);

  // ── Sync the untouched welcome message once Firestore copy loads ──────────
  useEffect(() => {
    setMessages(prev =>
      prev.length === 1 && prev[0].id === 'welcome' && prev[0].content !== chatWelcome
        ? [welcomeMessage(chatWelcome)]
        : prev
    );
  }, [chatWelcome]);

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
    setMessages([welcomeMessage(chatWelcome)]);
    setStreamText('');
    setWaiting(false);
    setStreaming(false);
    try { localStorage.removeItem(STORAGE_KEY); } catch { }
  }, [chatWelcome]);

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
        { role: 'system', content: c('chatSystemPrompt') },
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
  }, [busy, messages, c]);

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
        {/* Ping ring — shown on first visit until opened */}
        {!open && !localStorage.getItem(VISITED_KEY) && (
          <span
            className="absolute inset-0 rounded-full bg-accent/40"
            style={{ animation: 'fab-ping 1.8s ease-out infinite' }}
            aria-hidden
          />
        )}
        <button
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-[0_8px_32px_hsl(var(--accent)/0.35)] transition-transform duration-200 hover:scale-105 active:scale-95"
          onClick={() => setOpen(v => !v)}
          aria-label={open ? 'Close chat' : 'Open chat'}
        >
          {open ? (
            <span className="text-lg leading-none" aria-hidden>✕</span>
          ) : (
            <span className="font-serif text-2xl italic leading-none" aria-hidden>m</span>
          )}
          {/* Unread dot */}
          {hasUnread && !open && (
            <span className="absolute right-1 top-1 h-3 w-3 rounded-full border-2 border-background bg-success" />
          )}
        </button>
      </div>

      {/* ── Chat panel ── */}
      {open && (
        <div
          className="fixed bottom-[5.5rem] left-3 right-3 z-50 flex max-h-[min(72vh,640px)] flex-col overflow-hidden rounded-lg border hairline bg-[rgba(17,32,37,0.96)] shadow-2xl backdrop-blur-xl sm:left-auto sm:right-6 sm:w-[420px]"
          style={{ animation: 'panelin 0.25s cubic-bezier(0.16,1,0.3,1)' }}
        >
          {/* ── Header ── */}
          <div className="flex shrink-0 items-center gap-3 border-b hairline px-4 py-3">
            <Avatar size={32} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-tight text-foreground">{c('chatTitle')}</p>
              <p className="font-mono text-[11px] text-foreground/55">
                {busy ? <span className="text-accent/80">Thinking…</span> : c('chatSubtitle')}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={clearChat}
                title="Clear conversation"
                className="rounded px-2 py-1 font-mono text-[11px] uppercase tracking-[0.06em] text-foreground/45 transition-colors hover:text-destructive"
              >
                clear
              </button>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="flex h-7 w-7 items-center justify-center rounded text-foreground/55 transition-colors hover:text-foreground"
              >
                ✕
              </button>
            </div>
          </div>

          {/* ── Messages ── */}
          <div
            className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-4
                       [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-foreground/20
                       [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
          >
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'items-start justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <span className="mt-0.5">
                    <Avatar size={26} />
                  </span>
                )}

                {/* Bubble / text */}
                <div className={`group relative ${msg.role === 'user' ? 'max-w-[82%]' : 'min-w-0 flex-1'}`}>
                  {msg.role === 'user' ? (
                    <div className="break-words rounded-[14px_14px_4px_14px] bg-accent px-4 py-2.5 text-sm leading-relaxed text-accent-foreground">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="pr-6 text-foreground/85">
                      <MarkdownContent text={msg.content} />
                      {msg.isError && lastUserMsg && (
                        <button
                          onClick={() => sendMessage(lastUserMsg)}
                          className="mt-2 flex items-center gap-1 text-xs text-accent transition-colors hover:text-accent-hover"
                        >
                          <RotateCcw className="h-3 w-3" /> Retry
                        </button>
                      )}
                    </div>
                  )}

                  {/* Copy button — assistant only, appears on hover */}
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => copyMsg(msg.id, msg.content)}
                      className="absolute right-0 top-0 flex h-6 w-6 items-center justify-center rounded text-foreground/40 opacity-0 transition-all hover:text-foreground group-hover:opacity-100"
                      title="Copy"
                    >
                      {copiedId === msg.id
                        ? <Check className="h-3 w-3 text-success" />
                        : <Copy className="h-3 w-3" />}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Streaming message */}
            {(waiting || streaming) && (
              <div className="flex items-start gap-3">
                <span className="mt-0.5">
                  <Avatar size={26} />
                </span>
                <div className="min-w-0 flex-1 text-foreground/85">
                  {waiting ? (
                    <div className="flex items-center gap-1 pt-1.5">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent/50 [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent/50 [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent/50 [animation-delay:300ms]" />
                    </div>
                  ) : (
                    <MarkdownContent text={streamText} streaming />
                  )}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* ── Suggestion pills ── */}
          {showSuggestions && (
            <div className="flex shrink-0 flex-wrap gap-1.5 px-4 pb-2 pt-1">
              {suggestions.map(q => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="rounded-full border border-accent/30 bg-accent/5 px-3 py-1.5 text-xs text-accent/90 transition-colors hover:bg-accent/15 active:bg-accent/20"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* ── Contact CTA ── */}
          <div className="shrink-0 px-4 pb-3">
            <a
              href="/#contact"
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center gap-1.5 rounded-md border border-accent/25 bg-accent/5 py-2 text-xs text-accent/90 transition-colors hover:bg-accent/15 active:bg-accent/20"
            >
              {c('chatCta')}
            </a>
          </div>

          {/* ── Input ── */}
          <div className="flex shrink-0 flex-col gap-1.5 border-t hairline px-4 pb-4 pt-3">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={onKey}
                placeholder={c('chatPlaceholder')}
                disabled={busy}
                maxLength={600}
                className={`h-[42px] flex-1 rounded-md border bg-background px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/35 disabled:opacity-50 ${
                  overLimit ? 'border-destructive/60' : 'border-foreground/15 focus:border-accent'
                }`}
              />
              <button
                className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-40"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || busy || overLimit}
                aria-label="Send message"
              >
                ↑
              </button>
            </div>
            {/* Char counter */}
            {input.length > 200 && (
              <p className={`text-right font-mono text-[11px] ${overLimit ? 'text-destructive' : 'text-foreground/45'}`}>
                {input.length} / 600
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
