import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from '@/components/ui/accordion';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Plus, Pencil, Trash2, Upload, X, Lock, LogOut,
  Image as ImageIcon, Github, ExternalLink, Eye, EyeOff,
  FolderOpen, Layers, Wrench, FileText, ChevronRight, ChevronLeft, Loader2,
  Download, BookOpen, Users, Mail, Sparkles, ListChecks, MessageSquarePlus, KanbanSquare,
  ImagePlus, Star, Check, Monitor, Smartphone, AppWindow, Crop,
} from 'lucide-react';
import * as fb from '@/lib/firestore';
import type { Project, Skill, PortfolioContent, AboutStat, CVData, CVExperience, CVProject, CVEducation, CVLanguage, BlogPost, ProjectDev, DevItem, ProjectImage, ImageDevice } from '@/types/portfolio';
import { LIFECYCLE_STAGES, emptyProjectDev, DEVICE_DEFAULTS, ASPECT_PRESETS, toProjectMedia } from '@/types/portfolio';
import { DEFAULT_PROJECTS, DEFAULT_SKILLS, DEFAULT_TOOLS, DEFAULT_CONTENT, DEFAULT_CV, DEFAULT_HIGHLIGHTS, DEFAULT_CONTACT, DEFAULT_BLOG_POSTS } from '@/data/defaults';

const CATEGORIES = ['Web Apps', 'Mobile', 'Games', 'Content'];
const SESSION_KEY = 'portfolio_admin_auth';

// ── Tag input ─────────────────────────────────────────────────────────────────

function TagInput({
  tags,
  onChange,
  placeholder,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');

  const add = () => {
    const v = input.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput('');
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); }
    else if (e.key === 'Backspace' && !input && tags.length) onChange(tags.slice(0, -1));
  };

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2 bg-background/50 border border-border rounded-md">
        {tags.map(tag => (
          <Badge key={tag} variant="secondary" className="gap-1 text-xs">
            {tag}
            <button onClick={() => onChange(tags.filter(t => t !== tag))} className="hover:text-destructive">
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
          onBlur={add}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
        />
      </div>
      <p className="text-xs text-muted-foreground">Press Enter or comma to add</p>
    </div>
  );
}

// ── Cloudinary upload helper (shared) ─────────────────────────────────────────

async function uploadToCloudinary(file: File | Blob, folder = 'portfolio/projects'): Promise<string> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const preset    = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', preset);
  fd.append('folder', folder);
  const res  = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: fd });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.secure_url as string;
}

// ── Device metadata ───────────────────────────────────────────────────────────

const DEVICE_META: Record<ImageDevice, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  desktop: { label: 'Desktop', icon: Monitor },
  mobile:  { label: 'Mobile',  icon: Smartphone },
  app:     { label: 'App',     icon: AppWindow },
};

const ratioOf = (s: string): number | null => {
  const [a, b] = s.split('/').map(Number);
  return a && b ? a / b : null;
};

// ── Interactive crop tool ─────────────────────────────────────────────────────

type CropRect = { x: number; y: number; w: number; h: number };

