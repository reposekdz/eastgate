"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/lib/store/auth-store";
import { useBranchStore } from "@/lib/store/branch-store";
import type { ServiceRequest } from "@/lib/store/branch-store";
import {
  ClipboardList,
  Search,
  AlertTriangle,
  Clock,
  CheckCircle2,
  BedDouble,
  Wrench,
  Shirt,
  Phone,
  AlarmClock,
  Eye,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

const getTypeIcon = (type: string) => {
  switch (type) {
    case "room_service":
      return <BedDouble className="h-4 w-4 text-blue-600" />;
    case "maintenance":
      return <Wrench className="h-4 w-4 text-orange-600" />;
    case "housekeeping":
      return <BedDouble className="h-4 w-4 text-purple-600" />;
    case "concierge":
      return <Phone className="h-4 w-4 text-emerald-600" />;
    case "laundry":
      return <Shirt className="h-4 w-4 text-cyan-600" />;
    case "wake_up":
      return <AlarmClock className="h-4 w-4 text-yellow-600" />;
    default:
      return <ClipboardList className="h-4 w-4 text-gray-600" />;
  }
};

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    room_service: "Room Service",
    maintenance: "Maintenance",
    housekeeping: "Housekeeping",
    concierge: "Concierge",
    laundry: "Laundry",
    wake_up: "Wake-up Call",
  };
  return labels[type] || type;
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
      return "bg-gray-100 text-gray-700";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-orange-100 text-orange-700";
    case "in_progress":
      return "bg-blue-100 text-blue-700";
    case "completed":
      return "bg-emerald-100 text-emerald-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

export default function WaiterServicesPage() {
  const { user } = useAuthStore();
  const { getServiceRequests, updateServiceRequest } = useBranchStore();
  const branchId = user?.branchId || "br-001";
  const userRole = user?.role || "waiter";
  const requests = getServiceRequests(branchId, userRole);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const filteredRequests = requests.filter((sr) => {
    const matchesSearch =
      sr.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sr.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sr.roomNumber.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || sr.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || sr.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const pendingCount = requests.filter((sr) => sr.status === "pending").length;
  const inProgressCount = requests.filter((sr) => sr.status === "in_progress").length;
  const completedCount = requests.filter((sr) => sr.status === "completed").length;

  const handleStatusChange = (id: string, status: string) => {
    updateServiceRequest(id, {
      status: status as "pending" | "in_progress" | "completed" | "cancelled",
    });
    toast.success(`Request updated to ${status.replace("_", " ")}`);
  };

  const handleViewDetail = (sr: ServiceRequest) => {
    setSelectedRequest(sr);
    setShowDetail(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-md text-charcoal">Service Requests</h1>
        <p className="body-sm text-text-muted-custom mt-1">
          Guest service requests &bull; Respond quickly to keep guests happy
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className={`border-2 ${pendingCount > 0 ? "border-orange-300 bg-orange-50" : "border-gray-200"}`}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 bg-orange-500 rounded-xl flex items-center justify-center shadow">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-700">{pendingCount}</p>
              <p className="text-xs text-orange-900 font-medium">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className={`border-2 ${inProgressCount > 0 ? "border-blue-300 bg-blue-50" : "border-gray-200"}`}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-500 rounded-xl flex items-center justify-center shadow">
              <Loader2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{inProgressCount}</p>
              <p className="text-xs text-blue-900 font-medium">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-gray-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-700">{completedCount}</p>
              <p className="text-xs text-emerald-900 font-medium">Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Urgent Requests Alert */}
      {requests.filter((sr) => sr.priority === "urgent" && sr.status === "pending").length > 0 && (
        <Card className="border-2 border-red-300 bg-red-50/80">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-red-500 rounded-xl flex items-center justify-center shadow animate-pulse">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-red-800">Urgent Requests Waiting!</p>
                <p className="text-xs text-red-600">
                  {requests.filter((sr) => sr.priority === "urgent" && sr.status === "pending").length} urgent
                  request(s) need immediate attention
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Requests Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base">All Requests ({requests.length})</CardTitle>
            <div className="flex gap-3 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted-custom" />
                <Input
                  placeholder="Search guest, room..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-52 h-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32 h-9">
                  <SelectValue />
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
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((sr) => (
                  <TableRow
                    key={sr.id}
                    className={
                      sr.priority === "urgent" && sr.status === "pending"
                        ? "bg-red-50/50"
                        : sr.priority === "high" && sr.status === "pending"
                        ? "bg-orange-50/30"
                        : ""
                    }
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(sr.type)}
                        <span className="text-xs font-medium">{getTypeLabel(sr.type)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{sr.guestName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {sr.roomNumber}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm max-w-48 truncate">{sr.description}</TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${getPriorityColor(sr.priority)}`}>
                        {sr.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${getStatusColor(sr.status)}`}>
                        {sr.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => handleViewDetail(sr)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {sr.status !== "completed" && sr.status !== "cancelled" && (
                          <Select
                            value={sr.status}
                            onValueChange={(v) => handleStatusChange(sr.id, v)}
                          >
                            <SelectTrigger className="w-28 h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredRequests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-text-muted-custom">
                      No service requests found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-amber-600" />
              Service Request Details
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 bg-amber-50/50 rounded-lg p-4">
                {getTypeIcon(selectedRequest.type)}
                <div>
                  <p className="text-sm font-bold text-charcoal">
                    {getTypeLabel(selectedRequest.type)}
                  </p>
                  <p className="text-xs text-text-muted-custom">{selectedRequest.id}</p>
                </div>
                <div className="ml-auto flex gap-2">
                  <Badge className={getPriorityColor(selectedRequest.priority)}>
                    {selectedRequest.priority}
                  </Badge>
                  <Badge className={getStatusColor(selectedRequest.status)}>
                    {selectedRequest.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-text-muted-custom">Guest</p>
                  <p className="font-medium">{selectedRequest.guestName}</p>
                </div>
                <div>
                  <p className="text-text-muted-custom">Room</p>
                  <p className="font-medium">{selectedRequest.roomNumber}</p>
                </div>
                <div>
                  <p className="text-text-muted-custom">Created</p>
                  <p className="font-medium">
                    {new Date(selectedRequest.createdAt).toLocaleString()}
                  </p>
                </div>
                {selectedRequest.assignedTo && (
                  <div>
                    <p className="text-text-muted-custom">Assigned To</p>
                    <p className="font-medium">{selectedRequest.assignedTo}</p>
                  </div>
                )}
              </div>

              <div className="text-sm">
                <p className="text-text-muted-custom mb-1">Description</p>
                <p className="bg-pearl/50 rounded-lg p-3 font-medium">
                  {selectedRequest.description}
                </p>
              </div>

              <Separator />

              {selectedRequest.status !== "completed" && selectedRequest.status !== "cancelled" && (
                <div className="flex gap-2">
                  {selectedRequest.status === "pending" && (
                    <Button
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => {
                        handleStatusChange(selectedRequest.id, "in_progress");
                        setShowDetail(false);
                      }}
                    >
                      <ArrowUpRight className="mr-2 h-4 w-4" />
                      Start Working
                    </Button>
                  )}
                  <Button
                    className="flex-1 bg-emerald hover:bg-emerald-dark text-white"
                    onClick={() => {
                      handleStatusChange(selectedRequest.id, "completed");
                      setShowDetail(false);
                    }}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark Complete
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
