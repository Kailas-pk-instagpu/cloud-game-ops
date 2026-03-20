import { StatCard } from '@/shared/ui/molecules/StatCard';
import { StatusBadge } from '@/shared/ui/atoms/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MOCK_GPU_NODES, REVENUE_DATA, MONTHLY_REVENUE } from '@/shared/lib/mock-data';
import { Cpu, DollarSign, Users, Zap, AlertTriangle, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Progress } from '@/components/ui/progress';

export default function SuperAdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Command Center</h1>
        <p className="text-muted-foreground text-sm mt-1">Complete platform overview and GPU infrastructure monitoring</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value="$138,400" icon={DollarSign} trend={{ value: 12.5, positive: true }} iconClassName="bg-success/10 text-success" />
        <StatCard title="Active Sessions" value="186" icon={Zap} trend={{ value: 8, positive: true }} iconClassName="bg-info/10 text-info" />
        <StatCard title="GPU Nodes" value="5" subtitle="4 online, 1 offline" icon={Cpu} iconClassName="bg-primary/10 text-primary" />
        <StatCard title="Total Users" value="7" subtitle="Across all roles" icon={Users} iconClassName="bg-warning/10 text-warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MONTHLY_REVENUE}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(234, 89%, 64%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(234, 89%, 64%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fill: 'hsl(220, 9%, 46%)' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(220, 9%, 46%)' }} tickFormatter={v => `$${v/1000}k`} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(234, 89%, 64%)" fill="url(#revenueGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">GPU Status</CardTitle>
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
                  {node.status !== 'offline' && (
                    <span className="text-xs text-muted-foreground">{node.temperature}°C</span>
                  )}
                </div>
                {node.status !== 'offline' && (
                  <Progress value={node.utilization} className="h-1.5" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Weekly Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={REVENUE_DATA}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="sessions" fill="hsl(234, 89%, 64%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
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
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
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
    </div>
  );
}
