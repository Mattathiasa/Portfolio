import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpenText, ExternalLink, FolderTree, CircleCheck, CircleAlert, RefreshCw, LogOut, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getVaultComments } from '@/lib/firestore';

/**
 * DevLog — PRIVATE page (/devlog): the hand-written comments.md of every
 * workspace project, mirrored into Firestore by scripts/sync-to-vault.mjs.
 * Same SHA-256 password gate + session key as /admin.
 */
const SESSION_KEY = 'portfolio_admin_auth'; // shared with /admin

function sha256Hex(s: string): Promise<string> {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(buf =>
    Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
  );
}

function Gate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === 'true');
  const [pw, setPw] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    const prev = document.title;
    document.title = 'Dev Log · Mattathias Abraham';
    return () => { document.title = prev; };
  }, []);

  if (authed) return <>{children}</>;
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-foreground">
            <Lock className="w-4 h-4 text-accent" />
            <span className="font-mono text-sm">private dev log</span>
          </div>
          <Input
            type="password"
            placeholder="Password"
            value={pw}
            onChange={e => { setPw(e.target.value); setError(false); }}
            onKeyDown={async e => {
              if (e.key !== 'Enter') return;
              if (await sha256Hex(pw) === import.meta.env.VITE_ADMIN_HASH) {
                sessionStorage.setItem(SESSION_KEY, 'true');
                setAuthed(true);
              } else setError(true);
            }}
          />
          {error && <p className="text-xs text-destructive">Incorrect password.</p>}
          <Button className="w-full" onClick={async () => {
            if (await sha256Hex(pw) === import.meta.env.VITE_ADMIN_HASH) {
              sessionStorage.setItem(SESSION_KEY, 'true');
              setAuthed(true);
            } else setError(true);
          }}>Enter</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function fmtDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(+d) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Render mirrored markdown (headings, bullets, checkboxes, bold) without a md dependency. */
function Mirrored({ text }: { text: string }) {
  const lines = useMemo(() => (text ?? '').split('\n'), [text]);
  return (
    <div className="space-y-1 text-sm">
      {lines.map((raw, i) => {
        const l = raw.trimEnd();
        if (!l.trim()) return <div key={i} className="h-1.5" />;
        if (l.startsWith('# ')) return <h3 key={i} className="text-base font-semibold text-foreground pt-1">{l.slice(2)}</h3>;
        if (l.startsWith('## ')) return <h4 key={i} className="text-sm font-semibold text-accent pt-1">{l.slice(3)}</h4>;
        const cb = l.match(/^- \[( |x)\] (.*)$/);
        if (cb) return (
          <div key={i} className="flex items-start gap-2">
            <span className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded-sm border ${cb[1] === 'x' ? 'border-accent bg-accent/20' : 'border-border'}`} />
            <span className={cb[1] === 'x' ? 'line-through text-muted-foreground' : 'text-foreground/80'}>{cb[2]}</span>
          </div>
        );
        if (l.startsWith('- ')) return <div key={i} className="flex items-start gap-2"><span className="text-accent mt-0.5">•</span><span className="text-foreground/80">{l.slice(2)}</span></div>;
        return <p key={i} className="text-foreground/80">{l.replace(/\*\*/g, '')}</p>;
      })}
    </div>
  );
}

function DevLogContent() {
  const { data, isLoading } = useQuery({
    queryKey: ['vault-comments'],
    queryFn: getVaultComments,
    staleTime: 5 * 60 * 1000,
  });
  const logout = () => { sessionStorage.removeItem(SESSION_KEY); location.reload(); };

  if (isLoading) {
    return <div className="flex justify-center py-24"><RefreshCw className="w-6 h-6 animate-spin text-accent" /></div>;
  }

  const items = data?.items ?? {};
  const catalog = data?.catalog ?? [];
  const folders = catalog.length ? catalog : Object.entries(items).map(([f]) => ({ folder: f, doc: 'README' }));
  const pendingCount = Object.entries(items)
    .filter(([, f]) => data?.syncedAt && f.updatedAt && f.updatedAt > data.syncedAt).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 border-b hairline bg-[rgba(14,25,29,0.85)] backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="font-mono text-[13px] text-foreground">dev log</span>
            {pendingCount > 0 && (
              <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-500">
                {pendingCount} unsynced
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" asChild>
              <a href="/admin"><Lock className="w-3.5 h-3.5 mr-1.5" /> Admin</a>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href="/"><ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Site</a>
            </Button>
            <button onClick={logout} className="font-mono text-[11px] uppercase tracking-wide text-foreground/45 hover:text-destructive px-2 py-1.5 flex items-center gap-1.5">
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-6 py-6">
        {data?.syncedAt && (
          <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1.5">
            {pendingCount ? <CircleAlert className="w-3.5 h-3.5 text-amber-500" /> : <CircleCheck className="w-3.5 h-3.5 text-emerald-500" />}
            {pendingCount
              ? `${pendingCount} project${pendingCount !== 1 ? 's' : ''} edited since the last sync (${fmtDate(data.syncedAt)}) — run npm run sync:vault to publish them here.`
              : `Synced ${fmtDate(data.syncedAt)} — up to date with the workspace.`}
          </p>
        )}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {folders.map(({ folder, doc }) => {
            const entry = items[folder];
            const dirty = !!(data?.syncedAt && entry?.updatedAt && entry.updatedAt > data.syncedAt);
            return (
              <Card key={folder} className="flex flex-col">
                <CardContent className="p-4 flex-1 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <FolderTree className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span className="font-mono text-[12px] text-foreground truncate">{folder}</span>
                    {dirty && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="edited since last sync" />}
                  </div>
                  <div className="flex-1 max-h-72 overflow-y-auto pr-1">
                    <Mirrored text={entry?.mirror ?? ''} />
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground flex items-center justify-between">
                    <span>{doc ? `.${doc.toLowerCase()}` : ''}{entry?.updatedAt ? ` · ${fmtDate(entry.updatedAt)}` : ''}</span>
                    <a
                      className="inline-flex items-center gap-1 hover:text-accent transition-colors"
                      href={`https://github.com/Mattathiasa?tab=repositories&q=${encodeURIComponent(folder)}`}
                      target="_blank" rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-3 h-3" /> repo
                    </a>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {!folders.length && (
            <p className="text-sm text-muted-foreground">Nothing mirrored yet — run <code>npm run sync:vault</code>.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DevLog() {
  return <Gate><DevLogContent /></Gate>;
}
