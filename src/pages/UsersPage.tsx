import { useState, useCallback } from 'react';
import { useAuthStore } from '@/shared/lib/store';
import { MOCK_USERS } from '@/shared/lib/mock-data';
import { User, Role, ROLE_LABELS, CHILD_ROLE } from '@/shared/types/auth';
import { canCreateRole, canManageUser } from '@/shared/lib/rbac';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Plus, Search, Users as UsersIcon, ChevronRight, MoreVertical,
  Edit, Trash2, ShieldOff, ShieldCheck, KeyRound, UserX, UserCheck,
  Mail, Phone, MapPin, Calendar, Shield, ArrowLeft, ChevronDown,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

type UserStatus = 'active' | 'disabled';

interface ManagedUser extends User {
  status: UserStatus;
}

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<ManagedUser[]>(
    MOCK_USERS.map(u => ({ ...u, status: 'active' as UserStatus }))
  );
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Dialog states
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [detailUser, setDetailUser] = useState<ManagedUser | null>(null);
  const [detailHistory, setDetailHistory] = useState<ManagedUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<Role | ''>('');
  const [formPhone, setFormPhone] = useState('');

  if (!currentUser) return null;

  const isSuperAdmin = currentUser.role === 'super_admin';
  const childRole = canCreateRole(currentUser.role);

  // Super Admin sees all; others see manageable users
  const visibleUsers = users
    .filter(u => {
      if (u.id === currentUser.id) return false; // don't show self
      if (isSuperAdmin) return true;
      return canManageUser(currentUser.role, u.role);
    })
    .filter(u => roleFilter === 'all' || u.role === roleFilter)
    .filter(u =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    );

  // Roles that the current user can create
  const creatableRoles: Role[] = isSuperAdmin
    ? ['admin', 'cafe_owner', 'manager']
    : childRole ? [childRole] : [];

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormRole('');
    setFormPhone('');
  };

  const openCreate = () => {
    resetForm();
    if (!isSuperAdmin && childRole) setFormRole(childRole);
    setShowCreate(true);
  };

  const openEdit = (u: ManagedUser) => {
    setSelectedUser(u);
    setFormName(u.name);
    setFormEmail(u.email);
    setFormRole(u.role);
    setFormPhone(u.phone || '');
    setShowEdit(true);
  };

  const openDelete = (u: ManagedUser) => {
    setSelectedUser(u);
    setShowDelete(true);
  };

  const handleCreate = () => {
    if (!formName.trim() || !formEmail.trim() || !formRole) return;
    const newUser: ManagedUser = {
      id: `user-${Date.now()}`,
      name: formName.trim(),
      email: formEmail.trim(),
      role: formRole as Role,
      createdBy: currentUser.id,
      assignedScope: [],
      is2FAEnabled: false,
      twoFAMethod: null,
      phone: formPhone || undefined,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'active',
    };
    setUsers(prev => [...prev, newUser]);
    setShowCreate(false);
    resetForm();
    toast.success(`${ROLE_LABELS[newUser.role]} "${newUser.name}" created successfully`);
  };

  const handleEdit = () => {
    if (!selectedUser || !formName.trim() || !formEmail.trim()) return;
    setUsers(prev => prev.map(u =>
      u.id === selectedUser.id
        ? { ...u, name: formName.trim(), email: formEmail.trim(), phone: formPhone || undefined }
        : u
    ));
    setShowEdit(false);
    setSelectedUser(null);
    resetForm();
    toast.success('User updated successfully');
  };

  const handleDelete = () => {
    if (!selectedUser) return;
    setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
    setShowDelete(false);
    toast.success(`User "${selectedUser.name}" has been deleted`);
    setSelectedUser(null);
  };

  const toggleUserStatus = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      const newStatus = u.status === 'active' ? 'disabled' : 'active';
      toast.success(`User "${u.name}" has been ${newStatus === 'active' ? 'enabled' : 'disabled'}`);
      return { ...u, status: newStatus };
    }));
  };

  const toggle2FA = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      const toggled = !u.is2FAEnabled;
      toast.success(`2FA ${toggled ? 'enabled' : 'disabled'} for "${u.name}"`);
      return { ...u, is2FAEnabled: toggled, twoFAMethod: toggled ? 'email' : null };
    }));
  };

  const reset2FA = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      toast.success(`2FA reset for "${u.name}"`);
      return { ...u, is2FAEnabled: false, twoFAMethod: null };
    }));
  };

  const canActOn = (target: ManagedUser) => {
    if (isSuperAdmin) return true;
    return canManageUser(currentUser.role, target.role);
  };

  const openDetail = (u: ManagedUser) => {
    setDetailUser(u);
    setDetailHistory([]);
    setShowDetail(true);
  };

  const navigateToUser = (u: ManagedUser) => {
    setDetailHistory(prev => detailUser ? [...prev, detailUser] : prev);
    setDetailUser(u);
  };

  const navigateBack = () => {
    const prev = [...detailHistory];
    const last = prev.pop();
    if (last) {
      setDetailUser(last);
      setDetailHistory(prev);
    }
  };

  const getSubordinates = (userId: string): ManagedUser[] => {
    return users.filter(u => u.createdBy === userId);
  };

  const getCreatorChain = (u: ManagedUser): ManagedUser[] => {
    const chain: ManagedUser[] = [];
    let current = u;
    while (current.createdBy) {
      const creator = users.find(c => c.id === current.createdBy);
      if (creator) {
        chain.unshift(creator as ManagedUser);
        current = creator as ManagedUser;
      } else break;
    }
    return chain;
  };

  // Hierarchy breadcrumb
  const hierarchy = ['Super Admin', 'Admin', 'Cafe Owner', 'Manager'];
  const currentIndex = hierarchy.indexOf(ROLE_LABELS[currentUser.role]);

  const statusColor = (status: UserStatus) =>
    status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20';

  const roleColor = (role: Role) => {
    const map: Record<Role, string> = {
      super_admin: 'bg-primary/10 text-primary border-primary/20',
      admin: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      cafe_owner: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      manager: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
    };
    return map[role];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isSuperAdmin ? 'Full control over all platform users' : 'Manage users within your scope'}
          </p>
        </div>
        {creatableRoles.length > 0 && (
          <Button onClick={openCreate} className="gradient-primary text-primary-foreground gap-2">
            <Plus className="h-4 w-4" />
            Create User
          </Button>
        )}
      </div>

      {/* Hierarchy breadcrumb */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
        {hierarchy.slice(currentIndex).map((role, i) => (
          <span key={role} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3 w-3" />}
            <span className={i === 0 ? 'text-foreground font-medium' : ''}>{role}</span>
          </span>
        ))}
      </div>

      {/* Search + Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-2 flex-1 min-w-[200px]">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            className="border-0 bg-transparent focus-visible:ring-0"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="cafe_owner">Cafe Owner</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['admin', 'cafe_owner', 'manager'] as Role[]).map(r => (
          <Card key={r} className="p-3">
            <p className="text-xs text-muted-foreground">{ROLE_LABELS[r]}s</p>
            <p className="text-xl font-bold">{users.filter(u => u.role === r).length}</p>
          </Card>
        ))}
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Disabled</p>
          <p className="text-xl font-bold text-destructive">{users.filter(u => u.status === 'disabled').length}</p>
        </Card>
      </div>

      {/* User List */}
      <div className="grid gap-3">
        {visibleUsers.map(u => (
          <Card key={u.id} className={`transition-shadow hover:shadow-sm ${u.status === 'disabled' ? 'opacity-60' : ''}`}>
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${u.status === 'disabled' ? 'bg-muted text-muted-foreground' : 'gradient-primary text-primary-foreground'}`}>
                  {u.name.split(' ').map(n => n[0]).join('')}
                </div>
              <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm truncate">{u.name}</p>
                    {u.status === 'disabled' && (
                      <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20">Disabled</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  {(() => {
                    const chain: string[] = [];
                    const creator = users.find(c => c.id === u.createdBy);
                    if (creator) {
                      chain.push(`${ROLE_LABELS[creator.role]}: ${creator.name}`);
                      const grandCreator = users.find(c => c.id === creator.createdBy);
                      if (grandCreator) {
                        chain.unshift(`${ROLE_LABELS[grandCreator.role]}: ${grandCreator.name}`);
                      }
                    }
                    return chain.length > 0 ? (
                      <p className="text-[11px] text-muted-foreground/70 mt-0.5 truncate">
                        {chain.join(' → ')}
                      </p>
                    ) : null;
                  })()}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className={`text-[10px] ${roleColor(u.role)}`}>
                  {ROLE_LABELS[u.role]}
                </Badge>
                {u.is2FAEnabled && (
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">2FA</Badge>
                )}
                {canActOn(u) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => openEdit(u)} className="gap-2">
                        <Edit className="h-4 w-4" /> Edit User
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleUserStatus(u.id)} className="gap-2">
                        {u.status === 'active' ? (
                          <><UserX className="h-4 w-4" /> Disable User</>
                        ) : (
                          <><UserCheck className="h-4 w-4" /> Enable User</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {u.is2FAEnabled ? (
                        <DropdownMenuItem onClick={() => reset2FA(u.id)} className="gap-2">
                          <ShieldOff className="h-4 w-4" /> Reset 2FA
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => toggle2FA(u.id)} className="gap-2">
                          <ShieldCheck className="h-4 w-4" /> Enable 2FA
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => toast.success(`Password reset link sent to ${u.email}`)} className="gap-2">
                        <KeyRound className="h-4 w-4" /> Reset Password
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => openDelete(u)} className="gap-2 text-destructive focus:text-destructive">
                        <Trash2 className="h-4 w-4" /> Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {visibleUsers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <UsersIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No users found</p>
          </div>
        )}
      </div>

      {/* Create User Dialog */}
      <Dialog open={showCreate} onOpenChange={v => { if (!v) resetForm(); setShowCreate(v); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              {isSuperAdmin
                ? 'As Super Admin, you can create any role below you.'
                : `You are creating a ${childRole ? ROLE_LABELS[childRole] : 'user'}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {isSuperAdmin ? (
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={formRole} onValueChange={v => setFormRole(v as Role)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {creatableRoles.map(r => (
                      <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formRole && (
                  <p className="text-xs text-muted-foreground">
                    {formRole === 'admin' && 'This user will manage cafe owners and their portfolios.'}
                    {formRole === 'cafe_owner' && 'This user will manage their own branches and create managers.'}
                    {formRole === 'manager' && 'This user will only have access to an assigned branch.'}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-sm">
                <p className="font-medium text-primary">Creating: {childRole ? ROLE_LABELS[childRole] : ''}</p>
                <p className="text-xs text-muted-foreground mt-1">Role is automatically assigned based on your permission level</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input placeholder="Enter full name" value={formName} onChange={e => setFormName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input type="email" placeholder="user@example.com" value={formEmail} onChange={e => setFormEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Phone (optional)</Label>
              <Input type="tel" placeholder="+1 555 000 0000" value={formPhone} onChange={e => setFormPhone(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); }}>Cancel</Button>
            <Button
              onClick={handleCreate}
              className="gradient-primary text-primary-foreground"
              disabled={!formName.trim() || !formEmail.trim() || !formRole}
            >
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEdit} onOpenChange={v => { if (!v) { setSelectedUser(null); resetForm(); } setShowEdit(v); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update details for {selectedUser?.name} ({selectedUser ? ROLE_LABELS[selectedUser.role] : ''})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 rounded-lg bg-muted/50 text-sm flex items-center justify-between">
              <span className="text-muted-foreground">Role</span>
              <Badge variant="outline" className={`${selectedUser ? roleColor(selectedUser.role) : ''}`}>
                {selectedUser ? ROLE_LABELS[selectedUser.role] : ''}
              </Badge>
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input type="tel" value={formPhone} onChange={e => setFormPhone(e.target.value)} />
            </div>
            {selectedUser && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium">Account Status</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedUser.status === 'active' ? 'User can access the platform' : 'User is blocked from access'}
                  </p>
                </div>
                <Switch
                  checked={selectedUser.status === 'active'}
                  onCheckedChange={() => {
                    toggleUserStatus(selectedUser.id);
                    setSelectedUser(prev => prev ? { ...prev, status: prev.status === 'active' ? 'disabled' : 'active' } : null);
                  }}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEdit(false); setSelectedUser(null); resetForm(); }}>Cancel</Button>
            <Button onClick={handleEdit} className="gradient-primary text-primary-foreground" disabled={!formName.trim() || !formEmail.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDelete} onOpenChange={v => { if (!v) setSelectedUser(null); setShowDelete(v); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete <strong>{selectedUser?.name}</strong> ({selectedUser ? ROLE_LABELS[selectedUser.role] : ''})?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
