import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, AlertTriangle, Radar } from 'lucide-react';
import LiveSessionsMonitor from '@/features/monitoring/LiveSessionsMonitor';
import FailedTransactionsMonitor from '@/features/monitoring/FailedTransactionsMonitor';

export default function MonitoringPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Radar className="h-6 w-6 text-primary" />
            Network Monitoring
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Live sessions across every cafe and a real-time view of failed billing transactions.
          </p>
        </div>
      </div>

      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sessions" className="gap-2">
            <Activity className="h-4 w-4" /> Live Sessions
          </TabsTrigger>
          <TabsTrigger value="failed" className="gap-2">
            <AlertTriangle className="h-4 w-4" /> Failed Transactions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="m-0">
          <LiveSessionsMonitor />
        </TabsContent>
        <TabsContent value="failed" className="m-0">
          <FailedTransactionsMonitor />
        </TabsContent>
      </Tabs>
    </div>
  );
}
