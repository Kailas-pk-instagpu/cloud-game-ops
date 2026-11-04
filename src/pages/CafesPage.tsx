import { useState, useMemo, useEffect, Dispatch, SetStateAction } from 'react';
import { useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCafeStore, useAuthStore, useSeatStore } from '@/shared/lib/store';
import { useCan } from '@/shared/lib/permissions';
import { useApprovalStore, toProposal } from '@/features/approvals/approvalService';
import { PendingChangesCompare } from '@/features/approvals/PendingChangesCompare';
import { CafeEditProposal } from '@/shared/lib/mock-data';
import { useSeatActivityStore } from '@/shared/lib/seatActivityStore';
import { ROLE_LABELS } from '@/shared/types/auth';
import { MOCK_USERS, GPU_MODEL_OPTIONS } from '@/shared/lib/mock-data';
import { Cafe, Seat } from '@/shared/lib/mock-data';
import { getScopedCafes, getCafesForUser } from '@/shared/lib/cafeScope';
import { StatusBadge } from '@/shared/ui/atoms/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Building2, MapPin, Monitor, Plus, Settings, Edit, Trash2, UserCheck, Armchair, Shield, User, Users, LayoutGrid, Cpu, Clock, X, Pencil, Wrench, CheckCircle2, Search, AlertCircle, Send, GitCompareArrows } from 'lucide-react';
import { toast } from 'sonner';
import { Role } from '@/shared/types/auth';
import { cn } from '@/lib/utils';
import ShiftManagementDialog from '@/features/cafes/ShiftManagementDialog';
import { SHIFTS_ENABLED } from '@/shared/lib/featureFlags';
import { AUTH_MODE } from '@/shared/lib/bff';
import { useBackendCafes, changedFields, parseRinggit, formatRinggit, type OwnerAccount } from '@/features/cafes/cafesApi';

/**
 * Real backend (default): cafes, cafes and every action go to cafe-management-service (features/cafes/cafesApi.ts).
 * VITE_AUTH_MODE=mock keeps the demo stores. Team assignment (user management) and seat configuration are not connected yet,
 * so in backend mode the form asks only for what the API stores and the seat grid stays a demo feature.
 */
const BACKEND = AUTH_MODE === 'bff';

interface CafeForm {
  name: string;
  address: string;
  tenantId: string;
  totalSeats: number;
  adminId: string;
  cafeOwnerId: string;
  managerId: string;
  /** Backend: daily spend limit in RM ("" = no limit). */
  dailySpendLimit: string;
}

const emptyForm: CafeForm = { name: '', address: '', tenantId: '', totalSeats: 10, adminId: '', cafeOwnerId: '', managerId: '', dailySpendLimit: '' };

function getUsersByRole(role: Role) {
  return MOCK_USERS.filter(u => u.role === role);
}

function getUserName(id?: string) {
  if (!id) return null;
  return MOCK_USERS.find(u => u.id === id);
}

// Defined at module scope so typing in the form doesn't remount the inputs and steal focus.
interface CafeFormFieldsProps {
  isEdit: boolean;
  form: CafeForm;
  setForm: Dispatch<SetStateAction<CafeForm>>;
  selectedCafe: Cafe | null;
  assignableAdmins: typeof MOCK_USERS;
  assignableCafeOwners: typeof MOCK_USERS;
  assignableManagers: typeof MOCK_USERS;
  /** Backend mode: the owners the caller may add cafes for (create only). */
  owners?: OwnerAccount[];
}

