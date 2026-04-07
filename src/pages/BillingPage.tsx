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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { StatCard } from '@/shared/ui/molecules/StatCard';
import {
  Wallet, CreditCard, IndianRupee, Zap, Download, Search, Clock,
  Cpu, MemoryStick, Wifi, TrendingUp, AlertTriangle, Bell,
  Building2, Monitor, Receipt, ChevronLeft, ChevronRight, Plus, ArrowUpRight,
  Activity, Gauge, BarChart3, Lightbulb, Award, Check, Crown, Star, Shield
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { cn } from '@/lib/utils';

// Mock data
const sessionUsageData = [
  { id: 'SES-001', user: 'Machine-01', game: 'Cyberpunk 2077', start: '10:30 AM', end: '12:15 PM', duration: '1h 45m', rate: 2.5, total: 262.5, branch: 'Branch A', cafe: 'Pixel Arena' },
  { id: 'SES-002', user: 'Machine-03', game: 'Fortnite', start: '11:00 AM', end: '1:30 PM', duration: '2h 30m', rate: 2.0, total: 300, branch: 'Branch A', cafe: 'Pixel Arena' },
  { id: 'SES-003', user: 'Machine-07', game: 'Valorant', start: '9:15 AM', end: '11:45 AM', duration: '2h 30m', rate: 1.8, total: 270, branch: 'Branch B', cafe: 'GameZone Hub' },
  { id: 'SES-004', user: 'Machine-02', game: 'GTA V', start: '2:00 PM', end: '4:30 PM', duration: '2h 30m', rate: 2.5, total: 375, branch: 'Branch A', cafe: 'Pixel Arena' },
  { id: 'SES-005', user: 'Machine-05', game: 'Apex Legends', start: '3:00 PM', end: '5:00 PM', duration: '2h 00m', rate: 2.0, total: 240, branch: 'Branch C', cafe: 'NextGen Lounge' },
  { id: 'SES-006', user: 'Machine-09', game: 'CS:GO 2', start: '1:00 PM', end: '3:45 PM', duration: '2h 45m', rate: 1.5, total: 247.5, branch: 'Branch B', cafe: 'GameZone Hub' },
  { id: 'SES-007', user: 'Machine-04', game: 'Elden Ring', start: '4:00 PM', end: '7:00 PM', duration: '3h 00m', rate: 2.8, total: 504, branch: 'Branch A', cafe: 'Pixel Arena' },
  { id: 'SES-008', user: 'Machine-11', game: 'Overwatch 2', start: '5:30 PM', end: '7:15 PM', duration: '1h 45m', rate: 1.8, total: 189, branch: 'Branch C', cafe: 'NextGen Lounge' },
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

const cafeAccounts = [
  { id: 'cafe-1', name: 'Pixel Arena', owner: 'Rajesh Kumar', balance: 124500, plan: 'Pro', branches: 3, activeSessions: 18, monthlySpend: 185000, status: 'active' },
  { id: 'cafe-2', name: 'GameZone Hub', owner: 'Amit Shah', balance: 8200, plan: 'Starter', branches: 2, activeSessions: 12, monthlySpend: 95000, status: 'low_balance' },
  { id: 'cafe-3', name: 'NextGen Lounge', owner: 'Priya Patel', balance: 67800, plan: 'Pro', branches: 2, activeSessions: 10, monthlySpend: 120000, status: 'active' },
  { id: 'cafe-4', name: 'Cloud9 Gaming', owner: 'Vikram Singh', balance: 0, plan: 'Pay-as-you-go', branches: 1, activeSessions: 0, monthlySpend: 45000, status: 'suspended' },
  { id: 'cafe-5', name: 'Arena X', owner: 'Deepak Joshi', balance: 230000, plan: 'Enterprise', branches: 5, activeSessions: 32, monthlySpend: 310000, status: 'active' },
];

const subscriptionPlans = [
  {
    id: 'payg',
    name: 'Pay-as-you-go',
    price: null,
    priceLabel: 'No commitment',
    description: 'Pay only for what you use. Best for getting started.',
    icon: Zap,
    features: ['Standard GPU access', 'Per-minute billing', 'Basic support', 'Up to 5 machines', 'Standard streaming quality'],
    popular: false,
    color: 'text-muted-foreground',
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 15000,
    priceLabel: '₹15,000/mo',
    description: 'For small game centers with up to 10 machines.',
    icon: Star,
    features: ['10% discount on GPU rates', 'Up to 10 machines', 'Priority support', 'HD streaming', 'Weekly reports', '₹5,000 free credits/mo'],
    popular: false,
    color: 'text-primary',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 35000,
    priceLabel: '₹35,000/mo',
    description: 'For growing centers. Best value for 10-30 machines.',
    icon: Crown,
    features: ['20% discount on GPU rates', 'Up to 30 machines', '24/7 premium support', '4K streaming', 'Real-time analytics', '₹15,000 free credits/mo', 'Peak hour discount (10%)'],
    popular: true,
    color: 'text-primary',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 75000,
    priceLabel: '₹75,000/mo',
    description: 'For large multi-branch operations. Custom SLAs.',
    icon: Shield,
    features: ['30% discount on GPU rates', 'Unlimited machines', 'Dedicated account manager', '4K+ streaming', 'Custom analytics & API', '₹40,000 free credits/mo', 'Peak hour discount (20%)', 'Custom GPU allocation'],
    popular: false,
    color: 'text-primary',
  },
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
  const [gameFilter, setGameFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [cafeSearch, setCafeSearch] = useState('');
  const [topupCafe, setTopupCafe] = useState<typeof cafeAccounts[0] | null>(null);
  const [topupAmount, setTopupAmount] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin';
  const isCafeOwner = user?.role === 'cafe_owner';
  const isManager = user?.role === 'manager';
  const canRecharge = isCafeOwner || isManager;
  const canViewAllCafes = isSuperAdmin || isAdmin;

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

  const filteredCafes = cafeAccounts.filter(c =>
    c.name.toLowerCase().includes(cafeSearch.toLowerCase()) ||
    c.owner.toLowerCase().includes(cafeSearch.toLowerCase())
  );

  const defaultTab = canViewAllCafes ? 'overview' : 'usage';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Billing & Usage</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {canViewAllCafes ? 'Platform-wide billing overview and cafe management' : 'Monitor costs, usage, and manage payments'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" /> Export Report
          </Button>
          {canRecharge && (
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Recharge Wallet
            </Button>
          )}
        </div>
      </div>

      {/* Account Summary - role aware */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {canViewAllCafes ? (
          <>
            <StatCard title="Total Platform Revenue" value="₹12,45,000" subtitle="This month" icon={IndianRupee} trend={{ value: 18, positive: true }} iconClassName="bg-primary/10 text-primary" />
            <StatCard title="Active Cafes" value={String(cafeAccounts.filter(c => c.status === 'active').length)} subtitle={`${cafeAccounts.length} total registered`} icon={Building2} trend={{ value: 2, positive: true }} iconClassName="bg-success/10 text-success" />
            <StatCard title="Active Sessions" value="72" subtitle="Across all cafes" icon={Activity} trend={{ value: 12, positive: true }} iconClassName="bg-warning/10 text-warning" />
            <StatCard title="Low Balance Alerts" value={String(cafeAccounts.filter(c => c.status === 'low_balance' || c.status === 'suspended').length)} subtitle="Cafes need attention" icon={AlertTriangle} iconClassName="bg-destructive/10 text-destructive" />
          </>
        ) : (
          <>
            <StatCard title="Wallet Balance" value="₹1,24,500" subtitle="Last recharge: ₹50,000" icon={Wallet} trend={{ value: 12, positive: true }} iconClassName="bg-primary/10 text-primary" />
            <StatCard title="Active Sessions" value="26" subtitle="Across 3 branches" icon={Activity} trend={{ value: 8, positive: true }} iconClassName="bg-success/10 text-success" />
            <StatCard title="Today's Spend" value="₹8,450" subtitle="Avg: ₹325/session" icon={IndianRupee} trend={{ value: 5, positive: false }} iconClassName="bg-warning/10 text-warning" />
            <StatCard title="Monthly Estimate" value="₹2,53,500" subtitle="Based on current usage" icon={TrendingUp} trend={{ value: 15, positive: true }} iconClassName="bg-info/10 text-info" />
          </>
        )}
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="bg-muted/50 p-1 flex-wrap h-auto">
          {canViewAllCafes && <TabsTrigger value="overview" className="gap-2 text-xs sm:text-sm"><Building2 className="h-3.5 w-3.5" /> Cafe Accounts</TabsTrigger>}
          <TabsTrigger value="usage" className="gap-2 text-xs sm:text-sm"><Monitor className="h-3.5 w-3.5" /> Session Usage</TabsTrigger>
          {(canRecharge || canViewAllCafes) && <TabsTrigger value="wallet" className="gap-2 text-xs sm:text-sm"><Wallet className="h-3.5 w-3.5" /> Wallet</TabsTrigger>}
          <TabsTrigger value="plans" className="gap-2 text-xs sm:text-sm"><Crown className="h-3.5 w-3.5" /> Subscription Plans</TabsTrigger>
          <TabsTrigger value="resources" className="gap-2 text-xs sm:text-sm"><Cpu className="h-3.5 w-3.5" /> Resources</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2 text-xs sm:text-sm"><BarChart3 className="h-3.5 w-3.5" /> Analytics</TabsTrigger>
        </TabsList>

        {/* ===== SUPER ADMIN: Cafe Accounts Overview ===== */}
        {canViewAllCafes && (
          <TabsContent value="overview" className="space-y-4">
            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search cafes or owners..." value={cafeSearch} onChange={e => setCafeSearch(e.target.value)} className="pl-8 h-9 text-sm" />
              </div>
            </div>

            {/* Cafe Accounts Table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">All Cafe Accounts</CardTitle>
                <CardDescription>Manage balances, plans, and usage across all cafes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-xs">Cafe Name</TableHead>
                        <TableHead className="text-xs">Owner</TableHead>
                        <TableHead className="text-xs">Plan</TableHead>
                        <TableHead className="text-xs text-right">Balance</TableHead>
                        <TableHead className="text-xs">Branches</TableHead>
                        <TableHead className="text-xs">Sessions</TableHead>
                        <TableHead className="text-xs text-right">Monthly Spend</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCafes.map(cafe => (
                        <TableRow key={cafe.id} className="hover:bg-muted/20">
                          <TableCell className="font-medium text-sm">{cafe.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{cafe.owner}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">{cafe.plan}</Badge>
                          </TableCell>
                          <TableCell className={cn("text-right font-semibold text-sm", cafe.balance < 10000 ? 'text-destructive' : '')}>
                            ₹{cafe.balance.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm">{cafe.branches}</TableCell>
                          <TableCell className="text-sm">{cafe.activeSessions}</TableCell>
                          <TableCell className="text-right text-sm">₹{cafe.monthlySpend.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge className={cn('text-[10px] border-0',
                              cafe.status === 'active' ? 'bg-success/10 text-success' :
                              cafe.status === 'low_balance' ? 'bg-warning/10 text-warning' :
                              'bg-destructive/10 text-destructive'
                            )}>
                              {cafe.status === 'low_balance' ? 'Low Balance' : cafe.status === 'suspended' ? 'Suspended' : 'Active'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => { setTopupCafe(cafe); setTopupAmount(''); }}>
                                    <Plus className="h-3 w-3" /> Top Up
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Top Up - {cafe.name}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                                      <span className="text-sm text-muted-foreground">Current Balance</span>
                                      <span className="font-bold">₹{cafe.balance.toLocaleString()}</span>
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium">Top Up Amount (₹)</label>
                                      <Input type="number" placeholder="Enter amount" value={topupAmount} onChange={e => setTopupAmount(e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                      {[10000, 25000, 50000].map(amt => (
                                        <Button key={amt} variant="outline" size="sm" onClick={() => setTopupAmount(String(amt))}>
                                          ₹{(amt / 1000).toFixed(0)}K
                                        </Button>
                                      ))}
                                    </div>
                                    {topupAmount && (
                                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                                        <div className="flex justify-between text-sm">
                                          <span>New Balance</span>
                                          <span className="font-bold text-primary">₹{(cafe.balance + Number(topupAmount)).toLocaleString()}</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <DialogFooter>
                                    <Button className="gap-2"><Wallet className="h-4 w-4" /> Confirm Top Up</Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                                <ArrowUpRight className="h-3 w-3" /> Details
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Platform Revenue Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Revenue by Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { plan: 'Enterprise', revenue: 310000, percentage: 40 },
                      { plan: 'Pro', revenue: 305000, percentage: 39 },
                      { plan: 'Starter', revenue: 95000, percentage: 12 },
                      { plan: 'Pay-as-you-go', revenue: 45000, percentage: 6 },
                    ].map(p => (
                      <div key={p.plan} className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span>{p.plan}</span>
                          <span className="font-semibold">₹{(p.revenue / 1000).toFixed(0)}K</span>
                        </div>
                        <Progress value={p.percentage} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Subscription Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={[
                        { name: 'Enterprise', value: 2 },
                        { name: 'Pro', value: 8 },
                        { name: 'Starter', value: 5 },
                        { name: 'Pay-as-you-go', value: 12 },
                      ]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={45} strokeWidth={2} className="stroke-card">
                        {[0,1,2,3].map(i => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'hsl(222, 47%, 9%)', border: '1px solid hsl(222, 40%, 16%)', borderRadius: '8px', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-3 mt-1">
                    {['Enterprise', 'Pro', 'Starter', 'PAYG'].map((n, i) => (
                      <div key={n} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ background: CHART_COLORS[i] }} />
                        <span className="text-xs text-muted-foreground">{n}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start gap-2 text-sm h-9"><AlertTriangle className="h-4 w-4 text-warning" /> View Low Balance Cafes ({cafeAccounts.filter(c => c.status === 'low_balance').length})</Button>
                  <Button variant="outline" className="w-full justify-start gap-2 text-sm h-9"><Zap className="h-4 w-4 text-destructive" /> Suspended Accounts ({cafeAccounts.filter(c => c.status === 'suspended').length})</Button>
                  <Button variant="outline" className="w-full justify-start gap-2 text-sm h-9"><Receipt className="h-4 w-4 text-primary" /> Generate Platform Report</Button>
                  <Button variant="outline" className="w-full justify-start gap-2 text-sm h-9"><Crown className="h-4 w-4 text-primary" /> Manage Subscription Plans</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* ===== SUBSCRIPTION PLANS TAB ===== */}
        <TabsContent value="plans" className="space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-foreground">Choose Your Plan</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {canViewAllCafes
                ? 'Manage and configure subscription plans available to cafes'
                : 'Select the plan that best fits your gaming center'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {subscriptionPlans.map(plan => (
              <Card
                key={plan.id}
                className={cn(
                  'relative transition-all hover:shadow-lg cursor-pointer',
                  plan.popular && 'border-primary shadow-primary/10 shadow-md',
                  selectedPlan === plan.id && 'ring-2 ring-primary'
                )}
                onClick={() => !canViewAllCafes && setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground text-[10px] px-3">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="pb-3 pt-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn("p-2 rounded-lg bg-muted", plan.popular && "bg-primary/10")}>
                      <plan.icon className={cn("h-5 w-5", plan.color)} />
                    </div>
                    <CardTitle className="text-base">{plan.name}</CardTitle>
                  </div>
                  <div>
                    {plan.price ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-foreground">₹{(plan.price / 1000).toFixed(0)}K</span>
                        <span className="text-xs text-muted-foreground">/month</span>
                      </div>
                    ) : (
                      <span className="text-lg font-semibold text-muted-foreground">{plan.priceLabel}</span>
                    )}
                  </div>
                  <CardDescription className="text-xs mt-1">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-muted-foreground">{f}</span>
                    </div>
                  ))}
                  <div className="pt-3">
                    {canViewAllCafes ? (
                      <Button variant="outline" size="sm" className="w-full text-xs">Edit Plan</Button>
                    ) : (
                      <Button
                        variant={plan.popular ? "default" : "outline"}
                        size="sm"
                        className="w-full text-xs"
                      >
                        {selectedPlan === plan.id ? 'Current Plan' : plan.price ? 'Subscribe' : 'Current Plan'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Plan comparison note */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Upgrade Tip</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Subscribing to a plan gives you discounted GPU rates and free monthly credits. If your monthly usage exceeds ₹50,000, the Starter plan pays for itself. For usage above ₹1,50,000, the Pro plan saves you up to ₹30,000/month.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== SESSION USAGE TAB ===== */}
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
                    Total = (Base + GPU Premium + Peak Surcharge + Streaming) x Duration
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
                  <Badge variant="secondary">Pro</Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Billing Cycle</span>
                  <span className="text-sm font-medium">Monthly</span>
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
                    <Input placeholder="Search sessions..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-8 h-9 w-48 text-sm" />
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
                      {canViewAllCafes && <TableHead className="text-xs">Cafe</TableHead>}
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
                        {canViewAllCafes && <TableCell className="text-sm">{s.cafe}</TableCell>}
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
              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</p>
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

        {/* ===== WALLET TAB ===== */}
        {(canRecharge || canViewAllCafes) && (
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
                      <p className="text-sm text-muted-foreground">{canViewAllCafes ? 'Platform Wallet' : 'Current Balance'}</p>
                      <p className="text-3xl font-bold text-foreground">{canViewAllCafes ? '₹8,55,000' : '₹1,24,500'}</p>
                    </div>
                  </div>
                  {canRecharge && (
                    <div className="flex gap-2">
                      <Button className="flex-1 gap-2"><Plus className="h-4 w-4" /> Recharge</Button>
                      <Button variant="outline" className="gap-2">Auto-Pay</Button>
                    </div>
                  )}
                  {canViewAllCafes && (
                    <p className="text-xs text-muted-foreground mt-3">Combined balance across {cafeAccounts.length} cafe accounts</p>
                  )}
                  <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/20">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      <p className="text-xs text-warning font-medium">
                        {canViewAllCafes ? `${cafeAccounts.filter(c => c.balance < 10000).length} cafes below ₹10,000` : 'Low balance alert set at ₹10,000'}
                      </p>
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
                  {canRecharge && <Button variant="outline" className="w-full gap-2 mt-2"><Plus className="h-4 w-4" /> Add Method</Button>}
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

            {/* Invoices */}
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
                            <Badge className={cn('text-[10px] border-0', inv.status === 'paid' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning')}>
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
        )}

        {/* ===== RESOURCES TAB ===== */}
        <TabsContent value="resources" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <p className="text-xs text-muted-foreground mt-2">Your GPU utilization is efficient. Consider upgrading during peak hours.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Lightbulb className="h-4 w-4 text-warning" /> Cost Optimization Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { tip: 'Schedule heavy games outside peak hours (4-10 PM) to save up to 20% on GPU costs.', savings: '₹5,200/mo' },
                  { tip: 'Enable auto-shutdown for idle sessions after 15 minutes to reduce wasted GPU time.', savings: '₹3,800/mo' },
                  { tip: 'Batch similar game sessions on the same GPU node for better resource sharing.', savings: '₹2,100/mo' },
                  { tip: 'Consider upgrading to Pro plan if monthly usage exceeds ₹1,50,000.', savings: '₹12,000/mo' },
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

        {/* ===== ANALYTICS TAB ===== */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Daily Revenue</CardTitle>
                <CardDescription>Revenue trend for the current week</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="billRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(234, 89%, 64%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(234, 89%, 64%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="day" className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
                    <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Revenue']} contentStyle={{ background: 'hsl(222, 47%, 9%)', border: '1px solid hsl(222, 40%, 16%)', borderRadius: '8px', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(234, 89%, 64%)" fill="url(#billRevenueGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

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

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Peak Usage Hours</CardTitle>
                <CardDescription>Utilization across the day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={peakHoursData}>
                    <defs>
                      <linearGradient id="billPeakGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="hour" className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} />
                    <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} tickFormatter={v => `${v}%`} />
                    <Tooltip formatter={(v: number) => [`${v}%`, 'Utilization']} contentStyle={{ background: 'hsl(222, 47%, 9%)', border: '1px solid hsl(222, 40%, 16%)', borderRadius: '8px', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="usage" stroke="hsl(262, 83%, 58%)" fill="url(#billPeakGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

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
      </Tabs>

      {/* Alerts */}
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
                <p className="text-xs text-muted-foreground mt-0.5">
                  {canViewAllCafes ? '2 cafes below minimum balance threshold.' : 'Balance below ₹15,000. Recharge to avoid interruption.'}
                </p>
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
                <p className="text-xs text-muted-foreground mt-0.5">Branch B approaching max concurrent sessions (8/10).</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
