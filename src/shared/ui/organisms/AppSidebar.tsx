import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/lib/store';
import { getRoutesForRole } from '@/shared/lib/rbac';

import {
  LayoutDashboard, Users, Cpu, Building2, Monitor, BarChart3, Settings, Gamepad2, Bell, CalendarCheck
} from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, SidebarHeader,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Users, Cpu, Building2, Monitor, BarChart3, Settings, Bell, CalendarCheck,
};

export function AppSidebar() {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  if (!user) return null;

  const routes = getRoutesForRole(user.role);

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border overflow-hidden px-3 py-3 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2 transition-all duration-200">
        <div className="flex items-center gap-3 min-w-0 group-data-[collapsible=icon]:justify-center">
          <div className="w-8 h-8 min-w-[2rem] rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
            <Gamepad2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="overflow-hidden transition-all duration-200 ease-in-out group-data-[collapsible=icon]:hidden">
            <h2 className="text-sm font-bold text-sidebar-accent-foreground tracking-tight whitespace-nowrap">GPU Cloud</h2>
            <p className="text-[10px] italic font-medium text-muted-foreground mt-0.5 whitespace-nowrap">Beyond Hardware</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4 group-data-[collapsible=icon]:px-0 transition-all duration-200">
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
                        'rounded-lg transition-all duration-200 h-10 group-data-[collapsible=icon]:justify-center',
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

      <SidebarFooter />
    </Sidebar>
  );
}
