import { useMemo, useState } from 'react';
import { useAuthStore, useBranchStore, useWalletStore } from '@/shared/lib/store';
import { CustomerWallet, LOW_BALANCE_THRESHOLD } from '@/shared/lib/mock-data';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Search, Wallet, AlertTriangle, Plus, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoyaltyTierBadge } from '@/features/loyalty/LoyaltyTierBadge';
import { WalletDetailDrawer } from '@/features/wallets/WalletDetailDrawer';
import { TopUpDialog } from '@/features/wallets/TopUpDialog';
import { StatCard } from '@/shared/ui/molecules/StatCard';

function formatRelativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function WalletsPage() {
  const user = useAuthStore(s => s.user);
  const branches = useBranchStore(s => s.branches);
  const wallets = useWalletStore(s => s.wallets);

  const visibleBranches = useMemo(() => {
    if (!user) return [];
    if (user.role === 'manager') {
      return branches.filter(b => user.assignedScope.includes(b.id));
    }
    if (user.role === 'cafe_owner') {
      return branches.filter(b => user.assignedScope.includes(b.cafeId));
    }
    return branches;
  }, [branches, user]);

  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<CustomerWallet | null>(null);
  const [topUpFor, setTopUpFor] = useState<CustomerWallet | null>(null);

  const filtered = useMemo(() => {
    const branchIds = new Set(visibleBranches.map(b => b.id));
    return wallets
      .filter(w => branchIds.has(w.branchId))
      .filter(w => branchFilter === 'all' || w.branchId === branchFilter)
      .filter(w => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return w.name.toLowerCase().includes(q) || w.phone.toLowerCase().includes(q);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [wallets, visibleBranches, branchFilter, query]);

  const totalBalance = filtered.reduce((s, w) => s + w.balance, 0);
  const lowBalanceCount = filtered.filter(w => w.balance < LOW_BALANCE_THRESHOLD).length;
  const totalPoints = filtered.reduce((s, w) => s + w.points, 0);

  if (!user) return null;
  const showBranchFilter = user.role !== 'manager' && visibleBranches.length > 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Wallets, loyalty points, and feedback for your customers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Customers" value={filtered.length} icon={Users} iconClassName="bg-primary/10 text-primary" />
        <StatCard title="Total Balance" value={`RM ${totalBalance.toFixed(0)}`} icon={Wallet} iconClassName="bg-success/10 text-success" />
        <StatCard title="Loyalty Points" value={totalPoints.toLocaleString()} icon={Wallet} iconClassName="bg-warning/10 text-warning" />
        <StatCard title="Low Balance" value={lowBalanceCount} subtitle={`< RM ${LOW_BALANCE_THRESHOLD}`} icon={AlertTriangle} iconClassName="bg-destructive/10 text-destructive" />
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or phone..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {showBranchFilter && (
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger className="sm:w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All branches</SelectItem>
                  {visibleBranches.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden sm:table-cell">Branch</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="hidden md:table-cell">Tier</TableHead>
                  <TableHead className="hidden lg:table-cell text-right">Points</TableHead>
                  <TableHead className="hidden md:table-cell">Last activity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground text-sm">
                      No customers found.
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map(w => {
                  const low = w.balance < LOW_BALANCE_THRESHOLD;
                  const branch = branches.find(b => b.id === w.branchId);
                  return (
                    <TableRow
                      key={w.id}
                      className="cursor-pointer"
                      onClick={() => setSelected(w)}
                    >
                      <TableCell>
                        <div className="font-medium">{w.name}</div>
                        <div className="text-[11px] text-muted-foreground">{w.phone}</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                        {branch?.name || w.branchId}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={cn('font-mono font-semibold tabular-nums', low && 'text-warning')}>
                          RM {w.balance.toFixed(2)}
                        </div>
                        {low && (
                          <Badge variant="outline" className="border-warning/40 text-warning text-[10px] mt-0.5">
                            Low
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <LoyaltyTierBadge points={w.points} />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-right font-mono text-sm tabular-nums">
                        {w.points.toLocaleString()}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {formatRelativeDate(w.lastActivity)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); setTopUpFor(w); }}
                        >
                          <Plus className="h-3.5 w-3.5" /> Top-up
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <WalletDetailDrawer
        wallet={selected}
        branchName={selected ? branches.find(b => b.id === selected.branchId)?.name : undefined}
        onOpenChange={(o) => !o && setSelected(null)}
      />
      {topUpFor && (
        <TopUpDialog
          open={!!topUpFor}
          onOpenChange={(o) => !o && setTopUpFor(null)}
          walletId={topUpFor.id}
          customerName={topUpFor.name}
          currentBalance={topUpFor.balance}
        />
      )}
    </div>
  );
}
