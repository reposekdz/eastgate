"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store/auth-store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Calendar, MapPin, Clock } from "lucide-react";

export default function CompletedTasksPage() {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    const fetchCompleted = async () => {
      if (!user?.branchId) return;
      try {
        const params = new URLSearchParams({
          branchId: user.branchId,
          staffId: user.id,
          status: "completed",
          category: "housekeeping",
        });
        const response = await fetch(`/api/housekeeping/dashboard?${params}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (response.ok) {
          const data = await response.json();
          setTasks(data.tasks || []);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchCompleted();
  }, [user]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-charcoal">Completed Tasks</h1>
        <p className="text-sm text-text-muted-custom">Your task completion history</p>
      </div>

      <div className="grid gap-4">
        {tasks.map((task) => (
          <Card key={task.id} className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-charcoal mb-1">
                    {task.type.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </h3>
                  {task.room && (
                    <div className="flex items-center gap-2 text-sm text-text-muted-custom mb-2">
                      <MapPin className="h-4 w-4" />
                      Room {task.room.number} • Floor {task.room.floor}
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-xs text-text-muted-custom">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Completed: {new Date(task.completedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-700">COMPLETED</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
