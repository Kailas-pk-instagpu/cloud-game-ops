import { useWalletStore } from '@/shared/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import { LoyaltyTierBadge } from './LoyaltyTierBadge';

export function LoyaltyLeaderboard({ branchId }: { branchId: string }) {
  const wallets = useWalletStore(s => s.getByBranch(branchId))
    .slice()
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Trophy className="h-4 w-4 text-warning" /> Loyalty Leaders
        </CardTitle>
        <CardDescription>Top customers by points</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-1.5">
        {wallets.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">No customers yet.</p>
        )}
        {wallets.map((w, i) => (
          <div key={w.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/40">
            <span className="text-xs font-mono font-semibold text-muted-foreground w-5">#{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{w.name}</p>
              <p className="text-[10px] text-muted-foreground">{w.points.toLocaleString()} pts</p>
            </div>
            <LoyaltyTierBadge points={w.points} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default LoyaltyLeaderboard;
