import { useFeedbackStore } from '@/shared/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, MessageSquareHeart } from 'lucide-react';
import { cn } from '@/lib/utils';

function formatRelative(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function RecentFeedbackWidget({ branchId }: { branchId: string }) {
  const list = useFeedbackStore(s => s.getByBranch(branchId)).slice(0, 5);
  const avg = useFeedbackStore(s => s.getAverageRating(branchId));

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MessageSquareHeart className="h-4 w-4 text-primary" /> Recent Feedback
            </CardTitle>
            <CardDescription>Latest customer ratings</CardDescription>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end">
              <Star className="h-4 w-4 fill-warning text-warning" />
              <span className="text-lg font-bold tabular-nums">{avg.toFixed(1)}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">avg</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-2">
        {list.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">No feedback yet.</p>
        )}
        {list.map((f) => (
          <div key={f.id} className="rounded-lg bg-muted/40 p-2.5 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium truncate">{f.customerName}</span>
              <div className="flex items-center gap-0.5 shrink-0">
                {[1, 2, 3, 4, 5].map(n => (
                  <Star
                    key={n}
                    className={cn(
                      'h-3 w-3',
                      n <= f.rating ? 'fill-warning text-warning' : 'text-muted-foreground/30',
                    )}
                  />
                ))}
              </div>
            </div>
            {f.comment && <p className="text-xs text-muted-foreground italic">"{f.comment}"</p>}
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{f.chips.slice(0, 2).join(' · ') || '—'}</span>
              <span>{formatRelative(f.timestamp)}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default RecentFeedbackWidget;
