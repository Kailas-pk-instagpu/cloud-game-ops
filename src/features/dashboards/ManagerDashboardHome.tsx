import { MOCK_SEATS, MOCK_BRANCHES, MOCK_USERS, REVENUE_DATA } from '@/shared/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Banknote, Monitor, Users, Clock, AlertCircle, Zap, Timer, Calendar, Coffee, UserCircle2 } from 'lucide-react';
import { StatCard } from '@/shared/ui/molecules/StatCard';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useShiftStore, WEEKDAYS, type Weekday } from '@/shared/lib/store';
import { RecentFeedbackWidget } from '@/features/feedback/RecentFeedbackWidget';
import { LoyaltyLeaderboard } from '@/features/loyalty/LoyaltyLeaderboard';

function formatTime12(t: string) {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 || 12;
  return `${hh}:${m.toString().padStart(2, '0')} ${period}`;
}

function getTodayWeekday(): Weekday {
  const map: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return map[new Date().getDay()];
}

function isShiftCurrent(start: string, end: string, now: Date) {
  const mins = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const s = sh * 60 + sm;
  const e = eh * 60 + em;
  return s <= e ? mins >= s && mins <= e : mins >= s || mins <= e;
}

const HOURLY_SESSIONS = [
  { hour: '9AM', sessions: 4 }, { hour: '10AM', sessions: 8 }, { hour: '11AM', sessions: 12 },
  { hour: '12PM', sessions: 15 }, { hour: '1PM', sessions: 18 }, { hour: '2PM', sessions: 16 },
  { hour: '3PM', sessions: 20 }, { hour: '4PM', sessions: 22 }, { hour: '5PM', sessions: 19 },
  { hour: '6PM', sessions: 14 },
];

const RECENT_ACTIVITY = [
  { action: 'Checked in', player: 'John D.', seat: 3, time: '2 min ago', type: 'checkin' },
  { action: 'Checked out', player: 'Sarah M.', seat: 7, time: '15 min ago', type: 'checkout' },
  { action: 'Seat restarted', player: '', seat: 15, time: '30 min ago', type: 'restart' },
  { action: 'Checked in', player: 'Mike T.', seat: 1, time: '45 min ago', type: 'checkin' },
  { action: 'Maintenance flagged', player: '', seat: 20, time: '1h ago', type: 'maintenance' },
];

