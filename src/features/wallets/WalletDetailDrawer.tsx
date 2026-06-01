import { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Wallet, Trophy, MessageSquareHeart, Plus, Coins, ArrowUpRight, ArrowDownRight, Gift, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWalletStore, useFeedbackStore } from '@/shared/lib/store';
import { CustomerWallet, LOW_BALANCE_THRESHOLD, nextTierProgress, LOYALTY_TIERS, WalletTxnType } from '@/shared/lib/mock-data';
import { LoyaltyTierBadge } from '@/features/loyalty/LoyaltyTierBadge';
import { TopUpDialog } from './TopUpDialog';
import { FeedbackDialog } from '@/features/feedback/FeedbackDialog';

function formatDateTime(ts: string) {
  return new Date(ts).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

const TXN_META: Record<WalletTxnType, { icon: typeof Plus; color: string; label: string }> = {
  topup:  { icon: Plus,            color: 'text-success',     label: 'Top-up' },
  charge: { icon: ArrowDownRight,  color: 'text-destructive', label: 'Charge' },
  refund: { icon: ArrowUpRight,    color: 'text-success',     label: 'Refund' },
  redeem: { icon: Gift,            color: 'text-primary',     label: 'Redeem' },
  bonus:  { icon: Coins,           color: 'text-warning',     label: 'Bonus' },
};

interface Props {
  wallet: CustomerWallet | null;
  branchName?: string;
  onOpenChange: (open: boolean) => void;
}

export function WalletDetailDrawer({ wallet, branchName, onOpenChange }: Props) {
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const transactions = useWalletStore(s => wallet ? s.getTransactions(wallet.id) : []);
  const feedback = useFeedbackStore(s => wallet ? s.feedback.filter(f => f.walletId === wallet.id) : []);

  if (!wallet) return null;

  const lowBalance = wallet.balance < LOW_BALANCE_THRESHOLD;
  const progress = nextTierProgress(wallet.points);

  return (
    <>
      <Sheet open={!!wallet} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <SheetTitle className="text-xl">{wallet.name}</SheetTitle>
                <SheetDescription>
                  {wallet.phone} · {branchName || wallet.branchId}
                </SheetDescription>
              </div>
              <LoyaltyTierBadge points={wallet.points} size="md" />
            </div>
          </SheetHeader>

          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className={cn(
              'rounded-xl border p-3',
              lowBalance ? 'border-warning/40 bg-warning/5' : 'bg-card',
            )}>
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                <Wallet className="h-3 w-3" /> Balance
              </div>
              <p className="font-mono text-2xl font-bold tabular-nums">RM {wallet.balance.toFixed(2)}</p>
              {lowBalance && <p className="text-[10px] text-warning mt-1">Below RM {LOW_BALANCE_THRESHOLD}</p>}
              {wallet.lockedAmount > 0 && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  RM {wallet.lockedAmount.toFixed(2)} locked
                </p>
              )}
            </div>
            <div className="rounded-xl border p-3">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                <Coins className="h-3 w-3" /> Points
              </div>
              <p className="font-mono text-2xl font-bold tabular-nums">{wallet.points.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {progress.next
                  ? `${progress.toNext.toLocaleString()} to ${LOYALTY_TIERS[progress.next].label}`
                  : 'Top tier'}
              </p>
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <Button onClick={() => setTopUpOpen(true)} className="flex-1">
              <Plus className="h-4 w-4" /> Top-up
            </Button>
            <Button variant="outline" onClick={() => setFeedbackOpen(true)} className="flex-1">
              <MessageSquareHeart className="h-4 w-4" /> Record Feedback
            </Button>
          </div>

          <Tabs defaultValue="transactions" className="mt-5">
            <TabsList className="w-full">
              <TabsTrigger value="transactions" className="flex-1">Transactions</TabsTrigger>
              <TabsTrigger value="loyalty" className="flex-1">Loyalty</TabsTrigger>
              <TabsTrigger value="feedback" className="flex-1">Feedback</TabsTrigger>
            </TabsList>

            <TabsContent value="transactions" className="mt-3 space-y-2">
              {transactions.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">No transactions yet.</p>
              )}
              {transactions.map(t => {
                const meta = TXN_META[t.type];
                const Icon = meta.icon;
                return (
                  <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40">
                    <div className={cn('h-8 w-8 rounded-full bg-card flex items-center justify-center', meta.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{meta.label}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{t.note || '—'} · {formatDateTime(t.timestamp)}</p>
                    </div>
                    <div className="text-right">
                      {t.amount !== 0 && (
                        <p className={cn('text-sm font-mono font-semibold tabular-nums', t.amount > 0 ? 'text-success' : 'text-destructive')}>
                          {t.amount > 0 ? '+' : ''}RM {Math.abs(t.amount).toFixed(2)}
                        </p>
                      )}
                      {t.pointsDelta !== undefined && t.pointsDelta !== 0 && (
                        <p className="text-[10px] text-warning">
                          {t.pointsDelta > 0 ? '+' : ''}{t.pointsDelta} pts
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="loyalty" className="mt-3 space-y-4">
              <div className="rounded-xl border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-warning" />
                    <span className="font-semibold">{LOYALTY_TIERS[progress.tier].label} tier</span>
                  </div>
                  <span className="text-xs text-muted-foreground">×{LOYALTY_TIERS[progress.tier].multiplier} pts/RM</span>
                </div>
                {progress.next ? (
                  <>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${progress.pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {progress.toNext.toLocaleString()} points to {LOYALTY_TIERS[progress.next].label}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">You're at the top tier — earning maximum rewards.</p>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {(Object.keys(LOYALTY_TIERS) as Array<keyof typeof LOYALTY_TIERS>).map(k => (
                  <div key={k} className={cn(
                    'rounded-lg border p-2',
                    progress.tier === k && 'border-primary bg-primary/5',
                  )}>
                    <p className="text-xs font-semibold">{LOYALTY_TIERS[k].label}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {LOYALTY_TIERS[k].min.toLocaleString()}{LOYALTY_TIERS[k].max === Infinity ? '+' : `–${LOYALTY_TIERS[k].max.toLocaleString()}`}
                    </p>
                    <p className="text-[10px] text-primary mt-1">×{LOYALTY_TIERS[k].multiplier}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="feedback" className="mt-3 space-y-2">
              {feedback.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">No feedback yet.</p>
              )}
              {feedback.map(f => (
                <div key={f.id} className="rounded-lg bg-muted/40 p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(n => (
                        <Star
                          key={n}
                          className={cn('h-3.5 w-3.5', n <= f.rating ? 'fill-warning text-warning' : 'text-muted-foreground/30')}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{formatDateTime(f.timestamp)}</span>
                  </div>
                  {f.chips.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {f.chips.map(c => (
                        <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-card border">{c}</span>
                      ))}
                    </div>
                  )}
                  {f.comment && <p className="text-xs italic text-muted-foreground">"{f.comment}"</p>}
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      <TopUpDialog
        open={topUpOpen}
        onOpenChange={setTopUpOpen}
        walletId={wallet.id}
        customerName={wallet.name}
        currentBalance={wallet.balance}
      />
      <FeedbackDialog
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        walletId={wallet.id}
        customerName={wallet.name}
        branchId={wallet.branchId}
      />
    </>
  );
}

export default WalletDetailDrawer;
