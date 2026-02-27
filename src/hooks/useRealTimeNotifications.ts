import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/lib/store/auth-store";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export function useRealTimeNotifications(pollingInterval = 5000) {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastCheck, setLastCheck] = useState(new Date().toISOString());

  const fetchNotifications = useCallback(async () => {
    if (!user?.branchId) return;

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("eastgate-token") : "";
      const params = new URLSearchParams({
        branchId: user.branchId,
        lastCheck,
      });

      const response = await fetch(`/api/notifications/realtime?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.notifications && data.notifications.length > 0) {
          // Show toast for new notifications
          data.notifications.forEach((notif: Notification) => {
            if (notif.type === "success") {
              toast.success(notif.title, { description: notif.message });
            } else if (notif.type === "error") {
              toast.error(notif.title, { description: notif.message });
            } else if (notif.type === "warning") {
              toast.warning(notif.title, { description: notif.message });
            } else {
              toast.info(notif.title, { description: notif.message });
            }
          });

          setNotifications((prev) => [...data.notifications, ...prev]);
        }

        setUnreadCount(data.unreadCount);
        setLastCheck(data.timestamp);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, [user, lastCheck]);

  const markAsRead = useCallback(async (notificationIds: string[]) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("eastgate-token") : "";
      const response = await fetch("/api/notifications/realtime", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notificationIds }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            notificationIds.includes(n.id) ? { ...n, read: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - notificationIds.length));
      }
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, pollingInterval);
    return () => clearInterval(interval);
  }, [fetchNotifications, pollingInterval]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    refresh: fetchNotifications,
  };
}
