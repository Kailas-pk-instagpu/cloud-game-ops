import { useState, useMemo } from 'react';
import { useBranchStore, useAuthStore, useSeatStore } from '@/shared/lib/store';
import { MOCK_USERS } from '@/shared/lib/mock-data';
import { Branch, Seat } from '@/shared/lib/mock-data';
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
import { Building2, MapPin, Monitor, Plus, Settings, Edit, Power, Trash2, UserCheck, Armchair, Shield, User, Users, LayoutGrid, Cpu, Clock, X } from 'lucide-react';
import { toast } from 'sonner';
import { Role } from '@/shared/types/auth';
import { cn } from '@/lib/utils';

interface BranchForm {
  name: string;
  address: string;
  cafeId: string;
  totalSeats: number;
  adminId: string;
  cafeOwnerId: string;
  managerId: string;
}

const emptyForm: BranchForm = { name: '', address: '', cafeId: '', totalSeats: 10, adminId: '', cafeOwnerId: '', managerId: '' };

function getUsersByRole(role: Role) {
  return MOCK_USERS.filter(u => u.role === role);
}

function getUserName(id?: string) {
  if (!id) return null;
  return MOCK_USERS.find(u => u.id === id);
}

export default function BranchesPage() {
  const { branches, addBranch, updateBranch, deleteBranch, toggleBranchStatus } = useBranchStore();
  const { seats, updateSeatStatus } = useSeatStore();
  const currentUser = useAuthStore(s => s.user);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSeatGrid, setShowSeatGrid] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [form, setForm] = useState<BranchForm>(emptyForm);

  const userRole = currentUser?.role;

  // Filter branches based on role scope
  const visibleBranches = useMemo(() => {
    if (!currentUser) return [];
    if (userRole === 'super_admin') return branches;
    if (userRole === 'admin') return branches.filter(b => b.adminId === currentUser.id || currentUser.assignedScope.includes(b.cafeId));
    if (userRole === 'cafe_owner') return branches.filter(b => b.cafeOwnerId === currentUser.id || currentUser.assignedScope.some(s => s === b.cafeId));
    return branches.filter(b => b.managerId === currentUser.id);
  }, [branches, currentUser, userRole]);

  const admins = getUsersByRole('admin');
  const cafeOwners = getUsersByRole('cafe_owner');
  const managers = getUsersByRole('manager');

  const canCreate = userRole === 'super_admin' || userRole === 'admin' || userRole === 'cafe_owner';

  const handleAdd = () => {
    const f = { ...emptyForm };
    // Auto-assign current user based on role
    if (userRole === 'admin') f.adminId = currentUser!.id;
    if (userRole === 'cafe_owner') {
      f.cafeOwnerId = currentUser!.id;
    }
    setForm(f);
    setShowAddDialog(true);
  };

  const handleManage = (branch: Branch) => {
    setSelectedBranch(branch);
    setForm({
      name: branch.name,
      address: branch.address,
      cafeId: branch.cafeId,
      totalSeats: branch.totalSeats,
      adminId: branch.adminId || '',
      cafeOwnerId: branch.cafeOwnerId || '',
      managerId: branch.managerId || '',
    });
    setShowManageDialog(true);
  };

  const handleSettings = (branch: Branch) => {
    setSelectedBranch(branch);
    setShowSettingsDialog(true);
  };

  const submitAdd = () => {
    if (!form.name || !form.address) {
      toast.error('Please fill in branch name and address');
      return;
    }
    addBranch({
      name: form.name,
      address: form.address,
      cafeId: form.cafeId || 'cafe-1',
      totalSeats: form.totalSeats,
      activeSeats: 0,
      status: 'active',
      adminId: form.adminId || undefined,
      cafeOwnerId: form.cafeOwnerId || undefined,
      managerId: form.managerId || undefined,
    });
    toast.success(`Branch "${form.name}" created with ${form.totalSeats} seats`);
    setShowAddDialog(false);
  };

  const submitUpdate = () => {
    if (!selectedBranch) return;
    updateBranch(selectedBranch.id, {
      name: form.name,
      address: form.address,
      totalSeats: form.totalSeats,
      activeSeats: Math.min(selectedBranch.activeSeats, form.totalSeats),
      adminId: form.adminId || undefined,
      cafeOwnerId: form.cafeOwnerId || undefined,
      managerId: form.managerId || undefined,
    });
    toast.success(`Branch "${form.name}" updated successfully`);
    setShowManageDialog(false);
  };

  const handleToggleStatus = () => {
    if (!selectedBranch) return;
    toggleBranchStatus(selectedBranch.id);
    const newStatus = selectedBranch.status === 'inactive' ? 'active' : 'inactive';
    toast.success(`Branch "${selectedBranch.name}" ${newStatus === 'active' ? 'enabled' : 'disabled'}`);
    setShowSettingsDialog(false);
  };

  const handleDelete = () => {
    if (!selectedBranch) return;
    deleteBranch(selectedBranch.id);
    toast.success(`Branch "${selectedBranch.name}" deleted`);
    setShowDeleteConfirm(false);
    setShowSettingsDialog(false);
  };

  const setMaintenance = () => {
    if (!selectedBranch) return;
    updateBranch(selectedBranch.id, {
      status: selectedBranch.status === 'maintenance' ? 'active' : 'maintenance',
    });
    toast.success(`Branch "${selectedBranch.name}" ${selectedBranch.status === 'maintenance' ? 'back to active' : 'set to maintenance'}`);
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

  const BranchFormFields = ({ isEdit }: { isEdit: boolean }) => {
    const assignableAdmins = getAssignableAdmins();
    const assignableCafeOwners = getAssignableCafeOwners();
    const assignableManagers = getAssignableManagers();

    return (
      <div className="space-y-5">
        {/* Step 1: Basic Info */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Step 1 — Branch Details
          </p>
          <div className="space-y-3">
            <div>
              <Label htmlFor="name">Branch Name *</Label>
              <Input id="name" placeholder="e.g. Downtown Gaming Hub" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <p className="text-xs text-muted-foreground mt-1">Give your branch a recognizable name</p>
            </div>
            <div>
              <Label htmlFor="address">Address *</Label>
              <Input id="address" placeholder="e.g. 123 Main Street, City" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              <p className="text-xs text-muted-foreground mt-1">Full street address of the branch</p>
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
              {isEdit && selectedBranch
                ? `Currently ${selectedBranch.activeSeats} seats are active out of ${selectedBranch.totalSeats}`
                : 'How many gaming stations does this branch have?'}
            </p>
          </div>
        </div>

        <Separator />

        {/* Step 3: Assign Users */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Step 3 — Assign Team
          </p>
          <p className="text-xs text-muted-foreground mb-4">Assign users to manage and operate this branch</p>
          <div className="space-y-4">
            {/* Admin Assignment - only Super Admin can assign */}
            {assignableAdmins.length > 0 && (
              <div>
                <Label className="flex items-center gap-1.5 mb-1">
                  <Shield className="h-3.5 w-3.5 text-destructive" /> Admin
                </Label>
                <Select value={form.adminId} onValueChange={v => setForm(f => ({ ...f, adminId: v === 'none' ? '' : v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an admin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No admin assigned</SelectItem>
                    {assignableAdmins.map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} — {u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Admin will oversee this branch's operations</p>
              </div>
            )}

            {/* Cafe Owner Assignment - Super Admin and Admin can assign */}
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

            {/* Manager Assignment - Super Admin, Admin, Cafe Owner can assign */}
            {assignableManagers.length > 0 && (
              <div>
                <Label className="flex items-center gap-1.5 mb-1">
                  <UserCheck className="h-3.5 w-3.5 text-accent-foreground" /> Manager
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
                <p className="text-xs text-muted-foreground mt-1">Manager will handle this specific branch</p>
              </div>
            )}

            {assignableAdmins.length === 0 && assignableCafeOwners.length === 0 && assignableManagers.length === 0 && (
              <p className="text-sm text-muted-foreground italic">No users available for assignment at your permission level</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const AssignedTeamCard = ({ branch }: { branch: Branch }) => {
    const admin = getUserName(branch.adminId);
    const owner = getUserName(branch.cafeOwnerId);
    const manager = getUserName(branch.managerId);

    const assignments = [
      { label: 'Admin', user: admin, icon: Shield, color: 'text-destructive' },
      { label: 'Cafe Owner', user: owner, icon: User, color: 'text-primary' },
      { label: 'Manager', user: manager, icon: UserCheck, color: 'text-accent-foreground' },
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Branches</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">Manage gaming cafe locations, seats, and team assignments</p>
        </div>
        {canCreate && (
          <Button className="gradient-primary text-primary-foreground gap-2 w-full sm:w-auto" onClick={handleAdd}>
            <Plus className="h-4 w-4" /> Add Branch
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Branches', value: visibleBranches.length, icon: Building2 },
          { label: 'Active', value: visibleBranches.filter(b => b.status === 'active').length, icon: Power },
          { label: 'Total Seats', value: visibleBranches.reduce((s, b) => s + b.totalSeats, 0), icon: Armchair },
          { label: 'Active Seats', value: visibleBranches.reduce((s, b) => s + b.activeSeats, 0), icon: Monitor },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Branch Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleBranches.map(branch => (
          <Card key={branch.id} className={`hover:shadow-md transition-shadow ${branch.status === 'inactive' ? 'opacity-60' : ''}`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{branch.name}</h3>
                </div>
                <StatusBadge status={branch.status} />
              </div>
              <div className="space-y-2 text-sm text-muted-foreground mb-2">
                <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {branch.address}</p>
                <p className="flex items-center gap-1.5"><Armchair className="h-3.5 w-3.5" /> {branch.activeSeats} active / {branch.totalSeats} total seats</p>
              </div>

              {/* Assigned Team */}
              <div className="p-3 rounded-lg bg-muted/50 border mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Users className="h-3 w-3" /> Assigned Team
                </p>
                <AssignedTeamCard branch={branch} />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setSelectedBranch(branch); setShowSeatGrid(true); }}>
                  <LayoutGrid className="h-3.5 w-3.5" /> Seats
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => handleManage(branch)}>
                  <Edit className="h-3.5 w-3.5" /> Manage
                </Button>
                {(userRole === 'super_admin' || userRole === 'admin') && (
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleSettings(branch)}>
                    <Settings className="h-3.5 w-3.5" /> Settings
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {visibleBranches.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-1">No branches found</h3>
            <p className="text-sm text-muted-foreground">
              {canCreate ? 'Get started by adding your first branch' : 'No branches are assigned to you yet'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Add Branch Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> Add New Branch</DialogTitle>
            <DialogDescription>Set up a new gaming cafe location with seats and team assignments</DialogDescription>
          </DialogHeader>
          <BranchFormFields isEdit={false} />
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button className="gradient-primary text-primary-foreground" onClick={submitAdd}>Create Branch</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Branch Dialog */}
      <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Edit className="h-5 w-5" /> Edit Branch</DialogTitle>
            <DialogDescription>Update branch details, seats, and team assignments</DialogDescription>
          </DialogHeader>
          <BranchFormFields isEdit={true} />
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowManageDialog(false)}>Cancel</Button>
            <Button className="gradient-primary text-primary-foreground" onClick={submitUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Branch Settings</DialogTitle>
            <DialogDescription>{selectedBranch?.name}</DialogDescription>
          </DialogHeader>
          {selectedBranch && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">Branch Active</p>
                  <p className="text-xs text-muted-foreground">Enable or disable this branch</p>
                </div>
                <Switch checked={selectedBranch.status !== 'inactive'} onCheckedChange={handleToggleStatus} />
              </div>

              <Button variant="outline" className="w-full justify-start gap-2" onClick={setMaintenance}>
                <Monitor className="h-4 w-4" />
                {selectedBranch.status === 'maintenance' ? 'End Maintenance Mode' : 'Set Maintenance Mode'}
              </Button>

              <Separator />

              <Button variant="destructive" className="w-full justify-start gap-2" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 className="h-4 w-4" /> Delete Branch
              </Button>
              <p className="text-xs text-muted-foreground">Deleting a branch is permanent and cannot be undone</p>
            </div>
          )}
        </DialogContent>
      </Dialog>


      {/* Seat Grid Dialog */}
      <Dialog open={showSeatGrid} onOpenChange={setShowSeatGrid}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-primary" />
              {selectedBranch?.name} — Seat Map
            </DialogTitle>
            <DialogDescription>
              Click a seat to change its status. Colors indicate availability.
            </DialogDescription>
          </DialogHeader>
          {selectedBranch && (() => {
            const branchSeats = seats.filter(s => s.branchId === selectedBranch.id);
            const available = branchSeats.filter(s => s.status === 'available').length;
            const occupied = branchSeats.filter(s => s.status === 'occupied').length;
            const maintenance = branchSeats.filter(s => s.status === 'maintenance').length;

            return (
              <div className="space-y-4">
                {/* Legend & Stats */}
                <div className="flex flex-wrap gap-4 text-sm">
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

                {/* Grid */}
                <TooltipProvider delayDuration={200}>
                  <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {branchSeats.map(seat => {
                      const statusColor = seat.status === 'available'
                        ? 'bg-success/15 border-success/30 hover:bg-success/25 text-success'
                        : seat.status === 'occupied'
                        ? 'bg-destructive/15 border-destructive/30 hover:bg-destructive/25 text-destructive'
                        : 'bg-warning/15 border-warning/30 hover:bg-warning/25 text-warning';

                      const cycleStatus = () => {
                        const next: Record<string, Seat['status']> = {
                          available: 'occupied',
                          occupied: 'maintenance',
                          maintenance: 'available',
                        };
                        updateSeatStatus(seat.id, next[seat.status]);
                        toast.success(`Seat ${seat.number} → ${next[seat.status]}`);
                      };

                      return (
                        <Tooltip key={seat.id}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={cycleStatus}
                              className={cn(
                                'relative flex flex-col items-center justify-center rounded-lg border p-2.5 transition-all cursor-pointer aspect-square',
                                statusColor
                              )}
                            >
                              <Armchair className="h-4 w-4 mb-0.5" />
                              <span className="text-xs font-bold">{seat.number}</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs space-y-1 max-w-[180px]">
                            <p className="font-semibold">Seat #{seat.number}</p>
                            <p className="capitalize">Status: {seat.status}</p>
                            <p className="flex items-center gap-1"><Cpu className="h-3 w-3" /> {seat.gpuModel}</p>
                            {seat.playerName && <p className="flex items-center gap-1"><User className="h-3 w-3" /> {seat.playerName}</p>}
                            {seat.startTime && <p className="flex items-center gap-1"><Clock className="h-3 w-3" /> Since {seat.startTime}</p>}
                            <p className="text-muted-foreground italic mt-1">Click to cycle status</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </TooltipProvider>

                {branchSeats.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Armchair className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No seats configured for this branch yet</p>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
