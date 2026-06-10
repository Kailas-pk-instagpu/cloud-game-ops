import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, AlertTriangle, Wallet, MonitorPlay } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BillingStatus = 'operational' | 'delayed' | 'issue';

const SEVERITY: Record<BillingStatus, number> = { operational: 0, delayed: 1, issue: 2 };

const STATUS_META: Record<
  BillingStatus,
  { label: string; dot: string; chip: string; ring: string; icon: typeof CheckCircle2 }
> = {
  operational: {
    label: 'Operational',
    dot: 'bg-success',
    chip: 'bg-success/10 text-success border-success/20',
    ring: 'ring-success/20',
    icon: CheckCircle2,
  },
  delayed: {
    label: 'Delayed',
    dot: 'bg-warning',
    chip: 'bg-warning/10 text-warning border-warning/20',
    ring: 'ring-warning/20',
    icon: Clock,
  },
  issue: {
    label: 'Issue',
    dot: 'bg-destructive',
    chip: 'bg-destructive/10 text-destructive border-destructive/20',
    ring: 'ring-destructive/20',
    icon: AlertTriangle,
  },
};

const MESSAGES: Record<'billing' | 'horizon', Record<BillingStatus, string>> = {
  billing: {
    operational: 'Billing is running smoothly.',
    delayed: 'Billing is experiencing delays. Sessions will continue normally.',
    issue: 'Billing service is temporarily unavailable. Sessions will continue normally.',
  },
  horizon: {
    operational: 'Horizon sessions are streaming smoothly.',
    delayed: 'Horizon is experiencing minor delays. Sessions remain available.',
    issue: 'Horizon connection issue detected. New sessions may be affected.',
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

interface BillingStatusBannerProps {
  status?: BillingStatus;
  horizonStatus?: BillingStatus;
  className?: string;
}

export function BillingStatusBanner({ status: override, horizonStatus: horizonOverride, className }: BillingStatusBannerProps) {
  const liveBilling = useSystemStatus(0);
  const liveHorizon = useSystemStatus(3000);
  const billing = override ?? liveBilling;
  const horizon = horizonOverride ?? liveHorizon;

  // Overall status = worst of the two
  const overall: BillingStatus = SEVERITY[billing] >= SEVERITY[horizon] ? billing : horizon;
  const meta = STATUS_META[overall];
  const Icon = meta.icon;

  const systems = [
    { key: 'billing' as const, label: 'Billing', icon: Wallet, status: billing },
    { key: 'horizon' as const, label: 'Horizon', icon: MonitorPlay, status: horizon },
  ];

  // Compact pill when everything is operational
  if (overall === 'operational') {
    return (
      <div
        role="status"
        aria-label="System status"
        className={cn(
          'inline-flex items-center gap-3 rounded-full border px-3 py-1.5 text-xs',
          meta.chip,
          className,
        )}
      >
        <span className="inline-flex items-center gap-1.5 font-medium">
          <Icon className="h-3.5 w-3.5" />
          All systems operational
        </span>
        <span className="h-3 w-px bg-current/30" />
        <div className="flex items-center gap-3">
          {systems.map(s => (
            <span key={s.key} className="inline-flex items-center gap-1.5">
              <s.icon className="h-3 w-3 opacity-80" />
              <span className="opacity-90">{s.label}</span>
              <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_META[s.status].dot)} />
            </span>
          ))}
        </div>
      </div>
    );
  }

  // Expanded card when any system is degraded
  return (
    <div
      role="status"
      aria-label="System status"
      className={cn(
        'flex flex-col gap-3 rounded-lg border bg-card px-4 py-3 ring-1 sm:flex-row sm:items-center',
        meta.ring,
        className,
      )}
    >
      <div className="flex items-start gap-3 sm:flex-1 min-w-0">
        <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', meta.chip)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium', meta.chip)}>
              {meta.label}
            </span>
            <span className="text-xs text-muted-foreground">System status</span>
          </div>
          <p className="text-sm text-foreground/90 mt-1 leading-snug">
            {systems
              .filter(s => s.status !== 'operational')
              .map(s => MESSAGES[s.key][s.status])
              .join(' ')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:ml-2 sm:shrink-0">
        {systems.map(s => {
          const sMeta = STATUS_META[s.status];
          return (
            <span
              key={s.key}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium',
                sMeta.chip,
              )}
              title={`${s.label}: ${sMeta.label}`}
            >
              <s.icon className="h-3 w-3" />
              {s.label}
              <span className={cn('h-1.5 w-1.5 rounded-full', sMeta.dot)} />
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default BillingStatusBanner;
