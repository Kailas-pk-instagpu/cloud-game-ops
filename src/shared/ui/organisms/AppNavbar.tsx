import { Bell, Moon, Sun, Search } from 'lucide-react';
import { useAuthStore } from '@/shared/lib/store';
import { useNotificationStore } from '@/shared/lib/store';
import { ROLE_LABELS } from '@/shared/types/auth';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

export function AppNavbar() {
  const { user, theme, toggleTheme } = useAuthStore();
  const { notifications, markAsRead, clearAll } = useNotificationStore();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        <div className="hidden md:flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="border-0 bg-transparent h-7 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 w-48"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {user && (
          <span className="hidden sm:inline text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
            {ROLE_LABELS[user.role]}
          </span>
        )}

        <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9 text-muted-foreground hover:text-foreground">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 relative text-muted-foreground hover:text-foreground">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 text-[10px] bg-destructive text-destructive-foreground border-0">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-3 py-2">
              <p className="text-sm font-semibold">Notifications</p>
              {unreadCount > 0 && (
                <button onClick={clearAll} className="text-xs text-primary hover:underline">Mark all read</button>
              )}
            </div>
            <DropdownMenuSeparator />
            {notifications.slice(0, 5).map(n => (
              <DropdownMenuItem key={n.id} onClick={() => markAsRead(n.id)} className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                <div className="flex items-center gap-2 w-full">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${n.read ? 'bg-transparent' :
                    n.type === 'error' ? 'bg-destructive' : n.type === 'warning' ? 'bg-warning' : n.type === 'success' ? 'bg-success' : 'bg-info'}`} />
                  <span className="text-sm font-medium flex-1">{n.title}</span>
                  <span className="text-[10px] text-muted-foreground">{n.timestamp}</span>
                </div>
                <p className="text-xs text-muted-foreground pl-3.5">{n.message}</p>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
