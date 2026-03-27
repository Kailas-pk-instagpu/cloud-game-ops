import { StatCard } from '@/shared/ui/molecules/StatCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MOCK_BRANCHES, MOCK_USERS, MOCK_SEATS, REVENUE_DATA } from '@/shared/lib/mock-data';
import { Building2, DollarSign, TrendingUp, Users, Star, Clock, ArrowUpRight, UserCheck, BarChart3, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { StatusBadge } from '@/shared/ui/atoms/StatusBadge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';

const PEAK_HOURS = [
  { hour: '10AM', customers: 12 }, { hour: '12PM', customers: 28 }, { hour: '2PM', customers: 35 },
  { hour: '4PM', customers: 42 }, { hour: '6PM', customers: 55 }, { hour: '8PM', customers: 48 },
  { hour: '10PM', customers: 32 },
];

const CUSTOMER_STATS = {
  totalToday: 86,
  avgSessionTime: '2.4 hrs',
  repeatRate: '62%',
  peakTime: '6:00 PM',
  avgSpend: '$14.50',
  satisfaction: 4.6,
};

export default function CafeOwnerDashboard() {
  const navigate = useNavigate();
  const myBranches = MOCK_BRANCHES.filter(b => b.cafeId === 'cafe-1');
  const totalSeats = myBranches.reduce((a, b) => a + b.totalSeats, 0);
  const activeSeats = myBranches.reduce((a, b) => a + b.activeSeats, 0);
  const occupancy = Math.round((activeSeats / totalSeats) * 100);
  const myManagers = MOCK_USERS.filter(u => u.role === 'manager' && u.createdBy === '4');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Business</h1>
          <p className="text-muted-foreground text-sm mt-1">Overview of your gaming cafes and operations</p>
        </div>
        <Button className="gradient-primary text-primary-foreground gap-2" onClick={() => navigate('/branches')}>
          <Plus className="h-4 w-4" /> Add Branch
        </Button>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <StatCard title="This Week's Earnings" value="$12,400" icon={DollarSign} trend={{ value: 8, positive: true }} iconClassName="bg-success/10 text-success" />
        <StatCard title="My Branches" value={myBranches.length} icon={Building2} iconClassName="bg-primary/10 text-primary" />
        <StatCard title="Seat Occupancy" value={`${occupancy}%`} subtitle={`${activeSeats}/${totalSeats} seats`} icon={Users} iconClassName="bg-info/10 text-info" />
        <StatCard title="My Managers" value={myManagers.length} subtitle="Active staff" icon={UserCheck} iconClassName="bg-warning/10 text-warning" />
        <StatCard title="Avg Session" value={CUSTOMER_STATS.avgSessionTime} icon={Clock} subtitle="Per customer" iconClassName="bg-accent-foreground/10 text-accent-foreground" />
        <StatCard title="Rating" value={`${CUSTOMER_STATS.satisfaction}/5`} icon={Star} subtitle="Customer rating" iconClassName="bg-destructive/10 text-destructive" />
      </div>

      {/* Earnings Chart + Peak Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">💰 Weekly Earnings</CardTitle>
            <CardDescription>Revenue across all your branches</CardDescription>
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">📊 Peak Hours</CardTitle>
            <CardDescription>When your branches are busiest today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={PEAK_HOURS}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="hour" tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v: number) => [`${v} customers`, 'Traffic']} />
                  <Bar dataKey="customers" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Insights + Manager Performance + Branches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">👥 Customer Insights</CardTitle>
            <CardDescription>Today's customer metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Total Customers Today', value: CUSTOMER_STATS.totalToday, icon: '👤' },
              { label: 'Average Spend', value: CUSTOMER_STATS.avgSpend, icon: '💵' },
              { label: 'Repeat Customer Rate', value: CUSTOMER_STATS.repeatRate, icon: '🔄' },
              { label: 'Peak Time', value: CUSTOMER_STATS.peakTime, icon: '⏰' },
              { label: 'Avg Session Duration', value: CUSTOMER_STATS.avgSessionTime, icon: '🎮' },
            ].map((stat, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <span className="text-base">{stat.icon}</span>
                  <span className="text-sm">{stat.label}</span>
                </div>
                <span className="text-sm font-semibold">{stat.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">👨‍💼 Manager Performance</CardTitle>
            <CardDescription>Your branch managers' activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {myManagers.map(manager => {
              const branch = MOCK_BRANCHES.find(b => b.managerId === manager.id);
              return (
                <div key={manager.id} className="p-3 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{manager.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{manager.name}</p>
                        <p className="text-xs text-muted-foreground">{branch?.name || 'Unassigned'}</p>
                      </div>
                    </div>
                    <StatusBadge status="active" />
                  </div>
                  {branch && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Seat Utilization</span>
                        <span>{Math.round((branch.activeSeats / branch.totalSeats) * 100)}%</span>
                      </div>
                      <Progress value={(branch.activeSeats / branch.totalSeats) * 100} className="h-1.5" />
                    </div>
                  )}
                </div>
              );
            })}
            {myManagers.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No managers assigned yet</p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">🏢 My Branches</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate('/branches')}>
                  View All <ArrowUpRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {myBranches.map(branch => (
                <div key={branch.id} className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold">{branch.name}</h3>
                    <StatusBadge status={branch.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{branch.address}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs"><strong>{branch.activeSeats}</strong>/{branch.totalSeats} seats</span>
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => navigate('/branches')}>Manage</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
