import { Loader2, Monitor, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ApiSeat, SeatStatus } from './seatsApi';

export const SEAT_STATUS_LABEL: Record<SeatStatus, string> = {
  setting_up: 'Setting up',
  available: 'Available',
  occupied: 'Occupied',
  maintenance: 'Maintenance',
};

const STYLE: Record<SeatStatus, string> = {
  setting_up: 'bg-muted/60 border-muted-foreground/20 text-muted-foreground',
  available: 'bg-success/10 border-success/30 text-success hover:bg-success/20',
  occupied: 'bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20',
  maintenance: 'bg-warning/10 border-warning/30 text-warning hover:bg-warning/20',
};

/** Counts per status, in the order the legend shows them. */
export function SeatLegend({ seats }: { seats: ApiSeat[] }) {
  const n = (s: SeatStatus) => seats.filter(x => x.status === s).length;
  const dot: Record<SeatStatus, string> = { available: 'bg-success', occupied: 'bg-destructive', maintenance: 'bg-warning', setting_up: 'bg-muted-foreground/40' };
  return (
    <div className="flex items-center gap-4 text-sm flex-wrap">
      {(['available', 'occupied', 'maintenance', 'setting_up'] as SeatStatus[]).map(s => (
        <span key={s} className="flex items-center gap-2"><span className={cn('w-3 h-3 rounded', dot[s])} /> {SEAT_STATUS_LABEL[s]}: <strong>{n(s)}</strong></span>
      ))}
      <span className="text-muted-foreground">Total: <strong>{seats.length}</strong></span>
    </div>
  );
}

/** The seat map. A seat still being set up shows a spinner until it is linked to its thin client. */
export function SeatGrid({ seats, onSelect }: { seats: ApiSeat[]; onSelect?: (s: ApiSeat) => void }) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-8 gap-2">
      {seats.map(seat => (
        <button
          key={seat.id}
          type="button"
          disabled={!onSelect}
          onClick={() => onSelect?.(seat)}
          title={`${seat.label || `Seat ${seat.number}`} · ${SEAT_STATUS_LABEL[seat.status]}${seat.gpu_name ? ` · ${seat.gpu_name}` : ''}`}
          className={cn(
            'aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-all border-2 relative',
            onSelect && 'hover:scale-105 active:scale-95',
            STYLE[seat.status],
          )}
        >
          {seat.status === 'setting_up' ? <Loader2 className="h-4 w-4 animate-spin" /> : seat.status === 'maintenance' ? <Wrench className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
          <span className="font-bold">{seat.number}</span>
          <span className="text-[10px] truncate max-w-full px-1">{seat.label || SEAT_STATUS_LABEL[seat.status]}</span>
        </button>
      ))}
    </div>
  );
}
