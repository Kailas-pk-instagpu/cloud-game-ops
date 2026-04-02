import { StatCard } from '@/shared/ui/molecules/StatCard';
import { StatusBadge } from '@/shared/ui/atoms/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MOCK_GPU_NODES, MOCK_USERS, MOCK_BRANCHES, MOCK_SEATS, REVENUE_DATA, MONTHLY_REVENUE } from '@/shared/lib/mock-data';
import { Cpu, DollarSign, Users, Zap, AlertTriangle, TrendingUp, Building2, Shield, Activity, Server, HardDrive, Clock, UserCheck, UserX, Globe } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const ROLE_DISTRIBUTION = [
  { name: 'Admins', value: MOCK_USERS.filter(u => u.role === 'admin').length, color: 'hsl(234, 89%, 64%)' },
  { name: 'Cafe Owners', value: MOCK_USERS.filter(u => u.role === 'cafe_owner').length, color: 'hsl(152, 69%, 41%)' },
  { name: 'Managers', value: MOCK_USERS.filter(u => u.role === 'manager').length, color: 'hsl(38, 92%, 50%)' },
];

const HOURLY_LOAD = [
  { hour: '6AM', load: 12 }, { hour: '8AM', load: 35 }, { hour: '10AM', load: 58 },
  { hour: '12PM', load: 72 }, { hour: '2PM', load: 85 }, { hour: '4PM', load: 92 },
  { hour: '6PM', load: 98 }, { hour: '8PM', load: 88 }, { hour: '10PM', load: 65 }, { hour: '12AM', load: 30 },
];

const SYSTEM_METRICS = [
  { name: 'API Latency', value: '42ms', status: 'healthy' },
  { name: 'Database Load', value: '23%', status: 'healthy' },
  { name: 'CDN Hit Rate', value: '96.8%', status: 'healthy' },
  { name: 'Error Rate', value: '0.12%', status: 'healthy' },
  { name: 'Auth Service', value: 'Online', status: 'healthy' },
  { name: 'Payment Gateway', value: 'Online', status: 'healthy' },
];

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const totalSeats = MOCK_BRANCHES.reduce((a, b) => a + b.totalSeats, 0);
  const activeSeats = MOCK_BRANCHES.reduce((a, b) => a + b.activeSeats, 0);
  const occupancyRate = Math.round((activeSeats / totalSeats) * 100);
  const onlineNodes = MOCK_GPU_NODES.filter(n => n.status === 'online').length;
  const avgUtilization = Math.round(MOCK_GPU_NODES.filter(n => n.status !== 'offline').reduce((a, b) => a + b.utilization, 0) / MOCK_GPU_NODES.filter(n => n.status !== 'offline').length);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Command Center</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">Complete platform overview and GPU infrastructure monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-success"><span className="w-2 h-2 rounded-full bg-success animate-pulse" /> All Systems Operational</span>
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
        <StatCard title="Total Revenue" value="$138,400" icon={DollarSign} trend={{ value: 12.5, positive: true }} iconClassName="bg-success/10 text-success" />
        <StatCard title="Active Sessions" value="186" icon={Zap} trend={{ value: 8, positive: true }} iconClassName="bg-info/10 text-info" />
        <StatCard title="GPU Nodes" value={`${onlineNodes}/${MOCK_GPU_NODES.length}`} subtitle={`Avg ${avgUtilization}% util`} icon={Cpu} iconClassName="bg-primary/10 text-primary" />
        <StatCard title="Total Users" value={MOCK_USERS.length} subtitle="Across all roles" icon={Users} iconClassName="bg-warning/10 text-warning" />
        <StatCard title="Branches" value={MOCK_BRANCHES.length} subtitle={`${MOCK_BRANCHES.filter(b => b.status === 'active').length} active`} icon={Building2} iconClassName="bg-accent-foreground/10 text-accent-foreground" />
        <StatCard title="Occupancy" value={`${occupancyRate}%`} subtitle={`${activeSeats}/${totalSeats} seats`} icon={Activity} iconClassName="bg-destructive/10 text-destructive" />
      </div>

      {/* Revenue + GPU Status Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Revenue Trend</CardTitle>
            <CardDescription>Monthly platform revenue across all branches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MONTHLY_REVENUE}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(234, 89%, 64%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(234, 89%, 64%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `$${v/1000}k`} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} labelStyle={{ color: 'hsl(var(--foreground))' }} formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(234, 89%, 64%)" fill="url(#revenueGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">GPU Fleet Status</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {MOCK_GPU_NODES.map(node => (
              <div key={node.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{node.name}</span>
                    <StatusBadge status={node.status} />
                  </div>
                  <div className="flex items-center gap-2">
                    {node.status !== 'offline' && (
                      <>
                        <span className="text-xs text-muted-foreground">{node.temperature}°C</span>
                        <span className="text-xs text-muted-foreground">{node.memoryUsed}/{node.memoryTotal}GB</span>
                      </>
                    )}
                  </div>
                </div>
                {node.status !== 'offline' && (
                  <Progress value={node.utilization} className="h-1.5" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Platform Load + User Distribution + System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Platform Load (Today)</CardTitle>
            <CardDescription>Hourly session load across all branches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={HOURLY_LOAD}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="hour" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`${value}%`, 'Load']} />
                  <Line type="monotone" dataKey="load" stroke="hsl(var(--info))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">User Distribution</CardTitle>
            <CardDescription>Active users by role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ROLE_DISTRIBUTION} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value">
                    {ROLE_DISTRIBUTION.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {ROLE_DISTRIBUTION.map((r, i) => (
                <span key={i} className="flex items-center gap-1.5 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: r.color }} />
                  {r.name} ({r.value})
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">System Health</CardTitle>
              <Shield className="h-4 w-4 text-success" />
            </div>
            <CardDescription>Infrastructure service status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {SYSTEM_METRICS.map((metric, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <span className="text-sm">{metric.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{metric.value}</span>
                  <span className="w-2 h-2 rounded-full bg-success" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Weekly Sessions + Branch Performance + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Weekly Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={REVENUE_DATA}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="sessions" fill="hsl(234, 89%, 64%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Branch Performance</CardTitle>
            <CardDescription>Seat occupancy by branch</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {MOCK_BRANCHES.map(branch => {
              const occ = Math.round((branch.activeSeats / branch.totalSeats) * 100);
              return (
                <div key={branch.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{branch.name}</span>
                    <span className="text-muted-foreground">{occ}%</span>
                  </div>
                  <Progress value={occ} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { msg: 'Node Gamma temperature exceeds 80°C', type: 'warning', time: '5 min ago' },
              { msg: 'Node Delta went offline', type: 'error', time: '5 hours ago' },
              { msg: 'Monthly revenue target exceeded', type: 'success', time: '1 day ago' },
              { msg: 'New cafe owner registered', type: 'info', time: '2 days ago' },
            ].map((alert, i) => (
              <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/50">
                <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                  alert.type === 'error' ? 'bg-destructive' : alert.type === 'warning' ? 'bg-warning' : alert.type === 'success' ? 'bg-success' : 'bg-info'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{alert.msg}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{alert.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={() => navigate('/users')}>
              <Users className="h-5 w-5 text-primary" />
              <span className="text-xs">Manage Users</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={() => navigate('/branches')}>
              <Building2 className="h-5 w-5 text-info" />
              <span className="text-xs">View Branches</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={() => navigate('/gpu-nodes')}>
              <Server className="h-5 w-5 text-warning" />
              <span className="text-xs">GPU Nodes</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={() => navigate('/analytics')}>
              <TrendingUp className="h-5 w-5 text-success" />
              <span className="text-xs">Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
