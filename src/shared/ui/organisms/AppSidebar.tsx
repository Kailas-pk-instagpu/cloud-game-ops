import { useLocation } from 'react-router-dom';
import { useAuthStore } from '@/shared/lib/store';
import { getRoutesForRole } from '@/shared/lib/rbac';
import { ROLE_LABELS } from '@/shared/types/auth';
import {
  LayoutDashboard, Users, Cpu, Building2, Monitor, BarChart3, Settings, Gamepad2, Bell
} from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, SidebarHeader,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Users, Cpu, Building2, Monitor, BarChart3, Settings, Bell,
};

export function AppSidebar() {
  const { user } = useAuthStore();
  const location = useLocation();
  if (!user) return null;

  const routes = getRoutesForRole(user.role);

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
            <Gamepad2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="overflow-hidden group-data-[collapsible=icon]:hidden">
            <h2 className="text-sm font-bold text-sidebar-accent-foreground tracking-tight">GPU Cloud</h2>
            <p className="text-[11px] text-sidebar-foreground/60">Gaming Platform</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-wider text-sidebar-foreground/40 font-semibold px-3 mb-1">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {routes.map((route) => {
                const Icon = ICON_MAP[route.icon] || LayoutDashboard;
                const active = location.pathname === route.path;
                return (
                  <SidebarMenuItem key={route.path}>
                    <SidebarMenuButton
                      onClick={() => navigate(route.path)}
                      className={cn(
                        'rounded-lg transition-all h-10',
                        active
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-primary/20'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{route.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 p-2 rounded-lg group-data-[collapsible=icon]:justify-center">
          {user.logoUrl ? (
            <img src={user.logoUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary-foreground">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
          )}
          <div className="overflow-hidden group-data-[collapsible=icon]:hidden flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-accent-foreground truncate">{user.name}</p>
            <p className="text-[11px] text-sidebar-foreground/60">{ROLE_LABELS[user.role]}</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
