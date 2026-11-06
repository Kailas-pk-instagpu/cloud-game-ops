import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SeatGrid, SeatLegend, SEAT_STATUS_LABEL } from './SeatGrid';
import { seatsApi, seatTitle, type ApiSeat } from './seatsApi';

/**
 * Seat Management on the backend (seats.operate.view; a Floor Manager sees their own cafes). P1-4 step 1 shows the live seat grid with
 * each seat's status; check-in and ending a session come with sessions (step 4). Reloads every 15 s so seats leaving "setting up" show.
 */
export default function BackendSeatManagement() {
  const [seats, setSeats] = useState<ApiSeat[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stop = false;
    const load = () => seatsApi.operate().then(s => { if (!stop) { setSeats(s); setError(null); } }).catch(e => { if (!stop) setError(e instanceof Error ? e.message : 'Could not load the seats.'); });
    void load();
    const t = setInterval(load, 15_000);
    return () => { stop = true; clearInterval(t); };
  }, []);

  const byCafe = useMemo(() => {
    const m = new Map<string, { name: string; seats: ApiSeat[] }>();
    for (const s of seats ?? []) {
      const e = m.get(s.cafe_id) ?? { name: s.cafe_name, seats: [] };
      e.seats.push(s);
      m.set(s.cafe_id, e);
    }
    return [...m.values()];
  }, [seats]);

  const pick = (s: ApiSeat) => {
    if (s.status === 'available') toast.info(`${seatTitle(s)} is available. Starting a session comes in the next step (sessions).`);
    else toast.info(`${seatTitle(s)}: ${SEAT_STATUS_LABEL[s.status]}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Seat Management</h1>
        <p className="text-muted-foreground text-sm mt-1">Seats at {byCafe.length === 1 ? byCafe[0].name : 'your cafes'}</p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!seats && !error && <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}
      {seats && seats.length === 0 && <p className="text-sm text-muted-foreground">No seats yet.</p>}
      {byCafe.map(c => (
        <Card key={c.name}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">{c.name}</CardTitle>
            <CardDescription>Seats in “Setting up” are being connected to their thin client by InstaGPU.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SeatLegend seats={c.seats} />
            <SeatGrid seats={c.seats} onSelect={pick} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
