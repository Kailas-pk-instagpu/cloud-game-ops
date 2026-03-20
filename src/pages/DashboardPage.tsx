import { useAuthStore } from '@/shared/lib/store';
import SuperAdminDashboard from '@/features/dashboards/SuperAdminDashboard';
import AdminDashboard from '@/features/dashboards/AdminDashboard';
import CafeOwnerDashboard from '@/features/dashboards/CafeOwnerDashboard';
import ManagerDashboard from '@/features/dashboards/ManagerDashboard';

export default function DashboardPage() {
  const { user } = useAuthStore();
  if (!user) return null;

  switch (user.role) {
    case 'super_admin': return <SuperAdminDashboard />;
    case 'admin': return <AdminDashboard />;
    case 'cafe_owner': return <CafeOwnerDashboard />;
    case 'manager': return <ManagerDashboard />;
    default: return null;
  }
}
