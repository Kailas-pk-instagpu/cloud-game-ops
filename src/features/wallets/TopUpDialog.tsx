import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Wallet, Plus } from 'lucide-react';
import { useWalletStore } from '@/shared/lib/store';
import { toast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletId: string;
  customerName: string;
  currentBalance: number;
}

const QUICK_AMOUNTS = [50, 100, 200, 500];

export function TopUpDialog({ open, onOpenChange, walletId, customerName, currentBalance }: Props) {
  const [amount, setAmount] = useState<string>('');
  const topUp = useWalletStore(s => s.topUp);

  function submit() {
    const num = Number(amount);
    if (!num || num <= 0) {
      toast({ title: 'Invalid amount', description: 'Enter a positive amount.', variant: 'destructive' });
      return;
    }
    topUp(walletId, num);
    toast({ title: 'Top-up successful', description: `Added RM ${num.toFixed(2)} to ${customerName}.` });
    setAmount('');
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" /> Top-up Wallet
          </DialogTitle>
          <DialogDescription>
            {customerName} · Current balance: <strong>RM {currentBalance.toFixed(2)}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div>
            <Label htmlFor="amount">Amount (RM)</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="mt-1.5"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_AMOUNTS.map(q => (
              <button
                key={q}
                type="button"
                onClick={() => setAmount(String(q))}
                className="text-xs px-3 py-1 rounded-full border border-border hover:bg-muted transition-colors"
              >
                RM {q}
              </button>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>
            <Plus className="h-4 w-4" /> Top-up
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TopUpDialog;
