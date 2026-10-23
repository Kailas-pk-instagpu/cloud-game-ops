import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  /** Optional display text override (e.g. "Disabled (Pending)"). */
  label?: string;
  className?: string;
}

const STATUS_STYLES: Record<string, string> = {
  online: 'bg-success/10 text-success border-success/20',
  active: 'bg-success/10 text-success border-success/20',
  available: 'bg-success/10 text-success border-success/20',
  occupied: 'bg-destructive/10 text-destructive border-destructive/20',
  offline: 'bg-muted text-muted-foreground border-muted',
  inactive: 'bg-muted text-muted-foreground border-muted',
  maintenance: 'bg-warning/10 text-warning border-warning/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  pending: 'bg-warning/10 text-warning border-warning/20',
  overloaded: 'bg-destructive/10 text-destructive border-destructive/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  healthy: 'bg-success/10 text-success border-success/20',
  degraded: 'bg-warning/10 text-warning border-warning/20',
  critical: 'bg-destructive/10 text-destructive border-destructive/20',
};

const DOT_STYLES: Record<string, string> = {
  online: 'bg-success',
  active: 'bg-success',
  available: 'bg-success',
  healthy: 'bg-success',
  occupied: 'bg-destructive',
  overloaded: 'bg-destructive',
  critical: 'bg-destructive',
  rejected: 'bg-destructive',
  warning: 'bg-warning',
  maintenance: 'bg-warning',
  degraded: 'bg-warning',
  pending: 'bg-warning',
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn('capitalize font-medium', STATUS_STYLES[status] || '', className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', DOT_STYLES[status] || 'bg-muted-foreground')} />
      {label ?? status}
    </Badge>
  );
}
