import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Calendar as CalendarIcon, Clock, Plus, Trash2, CheckCircle2,
  Circle, AlertCircle, Video, Briefcase, FileText, ChevronLeft, ChevronRight,
  GripVertical, Filter, Tag, Check, CalendarDays, Sparkles, AlertTriangle, Wifi, WifiOff,
  Kanban, LayoutGrid, Play, Pause, RotateCcw, ExternalLink, Github, Search, Command,
  Download, ListTodo, Flame, BarChart2, Layers, CheckSquare, Zap, Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as fb from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import type { SchedulerItem, SchedulerItemType, SchedulerPriority, SchedulerStatus, SchedulerRecurring, SchedulerSubtask, SchedulerSortBy } from '@/types/portfolio';

// ── Storage Keys & Config ──────────────────────────────────────────────────────

const LOCAL_STORAGE_KEY = 'portfolio_scheduler_v3';

const TYPE_CONFIG: Record<SchedulerItemType, { label: string; icon: typeof CalendarIcon; color: string; bg: string }> = {
  meeting:  { label: 'Meeting',  icon: Video,       color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
  deadline: { label: 'Deadline', icon: AlertCircle,  color: 'text-rose-400',   bg: 'bg-rose-500/10 border-rose-500/30' },
  todo:     { label: 'To-Do',    icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  project:  { label: 'Project',  icon: Briefcase,    color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30' },
};

const PRIORITY_CONFIG: Record<SchedulerPriority, { label: string; color: string; dotBg: string }> = {
  high:   { label: 'High',   color: 'text-rose-400 border-rose-500/30',   dotBg: 'bg-rose-500' },
  medium: { label: 'Medium', color: 'text-amber-400 border-amber-500/30', dotBg: 'bg-amber-500' },
  low:    { label: 'Low',    color: 'text-blue-400 border-blue-500/30',   dotBg: 'bg-blue-500' },
};

const STATUS_CONFIG: Record<SchedulerStatus, { label: string; color: string; bg: string }> = {
  backlog:     { label: 'Backlog',     color: 'text-muted-foreground', bg: 'bg-secondary/40 border-border/40' },
  scheduled:   { label: 'Scheduled',   color: 'text-blue-400',          bg: 'bg-blue-500/10 border-blue-500/30' },
  in_progress: { label: 'In Progress', color: 'text-amber-400',         bg: 'bg-amber-500/10 border-amber-500/30' },
  review:      { label: 'Code Review', color: 'text-purple-400',        bg: 'bg-purple-500/10 border-purple-500/30' },
  completed:   { label: 'Completed',   color: 'text-emerald-400',       bg: 'bg-emerald-500/10 border-emerald-500/30' },
};

const DEV_PRESETS = [
  { label: '🐛 Bug Fix', type: 'todo' as SchedulerItemType, priority: 'high' as SchedulerPriority, est: 45, tag: 'bug' },
  { label: '⚡ Feature Dev', type: 'project' as SchedulerItemType, priority: 'high' as SchedulerPriority, est: 120, tag: 'feature' },
  { label: '🔍 PR Review', type: 'todo' as SchedulerItemType, priority: 'medium' as SchedulerPriority, est: 30, tag: 'review' },
  { label: '🚀 Staging Deploy', type: 'deadline' as SchedulerItemType, priority: 'high' as SchedulerPriority, est: 30, tag: 'devops' },
  { label: '☕ Standup Sync', type: 'meeting' as SchedulerItemType, priority: 'low' as SchedulerPriority, est: 15, tag: 'meeting' },
  { label: '📝 Code Refactor', type: 'project' as SchedulerItemType, priority: 'medium' as SchedulerPriority, est: 90, tag: 'refactor' },
  { label: '🧪 Write Tests', type: 'todo' as SchedulerItemType, priority: 'medium' as SchedulerPriority, est: 60, tag: 'feature' },
  { label: '📦 Release Prep', type: 'deadline' as SchedulerItemType, priority: 'high' as SchedulerPriority, est: 45, tag: 'devops' },
];

const SORT_OPTIONS: { value: SchedulerSortBy; label: string }[] = [
  { value: 'priority', label: 'Priority' },
  { value: 'date', label: 'Date' },
  { value: 'title', label: 'Title' },
  { value: 'created', label: 'Created' },
];

const PRIORITY_ORDER: Record<SchedulerPriority, number> = { high: 0, medium: 1, low: 2 };

const PRESET_TAGS = ['frontend', 'backend', 'bug', 'feature', 'refactor', 'api', 'devops', 'meeting', 'design'];

// ── Persistence Helpers ───────────────────────────────────────────────────────

function loadLocal(): SchedulerItem[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) ?? '[]'); } catch { return []; }
}
function saveLocal(items: SchedulerItem[]) {
  try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items)); } catch { /**/ }
}
function clean<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

// ── Empty Form Factory ────────────────────────────────────────────────────────

const emptyForm = () => ({
  title: '', type: 'todo' as SchedulerItemType, priority: 'medium' as SchedulerPriority,
  status: 'backlog' as SchedulerStatus, date: '', time: '', duration: '',
  estMinutes: 30, actualMinutes: 0, notes: '', projectId: 'none',
  link: '', tags: [] as string[], recurring: 'none' as SchedulerRecurring,
  subtasks: [] as SchedulerSubtask[],
});

// ── Main Component ────────────────────────────────────────────────────────────

