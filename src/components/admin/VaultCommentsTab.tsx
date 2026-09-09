import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpenText, ExternalLink, FolderTree, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { getVaultComments, saveVaultComments, type VaultCommentsFile } from '@/lib/firestore';

/**
 * VaultCommentsTab — view & edit the hand-written comments.md of every
 * workspace project (mirrored into Firestore by
 * Portfolio/scripts/sync-to-vault.mjs). Edits here are pushed into the
 * project's comments.md on the next sync run.
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
    mutationFn: (next: Record<string, VaultCommentsFile>) => saveVaultComments(next),
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
  const patch = (mirror: string) => {
    if (!current) return;
    saveMut.mutate({
      ...items,
      [current]: { ...(items[current] ?? {}), mirror, updatedAt: new Date().toISOString() },
    });
  };

  const fmt = (iso?: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(+d) ? iso : d.toLocaleString('en-GB', { timeZone: 'Africa/Addis_Ababa' });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Vault Comments</h2>
          <p className="text-sm text-muted-foreground">
            Hand-written <code>comments.md</code> of every workspace project — mirrored from
            <code> D:\Projects</code> by <code>npm run sync:vault</code>. Edits here land in the
            project's real file on the next sync.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* Folder list */}
        <Card className="h-fit">
          <CardContent className="p-2">
            <ul className="max-h-[70vh] overflow-y-auto space-y-0.5">
              {folders.map(({ folder, doc }) => (
                <li key={folder}>
                  <button
                    onClick={() => setSelected(folder)}
                    className={`w-full flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-left transition-colors ${
                      current === folder ? 'bg-accent/10 text-accent' : 'text-foreground/70 hover:bg-card hover:text-foreground'
                    }`}
                  >
                    <FolderTree className="w-3.5 h-3.5 shrink-0 opacity-60" />
                    <span className="truncate">{folder}</span>
                    {doc && <span className="ml-auto font-mono text-[10px] opacity-40">.{doc.toLowerCase()}</span>}
                  </button>
                </li>
              ))}
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
                rows={22}
                value={entry?.mirror ?? ''}
                onChange={e => patch(e.target.value)}
                placeholder="No mirrored content yet — run npm run sync:vault in the Portfolio folder."
                className="font-mono text-[12.5px] leading-relaxed"
              />
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
