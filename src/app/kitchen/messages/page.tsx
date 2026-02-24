"use client";

import { useAuthStore } from "@/lib/store/auth-store";
import StaffChat from "@/components/shared/StaffChat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Users, ChefHat, Clock } from "lucide-react";
import { useState, useEffect } from "react";

interface ChatStats {
  totalConversations: number;
  foodQuestions: number;
  activeUsers: number;
  avgResponseTime: string;
}

export default function KitchenMessagesPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<ChatStats>({
    totalConversations: 0,
    foodQuestions: 0,
    activeUsers: 0,
    avgResponseTime: "< 3 min"
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
        // Filter food-related conversations (simplified logic)
        const foodRelated = conversationsData.conversations?.filter((conv: any) => 
          conv.lastMessage?.toLowerCase().includes('food') ||
          conv.lastMessage?.toLowerCase().includes('menu') ||
          conv.lastMessage?.toLowerCase().includes('order') ||
          conv.lastMessage?.toLowerCase().includes('kitchen')
        ).length || 0;

        setStats({
          totalConversations: conversationsData.conversations?.length || 0,
          foodQuestions: foodRelated,
          activeUsers: activeUsersData.activeUsers?.length || 0,
          avgResponseTime: "< 3 min"
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
        <h1 className="text-3xl font-bold text-charcoal">Kitchen Support</h1>
        <p className="text-text-muted-custom mt-2">
          Answer guest questions about food, ingredients, and preparation
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Chats</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConversations}</div>
            <p className="text-xs text-muted-foreground">
              Guest conversations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Food Questions</CardTitle>
            <ChefHat className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.foodQuestions}</div>
            <p className="text-xs text-muted-foreground">
              Kitchen-related
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
              Available to help
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.avgResponseTime}</div>
            <p className="text-xs text-muted-foreground">
              Kitchen expertise
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

      {/* Kitchen Knowledge Base */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Kitchen Knowledge Base</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2 text-orange-600">Ingredients & Allergies:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Gluten-free options available</li>
                <li>• Halal meat certification</li>
                <li>• Vegan alternatives</li>
                <li>• Nut allergy precautions</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2 text-green-600">Preparation Times:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Appetizers: 10-15 min</li>
                <li>• Main courses: 20-30 min</li>
                <li>• Grilled items: 25-35 min</li>
                <li>• Desserts: 5-10 min</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2 text-blue-600">Special Requests:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Custom spice levels</li>
                <li>• Portion modifications</li>
                <li>• Cooking method changes</li>
                <li>• Side dish substitutions</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}