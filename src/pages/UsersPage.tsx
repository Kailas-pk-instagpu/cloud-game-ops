import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useCafeStore } from '@/shared/lib/store';
import { MOCK_USERS } from '@/shared/lib/mock-data';
import { User, Role, ROLE_LABELS, CHILD_ROLE } from '@/shared/types/auth';
import { canManageUser } from '@/shared/lib/rbac';
import { useCan, type Permission } from '@/shared/lib/permissions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Plus, Search, Users as UsersIcon, ChevronRight, MoreVertical,
  Edit, Trash2, ShieldOff, ShieldCheck, KeyRound, UserX, UserCheck,
  Phone,
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
import { AUTH_MODE, BffError } from '@/shared/lib/bff';
import { useBackendUsers, type ApiUser } from '@/features/users/usersApi';
import { useBackendCafes } from '@/features/cafes/cafesApi';

/** Backend mode: people come from auth-service; creating one makes their Keycloak login. VITE_AUTH_MODE=mock keeps the demo list. */
const BACKEND = AUTH_MODE === 'bff';

type UserStatus = 'active' | 'disabled';

interface ManagedUser extends User {
  status: UserStatus;
  /** Backend: the owner account (cafe owners, Floor Managers) and the cafes a Floor Manager runs. */
  tenantId?: string | null;
  tenantName?: string | null;
  cafes?: Array<{ id: string; name: string }>;
}

