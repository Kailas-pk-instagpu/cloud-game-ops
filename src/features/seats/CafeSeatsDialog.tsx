import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Cafe } from '@/shared/lib/mock-data';
import { SeatGrid, SeatLegend, SEAT_STATUS_LABEL } from './SeatGrid';
import { seatsApi, seatTitle, SETUP_REASON, type ApiSeat, type GpuProfile } from './seatsApi';

const NO_GPU = '__none__';

/**
 * Backend mode: a cafe's seats (Cafes page). Everyone with seats.config.view sees the grid; seats.config.edit (owner, Super Admin)
 * renames a seat and turns maintenance on / off; seats.setup (Super Admin) links a seat to its thin client: hostname, Horizon login,
 * GPU profile. Hostname and login never reach cafe owners (the API leaves them out).
 */
export default function CafeSeatsDialog({ cafe, onClose, canEdit, canSetup }: { cafe: Cafe | null; onClose: () => void; canEdit: boolean; canSetup: boolean }) {
  const [seats, setSeats] = useState<ApiSeat[] | null>(null);
  const [gpus, setGpus] = useState<GpuProfile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ApiSeat | null>(null);
  const [form, setForm] = useState({ label: '', maintenance: false, hostname: '', login: '', gpu: NO_GPU });
  const [saving, setSaving] = useState(false);

  const load = async (id: string) => {
    try {
      const r = await seatsApi.forCafe(id);
      setSeats(r.seats);
      setGpus(r.gpu_profiles);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the seats.');
    }
  };

  useEffect(() => {
    setSeats(null);
    setEditing(null);
    if (cafe) void load(cafe.id);
  }, [cafe]);

  const open = (s: ApiSeat) => {
    setEditing(s);
    setForm({ label: s.label ?? '', maintenance: s.status === 'maintenance', hostname: s.hostname ?? '', login: s.horizon_login ?? '', gpu: s.gpu_profile ?? NO_GPU });
  };

  const save = async () => {
    if (!editing || !cafe) return;
    setSaving(true);
    try {
      if (canSetup) {
        const setup: { hostname?: string | null; horizon_login?: string | null; gpu_profile?: string | null } = {};
        if ((editing.hostname ?? '') !== form.hostname.trim()) setup.hostname = form.hostname.trim() || null;
        if ((editing.horizon_login ?? '') !== form.login.trim().toLowerCase()) setup.horizon_login = form.login.trim() || null;
        const gpu = form.gpu === NO_GPU ? null : form.gpu;
        if ((editing.gpu_profile ?? null) !== gpu) setup.gpu_profile = gpu;
        if (Object.keys(setup).length) await seatsApi.setup(editing.id, setup);
      }
      if (canEdit) {
        const edit: { label?: string | null; maintenance?: boolean } = {};
        if ((editing.label ?? '') !== form.label.trim()) edit.label = form.label.trim() || null;
        if ((editing.status === 'maintenance') !== form.maintenance) edit.maintenance = form.maintenance;
        if (Object.keys(edit).length) await seatsApi.edit(editing.id, edit);
      }
      toast.success(`${seatTitle(editing)} saved`);
      setEditing(null);
      await load(cafe.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save the seat.');
    } finally {
      setSaving(false);
    }
  };

  const settingUp = seats?.filter(s => s.status === 'setting_up').length ?? 0;
  const clickable = canEdit || canSetup;

  return (
    <Dialog open={!!cafe} onOpenChange={o => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{cafe?.name}: Seats</DialogTitle>
          <DialogDescription>
            {clickable ? 'Click a seat to change it.' : 'Read-only view of this cafe’s seats.'}
            {settingUp > 0 && ` ${settingUp} seat${settingUp > 1 ? 's are' : ' is'} still being set up by InstaGPU.`}
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {!seats && !error && <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}
        {seats && seats.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">This cafe has no seats yet.</p>}
        {seats && seats.length > 0 && (
          <div className="space-y-4">
            <SeatLegend seats={seats} />
            <SeatGrid seats={seats} onSelect={clickable ? open : undefined} />
          </div>
        )}

        {editing && (
          <div className="mt-4 p-4 rounded-lg border space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{seatTitle(editing)} <span className="text-xs text-muted-foreground font-normal">({editing.code} · {SEAT_STATUS_LABEL[editing.status]})</span></p>
              {editing.gpu_name && !canSetup && <span className="text-xs text-muted-foreground">GPU: {editing.gpu_name}</span>}
            </div>
            {canEdit && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="seat-label">Seat name</Label>
                  <Input id="seat-label" maxLength={40} placeholder={`Seat ${editing.number}`} value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
                </div>
                <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">Maintenance</p>
                    <p className="text-xs text-muted-foreground">Takes the seat out of use</p>
                  </div>
                  <Switch
                    checked={form.maintenance}
                    disabled={editing.status === 'setting_up' || editing.status === 'occupied'}
                    onCheckedChange={v => setForm(f => ({ ...f, maintenance: v }))}
                  />
                </div>
              </div>
            )}
            {canSetup && (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Thin client and Horizon (InstaGPU only)</p>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="seat-host">Thin client hostname</Label>
                    <Input id="seat-host" placeholder="e.g. IGTC-KLGA-DH-01" value={form.hostname} onChange={e => setForm(f => ({ ...f, hostname: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="seat-login">Horizon login</Label>
                    <Input id="seat-login" placeholder="AD login, no domain" value={form.login} onChange={e => setForm(f => ({ ...f, login: e.target.value }))} />
                  </div>
                  <div>
                    <Label>GPU profile</Label>
                    <Select value={form.gpu} onValueChange={v => setForm(f => ({ ...f, gpu: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_GPU}>Not set</SelectItem>
                        {gpus.map(g => <SelectItem key={g.code} value={g.code}>{g.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {editing.setup_reason && (
                  <p className={`text-xs ${editing.setup_reason === 'login_not_in_ad' ? 'text-destructive' : 'text-muted-foreground'}`}>{SETUP_REASON[editing.setup_reason]}</p>
                )}
                {editing.horizon?.state && !editing.setup_reason && (
                  <p className="text-xs text-warning">Horizon shows this login signed in ({editing.horizon.state.toLowerCase()}) without a check-in.</p>
                )}
                <p className="text-xs text-muted-foreground">A seat leaves “Setting up” when it has a hostname and a Horizon login, and Horizon finds that login in Active Directory.</p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button className="gradient-primary text-primary-foreground" disabled={saving} onClick={() => void save()}>{saving ? 'Saving…' : 'Save'}</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