function ImageCropper({
  open, src, aspect, onClose, onCropped,
}: {
  open: boolean;
  src: string;
  aspect: string;          // suggested lock ratio ('auto' = free)
  onClose: () => void;
  onCropped: (url: string) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [disp, setDisp] = useState({ w: 0, h: 0 });
  const [rect, setRect] = useState<CropRect | null>(null);
  const [lock, setLock] = useState<string>(aspect && aspect !== 'auto' ? aspect : 'free');
  const [busy, setBusy] = useState(false);
  const drag = useRef<null | { mode: string; px: number; py: number; r: CropRect }>(null);

  // Centered crop rect for a given ratio inside the display box
  const centered = (w: number, h: number, ratioStr: string): CropRect => {
    const r = ratioStr === 'free' ? null : ratioOf(ratioStr);
    if (!r) { const cw = w * 0.85, ch = h * 0.85; return { x: (w - cw) / 2, y: (h - ch) / 2, w: cw, h: ch }; }
    let cw = w * 0.9, ch = cw / r;
    if (ch > h * 0.9) { ch = h * 0.9; cw = ch * r; }
    return { x: (w - cw) / 2, y: (h - ch) / 2, w: cw, h: ch };
  };

  const layout = () => {
    const img = imgRef.current, box = boxRef.current?.parentElement;
    if (!img || !img.naturalWidth || !box) return;
    const availW = box.clientWidth || 320;
    const maxH = Math.min(window.innerHeight * 0.5, 480);
    const scale = Math.min(availW / img.naturalWidth, maxH / img.naturalHeight, 1);
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    setDisp({ w, h });
    setRect(centered(w, h, lock));
  };

  useEffect(() => {
    if (!open) return;
    const onResize = () => layout();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Re-fit crop box when the lock ratio changes
  useEffect(() => {
    if (disp.w) setRect(centered(disp.w, disp.h, lock));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lock]);

  const MIN = 24;
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

  const start = (mode: string) => (e: React.PointerEvent) => {
    if (!rect) return;
    e.preventDefault(); e.stopPropagation();
    boxRef.current?.setPointerCapture(e.pointerId);
    drag.current = { mode, px: e.clientX, py: e.clientY, r: { ...rect } };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.px, dy = e.clientY - d.py;
    const r = ratioOf(lock);
    let { x, y, w, h } = d.r;

    if (d.mode === 'move') {
      x = clamp(d.r.x + dx, 0, disp.w - w);
      y = clamp(d.r.y + dy, 0, disp.h - h);
    } else {
      const right = d.r.x + d.r.w, bottom = d.r.y + d.r.h;
      if (d.mode.includes('e')) w = d.r.w + dx;
      if (d.mode.includes('s')) h = d.r.h + dy;
      if (d.mode.includes('w')) { x = d.r.x + dx; w = right - x; }
      if (d.mode.includes('n')) { y = d.r.y + dy; h = bottom - y; }
      if (r && lock !== 'free') {
        // Derive the dependent side from the dominant drag axis
        if (d.mode === 'n' || d.mode === 's') w = h * r;
        else h = w / r;
        if (d.mode.includes('w')) x = right - w;
        if (d.mode.includes('n')) y = bottom - h;
      }
      // Clamp into bounds, keeping a minimum size
      w = clamp(w, MIN, disp.w); h = clamp(h, MIN, disp.h);
      x = clamp(x, 0, disp.w - w); y = clamp(y, 0, disp.h - h);
      if (x + w > disp.w) w = disp.w - x;
      if (y + h > disp.h) h = disp.h - y;
      if (r && lock !== 'free') { // re-derive after clamping so ratio holds
        if (w / r <= disp.h - y) h = w / r; else { h = disp.h - y; w = h * r; }
      }
    }
    setRect({ x, y, w, h });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (drag.current) { boxRef.current?.releasePointerCapture(e.pointerId); drag.current = null; }
  };

  const apply = async () => {
    const img = imgRef.current;
    if (!img || !rect || !disp.w) return;
    setBusy(true);
    try {
      const scale = img.naturalWidth / disp.w;
      const sx = rect.x * scale, sy = rect.y * scale;
      const sw = rect.w * scale, sh = rect.h * scale;
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(sw));
      canvas.height = Math.max(1, Math.round(sh));
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      const blob: Blob = await new Promise((resolve, reject) =>
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('Could not read the image (cross-origin). Try uploading the file instead of pasting a URL.')), 'image/png'),
      );
      const newUrl = await uploadToCloudinary(blob);
      toast.success('Cropped & saved');
      onCropped(newUrl);
      onClose();
    } catch (err) {
      toast.error(`Crop failed: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const handle = 'absolute w-3 h-3 bg-accent border border-background rounded-sm z-20';

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="w-full sm:max-w-xl bg-background/95 backdrop-blur-xl border-accent/20 max-h-[92dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="gradient-text text-lg flex items-center gap-2"><Crop className="w-4 h-4" /> Crop image</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Stage */}
          <div className="flex justify-center select-none">
            <div ref={boxRef} className="relative touch-none" style={{ width: disp.w || undefined, height: disp.h || undefined }}
              onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
              <img
                ref={imgRef}
                src={src}
                crossOrigin="anonymous"
                onLoad={layout}
                alt="Crop source"
                style={{ width: disp.w || '100%', height: disp.h || 'auto', display: 'block' }}
                className="rounded-md select-none pointer-events-none"
                draggable={false}
              />
              {rect && (
                <div
                  className="absolute border-2 border-accent cursor-move"
                  style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h, boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)' }}
                  onPointerDown={start('move')}
                >
                  <div className={`${handle} -left-1.5 -top-1.5 cursor-nwse-resize`} onPointerDown={start('nw')} />
                  <div className={`${handle} -right-1.5 -top-1.5 cursor-nesw-resize`} onPointerDown={start('ne')} />
                  <div className={`${handle} -left-1.5 -bottom-1.5 cursor-nesw-resize`} onPointerDown={start('sw')} />
                  <div className={`${handle} -right-1.5 -bottom-1.5 cursor-nwse-resize`} onPointerDown={start('se')} />
                </div>
              )}
            </div>
          </div>

          {/* Ratio lock */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="text-xs text-muted-foreground">Lock ratio:</span>
            {['free', '16/9', '9/16', '1/1', '4/3', '3/4'].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setLock(r)}
                className={`text-xs px-2 py-1 rounded-md border transition-colors ${lock === r ? 'bg-accent text-accent-foreground border-accent' : 'border-border/60 hover:border-accent/50'}`}
              >
                {r === 'free' ? 'Free' : r.replace('/', ':')}
              </button>
            ))}
          </div>
        </div>

        <DialogFooter className="flex-row gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy} className="flex-1 sm:flex-none">Cancel</Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90 flex-1 sm:flex-none" onClick={apply} disabled={busy || !rect}>
            {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Apply crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Multi-image gallery uploader ──────────────────────────────────────────────

function MultiImageUploader({
  media, onChange, onBusyChange,
}: {
  media: ProjectImage[];
  onChange: (media: ProjectImage[]) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [url, setUrl] = useState('');
  const [cropIdx, setCropIdx] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const newImage = (url: string): ProjectImage => ({ url, device: 'desktop', aspect: 'auto', fit: 'cover' });

  const handleFiles = async (fileList: FileList | File[] | null) => {
    const files = Array.from(fileList ?? []).filter(f => f.type.startsWith('image/'));
    if (!files.length) return;
    setUploading(files.length);
    onBusyChange?.(true);
    const results = await Promise.allSettled(files.map(f => uploadToCloudinary(f)));
    const urls = results.flatMap(r => r.status === 'fulfilled' ? [r.value] : []);
    const failed = results.length - urls.length;
    if (urls.length) { onChange([...media, ...urls.map(newImage)]); toast.success(`${urls.length} image${urls.length > 1 ? 's' : ''} uploaded!`); }
    if (failed) toast.error(`${failed} upload${failed > 1 ? 's' : ''} failed`);
    setUploading(0);
    onBusyChange?.(false);
  };

  const patch = (i: number, p: Partial<ProjectImage>) =>
    onChange(media.map((m, idx) => idx === i ? { ...m, ...p } : m));
  const remove = (i: number) => onChange(media.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= media.length) return;
    const next = [...media];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const makeCover = (i: number) => {
    if (i === 0) return;
    const next = [...media];
    const [pick] = next.splice(i, 1);
    onChange([pick, ...next]);
  };
  const setDevice = (i: number, device: ImageDevice) =>
    patch(i, { device, ...DEVICE_DEFAULTS[device] });
  const addUrl = () => {
    const v = url.trim();
    if (v && !media.some(m => m.url === v)) onChange([...media, newImage(v)]);
    setUrl('');
  };

  return (
    <div className="space-y-3">
      {media.length > 0 && (
        <div className="space-y-2.5">
          {media.map((m, i) => (
            <div key={`${m.url}-${i}`} className="flex gap-3 rounded-lg border border-border/50 bg-secondary/20 p-2.5">
              {/* Thumbnail (reflects device + fit) */}
              <div className={`relative shrink-0 w-20 sm:w-24 self-start overflow-hidden rounded-md bg-background/60 ${m.device === 'desktop' ? 'aspect-video' : 'aspect-[9/16]'}`}>
                <img src={m.url} alt={`Image ${i + 1}`} className={`w-full h-full ${m.fit === 'contain' ? 'object-contain' : 'object-cover'}`} />
                {i === 0 && (
                  <span className="absolute top-0.5 left-0.5 text-[8px] font-semibold bg-accent text-accent-foreground px-1 py-0.5 rounded">Cover</span>
                )}
              </div>

              {/* Controls */}
              <div className="flex-1 min-w-0 space-y-2">
                {/* Device selector */}
                <div className="flex gap-1">
                  {(Object.keys(DEVICE_META) as ImageDevice[]).map(dev => {
                    const { label, icon: Icon } = DEVICE_META[dev];
                    const active = m.device === dev;
                    return (
                      <button
                        key={dev} type="button" onClick={() => setDevice(i, dev)}
                        className={`flex-1 flex items-center justify-center gap-1 rounded-md border px-1.5 py-1 text-[11px] transition-colors ${active ? 'bg-accent text-accent-foreground border-accent' : 'border-border/60 text-muted-foreground hover:border-accent/50'}`}
                      >
                        <Icon className="w-3 h-3" /> <span className="hidden xs:inline">{label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Aspect + fit */}
                <div className="flex items-center gap-1.5">
                  <Select value={ASPECT_PRESETS.includes(m.aspect as typeof ASPECT_PRESETS[number]) ? m.aspect : 'custom'} onValueChange={v => patch(i, { aspect: v === 'custom' ? (ASPECT_PRESETS.includes(m.aspect as typeof ASPECT_PRESETS[number]) ? '3/2' : m.aspect) : v })}>
                    <SelectTrigger className="h-7 text-[11px] flex-1"><SelectValue placeholder="Ratio" /></SelectTrigger>
                    <SelectContent>
                      {ASPECT_PRESETS.map(a => <SelectItem key={a} value={a} className="text-xs">{a === 'auto' ? 'Auto' : a.replace('/', ':')}</SelectItem>)}
                      <SelectItem value="custom" className="text-xs">Custom…</SelectItem>
                    </SelectContent>
                  </Select>
                  {!ASPECT_PRESETS.includes(m.aspect as typeof ASPECT_PRESETS[number]) && (
                    <Input
                      value={m.aspect}
                      onChange={e => patch(i, { aspect: e.target.value })}
                      placeholder="W/H e.g. 3/4"
                      className="h-7 w-24 text-[11px]"
                    />
                  )}
                  <button
                    type="button" title="Toggle fit"
                    onClick={() => patch(i, { fit: m.fit === 'cover' ? 'contain' : 'cover' })}
                    className="h-7 px-2 rounded-md border border-border/60 text-[11px] text-muted-foreground hover:border-accent/50 shrink-0"
                  >
                    {m.fit === 'cover' ? 'Cover' : 'Contain'}
                  </button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-0.5">
                  <button type="button" title="Move up" disabled={i === 0} onClick={() => move(i, -1)}
                    className="w-7 h-7 rounded flex items-center justify-center hover:bg-accent hover:text-accent-foreground disabled:opacity-25 transition-colors">
                    <ChevronLeft className="w-3.5 h-3.5 rotate-90" />
                  </button>
                  <button type="button" title="Move down" disabled={i === media.length - 1} onClick={() => move(i, 1)}
                    className="w-7 h-7 rounded flex items-center justify-center hover:bg-accent hover:text-accent-foreground disabled:opacity-25 transition-colors">
                    <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                  </button>
                  {i !== 0 && (
                    <button type="button" title="Set as cover" onClick={() => makeCover(i)}
                      className="w-7 h-7 rounded flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors">
                      <Star className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button type="button" title="Crop" onClick={() => setCropIdx(i)}
                    className="w-7 h-7 rounded flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors">
                    <Crop className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" title="Remove" onClick={() => remove(i)}
                    className="w-7 h-7 rounded flex items-center justify-center text-destructive hover:bg-destructive hover:text-white transition-colors ml-auto">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drop / browse zone (multi-select) */}
      <div
        className={`relative w-full h-28 rounded-xl border-2 border-dashed overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-200 ${
          dragOver ? 'border-accent bg-accent/10' : 'border-accent/30 bg-secondary/20 hover:border-accent/60 hover:bg-secondary/30'
        }`}
        onClick={() => !uploading && fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={e => { e.preventDefault(); setDragOver(false); }}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
      >
        {uploading ? (
          <div className="text-center space-y-1">
            <Loader2 className="w-7 h-7 mx-auto animate-spin text-accent" />
            <p className="text-xs text-muted-foreground">Uploading {uploading} image{uploading > 1 ? 's' : ''}…</p>
          </div>
        ) : (
          <div className="text-center text-muted-foreground space-y-1 px-4">
            <ImagePlus className="w-7 h-7 mx-auto opacity-40" />
            <p className="text-sm">Drag & drop or click to add images</p>
            <p className="text-[11px] opacity-70">Multiple allowed · pick a device & ratio per image · first is the cover</p>
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />

      <div className="flex gap-2">
        <Input
          placeholder="Or paste an image URL…"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }}
        />
        <Button type="button" variant="outline" className="border-accent/30 shrink-0" onClick={addUrl} disabled={!url.trim()}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {cropIdx !== null && media[cropIdx] && (
        <ImageCropper
          open={cropIdx !== null}
          src={media[cropIdx].url}
          aspect={media[cropIdx].aspect}
          onClose={() => setCropIdx(null)}
          onCropped={url => patch(cropIdx, { url })}
        />
      )}
    </div>
  );
}

// ── Project form dialog ───────────────────────────────────────────────────────

const emptyProject = (): Omit<Project, 'id'> => ({
  title: '', description: '', longDescription: '',
  image: '', images: [], media: [], visible: true, tags: [], techStack: [], challenges: '',
  category: [], github: '', demo: '', order: 0,
});

function ProjectFormDialog({
  open, onClose, project,
}: {
  open: boolean;
  onClose: () => void;
  project?: Project;
}) {
  const qc = useQueryClient();
  const isEdit = !!project?.id;

  // Normalize so `media` is always populated (older projects only had `image`/`images`)
  const normalize = (p?: Project): Omit<Project, 'id'> => {
    if (!p) return emptyProject();
    const media = toProjectMedia(p);
    return { ...p, media, visible: p.visible !== false };
  };

  const [form, setForm] = useState<Omit<Project, 'id'>>(normalize(project));
  const [imgUploading, setImgUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(normalize(project)); }, [project, open]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  // Keep legacy `image`/`images` in sync with the rich `media` gallery for backward compatibility
  const setMedia = (media: ProjectImage[]) =>
    setForm(prev => ({ ...prev, media, images: media.map(m => m.url), image: media[0]?.url ?? '' }));

  const toggleCategory = (cat: string) => {
    set('category', form.category.includes(cat)
      ? form.category.filter(c => c !== cat)
      : [...form.category, cat]);
  };

  const save = useMutation({
    mutationFn: async () => {
      setSaving(true);
      const data = { ...form };
      if (isEdit && project?.id) {
        await fb.updateProject(project.id, data);
      } else {
        const existing = qc.getQueryData<Project[]>(['projects']) ?? [];
        await fb.addProject({ ...data, order: existing.length });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success(isEdit ? 'Project updated!' : 'Project added!');
      setSaving(false);
      onClose();
    },
    onError: (err) => { setSaving(false); toast.error(`Failed: ${(err as Error).message}`); },
  });

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="w-full sm:max-w-2xl bg-background/95 backdrop-blur-xl border-accent/20 h-[100dvh] sm:h-auto sm:max-h-[90dvh] overflow-hidden flex flex-col rounded-none sm:rounded-xl p-0">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 border-b border-border/40 shrink-0">
          <DialogTitle className="gradient-text text-lg sm:text-xl">
            {isEdit ? 'Edit Project' : 'Add New Project'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-border/50 [&::-webkit-scrollbar-thumb]:rounded-full">
          <div className="space-y-4 p-4 sm:p-6">

            {/* ── 1. Core info — always visible on open ── */}
            <div className="flex gap-3 items-end">
              <div className="flex-1 space-y-1.5 min-w-0">
                <Label>Title *</Label>
                <Input placeholder="My Awesome Project" value={form.title} onChange={e => set('title', e.target.value)} />
              </div>
              <div className="w-20 shrink-0 space-y-1.5">
                <Label>Order</Label>
                <Input type="number" value={form.order} onChange={e => set('order', Number(e.target.value))} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Short Description *</Label>
              <Input placeholder="One-line summary shown on the card" value={form.description} onChange={e => set('description', e.target.value)} />
            </div>

            {/* Visibility */}
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-secondary/20 px-3 py-2.5">
              <div className="flex items-center gap-2 min-w-0">
                {form.visible !== false
                  ? <Eye className="w-4 h-4 text-green-500 shrink-0" />
                  : <EyeOff className="w-4 h-4 text-muted-foreground shrink-0" />}
                <div className="min-w-0">
                  <p className="text-sm font-medium">Visible on site</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {form.visible !== false ? 'Shown in the public Projects section' : 'Hidden from the public site'}
                  </p>
                </div>
              </div>
              <Switch checked={form.visible !== false} onCheckedChange={v => set('visible', v)} />
            </div>

            {/* ── 2. Links ── */}
            <Separator className="bg-border/50" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Links</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Github className="w-3.5 h-3.5" /> GitHub URL
                </Label>
                <Input placeholder="https://github.com/..." value={form.github} onChange={e => set('github', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" /> Live Demo URL
                </Label>
                <Input placeholder="https://..." value={form.demo} onChange={e => set('demo', e.target.value)} />
              </div>
            </div>

            {/* ── 3. Languages / tags ── */}
            <Separator className="bg-border/50" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Languages & Tech</p>
            <div className="space-y-1.5">
              <Label>Languages / Tags <span className="text-muted-foreground font-normal">(shown on card)</span></Label>
              <TagInput tags={form.tags} onChange={v => set('tags', v)} placeholder="React, TypeScript, Firebase…" />
            </div>
            <div className="space-y-1.5">
              <Label>Full Tech Stack <span className="text-muted-foreground font-normal">(shown in modal)</span></Label>
              <TagInput tags={form.techStack} onChange={v => set('techStack', v)} placeholder="React, Firebase Realtime DB, Expo…" />
            </div>

            {/* ── 4. Categories ── */}
            <div className="space-y-1.5">
              <Label>Categories</Label>
              <div className="flex flex-wrap gap-3">
                {CATEGORIES.map(cat => (
                  <label key={cat} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={form.category.includes(cat)} onCheckedChange={() => toggleCategory(cat)} />
                    <span className="text-sm">{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* ── 5. Images (gallery / slideshow) ── */}
            <Separator className="bg-border/50" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Images <span className="font-normal normal-case">— shown as a slideshow on the card</span>
            </p>
            <MultiImageUploader
              media={form.media ?? []}
              onChange={setMedia}
              onBusyChange={setImgUploading}
            />

            {/* ── 6. Long text — at the bottom ── */}
            <Separator className="bg-border/50" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Details (shown in modal)</p>
            <div className="space-y-1.5">
              <Label>Long Description</Label>
              <Textarea placeholder="Detailed overview shown in the project modal..." rows={4} value={form.longDescription} onChange={e => set('longDescription', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>The Challenge</Label>
              <Textarea placeholder="Describe the main technical challenge you solved..." rows={3} value={form.challenges} onChange={e => set('challenges', e.target.value)} />
            </div>

          </div>
        </div>

        <DialogFooter className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border/50 shrink-0 flex-row gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving || imgUploading} className="flex-1 sm:flex-none">Cancel</Button>
          <Button
            className="bg-accent text-accent-foreground hover:bg-accent/90 flex-1 sm:flex-none"
            onClick={() => save.mutate()}
            disabled={saving || imgUploading || !form.title}
          >
            {(saving || imgUploading) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {imgUploading ? 'Uploading…' : isEdit ? 'Save Changes' : 'Add Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Projects Tab ──────────────────────────────────────────────────────────────

function ProjectsTab() {
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: fb.getProjects,
  });

  // Seed all default projects into Firestore so they become editable
  const seedMut = useMutation({
    mutationFn: async () => {
      await Promise.all(
        DEFAULT_PROJECTS.map(p => fb.addProject({ ...p, image: '' }))
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Default projects imported! You can now edit or upload images for each.');
    },
    onError: (err) => toast.error(`Seed failed: ${(err as Error).message}`),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => fb.deleteProject(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); toast.success('Project deleted'); setDeleteId(null); },
    onError: (err) => toast.error(`Failed: ${(err as Error).message}`),
  });

  const visMut = useMutation({
    mutationFn: ({ id, visible }: { id: string; visible: boolean }) => fb.updateProject(id, { visible }),
    onSuccess: (_r, { visible }) => { qc.invalidateQueries({ queryKey: ['projects'] }); toast.success(visible ? 'Project shown on site' : 'Project hidden from site'); },
    onError: (err) => toast.error(`Failed: ${(err as Error).message}`),
  });

  const openAdd  = () => { setEditProject(undefined); setFormOpen(true); };
  const openEdit = (p: Project) => { setEditProject(p); setFormOpen(true); };

  // Helper: resolve display image (Firestore URL or default local asset)
  const resolveImage = (p: Project) => {
    if (p.image) return p.image;
    return DEFAULT_PROJECTS.find(d => d.title === p.title)?.image ?? '';
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground">{projects.length} project{projects.length !== 1 ? 's' : ''} in Firestore</p>
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0" onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" /> Add Project
        </Button>
      </div>

      {/* Seed banner — shown when Firestore is empty */}
      {!isLoading && projects.length === 0 && (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="font-semibold text-foreground">Your site is showing 4 default projects</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Import them into Firestore so you can edit, reorder, or delete them here.
                You can upload proper images after import.
              </p>
            </div>
            <Button
              className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0"
              onClick={() => seedMut.mutate()}
              disabled={seedMut.isPending}
            >
              {seedMut.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Import Defaults
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {projects.map(project => {
            const img = resolveImage(project);
            const hidden = project.visible === false;
            const photoCount = project.media?.length ?? project.images?.length ?? 0;
            return (
              <Card key={project.id} className={`glass-card border-accent/10 overflow-hidden ${hidden ? 'opacity-60' : ''}`}>
                <div className="relative aspect-video overflow-hidden bg-secondary/30">
                  {img ? (
                    <img src={img} alt={project.title} className={`w-full h-full object-cover ${hidden ? 'grayscale' : ''}`} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/20 text-5xl font-bold">
                      {project.title[0]}
                    </div>
                  )}
                  {hidden && (
                    <span className="absolute top-2 left-2 flex items-center gap-1 text-[10px] font-semibold bg-background/85 text-muted-foreground px-1.5 py-0.5 rounded">
                      <EyeOff className="w-3 h-3" /> Hidden
                    </span>
                  )}
                </div>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{project.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{project.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {project.category.map(c => (
                      <Badge key={c} variant="outline" className="text-[10px] border-accent/30 text-accent">{c}</Badge>
                    ))}
                    {!project.image && (
                      <Badge variant="outline" className="text-[10px] border-yellow-500/30 text-yellow-500">no image</Badge>
                    )}
                    {photoCount > 1 && (
                      <Badge variant="outline" className="text-[10px] border-accent/30 text-accent">{photoCount} photos</Badge>
                    )}
                  </div>
                  {/* Quick visibility toggle */}
                  <div className="flex items-center justify-between gap-2 rounded-md border border-border/40 bg-secondary/20 px-2.5 py-1.5">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-green-500" />}
                      {hidden ? 'Hidden' : 'Visible'}
                    </span>
                    <Switch
                      checked={!hidden}
                      disabled={visMut.isPending}
                      onCheckedChange={v => visMut.mutate({ id: project.id!, visible: v })}
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" className="flex-1 border-accent/30" onClick={() => openEdit(project)}>
                      <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive hover:text-white" onClick={() => setDeleteId(project.id!)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ProjectFormDialog open={formOpen} onClose={() => setFormOpen(false)} project={editProject} />

      <AlertDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <AlertDialogContent className="bg-background/95 backdrop-blur-xl border-accent/20">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the project from Firestore. Cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => deleteId && deleteMut.mutate(deleteId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Skill Row (own local state so typing doesn't hammer Firestore) ────────────

function SkillRow({
  skill,
  onUpdate,
  onDelete,
}: {
  skill: Skill;
  onUpdate: (id: string, data: Partial<Skill>) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState(skill.name);
  const [level, setLevel] = useState(skill.level);

  // Sync if parent data changes (e.g. after seed)
  useEffect(() => { setName(skill.name); setLevel(skill.level); }, [skill.name, skill.level]);

  return (
    <Card className="glass-card border-accent/10">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 space-y-2 min-w-0">
            {/* Name + level number row */}
            <div className="flex items-center gap-2">
              <Input
                className="flex-1 h-8 text-sm font-medium border-accent/20 bg-background/50 focus-visible:ring-accent min-w-0"
                value={name}
                onChange={e => setName(e.target.value)}
                onBlur={() => name.trim() && name !== skill.name && onUpdate(skill.id!, { name: name.trim() })}
                onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                placeholder="Skill name"
              />
              <div className="flex items-center gap-1 shrink-0">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  className="w-14 h-8 text-sm text-center border-accent/20 bg-background/50 focus-visible:ring-accent"
                  value={level}
                  onChange={e => setLevel(Math.min(100, Math.max(0, Number(e.target.value))))}
                  onBlur={() => level !== skill.level && onUpdate(skill.id!, { level })}
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            </div>
            {/* Slider */}
            <Slider
              value={[level]}
              min={0} max={100} step={1}
              onValueChange={([v]) => setLevel(v)}
              onValueCommit={([v]) => { setLevel(v); onUpdate(skill.id!, { level: v }); }}
            />
          </div>
          <Button
            size="icon" variant="ghost"
            className="shrink-0 mt-0.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(skill.id!)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Skills & Tools Tab ────────────────────────────────────────────────────────

function SkillsTab() {
  const qc = useQueryClient();
  const [newSkillName, setNewSkillName] = useState('');
  const [newTool, setNewTool] = useState('');

  const { data: skills = [], isLoading: loadingSkills } = useQuery({ queryKey: ['skills'], queryFn: fb.getSkills });
  const { data: tools = [], isLoading: loadingTools } = useQuery({ queryKey: ['tools'], queryFn: fb.getTools });

  const seedSkillsMut = useMutation({
    mutationFn: async () => {
      await Promise.all(DEFAULT_SKILLS.map(s => fb.addSkill(s)));
      await fb.setTools(DEFAULT_TOOLS);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['skills'] });
      qc.invalidateQueries({ queryKey: ['tools'] });
      toast.success('Default skills & tools imported!');
    },
    onError: (err) => toast.error(`Seed failed: ${(err as Error).message}`),
  });

  const addSkillMut = useMutation({
    mutationFn: () => fb.addSkill({ name: newSkillName.trim(), level: 80, order: skills.length }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['skills'] }); setNewSkillName(''); toast.success('Skill added'); },
    onError: (err) => toast.error(`Failed: ${(err as Error).message}`),
  });

  const updateSkill = (id: string, data: Partial<Skill>) => {
    fb.updateSkill(id, data)
      .then(() => qc.invalidateQueries({ queryKey: ['skills'] }))
      .catch(err => toast.error(`Failed: ${(err as Error).message}`));
  };

  const deleteSkill = (id: string) => {
    fb.deleteSkill(id)
      .then(() => { qc.invalidateQueries({ queryKey: ['skills'] }); toast.success('Skill removed'); })
      .catch(err => toast.error(`Failed: ${(err as Error).message}`));
  };

  const saveTool = (list: string[]) =>
    fb.setTools(list).then(() => qc.invalidateQueries({ queryKey: ['tools'] }));

  const addTool = () => {
    const t = newTool.trim();
    if (t && !tools.includes(t)) saveTool([...tools, t]);
    setNewTool('');
  };

  return (
    <div className="space-y-8">
      {/* Seed banner */}
      {!loadingSkills && skills.length === 0 && (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="font-semibold text-foreground">Your site is showing default skills & tools</p>
              <p className="text-sm text-muted-foreground mt-0.5">Import them into Firestore to manage them here.</p>
            </div>
            <Button
              className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0"
              onClick={() => seedSkillsMut.mutate()}
              disabled={seedSkillsMut.isPending}
            >
              {seedSkillsMut.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Import Defaults
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Skills */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Layers className="w-5 h-5 text-accent" /> Technical Skills
        </h3>
        {loadingSkills ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
        ) : (
          <div className="space-y-3">
            {skills.map(skill => (
              <SkillRow key={skill.id} skill={skill} onUpdate={updateSkill} onDelete={deleteSkill} />
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            placeholder="New skill name..."
            value={newSkillName}
            onChange={e => setNewSkillName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && newSkillName.trim() && addSkillMut.mutate()}
          />
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0" onClick={() => addSkillMut.mutate()} disabled={!newSkillName.trim()}>
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>
      </div>

      <Separator className="bg-border/50" />

      {/* Tools */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Wrench className="w-5 h-5 text-accent" /> Tools & Technologies
        </h3>
        {loadingTools ? (
          <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-accent" /></div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tools.map(tool => (
              <Badge key={tool} variant="secondary" className="gap-1.5 text-sm py-1 px-3">
                {tool}
                <button onClick={() => saveTool(tools.filter(t => t !== tool))} className="hover:text-destructive transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input placeholder="Add a tool..." value={newTool} onChange={e => setNewTool(e.target.value)} onKeyDown={e => e.key === 'Enter' && newTool.trim() && addTool()} />
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0" onClick={addTool} disabled={!newTool.trim()}>
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Shared: image drop zone (used by Blog + Projects) ────────────────────────

function ImageDropzone({ image, onUpload, onUrlChange }: {
  image: string;
  onUpload: (url: string) => void;
  onUrlChange: (url: string) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadToCloudinary = async (file: File) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const preset    = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', preset);
      fd.append('folder', 'portfolio');
      const res  = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: fd });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      onUpload(json.secure_url);
      toast.success('Image uploaded!');
    } catch (err) { toast.error(`Upload failed: ${(err as Error).message}`); }
    setUploading(false);
  };

  return (
    <div className="space-y-2">
      <div
        className={`relative w-full aspect-video rounded-xl border-2 border-dashed overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-200 ${dragOver ? 'border-accent bg-accent/10' : 'border-accent/30 bg-secondary/20 hover:border-accent/60'}`}
        onClick={() => !uploading && fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) uploadToCloudinary(f); }}
      >
        {uploading ? (
          <div className="text-center"><Loader2 className="w-8 h-8 mx-auto animate-spin text-accent" /><p className="text-xs text-muted-foreground mt-1">Uploading…</p></div>
        ) : image ? (
          <>
            <img src={image} alt="preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-background/70 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
              <Upload className="w-6 h-6 text-accent" />
            </div>
            <button type="button" className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/80 border border-border flex items-center justify-center hover:bg-destructive hover:text-white transition-colors z-10" onClick={e => { e.stopPropagation(); onUpload(''); }}>
              <X className="w-3 h-3" />
            </button>
          </>
        ) : (
          <div className="text-center text-muted-foreground space-y-1">
            <Upload className="w-8 h-8 mx-auto opacity-40" />
            <p className="text-xs">Drag & drop or click to browse</p>
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadToCloudinary(f); }} />
      <Input placeholder="Or paste image URL…" value={image} onChange={e => onUrlChange(e.target.value)} className="text-xs h-8" />
    </div>
  );
}

// ── About Highlights Tab ──────────────────────────────────────────────────────

const AVAILABLE_ICONS = [
  'Code','Smartphone','Video','Users','Globe','Database','Cpu','Zap',
  'Brain','Trophy','Camera','Music','BookOpen','Wrench','Shield','Rocket',
  'Star','Heart','Briefcase','Terminal','Layers','Monitor','Server',
];

function AboutTab() {
  const qc = useQueryClient();
  const [highlights, setHighlights] = useState(DEFAULT_HIGHLIGHTS);

  const { data: saved, isLoading } = useQuery({ queryKey: ['highlights'], queryFn: fb.getHighlights, staleTime: 5 * 60 * 1000 });
  useEffect(() => { if (saved) setHighlights(saved); }, [saved]);

  const saveMut = useMutation({
    mutationFn: () => fb.saveHighlights(highlights),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['highlights'] }); toast.success('About highlights saved!'); },
    onError: (err) => toast.error(`Failed: ${(err as Error).message}`),
  });

  const uid = () => Date.now().toString();
  const upH = (id: string, patch: Partial<typeof highlights[0]>) =>
    setHighlights(prev => prev.map(h => h.id === id ? { ...h, ...patch } : h));

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground">These 4 cards appear at the bottom of the About section.</p>
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
          {saveMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save
        </Button>
      </div>

      {highlights.map(h => (
        <Card key={h.id} className="glass-card border-accent/10">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{h.title || 'New Card'}</span>
              <Button size="icon" variant="ghost" className="hover:text-destructive" onClick={() => setHighlights(prev => prev.filter(x => x.id !== h.id))}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Icon</Label>
                <select
                  value={h.icon}
                  onChange={e => upH(h.id, { icon: e.target.value })}
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  {AVAILABLE_ICONS.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Title</Label>
                <Input className="h-8 text-sm" value={h.title} onChange={e => upH(h.id, { title: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Input className="h-8 text-sm" value={h.description} onChange={e => upH(h.id, { description: e.target.value })} />
            </div>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" className="w-full border-dashed border-accent/30 text-muted-foreground hover:text-foreground"
        onClick={() => setHighlights(prev => [...prev, { id: uid(), icon: 'Code', title: '', description: '' }])}>
        <Plus className="w-4 h-4 mr-2" /> Add Card
      </Button>
    </div>
  );
}

// ── Contact Tab ───────────────────────────────────────────────────────────────

function ContactTab() {
  const qc = useQueryClient();
  const [form, setForm] = useState(DEFAULT_CONTACT);

  const { data: saved, isLoading } = useQuery({ queryKey: ['contact'], queryFn: fb.getContactData, staleTime: 5 * 60 * 1000 });
  useEffect(() => { if (saved) setForm(saved); }, [saved]);

  const saveMut = useMutation({
    mutationFn: () => fb.saveContactData(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contact'] }); toast.success('Contact info saved!'); },
    onError: (err) => toast.error(`Failed: ${(err as Error).message}`),
  });

  const set = <K extends keyof typeof form>(k: K, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  return (
    <div className="space-y-5 max-w-xl">
      <Card className="glass-card border-accent/10">
        <CardHeader><CardTitle className="text-base">Contact Details</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {([['email','Email','mattathiasabraham@gmail.com'],['phone','Phone','+251 902 212 622'],['location','Location','Addis Ababa, Ethiopia'],['locationUrl','Location Map URL','https://maps.google.com/...'],['availabilityText','Availability Status','Available for new projects']] as [keyof typeof form, string, string][]).map(([k, label, ph]) => (
            <div key={k} className="space-y-1">
              <Label className="text-xs text-muted-foreground">{label}</Label>
              <Input className="h-8 text-sm" placeholder={ph} value={form[k]} onChange={e => set(k, e.target.value)} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="glass-card border-accent/10">
        <CardHeader><CardTitle className="text-base">Social Links</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {([['github','GitHub URL'],['linkedin','LinkedIn URL'],['instagram','Instagram URL']] as [keyof typeof form, string][]).map(([k, label]) => (
            <div key={k} className="space-y-1">
              <Label className="text-xs text-muted-foreground">{label}</Label>
              <Input className="h-8 text-sm" value={form[k]} onChange={e => set(k, e.target.value)} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
        {saveMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save Contact Info
      </Button>
    </div>
  );
}

// ── Blog Tab ──────────────────────────────────────────────────────────────────

const emptyPost = (): Omit<BlogPost, 'id'> => ({
  title: '', excerpt: '', image: '', category: '', date: new Date().toISOString().slice(0, 10),
  readTime: '', link: '', order: 0,
});

function BlogFormDialog({ open, onClose, post }: { open: boolean; onClose: () => void; post?: BlogPost }) {
  const qc = useQueryClient();
  const isEdit = !!post?.id;
  const [form, setForm] = useState<Omit<BlogPost, 'id'>>(post ? { ...post } : emptyPost());

  useEffect(() => { setForm(post ? { ...post } : emptyPost()); }, [post, open]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm(prev => ({ ...prev, [k]: v }));

  const save = useMutation({
    mutationFn: async () => {
      if (isEdit && post?.id) await fb.updateBlogPost(post.id, form);
      else { const existing = qc.getQueryData<BlogPost[]>(['blog']) ?? []; await fb.addBlogPost({ ...form, order: existing.length }); }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['blog'] }); toast.success(isEdit ? 'Post updated!' : 'Post added!'); onClose(); },
    onError: (err) => toast.error(`Failed: ${(err as Error).message}`),
  });

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="w-full sm:max-w-xl bg-background/95 backdrop-blur-xl border-accent/20 h-[100dvh] sm:h-auto sm:max-h-[90dvh] overflow-hidden flex flex-col rounded-none sm:rounded-xl p-0">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 border-b border-border/40 shrink-0">
          <DialogTitle className="gradient-text text-lg sm:text-xl">{isEdit ? 'Edit Post' : 'Add Blog Post'}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-border/50 [&::-webkit-scrollbar-thumb]:rounded-full">
          <div className="space-y-4 p-4 sm:p-6">
            <div className="space-y-1"><Label>Cover Image</Label>
              <ImageDropzone image={form.image} onUpload={url => set('image', url)} onUrlChange={url => set('image', url)} />
            </div>
            <Separator className="bg-border/50" />
            <div className="space-y-1"><Label>Title *</Label><Input value={form.title} onChange={e => set('title', e.target.value)} /></div>
            <div className="space-y-1"><Label>Excerpt</Label><Textarea rows={3} value={form.excerpt} onChange={e => set('excerpt', e.target.value)} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Category</Label><Input placeholder="Development" value={form.category} onChange={e => set('category', e.target.value)} /></div>
              <div className="space-y-1"><Label>Read Time</Label><Input placeholder="8 min read" value={form.readTime} onChange={e => set('readTime', e.target.value)} /></div>
              <div className="space-y-1"><Label>Date</Label><Input type="date" value={form.date} onChange={e => set('date', e.target.value)} /></div>
              <div className="space-y-1"><Label>Order</Label><Input type="number" value={form.order} onChange={e => set('order', Number(e.target.value))} /></div>
            </div>
            <div className="space-y-1"><Label>Post Link (URL)</Label><Input placeholder="https://your-blog.com/post" value={form.link} onChange={e => set('link', e.target.value)} /></div>
          </div>
        </div>
        <DialogFooter className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border/50 shrink-0 flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">Cancel</Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90 flex-1 sm:flex-none" onClick={() => save.mutate()} disabled={save.isPending || !form.title}>
            {save.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{isEdit ? 'Save Changes' : 'Add Post'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BlogTab() {
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editPost, setEditPost] = useState<BlogPost | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: posts = [], isLoading } = useQuery({ queryKey: ['blog'], queryFn: fb.getBlogPosts });

  const seedMut = useMutation({
    mutationFn: () => Promise.all(DEFAULT_BLOG_POSTS.map(p => fb.addBlogPost(p))),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['blog'] }); toast.success('Default blog posts imported!'); },
    onError: (err) => toast.error(`Seed failed: ${(err as Error).message}`),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => fb.deleteBlogPost(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['blog'] }); toast.success('Post deleted'); setDeleteId(null); },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground">{posts.length} post{posts.length !== 1 ? 's' : ''}</p>
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0" onClick={() => { setEditPost(undefined); setFormOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Post
        </Button>
      </div>

      {!isLoading && posts.length === 0 && (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="font-semibold text-foreground">No blog posts yet</p>
              <p className="text-sm text-muted-foreground mt-0.5">Import the 3 default posts or add your own.</p>
            </div>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0" onClick={() => seedMut.mutate()} disabled={seedMut.isPending}>
              {seedMut.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}Import Defaults
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {posts.map(post => (
            <Card key={post.id} className="glass-card border-accent/10 overflow-hidden">
              <div className="aspect-video overflow-hidden bg-secondary/30">
                {post.image ? <img src={post.image} alt={post.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground/20 text-4xl font-bold">{post.title[0]}</div>}
              </div>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge variant="outline" className="text-[10px] border-accent/30 text-accent mb-1">{post.category}</Badge>
                    <h3 className="font-semibold text-sm text-foreground line-clamp-2">{post.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{new Date(post.date).toLocaleDateString()} · {post.readTime}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" className="flex-1 border-accent/30" onClick={() => { setEditPost(post); setFormOpen(true); }}>
                    <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive hover:text-white" onClick={() => setDeleteId(post.id!)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <BlogFormDialog open={formOpen} onClose={() => setFormOpen(false)} post={editPost} />

      <AlertDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <AlertDialogContent className="bg-background/95 backdrop-blur-xl border-accent/20">
          <AlertDialogHeader><AlertDialogTitle>Delete post?</AlertDialogTitle><AlertDialogDescription>This permanently removes the post from Firestore.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => deleteId && deleteMut.mutate(deleteId)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Content Tab ───────────────────────────────────────────────────────────────

function ContentTab() {
  const qc = useQueryClient();
  const [form, setForm] = useState<PortfolioContent>(DEFAULT_CONTENT);

  const { data: saved, isLoading } = useQuery({
    queryKey: ['content'],
    queryFn: fb.getContent,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (saved) setForm(prev => ({ ...prev, ...saved }));
  }, [saved]);

  const saveMut = useMutation({
    mutationFn: () => fb.saveContent(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['content'] });
      toast.success('Content saved! Changes are live on the site.');
    },
    onError: (err) => toast.error(`Failed: ${(err as Error).message}`),
  });

  const set = <K extends keyof PortfolioContent>(k: K, v: PortfolioContent[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <Card className="glass-card border-accent/10">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-accent" /> Hero Section
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="space-y-2 sm:col-span-2">
              <Label>Your Name / Title</Label>
              <Input value={form.heroTitle ?? ''} onChange={e => set('heroTitle', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Logo Initials</Label>
              <Input value={form.siteInitials ?? ''} onChange={e => set('siteInitials', e.target.value)} placeholder="MA" maxLength={4} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Role (shown below your name)</Label>
            <Input value={form.heroSubtitle ?? ''} onChange={e => set('heroSubtitle', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Hero Description</Label>
            <Textarea rows={3} value={form.heroDescription ?? ''} onChange={e => set('heroDescription', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Availability / Currently Badge <span className="text-muted-foreground font-normal">(green dot in hero)</span></Label>
            <Input value={form.currentlyWorking ?? ''} onChange={e => set('currentlyWorking', e.target.value)} placeholder="Open to remote opportunities" />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-accent/10">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-accent" /> About Section
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Heading</Label>
            <Input value={form.aboutHeading ?? ''} onChange={e => set('aboutHeading', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Paragraph 1</Label>
            <Textarea rows={4} value={form.aboutBody1 ?? ''} onChange={e => set('aboutBody1', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Paragraph 2</Label>
            <Textarea rows={4} value={form.aboutBody2 ?? ''} onChange={e => set('aboutBody2', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>About Section Image</Label>
            <ImageDropzone
              image={form.aboutImage ?? ''}
              onUpload={url => set('aboutImage', url)}
              onUrlChange={url => set('aboutImage', url)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card className="glass-card border-accent/10">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-accent" /> About Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">The 4 number cards shown in the About section.</p>
          {(form.aboutStats ?? DEFAULT_CONTENT.aboutStats).map((stat, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input
                className="w-24 shrink-0 h-8 text-sm text-center font-bold"
                placeholder="15+"
                value={stat.number}
                onChange={e => {
                  const stats = [...(form.aboutStats ?? DEFAULT_CONTENT.aboutStats)];
                  stats[i] = { ...stats[i], number: e.target.value };
                  set('aboutStats', stats);
                }}
              />
              <Input
                className="flex-1 h-8 text-sm"
                placeholder="Projects Built"
                value={stat.label}
                onChange={e => {
                  const stats = [...(form.aboutStats ?? DEFAULT_CONTENT.aboutStats)];
                  stats[i] = { ...stats[i], label: e.target.value };
                  set('aboutStats', stats);
                }}
              />
              <Button size="icon" variant="ghost" className="shrink-0 hover:text-destructive" onClick={() => {
                const stats = (form.aboutStats ?? DEFAULT_CONTENT.aboutStats).filter((_, j) => j !== i);
                set('aboutStats', stats);
              }}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
          <Button size="sm" variant="outline" className="border-dashed w-full border-accent/30 text-muted-foreground hover:text-foreground"
            onClick={() => set('aboutStats', [...(form.aboutStats ?? DEFAULT_CONTENT.aboutStats), { number: '', label: '' }])}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add stat
          </Button>
        </CardContent>
      </Card>

      <Card className="glass-card border-accent/10">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-accent" /> Footer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Footer Bio Text</Label>
            <Textarea rows={3} value={form.footerBio ?? ''} onChange={e => set('footerBio', e.target.value)} placeholder="Short bio shown in the footer brand column…" />
          </div>
        </CardContent>
      </Card>

      <Button
        className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
        onClick={() => saveMut.mutate()}
        disabled={saveMut.isPending}
      >
        {saveMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Save — Changes Go Live Immediately
      </Button>
    </div>
  );
}

// ── CV Tab ─────────────────────────────────────────────────────────────────────

function BulletList({ bullets, onChange }: { bullets: string[]; onChange: (b: string[]) => void }) {
  return (
    <div className="space-y-2">
      {bullets.map((b, i) => (
        <div key={i} className="flex gap-2 items-start">
          <span className="mt-2.5 text-muted-foreground text-xs shrink-0">•</span>
          <Input
            className="flex-1 text-sm"
            value={b}
            onChange={e => { const n = [...bullets]; n[i] = e.target.value; onChange(n); }}
            placeholder="Bullet point..."
          />
          <Button size="icon" variant="ghost" className="shrink-0 hover:text-destructive" onClick={() => onChange(bullets.filter((_, j) => j !== i))}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      ))}
      <Button size="sm" variant="outline" className="border-dashed border-accent/30 text-muted-foreground hover:text-foreground w-full" onClick={() => onChange([...bullets, ''])}>
        <Plus className="w-3.5 h-3.5 mr-1" /> Add bullet
      </Button>
    </div>
  );
}

function CVTab() {
  const qc = useQueryClient();
  const [cv, setCv] = useState<CVData>(DEFAULT_CV);
  const [openSection, setOpenSection] = useState<string>('header');

  const { data: saved, isLoading } = useQuery({ queryKey: ['cv'], queryFn: fb.getCV, staleTime: 5 * 60 * 1000 });
  useEffect(() => { if (saved) setCv(saved); }, [saved]);

  const setH = (k: keyof CVData['header'], v: string) =>
    setCv(prev => ({ ...prev, header: { ...prev.header, [k]: v } }));

  const saveMut = useMutation({
    mutationFn: () => fb.saveCV(cv),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cv'] }); toast.success('CV saved! Changes are live at /resume'); },
    onError: (err) => toast.error(`Failed: ${(err as Error).message}`),
  });

  const uid = () => Date.now().toString();

  const addExp = () => setCv(prev => ({
    ...prev,
    experience: [...prev.experience, { id: uid(), title: '', badge: 'Full-time', org: '', date: '', bullets: [''] }],
  }));
  const addProj = () => setCv(prev => ({
    ...prev,
    projects: [...prev.projects, { id: uid(), name: '', liveUrl: '', githubUrl: '', tech: '', bullets: [''] }],
  }));
  const addEdu = () => setCv(prev => ({
    ...prev,
    education: [...prev.education, { id: uid(), degree: '', school: '', date: '', gpa: '' }],
  }));

  const upExp  = (id: string, patch: Partial<CVExperience>) =>
    setCv(prev => ({ ...prev, experience: prev.experience.map(e => e.id === id ? { ...e, ...patch } : e) }));
  const delExp = (id: string) =>
    setCv(prev => ({ ...prev, experience: prev.experience.filter(e => e.id !== id) }));

  const upProj  = (id: string, patch: Partial<CVProject>) =>
    setCv(prev => ({ ...prev, projects: prev.projects.map(p => p.id === id ? { ...p, ...patch } : p) }));
  const delProj = (id: string) =>
    setCv(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== id) }));

  const upEdu  = (id: string, patch: Partial<CVEducation>) =>
    setCv(prev => ({ ...prev, education: prev.education.map(e => e.id === id ? { ...e, ...patch } : e) }));
  const delEdu = (id: string) =>
    setCv(prev => ({ ...prev, education: prev.education.filter(e => e.id !== id) }));

  const upLang = (i: number, patch: Partial<CVLanguage>) =>
    setCv(prev => { const l = [...prev.languages]; l[i] = { ...l[i], ...patch }; return { ...prev, languages: l }; });
  const delLang = (i: number) =>
    setCv(prev => ({ ...prev, languages: prev.languages.filter((_, j) => j !== i) }));

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
    <Card className="glass-card border-accent/10">
      <button
        className="w-full flex items-center justify-between p-4 text-left"
        onClick={() => setOpenSection(openSection === id ? '' : id)}
      >
        <span className="font-semibold text-foreground">{title}</span>
        <ChevronRight className={`w-4 h-4 text-accent transition-transform ${openSection === id ? 'rotate-90' : ''}`} />
      </button>
      {openSection === id && <CardContent className="pt-0 pb-5 px-5 space-y-4 border-t border-border/40">{children}</CardContent>}
    </Card>
  );

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Sticky action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2">
        <p className="text-sm text-muted-foreground">Edit each section below, then save all at once.</p>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" className="border-accent/30 text-accent flex-1 sm:flex-none" asChild>
            <a href="/resume" target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Preview</a>
          </Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90 flex-1 sm:flex-none" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
            {saveMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save All
          </Button>
        </div>
      </div>

      {/* Personal Info */}
      <Section id="header" title="Personal Info">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {([['name','Full Name'],['role','Role / Title'],['tagline1','Tagline 1'],['tagline2','Tagline 2'],['email','Email'],['phone','Phone'],['location','Location'],['linkedin','LinkedIn URL'],['portfolio','Portfolio URL'],['github','GitHub URL']] as [keyof CVData['header'], string][]).map(([k, label]) => (
            <div key={k} className="space-y-1">
              <Label className="text-xs text-muted-foreground">{label}</Label>
              <Input value={cv.header[k]} onChange={e => setH(k, e.target.value)} className="h-8 text-sm" />
            </div>
          ))}
        </div>
      </Section>

      {/* Summary */}
      <Section id="summary" title="Summary">
        <Textarea rows={4} value={cv.summary} onChange={e => setCv(prev => ({ ...prev, summary: e.target.value }))} placeholder="Professional summary..." />
      </Section>

      {/* Skills */}
      <Section id="skills" title="Skills Table">
        <div className="space-y-2">
          {cv.skills.map((s, i) => (
            <div key={i} className="flex flex-col xs:flex-row gap-1.5 xs:gap-2 xs:items-center">
              <div className="flex gap-1.5 items-center">
                <Input className="w-full xs:w-32 sm:w-36 h-8 text-sm font-medium" placeholder="Category" value={s.label} onChange={e => { const sk = [...cv.skills]; sk[i] = { ...sk[i], label: e.target.value }; setCv(p => ({ ...p, skills: sk })); }} />
                <Button size="icon" variant="ghost" className="shrink-0 xs:hidden hover:text-destructive" onClick={() => setCv(p => ({ ...p, skills: p.skills.filter((_, j) => j !== i) }))}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
              <Input className="flex-1 h-8 text-sm" placeholder="Technologies..." value={s.value} onChange={e => { const sk = [...cv.skills]; sk[i] = { ...sk[i], value: e.target.value }; setCv(p => ({ ...p, skills: sk })); }} />
              <Button size="icon" variant="ghost" className="shrink-0 hidden xs:flex hover:text-destructive" onClick={() => setCv(p => ({ ...p, skills: p.skills.filter((_, j) => j !== i) }))}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
          <Button size="sm" variant="outline" className="border-dashed border-accent/30 text-muted-foreground hover:text-foreground w-full" onClick={() => setCv(p => ({ ...p, skills: [...p.skills, { label: '', value: '' }] }))}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add skill row
          </Button>
        </div>
      </Section>

      {/* Experience */}
      <Section id="experience" title={`Work Experience (${cv.experience.length})`}>
        <div className="space-y-5">
          {cv.experience.map(exp => (
            <div key={exp.id} className="border border-border/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{exp.title || 'New Entry'}</span>
                <Button size="icon" variant="ghost" className="shrink-0 hover:text-destructive" onClick={() => delExp(exp.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                <div className="space-y-1"><Label className="text-xs text-muted-foreground">Job Title</Label><Input className="h-8 text-sm" value={exp.title} onChange={e => upExp(exp.id, { title: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs text-muted-foreground">Badge (Full-time / Freelance / Internship)</Label><Input className="h-8 text-sm" value={exp.badge} onChange={e => upExp(exp.id, { badge: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs text-muted-foreground">Organization</Label><Input className="h-8 text-sm" value={exp.org} onChange={e => upExp(exp.id, { org: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs text-muted-foreground">Date Range</Label><Input className="h-8 text-sm" value={exp.date} onChange={e => upExp(exp.id, { date: e.target.value })} placeholder="Jan 2024 – Present" /></div>
              </div>
              <div className="space-y-1"><Label className="text-xs text-muted-foreground">Bullet Points</Label><BulletList bullets={exp.bullets} onChange={b => upExp(exp.id, { bullets: b })} /></div>
            </div>
          ))}
          <Button variant="outline" className="w-full border-dashed border-accent/30 text-muted-foreground hover:text-foreground" onClick={addExp}>
            <Plus className="w-4 h-4 mr-2" /> Add Experience
          </Button>
        </div>
      </Section>

      {/* Projects */}
      <Section id="projects" title={`Projects in CV (${cv.projects.length})`}>
        <div className="space-y-5">
          {cv.projects.map(proj => (
            <div key={proj.id} className="border border-border/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{proj.name || 'New Project'}</span>
                <Button size="icon" variant="ghost" className="shrink-0 hover:text-destructive" onClick={() => delProj(proj.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                <div className="space-y-1"><Label className="text-xs text-muted-foreground">Project Name</Label><Input className="h-8 text-sm" value={proj.name} onChange={e => upProj(proj.id, { name: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs text-muted-foreground">Tech Stack</Label><Input className="h-8 text-sm" value={proj.tech} onChange={e => upProj(proj.id, { tech: e.target.value })} placeholder="React · TypeScript" /></div>
                <div className="space-y-1"><Label className="text-xs text-muted-foreground">Live URL</Label><Input className="h-8 text-sm" value={proj.liveUrl} onChange={e => upProj(proj.id, { liveUrl: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs text-muted-foreground">GitHub URL</Label><Input className="h-8 text-sm" value={proj.githubUrl} onChange={e => upProj(proj.id, { githubUrl: e.target.value })} /></div>
              </div>
              <div className="space-y-1"><Label className="text-xs text-muted-foreground">Bullet Points</Label><BulletList bullets={proj.bullets} onChange={b => upProj(proj.id, { bullets: b })} /></div>
            </div>
          ))}
          <Button variant="outline" className="w-full border-dashed border-accent/30 text-muted-foreground hover:text-foreground" onClick={addProj}>
            <Plus className="w-4 h-4 mr-2" /> Add Project
          </Button>
        </div>
      </Section>

      {/* Education */}
      <Section id="education" title={`Education (${cv.education.length})`}>
        <div className="space-y-4">
          {cv.education.map(edu => (
            <div key={edu.id} className="border border-border/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{edu.degree || 'New Entry'}</span>
                <Button size="icon" variant="ghost" className="shrink-0 hover:text-destructive" onClick={() => delEdu(edu.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                <div className="space-y-1"><Label className="text-xs text-muted-foreground">Degree</Label><Input className="h-8 text-sm" value={edu.degree} onChange={e => upEdu(edu.id, { degree: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs text-muted-foreground">GPA</Label><Input className="h-8 text-sm" value={edu.gpa} onChange={e => upEdu(edu.id, { gpa: e.target.value })} placeholder="3.5 / 4.0" /></div>
                <div className="space-y-1 sm:col-span-2"><Label className="text-xs text-muted-foreground">School</Label><Input className="h-8 text-sm" value={edu.school} onChange={e => upEdu(edu.id, { school: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs text-muted-foreground">Date</Label><Input className="h-8 text-sm" value={edu.date} onChange={e => upEdu(edu.id, { date: e.target.value })} placeholder="Graduated 2025" /></div>
              </div>
            </div>
          ))}
          <Button variant="outline" className="w-full border-dashed border-accent/30 text-muted-foreground hover:text-foreground" onClick={addEdu}>
            <Plus className="w-4 h-4 mr-2" /> Add Education
          </Button>
        </div>
      </Section>

      {/* Languages */}
      <Section id="languages" title="Languages">
        <div className="space-y-2">
          {cv.languages.map((lang, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input className="flex-1 h-8 text-sm" placeholder="Language" value={lang.name} onChange={e => upLang(i, { name: e.target.value })} />
              <Input className="w-36 shrink-0 h-8 text-sm" placeholder="Level (Native, B2…)" value={lang.level} onChange={e => upLang(i, { level: e.target.value })} />
              <Button size="icon" variant="ghost" className="shrink-0 hover:text-destructive" onClick={() => delLang(i)}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
          <Button size="sm" variant="outline" className="border-dashed border-accent/30 text-muted-foreground hover:text-foreground w-full" onClick={() => setCv(p => ({ ...p, languages: [...p.languages, { name: '', level: '' }] }))}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add language
          </Button>
        </div>
      </Section>

      {/* Bottom save button */}
      <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
        {saveMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Save All Changes
      </Button>
    </div>
  );
}

// ── Login Screen ──────────────────────────────────────────────────────────────

function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);

  const attempt = async () => {
    const buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
    const hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    if (hash === import.meta.env.VITE_ADMIN_HASH) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      onSuccess();
    } else {
      setError(true);
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--hero-gradient-from))] via-[hsl(var(--hero-gradient-via))] to-[hsl(var(--hero-gradient-to))]" />
      <motion.div
        animate={shaking ? { x: [-8, 8, -8, 8, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-sm mx-4"
      >
        <Card className="glass-card border-accent/20 shadow-2xl">
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7 text-accent" />
              </div>
              <h1 className="text-2xl font-bold gradient-text">Admin Panel</h1>
              <p className="text-sm text-muted-foreground">Enter your password to continue</p>
            </div>
            <div className="space-y-3">
              <div className="relative">
                <Input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(false); }}
                  onKeyDown={e => { if (e.key === 'Enter') attempt(); }}
                  className={error ? 'border-destructive focus-visible:ring-destructive' : ''}
                  autoFocus
                />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <AnimatePresence>
                {error && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-xs text-destructive">
                    Incorrect password. Please try again.
                  </motion.p>
                )}
              </AnimatePresence>
              <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={attempt} disabled={!password}>
                Enter Admin
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// ── Admin Dashboard ───────────────────────────────────────────────────────────

// ── Develop Tab (admin-only project notes) ───────────────────────────────────

const STAGE_OPTIONS = ['Not set', ...LIFECYCLE_STAGES];

const STAGE_COLORS: Record<string, string> = {
  'Not set':   'border-muted-foreground/30 text-muted-foreground',
  Idea:        'border-purple-500/40 text-purple-400',
  Planning:    'border-blue-500/40 text-blue-400',
  Design:      'border-pink-500/40 text-pink-400',
  Development: 'border-yellow-500/40 text-yellow-400',
  Testing:     'border-orange-500/40 text-orange-400',
  Deployment:  'border-cyan-500/40 text-cyan-400',
  Live:        'border-green-500/40 text-green-400',
  Maintenance: 'border-teal-500/40 text-teal-400',
  'On Hold':   'border-muted-foreground/40 text-muted-foreground',
};

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// Reusable editable checklist (used for AI prompts, features, to-dos)
function DevList({
  items, onChange, placeholder, multiline, showCheckbox,
}: {
  items: DevItem[];
  onChange: (items: DevItem[]) => void;
  placeholder: string;
  multiline?: boolean;
  showCheckbox?: boolean;
}) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onChange([...items, { id: uid(), text: v, done: false }]);
    setDraft('');
  };
  const update = (id: string, patch: Partial<DevItem>) =>
    onChange(items.map(it => it.id === id ? { ...it, ...patch } : it));
  const remove = (id: string) => onChange(items.filter(it => it.id !== id));

  const rowAlign = multiline ? 'items-start' : 'items-center';

  return (
    <div className="space-y-1.5">
      {items.map(it => (
        <div key={it.id} className={`flex gap-1.5 group ${rowAlign}`}>
          {showCheckbox && (
            <Checkbox
              className="shrink-0"
              checked={it.done}
              onCheckedChange={v => update(it.id, { done: !!v })}
            />
          )}
          {multiline ? (
            <Textarea
              rows={2}
              value={it.text}
              onChange={e => update(it.id, { text: e.target.value })}
              className={`flex-1 min-w-0 text-sm min-h-0 py-1.5 ${it.done ? 'line-through text-muted-foreground' : ''}`}
            />
          ) : (
            <Input
              value={it.text}
              onChange={e => update(it.id, { text: e.target.value })}
              className={`flex-1 min-w-0 h-8 text-sm ${it.done ? 'line-through text-muted-foreground' : ''}`}
            />
          )}
          <Button
            size="icon" variant="ghost"
            aria-label="Remove"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
            onClick={() => remove(it.id)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ))}
      <div className="flex items-start gap-1.5">
        {multiline ? (
          <Textarea
            rows={2}
            placeholder={placeholder}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); add(); } }}
            className="flex-1 min-w-0 text-sm min-h-0 py-1.5"
          />
        ) : (
          <Input
            placeholder={placeholder}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
            className="flex-1 min-w-0 h-8 text-sm"
          />
        )}
        <Button size="icon" variant="outline" aria-label="Add" className="h-8 w-8 border-accent/30 shrink-0" onClick={add} disabled={!draft.trim()}>
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

function DevSection({ icon: Icon, title, hint, count, done, children }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
  count?: number;
  done?: number;          // when provided, badge shows done/total + complete state
  children: React.ReactNode;
}) {
  const allDone = count !== undefined && count > 0 && done === count;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 flex-wrap">
        <Icon className="w-3.5 h-3.5 text-accent shrink-0" />
        <h4 className="text-xs sm:text-sm font-semibold text-foreground">{title}</h4>
        {!!count && (
          <span className={`text-[10px] font-medium leading-none rounded-full px-1.5 py-0.5 ${allDone ? 'bg-green-500/15 text-green-500' : 'bg-accent/10 text-accent'}`}>
            {done !== undefined ? `${done}/${count}` : count}
          </span>
        )}
        {allDone && <Check className="w-3.5 h-3.5 text-green-500" />}
        {hint && <span className="text-[11px] text-muted-foreground hidden sm:inline">· {hint}</span>}
      </div>
      {children}
    </div>
  );
}

function DevelopTab() {
  const qc = useQueryClient();
  const [data, setData] = useState<Record<string, ProjectDev>>({});
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);   // read inside debounce without re-triggering it
  const seeded = useRef(false);     // seed local state from Firestore only once

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: fb.getProjects,
  });
  const { data: saved, isLoading: loadingDev } = useQuery({
    queryKey: ['develop'],
    queryFn: fb.getDevelopData,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (saved && !seeded.current) { setData(saved); seeded.current = true; }
  }, [saved]);

  const saveMut = useMutation({
    mutationFn: (next: Record<string, ProjectDev>) => fb.saveDevelopData(next),
    onSuccess: (_res, next) => {
      // Keep the query cache in sync without a refetch (a refetch could clobber
      // edits typed while the save was in flight).
      qc.setQueryData(['develop'], next);
      dirtyRef.current = false;
      setDirty(false);
    },
    onError: (err) => toast.error(`Autosave failed: ${(err as Error).message}`),
  });

  // Debounced autosave — fires ~900ms after the last edit, any single section is enough.
  useEffect(() => {
    if (!dirtyRef.current) return;
    const t = setTimeout(() => saveMut.mutate(data), 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const get = (id: string): ProjectDev => data[id] ?? emptyProjectDev();
  const patch = (id: string, p: Partial<ProjectDev>) => {
    setData(prev => ({ ...prev, [id]: { ...get(id), ...p } }));
    dirtyRef.current = true;
    setDirty(true);
  };

  const isLoading = loadingProjects || loadingDev;

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  if (projects.length === 0) {
    return (
      <Card className="border-accent/30 bg-accent/5">
        <CardContent className="p-5">
          <p className="font-semibold text-foreground">No projects yet</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Add projects in the <span className="text-accent">Projects</span> tab first — then plan their development here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const openCount = (d: ProjectDev) => d.todos.filter(t => !t.done).length;
  const doneCount = (items: DevItem[]) => items.filter(t => t.done).length;
  const progress = (d: ProjectDev) => {
    const all = [...d.aiPrompts, ...d.features, ...d.todos];
    return { done: all.filter(t => t.done).length, total: all.length };
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header — autosave status sticks to the top on mobile so it's always visible */}
      <div className="flex items-start justify-between gap-2 sticky top-14 sm:top-16 z-20 -mx-3 sm:mx-0 px-3 sm:px-0 py-2 bg-background/80 backdrop-blur-sm">
        <p className="text-xs sm:text-sm text-muted-foreground leading-snug">
          Private planning notes for {projects.length} project{projects.length !== 1 ? 's' : ''}. Changes save automatically.
        </p>
        <div className="flex items-center gap-1.5 text-xs sm:text-sm shrink-0 text-muted-foreground whitespace-nowrap">
          {saveMut.isPending ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin text-accent" /> <span className="hidden xs:inline">Saving…</span></>
          ) : dirty ? (
            <><span className="w-2 h-2 rounded-full bg-yellow-500" /> <span className="hidden xs:inline">Unsaved…</span></>
          ) : (
            <><Check className="w-3.5 h-3.5 text-green-500" /> <span className="hidden xs:inline">Saved</span></>
          )}
        </div>
      </div>

      <Accordion type="multiple" className="space-y-2.5">
        {projects.map(project => {
          const d = get(project.id!);
          const open = openCount(d);
          const prog = progress(d);
          const allDone = prog.total > 0 && prog.done === prog.total;
          return (
            <AccordionItem
              key={project.id}
              value={project.id!}
              className="glass-card border border-accent/10 rounded-xl px-3 sm:px-4 data-[state=open]:border-accent/30"
            >
              <AccordionTrigger className="hover:no-underline py-2.5 gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 flex-wrap text-left">
                  <span className="font-semibold text-sm text-foreground truncate max-w-full">{project.title}</span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    <Badge variant="outline" className={`text-[10px] px-1.5 ${STAGE_COLORS[d.stage] ?? 'border-accent/30 text-accent'}`}>
                      {d.stage}
                    </Badge>
                    {prog.total > 0 && (
                      <Badge variant="outline" className={`text-[10px] px-1.5 flex items-center gap-1 ${allDone ? 'border-green-500/40 text-green-500' : 'border-accent/30 text-accent'}`}>
                        {allDone && <Check className="w-3 h-3" />}{prog.done}/{prog.total} done
                      </Badge>
                    )}
                    {open > 0 && (
                      <Badge variant="outline" className="text-[10px] px-1.5 border-yellow-500/30 text-yellow-500">
                        {open} to-do{open !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 pt-1 space-y-3.5">

                {/* Stage */}
                <DevSection icon={KanbanSquare} title="Lifecycle Stage">
                  <Select value={d.stage} onValueChange={v => patch(project.id!, { stage: v })}>
                    <SelectTrigger className="h-9 w-full sm:max-w-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STAGE_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </DevSection>

                <Separator className="bg-border/50" />

                {/* AI prompts */}
                <DevSection icon={Sparkles} title="AI Prompts" hint="tick when run" count={d.aiPrompts.length} done={doneCount(d.aiPrompts)}>
                  <DevList
                    items={d.aiPrompts}
                    onChange={v => patch(project.id!, { aiPrompts: v })}
                    placeholder="Add an AI prompt…"
                    multiline
                    showCheckbox
                  />
                </DevSection>

                <Separator className="bg-border/50" />

                {/* Features / comments */}
                <DevSection icon={MessageSquarePlus} title="Comments & Features" hint="tick when done" count={d.features.length} done={doneCount(d.features)}>
                  <DevList
                    items={d.features}
                    onChange={v => patch(project.id!, { features: v })}
                    placeholder="Add a feature idea or comment…"
                    showCheckbox
                  />
                </DevSection>

                <Separator className="bg-border/50" />

                {/* To-dos */}
                <DevSection icon={ListChecks} title="What To Do Next" hint="tick when done" count={d.todos.length} done={doneCount(d.todos)}>
                  <DevList
                    items={d.todos}
                    onChange={v => patch(project.id!, { todos: v })}
                    placeholder="Add a next step…"
                    showCheckbox
                  />
                </DevSection>

                <Separator className="bg-border/50" />

                {/* Notes */}
                <DevSection icon={FileText} title="Notes">
                  <Textarea
                    rows={3}
                    placeholder="Freeform scratchpad…"
                    value={d.notes}
                    onChange={e => patch(project.id!, { notes: e.target.value })}
                    className="text-sm"
                  />
                </DevSection>

              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
              <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
            </div>
            <span className="font-bold gradient-text text-base sm:text-lg truncate">Portfolio Admin</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <Button variant="ghost" size="sm" className="hidden sm:flex" asChild>
              <a href="/" target="_blank" rel="noopener noreferrer"><Eye className="w-4 h-4 mr-1.5" /> View Site</a>
            </Button>
            <Button variant="ghost" size="icon" className="sm:hidden" asChild>
              <a href="/" target="_blank" rel="noopener noreferrer"><Eye className="w-4 h-4" /></a>
            </Button>
            <Button variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive hover:text-white" onClick={onLogout}>
              <LogOut className="w-4 h-4" /><span className="hidden sm:inline ml-1.5">Logout</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <Tabs defaultValue="projects">
          {/* Horizontally scrollable tab bar on mobile */}
          <div className="w-full mb-6 sm:mb-8 overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-0.5 [&::-webkit-scrollbar-thumb]:bg-border/50 [&::-webkit-scrollbar-thumb]:rounded-full">
            <TabsList className="bg-secondary/50 border border-border/50 inline-flex h-auto gap-0.5 p-1 w-max min-w-full sm:w-auto sm:flex-wrap">
              {[
                { value: 'projects', icon: FolderOpen,  label: 'Projects' },
                { value: 'develop',  icon: KanbanSquare, label: 'Develop' },
                { value: 'skills',   icon: Layers,       label: 'Skills' },
                { value: 'blog',     icon: BookOpen,     label: 'Blog' },
                { value: 'about',    icon: Users,        label: 'About Cards' },
                { value: 'contact',  icon: Mail,         label: 'Contact' },
                { value: 'content',  icon: FileText,     label: 'Hero/About' },
                { value: 'cv',       icon: FileText,     label: 'CV Editor' },
              ].map(({ value, icon: Icon, label }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm data-[state=active]:bg-accent data-[state=active]:text-accent-foreground whitespace-nowrap"
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="projects"><ProjectsTab /></TabsContent>
          <TabsContent value="develop"><DevelopTab /></TabsContent>
          <TabsContent value="skills"><SkillsTab /></TabsContent>
          <TabsContent value="blog"><BlogTab /></TabsContent>
          <TabsContent value="about"><AboutTab /></TabsContent>
          <TabsContent value="contact"><ContactTab /></TabsContent>
          <TabsContent value="content"><ContentTab /></TabsContent>
          <TabsContent value="cv"><CVTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────

export default function Admin() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === 'true');
  const logout = () => { sessionStorage.removeItem(SESSION_KEY); setAuthed(false); };
  return authed ? <AdminDashboard onLogout={logout} /> : <LoginScreen onSuccess={() => setAuthed(true)} />;
}
