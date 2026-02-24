"use client";

import { useAuthStore } from "@/lib/store/auth-store";
import StaffChat from "@/components/shared/StaffChat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Users, Clock, ChefHat } from "lucide-react";
import { useState, useEffect } from "react";

interface ChatStats {
  totalConversations: number;
  unreadMessages: number;
  activeUsers: number;
  myResponses: number;
}

export default function WaiterMessagesPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<ChatStats>({
    totalConversations: 0,
    unreadMessages: 0,
    activeUsers: 0,
    myResponses: 0
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
          myResponses: Math.floor(Math.random() * 15) + 5 // Simulated for now
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
        <h1 className="text-3xl font-bold text-charcoal">Guest Support</h1>
        <p className="text-text-muted-custom mt-2">
          Help guests with dining questions and room service requests
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Guest Chats</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConversations}</div>
            <p className="text-xs text-muted-foreground">
              Active conversations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <MessageCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.unreadMessages}</div>
            <p className="text-xs text-muted-foreground">
              Need response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Online</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Staff available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Responses</CardTitle>
            <ChefHat className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.myResponses}</div>
            <p className="text-xs text-muted-foreground">
              Today's help
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

      {/* Quick Response Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Response Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Common Food Questions:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Menu items and ingredients</li>
                <li>• Dietary restrictions (vegan, halal)</li>
                <li>• Preparation time estimates</li>
                <li>• Room service availability</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Service Requests:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Table reservations</li>
                <li>• Special occasion setups</li>
                <li>• Delivery to rooms</li>
                <li>• Payment assistance</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}