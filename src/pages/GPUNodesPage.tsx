import { MOCK_GPU_NODES } from '@/shared/lib/mock-data';
import { StatusBadge } from '@/shared/ui/atoms/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Cpu, Thermometer, HardDrive } from 'lucide-react';

export default function GPUNodesPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">GPU Nodes</h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1">Monitor and manage GPU infrastructure</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_GPU_NODES.map(node => (
          <Card key={node.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">{node.name}</CardTitle>
                <StatusBadge status={node.status} />
              </div>
              <p className="text-xs text-muted-foreground">{node.gpuModel} • {node.location}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {node.status !== 'offline' ? (
                <>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-muted-foreground"><Cpu className="h-3.5 w-3.5" /> Utilization</span>
                      <span className="font-medium">{node.utilization}%</span>
                    </div>
                    <Progress value={node.utilization} className="h-2" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-muted-foreground"><HardDrive className="h-3.5 w-3.5" /> Memory</span>
                      <span className="font-medium">{node.memoryUsed}/{node.memoryTotal} GB</span>
                    </div>
                    <Progress value={(node.memoryUsed / node.memoryTotal) * 100} className="h-2" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground"><Thermometer className="h-3.5 w-3.5" /> Temperature</span>
                    <span className={`font-medium ${node.temperature > 75 ? 'text-destructive' : node.temperature > 60 ? 'text-warning' : 'text-success'}`}>
                      {node.temperature}°C
                    </span>
                  </div>
                </>
              ) : (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  Node is currently offline
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
