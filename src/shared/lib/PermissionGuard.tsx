import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/lib/store';
import { useCan, type Permission } from '@/shared/lib/permissions';

interface PermissionGuardProps {
  /** Needed to open the page. Omit together with `hidden` for a page hidden from everyone (e.g. pre-booking). */
  permission?: Permission;
  hidden?: boolean;
  children: React.ReactNode;
}

/** Opens the page only when the signed-in person has the permission (configurable by the super admin); otherwise the dashboard. */
export function PermissionGuard({ permission, hidden, children }: PermissionGuardProps) {
  const { user } = useAuthStore();
  const can = useCan();
  if (!user || hidden || (permission && !can(permission))) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}