function CafeFormFields({
  isEdit,
  form,
  setForm,
  selectedCafe,
  assignableAdmins,
  assignableCafeOwners,
  assignableManagers,
  owners = [],
}: CafeFormFieldsProps) {
  if (BACKEND) {
    return (
      <div className="space-y-3">
        {!isEdit && (
          <div>
            <Label>Owner *</Label>
            <Select value={form.tenantId} onValueChange={v => setForm(f => ({ ...f, tenantId: v }))}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Choose the owner this cafe belongs to" /></SelectTrigger>
              <SelectContent>
                {owners.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {owners.length === 0 && <p className="text-xs text-muted-foreground mt-1">No owner yet: onboard the cafe owner first.</p>}
          </div>
        )}
        <div>
          <Label htmlFor="name">Cafe Name *</Label>
          <Input id="name" placeholder="e.g. Downtown Gaming Hub" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <Label htmlFor="address">Address *</Label>
          <Input id="address" placeholder="e.g. 123 Main Street, City" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
        </div>
        <div>
          <Label htmlFor="spend-limit">Daily spend limit (RM)</Label>
          <Input id="spend-limit" inputMode="decimal" placeholder="No limit" value={form.dailySpendLimit} onChange={e => setForm(f => ({ ...f, dailySpendLimit: e.target.value }))} />
          <p className="text-xs text-muted-foreground mt-1">Alerts at 80% and 100% of this amount per day. Leave empty for no limit.</p>
        </div>
        <p className="text-xs text-muted-foreground">
          {isEdit && selectedCafe ? `${selectedCafe.totalSeats} seats. ` : ''}Seats and team assignments are set up separately.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-5">
      {/* Step 1: Basic Info */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Step 1 — Cafe Details
        </p>
        <div className="space-y-3">
          <div>
            <Label htmlFor="name">Cafe Name *</Label>
            <Input id="name" placeholder="e.g. Downtown Gaming Hub" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <p className="text-xs text-muted-foreground mt-1">Give your cafe a recognizable name</p>
          </div>
          <div>
            <Label htmlFor="address">Address *</Label>
            <Input id="address" placeholder="e.g. 123 Main Street, City" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
            <p className="text-xs text-muted-foreground mt-1">Full street address of the cafe</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Step 2: Seats */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Step 2 — Configure Seats
        </p>
        <div>
          <Label htmlFor="seats">Number of Seats</Label>
          <div className="flex items-center gap-3 mt-1">
            <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => setForm(f => ({ ...f, totalSeats: Math.max(1, f.totalSeats - 1) }))}>−</Button>
            <Input id="seats" type="number" min={1} className="w-24 text-center" value={form.totalSeats} onChange={e => setForm(f => ({ ...f, totalSeats: Math.max(1, parseInt(e.target.value) || 1) }))} />
            <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => setForm(f => ({ ...f, totalSeats: f.totalSeats + 1 }))}>+</Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isEdit && selectedCafe
              ? `Currently ${selectedCafe.activeSeats} seats are active out of ${selectedCafe.totalSeats}`
              : 'How many gaming stations does this cafe have?'}
          </p>
        </div>
      </div>

      <Separator />

      {/* Step 3: Assign Users */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Step 3 — Assign Team
        </p>
        <p className="text-xs text-muted-foreground mb-4">Assign users to manage and operate this cafe</p>
        <div className="space-y-4">
          {/* Sales Manager Assignment - only Super Admin can assign */}
          {assignableAdmins.length > 0 && (
            <div>
              <Label className="flex items-center gap-1.5 mb-1">
                <Shield className="h-3.5 w-3.5 text-destructive" /> Sales Manager
              </Label>
              <Select value={form.adminId} onValueChange={v => setForm(f => ({ ...f, adminId: v === 'none' ? '' : v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a sales manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No sales manager assigned</SelectItem>
                  {assignableAdmins.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} — {u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">Sales Manager will oversee this cafe's operations</p>
            </div>
          )}

          {/* Cafe Owner Assignment - Super Admin and Sales Manager can assign */}
          {assignableCafeOwners.length > 0 && (
            <div>
              <Label className="flex items-center gap-1.5 mb-1">
                <User className="h-3.5 w-3.5 text-primary" /> Cafe Owner
              </Label>
              <Select value={form.cafeOwnerId} onValueChange={v => setForm(f => ({ ...f, cafeOwnerId: v === 'none' ? '' : v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a cafe owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No cafe owner assigned</SelectItem>
                  {assignableCafeOwners.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} — {u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">Cafe owner will manage day-to-day operations</p>
            </div>
          )}

          {/* Floor Manager Assignment - Super Admin, Sales Manager, Cafe Owner can assign */}
          {assignableManagers.length > 0 && (
            <div>
              <Label className="flex items-center gap-1.5 mb-1">
                <UserCheck className="h-3.5 w-3.5 text-accent-foreground" /> Floor Manager
              </Label>
              <Select value={form.managerId} onValueChange={v => setForm(f => ({ ...f, managerId: v === 'none' ? '' : v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No manager assigned</SelectItem>
                  {assignableManagers.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} — {u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">Floor Manager will handle this specific cafe</p>
            </div>
          )}

          {assignableAdmins.length === 0 && assignableCafeOwners.length === 0 && assignableManagers.length === 0 && (
            <p className="text-sm text-muted-foreground italic">No users available for assignment at your permission level</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CafesPage() {
  const { cafes, addCafe, updateCafe, deleteCafe, toggleCafeStatus } = useCafeStore();
  const { seats, updateSeatStatus, updateSeat, provisionSeats, syncSeatCount, removeSeatsForCafe } = useSeatStore();
  const currentUser = useAuthStore(s => s.user);
  // What this person may do here (configurable permissions). A role that may only *request* changes (the Sales Manager by
  // default) goes through Super Admin approval for new cafes and for edits of a live cafe.
  const can = useCan();
  const canRequest = can('cafes.request');
  const canEditDirect = can('cafes.edit');
  const canEnable = can('cafes.enable');
  const canDisable = can('cafes.disable');
  const canMaintain = can('cafes.maintenance');
  const canDeleteCafe = can('cafes.delete');
  const canViewSeats = can('seats.config.view');
  const canEditSeats = can('seats.config.edit');
  const { submitNewCafe, submitEdit, resubmit } = useApprovalStore();
  const backend = useBackendCafes();
  useEffect(() => {
    if (BACKEND) void backend.load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const allCafes = BACKEND ? backend.cafes : cafes;
  const [busy, setBusy] = useState(false);
  /** Run a backend change: one at a time, toast on success, the API's message on failure. Returns whether it worked. */
  const run = async (action: () => Promise<void>, success: string) => {
    setBusy(true);
    try {
      await action();
      toast.success(success);
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong. Try again.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSeatGrid, setShowSeatGrid] = useState(false);
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [showCompareDialog, setShowCompareDialog] = useState(false);
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [form, setForm] = useState<CafeForm>(emptyForm);
  const [editingSeat, setEditingSeat] = useState<Seat | null>(null);
  const [seatForm, setSeatForm] = useState<{ label: string; gpuModel: string; status: Seat['status'] }>({ label: '', gpuModel: 'RTX 4070', status: 'available' });
  const [defaultGpu, setDefaultGpu] = useState<string>('RTX 4070');
  const [baselineGpu, setBaselineGpu] = useState<string>('RTX 4070');
  const [canSaveSeatConfig, setCanSaveSeatConfig] = useState(false);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const userRole = currentUser?.role;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const userParam = searchParams.get('owner') || searchParams.get('user');
  const selectedUser = userParam ? MOCK_USERS.find(u => u.id === userParam) : undefined;

  // Cafes the signed-in user may see, narrowed to the person whose list was opened
  // Backend: the API already returns only the caller's cafes (and hides pending ones from cafe roles).
  const scopedCafes = useMemo(() => (BACKEND ? allCafes : getScopedCafes(allCafes, currentUser)), [allCafes, currentUser]);
  const visibleCafes = useMemo(() => (BACKEND ? scopedCafes : getCafesForUser(scopedCafes, selectedUser)), [scopedCafes, selectedUser]);

  const displayedCafes = useMemo(() => {
    let list = [...visibleCafes];
    const q = searchQuery.trim().toLowerCase();
    if (q) list = list.filter(b => b.name.toLowerCase().includes(q));
    if (filterStatus !== 'all') list = list.filter(b => b.status === filterStatus);
    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [visibleCafes, searchQuery, filterStatus]);

  const activeFilterCount = filterStatus !== 'all' ? 1 : 0;

  const clearFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
  };

  const admins = getUsersByRole('admin');
  const cafeOwners = getUsersByRole('cafe_owner');
  const managers = getUsersByRole('manager');

  // Every new cafe goes through Super Admin approval (no live create), whoever adds it.
  const canCreate = canRequest;

  const handleAdd = () => {
    const f = { ...emptyForm };
    if (BACKEND) {
      f.tenantId = backend.owners.length === 1 ? backend.owners[0].id : '';
      setForm(f);
      setShowAddDialog(true);
      return;
    }
    // Auto-assign current user based on role
    if (userRole === 'admin') f.adminId = currentUser!.id;
    if (userRole === 'cafe_owner') f.cafeOwnerId = currentUser!.id;
    // Pre-assign the person whose cafe list is currently open
    if (selectedUser?.role === 'cafe_owner') {
      f.cafeOwnerId = selectedUser.id;
      if (userRole !== 'admin') f.adminId = selectedUser.createdBy || '';
    } else if (selectedUser?.role === 'manager') {
      f.managerId = selectedUser.id;
      const owner = selectedUser.createdBy ? MOCK_USERS.find(u => u.id === selectedUser.createdBy) : undefined;
      if (owner?.role === 'cafe_owner') {
        f.cafeOwnerId = owner.id;
        f.adminId = f.adminId || owner.createdBy || '';
      }
    } else if (selectedUser?.role === 'admin') {
      f.adminId = selectedUser.id;
    }
    setForm(f);
    setShowAddDialog(true);
  };

  const handleManage = (cafe: Cafe) => {
    setSelectedCafe(cafe);
    setForm({
      name: cafe.name,
      address: cafe.address,
      tenantId: cafe.tenantId,
      totalSeats: cafe.totalSeats,
      adminId: cafe.adminId || '',
      cafeOwnerId: cafe.cafeOwnerId || '',
      managerId: cafe.managerId || '',
      dailySpendLimit: formatRinggit(cafe.dailySpendLimitMinor),
    });
    setShowManageDialog(true);
  };

  const handleSettings = (cafe: Cafe) => {
    setSelectedCafe(cafe);
    setShowSettingsDialog(true);
  };

  /** Backend: the spend limit field in sen, or undefined after showing an error. */
  const spendLimitSen = () => {
    const v = parseRinggit(form.dailySpendLimit);
    if (v === undefined || (v !== null && v < 100)) {
      toast.error('Daily spend limit must be an amount in RM (at least 1.00), or empty for no limit');
      return undefined;
    }
    return v;
  };

  const submitAdd = async () => {
    if (!form.name || !form.address) {
      toast.error('Please fill in cafe name and address');
      return;
    }
    if (BACKEND) {
      if (!form.tenantId) { toast.error('Choose the owner this cafe belongs to'); return; }
      const limit = spendLimitSen();
      if (limit === undefined) return;
      const ok = await run(
        () => backend.create(form.tenantId, { name: form.name.trim(), address: form.address.trim(), daily_spend_limit_minor: limit }),
        `Cafe "${form.name}" submitted for Super Admin approval`,
      );
      if (ok) setShowAddDialog(false);
      return;
    }
    // Cafes created by a Sales Manager need Super Admin approval before going live.
    const needsApproval = true; // every new cafe goes through Super Admin approval
    const base = {
      name: form.name,
      address: form.address,
      tenantId: form.tenantId || 'tenant-1',
      totalSeats: form.totalSeats,
      activeSeats: 0,
      status: (needsApproval ? 'pending' : 'active') as Cafe['status'],
      adminId: form.adminId || undefined,
      cafeOwnerId: form.cafeOwnerId || undefined,
      managerId: form.managerId || undefined,
      billing: { costPerMinute: 2, lockedAmount: 100, currency: 'MYR' as const },
      createdById: currentUser!.id,
      createdAt: new Date().toISOString(),
    };
    const newId = addCafe(base);
    const newCafe: Cafe = { ...base, id: newId };

    if (needsApproval) {
      submitNewCafe(newCafe, { id: currentUser!.id, name: currentUser!.name });
      toast.success(`Cafe "${form.name}" submitted for Super Admin approval`);
      setShowAddDialog(false);
      return;
    }

    provisionSeats(newId, form.totalSeats, defaultGpu);
    toast.success(`Cafe "${form.name}" created with ${form.totalSeats} seats`);
    setShowAddDialog(false);
    // Open seat grid so the owner can immediately configure GPUs
    setSelectedCafe(newCafe);
    setBaselineGpu(defaultGpu);
    setCanSaveSeatConfig(false);
    setShowSeatGrid(true);
  };

  const submitUpdate = async () => {
    if (!selectedCafe) return;
    if (BACKEND) {
      const limit = spendLimitSen();
      if (limit === undefined) return;
      const input = changedFields(selectedCafe, { name: form.name, address: form.address, dailySpendLimitMinor: limit });
      let ok = false;
      if (selectedCafe.status === 'rejected' && canRequest) {
        // A rejected new cafe: the corrections go back for approval together.
        ok = await run(() => backend.resubmit(selectedCafe, input), `Cafe "${form.name}" corrected and resubmitted for approval`);
      } else if (!Object.keys(input).length) {
        toast.info('Nothing changed');
        ok = true;
      } else if (canEditDirect) {
        ok = await run(() => backend.update(selectedCafe, input), `Cafe "${form.name}" updated successfully`);
      } else if (canRequest) {
        ok = await run(() => backend.requestEdit(selectedCafe, input), 'Edit submitted for Super Admin approval — live values are unchanged');
      }
      if (ok) setShowManageDialog(false);
      return;
    }
    const proposed: CafeEditProposal = {
      name: form.name,
      address: form.address,
      totalSeats: form.totalSeats,
      adminId: form.adminId || undefined,
      cafeOwnerId: form.cafeOwnerId || undefined,
      managerId: form.managerId || undefined,
    };

    // Sales Manager edits to a live cafe become a pending change request;
    // the cafe stays Active with the old values until approved.
    if (!canEditDirect && selectedCafe.status === 'active') {
      submitEdit(selectedCafe, proposed, { id: currentUser!.id, name: currentUser!.name });
      toast.success('Edit submitted for Super Admin approval — live values are unchanged');
      setShowManageDialog(false);
      return;
    }

    updateCafe(selectedCafe.id, {
      ...proposed,
      activeSeats: Math.min(selectedCafe.activeSeats, form.totalSeats),
    });
    syncSeatCount(selectedCafe.id, form.totalSeats, defaultGpu);
    toast.success(
      !canEditDirect && selectedCafe.status === 'rejected'
        ? `Cafe "${form.name}" updated — resubmit it for approval when ready`
        : `Cafe "${form.name}" updated successfully`
    );
    setShowManageDialog(false);
  };

  const handleResubmit = (cafe: Cafe) => {
    if (BACKEND) {
      void run(() => backend.resubmit(cafe), `Cafe "${cafe.name}" resubmitted for approval`);
      return;
    }
    const req = resubmit(cafe.id, { id: currentUser!.id, name: currentUser!.name });
    if (req) toast.success(`Cafe "${cafe.name}" resubmitted for approval`);
    else toast.error('This cafe cannot be resubmitted');
  };

  const handleToggleStatus = async () => {
    if (!selectedCafe) return;
    if (BACKEND) {
      const enable = selectedCafe.status === 'inactive';
      const ok = await run(() => backend.setActive(selectedCafe, enable), `Cafe "${selectedCafe.name}" ${enable ? 'enabled' : 'disabled'}`);
      if (ok) setShowSettingsDialog(false);
      return;
    }
    toggleCafeStatus(selectedCafe.id);
    const newStatus = selectedCafe.status === 'inactive' ? 'active' : 'inactive';
    toast.success(`Cafe "${selectedCafe.name}" ${newStatus === 'active' ? 'enabled' : 'disabled'}`);
    setShowSettingsDialog(false);
  };

  const handleDelete = async () => {
    if (!selectedCafe) return;
    if (BACKEND) {
      const ok = await run(() => backend.close(selectedCafe), `Cafe "${selectedCafe.name}" closed`);
      if (ok) { setShowDeleteConfirm(false); setShowSettingsDialog(false); }
      return;
    }
    removeSeatsForCafe(selectedCafe.id);
    deleteCafe(selectedCafe.id);
    toast.success(`Cafe "${selectedCafe.name}" deleted`);
    setShowDeleteConfirm(false);
    setShowSettingsDialog(false);
  };

  const setMaintenance = async () => {
    if (!selectedCafe) return;
    if (BACKEND) {
      const on = selectedCafe.status !== 'maintenance';
      const ok = await run(() => backend.setMaintenance(selectedCafe, on), `Cafe "${selectedCafe.name}" ${on ? 'set to maintenance' : 'back to active'}`);
      if (ok) setShowSettingsDialog(false);
      return;
    }
    updateCafe(selectedCafe.id, {
      status: selectedCafe.status === 'maintenance' ? 'active' : 'maintenance',
    });
    toast.success(`Cafe "${selectedCafe.name}" ${selectedCafe.status === 'maintenance' ? 'back to active' : 'set to maintenance'}`);
    setShowSettingsDialog(false);
  };

  // Filtered user lists for assignments based on current user role
  const getAssignableAdmins = () => {
    if (userRole === 'super_admin') return admins;
    return [];
  };

  const getAssignableCafeOwners = () => {
    if (userRole === 'super_admin') return cafeOwners;
    if (userRole === 'admin') return cafeOwners.filter(o => o.createdBy === currentUser!.id);
    return [];
  };

  const getAssignableManagers = () => {
    if (userRole === 'super_admin') return managers;
    if (userRole === 'admin') {
      const ownCafeOwners = cafeOwners.filter(o => o.createdBy === currentUser!.id).map(o => o.id);
      return managers.filter(m => m.createdBy && ownCafeOwners.includes(m.createdBy));
    }
    if (userRole === 'cafe_owner') return managers.filter(m => m.createdBy === currentUser!.id);
    return [];
  };

  const AssignmentUserLabel = ({ userId, role }: { userId?: string; role: string }) => {
    const user = getUserName(userId);
    if (!user) return <span className="text-muted-foreground italic text-xs">Not assigned</span>;
    return (
      <span className="text-sm flex items-center gap-1.5">
        <span className="font-medium">{user.name}</span>
        <span className="text-muted-foreground">({user.email})</span>
      </span>
    );
  };

  const AssignedTeamCard = ({ cafe }: { cafe: Cafe }) => {
    const admin = getUserName(cafe.adminId);
    const owner = getUserName(cafe.cafeOwnerId);
    const manager = getUserName(cafe.managerId);

    const assignments = [
      { label: 'Sales Manager', user: admin, icon: Shield, color: 'text-destructive' },
      { label: 'Cafe Owner', user: owner, icon: User, color: 'text-primary' },
      { label: 'Floor Manager', user: manager, icon: UserCheck, color: 'text-accent-foreground' },
    ];

    return (
      <div className="space-y-1.5 mt-1">
        {assignments.map(a => (
          <div key={a.label} className="flex items-center gap-1.5 text-sm">
            <a.icon className={`h-3 w-3 ${a.color} shrink-0`} />
            <span className="text-muted-foreground text-xs w-[72px] shrink-0">{a.label}:</span>
            {a.user ? (
              <span className="text-xs font-medium truncate">{a.user.name}</span>
            ) : (
              <span className="text-xs text-muted-foreground italic">Unassigned</span>
            )}
          </div>
        ))}
      </div>
    );
  };

  const CafeStatusBadge = ({ cafe }: { cafe: Cafe }) => {
    if (cafe.status === 'pending') return <StatusBadge status="pending" label="Disabled (Pending)" />;
    if (cafe.status === 'rejected') return <StatusBadge status="rejected" label="Disabled (Rejected)" />;
    return (
      <span className="flex items-center gap-1.5 flex-wrap justify-end">
        <StatusBadge status={cafe.status} />
        {cafe.status === 'active' && cafe.pendingEdit && (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-[10px] px-1.5 py-0 normal-case">
            Edit pending
          </Badge>
        )}
      </span>
    );
  };

  // Demo mode: the Sales Manager opens cafes from a cafe owner in User Management. Backend: their scope is every cafe.
  if (!BACKEND && userRole === 'admin' && !selectedUser) return <Navigate to="/users" replace />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2">
          {userParam && (
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate('/users')} aria-label="Back to user list">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{selectedUser ? `${selectedUser.name}'s Cafes` : 'Cafes'}</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">{selectedUser ? `${ROLE_LABELS[selectedUser.role]} — showing only cafes assigned to them` : 'Manage gaming cafe locations, seats, and team assignments'}</p>
          </div>
        </div>
        {canCreate && (
          <Button className="gradient-primary text-primary-foreground gap-2 w-full sm:w-auto" onClick={handleAdd}>
            <Plus className="h-4 w-4" /> Add Cafe
          </Button>
        )}
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by cafe name..."
                className="pl-9"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[180px] h-10"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Disabled (Pending)</SelectItem>
                <SelectItem value="rejected">Disabled (Rejected)</SelectItem>
              </SelectContent>
            </Select>
            {activeFilterCount > 0 || searchQuery ? (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 self-start sm:self-auto">
                <X className="h-3.5 w-3.5" /> Clear
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Cafe Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedCafes.map(cafe => {
          const isBlocked = cafe.status === 'pending' || cafe.status === 'rejected';
          return (
          <Card key={cafe.id} className={`hover:shadow-md transition-shadow ${cafe.status === 'inactive' || isBlocked ? 'opacity-60' : ''}`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{cafe.name}</h3>
                </div>
                <CafeStatusBadge cafe={cafe} />
              </div>
              <div className="space-y-2 text-sm text-muted-foreground mb-2">
                <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {cafe.address}</p>
                {BACKEND ? (
                  <p className="flex items-center gap-1.5"><Armchair className="h-3.5 w-3.5" /> {cafe.totalSeats} seats</p>
                ) : (
                  <p className="flex items-center gap-1.5"><Armchair className="h-3.5 w-3.5" /> {cafe.activeSeats} active / {cafe.totalSeats} total seats</p>
                )}
              </div>

              {BACKEND ? (
                <div className="p-3 rounded-lg bg-muted/50 border mb-4 text-xs space-y-1">
                  <p className="flex items-center gap-1.5"><User className="h-3 w-3 text-primary" /><span className="text-muted-foreground">Owner:</span> <span className="font-medium">{cafe.tenantName}</span></p>
                  <p className="text-muted-foreground">Daily spend limit: {cafe.dailySpendLimitMinor == null ? 'none' : `RM ${formatRinggit(cafe.dailySpendLimitMinor)}`}</p>
                </div>
              ) : (
              /* Assigned Team */
              <div className="p-3 rounded-lg bg-muted/50 border mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Users className="h-3 w-3" /> Assigned Team
                </p>
                <AssignedTeamCard cafe={cafe} />
              </div>
              )}

              {/* Rejection feedback + resubmit (new cafe flow) */}
              {cafe.status === 'rejected' && cafe.approvalFeedback && (
                <div className="mb-3 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                  <p className="flex items-center gap-1.5 font-medium text-destructive text-xs mb-1">
                    <AlertCircle className="h-3.5 w-3.5" /> Rejected by Super Admin
                  </p>
                  <p className="text-xs text-muted-foreground">{cafe.approvalFeedback}</p>
                  {canRequest && (
                    <Button size="sm" variant="outline" className="mt-2 gap-1.5" disabled={busy} onClick={() => handleResubmit(cafe)}>
                      <Send className="h-3.5 w-3.5" /> Resubmit for approval
                    </Button>
                  )}
                </div>
              )}

              {/* Rejected edit feedback */}
              {cafe.editFeedback && canRequest && (
                <div className="mb-3 p-3 rounded-lg border border-warning/30 bg-warning/5">
                  <p className="flex items-center gap-1.5 font-medium text-warning text-xs mb-1">
                    <AlertCircle className="h-3.5 w-3.5" /> Edit request rejected
                  </p>
                  <p className="text-xs text-muted-foreground">{cafe.editFeedback}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 italic">Revise the cafe details and save again to resubmit.</p>
                </div>
              )}

              {/* Pending edit comparison */}
              {cafe.pendingEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mb-3 gap-1.5"
                  onClick={() => { setSelectedCafe(cafe); setShowCompareDialog(true); }}
                >
                  <GitCompareArrows className="h-3.5 w-3.5" /> View pending changes
                </Button>
              )}

              <div className="flex flex-wrap gap-2">
                {!BACKEND && !isBlocked && canViewSeats && (
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setSelectedCafe(cafe); setBaselineGpu(defaultGpu); setCanSaveSeatConfig(false); setShowSeatGrid(true); }}>
                    <LayoutGrid className="h-3.5 w-3.5" /> Seats
                  </Button>
                )}
                {SHIFTS_ENABLED && !isBlocked && (userRole === 'super_admin' || userRole === 'admin' || userRole === 'cafe_owner') && (
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setSelectedCafe(cafe); setShowShiftDialog(true); }}>
                    <Clock className="h-3.5 w-3.5" /> Shifts
                  </Button>
                )}
                {(canEditDirect || canRequest) && (
                  <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => handleManage(cafe)}>
                    <Edit className="h-3.5 w-3.5" /> Manage
                  </Button>
                )}
                {(canDisable || canMaintain || canDeleteCafe || (canEnable && !isBlocked)) && (
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleSettings(cafe)}>
                    <Settings className="h-3.5 w-3.5" /> Settings
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>

      {BACKEND && backend.error && (
        <Card>
          <CardContent className="p-6 text-center text-sm">
            <AlertCircle className="h-6 w-6 text-destructive mx-auto mb-2" />
            <p className="font-medium mb-1">Could not load cafes</p>
            <p className="text-muted-foreground mb-3">{backend.error}</p>
            <Button size="sm" variant="outline" onClick={() => void backend.load()}>Try again</Button>
          </CardContent>
        </Card>
      )}

      {BACKEND && !backend.loaded && (
        <p className="text-sm text-muted-foreground text-center py-8">Loading cafes…</p>
      )}

      {displayedCafes.length === 0 && (!BACKEND || (backend.loaded && !backend.error)) && (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-1">{selectedUser ? `No cafes assigned to ${selectedUser.name}` : 'No cafes found'}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {visibleCafes.length === 0
                ? (canCreate ? 'Get started by adding your first cafe' : 'No cafes are assigned to you yet')
                : 'No cafes match your current search and filters'}
            </p>
            {visibleCafes.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1.5">
                <X className="h-3.5 w-3.5" /> Clear filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Cafe Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> Add New Cafe</DialogTitle>
            <DialogDescription>Set up a new gaming cafe location with seats and team assignments</DialogDescription>
          </DialogHeader>
          <CafeFormFields
            isEdit={false}
            form={form}
            setForm={setForm}
            selectedCafe={selectedCafe}
            assignableAdmins={getAssignableAdmins()}
            assignableCafeOwners={getAssignableCafeOwners()}
            assignableManagers={getAssignableManagers()}
            owners={backend.owners}
          />
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button className="gradient-primary text-primary-foreground" onClick={() => void submitAdd()} disabled={busy || !form.name.trim() || !form.address.trim() || (BACKEND && !form.tenantId)}>Create Cafe</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Cafe Dialog */}
      <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Edit className="h-5 w-5" /> Edit Cafe</DialogTitle>
            <DialogDescription>Update cafe details, seats, and team assignments</DialogDescription>
          </DialogHeader>
          <CafeFormFields
            isEdit={true}
            form={form}
            setForm={setForm}
            selectedCafe={selectedCafe}
            assignableAdmins={getAssignableAdmins()}
            assignableCafeOwners={getAssignableCafeOwners()}
            assignableManagers={getAssignableManagers()}
          />
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowManageDialog(false)}>Cancel</Button>
            <Button className="gradient-primary text-primary-foreground" onClick={() => void submitUpdate()} disabled={busy || !form.name.trim() || !form.address.trim()}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Cafe Settings</DialogTitle>
            <DialogDescription>{selectedCafe?.name}</DialogDescription>
          </DialogHeader>
          {selectedCafe && (
            <div className="space-y-4">
              {selectedCafe.status === 'pending' || selectedCafe.status === 'rejected' ? (
                <p className="text-xs text-muted-foreground p-3 rounded-lg border bg-muted/30">
                  This cafe is {selectedCafe.status === 'pending' ? 'awaiting Super Admin approval' : 'rejected'} — status controls are locked.
                </p>
              ) : (
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">Cafe Active</p>
                  <p className="text-xs text-muted-foreground">
                    {!canDisable ? 'Enable this cafe' : 'Enable or disable this cafe'}
                  </p>
                </div>
                <Switch
                  checked={selectedCafe.status !== 'inactive'}
                  disabled={!(selectedCafe.status === 'inactive' ? canEnable : canDisable)}
                  onCheckedChange={() => { if (!busy && (selectedCafe.status === 'inactive' ? canEnable : canDisable)) void handleToggleStatus(); }}
                />
              </div>
              )}

              {(canMaintain || canDeleteCafe) && selectedCafe.status !== 'pending' && selectedCafe.status !== 'rejected' && (
                <>
                  {canMaintain && (
                    <Button variant="outline" className="w-full justify-start gap-2" disabled={busy} onClick={() => void setMaintenance()}>
                      <Monitor className="h-4 w-4" />
                      {selectedCafe.status === 'maintenance' ? 'End Maintenance Mode' : 'Set Maintenance Mode'}
                    </Button>
                  )}

                  {canMaintain && canDeleteCafe && <Separator />}

                  {canDeleteCafe && (
                    <>
                      <Button variant="destructive" className="w-full justify-start gap-2" onClick={() => setShowDeleteConfirm(true)}>
                        <Trash2 className="h-4 w-4" /> Delete Cafe
                      </Button>
                      <p className="text-xs text-muted-foreground">{BACKEND ? 'The cafe is closed and hidden; its history is kept' : 'Deleting a cafe is permanent and cannot be undone'}</p>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>


      {/* Seat Grid Dialog */}
      <Dialog open={showSeatGrid} onOpenChange={(o) => { setShowSeatGrid(o); if (!o) { setEditingSeat(null); setCanSaveSeatConfig(false); setBaselineGpu(defaultGpu); } else { setBaselineGpu(defaultGpu); setCanSaveSeatConfig(false); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-primary" />
              {selectedCafe?.name} — Seat Configuration
            </DialogTitle>
            <DialogDescription>
              {!canEditSeats
                ? 'Read-only view of this cafe seats. Only the cafe owner or super admin can change them.'
                : 'Click any seat to edit its name, GPU model and status.'}
            </DialogDescription>
          </DialogHeader>
          {selectedCafe && (() => {
            const cafeSeats = seats.filter(s => s.cafeId === selectedCafe.id).sort((a, b) => a.number - b.number);
            const available = cafeSeats.filter(s => s.status === 'available').length;
            const occupied = cafeSeats.filter(s => s.status === 'occupied').length;
            const maintenance = cafeSeats.filter(s => s.status === 'maintenance').length;
            const canEdit = canEditSeats;

            return (
              <div className="space-y-4">
                {/* Legend & Stats */}
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-success/80" />
                    <span className="text-muted-foreground">Available ({available})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-destructive/80" />
                    <span className="text-muted-foreground">Occupied ({occupied})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-warning/80" />
                    <span className="text-muted-foreground">Maintenance ({maintenance})</span>
                  </div>
                </div>

                {/* Bulk GPU assignment */}
                {canEdit && cafeSeats.length > 0 && (
                  <div className="flex flex-wrap items-end gap-2 p-3 rounded-lg border bg-muted/30">
                    <div className="flex-1 min-w-[180px]">
                      <Label className="text-xs flex items-center gap-1.5"><Cpu className="h-3 w-3" /> Default GPU for new/unassigned seats</Label>
                      <Select value={defaultGpu} onValueChange={(v) => { setDefaultGpu(v); setCanSaveSeatConfig(false); }}>
                        <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {GPU_MODEL_OPTIONS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      disabled={defaultGpu === baselineGpu}
                      onClick={() => {
                        let count = 0;
                        const actor = currentUser;
                        cafeSeats.forEach(s => {
                          if (s.status !== 'occupied' && s.gpuModel !== defaultGpu) {
                            if (actor) {
                              useSeatActivityStore.getState().log({
                                seatId: s.id,
                                seatNumber: s.number,
                                cafeId: s.cafeId,
                                cafeName: selectedCafe.name,
                                field: 'gpuModel',
                                fromValue: s.gpuModel || '—',
                                toValue: defaultGpu,
                                actorId: actor.id,
                                actorName: actor.name,
                                actorRole: ROLE_LABELS[actor.role],
                              });
                            }
                            updateSeat(s.id, { gpuModel: defaultGpu });
                            count++;
                          }
                        });
                        toast.success(`Applied ${defaultGpu} to ${count} seat${count === 1 ? '' : 's'}`);
                        setBaselineGpu(defaultGpu);
                        setCanSaveSeatConfig(true);
                      }}
                    >
                      <Cpu className="h-3.5 w-3.5" /> Apply to all
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1.5 gradient-primary text-primary-foreground"
                      disabled={!canSaveSeatConfig}
                      onClick={() => {
                        toast.success('Seat configuration saved');
                        setCanSaveSeatConfig(false);
                        setShowSeatGrid(false);
                      }}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Save Changes
                    </Button>

                  </div>
                )}

                {/* Grid */}
                <TooltipProvider delayDuration={200}>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {cafeSeats.map(seat => {
                      const statusColor = seat.status === 'available'
                        ? 'bg-success/15 border-success/30 hover:bg-success/25 text-success'
                        : seat.status === 'occupied'
                        ? 'bg-destructive/15 border-destructive/30 hover:bg-destructive/25 text-destructive'
                        : 'bg-warning/15 border-warning/30 hover:bg-warning/25 text-warning';

                      const openEdit = () => {
                        setEditingSeat(seat);
                        setSeatForm({
                          label: seat.label || '',
                          gpuModel: seat.gpuModel || defaultGpu,
                          status: seat.status,
                        });
                      };

                      return (
                        <Tooltip key={seat.id}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={canEdit ? openEdit : undefined}
                              className={cn(
                                'group relative flex flex-col items-center justify-center rounded-lg border p-2.5 transition-all aspect-square',
                                canEdit ? 'cursor-pointer' : 'cursor-default',
                                statusColor
                              )}
                            >
                              {canEdit && <Pencil className="absolute top-1 right-1 h-2.5 w-2.5 opacity-0 group-hover:opacity-70 transition-opacity" />}
                              <Armchair className="h-4 w-4 mb-0.5" />
                              <span className="text-xs font-bold leading-none">{seat.label || `#${seat.number}`}</span>
                              <span className="text-[9px] opacity-70 mt-0.5 truncate max-w-full">{seat.gpuModel}</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs space-y-1 max-w-[200px]">
                            <p className="font-semibold">Seat #{seat.number}{seat.label ? ` · ${seat.label}` : ''}</p>
                            <p className="capitalize">Status: {seat.status}</p>
                            <p className="flex items-center gap-1"><Cpu className="h-3 w-3" /> {seat.gpuModel}</p>
                            {seat.playerName && <p className="flex items-center gap-1"><User className="h-3 w-3" /> {seat.playerName}</p>}
                            {seat.startTime && <p className="flex items-center gap-1"><Clock className="h-3 w-3" /> Since {seat.startTime}</p>}
                            {canEdit
                              ? <p className="text-muted-foreground italic mt-1">Click to edit</p>
                              : <p className="text-muted-foreground italic mt-1">View only</p>}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </TooltipProvider>

                {cafeSeats.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Armchair className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm mb-3">No seats configured for this cafe yet</p>
                    {canEdit && (
                      <Button
                        size="sm"
                        onClick={() => {
                          provisionSeats(selectedCafe.id, selectedCafe.totalSeats || 1, defaultGpu);
                          toast.success(`Provisioned ${selectedCafe.totalSeats} seats`);
                        }}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1.5" /> Provision {selectedCafe.totalSeats} seats
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Seat Edit Dialog */}
      <Dialog open={editingSeat !== null} onOpenChange={(o) => { if (!o) setEditingSeat(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Armchair className="h-5 w-5 text-primary" /> Seat #{editingSeat?.number}
            </DialogTitle>
            <DialogDescription>Update seat name, GPU model and operational status.</DialogDescription>
          </DialogHeader>
          {editingSeat && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Display Name (optional)</Label>
                <Input
                  className="mt-1"
                  placeholder={`Seat ${editingSeat.number}`}
                  value={seatForm.label}
                  onChange={e => setSeatForm(f => ({ ...f, label: e.target.value }))}
                />
                <p className="text-[11px] text-muted-foreground mt-1">e.g. "VIP-1", "Stream Booth"</p>
              </div>

              <div>
                <Label className="text-xs flex items-center gap-1.5"><Cpu className="h-3 w-3" /> GPU Model</Label>
                <Select value={seatForm.gpuModel} onValueChange={v => setSeatForm(f => ({ ...f, gpuModel: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GPU_MODEL_OPTIONS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Status</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {(['available', 'occupied', 'maintenance'] as const).map(s => {
                    const active = seatForm.status === s;
                    const Icon = s === 'available' ? CheckCircle2 : s === 'occupied' ? User : Wrench;
                    const activeTone = s === 'available'
                      ? 'bg-success/15 border-success/40 text-success ring-1 ring-success/30'
                      : s === 'occupied'
                      ? 'bg-destructive/15 border-destructive/40 text-destructive ring-1 ring-destructive/30'
                      : 'bg-warning/15 border-warning/40 text-warning ring-1 ring-warning/30';
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSeatForm(f => ({ ...f, status: s }))}
                        className={cn(
                          'flex flex-col items-center justify-center gap-1 rounded-lg border p-2.5 text-xs capitalize transition-all',
                          active ? activeTone : 'border-border hover:bg-muted/50 text-muted-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {s}
                      </button>
                    );
                  })}
                </div>
                {editingSeat.status === 'occupied' && seatForm.status !== 'occupied' && (
                  <p className="text-[11px] text-warning mt-1.5">Changing away from "occupied" will clear the active player session.</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setEditingSeat(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!editingSeat) return;
                const wasOccupied = editingSeat.status === 'occupied';
                const becomesNonOccupied = seatForm.status !== 'occupied';
                const newLabel = seatForm.label.trim() || undefined;
                const cafeName = selectedCafe?.name || '';
                const logChange = (field: 'label' | 'gpuModel' | 'status', from: string, to: string) => {
                  if (from === to) return;
                  if (!currentUser) return;
                  useSeatActivityStore.getState().log({
                    seatId: editingSeat.id,
                    seatNumber: editingSeat.number,
                    cafeId: editingSeat.cafeId,
                    cafeName,
                    field,
                    fromValue: from,
                    toValue: to,
                    actorId: currentUser.id,
                    actorName: currentUser.name,
                    actorRole: ROLE_LABELS[currentUser.role],
                  });
                };
                logChange('label', editingSeat.label || '—', newLabel || '—');
                logChange('gpuModel', editingSeat.gpuModel || '—', seatForm.gpuModel);
                logChange('status', editingSeat.status, seatForm.status);
                updateSeat(editingSeat.id, {
                  label: newLabel,
                  gpuModel: seatForm.gpuModel,
                  status: seatForm.status,
                  ...(wasOccupied && becomesNonOccupied ? { playerName: undefined, startTime: undefined, endTime: undefined } : {}),
                });
                toast.success(`Seat #${editingSeat.number} updated`);
                setEditingSeat(null);
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete / close confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Trash2 className="h-5 w-5 text-destructive" /> Delete {selectedCafe?.name}?</DialogTitle>
            <DialogDescription>
              {BACKEND
                ? 'The cafe is closed: it disappears from every list and stops taking sessions. Its history is kept.'
                : 'This removes the cafe and its seats. It cannot be undone.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" disabled={busy} onClick={() => void handleDelete()}>Delete Cafe</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pending Changes Comparison Dialog */}
      <Dialog open={showCompareDialog} onOpenChange={setShowCompareDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitCompareArrows className="h-5 w-5 text-primary" /> Pending changes — {selectedCafe?.name}
            </DialogTitle>
            <DialogDescription>
              Current live values vs the proposed changes awaiting Super Admin approval
            </DialogDescription>
          </DialogHeader>
          {selectedCafe?.pendingEdit && (
            <PendingChangesCompare current={toProposal(selectedCafe)} proposed={selectedCafe.pendingEdit} backend={BACKEND} />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompareDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {SHIFTS_ENABLED && (
        <ShiftManagementDialog
          open={showShiftDialog}
          onOpenChange={setShowShiftDialog}
          cafe={selectedCafe}
        />
      )}
    </div>
  );
}
