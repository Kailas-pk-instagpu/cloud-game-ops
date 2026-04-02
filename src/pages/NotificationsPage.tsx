import { Bell, Check, CheckCheck, Trash2, AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useNotificationStore } from '@/shared/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const typeIcon = {
  error: <AlertCircle className="h-5 w-5 text-destructive" />,
  warning: <AlertTriangle className="h-5 w-5 text-warning" />,
  success: <CheckCircle className="h-5 w-5 text-success" />,
  info: <Info className="h-5 w-5 text-info" />,
};

const typeBg = {
  error: 'bg-destructive/10',
  warning: 'bg-warning/10',
  success: 'bg-success/10',
  info: 'bg-info/10',
};

const typeLabel: Record<string, string> = {
  error: 'Error',
  warning: 'Warning',
  success: 'Success',
  info: 'Info',
};

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications } = useNotificationStore();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Notifications
            {unreadCount > 0 && (
              <Badge className="bg-destructive text-destructive-foreground text-[10px] sm:text-xs ml-1">{unreadCount} unread</Badge>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">View and manage all your notifications</p>
        </div>
        {notifications.length > 0 && (
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={markAllAsRead}>
                <CheckCheck className="h-4 w-4" />
                Mark all as read
              </Button>
            )}
            <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={deleteAllNotifications}>
              <Trash2 className="h-4 w-4" />
              Clear all
            </Button>
          </div>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Bell className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="text-lg font-medium text-foreground">No notifications</p>
            <p className="text-sm text-muted-foreground mt-1">You're all caught up! Check back later.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              All Notifications ({notifications.length})
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {notifications.map(n => (
                <div
                  key={n.id}
                  className={`flex items-start gap-4 px-6 py-4 transition-colors ${!n.read ? 'bg-accent/20' : ''} hover:bg-muted/30`}
                >
                  <div className={`mt-0.5 flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${typeBg[n.type]}`}>
                    {typeIcon[n.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={`text-sm ${!n.read ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'}`}>
                          {n.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="outline" className="text-[10px]">{typeLabel[n.type]}</Badge>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{n.timestamp}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {!n.read && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-primary hover:text-primary" onClick={() => markAsRead(n.id)}>
                          <Check className="h-3.5 w-3.5" />
                          Mark as read
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-destructive hover:text-destructive" onClick={() => deleteNotification(n.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
