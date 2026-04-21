import ActiveSessionDashboard from '@/features/billing/ActiveSessionDashboard';
import { useAuthStore } from '@/shared/lib/store';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Eye } from 'lucide-react';

export default function BillingSessionPage() {
  const { user } = useAuthStore();
  const canManage = user?.role === 'cafe_owner';

  return (
    <div className="space-y-4">
      {!canManage && (
        <Alert className="border-primary/30 bg-primary/5">
          <Eye className="h-4 w-4" />
          <AlertTitle>View-only access</AlertTitle>
          <AlertDescription>
            Billing sessions are managed by the cafe owner. You can view live bills but cannot end sessions.
          </AlertDescription>
        </Alert>
      )}
      <ActiveSessionDashboard readOnly={!canManage} />
    </div>
  );
}
