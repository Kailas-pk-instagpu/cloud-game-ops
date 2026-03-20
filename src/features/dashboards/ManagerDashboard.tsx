import { useState } from 'react';
import { MOCK_SEATS, REVENUE_DATA } from '@/shared/lib/mock-data';
import { Seat } from '@/shared/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Monitor, Users, Clock, RotateCcw, UserCheck, UserMinus } from 'lucide-react';
import { StatCard } from '@/shared/ui/molecules/StatCard';
import { cn } from '@/lib/utils';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ManagerDashboard() {
  const [seats, setSeats] = useState<Seat[]>(MOCK_SEATS);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [dialogMode, setDialogMode] = useState<'checkin' | 'checkout' | 'restart' | null>(null);
  const [playerName, setPlayerName] = useState('');

  const occupied = seats.filter(s => s.status === 'occupied').length;
  const available = seats.filter(s => s.status === 'available').length;
  const maintenance = seats.filter(s => s.status === 'maintenance').length;
  const todayEarnings = REVENUE_DATA[5].revenue;

  const handleSeatClick = (seat: Seat) => {
    setSelectedSeat(seat);
    if (seat.status === 'available') setDialogMode('checkin');
    else if (seat.status === 'occupied') setDialogMode('checkout');
    else setDialogMode('restart');
  };

  const handleCheckIn = () => {
    if (!selectedSeat || !playerName.trim()) return;
    setSeats(prev => prev.map(s =>
      s.id === selectedSeat.id ? { ...s, status: 'occupied' as const, playerName: playerName.trim(), startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } : s
    ));
    closeDialog();
  };

  const handleCheckOut = () => {
    if (!selectedSeat) return;
    setSeats(prev => prev.map(s =>
      s.id === selectedSeat.id ? { ...s, status: 'available' as const, playerName: undefined, startTime: undefined } : s
    ));
    closeDialog();
  };

  const handleRestart = () => {
    if (!selectedSeat) return;
    setSeats(prev => prev.map(s =>
      s.id === selectedSeat.id ? { ...s, status: 'available' as const } : s
    ));
    closeDialog();
  };

  const closeDialog = () => {
    setSelectedSeat(null);
    setDialogMode(null);
    setPlayerName('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">🎮 Floor Manager</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage players and seats at Downtown Hub</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Today's Earnings" value={`$${todayEarnings}`} icon={DollarSign} iconClassName="bg-success/10 text-success" />
        <StatCard title="Occupied" value={occupied} subtitle={`of ${seats.length} seats`} icon={Users} iconClassName="bg-destructive/10 text-destructive" />
        <StatCard title="Available" value={available} icon={Monitor} iconClassName="bg-success/10 text-success" />
        <StatCard title="Maintenance" value={maintenance} icon={Clock} iconClassName="bg-warning/10 text-warning" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base font-semibold">Seat Map — Tap a seat to manage</CardTitle>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-success" /> Available</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-destructive" /> Occupied</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-warning" /> Maintenance</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-5 lg:grid-cols-10 gap-2">
            {seats.map(seat => (
              <button
                key={seat.id}
                onClick={() => handleSeatClick(seat)}
                className={cn(
                  'aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-all hover:scale-105 active:scale-95 border-2',
                  seat.status === 'available' && 'bg-success/10 border-success/30 text-success hover:bg-success/20',
                  seat.status === 'occupied' && 'bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20',
                  seat.status === 'maintenance' && 'bg-warning/10 border-warning/30 text-warning hover:bg-warning/20',
                )}
              >
                <Monitor className="h-4 w-4" />
                <span className="font-bold">{seat.number}</span>
                {seat.playerName && (
                  <span className="text-[10px] truncate max-w-full px-1">{seat.playerName}</span>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogMode !== null} onOpenChange={() => closeDialog()}>
        <DialogContent className="sm:max-w-md">
          {dialogMode === 'checkin' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-success" />
                  Check In Player — Seat {selectedSeat?.number}
                </DialogTitle>
                <DialogDescription>Assign a player to this seat to start their session</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="space-y-2">
                  <Label>Player Name</Label>
                  <Input
                    placeholder="Enter player's name"
                    value={playerName}
                    onChange={e => setPlayerName(e.target.value)}
                    autoFocus
                  />
                </div>
                <p className="text-xs text-muted-foreground">GPU: {selectedSeat?.gpuModel}</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                <Button onClick={handleCheckIn} disabled={!playerName.trim()} className="bg-success text-success-foreground hover:bg-success/90">
                  Check In
                </Button>
              </DialogFooter>
            </>
          )}

          {dialogMode === 'checkout' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserMinus className="h-5 w-5 text-destructive" />
                  Check Out — Seat {selectedSeat?.number}
                </DialogTitle>
                <DialogDescription>End the session for {selectedSeat?.playerName}</DialogDescription>
              </DialogHeader>
              <div className="py-2 space-y-2">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm"><strong>Player:</strong> {selectedSeat?.playerName}</p>
                  <p className="text-sm"><strong>Started:</strong> {selectedSeat?.startTime}</p>
                  <p className="text-sm"><strong>GPU:</strong> {selectedSeat?.gpuModel}</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                <Button onClick={handleCheckOut} variant="destructive">End Session</Button>
              </DialogFooter>
            </>
          )}

          {dialogMode === 'restart' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <RotateCcw className="h-5 w-5 text-warning" />
                  Restart Seat {selectedSeat?.number}
                </DialogTitle>
                <DialogDescription>This will clear the maintenance status and make the seat available</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                <Button onClick={handleRestart} className="bg-warning text-warning-foreground hover:bg-warning/90">Restart</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
