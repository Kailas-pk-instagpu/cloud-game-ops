import { MOCK_BRANCHES } from '@/shared/lib/mock-data';
import { StatusBadge } from '@/shared/ui/atoms/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, Monitor, Plus } from 'lucide-react';

export default function BranchesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Branches</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage gaming cafe locations</p>
        </div>
        <Button className="gradient-primary text-primary-foreground gap-2">
          <Plus className="h-4 w-4" /> Add Branch
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MOCK_BRANCHES.map(branch => (
          <Card key={branch.id} className="hover:shadow-md transition-shadow">
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
                <p className="flex items-center gap-1.5"><Monitor className="h-3.5 w-3.5" /> {branch.activeSeats} active / {branch.totalSeats} total seats</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">Manage</Button>
                <Button variant="outline" size="sm">Settings</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
