import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, AlertTriangle, Wallet, MonitorPlay } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BillingStatus = 'operational' | 'delayed' | 'issue';

const STATUS_META: Record<
  BillingStatus,
  { label: string; message: string; horizonMessage: string; icon: typeof CheckCircle2; chip: string; ring: string }
> = {
  operational: {
    label: 'Operational',
    message: 'Billing system is running smoothly.',
    horizonMessage: 'Horizon sessions are streaming smoothly.',
    icon: CheckCircle2,
    chip: 'bg-success/10 text-success border-success/20',
    ring: 'ring-success/20',
  },
  delayed: {
    label: 'Delayed',
    message: 'Billing system is experiencing delays. Sessions will continue normally.',
    horizonMessage: 'Horizon is experiencing minor delays. Sessions remain available.',
    icon: Clock,
    chip: 'bg-warning/10 text-warning border-warning/20',
    ring: 'ring-warning/20',
  },
  issue: {
    label: 'Issue',
    message: 'Billing service is temporarily unavailable. Sessions will continue normally.',
    horizonMessage: 'Horizon connection issue detected. New sessions may be affected.',
    icon: AlertTriangle,
    chip: 'bg-destructive/10 text-destructive border-destructive/20',
    ring: 'ring-destructive/20',
  },
};

function useSystemStatus(seed: number): BillingStatus {
  const [status, setStatus] = useState<BillingStatus>('operational');
  useEffect(() => {
    const pick = (): BillingStatus => {
      const r = Math.random();
      if (r < 0.8) return 'operational';
      if (r < 0.95) return 'delayed';
      return 'issue';
    };
    const id = setInterval(() => setStatus(pick()), 20000 + seed);
    return () => clearInterval(id);
  }, [seed]);
  return status;
}

interface SystemRowProps {
  status: BillingStatus;
  systemLabel: string;
  message: string;
  SystemIcon: typeof Wallet;
}

function SystemRow({ status, systemLabel, message, SystemIcon }: SystemRowProps) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;

  if (status === 'operational') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs',
          meta.chip,
        )}
        role="status"
        aria-label={`${systemLabel} status`}
      >
        <SystemIcon className="h-3.5 w-3.5" />
        <span className="font-medium">{systemLabel}: {meta.label}</span>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label={`${systemLabel} status`}
      className={cn('flex items-start gap-3 rounded-lg border bg-card px-4 py-3 ring-1', meta.ring)}
    >
      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', meta.chip)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium', meta.chip)}>
            {meta.label}
          </span>
          <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <SystemIcon className="h-3 w-3" />
            {systemLabel} status
          </span>
        </div>
        <p className="text-sm text-foreground/90 mt-1 leading-snug">{message}</p>
      </div>
    </div>
  );
}

interface BillingStatusBannerProps {
  /** Override the live billing status (useful for testing). */
  status?: BillingStatus;
  /** Override the live Horizon status (useful for testing). */
  horizonStatus?: BillingStatus;
  className?: string;
}

export function BillingStatusBanner({ status: override, horizonStatus: horizonOverride, className }: BillingStatusBannerProps) {
  const liveBilling = useSystemStatus(0);
  const liveHorizon = useSystemStatus(3000);
  const billing = override ?? liveBilling;
  const horizon = horizonOverride ?? liveHorizon;

  const bothOperational = billing === 'operational' && horizon === 'operational';

  return (
    <div
      className={cn(
        bothOperational ? 'flex flex-wrap items-center gap-2' : 'flex flex-col gap-2',
        className,
      )}
    >
      <SystemRow status={billing} systemLabel="Billing system" message={STATUS_META[billing].message} SystemIcon={Wallet} />
      <SystemRow status={horizon} systemLabel="VMware Horizon" message={STATUS_META[horizon].horizonMessage} SystemIcon={MonitorPlay} />
    </div>
  );
}

export default BillingStatusBanner;
