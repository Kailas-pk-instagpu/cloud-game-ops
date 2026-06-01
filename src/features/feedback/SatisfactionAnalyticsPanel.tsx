import { useFeedbackStore } from '@/shared/lib/store';
import { useBranchStore } from '@/shared/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, MessageSquareHeart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function SatisfactionAnalyticsPanel() {
  const feedback = useFeedbackStore(s => s.feedback);
  const branches = useBranchStore(s => s.branches);

  const branchData = branches.map(b => {
    const list = feedback.filter(f => f.branchId === b.id);
    const avg = list.length ? list.reduce((s, f) => s + f.rating, 0) / list.length : 0;
    return { name: b.name.split(' ').slice(0, 2).join(' '), avg: Math.round(avg * 10) / 10, count: list.length };
  });

  // Top chips across all feedback
  const chipCounts = new Map<string, number>();
  feedback.forEach(f => f.chips.forEach(c => chipCounts.set(c, (chipCounts.get(c) || 0) + 1)));
  const topChips = Array.from(chipCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const overall = feedback.length
    ? Math.round((feedback.reduce((s, f) => s + f.rating, 0) / feedback.length) * 10) / 10
    : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquareHeart className="h-4 w-4 text-primary" /> Customer Satisfaction
            </CardTitle>
            <CardDescription className="text-xs">Average rating per branch · {feedback.length} reviews</CardDescription>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end">
              <Star className="h-5 w-5 fill-warning text-warning" />
              <span className="text-2xl font-bold tabular-nums">{overall.toFixed(1)}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">overall</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={branchData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <YAxis domain={[0, 5]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }}
                  formatter={(v: number, name: string) => [name === 'avg' ? `${v} stars` : `${v} reviews`, name === 'avg' ? 'Avg rating' : 'Reviews']}
                />
                <Bar dataKey="avg" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} name="avg" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Most cited</p>
            {topChips.length === 0 && (
              <p className="text-xs text-muted-foreground">No feedback yet.</p>
            )}
            {topChips.map(([chip, count]) => (
              <div key={chip} className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                <span className="text-xs font-medium">{chip}</span>
                <span className="text-xs font-mono text-muted-foreground">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default SatisfactionAnalyticsPanel;