const fromApi = (u: ApiUser): ManagedUser => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  createdBy: u.created_by,
  assignedScope: u.cafes.map(c => c.id),
  is2FAEnabled: false,
  twoFAMethod: null,
  phone: u.phone ?? undefined,
  createdAt: u.created_at.split('T')[0],
  status: u.status === 'disabled' ? 'disabled' : 'active',
  tenantId: u.tenant_id,
  tenantName: u.tenant_name,
  cafes: u.cafes,
});

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const navigate = useNavigate();
  const [mockUsers, setUsers] = useState<ManagedUser[]>(
    MOCK_USERS.map(u => ({ ...u, status: 'active' as UserStatus }))
  );
  const backendUsers = useBackendUsers();
  const backendCafes = useBackendCafes();
  useEffect(() => {
    if (!BACKEND) return;
    void backendUsers.load();
    if (!backendCafes.loaded) void backendCafes.load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const users: ManagedUser[] = BACKEND ? backendUsers.users.map(fromApi) : mockUsers;
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Dialog states
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<Role | ''>('');
  const [formPhone, setFormPhone] = useState('');
  const [formCafe, setFormCafe] = useState('');
  const [creating, setCreating] = useState(false);
  // The one-time password of the person just created (backend), shown once.
  const [created, setCreated] = useState<{ name: string; email: string; role: Role; password: string; reset?: boolean } | null>(null);
  const mockCafes = useCafeStore(s => s.cafes);

  const can = useCan();
  if (!currentUser) return null;

  const isSuperAdmin = currentUser.role === 'super_admin';

  const isCafeOwner = currentUser.role === 'cafe_owner';

  // Cafe owners can add Floor Managers only once one of their cafes is Active.
  // Backend: the API returns only the owner's own cafes.
  const activeCafes = BACKEND ? backendCafes.cafes.filter(c => c.status === 'active') : [];
  const ownerHasActiveCafe = BACKEND
    ? activeCafes.length > 0
    : mockCafes.some(b => b.cafeOwnerId === currentUser.id && b.status === 'active');
  const createBlocked = isCafeOwner && !ownerHasActiveCafe;

  // On Cafe Management, only cafe owners open the cafes page.
  // Backend: a cafe owner's row opens their owner account's cafes; other rows do not open anything.
  const rowOpensCafes = (u: ManagedUser) =>
    BACKEND ? u.role === 'cafe_owner' && !!u.tenantId : currentUser.role === 'admin' ? u.role === 'cafe_owner' : true;
  const cafesLink = (u: ManagedUser) => `/cafes?owner=${BACKEND ? u.tenantId : u.id}`;

  // Super Admin sees all; others see manageable users.
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
  // Roles the current user may create (users.create.<role>); several -> a role picker, one -> fixed.
  const creatableRoles: Role[] = (['admin', 'cafe_owner', 'manager'] as const).filter(r => can(`users.create.${r}` as Permission));
  const childRole = creatableRoles.length === 1 ? creatableRoles[0] : null;
  const canPickRole = creatableRoles.length > 1;
  const canEditUser = can('users.edit');
  const canDisableUser = can('users.disable');
  const canReset2FA = can('users.reset_2fa');
  const canResetPassword = can('users.reset_password');
  const canDeleteUser = can('users.delete');
  // Backend: user actions are switched on role by role (Super Admin, Sales Manager, cafe owner: 2026-11-05); 2FA is on hold.
  // Which actions each role gets still comes from its permissions (Sales Manager: edit, disable / enable; cafe owner: edit,
  // disable / enable, reset password, on their own Floor Managers only).
  const BACKEND_ACTION_ROLES: Role[] = ['super_admin', 'admin', 'cafe_owner'];
  const backendActions = !BACKEND || BACKEND_ACTION_ROLES.includes(currentUser.role);
  const show2FA = canReset2FA && !BACKEND;
  const hasUserActions = backendActions && (canEditUser || canDisableUser || show2FA || canResetPassword || canDeleteUser);
  const fail = (e: unknown, what: string) => toast.error(e instanceof Error ? e.message : `Could not ${what}.`);

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormRole('');
    setFormPhone('');
    setFormCafe(activeCafes.length === 1 ? activeCafes[0].id : '');
  };

  const openCreate = () => {
    resetForm();
    if (childRole) setFormRole(childRole);
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


  const needsCafe = BACKEND && formRole === 'manager';
  const createReady = !!formName.trim() && !!formEmail.trim() && !!formRole && (!needsCafe || !!formCafe) && !creating;

  const handleCreateBackend = async () => {
    if (!createReady || !formRole || formRole === 'super_admin') return;
    setCreating(true);
    try {
      const r = await backendUsers.create(formRole, {
        full_name: formName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim() || undefined,
        cafe_id: formRole === 'manager' ? formCafe : undefined,
      });
      setShowCreate(false);
      resetForm();
      setCreated({ name: r.user.name, email: r.user.email, role: r.user.role, password: r.temporary_password });
      // A new owner account appears in the cafe lists (the Sales Manager adds its cafes next).
      if (formRole === 'cafe_owner') void backendCafes.load();
    } catch (e) {
      toast.error(e instanceof BffError || e instanceof Error ? e.message : 'Could not create the user.');
    } finally {
      setCreating(false);
    }
  };

  const handleCreate = () => {
    if (BACKEND) { void handleCreateBackend(); return; }
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
    if (BACKEND) {
      if (!selectedUser || !formName.trim()) return;
      const u = selectedUser;
      backendUsers.update(u.id, { full_name: formName.trim(), phone: formPhone.trim() || null })
        .then(() => { setShowEdit(false); setSelectedUser(null); resetForm(); toast.success('User updated successfully'); })
        .catch(e => fail(e, 'update the user'));
      return;
    }
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
    if (BACKEND) {
      if (!selectedUser) return;
      const u = selectedUser;
      backendUsers.remove(u.id)
        .then(() => toast.success(`User "${u.name}" has been deleted`))
        .catch(e => fail(e, 'delete the user'));
      setShowDelete(false);
      setSelectedUser(null);
      return;
    }
    if (!selectedUser) return;
    setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
    setShowDelete(false);
    toast.success(`User "${selectedUser.name}" has been deleted`);
    setSelectedUser(null);
  };

  const toggleUserStatus = (userId: string) => {
    if (BACKEND) {
      const u = users.find(x => x.id === userId);
      if (!u) return;
      const enable = u.status !== 'active';
      backendUsers.setEnabled(userId, enable)
        .then(() => toast.success(`User "${u.name}" has been ${enable ? 'enabled' : 'disabled'}`))
        .catch(e => fail(e, enable ? 'enable the user' : 'disable the user'));
      return;
    }
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

  // Backend: a new one-time password, shown once in the same dialog as after creating someone.
  const resetPassword = (u: ManagedUser) => {
    if (!BACKEND) { toast.success(`Password reset link sent to ${u.email}`); return; }
    backendUsers.resetPassword(u.id)
      .then(password => setCreated({ name: u.name, email: u.email, role: u.role, password, reset: true }))
      .catch(e => fail(e, 'reset the password'));
  };

  const canActOn = (target: ManagedUser) => {
    if (isSuperAdmin) return true;
    return canManageUser(currentUser.role, target.role);
  };


  // Hierarchy breadcrumb
  const hierarchy = [ROLE_LABELS.super_admin, ROLE_LABELS.admin, ROLE_LABELS.cafe_owner, ROLE_LABELS.manager];
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
          <h1 className="text-2xl font-bold tracking-tight">{currentUser?.role === 'admin' ? 'Cafe Management' : 'User Management'}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isSuperAdmin ? 'Full control over all platform users' : 'Manage users within your scope'}
          </p>
        </div>
        {creatableRoles.length > 0 && (
          <Button
            onClick={() => {
              if (createBlocked) {
                toast.error('You can add Floor Managers only after one of your cafes is Active and approved.');
                return;
              }
              openCreate();
            }}
            className="gradient-primary text-primary-foreground gap-2"
            disabled={createBlocked}
            title={createBlocked ? 'Available once one of your cafes is Active' : undefined}
          >
            <Plus className="h-4 w-4" />
            {currentUser.role === 'admin' ? 'Create Cafe Owner' : 'Create User'}
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
            <SelectItem value="admin">Sales Manager</SelectItem>
            <SelectItem value="cafe_owner">Cafe Owner</SelectItem>
            <SelectItem value="manager">Floor Manager</SelectItem>
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
          <Card
            key={u.id}
            className={`transition-shadow ${rowOpensCafes(u) ? 'hover:shadow-sm cursor-pointer' : ''} ${u.status === 'disabled' ? 'opacity-60' : ''}`}
            onClick={() => { if (rowOpensCafes(u)) navigate(cafesLink(u)); }}
          >
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
                    if (!BACKEND) return null;
                    // Floor Managers: the cafes they run. Cafe owners: every cafe of their owner account (pending ones too).
                    const names = u.role === 'manager'
                      ? (u.cafes ?? []).map(c => c.name)
                      : u.role === 'cafe_owner'
                        ? backendCafes.cafes.filter(c => c.tenantId === u.tenantId).map(c => c.name).sort((a, b) => a.localeCompare(b))
                        : [];
                    return names.length ? (
                      <p className="text-[11px] text-muted-foreground/70 mt-0.5 truncate">
                        {names.length > 1 ? 'Cafes' : 'Cafe'}: {names.join(', ')}
                      </p>
                    ) : null;
                  })()}
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
                {canActOn(u) && hasUserActions && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => e.stopPropagation()}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {canEditUser && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(u); }} className="gap-2">
                          <Edit className="h-4 w-4" /> Edit User
                        </DropdownMenuItem>
                      )}
                      {canDisableUser && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleUserStatus(u.id); }} className="gap-2">
                          {u.status === 'active' ? (
                            <><UserX className="h-4 w-4" /> Disable User</>
                          ) : (
                            <><UserCheck className="h-4 w-4" /> Enable User</>
                          )}
                        </DropdownMenuItem>
                      )}
                      {(show2FA || canResetPassword) && (canEditUser || canDisableUser) && <DropdownMenuSeparator />}
                      {show2FA && (u.is2FAEnabled ? (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); reset2FA(u.id); }} className="gap-2">
                          <ShieldOff className="h-4 w-4" /> Reset 2FA
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggle2FA(u.id); }} className="gap-2">
                          <ShieldCheck className="h-4 w-4" /> Enable 2FA
                        </DropdownMenuItem>
                      ))}
                      {canResetPassword && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); resetPassword(u); }} className="gap-2">
                          <KeyRound className="h-4 w-4" /> Reset Password
                        </DropdownMenuItem>
                      )}
                      {canDeleteUser && (
                        <>
                          {(canEditUser || canDisableUser || show2FA || canResetPassword) && <DropdownMenuSeparator />}
                          {/* Backend: delete is on hold (decided 2026-11-05), shown greyed out; the API exists (soft delete). */}
                          <DropdownMenuItem
                            disabled={BACKEND}
                            title={BACKEND ? 'Deleting users is on hold for now' : undefined}
                            onClick={(e) => { e.stopPropagation(); if (!BACKEND) openDelete(u); }}
                            className="gap-2 text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" /> Delete User{BACKEND && <span className="ml-auto text-[10px] text-muted-foreground">On hold</span>}
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {BACKEND && backendUsers.error && (
          <p className="text-sm text-destructive text-center">{backendUsers.error}</p>
        )}
        {visibleUsers.length === 0 && !(BACKEND && !backendUsers.loaded) && (
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
            <DialogTitle>{currentUser.role === 'admin' ? 'Create Cafe Owner' : 'Create New User'}</DialogTitle>
            <DialogDescription>
              {canPickRole
                ? 'As Super Admin, you can create any role below you.'
                : `You are creating a ${childRole ? ROLE_LABELS[childRole] : 'user'}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {canPickRole ? (
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
                    {formRole === 'cafe_owner' && 'This user will manage their own cafes and create floor managers.'}
                    {formRole === 'manager' && 'This user will only have access to an assigned cafe.'}
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
            {BACKEND && formRole === 'cafe_owner' && (
              <p className="text-xs text-muted-foreground">Add this owner's cafes from the Cafes page next.</p>
            )}
            {needsCafe && (
              <div className="space-y-2">
                <Label>Cafe</Label>
                <Select value={formCafe} onValueChange={setFormCafe}>
                  <SelectTrigger><SelectValue placeholder="Choose the cafe they will run" /></SelectTrigger>
                  <SelectContent>
                    {activeCafes.map(c => (
                      <SelectItem key={c.id} value={c.id}>{currentUser.role === 'super_admin' && c.tenantName ? `${c.name} (${c.tenantName})` : c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {activeCafes.length === 0 && <p className="text-xs text-muted-foreground">No active cafe yet: a cafe must be approved first.</p>}
              </div>
            )}
            {BACKEND && (
              <p className="text-xs text-muted-foreground">A login is created for this person. You get a one-time password to give them; they choose their own at first sign-in.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); }}>Cancel</Button>
            <Button
              onClick={handleCreate}
              className="gradient-primary text-primary-foreground"
              disabled={!createReady}
            >
              {creating ? 'Creating…' : currentUser.role === 'admin' ? 'Create Cafe Owner' : 'Create User'}
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
              <Input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} readOnly={BACKEND} disabled={BACKEND} />
              {BACKEND && <p className="text-xs text-muted-foreground">The e-mail is the sign-in and cannot be changed.</p>}
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
            <Button onClick={handleEdit} className="gradient-primary text-primary-foreground" disabled={!formName.trim() || (!BACKEND && !formEmail.trim())}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* One-time password of the person just created (backend) */}
      <Dialog open={!!created} onOpenChange={v => { if (!v) setCreated(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{created ? (created.reset ? 'Password reset' : `${ROLE_LABELS[created.role]} created`) : ''}</DialogTitle>
            <DialogDescription>
              Give {created?.name} this one-time password. They sign in with {created?.email} and must choose their own password at {created?.reset ? 'their next' : 'first'} sign-in. It is shown only now.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input readOnly value={created?.password ?? ''} className="font-mono" onFocus={e => e.currentTarget.select()} />
            <Button variant="outline" onClick={() => { if (created) void navigator.clipboard?.writeText(created.password).then(() => toast.success('Password copied')); }}>
              Copy
            </Button>
          </div>
          <DialogFooter>
            <Button className="gradient-primary text-primary-foreground" onClick={() => setCreated(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDelete} onOpenChange={v => { if (!v) setSelectedUser(null); setShowDelete(v); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              {BACKEND ? (
                <>Delete <strong>{selectedUser?.name}</strong> ({selectedUser ? ROLE_LABELS[selectedUser.role] : ''})? Their login is removed and they
                lose access at once. Their history (sessions, bills, audit) is kept.</>
              ) : (
                <>Are you sure you want to permanently delete <strong>{selectedUser?.name}</strong> ({selectedUser ? ROLE_LABELS[selectedUser.role] : ''})?
                This action cannot be undone.</>
              )}
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
