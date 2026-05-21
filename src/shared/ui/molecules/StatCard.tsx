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
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardContent className="p-4 sm:p-5 lg:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate">{title}</p>
            <p className="text-xl sm:text-2xl font-bold tracking-tight truncate">{value}</p>
            {trend && (
              <p className={cn('text-[11px] sm:text-xs font-medium', trend.positive ? 'text-success' : 'text-destructive')}>
                {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}% from last period
              </p>
            )}
            {subtitle && <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{subtitle}</p>}
          </div>
          <div className={cn('p-2 sm:p-2.5 lg:p-3 rounded-xl shrink-0 flex items-center justify-center', iconClassName || 'bg-primary/10')}>
            <Icon className={cn('h-4 w-4 sm:h-5 sm:w-5', iconClassName ? '' : 'text-primary')} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
