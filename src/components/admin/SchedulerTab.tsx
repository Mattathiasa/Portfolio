import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Calendar as CalendarIcon, Clock, Plus, Trash2, CheckCircle2,
  Circle, AlertCircle, Video, Briefcase, FileText, ChevronLeft, ChevronRight,
  GripVertical, Filter, Tag, Check, CalendarDays, Sparkles, AlertTriangle, Wifi, WifiOff,
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
import type { SchedulerItem, SchedulerItemType, SchedulerPriority } from '@/types/portfolio';

// ── Config ────────────────────────────────────────────────────────────────────

const LOCAL_STORAGE_KEY = 'portfolio_scheduler_v2';

const TYPE_CONFIG: Record<SchedulerItemType, { label: string; icon: typeof CalendarIcon; color: string; bg: string }> = {
  meeting:  { label: 'Meeting',  icon: Video,       color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
  deadline: { label: 'Deadline', icon: AlertCircle,  color: 'text-rose-400',   bg: 'bg-rose-500/10 border-rose-500/30' },
  todo:     { label: 'To-Do',    icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  project:  { label: 'Project',  icon: Briefcase,    color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30' },
};

const PRIORITY_CONFIG: Record<SchedulerPriority, { label: string; color: string; dotBg: string }> = {
  high:   { label: 'High',   color: 'text-rose-400',   dotBg: 'bg-rose-500' },
  medium: { label: 'Medium', color: 'text-amber-400',  dotBg: 'bg-amber-500' },
  low:    { label: 'Low',    color: 'text-blue-400',   dotBg: 'bg-blue-500' },
};

// ── Local storage helpers ─────────────────────────────────────────────────────

function loadLocal(): SchedulerItem[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) ?? '[]'); } catch { return []; }
}
function saveLocal(items: SchedulerItem[]) {
  try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items)); } catch { /**/ }
}

/** Firestore rejects undefined field values — strip them before every write */
function clean<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

// ── Empty form state ──────────────────────────────────────────────────────────

const emptyForm = () => ({
  title: '', type: 'todo' as SchedulerItemType, priority: 'medium' as SchedulerPriority,
  date: '', time: '', duration: '', notes: '', projectId: 'none',
});

// ── Main component ────────────────────────────────────────────────────────────

