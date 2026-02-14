"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/auth-store";
import { useBranchStore } from "@/lib/store/branch-store";
import {
  Bell,
  UtensilsCrossed,
  CalendarCheck,
  ClipboardList,
  AlertTriangle,
  MessageSquare,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "order":
      return <UtensilsCrossed className="h-4 w-4 text-amber-600" />;
    case "booking":
      return <CalendarCheck className="h-4 w-4 text-blue-600" />;
    case "service":
      return <ClipboardList className="h-4 w-4 text-purple-600" />;
    case "alert":
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    case "chat":
      return <MessageSquare className="h-4 w-4 text-emerald-600" />;
    default:
      return <Bell className="h-4 w-4 text-gray-600" />;
  }
};

const getNotificationBg = (type: string, read: boolean) => {
  if (read) return "bg-white hover:bg-pearl/30";
  switch (type) {
    case "order":
      return "bg-amber-50/50 hover:bg-amber-50";
    case "booking":
      return "bg-blue-50/50 hover:bg-blue-50";
    case "service":
      return "bg-purple-50/50 hover:bg-purple-50";
    case "alert":
      return "bg-red-50/50 hover:bg-red-50";
    case "chat":
      return "bg-emerald-50/50 hover:bg-emerald-50";
    default:
      return "bg-pearl/30 hover:bg-pearl/50";
  }
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function WaiterNotificationsPage() {
  const { user } = useAuthStore();
  const { getNotifications, markNotificationRead } = useBranchStore();
  const branchId = user?.branchId || "br-001";
  const userRole = user?.role || "waiter";
  const notifications = getNotifications(branchId, userRole);

  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filteredNotifications =
    filter === "unread"
      ? notifications.filter((n) => !n.read)
      : notifications;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    notifications.filter((n) => !n.read).forEach((n) => markNotificationRead(n.id));
    toast.success("All notifications marked as read");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="heading-md text-charcoal">Notifications</h1>
          <p className="body-sm text-text-muted-custom mt-1">
            Stay updated with orders, bookings, and service alerts
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All ({notifications.length})
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("unread")}
          >
            Unread ({unreadCount})
          </Button>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
              <CheckCircle2 className="mr-1 h-4 w-4" /> Mark All Read
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-4 p-4 cursor-pointer transition-colors ${getNotificationBg(
                  notification.type,
                  notification.read
                )}`}
                onClick={() => {
                  if (!notification.read) {
                    markNotificationRead(notification.id);
                  }
                }}
              >
                <div className="h-10 w-10 rounded-xl bg-white border flex items-center justify-center shrink-0 shadow-sm">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={`text-sm ${!notification.read ? "font-bold text-charcoal" : "font-medium text-charcoal/80"}`}>
                      {notification.title}
                    </p>
                    {!notification.read && (
                      <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-text-muted-custom line-clamp-2">
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-1 mt-1.5 text-xs text-text-muted-custom">
                    <Clock className="h-3 w-3" />
                    {timeAgo(notification.createdAt)}
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] capitalize shrink-0">
                  {notification.type}
                </Badge>
              </div>
            ))}
            {filteredNotifications.length === 0 && (
              <div className="text-center py-12 text-text-muted-custom">
                <Bell className="h-10 w-10 mx-auto mb-3 text-amber-200" />
                <p className="text-sm font-medium">No notifications</p>
                <p className="text-xs">You&apos;re all caught up!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
