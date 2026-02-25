"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  getAuthenticatedApiUrl,
  formatDate,
  getStatusColor,
  getPriorityColor
} from "@/lib/utils";
import { useSession } from "next-auth/react";
import { 
  RefreshCw, 
  Plus, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Wrench,
  Sparkles,
  BedDouble,
  User,
  Filter,
  Search,
  X,
  Calendar
} from "lucide-react";

// Task type definitions
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
  staff?: {
    id: string;
    name: string;
    avatar: string | null;
    department: string;
    phone: string | null;
  };
  room?: {
    number: string;
    type: string;
    status: string;
    floor: number;
  };
}

const TASK_TYPES = {
  housekeeping: ["room_cleaning", "deep_cleaning", "turnover", "laundry", "amenities_restock"],
  maintenance: ["repair", "inspection", "preventive", "emergency", "utility"],
  inspection: ["quality_check", "safety_check", "compliance"],
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export default function HousekeepingDashboard() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [filter, setFilter] = useState({
    status: "",
    priority: "",
    category: "",
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [newTask, setNewTask] = useState({
    category: "housekeeping",
    taskType: "room_cleaning",
    roomId: "",
    staffId: "",
    priority: "medium",
    dueDate: "",
    notes: "",
  });

  const fetchTasks = useCallback(async () => {
    if (!session?.user?.branchId) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        branchId: session.user.branchId,
        ...(filter.status && { status: filter.status }),
        ...(filter.priority && { priority: filter.priority }),
        ...(filter.category && { category: filter.category }),
      });

      const response = await fetch(`${getAuthenticatedApiUrl()}/tasks/housekeeping?${params}`, {
        headers: {
          "Authorization": `Bearer ${(session as any)?.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  }, [session, filter]);

  const fetchStaffAndRooms = async () => {
    if (!session?.user?.branchId) return;
    
    try {
      // Fetch housekeeping and maintenance staff
      const staffResponse = await fetch(
        `${getAuthenticatedApiUrl()}/staff?branchId=${session.user.branchId}&department=housekeeping`,
        {
          headers: {
            "Authorization": `Bearer ${(session as any)?.accessToken}`,
          },
        }
      );
      if (staffResponse.ok) {
        const staffData = await staffResponse.json();
        setStaff(staffData.staff || []);
      }

      // Fetch rooms
      const roomsResponse = await fetch(
        `${getAuthenticatedApiUrl()}/rooms?branchId=${session.user.branchId}`,
        {
          headers: {
            "Authorization": `Bearer ${(session as any)?.accessToken}`,
          },
        }
      );
      if (roomsResponse.ok) {
        const roomsData = await roomsResponse.json();
        setRooms(roomsData.rooms || []);
      }
    } catch (error) {
      console.error("Error fetching staff/rooms:", error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (showCreateModal) {
      fetchStaffAndRooms();
    }
  }, [showCreateModal, session]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.branchId) return;

    try {
      const response = await fetch(`${getAuthenticatedApiUrl()}/tasks/housekeeping`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${(session as any)?.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newTask,
          branchId: session.user.branchId,
          roomNumber: rooms.find(r => r.id === newTask.roomId)?.number,
        }),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewTask({
          category: "housekeeping",
          taskType: "room_cleaning",
          roomId: "",
          staffId: "",
          priority: "medium",
          dueDate: "",
          notes: "",
        });
        fetchTasks();
      }
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  const handleUpdateStatus = async (taskId: string, status: string) => {
    try {
      const response = await fetch(`${getAuthenticatedApiUrl()}/tasks/housekeeping`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${(session as any)?.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId,
          status,
        }),
      });

      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const getTaskIcon = (type: string) => {
    if (TASK_TYPES.housekeeping.includes(type)) {
      return <Sparkles className="h-5 w-5 text-purple-500" />;
    } else if (TASK_TYPES.maintenance.includes(type)) {
      return <Wrench className="h-5 w-5 text-orange-500" />;
    } else if (TASK_TYPES.inspection.includes(type)) {
      return <CheckCircle className="h-5 w-5 text-blue-500" />;
    }
    return <BedDouble className="h-5 w-5 text-gray-500" />;
  };

  const getCategoryFromType = (type: string): string => {
    if (TASK_TYPES.housekeeping.includes(type)) return "housekeeping";
    if (TASK_TYPES.maintenance.includes(type)) return "maintenance";
    if (TASK_TYPES.inspection.includes(type)) return "inspection";
    return "other";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Housekeeping & Maintenance</h1>
            <p className="text-sm text-gray-500 mt-1">Manage room cleaning, maintenance tasks, and inspections</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              New Task
            </button>
            <button
              onClick={fetchTasks}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 px-6 py-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
                <p className="text-sm text-gray-500">In Progress</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                <p className="text-sm text-gray-500">Completed</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.urgent}</p>
                <p className="text-sm text-gray-500">Urgent</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-500">Total Tasks</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="px-6 py-3">
        <div className="flex flex-wrap gap-3">
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          
          <select
            value={filter.priority}
            onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          
          <select
            value={filter.category}
            onChange={(e) => setFilter({ ...filter, category: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Categories</option>
            <option value="housekeeping">Housekeeping</option>
            <option value="maintenance">Maintenance</option>
            <option value="inspection">Inspection</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="px-6 pb-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              Loading tasks...
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Sparkles className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No tasks found</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-3 text-primary hover:underline"
              >
                Create your first task
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 hover:bg-gray-50 ${
                    task.priority === "urgent" ? "bg-red-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {getTaskIcon(task.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">
                            {task.type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {PRIORITY_LABELS[task.priority] || task.priority}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                            {STATUS_LABELS[task.status] || task.status}
                          </span>
                        </div>
                        
                        {task.room && (
                          <p className="text-sm text-gray-500 mt-1">
                            Room {task.room.number} • {task.room.type} • Floor {task.room.floor}
                          </p>
                        )}
                        
                        {task.notes && (
                          <p className="text-sm text-gray-600 mt-1">{task.notes}</p>
                        )}
                        
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          {task.staff && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {task.staff.name}
                            </div>
                          )}
                          {task.dueDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Due: {formatDate(task.dueDate)}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(task.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {task.status === "pending" && (
                        <button
                          onClick={() => handleUpdateStatus(task.id, "in_progress")}
                          className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200"
                        >
                          Start
                        </button>
                      )}
                      {task.status === "in_progress" && (
                        <button
                          onClick={() => handleUpdateStatus(task.id, "completed")}
                          className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Create New Task</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateTask} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={newTask.category}
                  onChange={(e) => setNewTask({ 
                    ...newTask, 
                    category: e.target.value,
                    taskType: TASK_TYPES[e.target.value as keyof typeof TASK_TYPES][0]
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="housekeeping">Housekeeping</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inspection">Inspection</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Type
                </label>
                <select
                  value={newTask.taskType}
                  onChange={(e) => setNewTask({ ...newTask, taskType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {TASK_TYPES[newTask.category as keyof typeof TASK_TYPES]?.map((type) => (
                    <option key={type} value={type}>
                      {type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room (Optional)
                </label>
                <select
                  value={newTask.roomId}
                  onChange={(e) => setNewTask({ ...newTask, roomId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">No specific room</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      Room {room.number} - {room.type}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign To
                </label>
                <select
                  value={newTask.staffId}
                  onChange={(e) => setNewTask({ ...newTask, staffId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Select staff member</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.department})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={newTask.notes}
                  onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Add any special instructions..."
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
