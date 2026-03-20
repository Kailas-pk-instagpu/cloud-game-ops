import { useState } from 'react';
import { useAuthStore } from '@/shared/lib/store';
import { MOCK_USERS } from '@/shared/lib/mock-data';
import { User, ROLE_LABELS, CHILD_ROLE } from '@/shared/types/auth';
import { canCreateRole, canManageUser } from '@/shared/lib/rbac';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Users as UsersIcon, ChevronRight } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');

  if (!currentUser) return null;

  const childRole = canCreateRole(currentUser.role);
  const visibleUsers = MOCK_USERS.filter(u => {
    if (currentUser.role === 'super_admin') return true;
    return canManageUser(currentUser.role, u.role);
  }).filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    // Mock create — just close dialog
    setShowCreate(false);
    setNewName('');
    setNewEmail('');
  };

  // Build hierarchy breadcrumb
  const hierarchy = ['Super Admin', 'Admin', 'Cafe Owner', 'Manager'];
  const currentIndex = hierarchy.indexOf(ROLE_LABELS[currentUser.role]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage users within your scope</p>
        </div>
        {childRole && (
          <Button onClick={() => setShowCreate(true)} className="gradient-primary text-primary-foreground gap-2">
            <Plus className="h-4 w-4" />
            Add {ROLE_LABELS[childRole]}
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

      <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          className="border-0 bg-transparent focus-visible:ring-0"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-3">
        {visibleUsers.map(u => (
          <Card key={u.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                  {u.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-medium text-sm">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize text-xs">{ROLE_LABELS[u.role]}</Badge>
                {u.is2FAEnabled && <Badge className="bg-success/10 text-success border-success/20 text-[10px]">2FA</Badge>}
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
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New {childRole ? ROLE_LABELS[childRole] : 'User'}</DialogTitle>
            <DialogDescription>
              {childRole === 'admin' && "This user will be able to manage cafe owners in their assigned portfolio."}
              {childRole === 'cafe_owner' && "This user will manage their own branches and create managers."}
              {childRole === 'manager' && "This user will only have access to the assigned branch."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-sm">
              <p className="font-medium text-primary">Creating: {childRole ? ROLE_LABELS[childRole] : ''}</p>
              <p className="text-xs text-muted-foreground mt-1">Role is automatically assigned based on your permission level</p>
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input placeholder="Enter full name" value={newName} onChange={e => setNewName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input type="email" placeholder="user@example.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} className="gradient-primary text-primary-foreground" disabled={!newName.trim() || !newEmail.trim()}>
              Create {childRole ? ROLE_LABELS[childRole] : 'User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
