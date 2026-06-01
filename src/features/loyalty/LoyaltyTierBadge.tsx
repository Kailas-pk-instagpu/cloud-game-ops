import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoyaltyTier, LOYALTY_TIERS, tierFromPoints } from '@/shared/lib/mock-data';

const TIER_CLASSES: Record<LoyaltyTier, string> = {
  bronze: 'bg-muted text-muted-foreground border-border',
  silver: 'bg-primary/10 text-primary border-primary/30',
  gold:   'bg-warning/15 text-warning border-warning/40',
};

interface Props {
  points?: number;
  tier?: LoyaltyTier;
  showPoints?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function LoyaltyTierBadge({ points, tier, showPoints = false, size = 'sm', className }: Props) {
  const resolved: LoyaltyTier = tier ?? tierFromPoints(points ?? 0);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        TIER_CLASSES[resolved],
        className,
      )}
    >
      <Trophy className={cn(size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
      {LOYALTY_TIERS[resolved].label}
      {showPoints && points !== undefined && (
        <span className="opacity-75">· {points.toLocaleString()} pts</span>
      )}
    </span>
  );
}

export default LoyaltyTierBadge;
