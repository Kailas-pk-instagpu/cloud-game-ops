import { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { CheckCircle2, Download, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { useAuthStore, useBranchStore } from '@/shared/lib/store';
import { getScopedBranches } from '@/shared/lib/branchScope';
import { MOCK_USERS } from '@/shared/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  Charge, DuitNowQr, Payment, PaymentStatus,
  createDuitNowQr, getDuePayments, getInvoicePdf, getPaymentHistory, getPaymentStatus, getUsage,
} from '@/features/branch-billing/billingService';

const rm = (n: number) => `RM ${n.toFixed(2)}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' });

function useInvoiceDownload(branchId: string, branchName: string) {
  return useCallback(async (payment: Payment) => {
    try {
      const branches = useBranchStore.getState().branches;
      const b = branches.find((x) => x.id === branchId);
      const owner = MOCK_USERS.find((u) => u.id === b?.cafeOwnerId);
      const blob = await getInvoicePdf(payment.id, {
        branchName,
        ownerName: owner?.name ?? 'Cafe Owner',
        ownerEmail: owner?.email ?? '-',
        ownerPhone: owner?.phone,
        ownerAddress: owner?.address,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${payment.invoiceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Could not download invoice');
    }
  }, [branchId, branchName]);
}

function LoadingRows({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: cols }).map((__, j) => (
            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

function PayDialog({
  open, onClose, branchId, branchName, chargeIds, onPaid,
}: {
  open: boolean; onClose: () => void; branchId: string; branchName: string; chargeIds: string[]; onPaid: () => void;
}) {
  const [qr, setQr] = useState<DuitNowQr | null>(null);
  const [status, setStatus] = useState<PaymentStatus | 'creating' | 'error'>('creating');
  const [payment, setPayment] = useState<Payment | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const download = useInvoiceDownload(branchId, branchName);

  const start = useCallback(async () => {
    setStatus('creating');
    setQr(null);
    setPayment(null);
    try {
      const q = await createDuitNowQr(branchId, chargeIds);
      setQr(q);
      setStatus('pending');
    } catch {
      setStatus('error');
      toast.error('Could not create DuitNow QR');
    }
  }, [branchId, chargeIds]);

  useEffect(() => { if (open) start(); }, [open, start]);

  useEffect(() => {
    if (!qr || status !== 'pending') return;
    const tick = setInterval(() => setSecondsLeft(Math.max(0, Math.round((qr.expiresAt - Date.now()) / 1000))), 1000);
    setSecondsLeft(Math.round((qr.expiresAt - Date.now()) / 1000));
    const poll = setInterval(async () => {
      try {
        const res = await getPaymentStatus(qr.reference);
        if (res.status === 'pending') return;
        setStatus(res.status);
        if (res.status === 'success' && res.payment) {
          setPayment(res.payment);
          toast.success('Payment received', { description: `${rm(res.payment.amount)} · ${res.payment.reference}` });
          onPaid();
        } else if (res.status === 'failed') toast.error('Payment failed');
        else if (res.status === 'expired') toast.error('QR code expired');
      } catch {
        toast.error('Could not check payment status');
      }
    }, 3000);
    return () => { clearInterval(tick); clearInterval(poll); };
  }, [qr, status, onPaid]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pay with DuitNow QR</DialogTitle>
          <DialogDescription>Scan with any Malaysian banking or e-wallet app.</DialogDescription>
        </DialogHeader>

        {status === 'creating' && (
          <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" /> Generating QR code…
          </div>
        )}

        {qr && status === 'pending' && (
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-xl border bg-background p-4">
              <QRCodeSVG value={qr.qrPayload} size={200} />
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Waiting for payment · expires in {secondsLeft}s
            </p>
          </div>
        )}

        {status === 'success' && payment && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-success" />
            <p className="font-semibold">Payment successful</p>
            <p className="text-sm text-muted-foreground">Invoice {payment.invoiceNumber} generated.</p>
            <Button onClick={() => download(payment)}><Download className="h-4 w-4" /> Download invoice</Button>
          </div>
        )}

        {(status === 'failed' || status === 'expired' || status === 'error') && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <XCircle className="h-12 w-12 text-destructive" />
            <p className="font-semibold">{status === 'expired' ? 'QR code expired' : 'Payment failed'}</p>
            <Button onClick={start}><RefreshCw className="h-4 w-4" /> Retry</Button>
          </div>
        )}

        {qr && (
          <dl className="grid grid-cols-2 gap-y-2 rounded-lg border p-3 text-sm">
            <dt className="text-muted-foreground">Amount</dt><dd className="text-right font-mono font-semibold">{rm(qr.amount)}</dd>
            <dt className="text-muted-foreground">Branch</dt><dd className="text-right">{branchName}</dd>
            <dt className="text-muted-foreground">Reference</dt><dd className="text-right font-mono">{qr.reference}</dd>
          </dl>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    due: 'bg-warning/10 text-warning border-warning/20',
    overdue: 'bg-destructive/10 text-destructive border-destructive/20',
    paid: 'bg-success/10 text-success border-success/20',
    success: 'bg-success/10 text-success border-success/20',
    failed: 'bg-destructive/10 text-destructive border-destructive/20',
  };
  const label = status === 'success' ? 'Paid' : status.charAt(0).toUpperCase() + status.slice(1);
  return <Badge variant="outline" className={cn('font-medium', map[status])}>{label}</Badge>;
}

function Overview({ branchId, branchName, canPay }: { branchId: string; branchName: string; canPay: boolean }) {
  const [rows, setRows] = useState<Charge[] | null>(null);
  const [payIds, setPayIds] = useState<string[] | null>(null);

  const load = useCallback(() => {
    setRows(null);
    getDuePayments(branchId).then(setRows).catch(() => { setRows([]); toast.error('Could not load due payments'); });
  }, [branchId]);
  useEffect(load, [load]);

  const total = (rows ?? []).reduce((s, r) => s + r.amount, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <div>
          <p className="text-sm text-muted-foreground">Total due</p>
          {rows ? <p className="text-2xl font-bold font-mono">{rm(total)}</p> : <Skeleton className="h-8 w-32 mt-1" />}
        </div>
        {canPay && rows && rows.length > 0 && (
          <Button onClick={() => setPayIds(rows.map((r) => r.id))}>Pay all due</Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {rows && rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 text-success" />
            You're all caught up.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  {canPay && <TableHead className="text-right">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {!rows ? <LoadingRows cols={canPay ? 5 : 4} /> : rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap">{fmtDate(r.date)}</TableCell>
                    <TableCell>{r.description}</TableCell>
                    <TableCell className="text-right font-mono">{rm(r.amount)}</TableCell>
                    <TableCell><StatusPill status={r.status} /></TableCell>
                    {canPay && (
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => setPayIds([r.id])}>Pay now</Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      {payIds && (
        <PayDialog
          open
          onClose={() => { setPayIds(null); load(); }}
          branchId={branchId}
          branchName={branchName}
          chargeIds={payIds}
          onPaid={() => {}}
        />
      )}
    </Card>
  );
}

function monthOptions() {
  const out: { value: string; label: string }[] = [];
  const d = new Date();
  for (let i = 0; i < 3; i++) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push({
      value: `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`,
      label: m.toLocaleDateString('en-MY', { month: 'long', year: 'numeric' }),
    });
  }
  return out;
}

function Usage({ branchId }: { branchId: string }) {
  const months = useMemo(monthOptions, []);
  const [month, setMonth] = useState(months[0].value);
  const [rows, setRows] = useState<Charge[] | null>(null);
  useEffect(() => {
    setRows(null);
    getUsage(branchId, month).then(setRows).catch(() => { setRows([]); toast.error('Could not load usage'); });
  }, [branchId, month]);
  const total = (rows ?? []).reduce((s, r) => s + r.amount, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-base">Daily usage</CardTitle>
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>{months.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Hours</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!rows ? <LoadingRows cols={4} /> : rows.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">No usage this month.</TableCell></TableRow>
            ) : (
              <>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap">{fmtDate(r.date)}</TableCell>
                    <TableCell className="text-right font-mono">{r.hours.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono">{rm(r.rate)}/h</TableCell>
                    <TableCell className="text-right font-mono">{rm(r.amount)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-semibold">
                  <TableCell colSpan={3}>Month total</TableCell>
                  <TableCell className="text-right font-mono">{rm(total)}</TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function History({ branchId, branchName, canDownload }: { branchId: string; branchName: string; canDownload: boolean }) {
  const [rows, setRows] = useState<Payment[] | null>(null);
  const download = useInvoiceDownload(branchId, branchName);
  useEffect(() => {
    setRows(null);
    getPaymentHistory(branchId).then(setRows).catch(() => { setRows([]); toast.error('Could not load payment history'); });
  }, [branchId]);
  const cols = canDownload ? 5 : 4;

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Payment history</CardTitle></CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              {canDownload && <TableHead className="text-right">Invoice</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {!rows ? <LoadingRows cols={cols} /> : rows.length === 0 ? (
              <TableRow><TableCell colSpan={cols} className="text-center py-10 text-muted-foreground">No payments yet.</TableCell></TableRow>
            ) : rows.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="whitespace-nowrap">{fmtDate(p.date)}</TableCell>
                <TableCell className="font-mono">{p.reference}</TableCell>
                <TableCell className="text-right font-mono">{rm(p.amount)}</TableCell>
                <TableCell><StatusPill status={p.status} /></TableCell>
                {canDownload && (
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => download(p)}>
                      <Download className="h-4 w-4" /> <span className="hidden sm:inline">Download invoice</span>
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

const TABS = [
  { to: '/billing', label: 'Overview' },
  { to: '/billing/usage', label: 'Usage' },
  { to: '/billing/history', label: 'Payment History' },
];

export default function BranchBillingPage() {
  const user = useAuthStore((s) => s.user);
  const allBranches = useBranchStore((s) => s.branches);
  const branches = useMemo(() => getScopedBranches(allBranches, user), [allBranches, user]);
  const [params, setParams] = useSearchParams();
  const { pathname } = useLocation();
  const branchId = params.get('branch') ?? branches[0]?.id ?? '';
  const branch = branches.find((b) => b.id === branchId) ?? branches[0];

  const canPay = user?.role === 'cafe_owner';
  const canDownload = user?.role === 'cafe_owner' || user?.role === 'super_admin';
  const qs = branch ? `?branch=${branch.id}` : '';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Billing</h1>
          <p className="text-sm text-muted-foreground">Daily usage billed separately for each branch, in MYR.</p>
        </div>
        {branches.length > 0 && (
          <Select value={branch?.id} onValueChange={(v) => setParams({ branch: v })}>
            <SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="Select branch" /></SelectTrigger>
            <SelectContent>{branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
          </Select>
        )}
      </div>

      <nav className="flex flex-wrap gap-1 border-b">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to + qs}
            end
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors',
              pathname === t.to ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
          </NavLink>
        ))}
      </nav>


      {!branch ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No branches available.</CardContent></Card>
      ) : pathname === '/billing/usage' ? (
        <Usage branchId={branch.id} />
      ) : pathname === '/billing/history' ? (
        <History branchId={branch.id} branchName={branch.name} canDownload={canDownload} />
      ) : (
        <Overview key={branch.id} branchId={branch.id} branchName={branch.name} canPay={canPay} />
      )}
    </div>
  );
}
