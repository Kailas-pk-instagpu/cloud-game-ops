import { useState } from 'react';
import { REVENUE_DATA, MONTHLY_REVENUE } from '@/shared/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Download, TrendingUp, TrendingDown, Users, DollarSign, Clock, Cpu } from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

// Extended mock data
const YEARLY_REVENUE = [
  { name: '2020', revenue: 620000 },
  { name: '2021', revenue: 780000 },
  { name: '2022', revenue: 950000 },
  { name: '2023', revenue: 1120000 },
  { name: '2024', revenue: 1350000 },
  { name: '2025', revenue: 1580000 },
];

const SESSION_DISTRIBUTION = [
  { name: 'Gaming', value: 45, color: 'hsl(234, 89%, 64%)' },
  { name: 'Streaming', value: 25, color: 'hsl(160, 60%, 50%)' },
  { name: 'AI/ML', value: 18, color: 'hsl(40, 90%, 55%)' },
  { name: 'Rendering', value: 12, color: 'hsl(340, 70%, 55%)' },
];

const PEAK_HOURS = [
  { hour: '6AM', users: 12 }, { hour: '8AM', users: 25 }, { hour: '10AM', users: 45 },
  { hour: '12PM', users: 68 }, { hour: '2PM', users: 82 }, { hour: '4PM', users: 95 },
  { hour: '6PM', users: 120 }, { hour: '8PM', users: 145 }, { hour: '10PM', users: 130 },
  { hour: '12AM', users: 78 },
];

const GPU_UTILIZATION_TREND = [
  { name: 'Mon', avg: 62, peak: 89 },
  { name: 'Tue', avg: 58, peak: 85 },
  { name: 'Wed', avg: 71, peak: 94 },
  { name: 'Thu', avg: 67, peak: 91 },
  { name: 'Fri', avg: 75, peak: 97 },
  { name: 'Sat', avg: 88, peak: 99 },
  { name: 'Sun', avg: 83, peak: 96 },
];

const KPI_CARDS = [
  { title: 'Total Revenue', value: '$138,000', change: '+12.5%', up: true, icon: DollarSign },
  { title: 'Active Users', value: '1,284', change: '+8.2%', up: true, icon: Users },
  { title: 'Avg Session', value: '2h 45m', change: '-3.1%', up: false, icon: Clock },
  { title: 'GPU Utilization', value: '78.4%', change: '+5.7%', up: true, icon: Cpu },
];

function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(h => row[h]).join(','))
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const revenueData = period === 'monthly' ? MONTHLY_REVENUE : YEARLY_REVENUE;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Revenue and performance insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as 'monthly' | 'yearly')}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadCSV(revenueData, `${period}-revenue.csv`)}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {KPI_CARDS.map((kpi) => (
          <Card key={kpi.title} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium">{kpi.title}</span>
                <kpi.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-xl sm:text-2xl font-bold">{kpi.value}</div>
              <div className={`flex items-center gap-1 text-xs mt-1 ${kpi.up ? 'text-emerald-500' : 'text-red-500'}`}>
                {kpi.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {kpi.change} vs last period
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue & Sessions Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">{period === 'monthly' ? 'Monthly' : 'Yearly'} Revenue</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => downloadCSV(revenueData, `${period}-revenue.csv`)}>
              <Download className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="analyticGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(234, 89%, 64%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(234, 89%, 64%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 12 }} tickFormatter={v => `$${v / 1000}k`} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(234, 89%, 64%)" fill="url(#analyticGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Weekly Sessions</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => downloadCSV(REVENUE_DATA, 'weekly-sessions.csv')}>
              <Download className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-64">
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
      </div>

      {/* New Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Session Distribution Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Session Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={SESSION_DISTRIBUTION}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {SESSION_DISTRIBUTION.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Peak Hours */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Peak Usage Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={PEAK_HOURS}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="hour" tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="users" fill="hsl(160, 60%, 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* GPU Utilization Trend */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">GPU Utilization Trend</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => downloadCSV(GPU_UTILIZATION_TREND, 'gpu-utilization.csv')}>
              <Download className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={GPU_UTILIZATION_TREND}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 12 }} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="avg" stroke="hsl(234, 89%, 64%)" strokeWidth={2} name="Average" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="peak" stroke="hsl(340, 70%, 55%)" strokeWidth={2} name="Peak" dot={{ r: 3 }} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
