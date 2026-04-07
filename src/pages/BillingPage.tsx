import { useState } from 'react';
import { useAuthStore } from '@/shared/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { StatCard } from '@/shared/ui/molecules/StatCard';
import {
  Wallet, CreditCard, IndianRupee, Zap, Download, Search, Filter, Clock,
  Cpu, MemoryStick, Wifi, TrendingUp, TrendingDown, AlertTriangle, Bell,
  Building2, Monitor, Receipt, ChevronLeft, ChevronRight, Plus, ArrowUpRight,
  Activity, Gauge, BarChart3, Calendar, FileText, RefreshCw, Lightbulb, Award
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { cn } from '@/lib/utils';

// Mock data
const sessionUsageData = [
  { id: 'SES-001', user: 'Machine-01', game: 'Cyberpunk 2077', start: '10:30 AM', end: '12:15 PM', duration: '1h 45m', rate: 2.5, total: 262.5, branch: 'Branch A' },
  { id: 'SES-002', user: 'Machine-03', game: 'Fortnite', start: '11:00 AM', end: '1:30 PM', duration: '2h 30m', rate: 2.0, total: 300, branch: 'Branch A' },
  { id: 'SES-003', user: 'Machine-07', game: 'Valorant', start: '9:15 AM', end: '11:45 AM', duration: '2h 30m', rate: 1.8, total: 270, branch: 'Branch B' },
  { id: 'SES-004', user: 'Machine-02', game: 'GTA V', start: '2:00 PM', end: '4:30 PM', duration: '2h 30m', rate: 2.5, total: 375, branch: 'Branch A' },
  { id: 'SES-005', user: 'Machine-05', game: 'Apex Legends', start: '3:00 PM', end: '5:00 PM', duration: '2h 00m', rate: 2.0, total: 240, branch: 'Branch C' },
  { id: 'SES-006', user: 'Machine-09', game: 'CS:GO 2', start: '1:00 PM', end: '3:45 PM', duration: '2h 45m', rate: 1.5, total: 247.5, branch: 'Branch B' },
  { id: 'SES-007', user: 'Machine-04', game: 'Elden Ring', start: '4:00 PM', end: '7:00 PM', duration: '3h 00m', rate: 2.8, total: 504, branch: 'Branch A' },
  { id: 'SES-008', user: 'Machine-11', game: 'Overwatch 2', start: '5:30 PM', end: '7:15 PM', duration: '1h 45m', rate: 1.8, total: 189, branch: 'Branch C' },
];

const revenueData = [
  { day: 'Mon', revenue: 12500 }, { day: 'Tue', revenue: 15200 }, { day: 'Wed', revenue: 18900 },
  { day: 'Thu', revenue: 14300 }, { day: 'Fri', revenue: 22100 }, { day: 'Sat', revenue: 28500 }, { day: 'Sun', revenue: 25800 },
];

const gameUsageData = [
  { game: 'Cyberpunk', sessions: 145, revenue: 38000 },
  { game: 'Fortnite', sessions: 230, revenue: 32000 },
  { game: 'Valorant', sessions: 198, revenue: 28000 },
  { game: 'GTA V', sessions: 120, revenue: 25000 },
  { game: 'Apex', sessions: 165, revenue: 22000 },
];

const peakHoursData = [
  { hour: '8AM', usage: 20 }, { hour: '10AM', usage: 45 }, { hour: '12PM', usage: 72 },
  { hour: '2PM', usage: 85 }, { hour: '4PM', usage: 95 }, { hour: '6PM', usage: 88 },
  { hour: '8PM', usage: 75 }, { hour: '10PM', usage: 55 },
];

const invoices = [
  { id: 'INV-2024-001', date: '2024-03-01', amount: 45200, status: 'paid' },
  { id: 'INV-2024-002', date: '2024-03-08', amount: 38750, status: 'paid' },
  { id: 'INV-2024-003', date: '2024-03-15', amount: 52100, status: 'paid' },
  { id: 'INV-2024-004', date: '2024-03-22', amount: 41800, status: 'pending' },
  { id: 'INV-2024-005', date: '2024-03-29', amount: 48900, status: 'pending' },
];

const rechargeHistory = [
  { id: 'RCH-001', date: '2024-03-28', amount: 50000, method: 'UPI', status: 'success' },
  { id: 'RCH-002', date: '2024-03-20', amount: 30000, method: 'Card', status: 'success' },
  { id: 'RCH-003', date: '2024-03-12', amount: 25000, method: 'Net Banking', status: 'success' },
  { id: 'RCH-004', date: '2024-03-05', amount: 40000, method: 'UPI', status: 'success' },
];

const branchData = [
  { name: 'Branch A', machines: 15, activeSessions: 12, revenue: 45200, gpuUtil: 78 },
  { name: 'Branch B', machines: 10, activeSessions: 8, revenue: 32100, gpuUtil: 65 },
  { name: 'Branch C', machines: 8, activeSessions: 6, revenue: 24500, gpuUtil: 72 },
];

const CHART_COLORS = ['hsl(234, 89%, 64%)', 'hsl(262, 83%, 58%)', 'hsl(152, 55%, 42%)', 'hsl(38, 80%, 50%)', 'hsl(199, 75%, 48%)'];

export default function BillingPage() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [gameFilter, setGameFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const isSuperAdmin = user?.role === 'super_admin';
  const itemsPerPage = 5;

  const filteredSessions = sessionUsageData.filter(s => {
    const matchSearch = s.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.game.toLowerCase().includes(searchQuery.toLowerCase());
    const matchGame = gameFilter === 'all' || s.game === gameFilter;
    const matchBranch = branchFilter === 'all' || s.branch === branchFilter;
    return matchSearch && matchGame && matchBranch;
  });

  const paginatedSessions = filteredSessions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Billing & Usage</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor costs, usage, and manage payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" /> Export Report
          </Button>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Recharge Wallet
          </Button>
        </div>
      </div>

      {/* Account Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Wallet Balance"
          value="₹1,24,500"
          subtitle="Last recharge: ₹50,000"
          icon={Wallet}
          trend={{ value: 12, positive: true }}
          iconClassName="bg-primary/10 text-primary"
        />
        <StatCard
          title="Active Sessions"
          value="26"
          subtitle="Across 3 branches"
          icon={Activity}
          trend={{ value: 8, positive: true }}
          iconClassName="bg-success/10 text-success"
        />
        <StatCard
          title="Today's Spend"
          value="₹8,450"
          subtitle="Avg: ₹325/session"
          icon={IndianRupee}
          trend={{ value: 5, positive: false }}
          iconClassName="bg-warning/10 text-warning"
        />
        <StatCard
          title="Monthly Estimate"
          value="₹2,53,500"
          subtitle="Based on current usage"
          icon={TrendingUp}
          trend={{ value: 15, positive: true }}
          iconClassName="bg-info/10 text-info"
        />
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="usage" className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="usage" className="gap-2 text-xs sm:text-sm"><Monitor className="h-3.5 w-3.5" /> Session Usage</TabsTrigger>
          <TabsTrigger value="wallet" className="gap-2 text-xs sm:text-sm"><Wallet className="h-3.5 w-3.5" /> Wallet</TabsTrigger>
          <TabsTrigger value="resources" className="gap-2 text-xs sm:text-sm"><Cpu className="h-3.5 w-3.5" /> Resources</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2 text-xs sm:text-sm"><BarChart3 className="h-3.5 w-3.5" /> Analytics</TabsTrigger>
          {isSuperAdmin && <TabsTrigger value="branches" className="gap-2 text-xs sm:text-sm"><Building2 className="h-3.5 w-3.5" /> Branches</TabsTrigger>}
        </TabsList>

        {/* Session Usage Tab */}
        <TabsContent value="usage" className="space-y-4">
          {/* Pricing Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Pricing Structure</CardTitle>
                <CardDescription>How your usage costs are calculated</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Base Rate', value: '₹1.50/min', desc: 'Standard GPU' },
                    { label: 'GPU Premium', value: '+₹1.00/min', desc: 'A40 GPU tier' },
                    { label: 'Peak Hours', value: '+₹0.50/min', desc: '4PM - 10PM' },
                    { label: 'Streaming', value: '₹0.30/min', desc: 'Network cost' },
                  ].map(item => (
                    <div key={item.label} className="text-center p-3 rounded-lg bg-muted/50 border border-border/50">
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-lg font-bold text-foreground mt-1">{item.value}</p>
                      <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs text-muted-foreground">Total Cost Formula</p>
                  <p className="text-sm font-mono font-medium text-foreground mt-1">
                    Total = (Base + GPU Premium + Peak Surcharge + Streaming) × Duration
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Account Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Account</span>
                  <span className="text-sm font-medium">{user?.name || 'Game Center'}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Plan</span>
                  <Badge variant="secondary">Pay-as-you-go</Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Billing Cycle</span>
                  <span className="text-sm font-medium">Weekly</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">GPU Tier</span>
                  <Badge className="bg-primary/10 text-primary border-0">NVIDIA A40</Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge className="bg-success/10 text-success border-0">Active</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Session Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Session Usage</CardTitle>
                  <CardDescription>{filteredSessions.length} sessions found</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search sessions..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-8 h-9 w-48 text-sm"
                    />
                  </div>
                  <Select value={gameFilter} onValueChange={setGameFilter}>
                    <SelectTrigger className="h-9 w-36 text-sm"><SelectValue placeholder="Game" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Games</SelectItem>
                      {[...new Set(sessionUsageData.map(s => s.game))].map(g => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={branchFilter} onValueChange={setBranchFilter}>
                    <SelectTrigger className="h-9 w-36 text-sm"><SelectValue placeholder="Branch" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Branches</SelectItem>
                      <SelectItem value="Branch A">Branch A</SelectItem>
                      <SelectItem value="Branch B">Branch B</SelectItem>
                      <SelectItem value="Branch C">Branch C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs">Session ID</TableHead>
                      <TableHead className="text-xs">Machine</TableHead>
                      <TableHead className="text-xs">Game</TableHead>
                      <TableHead className="text-xs">Start</TableHead>
                      <TableHead className="text-xs">End</TableHead>
                      <TableHead className="text-xs">Duration</TableHead>
                      <TableHead className="text-xs text-right">Rate (₹/min)</TableHead>
                      <TableHead className="text-xs text-right">Total (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSessions.map(s => (
                      <TableRow key={s.id} className="hover:bg-muted/20">
                        <TableCell className="font-mono text-xs text-primary">{s.id}</TableCell>
                        <TableCell className="text-sm">{s.user}</TableCell>
                        <TableCell className="text-sm font-medium">{s.game}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{s.start}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{s.end}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{s.duration}</Badge></TableCell>
                        <TableCell className="text-right text-sm">₹{s.rate.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-semibold text-sm">₹{s.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <Button key={i} variant={currentPage === i + 1 ? "default" : "outline"} size="icon" className="h-8 w-8" onClick={() => setCurrentPage(i + 1)}>
                      {i + 1}
                    </Button>
                  ))}
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Wallet Tab */}
        <TabsContent value="wallet" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Wallet Balance */}
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-primary/20">
                    <Wallet className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Balance</p>
                    <p className="text-3xl font-bold text-foreground">₹1,24,500</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 gap-2"><Plus className="h-4 w-4" /> Recharge</Button>
                  <Button variant="outline" className="gap-2"><RefreshCw className="h-4 w-4" /> Auto-Pay</Button>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <p className="text-xs text-warning font-medium">Low balance alert set at ₹10,000</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Payment Methods</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { method: 'UPI', detail: 'user@upi', icon: Zap, active: true },
                  { method: 'Credit Card', detail: '•••• 4242', icon: CreditCard, active: true },
                  { method: 'Net Banking', detail: 'HDFC Bank', icon: Building2, active: false },
                ].map(pm => (
                  <div key={pm.method} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <pm.icon className="h-4 w-4 text-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{pm.method}</p>
                        <p className="text-xs text-muted-foreground">{pm.detail}</p>
                      </div>
                    </div>
                    <Badge variant={pm.active ? "default" : "secondary"} className="text-[10px]">
                      {pm.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))}
                <Button variant="outline" className="w-full gap-2 mt-2"><Plus className="h-4 w-4" /> Add Method</Button>
              </CardContent>
            </Card>

            {/* Recharge History */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Recharge History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {rechargeHistory.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50">
                    <div>
                      <p className="text-sm font-medium">₹{r.amount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{r.date} · {r.method}</p>
                    </div>
                    <Badge className="bg-success/10 text-success border-0 text-[10px]">Success</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Billing History / Invoices */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Invoices</CardTitle>
                  <CardDescription>Download and manage billing invoices</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="gap-2"><Download className="h-3.5 w-3.5" /> Export All</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs">Invoice ID</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs text-right">Amount</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map(inv => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono text-xs text-primary">{inv.id}</TableCell>
                        <TableCell className="text-sm">{inv.date}</TableCell>
                        <TableCell className="text-right font-semibold">₹{inv.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={cn(
                            'text-[10px] border-0',
                            inv.status === 'paid' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                          )}>
                            {inv.status === 'paid' ? 'Paid' : 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs">
                            <Download className="h-3 w-3" /> PDF
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* GPU Usage */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Cpu className="h-4 w-4 text-primary" /> GPU Utilization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { type: 'NVIDIA A40', usage: 78, sessions: 18, temp: '72°C' },
                  { type: 'NVIDIA A16', usage: 62, sessions: 8, temp: '65°C' },
                ].map(gpu => (
                  <div key={gpu.type} className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{gpu.type}</span>
                      <span className="text-sm font-bold text-primary">{gpu.usage}%</span>
                    </div>
                    <Progress value={gpu.usage} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{gpu.sessions} active sessions</span>
                      <span>Temp: {gpu.temp}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* System Resources */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Gauge className="h-4 w-4 text-primary" /> System Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'CPU Usage', value: 65, icon: Cpu, color: 'text-primary' },
                  { label: 'RAM Usage', value: 72, icon: MemoryStick, color: 'text-warning' },
                  { label: 'Bandwidth', value: 45, icon: Wifi, color: 'text-success' },
                  { label: 'Storage I/O', value: 38, icon: Activity, color: 'text-info' },
                ].map(res => (
                  <div key={res.label} className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <res.icon className={cn("h-3.5 w-3.5", res.color)} />
                        <span className="text-sm">{res.label}</span>
                      </div>
                      <span className="text-sm font-semibold">{res.value}%</span>
                    </div>
                    <Progress value={res.value} className="h-1.5" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* GPU Efficiency Score */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Award className="h-4 w-4 text-primary" /> GPU Efficiency Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-4">
                  <div className="relative w-32 h-32">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="40" fill="none" className="stroke-muted" strokeWidth="8" />
                      <circle cx="50" cy="50" r="40" fill="none" className="stroke-primary" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${82 * 2.51} ${100 * 2.51}`} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-foreground">82</span>
                      <span className="text-xs text-muted-foreground">/ 100</span>
                    </div>
                  </div>
                </div>
                <div className="text-center mt-2">
                  <Badge className="bg-success/10 text-success border-0">Good Performance</Badge>
                  <p className="text-xs text-muted-foreground mt-2">Your GPU utilization is efficient. Consider upgrading during peak hours for better performance.</p>
                </div>
              </CardContent>
            </Card>

            {/* Cost Optimization Tips */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Lightbulb className="h-4 w-4 text-warning" /> Cost Optimization Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { tip: 'Schedule heavy games outside peak hours (4-10 PM) to save up to 20% on GPU costs.', savings: '₹5,200/mo' },
                  { tip: 'Enable auto-shutdown for idle sessions after 15 minutes to reduce wasted GPU time.', savings: '₹3,800/mo' },
                  { tip: 'Batch similar game sessions on the same GPU node for better resource sharing.', savings: '₹2,100/mo' },
                  { tip: 'Consider a subscription plan if monthly usage exceeds ₹2,00,000 consistently.', savings: '₹12,000/mo' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-warning/10 flex items-center justify-center mt-0.5">
                      <span className="text-xs font-bold text-warning">{i + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{item.tip}</p>
                      <p className="text-xs text-success font-medium mt-1">Potential savings: {item.savings}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Daily Revenue */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Daily Revenue</CardTitle>
                <CardDescription>Revenue trend for the current week</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(234, 89%, 64%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(234, 89%, 64%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="day" className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
                    <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Revenue']} contentStyle={{ background: 'hsl(222, 47%, 9%)', border: '1px solid hsl(222, 40%, 16%)', borderRadius: '8px', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(234, 89%, 64%)" fill="url(#revenueGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Most Played Games */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Most Played Games</CardTitle>
                <CardDescription>Sessions by game title</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={gameUsageData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="game" className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} />
                    <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: 'hsl(222, 47%, 9%)', border: '1px solid hsl(222, 40%, 16%)', borderRadius: '8px', fontSize: '12px' }} />
                    <Bar dataKey="sessions" fill="hsl(234, 89%, 64%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Peak Usage Hours */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Peak Usage Hours</CardTitle>
                <CardDescription>Utilization across the day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={peakHoursData}>
                    <defs>
                      <linearGradient id="peakGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="hour" className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} />
                    <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} tickFormatter={v => `${v}%`} />
                    <Tooltip formatter={(v: number) => [`${v}%`, 'Utilization']} contentStyle={{ background: 'hsl(222, 47%, 9%)', border: '1px solid hsl(222, 40%, 16%)', borderRadius: '8px', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="usage" stroke="hsl(262, 83%, 58%)" fill="url(#peakGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue by Game (Pie) */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Revenue Distribution</CardTitle>
                <CardDescription>Revenue share by game title</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={gameUsageData} dataKey="revenue" nameKey="game" cx="50%" cy="50%" outerRadius={90} innerRadius={55} strokeWidth={2} className="stroke-card">
                      {gameUsageData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Revenue']} contentStyle={{ background: 'hsl(222, 47%, 9%)', border: '1px solid hsl(222, 40%, 16%)', borderRadius: '8px', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {gameUsageData.map((g, i) => (
                    <div key={g.game} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ background: CHART_COLORS[i] }} />
                      <span className="text-xs text-muted-foreground">{g.game}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Avg Session Duration</p>
              <p className="text-2xl font-bold mt-1">2h 15m</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Avg Cost/Session</p>
              <p className="text-2xl font-bold mt-1">₹298</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Total Sessions (MTD)</p>
              <p className="text-2xl font-bold mt-1">1,248</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Revenue (MTD)</p>
              <p className="text-2xl font-bold mt-1">₹3.72L</p>
            </Card>
          </div>
        </TabsContent>

        {/* Multi-Branch Tab (Super Admin) */}
        {isSuperAdmin && (
          <TabsContent value="branches" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {branchData.map(branch => (
                <Card key={branch.name} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" /> {branch.name}
                      </CardTitle>
                      <Badge variant="outline" className="text-[10px]">{branch.activeSessions}/{branch.machines} active</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Revenue (MTD)</span>
                      <span className="text-sm font-bold">₹{branch.revenue.toLocaleString()}</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">GPU Utilization</span>
                        <span className="font-medium">{branch.gpuUtil}%</span>
                      </div>
                      <Progress value={branch.gpuUtil} className="h-1.5" />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Machines</span>
                      <span className="text-sm font-medium">{branch.machines}</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full gap-2 mt-2 text-xs">
                      <ArrowUpRight className="h-3 w-3" /> View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Machine-Level Breakdown */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Machine-Level Breakdown</CardTitle>
                <CardDescription>Usage and cost per machine across all branches</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-xs">Machine</TableHead>
                        <TableHead className="text-xs">Branch</TableHead>
                        <TableHead className="text-xs">Sessions Today</TableHead>
                        <TableHead className="text-xs">GPU Usage</TableHead>
                        <TableHead className="text-xs text-right">Revenue</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { machine: 'Machine-01', branch: 'Branch A', sessions: 8, gpu: 85, revenue: 4200, status: 'active' },
                        { machine: 'Machine-03', branch: 'Branch A', sessions: 6, gpu: 72, revenue: 3100, status: 'active' },
                        { machine: 'Machine-07', branch: 'Branch B', sessions: 5, gpu: 58, revenue: 2800, status: 'active' },
                        { machine: 'Machine-02', branch: 'Branch A', sessions: 7, gpu: 90, revenue: 3950, status: 'active' },
                        { machine: 'Machine-09', branch: 'Branch B', sessions: 3, gpu: 35, revenue: 1500, status: 'idle' },
                        { machine: 'Machine-05', branch: 'Branch C', sessions: 4, gpu: 62, revenue: 2200, status: 'active' },
                      ].map(m => (
                        <TableRow key={m.machine}>
                          <TableCell className="font-medium text-sm">{m.machine}</TableCell>
                          <TableCell className="text-sm">{m.branch}</TableCell>
                          <TableCell className="text-sm">{m.sessions}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={m.gpu} className="h-1.5 w-16" />
                              <span className="text-xs text-muted-foreground">{m.gpu}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold">₹{m.revenue.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge className={cn('text-[10px] border-0', m.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground')}>
                              {m.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Alerts & Notifications */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4 text-primary" /> Alerts & Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/5 border border-warning/20">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Low Wallet Balance</p>
                <p className="text-xs text-muted-foreground mt-0.5">Balance below ₹15,000. Recharge to avoid service interruption.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
              <Zap className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">High GPU Usage</p>
                <p className="text-xs text-muted-foreground mt-0.5">Branch A GPU utilization at 92%. Consider load balancing.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-info/5 border border-info/20">
              <Clock className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Session Limit Warning</p>
                <p className="text-xs text-muted-foreground mt-0.5">Branch B approaching max concurrent session limit (8/10).</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
