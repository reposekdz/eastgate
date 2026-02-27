"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store/auth-store";
import { getUserDisplayInfo } from "@/lib/user-utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sparkles,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BedDouble,
  Loader2,
  PlayCircle,
  XCircle,
  Calendar,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";

interface Task {
  id: string;
  type: string;
  entityId: string;
  status: string;
  priority: string;
  dueDate: string | null;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  room?: {
    number: string;
    type: string;
    floor: number;
  };
}

interface Stats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  urgent: number;
  overdue: number;
}

export default function HousekeepingDashboard() {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const userInfo = getUserDisplayInfo(user?.email || "", user?.name);

  const fetchTasks = async () => {
    if (!user?.branchId) return;

    try {
      const params = new URLSearchParams({
        branchId: user.branchId,
        staffId: user.id,
        category: "housekeeping",
      });

      const response = await fetch(`/api/housekeeping/dashboard?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [user]);

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch("/api/housekeeping/dashboard", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          taskId,
          status: newStatus,
        }),
      });

      if (response.ok) {
        toast.success(`Task ${newStatus === "completed" ? "completed" : "updated"}!`);
        fetchTasks();
      } else {
        toast.error("Failed to update task");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "in_progress":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-700 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    return task.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-emerald" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-emerald">
            <AvatarFallback
              className="text-lg font-semibold text-white"
              style={{ backgroundColor: userInfo.avatarColor }}
            >
              {userInfo.initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-charcoal">
              Welcome, {userInfo.displayName}!
            </h1>
            <p className="text-sm text-text-muted-custom">
              Housekeeping Staff • {user?.branch?.name || "EastGate Hotel"}
            </p>
          </div>
        </div>
        <Button
          onClick={fetchTasks}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Clock className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="border-pearl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-charcoal">{stats.total}</p>
                  <p className="text-xs text-text-muted-custom">Total Tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-pearl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-charcoal">{stats.pending}</p>
                  <p className="text-xs text-text-muted-custom">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-pearl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <PlayCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-charcoal">{stats.inProgress}</p>
                  <p className="text-xs text-text-muted-custom">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-pearl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-charcoal">{stats.completed}</p>
                  <p className="text-xs text-text-muted-custom">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-pearl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-charcoal">{stats.urgent}</p>
                  <p className="text-xs text-text-muted-custom">Urgent</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-pearl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-charcoal">{stats.overdue}</p>
                  <p className="text-xs text-text-muted-custom">Overdue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
          className={filter === "all" ? "bg-emerald hover:bg-emerald-dark" : ""}
        >
          All Tasks ({tasks.length})
        </Button>
        <Button
          variant={filter === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("pending")}
          className={filter === "pending" ? "bg-orange-500 hover:bg-orange-600" : ""}
        >
          Pending ({stats?.pending || 0})
        </Button>
        <Button
          variant={filter === "in_progress" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("in_progress")}
          className={filter === "in_progress" ? "bg-blue-500 hover:bg-blue-600" : ""}
        >
          In Progress ({stats?.inProgress || 0})
        </Button>
        <Button
          variant={filter === "completed" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("completed")}
          className={filter === "completed" ? "bg-green-500 hover:bg-green-600" : ""}
        >
          Completed ({stats?.completed || 0})
        </Button>
      </div>

      {/* Tasks List */}
      <Card className="border-pearl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BedDouble className="h-5 w-5 text-emerald" />
            My Tasks
          </CardTitle>
          <CardDescription>
            {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""} assigned to you
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-text-muted-custom">No tasks found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 rounded-lg border-2 ${
                    task.priority === "urgent"
                      ? "border-red-200 bg-red-50"
                      : "border-pearl bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-charcoal">
                          {task.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </h3>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority.toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status.replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>

                      {task.room && (
                        <div className="flex items-center gap-4 text-sm text-text-muted-custom mb-2">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            Room {task.room.number}
                          </div>
                          <span>•</span>
                          <span>{task.room.type}</span>
                          <span>•</span>
                          <span>Floor {task.room.floor}</span>
                        </div>
                      )}

                      {task.notes && (
                        <p className="text-sm text-slate-custom mb-2">{task.notes}</p>
                      )}

                      {task.dueDate && (
                        <div className="flex items-center gap-1 text-xs text-text-muted-custom">
                          <Calendar className="h-3 w-3" />
                          Due: {new Date(task.dueDate).toLocaleString()}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {task.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(task.id, "in_progress")}
                          className="bg-blue-500 hover:bg-blue-600 text-white"
                        >
                          <PlayCircle className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                      )}
                      {task.status === "in_progress" && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(task.id, "completed")}
                          className="bg-green-500 hover:bg-green-600 text-white"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
