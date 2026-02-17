"use client";

export const dynamic = "force-dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/auth-store";
import { useBranchStore } from "@/lib/store/branch-store";
import { Bell, CheckCircle2, ClipboardList } from "lucide-react";

function formatNotifTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
}

export default function KitchenNotificationsPage() {
  const { user } = useAuthStore();
  const { getNotifications, markNotificationRead } = useBranchStore();
  const branchId = user?.branchId || "br-001";
  const userRole = user?.role || "kitchen_staff";
  const notifications = getNotifications(branchId, userRole);
  const unread = notifications.filter((n) => !n.read);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-md text-charcoal">Notifications</h1>
        <p className="body-sm text-text-muted-custom mt-1">
          Order and kitchen alerts · {user?.branchName}
        </p>
      </div>

      {unread.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-muted-custom">{unread.length} unread</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => notifications.forEach((n) => markNotificationRead(n.id))}
          >
            Mark all read
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-text-muted-custom">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No notifications yet.</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((n) => (
            <Card key={n.id} className={!n.read ? "border-l-4 border-l-orange-500" : ""}>
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className="h-9 w-9 rounded-lg bg-pearl flex items-center justify-center shrink-0">
                    {n.type === "order" ? (
                      <ClipboardList className="h-4 w-4 text-orange-600" />
                    ) : (
                      <Bell className="h-4 w-4 text-charcoal" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-charcoal">{n.title}</p>
                    <p className="text-sm text-text-muted-custom mt-0.5">{n.message}</p>
                    <p className="text-xs text-text-muted-custom mt-1">{formatNotifTime(n.createdAt)}</p>
                  </div>
                </div>
                {!n.read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markNotificationRead(n.id)}
                    className="shrink-0"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Mark read
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
