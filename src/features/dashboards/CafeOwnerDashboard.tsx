import { StatCard } from '@/shared/ui/molecules/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MOCK_BRANCHES, REVENUE_DATA } from '@/shared/lib/mock-data';
import { Building2, DollarSign, TrendingUp, Users } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { StatusBadge } from '@/shared/ui/atoms/StatusBadge';

export default function CafeOwnerDashboard() {
  const myBranches = MOCK_BRANCHES.filter(b => b.cafeId === 'cafe-1');
  const totalSeats = myBranches.reduce((a, b) => a + b.totalSeats, 0);
  const activeSeats = myBranches.reduce((a, b) => a + b.activeSeats, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Business</h1>
          <p className="text-muted-foreground text-sm mt-1">Overview of your gaming cafes</p>
        </div>
        <Button className="gradient-primary text-primary-foreground gap-2">
          <Plus className="h-4 w-4" /> Add Branch
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="This Week's Earnings" value="$12,400" icon={DollarSign} trend={{ value: 8, positive: true }} iconClassName="bg-success/10 text-success" />
        <StatCard title="My Branches" value={myBranches.length} icon={Building2} iconClassName="bg-primary/10 text-primary" />
        <StatCard title="Total Seats" value={totalSeats} subtitle={`${activeSeats} currently in use`} icon={Users} iconClassName="bg-info/10 text-info" />
        <StatCard title="Growth" value="+18%" icon={TrendingUp} subtitle="vs last month" iconClassName="bg-warning/10 text-warning" />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">💰 Weekly Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_DATA}>
                <defs>
                  <linearGradient id="ownerRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(152, 69%, 41%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(152, 69%, 41%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 12 }} tickFormatter={v => `$${v}`} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(152, 69%, 41%)" fill="url(#ownerRevGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-3">🏢 My Branches</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myBranches.map(branch => (
            <Card key={branch.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{branch.name}</h3>
                  <StatusBadge status={branch.status} />
                </div>
                <p className="text-sm text-muted-foreground mb-3">{branch.address}</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-4 text-sm">
                    <span><strong>{branch.activeSeats}</strong> active</span>
                    <span className="text-muted-foreground">{branch.totalSeats} total seats</span>
                  </div>
                  <Button variant="outline" size="sm">Manage</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
