import { Bell, Moon, Sun, Search, Check, Trash2, CheckCheck, X, AlertTriangle, Info, AlertCircle, CheckCircle, LogOut, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/lib/store';
import { useNotificationStore } from '@/shared/lib/store';
import { ROLE_LABELS } from '@/shared/types/auth';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger
} from '@/components/ui/sheet';
import { BillingStatusIndicator } from '@/shared/ui/atoms/BillingStatusIndicator';

const typeIcon = {
  error: <AlertCircle className="h-4 w-4 text-destructive" />,
  warning: <AlertTriangle className="h-4 w-4 text-warning" />,
  success: <CheckCircle className="h-4 w-4 text-success" />,
  info: <Info className="h-4 w-4 text-info" />,
};

const typeBg = {
  error: 'bg-destructive/10',
  warning: 'bg-warning/10',
  success: 'bg-success/10',
  info: 'bg-info/10',
};

export function AppNavbar() {
  const { user, theme, toggleTheme, logout } = useAuthStore();
  const navigate = useNavigate();
  const { notifications, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications } = useNotificationStore();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
      </div>

      <div className="flex items-center gap-2">
        <BillingStatusIndicator />
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hidden sm:flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors focus:outline-none">
                {user.logoUrl ? (
                  <img src={user.logoUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-[11px] font-bold text-primary-foreground">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { logout(); navigate('/login'); }} className="cursor-pointer gap-2 text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9 text-muted-foreground hover:text-foreground">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 relative text-muted-foreground hover:text-foreground">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 text-[10px] bg-destructive text-destructive-foreground border-0">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:w-[400px] p-0 flex flex-col">
            <SheetHeader className="px-4 pt-4 pb-2">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-lg">
                  Notifications
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">{unreadCount} new</Badge>
                  )}
                </SheetTitle>
              </div>
              {notifications.length > 0 && (
                <div className="flex items-center gap-2 pt-1">
                  <TooltipProvider>
                    {unreadCount > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={markAllAsRead}>
                            <CheckCheck className="h-3.5 w-3.5" />
                            Mark all read
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Mark all notifications as read</TooltipContent>
                      </Tooltip>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 text-destructive hover:text-destructive" onClick={deleteAllNotifications}>
                          <Trash2 className="h-3.5 w-3.5" />
                          Clear all
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete all notifications</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </SheetHeader>
            <Separator />
            <ScrollArea className="flex-1">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Bell className="h-10 w-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium">No notifications</p>
                  <p className="text-xs mt-1">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 flex gap-3 transition-colors ${!n.read ? 'bg-accent/30' : ''} hover:bg-muted/50`}
                    >
                      <div className={`mt-0.5 flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${typeBg[n.type]}`}>
                        {typeIcon[n.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm leading-tight ${!n.read ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5">{n.timestamp}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                        <div className="flex items-center gap-1 mt-2">
                          {!n.read && (
                            <Button variant="ghost" size="sm" className="h-6 text-[11px] px-2 gap-1 text-primary hover:text-primary" onClick={() => markAsRead(n.id)}>
                              <Check className="h-3 w-3" />
                              Mark read
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="h-6 text-[11px] px-2 gap-1 text-destructive hover:text-destructive" onClick={() => deleteNotification(n.id)}>
                            <X className="h-3 w-3" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
