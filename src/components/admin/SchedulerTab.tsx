import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Calendar as CalendarIcon, Clock, Plus, Trash2, CheckCircle2,
  Circle, AlertCircle, Video, Briefcase, FileText, ChevronLeft, ChevronRight,
  GripVertical, Filter, Tag, Check, CalendarDays, Sparkles, AlertTriangle
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
import type { SchedulerItem, SchedulerItemType, SchedulerPriority, Project } from '@/types/portfolio';

// Local storage key for fallback persistence when offline
const LOCAL_STORAGE_KEY = 'portfolio_scheduler_fallback';

const TYPE_CONFIG: Record<SchedulerItemType, { label: string; icon: typeof CalendarIcon; color: string; bg: string }> = {
  meeting:  { label: 'Meeting',  icon: Video,      color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
  deadline: { label: 'Deadline', icon: AlertCircle, color: 'text-rose-400',   bg: 'bg-rose-500/10 border-rose-500/30' },
  todo:     { label: 'To-Do',    icon: CheckCircle2,color: 'text-emerald-400',bg: 'bg-emerald-500/10 border-emerald-500/30' },
  project:  { label: 'Project', icon: Briefcase,   color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/30' },
};

const PRIORITY_CONFIG: Record<SchedulerPriority, { label: string; color: string; dotBg: string }> = {
  high:   { label: 'High',   color: 'text-rose-400 border-rose-500/30',   dotBg: 'bg-rose-500' },
  medium: { label: 'Medium', color: 'text-amber-400 border-amber-500/30', dotBg: 'bg-amber-500' },
  low:    { label: 'Low',    color: 'text-blue-400 border-blue-500/30',   dotBg: 'bg-blue-500' },
};

function getLocalItems(): SchedulerItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalItems(items: SchedulerItem[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export function SchedulerTab() {
  const qc = useQueryClient();

  // Queries
  const { data: remoteItems = [], isLoading } = useQuery({
    queryKey: ['scheduler'],
    queryFn: fb.getSchedulerItems,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: fb.getProjects,
  });

  // Merge remote items with local fallback state
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  const items = useMemo(() => {
    if (remoteItems.length > 0) return remoteItems;
    return getLocalItems();
  }, [remoteItems]);

  const usingLocalFallback = remoteItems.length === 0 && getLocalItems().length > 0;
  // Current month state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  // Form dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<SchedulerItemType>('todo');
  const [formPriority, setFormPriority] = useState<SchedulerPriority>('medium');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formDuration, setFormDuration] = useState('');
  const [formProjectId, setFormProjectId] = useState<string>('none');
  const [formNotes, setFormNotes] = useState('');
  const [editingItem, setEditingItem] = useState<SchedulerItem | null>(null);

  // Mutations
  const addItemMut = useMutation({
    mutationFn: async (newItem: Omit<SchedulerItem, 'id'>) => {
      try {
        const id = await fb.addSchedulerItem(newItem);
        setFirebaseError(null);
        return { ...newItem, id };
      } catch (err) {
        const msg = (err as Error).message ?? 'Firebase write failed';
        setFirebaseError(msg);
        toast.error(`Firebase error — saving locally only: ${msg}`);
        // Local fallback so work is not lost
        const local = getLocalItems();
        const item: SchedulerItem = { ...newItem, id: 'local-' + Date.now() };
        saveLocalItems([item, ...local]);
        return item;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scheduler'] });
      toast.success('Task saved!');
      resetForm();
    },
  });

  const updateItemMut = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SchedulerItem> }) => {
      if (id.startsWith('local-')) {
        const local = getLocalItems().map(i => (i.id === id ? { ...i, ...data } : i));
        saveLocalItems(local);
        return;
      }
      try {
        await fb.updateSchedulerItem(id, data);
        setFirebaseError(null);
      } catch (err) {
        const msg = (err as Error).message ?? 'Firebase write failed';
        setFirebaseError(msg);
        toast.error(`Firebase error — change saved locally only`);
        const local = getLocalItems().map(i => (i.id === id ? { ...i, ...data } : i));
        saveLocalItems(local);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scheduler'] });
    },
  });

  const deleteItemMut = useMutation({
    mutationFn: async (id: string) => {
      if (id.startsWith('local-')) {
        const local = getLocalItems().filter(i => i.id !== id);
        saveLocalItems(local);
        return;
      }
      try {
        await fb.deleteSchedulerItem(id);
      } catch {
        const local = getLocalItems().filter(i => i.id !== id);
        saveLocalItems(local);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scheduler'] });
      toast.success('Item deleted');
    },
  });

  const resetForm = () => {
    setFormTitle('');
    setFormType('todo');
    setFormPriority('medium');
    setFormDate('');
    setFormTime('');
    setFormDuration('');
    setFormProjectId('none');
    setFormNotes('');
    setEditingItem(null);
    setFormOpen(false);
  };

  const openForm = (presetDate?: string, item?: SchedulerItem) => {
    if (item) {
      setEditingItem(item);
      setFormTitle(item.title);
      setFormType(item.type);
      setFormPriority(item.priority);
      setFormDate(item.date ?? '');
      setFormTime(item.time ?? '');
      setFormDuration(item.duration ?? '');
      setFormProjectId(item.projectId ?? 'none');
      setFormNotes(item.notes ?? '');
    } else {
      resetForm();
      if (presetDate) setFormDate(presetDate);
    }
    setFormOpen(true);
  };

  const handleSave = () => {
    if (!formTitle.trim()) {
      toast.error('Please enter a title');
      return;
    }

    const payload = {
      title: formTitle.trim(),
      type: formType,
      priority: formPriority,
      date: formDate ? formDate : undefined,
      time: formTime ? formTime : undefined,
      duration: formDuration ? formDuration : undefined,
      projectId: formProjectId !== 'none' ? formProjectId : undefined,
      notes: formNotes ? formNotes.trim() : undefined,
      completed: editingItem ? editingItem.completed : false,
    };

    if (editingItem) {
      updateItemMut.mutate({ id: editingItem.id, data: payload });
      toast.success('Task updated');
      resetForm();
    } else {
      addItemMut.mutate(payload);
    }
  };

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calendar matrix
  const calendarCells = useMemo(() => {
    const cells: { dateStr: string; dayNum: number | null; isCurrentMonth: boolean }[] = [];
    // Padding before
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push({ dateStr: '', dayNum: null, isCurrentMonth: false });
    }
    // Month days
    for (let day = 1; day <= daysInMonth; day++) {
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      cells.push({ dateStr: `${year}-${mm}-${dd}`, dayNum: day, isCurrentMonth: true });
    }
    return cells;
  }, [year, month, firstDayOfWeek, daysInMonth]);

  // Filtered items
  const filteredItems = useMemo(() => {
    if (typeFilter === 'all') return items;
    return items.filter(i => i.type === typeFilter);
  }, [items, typeFilter]);

  // Unscheduled (Things to do backlog) vs Scheduled
  const unscheduledItems = useMemo(() => {
    return filteredItems.filter(i => !i.date);
  }, [filteredItems]);

  const scheduledMap = useMemo(() => {
    const map: Record<string, SchedulerItem[]> = {};
    filteredItems.forEach(i => {
      if (i.date) {
        if (!map[i.date]) map[i.date] = [];
        map[i.date].push(i);
      }
    });
    return map;
  }, [filteredItems]);

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    e.dataTransfer.setData('text/plain', itemId);
    setDraggedItemId(itemId);
  };

  const handleDropOnDate = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedItemId;
    if (id && dateStr) {
      updateItemMut.mutate({ id, data: { date: dateStr } });
      toast.success(`Scheduled for ${dateStr}`);
    }
    setDraggedItemId(null);
  };

  const handleDropOnUnscheduled = (e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedItemId;
    if (id) {
      updateItemMut.mutate({ id, data: { date: undefined } });
      toast.success('Moved to unscheduled backlog');
    }
    setDraggedItemId(null);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* ── Top Header & Stats Bar ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-4 rounded-xl border border-accent/15">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-bold gradient-text">Project & Daily Scheduler</h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Schedule meetings, deadlines, project tasks, and set things to do in a day. Drag & drop items onto the calendar dates.
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

      {/* Firebase warning banner */}
      {firebaseError && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-400">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Firebase not saving — items stored locally only</p>
            <p className="text-amber-400/70 mt-0.5">Error: {firebaseError}</p>
            <p className="text-amber-400/70 mt-0.5">Check your Firebase config, Firestore security rules, and that the <code className="bg-amber-500/20 px-1 rounded">scheduler</code> collection is allowed.</p>
          </div>
        </div>
      )}
      {usingLocalFallback && !firebaseError && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs text-blue-400">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          Items are currently stored locally (Firebase returned 0 items). They will sync once Firebase is connected.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ── Left Column: "Things To Do" Backlog (Unscheduled / Quick Add) ── */}
        <Card
          className="lg:col-span-1 glass-card border-accent/15 flex flex-col min-h-[480px]"
          onDragOver={e => e.preventDefault()}
          onDrop={handleDropOnUnscheduled}
        >
          <CardHeader className="p-4 border-b border-border/40 pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent" /> Things To Do
              </CardTitle>
              <p className="text-[11px] text-muted-foreground">Unscheduled backlog · Drag to calendar</p>
            </div>
            <Badge variant="secondary" className="text-xs">{unscheduledItems.length}</Badge>
          </CardHeader>

          <CardContent className="p-3 flex-1 flex flex-col space-y-2 overflow-y-auto max-h-[600px] [&::-webkit-scrollbar]:w-1">
            {unscheduledItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-border/50 rounded-lg">
                <Sparkles className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground font-medium">No unscheduled tasks</p>
                <p className="text-[11px] text-muted-foreground/70 mt-1">Click "Add Task" to create one or drag items here to un-schedule</p>
                <Button size="sm" variant="outline" className="mt-3 text-xs border-accent/30" onClick={() => openForm()}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Create Task
                </Button>
              </div>
            ) : (
              unscheduledItems.map(item => {
                const cfg = TYPE_CONFIG[item.type];
                const prio = PRIORITY_CONFIG[item.priority];
                const Icon = cfg.icon;
                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={e => handleDragStart(e, item.id)}
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
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 border-border/40 ${prio.color}`}>
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
                        onClick={() => deleteItemMut.mutate(item.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* ── Right Column: Interactive Calendar Grid ── */}
        <Card className="lg:col-span-3 glass-card border-accent/15 flex flex-col">
          <CardHeader className="p-4 border-b border-border/40 pb-3 flex flex-row items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 border-border/60"
                onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h3 className="text-base font-bold text-foreground w-36 text-center">
                {monthNames[month]} {year}
              </h3>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 border-border/60"
                onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-accent ml-2"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Legend:</span>
              {Object.entries(TYPE_CONFIG).map(([k, cfg]) => (
                <span key={k} className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 ${cfg.bg} ${cfg.color}`}>
                  <cfg.icon className="w-2.5 h-2.5" /> {cfg.label}
                </span>
              ))}
            </div>
          </CardHeader>

          <CardContent className="p-3 sm:p-4 flex-1">
            {/* Day Header Row */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-xs font-semibold text-muted-foreground py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Days Matrix */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 auto-rows-fr">
              {calendarCells.map((cell, idx) => {
                if (!cell.isCurrentMonth) {
                  return <div key={idx} className="min-h-[85px] sm:min-h-[105px] rounded-lg bg-secondary/10 opacity-30 pointer-events-none" />;
                }

                const dayItems = scheduledMap[cell.dateStr] ?? [];
                const isToday = cell.dateStr === todayStr;

                return (
                  <div
                    key={cell.dateStr}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => handleDropOnDate(e, cell.dateStr)}
                    onClick={() => setSelectedDay(cell.dateStr)}
                    className={`group relative min-h-[85px] sm:min-h-[105px] p-1.5 rounded-lg border transition-all flex flex-col justify-between cursor-pointer ${
                      isToday
                        ? 'border-accent bg-accent/10 shadow-sm'
                        : 'border-border/40 bg-background/50 hover:border-accent/50 hover:bg-secondary/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ${
                        isToday ? 'bg-accent text-accent-foreground' : 'text-foreground'
                      }`}>
                        {cell.dayNum}
                      </span>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); openForm(cell.dateStr); }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted-foreground hover:text-accent hover:bg-accent/10 transition-all"
                        title="Add task to this day"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Scheduled Items Badges */}
                    <div className="space-y-1 my-1 flex-1 overflow-y-auto max-h-[65px] [&::-webkit-scrollbar]:w-0.5">
                      {dayItems.slice(0, 3).map(item => {
                        const cfg = TYPE_CONFIG[item.type];
                        const Icon = cfg.icon;
                        return (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={e => { e.stopPropagation(); handleDragStart(e, item.id); }}
                            onClick={e => { e.stopPropagation(); openForm(cell.dateStr, item); }}
                            className={`text-[10px] px-1.5 py-0.5 rounded border truncate flex items-center gap-1 group/item hover:scale-[1.02] transition-transform ${
                              item.completed ? 'opacity-50 line-through bg-secondary/40 border-border/40' : `${cfg.bg} ${cfg.color}`
                            }`}
                          >
                            <Icon className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{item.time ? `${item.time} ${item.title}` : item.title}</span>
                          </div>
                        );
                      })}

                      {dayItems.length > 3 && (
                        <p className="text-[9px] text-muted-foreground font-semibold text-center">
                          +{dayItems.length - 3} more
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Daily Schedule Modal / Drawer ── */}
      <Dialog open={!!selectedDay} onOpenChange={v => !v && setSelectedDay(null)}>
        <DialogContent className="w-full sm:max-w-lg bg-background/95 backdrop-blur-xl border-accent/20 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="gradient-text text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-accent" /> Schedule for {selectedDay}
              </span>
              <Button size="sm" className="bg-accent text-accent-foreground text-xs" onClick={() => { const d = selectedDay; setSelectedDay(null); openForm(d ?? undefined); }}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Task
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            {selectedDay && (scheduledMap[selectedDay] ?? []).length === 0 ? (
              <div className="text-center py-8 border border-dashed border-border/40 rounded-lg space-y-2">
                <CalendarDays className="w-8 h-8 mx-auto text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">Nothing scheduled for this day yet.</p>
                <Button size="sm" variant="outline" className="border-accent/30 text-xs" onClick={() => { const d = selectedDay; setSelectedDay(null); openForm(d ?? undefined); }}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add something to do
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
                      <button
                        onClick={() => updateItemMut.mutate({ id: item.id, data: { completed: !item.completed } })}
                        className="mt-0.5 text-accent hover:opacity-80 transition-opacity"
                      >
                        {item.completed ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Circle className="w-4 h-4 text-muted-foreground" />}
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
                              <Clock className="w-3 h-3" /> {item.time} {item.duration ? `(${item.duration})` : ''}
                            </span>
                          )}
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 border-border/40 ${prio.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${prio.dotBg}`} /> {prio.label}
                          </span>
                        </div>
                        {item.notes && <p className="text-[11px] text-muted-foreground/80 pt-1 italic">{item.notes}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-accent" onClick={() => { setSelectedDay(null); openForm(selectedDay, item); }}>
                        <Tag className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteItemMut.mutate(item.id)}>
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

      {/* ── Create / Edit Form Dialog ── */}
      <Dialog open={formOpen} onOpenChange={v => !v && resetForm()}>
        <DialogContent className="w-full sm:max-w-md bg-background/95 backdrop-blur-xl border-accent/20">
          <DialogHeader>
            <DialogTitle className="gradient-text text-base sm:text-lg">
              {editingItem ? 'Edit Task / Meeting' : 'Add New Task / Meeting'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Title *</Label>
              <Input placeholder="Meeting with team / Fix UI bug" value={formTitle} onChange={e => setFormTitle(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Type</Label>
                <Select value={formType} onValueChange={(v: SchedulerItemType) => setFormType(v)}>
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
                <Select value={formPriority} onValueChange={(v: SchedulerPriority) => setFormPriority(v)}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5 col-span-1">
                <Label className="text-xs">Date</Label>
                <Input type="date" className="h-9 text-xs px-2" value={formDate} onChange={e => setFormDate(e.target.value)} />
              </div>

              <div className="space-y-1.5 col-span-1">
                <Label className="text-xs">Time</Label>
                <Input type="time" className="h-9 text-xs px-2" value={formTime} onChange={e => setFormTime(e.target.value)} />
              </div>

              <div className="space-y-1.5 col-span-1">
                <Label className="text-xs">Duration</Label>
                <Input placeholder="30m / 1h" className="h-9 text-xs" value={formDuration} onChange={e => setFormDuration(e.target.value)} />
              </div>
            </div>

            {projects.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs">Related Project (Optional)</Label>
                <Select value={formProjectId} onValueChange={setFormProjectId}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id!}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">Notes / Details</Label>
              <Textarea rows={2} placeholder="Agenda, link, or scratchpad notes..." value={formNotes} onChange={e => setFormNotes(e.target.value)} className="text-xs" />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetForm}>Cancel</Button>
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleSave}>
              {editingItem ? 'Save Changes' : 'Schedule Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
