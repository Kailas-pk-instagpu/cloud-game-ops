import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
  className?: string;
  iconClassName?: string;
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, className, iconClassName }: StatCardProps) {
  return (
    <Card
      className={cn(
        'group relative overflow-hidden border-border/60 bg-card/80 backdrop-blur-sm',
        'transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
        'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.35)]',
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
      <CardContent className="relative p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div
            className={cn(
              'p-2 sm:p-2.5 rounded-xl shrink-0 flex items-center justify-center ring-1 ring-inset ring-border/40',
              iconClassName || 'bg-primary/10 text-primary'
            )}
          >
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          {trend && (
            <span
              className={cn(
                'text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap',
                trend.positive
                  ? 'bg-success/10 text-success'
                  : 'bg-destructive/10 text-destructive'
              )}
            >
              {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
          )}
        </div>

        <div className="space-y-1 min-w-0">
          <p className="text-[11px] sm:text-xs uppercase tracking-wide text-muted-foreground font-medium leading-tight">
            {title}
          </p>
          <p className="text-xl sm:text-2xl lg:text-[1.6rem] font-bold tracking-tight leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
            {value}
          </p>
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight truncate">
              {subtitle}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
