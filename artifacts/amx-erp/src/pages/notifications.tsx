import { 
  useListNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  getListNotificationsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Check, CheckCheck, Info, AlertCircle, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Notifications() {
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useListNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const handleMarkRead = (id: number) => {
    markRead.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      }
    });
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      }
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      default: return <Info className="h-5 w-5 text-primary" />;
    }
  };

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground mt-1">Stay updated on important enterprise events.</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllRead} disabled={markAllRead.isPending}>
            <CheckCheck className="h-4 w-4 mr-2" /> Mark all as read
          </Button>
        )}
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" /> 
            Inbox {unreadCount > 0 && <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">{unreadCount} new</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications && notifications.length > 0 ? (
            notifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`p-4 flex gap-4 transition-colors ${!notif.read ? 'bg-primary/5' : 'hover:bg-muted/50'}`}
              >
                <div className="shrink-0 mt-1">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1">
                  <h4 className={`text-sm ${!notif.read ? 'font-bold' : 'font-medium text-foreground/80'}`}>
                    {notif.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {!notif.read && (
                  <div className="shrink-0">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleMarkRead(notif.id)}
                      disabled={markRead.isPending}
                      className="text-primary hover:bg-primary/10"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-12 flex flex-col items-center justify-center text-muted-foreground">
              <Bell className="h-12 w-12 opacity-20 mb-4" />
              <p>You're all caught up!</p>
              <p className="text-sm mt-1">No new notifications.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}