import { useMemo, useState } from 'react';
import { useAuthStore, useBranchStore, useSettlementStore, type Settlement } from '@/shared/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Receipt, Search, Building2, IndianRupee, TrendingDown, Wallet, Lock, Clock, Hash, User as UserIcon, Calendar, Download, Power,
} from 'lucide-react';
import { MOCK_CUSTOMER_WALLETS } from '@/shared/lib/mock-data';
import { EndSessionConfirmDialog } from '@/features/billing/EndSessionConfirmDialog';
import { toast } from '@/hooks/use-toast';

function formatDuration(totalSec: number) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export default function SettlementsPage() {
  const { user } = useAuthStore();
  const branches = useBranchStore((s) => s.branches);
  const settlements = useSettlementStore((s) => s.settlements);
  const addSettlement = useSettlementStore((s) => s.addSettlement);

  const visibleBranches = useMemo(() => {
    if (!user) return [];
    if (user.role === 'cafe_owner') return branches.filter((b) => b.cafeOwnerId === user.id);
    if (user.role === 'manager') return branches.filter((b) => b.managerId === user.id);
    return branches;
  }, [branches, user]);

  const visibleBranchIds = useMemo(() => new Set(visibleBranches.map((b) => b.id)), [visibleBranches]);

  const scoped = useMemo(
    () => settlements.filter((s) => visibleBranchIds.has(s.branchId)),
    [settlements, visibleBranchIds]
  );

  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Settlement | null>(null);

  // End-active-session flow
  const [endPickerOpen, setEndPickerOpen] = useState(false);
  const [endBranchId, setEndBranchId] = useState<string>('');
  const [endCustomerId, setEndCustomerId] = useState<string>('');
  const [endStartTime] = useState<Date>(() => new Date());
  const [confirmEndOpen, setConfirmEndOpen] = useState(false);

  const endBranch = visibleBranches.find((b) => b.id === endBranchId);
  const endBranchCustomers = useMemo(
    () => MOCK_CUSTOMER_WALLETS.filter((c) => c.branchId === endBranchId),
    [endBranchId]
  );
  const endCustomer = endBranchCustomers.find((c) => c.id === endCustomerId);

  const endTotals = useMemo(() => {
    if (!endBranch || !endCustomer) {
      return { durationSec: 0, usageCost: 0, refund: 0, lockedAmount: 0 };
    }
    const durationSec = Math.max(0, Math.floor((Date.now() - endStartTime.getTime()) / 1000));
    const lockedAmount = endCustomer.lockedAmount;
    const usageCost = Math.min(lockedAmount, +(durationSec / 60 * endBranch.billing.costPerMinute).toFixed(2));
    const refund = +(lockedAmount - usageCost).toFixed(2);
    return { durationSec, usageCost, refund, lockedAmount };
  }, [endBranch, endCustomer, endStartTime, confirmEndOpen]);

  const openEndPicker = () => {
    const firstBranch = visibleBranches[0];
    setEndBranchId(firstBranch?.id ?? '');
    const firstCustomer = MOCK_CUSTOMER_WALLETS.find((c) => c.branchId === firstBranch?.id);
    setEndCustomerId(firstCustomer?.id ?? '');
    setEndPickerOpen(true);
  };

  const handleProceedToConfirm = () => {
    if (!endBranch || !endCustomer) return;
    setEndPickerOpen(false);
    setConfirmEndOpen(true);
  };

  const handleConfirmEndActive = () => {
    if (!user || !endBranch || !endCustomer) return;
    addSettlement({
      sessionId: `set-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      branchId: endBranch.id,
      branchName: endBranch.name,
      customerId: endCustomer.id,
      customerName: endCustomer.name,
      startTime: endStartTime.toISOString(),
      endTime: new Date().toISOString(),
      durationSec: endTotals.durationSec,
      costPerMinute: endBranch.billing.costPerMinute,
      lockedAmount: endTotals.lockedAmount,
      usageCost: endTotals.usageCost,
      refund: endTotals.refund,
      settledBy: user.id,
      settledByRole: user.role as 'cafe_owner' | 'manager',
    });
    toast({
      title: 'Session settled',
      description: `${endCustomer.name} · Usage ₹${endTotals.usageCost.toFixed(2)} · Refund ₹${endTotals.refund.toFixed(2)}`,
    });
    setConfirmEndOpen(false);
  };

  const filtered = useMemo(() => {
    return scoped.filter((s) => {
      if (branchFilter !== 'all' && s.branchId !== branchFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          s.customerName.toLowerCase().includes(q) ||
          s.sessionId.toLowerCase().includes(q) ||
          s.branchName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [scoped, branchFilter, search]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, s) => {
        acc.usage += s.usageCost;
        acc.refund += s.refund;
        acc.locked += s.lockedAmount;
        return acc;
      },
      { usage: 0, refund: 0, locked: 0 }
    );
  }, [filtered]);

  const exportCsv = () => {
    const rows = [
      ['Settlement ID', 'Session ID', 'Branch', 'Customer', 'Start', 'End', 'Duration', 'Rate/min', 'Locked', 'Usage', 'Refund', 'Settled By'],
      ...filtered.map((s) => [
        s.id, s.sessionId, s.branchName, s.customerName,
        fmtDate(s.startTime), fmtDate(s.endTime), formatDuration(s.durationSec),
        s.costPerMinute.toFixed(2), s.lockedAmount.toFixed(2),
        s.usageCost.toFixed(2), s.refund.toFixed(2), s.settledByRole,
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `settlements-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (user?.role !== 'cafe_owner' && user?.role !== 'manager') {
    return (
      <Alert>
        <AlertTitle>Restricted</AlertTitle>
        <AlertDescription>
          Settlements are only available to cafe owners and managers.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Receipt className="h-6 w-6 text-primary" /> Session Settlements
          </h1>
          <p className="text-sm text-muted-foreground">
            Records of every ended billing session for your branches.
          </p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-2">
              <Receipt className="h-3.5 w-3.5" /> Total Settled
            </div>
            <p className="font-mono text-2xl font-bold">{filtered.length}</p>
          </CardContent>
        </Card>
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-primary mb-2">
              <Lock className="h-3.5 w-3.5" /> Locked Sum
            </div>
            <p className="font-mono text-2xl font-bold tabular-nums">₹{totals.locked.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-destructive mb-2">
              <TrendingDown className="h-3.5 w-3.5" /> Usage Collected
            </div>
            <p className="font-mono text-2xl font-bold tabular-nums text-destructive">
              ₹{totals.usage.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-success/30 bg-success/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-success mb-2">
              <Wallet className="h-3.5 w-3.5" /> Refunded
            </div>
            <p className="font-mono text-2xl font-bold tabular-nums text-success">
              ₹{totals.refund.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" /> Branch
            </Label>
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All branches</SelectItem>
                {visibleBranches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Search className="h-3.5 w-3.5" /> Search
            </Label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer, session ID, or branch"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Settlement Records</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No settlements yet</p>
              <p className="text-sm">End a billing session to create a settlement record.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Branch · Customer</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead className="text-right">Locked</TableHead>
                    <TableHead className="text-right">Usage</TableHead>
                    <TableHead className="text-right">Refund</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow
                      key={s.id}
                      className="cursor-pointer"
                      onClick={() => setSelected(s)}
                    >
                      <TableCell className="text-xs">
                        <div className="font-medium">{fmtDate(s.endTime)}</div>
                        <div className="text-muted-foreground font-mono">{s.sessionId.slice(0, 8)}…</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{s.branchName}</div>
                        <div className="text-xs text-muted-foreground">{s.customerName}</div>
                      </TableCell>
                      <TableCell className="font-mono">{formatDuration(s.durationSec)}</TableCell>
                      <TableCell className="text-right font-mono">₹{s.lockedAmount.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono text-destructive">
                        ₹{s.usageCost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-success">
                        ₹{s.refund.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-success/30 text-success bg-success/10">
                          Settled
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" /> Settlement Receipt
                </DialogTitle>
                <DialogDescription>
                  Settlement <span className="font-mono">{selected.id}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-start gap-2">
                    <Hash className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Session</div>
                      <div className="font-mono break-all">{selected.sessionId}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Branch</div>
                      <div>{selected.branchName}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <UserIcon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Customer</div>
                      <div>{selected.customerName}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Settled by</div>
                      <div className="capitalize">{selected.settledByRole.replace('_', ' ')}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Start</div>
                      <div>{fmtDate(selected.startTime)}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">End</div>
                      <div>{fmtDate(selected.endTime)}</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                    <div className="text-[11px] uppercase tracking-wider text-primary flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Locked
                    </div>
                    <div className="font-mono text-lg font-bold">₹{selected.lockedAmount.toFixed(2)}</div>
                  </div>
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                    <div className="text-[11px] uppercase tracking-wider text-destructive flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" /> Usage
                    </div>
                    <div className="font-mono text-lg font-bold text-destructive">
                      ₹{selected.usageCost.toFixed(2)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-success/30 bg-success/5 p-3">
                    <div className="text-[11px] uppercase tracking-wider text-success flex items-center gap-1">
                      <Wallet className="h-3 w-3" /> Refund
                    </div>
                    <div className="font-mono text-lg font-bold text-success">
                      ₹{selected.refund.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/30 p-3 text-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Rate</span>
                  </div>
                  <span className="font-mono">₹{selected.costPerMinute.toFixed(2)} / min</span>
                </div>

                <div className="rounded-lg border bg-muted/30 p-3 text-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Duration</span>
                  </div>
                  <span className="font-mono">{formatDuration(selected.durationSec)}</span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
