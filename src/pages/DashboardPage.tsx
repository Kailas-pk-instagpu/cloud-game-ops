import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/lib/store';
import CafeOwnerDashboard from '@/features/dashboards/CafeOwnerDashboard';
import ManagerDashboardHome from '@/features/dashboards/ManagerDashboardHome';

// POC: only Cafe Owner + Manager have a dashboard. Other roles are bounced to login.
export default function DashboardPage() {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'cafe_owner': return <CafeOwnerDashboard />;
    case 'manager': return <ManagerDashboardHome />;
    default: return <Navigate to="/login" replace />;
  }
}
