"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store/auth-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Search, Filter, PlayCircle, CheckCircle2, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";

export default function HousekeepingTasksPage() {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const fetchTasks = async () => {
    if (!user?.branchId) return;
    try {
      const params = new URLSearchParams({
        branchId: user.branchId,
        staffId: user.id,
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
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user]);

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch("/api/housekeeping/dashboard", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ taskId, status: newStatus }),
      });
      if (response.ok) {
        toast.success(`Task ${newStatus}!`);
        fetchTasks();
      }
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (statusFilter !== "all" && task.status !== statusFilter) return false;
    if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
    if (search && !task.type.toLowerCase().includes(search.toLowerCase()) && 
        !task.room?.number.includes(search)) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">My Tasks</h1>
          <p className="text-sm text-text-muted-custom">Manage your assigned cleaning tasks</p>
        </div>
        <Button onClick={fetchTasks} variant="outline" size="sm">
          <Clock className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted-custom" />
          <Input
            placeholder="Search tasks or rooms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredTasks.map((task) => (
          <Card key={task.id} className={`border-2 ${task.priority === "urgent" ? "border-red-200 bg-red-50" : "border-pearl"}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    <h3 className="font-semibold text-charcoal">
                      {task.type.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </h3>
                    <Badge className={task.priority === "urgent" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}>
                      {task.priority.toUpperCase()}
                    </Badge>
                    <Badge className={task.status === "completed" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}>
                      {task.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                  {task.room && (
                    <div className="flex items-center gap-2 text-sm text-text-muted-custom mb-2">
                      <MapPin className="h-4 w-4" />
                      Room {task.room.number} • {task.room.type} • Floor {task.room.floor}
                    </div>
                  )}
                  {task.notes && <p className="text-sm text-slate-custom">{task.notes}</p>}
                </div>
                <div className="flex flex-col gap-2">
                  {task.status === "pending" && (
                    <Button size="sm" onClick={() => handleUpdateStatus(task.id, "in_progress")} className="bg-blue-500 hover:bg-blue-600">
                      <PlayCircle className="h-4 w-4 mr-1" />
                      Start
                    </Button>
                  )}
                  {task.status === "in_progress" && (
                    <Button size="sm" onClick={() => handleUpdateStatus(task.id, "completed")} className="bg-green-500 hover:bg-green-600">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
