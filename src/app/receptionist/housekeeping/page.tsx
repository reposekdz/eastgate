"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store/auth-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function HousekeepingPage() {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, [user?.branchId]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/receptionist/housekeeping?branchId=${user?.branchId}`);
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks);
      }
    } catch (error) {
      toast.error("Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Housekeeping</h1>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <Card key={task.id} className="p-6">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-semibold">Room {task.roomNumber}</h3>
                  <p className="text-sm text-muted-foreground">{task.type}</p>
                  <Badge>{task.status}</Badge>
                </div>
                <Button size="sm">Update</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
