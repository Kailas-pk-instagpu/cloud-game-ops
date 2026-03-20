import { StatCard } from '@/shared/ui/molecules/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MOCK_USERS, MOCK_BRANCHES, REVENUE_DATA } from '@/shared/lib/mock-data';
import { Building2, DollarSign, Users, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StatusBadge } from '@/shared/ui/atoms/StatusBadge';

export default function AdminDashboard() {
  const cafeOwners = MOCK_USERS.filter(u => u.role === 'cafe_owner');
  const managers = MOCK_USERS.filter(u => u.role === 'manager');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your portfolio of cafes and operators</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Portfolio Revenue" value="$95,200" icon={DollarSign} trend={{ value: 15, positive: true }} iconClassName="bg-success/10 text-success" />
        <StatCard title="Cafe Owners" value={cafeOwners.length} icon={Users} subtitle="Active operators" iconClassName="bg-primary/10 text-primary" />
        <StatCard title="Branches" value={MOCK_BRANCHES.length} icon={Building2} subtitle="Across all cafes" iconClassName="bg-info/10 text-info" />
        <StatCard title="Managers" value={managers.length} icon={TrendingUp} subtitle="On-ground staff" iconClassName="bg-warning/10 text-warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Weekly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={REVENUE_DATA}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 12 }} tickFormatter={v => `$${v}`} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="revenue" fill="hsl(234, 89%, 64%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Branch Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {MOCK_BRANCHES.map(branch => (
              <div key={branch.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium">{branch.name}</p>
                  <p className="text-xs text-muted-foreground">{branch.address}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{branch.activeSeats}/{branch.totalSeats} seats</span>
                  <StatusBadge status={branch.status} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
