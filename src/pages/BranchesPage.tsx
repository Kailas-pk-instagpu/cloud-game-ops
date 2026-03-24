import { useState } from 'react';
import { useBranchStore } from '@/shared/lib/store';
import { useAuthStore } from '@/shared/lib/store';
import { MOCK_USERS } from '@/shared/lib/mock-data';
import { Branch } from '@/shared/lib/mock-data';
import { StatusBadge } from '@/shared/ui/atoms/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Building2, MapPin, Monitor, Plus, Settings, Edit, Power, Trash2, UserCheck, Armchair } from 'lucide-react';
import { toast } from 'sonner';

interface BranchForm {
  name: string;
  address: string;
  cafeId: string;
  totalSeats: number;
  managerId: string;
}

const emptyForm: BranchForm = { name: '', address: '', cafeId: '', totalSeats: 10, managerId: '' };

export default function BranchesPage() {
  const { branches, addBranch, updateBranch, deleteBranch, toggleBranchStatus } = useBranchStore();
  const currentUser = useAuthStore(s => s.user);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [form, setForm] = useState<BranchForm>(emptyForm);

  const managers = MOCK_USERS.filter(u => u.role === 'manager');

  const handleAdd = () => {
    setForm(emptyForm);
    setShowAddDialog(true);
  };

  const handleManage = (branch: Branch) => {
    setSelectedBranch(branch);
    setForm({
      name: branch.name,
      address: branch.address,
      cafeId: branch.cafeId,
      totalSeats: branch.totalSeats,
      managerId: managers.find(m => m.assignedScope.includes(branch.id))?.id || '',
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

  const BranchFormFields = ({ isEdit }: { isEdit: boolean }) => (
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

      {/* Step 3: Manager */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Step 3 — Assign Manager
        </p>
        <div>
          <Label htmlFor="manager">Branch Manager</Label>
          <Select value={form.managerId} onValueChange={v => setForm(f => ({ ...f, managerId: v }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select a manager (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No manager assigned</SelectItem>
              {managers.map(m => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name} ({m.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">This manager will have access to manage this branch only</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Branches</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage gaming cafe locations and seat configurations</p>
        </div>
        <Button className="gradient-primary text-primary-foreground gap-2" onClick={handleAdd}>
          <Plus className="h-4 w-4" /> Add Branch
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Branches', value: branches.length, icon: Building2 },
          { label: 'Active', value: branches.filter(b => b.status === 'active').length, icon: Power },
          { label: 'Total Seats', value: branches.reduce((s, b) => s + b.totalSeats, 0), icon: Armchair },
          { label: 'Active Seats', value: branches.reduce((s, b) => s + b.activeSeats, 0), icon: Monitor },
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
        {branches.map(branch => {
          const manager = managers.find(m => m.assignedScope.includes(branch.id));
          return (
            <Card key={branch.id} className={`hover:shadow-md transition-shadow ${branch.status === 'inactive' ? 'opacity-60' : ''}`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">{branch.name}</h3>
                  </div>
                  <StatusBadge status={branch.status} />
                </div>
                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {branch.address}</p>
                  <p className="flex items-center gap-1.5"><Armchair className="h-3.5 w-3.5" /> {branch.activeSeats} active / {branch.totalSeats} total seats</p>
                  <p className="flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5" />
                    {manager ? `Manager: ${manager.name}` : 'No manager assigned'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => handleManage(branch)}>
                    <Edit className="h-3.5 w-3.5" /> Manage
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleSettings(branch)}>
                    <Settings className="h-3.5 w-3.5" /> Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Branch Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> Add New Branch</DialogTitle>
            <DialogDescription>Set up a new gaming cafe location with seats and manager</DialogDescription>
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
            <DialogDescription>Update branch details, seats, and manager assignment</DialogDescription>
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

      {/* Delete Confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Branch?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedBranch?.name}"? This action cannot be undone. All seats and data associated with this branch will be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
