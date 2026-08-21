import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import * as fb from '@/lib/firestore';
import type { Testimonial, Certification } from '@/types/portfolio';
import { DEFAULT_TESTIMONIALS, DEFAULT_CERTIFICATIONS } from '@/data/defaults';

// ── Testimonials Tab ──────────────────────────────────────────────────────────

export function TestimonialsTab() {
  const qc = useQueryClient();
  const [items, setItems] = useState<Testimonial[]>(DEFAULT_TESTIMONIALS);

  const { data: saved, isLoading } = useQuery({
    queryKey: ['testimonials'],
    queryFn: fb.getTestimonials,
    staleTime: 5 * 60 * 1000,
  });
  useEffect(() => { if (saved && saved.length > 0) setItems(saved); }, [saved]);

  const saveMut = useMutation({
    mutationFn: () => fb.saveTestimonials(items),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['testimonials'] });
      toast.success('Testimonials saved!');
    },
    onError: (err) => toast.error(`Failed: ${(err as Error).message}`),
  });

  const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const patch = (id: string, p: Partial<Testimonial>) =>
    setItems(prev => prev.map(t => t.id === id ? { ...t, ...p } : t));

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground">Testimonials shown in the &ldquo;What People Say&rdquo; section on the homepage.</p>
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
          {saveMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save
        </Button>
      </div>

      {items.map((t, idx) => (
        <Card key={t.id} className="glass-card border-accent/10">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground truncate max-w-[70%]">{t.author || 'New Testimonial'}</span>
              <div className="flex items-center gap-1">
                <Button
                  size="icon" variant="ghost" className="w-7 h-7"
                  disabled={idx === 0}
                  onClick={() => {
                    const next = [...items];
                    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                    setItems(next.map((x, i) => ({ ...x, order: i })));
                  }}
                >
                  <ChevronLeft className="w-3.5 h-3.5 -rotate-90" />
                </Button>
                <Button
                  size="icon" variant="ghost" className="w-7 h-7"
                  disabled={idx === items.length - 1}
                  onClick={() => {
                    const next = [...items];
                    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                    setItems(next.map((x, i) => ({ ...x, order: i })));
                  }}
                >
                  <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                </Button>
                <Button size="icon" variant="ghost" className="hover:text-destructive" onClick={() => setItems(prev => prev.filter(x => x.id !== t.id))}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Quote</Label>
              <Textarea rows={3} value={t.quote} onChange={e => patch(t.id!, { quote: e.target.value })} placeholder="What they said about you..." />
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Author Name</Label>
                <Input className="h-8 text-sm" value={t.author} onChange={e => patch(t.id!, { author: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Role / Title</Label>
                <Input className="h-8 text-sm" value={t.role} onChange={e => patch(t.id!, { role: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Company</Label>
                <Input className="h-8 text-sm" value={t.company ?? ''} onChange={e => patch(t.id!, { company: e.target.value })} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" className="w-full border-dashed border-accent/30 text-muted-foreground hover:text-foreground"
        onClick={() => setItems(prev => [...prev, { id: uid(), quote: '', author: '', role: '', company: '', order: prev.length }])}>
        <Plus className="w-4 h-4 mr-2" /> Add Testimonial
      </Button>
    </div>
  );
}

// ── Certifications Tab ────────────────────────────────────────────────────────

export function CertificationsTab() {
  const qc = useQueryClient();
  const [items, setItems] = useState<Certification[]>(DEFAULT_CERTIFICATIONS);

  const { data: saved, isLoading } = useQuery({
    queryKey: ['certifications'],
    queryFn: fb.getCertifications,
    staleTime: 5 * 60 * 1000,
  });
  useEffect(() => { if (saved && saved.length > 0) setItems(saved); }, [saved]);

  const saveMut = useMutation({
    mutationFn: () => fb.saveCertifications(items),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['certifications'] });
      toast.success('Certifications saved!');
    },
    onError: (err) => toast.error(`Failed: ${(err as Error).message}`),
  });

  const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const patch = (id: string, p: Partial<Certification>) =>
    setItems(prev => prev.map(c => c.id === id ? { ...c, ...p } : c));

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground">Education &amp; certifications shown on the homepage.</p>
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
          {saveMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save
        </Button>
      </div>

      {items.map((c, idx) => (
        <Card key={c.id} className="glass-card border-accent/10">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground truncate max-w-[70%]">{c.name || 'New Certification'}</span>
              <div className="flex items-center gap-1">
                <Button
                  size="icon" variant="ghost" className="w-7 h-7"
                  disabled={idx === 0}
                  onClick={() => {
                    const next = [...items];
                    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                    setItems(next.map((x, i) => ({ ...x, order: i })));
                  }}
                >
                  <ChevronLeft className="w-3.5 h-3.5 -rotate-90" />
                </Button>
                <Button
                  size="icon" variant="ghost" className="w-7 h-7"
                  disabled={idx === items.length - 1}
                  onClick={() => {
                    const next = [...items];
                    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                    setItems(next.map((x, i) => ({ ...x, order: i })));
                  }}
                >
                  <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                </Button>
                <Button size="icon" variant="ghost" className="hover:text-destructive" onClick={() => setItems(prev => prev.filter(x => x.id !== c.id))}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Name / Degree</Label>
                <Input className="h-8 text-sm" value={c.name} onChange={e => patch(c.id!, { name: e.target.value })} placeholder="BSc Software Engineering" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Issuer / School</Label>
                <Input className="h-8 text-sm" value={c.issuer} onChange={e => patch(c.id!, { issuer: e.target.value })} placeholder="University or org name" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Date</Label>
                <Input className="h-8 text-sm" value={c.date} onChange={e => patch(c.id!, { date: e.target.value })} placeholder="2025" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Credential URL <span className="font-normal">(optional)</span></Label>
                <Input className="h-8 text-sm" value={c.url ?? ''} onChange={e => patch(c.id!, { url: e.target.value })} placeholder="https://..." />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" className="w-full border-dashed border-accent/30 text-muted-foreground hover:text-foreground"
        onClick={() => setItems(prev => [...prev, { id: uid(), name: '', issuer: '', date: '', url: '', order: prev.length }])}>
        <Plus className="w-4 h-4 mr-2" /> Add Certification
      </Button>
    </div>
  );
}
