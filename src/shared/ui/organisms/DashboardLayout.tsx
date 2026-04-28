import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/shared/lib/store';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { AppNavbar } from './AppNavbar';
import { ManagerBillingBanner } from '@/features/billing/ManagerBillingBanner';

export function DashboardLayout() {
  const { isAuthenticated, user, is2FAVerified } = useAuthStore();

  if (!user) return <Navigate to="/login" replace />;
  if (user.is2FAEnabled && !is2FAVerified) return <Navigate to="/verify-2fa" replace />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AppNavbar />
          <ManagerBillingBanner />
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