export function SchedulerTab() {
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: fb.getProjects });

  // Single Source of Truth for Scheduler items
  const [items, setItems] = useState<SchedulerItem[]>(loadLocal);
  const [fbStatus, setFbStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [fbError, setFbError] = useState('');
  const [syncing, setSyncing] = useState(false);

  // View state
  const [viewMode, setViewMode] = useState<'month' | 'sprint' | 'timeblock' | 'kanban'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SchedulerSortBy>('priority');
  const [showCompleted, setShowCompleted] = useState(true);
  const [importExportOpen, setImportExportOpen] = useState(false);

  // Command Palette
  const [cmdOpen, setCmdOpen] = useState(false);

  // Form Dialog
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [editingItem, setEditingItem] = useState<SchedulerItem | null>(null);

  // Active Focus Timer
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  // Sync Firebase on Mount
  const loadFromFirebase = useCallback(async () => {
    if (!isFirebaseConfigured) {
      setFbStatus('error');
      setFbError('VITE_FIREBASE_API_KEY is not set — running in local-only mode.');
      return;
    }
    try {
      const remote = await fb.getSchedulerItems();
      setItems(remote);
      saveLocal(remote);
      setFbStatus('ok');
    } catch (err) {
      setFbStatus('error');
      setFbError((err as Error).message ?? 'Firebase load error');
      setItems(loadLocal());
    }
  }, []);

  useEffect(() => { loadFromFirebase(); }, [loadFromFirebase]);

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Timer Tick
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning) {
      interval = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  // Sync Helper
  const applyAndSync = async (optimistic: SchedulerItem[], firestoreOp: () => Promise<void>) => {
    setItems(optimistic);
    saveLocal(optimistic);
    if (!isFirebaseConfigured || fbStatus === 'error') return;
    setSyncing(true);
    try {
      await firestoreOp();
      setFbStatus('ok');
    } catch (err) {
      const msg = (err as Error).message ?? 'Firestore error';
      setFbError(msg);
      setFbStatus('error');
      toast.error(`Saved locally — Firebase error: ${msg}`);
    } finally {
      setSyncing(false);
    }
  };

  // ── Form Helpers ──────────────────────────────────────────────────────────────

  const setF = <K extends keyof ReturnType<typeof emptyForm>>(k: K, v: ReturnType<typeof emptyForm>[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const openForm = (presetDate?: string, item?: SchedulerItem) => {
    if (item) {
      setEditingItem(item);
      setForm({
        title: item.title, type: item.type, priority: item.priority,
        status: item.status ?? (item.completed ? 'completed' : item.date ? 'scheduled' : 'backlog'),
        date: item.date ?? '', time: item.time ?? '', duration: item.duration ?? '',
        estMinutes: item.estMinutes ?? 30, actualMinutes: item.actualMinutes ?? 0,
        notes: item.notes ?? '', projectId: item.projectId ?? 'none',
        link: item.link ?? '', tags: item.tags ?? [], recurring: item.recurring ?? 'none',
        subtasks: item.subtasks ?? [],
      });
    } else {
      setEditingItem(null);
      setForm({ ...emptyForm(), date: presetDate ?? '' });
    }
    setFormOpen(true);
  };

  const closeForm = () => { setFormOpen(false); setEditingItem(null); setForm(emptyForm()); };

  const applyPreset = (preset: typeof DEV_PRESETS[0]) => {
    setForm(prev => ({
      ...prev,
      title: preset.label.replace(/^.\s*/, ''),
      type: preset.type,
      priority: preset.priority,
      estMinutes: preset.est,
      tags: Array.from(new Set([...prev.tags, preset.tag])),
    }));
  };

  const toggleTagInForm = (tag: string) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag],
    }));
  };

  // ── Date / Helpers ───────────────────────────────────────────────────────
  const todayStr = new Date().toISOString().split('T')[0];

  const isOverdue = (item: SchedulerItem) => {
    if (!item.date || item.completed || item.status === 'completed') return false;
    return item.date < todayStr;
  };

  const sortItems = (list: SchedulerItem[]) => {
    const sorted = [...list];
    switch (sortBy) {
      case 'priority':
        sorted.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1));
        break;
      case 'date':
        sorted.sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999'));
        break;
      case 'title':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'created':
        sorted.sort((a, b) => {
          const ta = a.createdAt && typeof a.createdAt === 'object' && 'seconds' in a.createdAt ? (a.createdAt as any).seconds : 0;
          const tb = b.createdAt && typeof b.createdAt === 'object' && 'seconds' in b.createdAt ? (b.createdAt as any).seconds : 0;
          return tb - ta;
        });
        break;
    }
    return sorted;
  };

  const nextRecurringDate = (dateStr: string, rule: SchedulerRecurring): string => {
    const d = new Date(dateStr + 'T00:00:00');
    if (rule === 'daily') d.setDate(d.getDate() + 1);
    else if (rule === 'weekly') d.setDate(d.getDate() + 7);
    else if (rule === 'monthly') d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  };

  const toggleSubtask = async (item: SchedulerItem, subtaskId: string) => {
    if (!item.subtasks) return;
    const updated = items.map(i => {
      if (i.id !== item.id) return i;
      const subtasks = i.subtasks!.map(s => s.id === subtaskId ? { ...s, done: !s.done } : s);
      return { ...i, subtasks };
    });
    const patch = { subtasks: updated.find(i => i.id === item.id)!.subtasks };
    await applyAndSync(updated, () => fb.updateSchedulerItem(item.id, clean(patch as Record<string, unknown>)));
  };

  const addSubtask = async (item: SchedulerItem, text: string) => {
    if (!text.trim()) return;
    const newSub: SchedulerSubtask = { id: 'sub-' + Date.now(), text: text.trim(), done: false };
    const updated = items.map(i => i.id === item.id ? { ...i, subtasks: [...(i.subtasks ?? []), newSub] } : i);
    const patch = { subtasks: updated.find(i => i.id === item.id)!.subtasks };
    await applyAndSync(updated, () => fb.updateSchedulerItem(item.id, clean(patch as Record<string, unknown>)));
  };

  const deleteSubtask = async (item: SchedulerItem, subtaskId: string) => {
    if (!item.subtasks) return;
    const updated = items.map(i => i.id === item.id ? { ...i, subtasks: i.subtasks!.filter(s => s.id !== subtaskId) } : i);
    const patch = { subtasks: updated.find(i => i.id === item.id)!.subtasks };
    await applyAndSync(updated, () => fb.updateSchedulerItem(item.id, clean(patch as Record<string, unknown>)));
  };

  const duplicateItem = async (item: SchedulerItem) => {
    const { id: _id, createdAt: _ca, updatedAt: _ua, ...rest } = item;
    const dup: Omit<SchedulerItem, 'id'> = { ...rest, title: item.title + ' (copy)', completed: false, status: 'backlog', date: undefined, completedAt: undefined };
    const tempId = 'local-' + Date.now();
    const newItem: SchedulerItem = { ...dup, id: tempId };
    const optimistic = [newItem, ...items];
    setItems(optimistic);
    saveLocal(optimistic);
    if (isFirebaseConfigured && fbStatus !== 'error') {
      setSyncing(true);
      try {
        const realId = await fb.addSchedulerItem(dup as Omit<SchedulerItem, 'id'>);
        const synced = optimistic.map(i => i.id === tempId ? { ...i, id: realId } : i);
        setItems(synced); saveLocal(synced);
        toast.success('Task duplicated');
      } catch { toast.success('Duplicated locally'); }
      finally { setSyncing(false); }
    } else { toast.success('Duplicated locally'); }
  };

  // Export / Import JSON
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `scheduler_backup_${todayStr}.json`;
    a.click();
    toast.success('Exported scheduler data');
  };

  const importJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as SchedulerItem[];
        if (!Array.isArray(data)) throw new Error('Invalid format');
        await applyAndSync([...data, ...items], () => {
          return Promise.all(data.map(item => {
            const { id, ...rest } = item;
            return fb.addSchedulerItem(rest as Omit<SchedulerItem, 'id'>);
          })).then(() => {});
        });
        toast.success(`Imported ${data.length} tasks`);
      } catch { toast.error('Invalid JSON file'); }
    };
    reader.readAsText(file);
  };

  // ── CRUD Actions ─────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Please enter a title'); return; }

    const isDone = form.status === 'completed';
    const payload: Omit<SchedulerItem, 'id'> = {
      title: form.title.trim(),
      type: form.type,
      priority: form.priority,
      status: form.status,
      date: form.date || undefined,
      time: form.time || undefined,
      duration: form.duration || undefined,
      estMinutes: Number(form.estMinutes) || 30,
      actualMinutes: Number(form.actualMinutes) || 0,
      notes: form.notes.trim() || undefined,
      projectId: form.projectId !== 'none' ? form.projectId : undefined,
      link: form.link.trim() || undefined,
      tags: form.tags.length ? form.tags : undefined,
      recurring: form.recurring !== 'none' ? form.recurring : undefined,
      subtasks: form.subtasks.length ? form.subtasks : undefined,
      completed: isDone,
      completedAt: isDone ? new Date().toISOString() : undefined,
    };

    if (editingItem) {
      const updated = items.map(i => i.id === editingItem.id ? { ...i, ...payload } : i);
      await applyAndSync(updated, () => fb.updateSchedulerItem(editingItem.id, clean(payload)));
      toast.success('Task updated!');
    } else {
      const tempId = 'local-' + Date.now();
      const newItem: SchedulerItem = { ...payload, id: tempId };
      const optimistic = [newItem, ...items];
      setItems(optimistic);
      saveLocal(optimistic);

      if (isFirebaseConfigured && fbStatus !== 'error') {
        setSyncing(true);
        try {
          const realId = await fb.addSchedulerItem(clean(payload) as Omit<SchedulerItem, 'id'>);
          const synced = optimistic.map(i => i.id === tempId ? { ...i, id: realId } : i);
          setItems(synced);
          saveLocal(synced);
          setFbStatus('ok');
          toast.success('Task saved to Firebase ✓');
        } catch (err) {
          setFbError((err as Error).message);
          setFbStatus('error');
          toast.error('Saved locally (Firebase error)');
        } finally {
          setSyncing(false);
        }
      } else {
        toast.success('Task saved locally');
      }
    }

    closeForm();
  };

  const updateItemStatus = async (item: SchedulerItem, newStatus: SchedulerStatus) => {
    const isCompleted = newStatus === 'completed';
    const patch: Partial<SchedulerItem> = {
      status: newStatus,
      completed: isCompleted,
      date: newStatus === 'backlog' ? undefined : item.date ?? new Date().toISOString().split('T')[0],
      completedAt: isCompleted ? new Date().toISOString() : undefined,
    };
    let updated = items.map(i => i.id === item.id ? { ...i, ...patch } : i);
    await applyAndSync(updated, () => fb.updateSchedulerItem(item.id, clean(patch)));

    // Auto-generate next occurrence for recurring tasks
    if (isCompleted && item.recurring && item.recurring !== 'none' && item.date) {
      const nextDate = nextRecurringDate(item.date, item.recurring);
      const { id: _id, createdAt: _ca, updatedAt: _ua, completedAt: _cat, ...rest } = item;
      const nextItem: Omit<SchedulerItem, 'id'> = {
        ...rest,
        date: nextDate,
        status: 'scheduled',
        completed: false,
        completedAt: undefined,
        subtasks: rest.subtasks?.map(s => ({ ...s, done: false })) ?? [],
      };
      const tempId = 'local-' + Date.now();
      const optimisticNext: SchedulerItem = { ...nextItem, id: tempId };
      updated = [optimisticNext, ...updated];
      setItems(updated); saveLocal(updated);
      if (isFirebaseConfigured && fbStatus !== 'error') {
        try {
          const realId = await fb.addSchedulerItem(nextItem as Omit<SchedulerItem, 'id'>);
          const synced = updated.map(i => i.id === tempId ? { ...i, id: realId } : i);
          setItems(synced); saveLocal(synced);
        } catch { /* kept locally */ }
      }
      toast.success(`Recurring: next ${item.recurring} task created for ${nextDate}`);
    }
  };

  const scheduleOnDate = async (itemId: string, date: string | undefined, time?: string) => {
    const updated = items.map(i => i.id === itemId ? {
      ...i,
      date,
      time: time ?? i.time,
      status: (date ? (i.status === 'backlog' ? 'scheduled' : i.status) : 'backlog') as SchedulerStatus
    } : i);
    const patch = date !== undefined ? { date, time: time ?? null } : { date: null, time: null, status: 'backlog' };
    await applyAndSync(updated, () => fb.updateSchedulerItem(itemId, clean(patch as Record<string, unknown>)));
    toast.success(date ? `Scheduled for ${date}${time ? ` at ${time}` : ''}` : 'Moved to backlog');
    setDraggedId(null);
  };

  const deleteItem = async (id: string) => {
    const updated = items.filter(i => i.id !== id);
    await applyAndSync(updated, () => fb.deleteSchedulerItem(id));
    toast.success('Item deleted');
  };

  // ── Focus Timer Actions ──────────────────────────────────────────────────────

  const startFocusTimer = (item: SchedulerItem) => {
    setActiveTimerId(item.id);
    setTimerSeconds(0);
    setTimerRunning(true);
    toast.info(`Focus Timer started: ${item.title}`);
  };

  const saveFocusTimer = async () => {
    if (!activeTimerId) return;
    const minutesSpent = Math.max(1, Math.round(timerSeconds / 60));
    const target = items.find(i => i.id === activeTimerId);
    if (target) {
      const newActual = (target.actualMinutes ?? 0) + minutesSpent;
      const updated = items.map(i => i.id === activeTimerId ? { ...i, actualMinutes: newActual } : i);
      await applyAndSync(updated, () => fb.updateSchedulerItem(activeTimerId, { actualMinutes: newActual }));
      toast.success(`Logged +${minutesSpent} mins to "${target.title}"!`);
    }
    setTimerRunning(false);
    setActiveTimerId(null);
    setTimerSeconds(0);
  };

  // ── .ics Calendar Export ─────────────────────────────────────────────────────

  const exportIcsCalendar = () => {
    const scheduled = items.filter(i => i.date);
    if (scheduled.length === 0) { toast.error('No scheduled tasks to export'); return; }

    let ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Portfolio Developer Scheduler//EN'];
    scheduled.forEach(item => {
      const dtStart = item.date?.replace(/-/g, '') + (item.time ? 'T' + item.time.replace(':', '') + '00' : 'T090000');
      ics.push('BEGIN:VEVENT');
      ics.push(`SUMMARY:${item.title}`);
      ics.push(`DESCRIPTION:${item.notes ?? item.type.toUpperCase()}`);
      ics.push(`DTSTART:${dtStart}`);
      ics.push('END:VEVENT');
    });
    ics.push('END:VCALENDAR');

    const blob = new Blob([ics.join('\n')], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `developer_schedule_${new Date().toISOString().split('T')[0]}.ics`;
    link.click();
    toast.success('Downloaded .ics calendar file!');
  };

  // ── Date Math ────────────────────────────────────────────────────────────────

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  // Month Calendar Matrix
  const monthCells = useMemo(() => {
    const cells: { dateStr: string; dayNum: number | null }[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) cells.push({ dateStr: '', dayNum: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      cells.push({ dateStr: `${year}-${mm}-${dd}`, dayNum: d });
    }
    return cells;
  }, [year, month, firstDayOfWeek, daysInMonth]);

  // 7-Day Sprint View Dates (Mon-Sun of current week)
  const sprintDays = useMemo(() => {
    const curr = new Date(currentDate);
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(curr.setDate(diff));

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      return { dateStr, dayName, dayNum };
    });
  }, [currentDate]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (tagFilter && (!item.tags || !item.tags.includes(tagFilter))) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return item.title.toLowerCase().includes(q) || (item.notes && item.notes.toLowerCase().includes(q));
      }
      return true;
    });
  }, [items, typeFilter, tagFilter, searchQuery]);

  const scheduledMap = useMemo(() => {
    const map: Record<string, SchedulerItem[]> = {};
    filteredItems.forEach(i => { if (i.date) (map[i.date] ??= []).push(i); });
    return map;
  }, [filteredItems]);

  const unscheduled = useMemo(() => {
    const backlog = filteredItems.filter(i => !i.date || i.status === 'backlog');
    return showCompleted ? backlog : backlog.filter(i => !i.completed);
  }, [filteredItems, showCompleted]);

  const sortedUnscheduled = useMemo(() => sortItems(unscheduled), [unscheduled, sortBy]);

  // Analytics Metrics
  const metrics = useMemo(() => {
    const completed = items.filter(i => i.completed || i.status === 'completed');
    const totalEst = items.reduce((acc, i) => acc + (i.estMinutes ?? 0), 0);
    const totalActual = items.reduce((acc, i) => acc + (i.actualMinutes ?? 0), 0);
    const todayTasks = items.filter(i => i.date === todayStr);
    const overdueItems = items.filter(i => isOverdue(i));

    return {
      completedCount: completed.length,
      totalCount: items.length,
      completionRate: items.length ? Math.round((completed.length / items.length) * 100) : 0,
      totalEstHours: (totalEst / 60).toFixed(1),
      totalActualHours: (totalActual / 60).toFixed(1),
      todayCount: todayTasks.length,
      overdueCount: overdueItems.length,
    };
  }, [items, todayStr]);

  const activeTimerTask = items.find(i => i.id === activeTimerId);

  // Drag & Drop
  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedId(id);
  };
  const onDropDate = (e: React.DragEvent, date: string | undefined, time?: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedId;
    if (id) scheduleOnDate(id, date, time);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── Active Focus Timer Bar ── */}
      {activeTimerId && activeTimerTask && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-3 sm:p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 backdrop-blur-xl shadow-lg"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-amber-400 font-mono tracking-widest uppercase">Active Focus Session</p>
              <p className="text-sm font-semibold text-foreground truncate">{activeTimerTask.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="font-mono text-xl sm:text-2xl font-bold text-amber-400">
              {String(Math.floor(timerSeconds / 60)).padStart(2, '0')}:
              {String(timerSeconds % 60).padStart(2, '0')}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="border-amber-500/40 text-amber-400 hover:bg-amber-500 hover:text-black h-8 px-2.5"
              onClick={() => setTimerRunning(!timerRunning)}
            >
              {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              className="bg-amber-500 text-black hover:bg-amber-400 font-semibold h-8 text-xs px-3"
              onClick={saveFocusTimer}
            >
              <Check className="w-3.5 h-3.5 mr-1" /> Log Time
            </Button>
          </div>
        </motion.div>
      )}

      {/* ── Daily Standup & Velocity Summary Card ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="glass-card border-accent/15 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Today's Focus</p>
            <Target className="w-4 h-4 text-accent" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{metrics.todayCount} <span className="text-xs font-normal text-muted-foreground">tasks</span></p>
        </Card>
        <Card className="glass-card border-accent/15 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Completion</p>
            <CheckSquare className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{metrics.completionRate}% <span className="text-xs font-normal text-muted-foreground">({metrics.completedCount}/{metrics.totalCount})</span></p>
        </Card>
        <Card className="glass-card border-accent/15 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Overdue</p>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{metrics.overdueCount} <span className="text-xs font-normal text-muted-foreground">tasks</span></p>
        </Card>
        <Card className="glass-card border-accent/15 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Est. Dev Time</p>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{metrics.totalEstHours} <span className="text-xs font-normal text-muted-foreground">hrs</span></p>
        </Card>
        <Card className="glass-card border-accent/15 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Actual Dev Time</p>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{metrics.totalActualHours} <span className="text-xs font-normal text-muted-foreground">hrs logged</span></p>
        </Card>
      </div>

      {/* ── Top Bar: Search, Filters & View Switcher ── */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 glass-card p-4 rounded-xl border border-accent/15">
        
        {/* Left: View Mode Switcher */}
        <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-lg border border-border/50 overflow-x-auto">
          {[
            { id: 'month', label: 'Month', icon: CalendarIcon },
            { id: 'sprint', label: '7-Day Sprint', icon: Layers },
            { id: 'timeblock', label: 'Timeblock', icon: Clock },
            { id: 'kanban', label: 'Kanban Board', icon: Kanban },
          ].map(v => (
            <button
              key={v.id}
              onClick={() => setViewMode(v.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                viewMode === v.id
                  ? 'bg-accent text-accent-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
              }`}
            >
              <v.icon className="w-3.5 h-3.5" /> {v.label}
            </button>
          ))}
        </div>

        {/* Right: Search, Filter, Add, Command Palette & ICS */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Search */}
          <div className="relative flex-1 sm:w-44">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-xs bg-background/50 border-border/60"
            />
          </div>

          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-28 h-9 text-xs">
              <Filter className="w-3.5 h-3.5 mr-1" />
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="meeting">Meetings</SelectItem>
              <SelectItem value="deadline">Deadlines</SelectItem>
              <SelectItem value="todo">To-Dos</SelectItem>
              <SelectItem value="project">Project Tasks</SelectItem>
            </SelectContent>
          </Select>

          {/* Export ICS */}
          <Button variant="outline" size="sm" className="h-9 text-xs border-accent/30" onClick={exportIcsCalendar} title="Export to Google/Apple Calendar (.ics)">
            <Download className="w-3.5 h-3.5 sm:mr-1" /><span className="hidden sm:inline">Export .ics</span>
          </Button>

          {/* Export JSON */}
          <Button variant="outline" size="sm" className="h-9 text-xs border-accent/30" onClick={exportJson} title="Export all tasks as JSON backup">
            <Download className="w-3.5 h-3.5 sm:mr-1" /><span className="hidden sm:inline">Backup</span>
          </Button>

          {/* Import JSON */}
          <label className="inline-flex items-center">
            <Button variant="outline" size="sm" className="h-9 text-xs border-accent/30" asChild title="Import tasks from JSON backup">
              <span><Download className="w-3.5 h-3.5 sm:mr-1 rotate-180" /><span className="hidden sm:inline">Import</span></span>
            </Button>
            <input type="file" accept=".json" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = ''; }} />
          </label>

          {/* Command Palette Trigger */}
          <Button variant="outline" size="sm" className="h-9 text-xs border-border/60 text-muted-foreground hover:text-foreground" onClick={() => setCmdOpen(true)}>
            <Command className="w-3.5 h-3.5 mr-1" /> <kbd className="text-[10px] font-mono bg-secondary px-1 rounded">⌘K</kbd>
          </Button>

          {/* Add Task Button */}
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90 h-9 text-xs shrink-0" onClick={() => openForm()}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Task
          </Button>
        </div>
      </div>

      {/* Tags Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-muted-foreground text-[11px] font-medium mr-1">Tags:</span>
        <button
          onClick={() => setTagFilter(null)}
          className={`px-2 py-0.5 rounded-full border text-[10px] transition-all ${
            tagFilter === null ? 'bg-accent text-accent-foreground border-accent' : 'border-border/40 text-muted-foreground hover:text-foreground'
          }`}
        >
          All
        </button>
        {PRESET_TAGS.map(t => (
          <button
            key={t}
            onClick={() => setTagFilter(tagFilter === t ? null : t)}
            className={`px-2 py-0.5 rounded-full border text-[10px] transition-all ${
              tagFilter === t ? 'bg-accent text-accent-foreground border-accent' : 'border-border/40 text-muted-foreground hover:text-accent'
            }`}
          >
            #{t}
          </button>
        ))}
      </div>

      {/* Firebase Warning Banner */}
      {fbStatus === 'error' && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-400">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Firebase unavailable — items stored locally only</p>
            <p className="text-amber-400/70 mt-0.5">{fbError}</p>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          MAIN VIEW SWITCHER CONTENT
         ────────────────────────────────────────────────────────────────────────── */}

      {/* ── 1. MONTH VIEW ── */}
      {viewMode === 'month' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Backlog Column */}
          <Card
            className="lg:col-span-1 glass-card border-accent/15 flex flex-col min-h-[480px]"
            onDragOver={e => e.preventDefault()}
            onDrop={e => onDropDate(e, undefined)}
          >
            <CardHeader className="p-4 border-b border-border/40 pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent" /> Things To Do
                </CardTitle>
                <p className="text-[11px] text-muted-foreground">Unscheduled backlog · Drag to calendar</p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={v => setSortBy(v as SchedulerSortBy)}>
                  <SelectTrigger className="w-24 h-7 text-[10px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Badge variant="secondary" className="text-xs">{unscheduled.length}</Badge>
              </div>
            </CardHeader>

            <CardContent className="p-3 flex-1 flex flex-col space-y-2 overflow-y-auto max-h-[600px]">
              {sortedUnscheduled.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-border/50 rounded-lg">
                  <Sparkles className="w-8 h-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground font-medium">No unscheduled tasks</p>
                </div>
              ) : (
                sortedUnscheduled.map(item => (
                  <TaskCard
                    key={item.id}
                    item={item}
                    overdue={isOverdue(item)}
                    onDragStart={onDragStart}
                    onOpenForm={openForm}
                    onDelete={deleteItem}
                    onDuplicate={duplicateItem}
                    onStartFocus={startFocusTimer}
                    onToggleDone={updateItemStatus}
                    onToggleSubtask={toggleSubtask}
                  />
                ))
              )}
            </CardContent>
          </Card>

          {/* Month Calendar Column */}
          <Card className="lg:col-span-3 glass-card border-accent/15 flex flex-col">
            <CardHeader className="p-4 border-b border-border/40 pb-3 flex flex-row items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8 border-border/60" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h3 className="text-base font-bold text-foreground w-36 text-center">{MONTHS[month]} {year}</h3>
                <Button variant="outline" size="icon" className="h-8 w-8 border-border/60" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-accent" onClick={() => setCurrentDate(new Date())}>Today</Button>
              </div>
            </CardHeader>

            <CardContent className="p-3 sm:p-4 flex-1">
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                  <div key={d} className="text-xs font-semibold text-muted-foreground py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2 auto-rows-fr">
                {monthCells.map((cell, idx) => {
                  if (!cell.dayNum) return <div key={idx} className="min-h-[85px] sm:min-h-[105px] rounded-lg bg-secondary/10 opacity-30 pointer-events-none" />;
                  const dayItems = scheduledMap[cell.dateStr] ?? [];
                  const isToday = cell.dateStr === todayStr;
                  return (
                    <div
                      key={cell.dateStr}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => onDropDate(e, cell.dateStr)}
                      onClick={() => setSelectedDay(cell.dateStr)}
                      className={`group relative min-h-[85px] sm:min-h-[105px] p-1.5 rounded-lg border transition-all flex flex-col cursor-pointer ${
                        isToday ? 'border-accent bg-accent/10 shadow-sm' : 'border-border/40 bg-background/50 hover:border-accent/50 hover:bg-secondary/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ${isToday ? 'bg-accent text-accent-foreground' : 'text-foreground'}`}>
                          {cell.dayNum}
                        </span>
                        <button type="button" onClick={e => { e.stopPropagation(); openForm(cell.dateStr); }} className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted-foreground hover:text-accent">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="space-y-1 my-1 flex-1 overflow-y-auto max-h-[65px]">
                        {dayItems.slice(0, 3).map(item => {
                          const cfg = TYPE_CONFIG[item.type];
                          const itemOverdue = isOverdue(item);
                          return (
                            <div
                              key={item.id}
                              draggable
                              onDragStart={e => { e.stopPropagation(); onDragStart(e, item.id); }}
                              onClick={e => { e.stopPropagation(); openForm(cell.dateStr, item); }}
                              className={`text-[10px] px-1.5 py-0.5 rounded border truncate flex items-center gap-1 hover:scale-[1.02] ${item.completed ? 'opacity-50 line-through bg-secondary/40' : itemOverdue ? 'border-rose-500/50 bg-rose-500/10 text-rose-400' : `${cfg.bg} ${cfg.color}`}`}
                            >
                              <cfg.icon className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{item.time ? `${item.time} ${item.title}` : item.title}</span>
                            </div>
                          );
                        })}
                        {dayItems.length > 3 && <p className="text-[9px] text-muted-foreground font-semibold text-center">+{dayItems.length - 3} more</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── 2. 7-DAY SPRINT VIEW ── */}
      {viewMode === 'sprint' && (
        <Card className="glass-card border-accent/15 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); }}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h3 className="text-sm font-bold text-foreground">Week of {sprintDays[0].dateStr} — {sprintDays[6].dateStr}</h3>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); }}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => setCurrentDate(new Date())}>Current Week</Button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {sprintDays.map(day => {
              const dayItems = scheduledMap[day.dateStr] ?? [];
              const isToday = day.dateStr === todayStr;
              return (
                <div
                  key={day.dateStr}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => onDropDate(e, day.dateStr)}
                  className={`min-h-[400px] p-2 rounded-xl border flex flex-col ${
                    isToday ? 'border-accent bg-accent/5' : 'border-border/40 bg-secondary/10'
                  }`}
                >
                  <div className="text-center pb-2 mb-2 border-b border-border/30">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase">{day.dayName}</p>
                    <p className={`text-base font-bold rounded-full w-7 h-7 mx-auto flex items-center justify-center mt-0.5 ${isToday ? 'bg-accent text-accent-foreground' : 'text-foreground'}`}>
                      {day.dayNum}
                    </p>
                  </div>

                  <div className="space-y-2 flex-1 overflow-y-auto">
                    {dayItems.map(item => (
                      <TaskCard
                        key={item.id}
                        item={item}
                        compact
                        overdue={isOverdue(item)}
                        onDragStart={onDragStart}
                        onOpenForm={openForm}
                        onDelete={deleteItem}
                        onDuplicate={duplicateItem}
                        onStartFocus={startFocusTimer}
                        onToggleDone={updateItemStatus}
                        onToggleSubtask={toggleSubtask}
                      />
                    ))}
                  </div>

                  <Button size="sm" variant="ghost" className="w-full text-xs text-muted-foreground hover:text-accent mt-2 h-7" onClick={() => openForm(day.dateStr)}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── 3. TIMEBLOCK DAY VIEW ── */}
      {viewMode === 'timeblock' && (
        <Card className="glass-card border-accent/15 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" /> 24-Hour Timeblock Schedule for {todayStr}
            </h3>
            <Input type="date" value={todayStr} className="w-36 h-8 text-xs" />
          </div>

          <div className="space-y-1 max-h-[600px] overflow-y-auto pr-2">
            {Array.from({ length: 14 }, (_, i) => i + 8).map(hour => {
              const timeSlot = `${String(hour).padStart(2, '0')}:00`;
              const slotItems = (scheduledMap[todayStr] ?? []).filter(i => i.time && i.time.startsWith(String(hour).padStart(2, '0')));

              return (
                <div
                  key={hour}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => onDropDate(e, todayStr, timeSlot)}
                  className="flex items-start gap-3 p-2 rounded-lg border border-border/30 bg-secondary/10 hover:border-accent/30 min-h-[50px]"
                >
                  <span className="font-mono text-xs text-muted-foreground w-14 shrink-0 pt-1">{timeSlot}</span>
                  <div className="flex-1 flex flex-wrap gap-2">
                    {slotItems.map(item => (
                      <TaskCard
                        key={item.id}
                        item={item}
                        compact
                        overdue={isOverdue(item)}
                        onDragStart={onDragStart}
                        onOpenForm={openForm}
                        onDelete={deleteItem}
                        onDuplicate={duplicateItem}
                        onStartFocus={startFocusTimer}
                        onToggleDone={updateItemStatus}
                        onToggleSubtask={toggleSubtask}
                      />
                    ))}
                    {slotItems.length === 0 && (
                      <button
                        onClick={() => openForm(todayStr, { title: '', type: 'todo', priority: 'medium', time: timeSlot, completed: false } as any)}
                        className="text-xs text-muted-foreground/40 hover:text-accent pt-1"
                      >
                        + Click or drag to timeblock {timeSlot}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── 4. KANBAN WORKFLOW BOARD ── */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {(['backlog', 'scheduled', 'in_progress', 'review', 'completed'] as SchedulerStatus[]).map(statusKey => {
            const statusCfg = STATUS_CONFIG[statusKey];
            const colItems = filteredItems.filter(i => {
              if (statusKey === 'backlog') return i.status === 'backlog' || (!i.date && !i.completed);
              if (statusKey === 'completed') return i.completed || i.status === 'completed';
              return i.status === statusKey;
            });

            return (
              <div
                key={statusKey}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  if (draggedId) {
                    const target = items.find(i => i.id === draggedId);
                    if (target) updateItemStatus(target, statusKey);
                  }
                }}
                className="glass-card border-accent/15 p-3 rounded-xl flex flex-col min-h-[500px]"
              >
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-border/40">
                  <span className={`text-xs font-bold uppercase tracking-wider ${statusCfg.color}`}>{statusCfg.label}</span>
                  <Badge variant="secondary" className="text-xs">{colItems.length}</Badge>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto">
                  {colItems.map(item => (
                    <TaskCard
                      key={item.id}
                      item={item}
                      overdue={isOverdue(item)}
                      onDragStart={onDragStart}
                      onOpenForm={openForm}
                      onDelete={deleteItem}
                      onDuplicate={duplicateItem}
                      onStartFocus={startFocusTimer}
                      onToggleDone={updateItemStatus}
                      onToggleSubtask={toggleSubtask}
                    />
                  ))}
                </div>

                <Button size="sm" variant="ghost" className="w-full text-xs text-muted-foreground hover:text-accent mt-2 h-7" onClick={() => openForm(undefined, { status: statusKey } as any)}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Day Detail Modal ── */}
      <Dialog open={!!selectedDay} onOpenChange={v => !v && setSelectedDay(null)}>
        <DialogContent className="w-full sm:max-w-lg bg-background/95 backdrop-blur-xl border-accent/20 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="gradient-text text-lg flex items-center justify-between">
              <span className="flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-accent" /> Schedule for {selectedDay}</span>
              <Button size="sm" className="bg-accent text-accent-foreground text-xs" onClick={() => { const d = selectedDay; setSelectedDay(null); openForm(d ?? undefined); }}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Task
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            {selectedDay && (scheduledMap[selectedDay] ?? []).length === 0 ? (
              <div className="text-center py-8 border border-dashed border-border/40 rounded-lg">
                <p className="text-xs text-muted-foreground">Nothing scheduled for this day yet.</p>
              </div>
            ) : (
              selectedDay && (scheduledMap[selectedDay] ?? []).map(item => (
                <TaskCard
                  key={item.id}
                  item={item}
                  overdue={isOverdue(item)}
                  onDragStart={onDragStart}
                  onOpenForm={openForm}
                  onDelete={deleteItem}
                  onDuplicate={duplicateItem}
                  onStartFocus={startFocusTimer}
                  onToggleDone={updateItemStatus}
                  onToggleSubtask={toggleSubtask}
                />
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Create / Edit Form Dialog ── */}
      <Dialog open={formOpen} onOpenChange={v => !v && closeForm()}>
        <DialogContent className="w-full sm:max-w-md bg-background/95 backdrop-blur-xl border-accent/20">
          <DialogHeader>
            <DialogTitle className="gradient-text text-base sm:text-lg">
              {editingItem ? 'Edit Dev Task / Meeting' : 'Add New Dev Task / Meeting'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Quick Presets */}
            {!editingItem && (
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Quick Presets:</Label>
                <div className="flex flex-wrap gap-1">
                  {DEV_PRESETS.map(p => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => applyPreset(p)}
                      className="text-[10px] px-2 py-0.5 rounded-full border border-accent/20 bg-accent/5 hover:bg-accent/20 text-accent transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Title */}
            <div className="space-y-1.5">
              <Label className="text-xs">Task Title *</Label>
              <Input
                placeholder="e.g. Fix auth token refresh / Deploy Vercel release"
                value={form.title}
                onChange={e => setF('title', e.target.value)}
                autoFocus
              />
            </div>

            {/* Type & Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Type</Label>
                <Select value={form.type} onValueChange={(v: SchedulerItemType) => setF('type', v)}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To-Do</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="deadline">Deadline</SelectItem>
                    <SelectItem value="project">Project Task</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Priority</Label>
                <Select value={form.priority} onValueChange={(v: SchedulerPriority) => setF('priority', v)}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">🔴 High</SelectItem>
                    <SelectItem value="medium">🟡 Medium</SelectItem>
                    <SelectItem value="low">🔵 Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date, Time & Estimated Minutes */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Date</Label>
                <Input type="date" className="h-9 text-xs px-2" value={form.date} onChange={e => setF('date', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Time</Label>
                <Input type="time" className="h-9 text-xs px-2" value={form.time} onChange={e => setF('time', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Est. Mins</Label>
                <Input type="number" className="h-9 text-xs" value={form.estMinutes} onChange={e => setF('estMinutes', Number(e.target.value))} />
              </div>
            </div>

            {/* GitHub / PR / Zoom / Figma Link */}
            <div className="space-y-1.5">
              <Label className="text-xs">Dev Link (PR, Issue, Zoom, Figma URL)</Label>
              <Input
                placeholder="https://github.com/..."
                value={form.link}
                onChange={e => setF('link', e.target.value)}
                className="text-xs"
              />
            </div>

            {/* Related Project */}
            {projects.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs">Related Project (Optional)</Label>
                <Select value={form.projectId} onValueChange={v => setF('projectId', v)}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select a project" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {projects.map(p => (
                      <SelectItem key={p.id ?? p.title} value={p.id ?? p.title}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Custom Tags */}
            <div className="space-y-1.5">
              <Label className="text-xs">Tags</Label>
              <div className="flex flex-wrap gap-1">
                {PRESET_TAGS.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTagInForm(t)}
                    className={`text-[10px] px-2 py-0.5 rounded border transition-all ${
                      form.tags.includes(t) ? 'bg-accent text-accent-foreground border-accent' : 'border-border/40 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    #{t}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs">Notes / Scratchpad</Label>
              <Textarea
                rows={2}
                placeholder="Agenda, PR link notes, or implementation thoughts..."
                value={form.notes}
                onChange={e => setF('notes', e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={closeForm}>Cancel</Button>
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleSave}>
              <Check className="w-3.5 h-3.5 mr-1.5" /> {editingItem ? 'Save Changes' : 'Add Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Command Palette Dialog ── */}
      <Dialog open={cmdOpen} onOpenChange={setCmdOpen}>
        <DialogContent className="w-full sm:max-w-lg bg-background/95 backdrop-blur-xl border-accent/20 p-4">
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            <Search className="w-4 h-4 text-accent" />
            <input
              placeholder="Search or type a task to quick-add..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm focus:outline-none"
              autoFocus
            />
          </div>
          <div className="space-y-1 max-h-60 overflow-y-auto pt-2">
            {filteredItems.slice(0, 5).map(item => (
              <div
                key={item.id}
                onClick={() => { setCmdOpen(false); openForm(undefined, item); }}
                className="p-2 rounded-lg hover:bg-secondary/40 cursor-pointer flex items-center justify-between text-xs"
              >
                <span className="font-semibold text-foreground">{item.title}</span>
                <Badge variant="outline" className="text-[10px]">{item.type}</Badge>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Reusable Task Card Component ──────────────────────────────────────────────

// ── Reusable Task Card Component ──────────────────────────────────────────────

function TaskCard({
  item,
  compact = false,
  overdue = false,
  onDragStart,
  onOpenForm,
  onDelete,
  onDuplicate,
  onStartFocus,
  onToggleDone,
  onToggleSubtask,
}: {
  item: SchedulerItem;
  compact?: boolean;
  overdue?: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onOpenForm: (presetDate?: string, item?: SchedulerItem) => void;
  onDelete: (id: string) => void;
  onDuplicate: (item: SchedulerItem) => void;
  onStartFocus: (item: SchedulerItem) => void;
  onToggleDone: (item: SchedulerItem, status: SchedulerStatus) => void;
  onToggleSubtask: (item: SchedulerItem, subtaskId: string) => void;
}) {
  const cfg = TYPE_CONFIG[item.type];
  const prio = PRIORITY_CONFIG[item.priority];
  const Icon = cfg.icon;
  const subtasksDone = item.subtasks?.filter(s => s.done).length ?? 0;
  const subtasksTotal = item.subtasks?.length ?? 0;
  const progressPct = item.estMinutes && item.actualMinutes ? Math.min(100, Math.round((item.actualMinutes / item.estMinutes) * 100)) : 0;

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, item.id)}
      className={`group relative p-2.5 rounded-lg border bg-background/60 hover:border-accent/40 transition-all cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md space-y-1.5 ${
        overdue && !item.completed ? 'border-rose-500/50 bg-rose-500/5' : item.completed ? 'opacity-50 line-through bg-secondary/30 border-border/60' : 'border-border/60'
      }`}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0 mt-0.5 group-hover:text-accent transition-colors" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            {overdue && !item.completed && <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />}
            {item.recurring && item.recurring !== 'none' && <RotateCcw className="w-3 h-3 text-blue-400 shrink-0" />}
            <p className="text-xs font-semibold text-foreground line-clamp-2 leading-tight">{item.title}</p>
          </div>
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            <span className={`text-[9px] px-1.5 py-0.2 rounded border flex items-center gap-0.5 ${cfg.bg} ${cfg.color}`}>
              <Icon className="w-2.5 h-2.5" /> {cfg.label}
            </span>
            <span className={`text-[9px] px-1 py-0.2 rounded border ${prio.color}`}>
              {prio.label}
            </span>
            {overdue && !item.completed && <span className="text-[9px] px-1 py-0.2 rounded border border-rose-500/30 text-rose-400">Overdue</span>}
            {item.link && (
              <a href={item.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-[9px] text-accent hover:underline flex items-center gap-0.5">
                <ExternalLink className="w-2.5 h-2.5" /> Link
              </a>
            )}
          </div>
          {/* Progress bar (est vs actual) */}
          {progressPct > 0 && !compact && (
            <div className="mt-1.5">
              <div className="flex items-center justify-between text-[8px] text-muted-foreground mb-0.5">
                <span>{item.actualMinutes}m / {item.estMinutes}m</span>
                <span>{progressPct}%</span>
              </div>
              <div className="h-1 bg-secondary/40 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${progressPct > 100 ? 'bg-rose-500' : progressPct > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, progressPct)}%` }} />
              </div>
            </div>
          )}
          {/* Subtasks */}
          {item.subtasks && item.subtasks.length > 0 && !compact && (
            <div className="mt-1.5 space-y-0.5">
              <div className="flex items-center gap-1 text-[8px] text-muted-foreground">
                <CheckSquare className="w-2.5 h-2.5" /> {subtasksDone}/{subtasksTotal} subtasks
              </div>
              {item.subtasks.slice(0, 3).map(s => (
                <label key={s.id} className="flex items-center gap-1.5 text-[9px] text-foreground/80 cursor-pointer">
                  <input type="checkbox" checked={s.done} onChange={() => onToggleSubtask(item, s.id)} className="w-3 h-3 rounded border-border accent-accent" />
                  <span className={s.done ? 'line-through text-muted-foreground' : ''}>{s.text}</span>
                </label>
              ))}
              {item.subtasks.length > 3 && <p className="text-[8px] text-muted-foreground">+{item.subtasks.length - 3} more</p>}
            </div>
          )}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {item.tags.map(t => (
                <span key={t} className="text-[8px] px-1 py-0.2 rounded bg-accent/10 text-accent font-mono">#{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {!compact ? (
        <div className="flex items-center justify-between pt-1 border-t border-border/30 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleDone(item, item.completed ? 'scheduled' : 'completed')}
              className="hover:text-accent flex items-center gap-1"
            >
              <CheckCircle2 className={`w-3 h-3 ${item.completed ? 'text-emerald-400' : ''}`} /> {item.completed ? 'Done' : 'Mark Done'}
            </button>
            <button
              onClick={() => onStartFocus(item)}
              className="hover:text-amber-400 flex items-center gap-0.5"
              title="Start Focus Timer"
            >
              <Flame className="w-3 h-3" /> Focus
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => onOpenForm(undefined, item)} className="hover:text-accent"><FileText className="w-3 h-3" /></button>
            <button onClick={() => onDuplicate(item)} className="hover:text-accent" title="Duplicate task">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            </button>
            <button onClick={() => onDelete(item.id)} className="hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1 pt-1 border-t border-border/30">
          <button
            onClick={() => onToggleDone(item, item.completed ? 'scheduled' : 'completed')}
            className="hover:text-accent p-0.5"
            title={item.completed ? 'Undo complete' : 'Mark Done'}
          >
            <CheckCircle2 className={`w-3 h-3 ${item.completed ? 'text-emerald-400' : ''}`} />
          </button>
          <button onClick={() => onOpenForm(undefined, item)} className="hover:text-accent p-0.5"><FileText className="w-3 h-3" /></button>
        </div>
      )}
    </div>
  );
}
