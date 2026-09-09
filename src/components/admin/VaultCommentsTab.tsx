import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpenText, ExternalLink, FolderTree, RefreshCw, CircleCheck, CircleAlert, History } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { getVaultComments, saveVaultComments, type VaultCommentsMeta } from '@/lib/firestore';

function fmt(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(+d) ? iso : d.toLocaleString('en-GB', { timeZone: 'Africa/Addis_Ababa' }) + ' EAT';
}

/** Status card: last sync + which projects have admin edits not yet synced to disk. */
function SyncStatusCard({ data, onJump }: { data: VaultCommentsMeta; onJump: (folder: string) => void }) {
  const lastSync = data.syncedAt;
  const pending = useMemo(() => {
    if (!lastSync) return []; // never synced → nothing is "pending" yet
    return Object.entries(data.items)
      .filter(([, f]) => f.updatedAt && f.updatedAt > lastSync)
      .map(([folder, f]) => ({ folder, at: f.updatedAt! }))
      .sort((a, b) => b.at.localeCompare(a.at));
  }, [data]);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-2.5">
            {lastSync
              ? <CircleCheck className="w-4 h-4 text-emerald-500" />
              : <CircleAlert className="w-4 h-4 text-amber-500" />}
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Last sync to workspace</p>
              <p className="text-sm font-medium text-foreground">{fmt(lastSync)}</p>
            </div>
          </div>
          <Separator orientation="vertical" className="hidden sm:block h-8" />
          <div className="flex items-center gap-2.5">
            {pending.length
              ? <CircleAlert className="w-4 h-4 text-amber-500" />
              : <CircleCheck className="w-4 h-4 text-emerald-500" />}
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Pending admin edits</p>
              <p className="text-sm font-medium text-foreground">
                {pending.length
                  ? `${pending.length} project${pending.length !== 1 ? 's' : ''} — run npm run sync:vault to apply`
                  : 'All admin edits applied'}
              </p>
            </div>
          </div>
          <span className="flex-1" />
          <p className="text-[11px] text-muted-foreground max-w-xs">
            Mirrors refresh from <code>D:\Projects</code> nightly at 21:00 (sync → git snapshot),
            or on demand via <code>npm run sync:vault</code> in the Portfolio folder.
          </p>
        </div>

        {pending.length > 0 && (
          <div className="mt-3 pt-3 border-t hairline">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">
              <History className="w-3 h-3 inline mr-1 -mt-0.5" />Waiting to be written into comments.md:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {pending.map(p => (
                <button
                  key={p.folder}
                  onClick={() => onJump(p.folder)}
                  className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/5 px-2.5 py-1 text-xs text-amber-600 hover:bg-amber-500/10 transition-colors"
                  title={`edited ${fmt(p.at)}`}
                >
                  {p.folder}
                  <span className="opacity-50 font-mono text-[10px]">{fmt(p.at).slice(0, 5)}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Minimal LCS line diff for the live preview panel. */
function diffLines(a: string, b: string): { t: ' ' | '-' | '+'; s: string }[] {
  const A = (a ?? '').split('\n'), B = (b ?? '').split('\n');
  const n = A.length, m = B.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: { t: ' ' | '-' | '+'; s: string }[] = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) { out.push({ t: ' ', s: A[i++] }); j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) out.push({ t: '-', s: A[i++] });
    else out.push({ t: '+', s: B[j++] });
  }
  while (i < n) out.push({ t: '-', s: A[i++] });
  while (j < m) out.push({ t: '+', s: B[j++] });
  return out;
}

/** Collapsed diff view: changed lines with a little context, +/− gutter. */
function DiffPreview({ before, after }: { before: string; after: string }) {
  const lines = useMemo(() => {
    const d = diffLines(before ?? '', after ?? '');
    const rows: { t: ' ' | '-' | '+'; s: string }[] = [];
    let gap = 0;
    for (const x of d) {
      if (x.t === ' ') { gap++; if (gap <= 2) rows.push(x); else if (gap === 3) rows.push({ t: ' ', s: '⋯' }); }
      else { gap = 0; rows.push(x); }
    }
    return rows;
  }, [before, after]);
  const changed = lines.filter(l => l.t !== ' ' && l.s !== '⋯').length;
  if (!changed) return <p className="text-xs text-emerald-500">No changes vs the current file on disk.</p>;
  return (
    <div className="rounded-md border border-border overflow-hidden">
      <div className="max-h-64 overflow-y-auto font-mono text-[11.5px] leading-[1.5]">
        {lines.map((l, k) => (
          <div key={k} className={
            l.t === '+' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            : l.t === '-' ? 'bg-red-500/10 text-red-600 dark:text-red-400'
            : 'text-muted-foreground/50'
          }>
            <span className="inline-block w-5 text-center opacity-50 select-none">{l.t.trim() || ' '}</span>
            <span className="whitespace-pre-wrap break-all">{l.s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * VaultCommentsTab — view & edit the hand-written comments.md of every
 * workspace project (mirrored into Firestore by scripts/sync-to-vault.mjs),
 * plus a status page for the sync itself.
 */
export default function VaultCommentsTab() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['vault-comments'],
    queryFn: getVaultComments,
    staleTime: 5 * 60 * 1000,
  });

  const saveMut = useMutation({
    mutationFn: (next: Record<string, VaultCommentsMeta['items'][string]>) => saveVaultComments(next),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vault-comments'] }),
  });

  if (isLoading) {
    return <div className="flex justify-center py-20"><RefreshCw className="w-6 h-6 animate-spin text-accent" /></div>;
  }

  const items = data?.items ?? {};
  const catalog = data?.catalog ?? [];
  const folders = catalog.length ? catalog : Object.entries(items).map(([folder]) => ({ folder, doc: 'README' }));
  const current = selected ?? folders[0]?.folder ?? null;
  const entry = current ? items[current] : undefined;
  const isDirty = !!(entry?.updatedAt && data?.syncedAt && entry.updatedAt > data.syncedAt);
  const patch = (mirror: string) => {
    if (!current) return;
    saveMut.mutate({
      ...items,
      [current]: { ...(items[current] ?? {}), mirror, updatedAt: new Date().toISOString() },
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Vault Comments</h2>
        <p className="text-sm text-muted-foreground">
          Hand-written <code>comments.md</code> of every workspace project — mirrored from
          <code> D:\Projects</code> by <code>npm run sync:vault</code>. Edits here land in the
          project's real file on the next sync.
        </p>
      </div>

      {data && <SyncStatusCard data={data} onJump={setSelected} />}

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* Folder list */}
        <Card className="h-fit">
          <CardContent className="p-2">
            <ul className="max-h-[70vh] overflow-y-auto space-y-0.5">
              {folders.map(({ folder, doc }) => {
                const dirty = !!(data?.syncedAt && items[folder]?.updatedAt && items[folder].updatedAt! > data.syncedAt);
                return (
                  <li key={folder}>
                    <button
                      onClick={() => setSelected(folder)}
                      className={`w-full flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-left transition-colors ${
                        current === folder ? 'bg-accent/10 text-accent' : 'text-foreground/70 hover:bg-card hover:text-foreground'
                      }`}
                    >
                      <FolderTree className="w-3.5 h-3.5 shrink-0 opacity-60" />
                      <span className="truncate">{folder}</span>
                      {dirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="pending admin edit" />}
                      {doc && <span className="ml-auto font-mono text-[10px] opacity-40">.{doc.toLowerCase()}</span>}
                    </button>
                  </li>
                );
              })}
              {!folders.length && <li className="px-3 py-6 text-sm text-muted-foreground">Run <code>npm run sync:vault</code> once to mirror the workspace.</li>}
            </ul>
          </CardContent>
        </Card>

        {/* Editor */}
        <div className="space-y-3 min-w-0">
          {current && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-mono text-[11px]">
                  {current}/comments.md
                </Badge>
                {isDirty && (
                  <Badge variant="outline" className="text-[10px] px-1.5 border-amber-500/30 text-amber-500">
                    unsynced edit
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">mirrored {fmt(entry?.updatedAt)}</span>
                <span className="flex-1" />
                <Button variant="ghost" size="sm" asChild>
                  <a href={`obsidian://open?vault=Projects&file=00_Projects_Hub`} target="_blank" rel="noopener noreferrer">
                    <BookOpenText className="w-3.5 h-3.5 mr-1.5" /> Open in Obsidian
                  </a>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <a href={`https://github.com/Mattathiasa?tab=repositories&q=${encodeURIComponent(current)}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Folder on GitHub
                  </a>
                </Button>
              </div>
              <Textarea
                rows={16}
                value={entry?.mirror ?? ''}
                onChange={e => patch(e.target.value)}
                placeholder="No mirrored content yet — run npm run sync:vault in the Portfolio folder."
                className="font-mono text-[12.5px] leading-relaxed"
              />
              {isDirty && (
                <div className="space-y-1.5">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Diff vs the file currently on disk (what the next sync would write):
                  </p>
                  <DiffPreview before={entry?.disk ?? ''} after={entry?.mirror ?? ''} />
                </div>
              )}
              <Separator className="bg-border/50" />
              <p className="text-xs text-muted-foreground">
                Portfolio-sync & vault-comments marker blocks are stripped from this view —
                those are owned by the sync. Save here → next <code>sync:vault</code> writes your
                edits into <code>D:\Projects\{current}\comments.md</code>, and the nightly 21:00
                snapshot commits them to git.
              </p>
            </>
          )}
          {!current && (
            <Card><CardContent className="p-8 text-sm text-muted-foreground">
              No folders mirrored yet.
            </CardContent></Card>
          )}
        </div>
      </div>
    </div>
  );
}
