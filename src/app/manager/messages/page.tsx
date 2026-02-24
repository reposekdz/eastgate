"use client";

import { useAuthStore } from "@/lib/store/auth-store";
import StaffChat from "@/components/shared/StaffChat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Users, Clock, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";

interface ChatStats {
  totalConversations: number;
  unreadMessages: number;
  activeUsers: number;
  responseTime: string;
}

export default function ManagerMessagesPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<ChatStats>({
    totalConversations: 0,
    unreadMessages: 0,
    activeUsers: 0,
    responseTime: "< 5 min"
  });

  // Fetch chat statistics
  const fetchStats = async () => {
    try {
      const [conversationsRes, activeUsersRes] = await Promise.all([
        fetch(`/api/chat/conversations?branchId=${user?.branchId || "br-001"}`),
        fetch(`/api/chat/active-users?branchId=${user?.branchId || "br-001"}`)
      ]);

      const conversationsData = await conversationsRes.json();
      const activeUsersData = await activeUsersRes.json();

      if (conversationsData.success && activeUsersData.success) {
        const totalUnread = conversationsData.conversations?.reduce(
          (sum: number, conv: any) => sum + (conv.unreadCount || 0), 0
        ) || 0;

        setStats({
          totalConversations: conversationsData.conversations?.length || 0,
          unreadMessages: totalUnread,
          activeUsers: activeUsersData.activeUsers?.length || 0,
          responseTime: "< 5 min"
        });
      }
    } catch (error) {
      console.error("Failed to fetch chat stats:", error);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [user?.branchId]);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-charcoal">Guest Messages</h1>
        <p className="text-text-muted-custom mt-2">
          Manage guest conversations and provide real-time support
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConversations}</div>
            <p className="text-xs text-muted-foreground">
              Active guest chats
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <MessageCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.unreadMessages}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff Online</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Available to respond
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.responseTime}</div>
            <p className="text-xs text-muted-foreground">
              Response speed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chat Interface */}
      <StaffChat
        staffId={user.id}
        staffName={user.name}
        branchId={user.branchId || "br-001"}
      />
    </div>
  );
}