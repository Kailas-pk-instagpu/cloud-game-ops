import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import ActiveSessionDashboard from '@/features/billing/ActiveSessionDashboard';
import CafeOwnerActiveSessionsOverview from '@/features/billing/CafeOwnerActiveSessionsOverview';
import { useAuthStore, useCafeStore, useSettlementStore } from '@/shared/lib/store';
import { useCan } from '@/shared/lib/permissions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Eye, Building2, Banknote, Lock, User as UserIcon, Wallet, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MOCK_CUSTOMER_WALLETS } from '@/shared/lib/mock-data';
import { toast } from '@/hooks/use-toast';


export default function BillingSessionPage() {
  const { user } = useAuthStore();
  const cafes = useCafeStore((s) => s.cafes);
  const addSettlement = useSettlementStore((s) => s.addSettlement);
  const navigate = useNavigate();

  // Ending and settling a session is a permission (cafe owners and Floor Managers by default); admins/super-admins see settlements
  const can = useCan();
  const canManage = can('sessions.end');
  const isHistoryViewer = user?.role === 'super_admin' || user?.role === 'admin';

  const visibleCafes = useMemo(() => {
    if (!user) return [];
    if (user.role === 'cafe_owner') return cafes.filter((b) => b.cafeOwnerId === user.id);
    if (user.role === 'manager') return cafes.filter((b) => b.managerId === user.id);
    if (user.role === 'admin') return cafes.filter((b) => b.adminId === user.id);
    return cafes;
  }, [cafes, user]);

  const [searchParams] = useSearchParams();
  const urlCafeId = searchParams.get('cafeId');
  const urlCustomerId = searchParams.get('customerId');

  const [cafeId, setCafeId] = useState<string>(urlCafeId ?? visibleCafes[0]?.id ?? '');
  const [cafeOpen, setCafeOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const cafe = visibleCafes.find((b) => b.id === cafeId) ?? visibleCafes[0];

  const cafeCustomers = useMemo(
    () => MOCK_CUSTOMER_WALLETS.filter((c) => c.cafeId === cafe?.id),
    [cafe?.id]
  );

  const [customerId, setCustomerId] = useState<string>(urlCustomerId ?? cafeCustomers[0]?.id ?? '');
  const customer =
    cafeCustomers.find((c) => c.id === customerId) ?? cafeCustomers[0];

  useEffect(() => {
    if (urlCafeId && urlCafeId !== cafeId) setCafeId(urlCafeId);
    if (urlCustomerId && urlCustomerId !== customerId) setCustomerId(urlCustomerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlCafeId, urlCustomerId]);

  // Stable session id + start time per (cafe, customer) pair so settlement records are consistent
  const sessionMetaRef = useRef<Record<string, { sessionId: string; startTime: Date }>>({});
  const sessionKey = `${cafe?.id ?? ''}-${customer?.id ?? ''}`;
  if (sessionKey && !sessionMetaRef.current[sessionKey]) {
    sessionMetaRef.current[sessionKey] = {
      sessionId: crypto.randomUUID(),
      startTime: new Date(),
    };
  }
  const sessionMeta = sessionMetaRef.current[sessionKey];

  const handleEndSession = (summary: { durationSec: number; usageCost: number; refund: number }) => {
    if (!user || !cafe || !customer || !canManage) return;
    if (user.role !== 'cafe_owner' && user.role !== 'manager') return;
    const settlement = addSettlement({
      sessionId: sessionMeta.sessionId,
      cafeId: cafe.id,
      cafeName: cafe.name,
      customerId: customer.id,
      customerName: customer.name,
      startTime: sessionMeta.startTime.toISOString(),
      endTime: new Date().toISOString(),
      durationSec: summary.durationSec,
      costPerMinute: cafe.billing.costPerMinute,
      lockedAmount: customer.lockedAmount,
      usageCost: summary.usageCost,
      refund: summary.refund,
      settledBy: user.id,
      settledByRole: user.role,
    });
    toast({
      title: 'Session settled',
      description: `${customer.name} · Usage RM ${summary.usageCost.toFixed(2)} · Refund RM ${summary.refund.toFixed(2)}`,
    });
    // Reset stable meta so next session for same pair gets a fresh id
    delete sessionMetaRef.current[sessionKey];
    void settlement;
  };

  // Preserve the view-only billing destination for oversight roles.
  if (isHistoryViewer) {
    return <Navigate to="/billing/history" replace />;
  }

  // Cafe owners see an overview of all active sessions across their cafes.
  // The detailed view is opened by clicking a session (which adds customerId to the URL).
  if ((user?.role === 'cafe_owner' || user?.role === 'manager') && !urlCustomerId) {
    return <CafeOwnerActiveSessionsOverview />;
  }

  if (!cafe) {
    return (
      <Alert>
        <AlertTitle>No cafes available</AlertTitle>
        <AlertDescription>You don't have any cafes assigned to view billing sessions.</AlertDescription>
      </Alert>
    );
  }

  const showBack = user?.role === 'cafe_owner' || user?.role === 'manager';

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-between items-center gap-2">
          {showBack ? (
            <Button variant="ghost" size="sm" onClick={() => navigate('/billing/session')}>
              <ArrowLeft className="h-4 w-4" /> Back to sessions
            </Button>
          ) : <span />}
        </div>
      )}

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
              <Building2 className="h-3.5 w-3.5" /> Cafe
            </Label>
            <Popover open={cafeOpen} onOpenChange={setCafeOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={cafeOpen}
                  className="w-full justify-between font-normal"
                >
                  {cafe?.name ?? 'Select cafe'}
                  <ChevronsUpDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search cafe..." />
                  <CommandList>
                    <CommandEmpty>No cafe found.</CommandEmpty>
                    <CommandGroup>
                      {visibleCafes.map((b) => (
                        <CommandItem
                          key={b.id}
                          value={b.name}
                          onSelect={() => {
                            setCafeId(b.id);
                            const first = MOCK_CUSTOMER_WALLETS.find((c) => c.cafeId === b.id);
                            setCustomerId(first?.id ?? '');
                            setCafeOpen(false);
                          }}
                        >
                          <Check className={cn('mr-2 h-4 w-4', cafe?.id === b.id ? 'opacity-100' : 'opacity-0')} />
                          {b.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <UserIcon className="h-3.5 w-3.5" /> Customer
            </Label>
            {cafeCustomers.length > 0 ? (
              <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={customerOpen}
                    className="w-full justify-between font-normal"
                  >
                    {customer ? `${customer.name} · RM ${customer.balance}` : 'Select customer'}
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search customer..." />
                    <CommandList>
                      <CommandEmpty>No customer found.</CommandEmpty>
                      <CommandGroup>
                        {cafeCustomers.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={c.name}
                            onSelect={() => {
                              setCustomerId(c.id);
                              setCustomerOpen(false);
                            }}
                          >
                            <Check className={cn('mr-2 h-4 w-4', customer?.id === c.id ? 'opacity-100' : 'opacity-0')} />
                            {c.name} · RM {c.balance}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            ) : (
              <p className="text-sm text-muted-foreground">No customers</p>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Banknote className="h-3.5 w-3.5" /> Cafe Rate
            </div>
            <p className="font-mono text-xl font-bold">
              RM {cafe.billing.costPerMinute.toFixed(2)}{' '}
              <span className="text-xs text-muted-foreground font-normal">/ min</span>
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Wallet className="h-3.5 w-3.5" /> Wallet Balance
            </div>
            <p className="font-mono text-xl font-bold">
              RM {(customer?.balance ?? 0).toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Lock className="h-3 w-3" /> Locked RM {(customer?.lockedAmount ?? cafe.billing.lockedAmount).toFixed(2)}
            </p>
          </div>
        </CardContent>
      </Card>

      {customer ? (
        <ActiveSessionDashboard
          key={sessionKey}
          sessionId={sessionMeta.sessionId}
          startTime={sessionMeta.startTime}
          readOnly={!canManage}
          lockedAmount={customer.lockedAmount}
          costPerMinute={cafe.billing.costPerMinute}
          cafeName={`${cafe.name} · ${customer.name}`}
          onEndSession={handleEndSession}
        />
      ) : (
        <Alert>
          <AlertTitle>No active customer</AlertTitle>
          <AlertDescription>This cafe has no customers with a wallet yet.</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
