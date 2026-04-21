import { useMemo, useState } from 'react';
import ActiveSessionDashboard from '@/features/billing/ActiveSessionDashboard';
import { useAuthStore, useBranchStore } from '@/shared/lib/store';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Eye, Building2, IndianRupee, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function BillingSessionPage() {
  const { user } = useAuthStore();
  const branches = useBranchStore((s) => s.branches);
  const canManage = user?.role === 'cafe_owner';

  const visibleBranches = useMemo(() => {
    if (!user) return [];
    if (user.role === 'cafe_owner') return branches.filter((b) => b.cafeOwnerId === user.id);
    if (user.role === 'manager') return branches.filter((b) => b.managerId === user.id);
    if (user.role === 'admin') return branches.filter((b) => b.adminId === user.id);
    return branches; // super_admin
  }, [branches, user]);

  const [branchId, setBranchId] = useState<string>(visibleBranches[0]?.id ?? '');
  const branch = visibleBranches.find((b) => b.id === branchId) ?? visibleBranches[0];

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
            Billing sessions are managed by the cafe owner. You can view live bills but cannot end sessions.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" /> Branch
            </Label>
            <Select value={branch.id} onValueChange={setBranchId}>
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
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <IndianRupee className="h-3.5 w-3.5" /> Branch Rate
            </div>
            <p className="font-mono text-xl font-bold">₹{branch.billing.costPerMinute.toFixed(2)} <span className="text-xs text-muted-foreground font-normal">/ min</span></p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Lock className="h-3.5 w-3.5" /> Default Lock
            </div>
            <p className="font-mono text-xl font-bold">₹{branch.billing.lockedAmount.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      <ActiveSessionDashboard
        key={branch.id}
        readOnly={!canManage}
        lockedAmount={branch.billing.lockedAmount}
        costPerMinute={branch.billing.costPerMinute}
        branchName={branch.name}
      />
    </div>
  );
}
