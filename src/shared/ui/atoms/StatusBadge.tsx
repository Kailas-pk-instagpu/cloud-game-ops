import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
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
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn('capitalize font-medium', STATUS_STYLES[status] || '', className)}>
      <span className={cn(
        'w-1.5 h-1.5 rounded-full mr-1.5',
        status === 'online' || status === 'active' || status === 'available' ? 'bg-success' :
        status === 'occupied' ? 'bg-destructive' :
        status === 'warning' || status === 'maintenance' ? 'bg-warning' : 'bg-muted-foreground'
      )} />
      {status}
    </Badge>
  );
}
