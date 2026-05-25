import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Building2, Monitor, Clock, User as UserIcon, Wallet, ChevronRight, Receipt } from 'lucide-react';
import { useAuthStore, useBranchStore, useSeatStore } from '@/shared/lib/store';
import { MOCK_CUSTOMER_WALLETS } from '@/shared/lib/mock-data';
import EmptyState from '@/shared/ui/molecules/EmptyState';

function formatRelative(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return `${hrs}h ${rem}m ago`;
}

// Stable pseudo-random session start (last 0-3 hours) seeded by customer id
function startTimeFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const minutesAgo = (hash % 180) + 2;
  return new Date(Date.now() - minutesAgo * 60_000);
}

export default function CafeOwnerActiveSessionsOverview() {
  const { user } = useAuthStore();
  const branches = useBranchStore((s) => s.branches);
  const seats = useSeatStore((s) => s.seats);
  const navigate = useNavigate();

  const ownerBranches = useMemo(
    () => (user ? branches.filter((b) => b.cafeOwnerId === user.id) : []),
    [branches, user]
  );

  const sessionsByBranch = useMemo(() => {
    return ownerBranches.map((branch) => {
      const branchSeats = seats.filter((s) => s.branchId === branch.id);
      const customers = MOCK_CUSTOMER_WALLETS.filter((c) => c.branchId === branch.id);
      const sessions = customers.map((c, idx) => {
        const seat = branchSeats[idx % Math.max(branchSeats.length, 1)];
        const start = startTimeFor(c.id);
        const durationMin = Math.max(1, Math.floor((Date.now() - start.getTime()) / 60_000));
        const usage = Math.min(c.lockedAmount, +(durationMin * branch.billing.costPerMinute).toFixed(2));
        const usagePct = Math.min(100, (usage / c.lockedAmount) * 100);
        return {
          customer: c,
          seat,
          start,
          durationMin,
          usage,
          usagePct,
          rate: branch.billing.costPerMinute,
        };
      });
      return { branch, sessions };
    });
  }, [ownerBranches, seats]);

  const totalActive = sessionsByBranch.reduce((sum, b) => sum + b.sessions.length, 0);
  const totalRevenue = sessionsByBranch.reduce(
    (sum, b) => sum + b.sessions.reduce((a, s) => a + s.usage, 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header summary */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Active Billing Sessions</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Live overview of all running sessions across your branches.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/billing/settlements')}>
            <Receipt className="h-4 w-4" /> View Settlements
          </Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-2">
              <Activity className="h-3.5 w-3.5" /> Active Sessions
            </div>
            <p className="font-mono text-2xl font-bold">{totalActive}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-2">
              <Building2 className="h-3.5 w-3.5" /> Branches
            </div>
            <p className="font-mono text-2xl font-bold">{ownerBranches.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-2">
              <Wallet className="h-3.5 w-3.5" /> Live Usage
            </div>
            <p className="font-mono text-2xl font-bold">RM {totalRevenue.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-2">
              <Monitor className="h-3.5 w-3.5" /> Seats Online
            </div>
            <p className="font-mono text-2xl font-bold">
              {ownerBranches.reduce((a, b) => a + b.activeSeats, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Branch groups */}
      {sessionsByBranch.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No branches available"
          description="You don't have any branches with active sessions."
        />
      ) : (
        <div className="space-y-6">
          {sessionsByBranch.map(({ branch, sessions }) => (
            <Card key={branch.id} className="border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building2 className="h-4 w-4 text-primary" />
                    {branch.name}
                    <Badge variant="outline" className="ml-1 font-normal">
                      {sessions.length} active
                    </Badge>
                  </CardTitle>
                  <div className="text-xs text-muted-foreground font-mono">
                    RM {branch.billing.costPerMinute.toFixed(2)} / min
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No active sessions in this branch.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {sessions.map((s) => (
                      <button
                        key={s.customer.id}
                        onClick={() =>
                          navigate(`/billing/session?branchId=${branch.id}&customerId=${s.customer.id}`)
                        }
                        className="group text-left rounded-xl border border-border/60 bg-card p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_0_25px_hsl(var(--primary)/0.12)] hover:-translate-y-0.5"
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <UserIcon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold truncate">{s.customer.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{s.customer.phone}</p>
                            </div>
                          </div>
                          <Badge className="bg-success/10 text-success border-success/30 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-success mr-1.5 animate-pulse" />
                            Live
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Monitor className="h-3.5 w-3.5" />
                            <span className="truncate">
                              Seat #{s.seat?.number ?? '—'}
                              {s.seat?.gpuModel ? ` · ${s.seat.gpuModel}` : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{formatRelative(s.start)}</span>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Usage</span>
                            <span className="font-mono font-semibold">
                              RM {s.usage.toFixed(2)} <span className="text-muted-foreground">/ {s.customer.lockedAmount.toFixed(2)}</span>
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-success via-warning to-destructive transition-all"
                              style={{ width: `${s.usagePct}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-1 mt-3 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          Open session <ChevronRight className="h-3.5 w-3.5" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