export default function ManagerDashboardHome() {
  const seats = MOCK_SEATS.filter(s => s.branchId === 'branch-1');
  const occupied = seats.filter(s => s.status === 'occupied').length;
  const available = seats.filter(s => s.status === 'available').length;
  const maintenance = seats.filter(s => s.status === 'maintenance').length;
  const todayEarnings = REVENUE_DATA[5].revenue;
  const totalSessions = REVENUE_DATA.reduce((a, b) => a + b.sessions, 0);
  const branch = MOCK_BRANCHES.find(b => b.id === 'branch-1');

  const branchShifts = useShiftStore(s => s.shifts).filter(s => s.branchId === 'branch-1' && s.active);
  const today = getTodayWeekday();
  const now = new Date();
  const todayShifts = branchShifts.filter(s => s.weekdays.includes(today));
  const currentShift = todayShifts.find(s => isShiftCurrent(s.startTime, s.endTime, now)) || todayShifts[0];
  const shiftLabel = currentShift
    ? `${currentShift.name}: ${formatTime12(currentShift.startTime)} - ${formatTime12(currentShift.endTime)}`
    : 'Shift: 9:00 AM - 9:00 PM';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Floor Manager</h1>
          <p className="text-muted-foreground text-sm mt-1">Overview of {branch?.name || 'your branch'}</p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 hover:bg-muted px-3 py-1.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <Clock className="h-3.5 w-3.5" />
              <span>{shiftLabel}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            {currentShift ? (
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{currentShift.name}</p>
                    <p className="text-xs text-muted-foreground">{branch?.name}</p>
                  </div>
                  <Badge variant={isShiftCurrent(currentShift.startTime, currentShift.endTime, now) ? 'default' : 'secondary'}>
                    {isShiftCurrent(currentShift.startTime, currentShift.endTime, now) ? 'Active now' : 'Scheduled'}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatTime12(currentShift.startTime)} – {formatTime12(currentShift.endTime)}</span>
                </div>

                {currentShift.breakStart && currentShift.breakEnd && (
                  <div className="flex items-center gap-2 text-sm">
                    <Coffee className="h-4 w-4 text-muted-foreground" />
                    <span>Break: {formatTime12(currentShift.breakStart)} – {formatTime12(currentShift.breakEnd)}</span>
                  </div>
                )}

                <div className="flex items-start gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex flex-wrap gap-1">
                    {WEEKDAYS.map(d => (
                      <span
                        key={d.id}
                        className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded border',
                          currentShift.weekdays.includes(d.id)
                            ? 'bg-primary/10 text-primary border-primary/30'
                            : 'text-muted-foreground border-border'
                        )}
                      >
                        {d.label}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-start gap-2 text-sm">
                  <UserCircle2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Assigned managers</p>
                    {currentShift.managerIds.length ? (
                      <div className="flex flex-wrap gap-1">
                        {currentShift.managerIds.map(id => {
                          const u = MOCK_USERS.find(u => u.id === id);
                          return (
                            <span key={id} className="text-xs px-2 py-0.5 rounded-full bg-muted">
                              {u?.name || 'Unknown'}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs">No managers assigned</p>
                    )}
                  </div>
                </div>

                {todayShifts.length > 1 && (
                  <div className="pt-2 border-t">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">Other shifts today</p>
                    <div className="space-y-1">
                      {todayShifts.filter(s => s.id !== currentShift.id).map(s => (
                        <div key={s.id} className="flex items-center justify-between text-xs">
                          <span>{s.name}</span>
                          <span className="text-muted-foreground">{formatTime12(s.startTime)} – {formatTime12(s.endTime)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 text-center space-y-2">
                <Clock className="h-6 w-6 text-muted-foreground mx-auto" />
                <p className="text-sm font-medium">No shift configured</p>
                <p className="text-xs text-muted-foreground">
                  Ask your Cafe Owner or Admin to set up shifts for this branch in Branches → Shifts.
                </p>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        <StatCard title="Today's Earnings" value={`RM ${todayEarnings}`} icon={Banknote} iconClassName="bg-success/10 text-success" />
        <StatCard title="Occupied" value={occupied} subtitle={`of ${seats.length}`} icon={Users} iconClassName="bg-destructive/10 text-destructive" />
        <StatCard title="Available" value={available} icon={Monitor} iconClassName="bg-success/10 text-success" />
        <StatCard title="Maintenance" value={maintenance} icon={AlertCircle} iconClassName="bg-warning/10 text-warning" />
        <StatCard title="Sessions Today" value={totalSessions} icon={Zap} iconClassName="bg-info/10 text-info" />
        <StatCard title="Avg Duration" value="2.1 hrs" icon={Timer} iconClassName="bg-primary/10 text-primary" />
      </div>

      {/* Hourly Sessions + Recent Activity + Shift Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Hourly Sessions</CardTitle>
            <CardDescription>Session starts throughout today</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 pb-4">
            <div className="h-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={HOURLY_SESSIONS}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="hour" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
            <CardDescription>Latest floor actions</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between gap-2">
            {RECENT_ACTIVITY.map((log, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                <span className={cn(
                  'w-2 h-2 rounded-full flex-shrink-0',
                  log.type === 'checkin' && 'bg-success',
                  log.type === 'checkout' && 'bg-info',
                  log.type === 'restart' && 'bg-warning',
                  log.type === 'maintenance' && 'bg-destructive',
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{log.action}</span>
                    {log.player && <span className="text-muted-foreground"> · {log.player}</span>}
                    <span className="text-muted-foreground"> · Seat {log.seat}</span>
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{log.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Shift Summary</CardTitle>
            <CardDescription>Your current shift overview</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between gap-2">
            {[
              { label: 'Total Check-ins', value: '42' },
              { label: 'Total Check-outs', value: '28' },
              { label: 'Revenue Collected', value: `RM ${todayEarnings}` },
              { label: 'Avg Wait Time', value: '3 min' },
              { label: 'Issues Reported', value: '2' },
              { label: 'Customer Complaints', value: '0' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <span className="text-sm">{item.label}</span>
                <span className="text-sm font-semibold">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Weekly Performance */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Weekly Performance</CardTitle>
          <CardDescription>Revenue and sessions this week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={REVENUE_DATA}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={v => `RM ${v}`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="hsl(var(--success))" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="sessions" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-3 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-success rounded" /> Revenue</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-primary rounded" /> Sessions</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