export function SchedulerTab() {
  // ── Projects query ───────────────────────────────────────────────────────
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: fb.getProjects,
  });

  // ── Items state (single source of truth) ─────────────────────────────────
  const [items, setItems] = useState<SchedulerItem[]>(loadLocal);
  const [fbStatus, setFbStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [fbError, setFbError] = useState('');
  const [syncing, setSyncing] = useState(false);

  // ── Load from Firebase on mount ───────────────────────────────────────────
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
      const msg = (err as Error).message ?? 'Unknown error';
      setFbStatus('error');
      setFbError(msg);
      // Keep whatever was in localStorage
      setItems(loadLocal());
    }
  }, []);

  useEffect(() => { loadFromFirebase(); }, [loadFromFirebase]);

  // ── Calendar ──────────────────────────────────────────────────────────────
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // ── Form ──────────────────────────────────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [editingItem, setEditingItem] = useState<SchedulerItem | null>(null);

  const setF = <K extends keyof ReturnType<typeof emptyForm>>(k: K, v: ReturnType<typeof emptyForm>[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const openForm = (presetDate?: string, item?: SchedulerItem) => {
    if (item) {
      setEditingItem(item);
      setForm({
        title: item.title, type: item.type, priority: item.priority,
        date: item.date ?? '', time: item.time ?? '', duration: item.duration ?? '',
        notes: item.notes ?? '', projectId: item.projectId ?? 'none',
      });
    } else {
      setEditingItem(null);
      setForm({ ...emptyForm(), date: presetDate ?? '' });
    }
    setFormOpen(true);
  };

  const closeForm = () => { setFormOpen(false); setEditingItem(null); setForm(emptyForm()); };

  // ── Optimistic helpers ───────────────────────────────────────────────────

  const applyAndSync = async (
    optimistic: SchedulerItem[],
    firestoreOp: () => Promise<void>,
  ) => {
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
      toast.error(`Firebase error — saved locally only: ${msg}`);
    } finally {
      setSyncing(false);
    }
  };

  // ── CRUD ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Please enter a title'); return; }

    const payload: Omit<SchedulerItem, 'id'> = {
      title: form.title.trim(),
      type: form.type,
      priority: form.priority,
      date: form.date || undefined,
      time: form.time || undefined,
      duration: form.duration || undefined,
      notes: form.notes.trim() || undefined,
      projectId: form.projectId !== 'none' ? form.projectId : undefined,
      completed: editingItem?.completed ?? false,
    };

    if (editingItem) {
      const updated = items.map(i => i.id === editingItem.id ? { ...i, ...payload } : i);
      await applyAndSync(updated, () => fb.updateSchedulerItem(editingItem.id, clean(payload)));
      toast.success('Task updated!');
    } else {
      // Optimistic insert with temp ID
      const tempId = 'local-' + Date.now();
      const newItem: SchedulerItem = { ...payload, id: tempId };
      const optimistic = [newItem, ...items];
      setItems(optimistic);
      saveLocal(optimistic);

      if (isFirebaseConfigured && fbStatus !== 'error') {
        setSyncing(true);
        try {
          const realId = await fb.addSchedulerItem(clean(payload) as Omit<SchedulerItem, 'id'>);
          // Replace temp ID with real Firestore ID
          const synced = optimistic.map(i => i.id === tempId ? { ...i, id: realId } : i);
          setItems(synced);
          saveLocal(synced);
          setFbStatus('ok');
          toast.success('Task saved to Firebase ✓');
        } catch (err) {
          const msg = (err as Error).message ?? 'Firestore error';
          setFbError(msg);
          setFbStatus('error');
          toast.error(`Firebase error — saved locally: ${msg}`);
        } finally {
          setSyncing(false);
        }
      } else {
        toast.success('Task saved locally');
      }
    }

    closeForm();
  };

  const toggleDone = async (item: SchedulerItem) => {
    const updated = items.map(i => i.id === item.id ? { ...i, completed: !i.completed } : i);
    await applyAndSync(updated, () => fb.updateSchedulerItem(item.id, { completed: !item.completed }));
  };

  const scheduleOn = async (itemId: string, date: string | undefined) => {
    const updated = items.map(i => i.id === itemId ? { ...i, date } : i);
    // When un-scheduling (date=undefined), omit the field rather than sending undefined
    const patch = date !== undefined ? { date } : {};
    await applyAndSync(updated, () => fb.updateSchedulerItem(itemId, patch));
    toast.success(date ? `Scheduled for ${date}` : 'Moved to backlog');
    setDraggedId(null);
  };

  const deleteItem = async (id: string) => {
    const updated = items.filter(i => i.id !== id);
    await applyAndSync(updated, () => fb.deleteSchedulerItem(id));
    toast.success('Item deleted');
  };

  // ── Calendar math ─────────────────────────────────────────────────────────

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const todayStr = new Date().toISOString().split('T')[0];

  const calendarCells = useMemo(() => {
    const cells: { dateStr: string; dayNum: number | null }[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) cells.push({ dateStr: '', dayNum: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      cells.push({ dateStr: `${year}-${mm}-${dd}`, dayNum: d });
    }
    return cells;
  }, [year, month, firstDayOfWeek, daysInMonth]);

  const filtered = useMemo(() =>
    typeFilter === 'all' ? items : items.filter(i => i.type === typeFilter),
  [items, typeFilter]);

  const unscheduled = useMemo(() => filtered.filter(i => !i.date), [filtered]);

  const scheduledMap = useMemo(() => {
    const map: Record<string, SchedulerItem[]> = {};
    filtered.forEach(i => { if (i.date) { (map[i.date] ??= []).push(i); } });
    return map;
  }, [filtered]);

  // ── Drag & drop ───────────────────────────────────────────────────────────

  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedId(id);
  };
  const onDrop = (e: React.DragEvent, date: string | undefined) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedId;
    if (id) scheduleOn(id, date);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-4 rounded-xl border border-accent/15">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-bold gradient-text">Project & Daily Scheduler</h2>
            {/* Sync indicator */}
            <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full border flex items-center gap-1 ${
              fbStatus === 'ok' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
              : fbStatus === 'error' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
              : 'text-muted-foreground border-border/40'
            }`}>
              {fbStatus === 'ok' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {fbStatus === 'ok' ? 'Firebase' : fbStatus === 'error' ? 'Local only' : 'Connecting…'}
            </span>
            {syncing && <span className="text-[10px] text-muted-foreground animate-pulse">Syncing…</span>}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Schedule meetings, deadlines, and daily tasks. Drag & drop items onto calendar dates.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 flex-wrap">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32 h-9 text-xs">
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
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90 h-9 text-xs flex-1 sm:flex-none" onClick={() => openForm()}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Task / Meeting
          </Button>
        </div>
      </div>

      {/* Firebase error banner */}
      {fbStatus === 'error' && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-400">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Firebase unavailable — items stored locally only</p>
            <p className="text-amber-400/70 mt-0.5">{fbError}</p>
            <p className="text-amber-400/70 mt-0.5">
              Check your Firebase config env vars and Firestore security rules. Items in local storage will not persist across devices or browsers.
            </p>
            <Button size="sm" variant="ghost" className="mt-1.5 h-7 text-xs text-amber-400 hover:text-amber-300 px-2" onClick={loadFromFirebase}>
              Retry connection
            </Button>
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Backlog column */}
        <Card
          className="lg:col-span-1 glass-card border-accent/15 flex flex-col min-h-[480px]"
          onDragOver={e => e.preventDefault()}
          onDrop={e => onDrop(e, undefined)}
        >
          <CardHeader className="p-4 border-b border-border/40 pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent" /> Things To Do
              </CardTitle>
              <p className="text-[11px] text-muted-foreground">Unscheduled backlog · Drag to calendar</p>
            </div>
            <Badge variant="secondary" className="text-xs">{unscheduled.length}</Badge>
          </CardHeader>

          <CardContent className="p-3 flex-1 flex flex-col space-y-2 overflow-y-auto max-h-[600px] [&::-webkit-scrollbar]:w-1">
            {unscheduled.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-border/50 rounded-lg">
                <Sparkles className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground font-medium">No unscheduled tasks</p>
                <p className="text-[11px] text-muted-foreground/70 mt-1">Click "Add Task" or drag calendar items here</p>
                <Button size="sm" variant="outline" className="mt-3 text-xs border-accent/30" onClick={() => openForm()}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Create Task
                </Button>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {unscheduled.map(item => {
                  const cfg = TYPE_CONFIG[item.type];
                  const prio = PRIORITY_CONFIG[item.priority];
                  const Icon = cfg.icon;
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      draggable
                      onDragStart={e => onDragStart(e, item.id)}
                      className="group relative p-3 rounded-lg border border-border/60 bg-background/60 hover:border-accent/40 transition-all cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md space-y-2"
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-0.5 group-hover:text-accent transition-colors" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground line-clamp-2 leading-tight">{item.title}</p>
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 ${cfg.bg} ${cfg.color}`}>
                              <Icon className="w-3 h-3" /> {cfg.label}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border-border/40 border flex items-center gap-1 ${prio.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${prio.dotBg}`} /> {prio.label}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-border/30 text-[11px]">
                        <button
                          onClick={() => openForm(todayStr, item)}
                          className="text-muted-foreground hover:text-accent transition-colors flex items-center gap-1"
                        >
                          <CalendarIcon className="w-3 h-3" /> Schedule
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </CardContent>
        </Card>

        {/* Calendar column */}
        <Card className="lg:col-span-3 glass-card border-accent/15 flex flex-col">
          <CardHeader className="p-4 border-b border-border/40 pb-3 flex flex-row items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8 border-border/60"
                onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h3 className="text-base font-bold text-foreground w-36 text-center">{MONTHS[month]} {year}</h3>
              <Button variant="outline" size="icon" className="h-8 w-8 border-border/60"
                onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-accent ml-1"
                onClick={() => setCurrentDate(new Date())}>
                Today
              </Button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {Object.entries(TYPE_CONFIG).map(([k, cfg]) => (
                <span key={k} className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 ${cfg.bg} ${cfg.color}`}>
                  <cfg.icon className="w-2.5 h-2.5" /> {cfg.label}
                </span>
              ))}
            </div>
          </CardHeader>

          <CardContent className="p-3 sm:p-4 flex-1">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                <div key={d} className="text-xs font-semibold text-muted-foreground py-1">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 auto-rows-fr">
              {calendarCells.map((cell, idx) => {
                if (!cell.dayNum) return <div key={idx} className="min-h-[85px] sm:min-h-[105px] rounded-lg bg-secondary/10 opacity-30 pointer-events-none" />;

                const dayItems = scheduledMap[cell.dateStr] ?? [];
                const isToday = cell.dateStr === todayStr;

                return (
                  <div
                    key={cell.dateStr}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => onDrop(e, cell.dateStr)}
                    onClick={() => setSelectedDay(cell.dateStr)}
                    className={`group relative min-h-[85px] sm:min-h-[105px] p-1.5 rounded-lg border transition-all flex flex-col cursor-pointer ${
                      isToday
                        ? 'border-accent bg-accent/10 shadow-sm'
                        : 'border-border/40 bg-background/50 hover:border-accent/50 hover:bg-secondary/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ${
                        isToday ? 'bg-accent text-accent-foreground' : 'text-foreground'
                      }`}>{cell.dayNum}</span>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); openForm(cell.dateStr); }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted-foreground hover:text-accent hover:bg-accent/10 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1 my-1 flex-1 overflow-y-auto max-h-[65px] [&::-webkit-scrollbar]:w-0.5">
                      {dayItems.slice(0, 3).map(item => {
                        const cfg = TYPE_CONFIG[item.type];
                        const Icon = cfg.icon;
                        return (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={e => { e.stopPropagation(); onDragStart(e, item.id); }}
                            onClick={e => { e.stopPropagation(); openForm(cell.dateStr, item); }}
                            className={`text-[10px] px-1.5 py-0.5 rounded border truncate flex items-center gap-1 hover:scale-[1.02] transition-transform ${
                              item.completed ? 'opacity-50 line-through bg-secondary/40 border-border/40' : `${cfg.bg} ${cfg.color}`
                            }`}
                          >
                            <Icon className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{item.time ? `${item.time} ${item.title}` : item.title}</span>
                          </div>
                        );
                      })}
                      {dayItems.length > 3 && (
                        <p className="text-[9px] text-muted-foreground font-semibold text-center">+{dayItems.length - 3} more</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Day detail dialog */}
      <Dialog open={!!selectedDay} onOpenChange={v => !v && setSelectedDay(null)}>
        <DialogContent className="w-full sm:max-w-lg bg-background/95 backdrop-blur-xl border-accent/20 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="gradient-text text-lg flex items-center justify-between flex-wrap gap-2">
              <span className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-accent" /> {selectedDay}
              </span>
              <Button size="sm" className="bg-accent text-accent-foreground text-xs"
                onClick={() => { const d = selectedDay; setSelectedDay(null); openForm(d ?? undefined); }}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Task
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            {selectedDay && (scheduledMap[selectedDay] ?? []).length === 0 ? (
              <div className="text-center py-8 border border-dashed border-border/40 rounded-lg space-y-2">
                <CalendarDays className="w-8 h-8 mx-auto text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">Nothing scheduled for this day yet.</p>
                <Button size="sm" variant="outline" className="border-accent/30 text-xs"
                  onClick={() => { const d = selectedDay; setSelectedDay(null); openForm(d ?? undefined); }}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add something
                </Button>
              </div>
            ) : (
              selectedDay && (scheduledMap[selectedDay] ?? []).map(item => {
                const cfg = TYPE_CONFIG[item.type];
                const prio = PRIORITY_CONFIG[item.priority];
                const Icon = cfg.icon;
                return (
                  <div key={item.id} className="p-3 rounded-lg border border-border/50 bg-secondary/20 flex items-start gap-3 justify-between">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <button onClick={() => toggleDone(item)} className="mt-0.5 hover:opacity-80 transition-opacity">
                        {item.completed
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          : <Circle className="w-4 h-4 text-muted-foreground" />}
                      </button>
                      <div className="space-y-1 min-w-0 flex-1">
                        <p className={`text-xs font-semibold ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {item.title}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 ${cfg.bg} ${cfg.color}`}>
                            <Icon className="w-3 h-3" /> {cfg.label}
                          </span>
                          {item.time && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded border border-border/40 text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {item.time}{item.duration ? ` (${item.duration})` : ''}
                            </span>
                          )}
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border border-border/40 flex items-center gap-1 ${prio.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${prio.dotBg}`} /> {prio.label}
                          </span>
                        </div>
                        {item.notes && <p className="text-[11px] text-muted-foreground/80 pt-1 italic">{item.notes}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-accent"
                        onClick={() => { setSelectedDay(null); openForm(selectedDay, item); }}>
                        <Tag className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteItem(item.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create / Edit dialog */}
      <Dialog open={formOpen} onOpenChange={v => !v && closeForm()}>
        <DialogContent className="w-full sm:max-w-md bg-background/95 backdrop-blur-xl border-accent/20">
          <DialogHeader>
            <DialogTitle className="gradient-text text-base sm:text-lg">
              {editingItem ? 'Edit Task / Meeting' : 'Add New Task / Meeting'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Title *</Label>
              <Input
                placeholder="e.g. Team sync / Fix login bug"
                value={form.title}
                onChange={e => setF('title', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                autoFocus
              />
            </div>

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
                <Label className="text-xs">Duration</Label>
                <Input placeholder="30m / 1h" className="h-9 text-xs" value={form.duration} onChange={e => setF('duration', e.target.value)} />
              </div>
            </div>

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

            <div className="space-y-1.5">
              <Label className="text-xs">Notes / Details</Label>
              <Textarea
                rows={2}
                placeholder="Agenda, link, or scratchpad notes…"
                value={form.notes}
                onChange={e => setF('notes', e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={closeForm}>Cancel</Button>
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleSave}>
              <Check className="w-3.5 h-3.5 mr-1.5" />
              {editingItem ? 'Save Changes' : 'Add Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
