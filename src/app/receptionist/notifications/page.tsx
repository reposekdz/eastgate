"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store/auth-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, RefreshCw, Check } from "lucide-react";
import { toast } from "sonner";

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [user?.branchId]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/receptionist/notifications?branchId=${user?.branchId}`);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      toast.error("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/receptionist/notifications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id, read: true }),
      });
      fetchNotifications();
      toast.success("Marked as read");
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8 text-emerald" />
            Notifications
          </h1>
          <p className="text-muted-foreground">Stay updated with real-time alerts</p>
        </div>
        <Button onClick={fetchNotifications} variant="outline">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notif) => (
            <Card key={notif.id} className={`p-6 ${!notif.read ? "border-l-4 border-l-emerald" : ""}`}>
              <div className="flex justify-between items-start">
                <div className="flex gap-4 flex-1">
                  <Bell className={`h-5 w-5 ${!notif.read ? "text-emerald" : "text-muted-foreground"}`} />
                  <div className="flex-1">
                    <h3 className="font-semibold">{notif.title}</h3>
                    <p className="text-sm text-muted-foreground">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(notif.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                {!notif.read && (
                  <Button size="sm" variant="ghost" onClick={() => markAsRead(notif.id)}>
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
          {notifications.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No notifications</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
