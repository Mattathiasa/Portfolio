import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChevronRight, Loader2 } from 'lucide-react';
import { getContent, saveContent } from '@/lib/firestore';
import { DEFAULT_CONTENT } from '@/data/defaults';
import type { PortfolioContent } from '@/types/portfolio';

// Both tabs write PARTIAL updates to content/main (saveContent merges), so
// they never stomp fields owned by other tabs.

type CopyForm = Partial<PortfolioContent>;

function usePartialContentForm(keys: readonly (keyof PortfolioContent)[]) {
  const qc = useQueryClient();
  const [form, setForm] = useState<CopyForm>(() =>
    Object.fromEntries(
      keys.map((k) => [k, DEFAULT_CONTENT[k as keyof typeof DEFAULT_CONTENT] ?? ''])
    ) as CopyForm
  );

  const { data: saved, isLoading } = useQuery({
    queryKey: ['content'],
    queryFn: getContent,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!saved) return;
    setForm((prev) => {
      const next = { ...prev };
      for (const k of keys) {
        const v = saved[k];
        if (v !== undefined && v !== null) (next as Record<string, unknown>)[k] = v;
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved]);

  const saveMut = useMutation({
    mutationFn: (payload: CopyForm) => saveContent(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['content'] });
      toast.success('Saved! Changes are live after a refresh.');
    },
    onError: (err) => toast.error(`Failed: ${(err as Error).message}`),
  });

  const set = <K extends keyof PortfolioContent>(k: K, v: PortfolioContent[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  return { form, set, saveMut, isLoading };
}

// ── Field helpers ────────────────────────────────────────────────────────────

interface FieldSpec {
  key: keyof PortfolioContent;
  label: string;
  rows?: number; // textarea when set
  full?: boolean;
  hint?: string;
}

function CopyCard({
  title,
  hint,
  fields,
  form,
  set,
}: {
  title: string;
  hint?: string;
  fields: FieldSpec[];
  form: CopyForm;
  set: <K extends keyof PortfolioContent>(k: K, v: PortfolioContent[K]) => void;
}) {
  return (
    <Card className="glass-card border-accent/10">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-accent" /> {title}
        </CardTitle>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.key} className={`space-y-2 ${f.full || f.rows ? 'sm:col-span-2' : ''}`}>
              <Label>
                {f.label}
                {f.hint && <span className="text-muted-foreground font-normal"> ({f.hint})</span>}
              </Label>
              {f.rows ? (
                <Textarea
                  rows={f.rows}
                  value={(form[f.key] as string) ?? ''}
                  onChange={(e) => set(f.key, e.target.value as never)}
                />
              ) : (
                <Input
                  value={(form[f.key] as string) ?? ''}
                  onChange={(e) => set(f.key, e.target.value as never)}
                />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const Saving = ({ pending }: { pending: boolean }) =>
  pending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null;

// ── Site copy tab ────────────────────────────────────────────────────────────

const SITE_COPY_KEYS = [
  'brandLabel', 'navWork', 'navAbout', 'navExperience', 'navStack', 'navContact', 'navResume', 'navHire',
  'heroHeadline', 'heroCtaPrimary', 'heroCtaSecondary', 'heroTimezone',
  'workHeading', 'workHardPartLabel', 'workLiveLabel', 'workSourceLabel', 'workMoreText',
  'aboutIndexLabel', 'aboutCta', 'experienceHeading', 'experienceIndexLabel', 'educationBadge',
  'skillsHeading', 'skillsIndexLabel',
  'contactIndexLabel', 'contactHeading', 'formHeading', 'formIntro', 'formName', 'formEmail',
  'formSubject', 'formMessage', 'formSubmit', 'formSuccess', 'formError',
  'elsewhereLabel', 'directLabel', 'footerCredit',
] as const;

export function SiteCopyTab() {
  const { form, set, saveMut, isLoading } = usePartialContentForm(SITE_COPY_KEYS);

  if (isLoading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );

  return (
    <div className="space-y-6 max-w-2xl">
      <p className="text-sm text-muted-foreground">
        Every heading, label and button on the homepage. Wrap a word in *asterisks* for the lime
        italic accent.
      </p>

      <CopyCard
        title="Navigation"
        form={form}
        set={set}
        fields={[
          { key: 'brandLabel', label: 'Brand label' },
          { key: 'navWork', label: 'Work' },
          { key: 'navAbout', label: 'About' },
          { key: 'navExperience', label: 'Experience' },
          { key: 'navStack', label: 'Stack' },
          { key: 'navContact', label: 'Contact' },
          { key: 'navResume', label: 'Résumé' },
          { key: 'navHire', label: 'Hire button' },
        ]}
      />

      <CopyCard
        title="Hero"
        hint="*asterisks* → lime italic accent"
        form={form}
        set={set}
        fields={[
          { key: 'heroHeadline', label: 'Headline', rows: 2 },
          { key: 'heroCtaPrimary', label: 'Primary button' },
          { key: 'heroCtaSecondary', label: 'Secondary button' },
          { key: 'heroTimezone', label: 'Timezone', hint: 'shown after your location' },
        ]}
      />

      <CopyCard
        title="Work section"
        form={form}
        set={set}
        fields={[
          { key: 'workHeading', label: 'Heading' },
          { key: 'workHardPartLabel', label: 'Hard-part label' },
          { key: 'workLiveLabel', label: 'Live link label' },
          { key: 'workSourceLabel', label: 'Source link label' },
          { key: 'workMoreText', label: 'Footer line', full: true },
        ]}
      />

      <CopyCard
        title="Section indices"
        form={form}
        set={set}
        fields={[
          { key: 'aboutIndexLabel', label: 'About index' },
          { key: 'aboutCta', label: 'About CTA' },
          { key: 'experienceHeading', label: 'Experience heading' },
          { key: 'experienceIndexLabel', label: 'Experience index' },
          { key: 'educationBadge', label: 'Education badge' },
          { key: 'skillsHeading', label: 'Stack heading' },
          { key: 'skillsIndexLabel', label: 'Stack index' },
        ]}
      />

      <CopyCard
        title="Contact & form"
        hint="*asterisks* → lime italic accent"
        form={form}
        set={set}
        fields={[
          { key: 'contactIndexLabel', label: 'Contact index' },
          { key: 'contactHeading', label: 'Contact headline', rows: 2 },
          { key: 'formHeading', label: 'Form heading' },
          { key: 'formIntro', label: 'Form intro' },
          { key: 'formName', label: 'Name label' },
          { key: 'formEmail', label: 'Email label' },
          { key: 'formSubject', label: 'Subject label' },
          { key: 'formMessage', label: 'Message label' },
          { key: 'formSubmit', label: 'Submit button' },
          { key: 'formSuccess', label: 'Success message', full: true },
          { key: 'formError', label: 'Error message', full: true },
          { key: 'elsewhereLabel', label: 'Elsewhere label' },
          { key: 'directLabel', label: 'Direct label' },
          { key: 'footerCredit', label: 'Footer credit' },
        ]}
      />

      <Button
        className="bg-accent text-accent-foreground hover:bg-accent/90"
        disabled={saveMut.isPending}
        onClick={() => saveMut.mutate(form)}
      >
        <Saving pending={saveMut.isPending} />
        Save site copy
      </Button>
    </div>
  );
}

// ── AI chat tab ──────────────────────────────────────────────────────────────

const CHAT_KEYS = [
  'chatTitle', 'chatSubtitle', 'chatPlaceholder', 'chatCta', 'chatWelcome',
  'chatSuggestions', 'chatSystemPrompt',
] as const;

export function AiChatTab() {
  const { form, set, saveMut, isLoading } = usePartialContentForm(CHAT_KEYS);

  // The suggestions textarea edits a plain string draft; it is only split into
  // an array on save so blank lines can exist while typing.
  const [suggestionsDraft, setSuggestionsDraft] = useState(
    () => (DEFAULT_CONTENT.chatSuggestions ?? []).join('\n')
  );
  const draftTouched = useRef(false);
  const suggestions = form.chatSuggestions;
  useEffect(() => {
    if (!draftTouched.current && Array.isArray(suggestions)) {
      setSuggestionsDraft(suggestions.join('\n'));
    }
  }, [suggestions]);

  if (isLoading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );

  const save = () =>
    saveMut.mutate({
      ...form,
      chatSuggestions: suggestionsDraft
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    });

  return (
    <div className="space-y-6 max-w-2xl">
      <CopyCard
        title="Panel"
        form={form}
        set={set}
        fields={[
          { key: 'chatTitle', label: 'Title' },
          { key: 'chatSubtitle', label: 'Subtitle' },
          { key: 'chatPlaceholder', label: 'Input placeholder' },
          { key: 'chatCta', label: 'Contact CTA' },
          { key: 'chatWelcome', label: 'Welcome message', rows: 2 },
        ]}
      />

      <Card className="glass-card border-accent/10">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-accent" /> Suggestions
          </CardTitle>
          <p className="text-xs text-muted-foreground">One suggested question per line.</p>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={4}
            value={suggestionsDraft}
            onChange={(e) => {
              draftTouched.current = true;
              setSuggestionsDraft(e.target.value);
            }}
          />
        </CardContent>
      </Card>

      <Card className="glass-card border-accent/10">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-accent" /> System prompt
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Sent with every message — everything the assistant knows about you.
          </p>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={14}
            className="font-mono text-xs leading-relaxed"
            value={(form.chatSystemPrompt as string) ?? ''}
            onChange={(e) => set('chatSystemPrompt', e.target.value)}
          />
        </CardContent>
      </Card>

      <Button
        className="bg-accent text-accent-foreground hover:bg-accent/90"
        disabled={saveMut.isPending}
        onClick={save}
      >
        <Saving pending={saveMut.isPending} />
        Save AI chat
      </Button>
    </div>
  );
}
