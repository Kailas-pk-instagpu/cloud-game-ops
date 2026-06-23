import { useState, useMemo } from 'react';
import { useAuthStore, useBranchStore } from '@/shared/lib/store';
import {
  useHandoverStore,
  PRIORITY_META,
  HandoverPriority,
  HandoverNote,
} from '@/shared/lib/handoverStore';
import { ROLE_LABELS } from '@/shared/types/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  ClipboardList, Plus, Search, Building2, Inbox, CheckCircle2, Clock, AlertTriangle, Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function HandoverPage() {
  const { user } = useAuthStore();
  const { branches } = useBranchStore();
  const { notes, createNote, acknowledge, deleteNote } = useHandoverStore();

  const [tab, setTab] = useState<'all' | 'pending' | 'acknowledged'>('all');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  if (!user) return null;

  const isManager = user.role === 'manager';

  // Branch scoping by role
  const visibleBranchIds = useMemo(() => {
    if (user.role === 'super_admin' || user.role === 'admin') return branches.map(b => b.id);
    if (user.role === 'cafe_owner') return branches.filter(b => b.cafeOwnerId === user.id).map(b => b.id);
    if (user.role === 'manager') return branches.filter(b => b.managerId === user.id).map(b => b.id);
    return [];
  }, [branches, user.id, user.role]);

  const managerBranches = useMemo(
    () => branches.filter(b => b.managerId === user.id),
    [branches, user.id]
  );

  const visibleNotes = useMemo(() => {
    let list = notes.filter(n => visibleBranchIds.includes(n.branchId));
    if (tab === 'pending') list = list.filter(n => !n.acknowledgedById);
    if (tab === 'acknowledged') list = list.filter(n => !!n.acknowledgedById);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(n =>
        n.summary.toLowerCase().includes(q) ||
        n.pendingTasks.toLowerCase().includes(q) ||
        n.incidents.toLowerCase().includes(q) ||
        n.branchName.toLowerCase().includes(q) ||
        n.authorName.toLowerCase().includes(q) ||
        n.shiftLabel.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notes, visibleBranchIds, tab, search]);

  const counts = useMemo(() => {
    const base = notes.filter(n => visibleBranchIds.includes(n.branchId));
    return {
      all: base.length,
      pending: base.filter(n => !n.acknowledgedById).length,
      acknowledged: base.filter(n => !!n.acknowledgedById).length,
    };
  }, [notes, visibleBranchIds]);

  const openNote = openId ? notes.find(n => n.id === openId) || null : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shift Handover Notes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isManager
              ? 'Leave a clear handover for the next shift — pending tasks, incidents, and cash notes.'
              : 'Review handover notes left by managers across your branches.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
            <Clock className="h-3 w-3 mr-1" /> {counts.pending} Pending
          </Badge>
          {isManager && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" /> New Handover
                </Button>
              </DialogTrigger>
              <CreateHandoverDialog
                managerBranches={managerBranches}
                onSubmit={(values) => {
                  const branch = branches.find(b => b.id === values.branchId);
                  if (!branch) return;
                  createNote({
                    ...values,
                    branchName: branch.name,
                    authorId: user.id,
                    authorName: user.name || user.email,
                    authorRole: user.role,
                  });
                  toast.success('Handover note saved');
                  setCreateOpen(false);
                }}
              />
            </Dialog>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by branch, author, shift or content..."
          className="border-0 bg-transparent focus-visible:ring-0"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            All <Badge variant="secondary" className="text-[10px]">{counts.all}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            Pending <Badge variant="secondary" className="text-[10px]">{counts.pending}</Badge>
          </TabsTrigger>
          <TabsTrigger value="acknowledged" className="gap-2">
            Acknowledged <Badge variant="secondary" className="text-[10px]">{counts.acknowledged}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          <div className="grid gap-3">
            {visibleNotes.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Inbox className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No handover notes to show</p>
              </div>
            )}
            {visibleNotes.map((n) => (
              <Card
                key={n.id}
                className="cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => setOpenId(n.id)}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                        n.priority === 'urgent' ? 'bg-destructive/10 text-destructive'
                          : n.priority === 'attention' ? 'bg-warning/10 text-warning'
                          : 'bg-primary/10 text-primary'
                      )}>
                        {n.priority === 'urgent' ? <AlertTriangle className="h-5 w-5" /> : <ClipboardList className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm">{n.shiftLabel}</p>
                          <Badge variant="outline" className={cn('text-[10px]', PRIORITY_META[n.priority].className)}>
                            {PRIORITY_META[n.priority].label}
                          </Badge>
                          {n.acknowledgedById ? (
                            <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/20">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Acknowledged
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] bg-warning/10 text-warning border-warning/20">
                              <Clock className="h-3 w-3 mr-1" /> Pending
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.summary}</p>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-2 flex-wrap">
                          <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{n.branchName}</span>
                          <span>By {n.authorName} · {ROLE_LABELS[n.authorRole]}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-muted-foreground">Logged</p>
                      <p className="text-xs font-medium">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Sheet open={!!openNote} onOpenChange={(o) => { if (!o) setOpenId(null); }}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {openNote && (
            <>
              <SheetHeader>
                <SheetTitle className="pr-6">{openNote.shiftLabel}</SheetTitle>
                <SheetDescription className="flex items-center gap-2 flex-wrap pt-1">
                  <Badge variant="outline" className={cn('text-[10px]', PRIORITY_META[openNote.priority].className)}>
                    {PRIORITY_META[openNote.priority].label}
                  </Badge>
                  <span className="flex items-center gap-1 text-xs"><Building2 className="h-3 w-3" />{openNote.branchName}</span>
                </SheetDescription>
              </SheetHeader>

              <div className="mt-4 space-y-4">
                <Section title="Summary" body={openNote.summary} />
                <Section title="Pending Tasks" body={openNote.pendingTasks} />
                <Section title="Incidents" body={openNote.incidents} />
                <Section title="Cash & Float Notes" body={openNote.cashNotes} />

                <div className="rounded-lg border border-border/50 bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
                  <p>
                    Logged by <span className="text-foreground font-medium">{openNote.authorName}</span> · {ROLE_LABELS[openNote.authorRole]}
                  </p>
                  <p>{formatDate(openNote.createdAt)}</p>
                  {openNote.acknowledgedById && (
                    <p className="text-success">
                      Acknowledged by {openNote.acknowledgedByName} · {openNote.acknowledgedAt ? formatDate(openNote.acknowledgedAt) : ''}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-border pt-3">
                  {isManager && !openNote.acknowledgedById && openNote.authorId !== user.id && (
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={() => {
                        acknowledge(openNote.id, user.id, user.name || user.email);
                        toast.success('Handover acknowledged');
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4" /> Acknowledge
                    </Button>
                  )}
                  {(user.role === 'super_admin' || openNote.authorId === user.id) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto text-destructive hover:text-destructive gap-1.5"
                      onClick={() => { deleteNote(openNote.id); setOpenId(null); toast.info('Handover deleted'); }}
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
      <div className="rounded-lg bg-muted/40 border border-border/50 p-3 text-sm whitespace-pre-wrap">
        {body.trim() ? body : <span className="text-muted-foreground italic">None</span>}
      </div>
    </div>
  );
}

function CreateHandoverDialog({
  managerBranches,
  onSubmit,
}: {
  managerBranches: { id: string; name: string }[];
  onSubmit: (v: {
    branchId: string;
    shiftLabel: string;
    summary: string;
    pendingTasks: string;
    incidents: string;
    cashNotes: string;
    priority: HandoverPriority;
  }) => void;
}) {
  const [branchId, setBranchId] = useState(managerBranches[0]?.id ?? '');
  const [shiftLabel, setShiftLabel] = useState('');
  const [summary, setSummary] = useState('');
  const [pendingTasks, setPendingTasks] = useState('');
  const [incidents, setIncidents] = useState('');
  const [cashNotes, setCashNotes] = useState('');
  const [priority, setPriority] = useState<HandoverPriority>('info');

  const valid = branchId && shiftLabel.trim().length >= 3 && summary.trim().length >= 10;

  return (
    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>New Shift Handover</DialogTitle>
        <DialogDescription>
          Leave a clear note for the next manager taking over.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Branch</label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
              <SelectContent>
                {managerBranches.length === 0 ? (
                  <SelectItem value="none" disabled>No branches assigned</SelectItem>
                ) : managerBranches.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Priority</label>
            <Select value={priority} onValueChange={(v) => setPriority(v as HandoverPriority)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="attention">Needs Attention</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Shift Label</label>
          <Input
            placeholder="e.g. Morning Shift (9:00 AM – 5:00 PM)"
            value={shiftLabel}
            onChange={(e) => setShiftLabel(e.target.value)}
            maxLength={80}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Summary</label>
          <Textarea
            placeholder="Overall how the shift went..."
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            maxLength={1000}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Pending Tasks</label>
          <Textarea
            placeholder="Anything the next shift needs to follow up on..."
            value={pendingTasks}
            onChange={(e) => setPendingTasks(e.target.value)}
            rows={2}
            maxLength={1000}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Incidents</label>
          <Textarea
            placeholder="Hardware faults, customer issues, anything notable..."
            value={incidents}
            onChange={(e) => setIncidents(e.target.value)}
            rows={2}
            maxLength={1000}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Cash & Float Notes</label>
          <Textarea
            placeholder="Float balance, deposits, discrepancies..."
            value={cashNotes}
            onChange={(e) => setCashNotes(e.target.value)}
            rows={2}
            maxLength={500}
          />
        </div>
      </div>

      <DialogFooter>
        <Button
          disabled={!valid}
          onClick={() => onSubmit({ branchId, shiftLabel: shiftLabel.trim(), summary: summary.trim(), pendingTasks: pendingTasks.trim(), incidents: incidents.trim(), cashNotes: cashNotes.trim(), priority })}
        >
          Save Handover
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
