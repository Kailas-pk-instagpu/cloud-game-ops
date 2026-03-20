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
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {trend && (
              <p className={cn('text-xs font-medium', trend.positive ? 'text-success' : 'text-destructive')}>
                {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}% from last period
              </p>
            )}
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={cn('p-3 rounded-xl', iconClassName || 'bg-primary/10')}>
            <Icon className={cn('h-5 w-5', iconClassName ? '' : 'text-primary')} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
