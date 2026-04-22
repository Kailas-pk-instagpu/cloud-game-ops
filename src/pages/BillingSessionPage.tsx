import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ActiveSessionDashboard from '@/features/billing/ActiveSessionDashboard';
import { useAuthStore, useBranchStore, useSettlementStore } from '@/shared/lib/store';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Eye, Building2, IndianRupee, Lock, User as UserIcon, Wallet, Receipt } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MOCK_CUSTOMER_WALLETS } from '@/shared/lib/mock-data';
import { toast } from '@/hooks/use-toast';

export default function BillingSessionPage() {
  const { user } = useAuthStore();
  const branches = useBranchStore((s) => s.branches);
  // Cafe owners and managers manage user billing; admins/super-admins view-only
  const canManage = user?.role === 'cafe_owner' || user?.role === 'manager';

  const visibleBranches = useMemo(() => {
    if (!user) return [];
    if (user.role === 'cafe_owner') return branches.filter((b) => b.cafeOwnerId === user.id);
    if (user.role === 'manager') return branches.filter((b) => b.managerId === user.id);
    if (user.role === 'admin') return branches.filter((b) => b.adminId === user.id);
    return branches;
  }, [branches, user]);

  const [searchParams] = useSearchParams();
  const urlBranchId = searchParams.get('branchId');
  const urlCustomerId = searchParams.get('customerId');

  const [branchId, setBranchId] = useState<string>(urlBranchId ?? visibleBranches[0]?.id ?? '');
  const branch = visibleBranches.find((b) => b.id === branchId) ?? visibleBranches[0];

  const branchCustomers = useMemo(
    () => MOCK_CUSTOMER_WALLETS.filter((c) => c.branchId === branch?.id),
    [branch?.id]
  );

  const [customerId, setCustomerId] = useState<string>(urlCustomerId ?? branchCustomers[0]?.id ?? '');
  const customer =
    branchCustomers.find((c) => c.id === customerId) ?? branchCustomers[0];

  useEffect(() => {
    if (urlBranchId && urlBranchId !== branchId) setBranchId(urlBranchId);
    if (urlCustomerId && urlCustomerId !== customerId) setCustomerId(urlCustomerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlBranchId, urlCustomerId]);

  if (!branch) {
    return (
      <Alert>
        <AlertTitle>No branches available</AlertTitle>
        <AlertDescription>You don't have any branches assigned to view billing sessions.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {!canManage && (
        <Alert className="border-primary/30 bg-primary/5">
          <Eye className="h-4 w-4" />
          <AlertTitle>View-only access</AlertTitle>
          <AlertDescription>
            User billing is managed by cafe owners and managers. You can view live bills but cannot end sessions.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" /> Branch
            </Label>
            <Select
              value={branch.id}
              onValueChange={(v) => {
                setBranchId(v);
                const first = MOCK_CUSTOMER_WALLETS.find((c) => c.branchId === v);
                setCustomerId(first?.id ?? '');
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {visibleBranches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <UserIcon className="h-3.5 w-3.5" /> Customer
            </Label>
            {branchCustomers.length > 0 ? (
              <Select value={customer?.id} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {branchCustomers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} · ₹{c.balance}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">No customers</p>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <IndianRupee className="h-3.5 w-3.5" /> Branch Rate
            </div>
            <p className="font-mono text-xl font-bold">
              ₹{branch.billing.costPerMinute.toFixed(2)}{' '}
              <span className="text-xs text-muted-foreground font-normal">/ min</span>
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Wallet className="h-3.5 w-3.5" /> Wallet Balance
            </div>
            <p className="font-mono text-xl font-bold">
              ₹{(customer?.balance ?? 0).toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Lock className="h-3 w-3" /> Locked ₹{(customer?.lockedAmount ?? branch.billing.lockedAmount).toFixed(2)}
            </p>
          </div>
        </CardContent>
      </Card>

      {customer ? (
        <ActiveSessionDashboard
          key={`${branch.id}-${customer.id}`}
          readOnly={!canManage}
          lockedAmount={customer.lockedAmount}
          costPerMinute={branch.billing.costPerMinute}
          branchName={`${branch.name} · ${customer.name}`}
        />
      ) : (
        <Alert>
          <AlertTitle>No active customer</AlertTitle>
          <AlertDescription>This branch has no customers with a wallet yet.</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
