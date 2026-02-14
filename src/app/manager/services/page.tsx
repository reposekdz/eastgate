"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/lib/store/auth-store";
import { useBranchStore } from "@/lib/store/branch-store";
import {
  ClipboardList, Search, AlertTriangle, Clock, CheckCircle2, XCircle,
  Wrench, Shirt, Phone, BedDouble, Alarm,
} from "lucide-react";
import { toast } from "sonner";

export default function ServiceRequestsPage() {
  const { user } = useAuthStore();
  const { getServiceRequests, updateServiceRequest } = useBranchStore();
  const branchId = user?.branchId || "br-001";
  const userRole = user?.role || "branch_manager";
  const requests = getServiceRequests(branchId, userRole);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const filteredRequests = requests.filter((sr) => {
    const matchesSearch =
      sr.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sr.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sr.roomNumber.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || sr.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || sr.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleStatusChange = (id: string, status: string) => {
    updateServiceRequest(id, { status: status as "pending" | "in_progress" | "completed" | "cancelled" });
    toast.success(`Service request updated to ${status}`);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "room_service": return <BedDouble className="h-4 w-4" />;
      case "maintenance": return <Wrench className="h-4 w-4" />;
      case "housekeeping": return <ClipboardList className="h-4 w-4" />;
      case "concierge": return <Phone className="h-4 w-4" />;
      case "laundry": return <Shirt className="h-4 w-4" />;
      case "wake_up": return <Alarm className="h-4 w-4" />;
      default: return <ClipboardList className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-700 border-red-300";
      case "high": return "bg-orange-100 text-orange-700 border-orange-300";
      case "medium": return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "low": return "bg-green-100 text-green-700 border-green-300";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-orange-100 text-orange-700";
      case "in_progress": return "bg-blue-100 text-blue-700";
      case "completed": return "bg-emerald-100 text-emerald-700";
      case "cancelled": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const pendingCount = requests.filter((sr) => sr.status === "pending").length;
  const inProgressCount = requests.filter((sr) => sr.status === "in_progress").length;
  const completedCount = requests.filter((sr) => sr.status === "completed").length;
  const urgentCount = requests.filter((sr) => sr.priority === "urgent" || sr.priority === "high").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-md text-charcoal">Service Requests</h1>
        <p className="body-sm text-text-muted-custom mt-1">Track and manage guest service requests</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-charcoal">{pendingCount}</p>
              <p className="text-xs text-text-muted-custom">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-charcoal">{inProgressCount}</p>
              <p className="text-xs text-text-muted-custom">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-charcoal">{completedCount}</p>
              <p className="text-xs text-text-muted-custom">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-charcoal">{urgentCount}</p>
              <p className="text-xs text-text-muted-custom">High Priority</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base">All Requests ({requests.length})</CardTitle>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted-custom" />
                <Input
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-60 h-9"
                />
              </div>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32 h-9"><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
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
                  <TableHead>Assigned</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((sr) => (
                  <TableRow key={sr.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(sr.type)}
                        <span className="text-sm capitalize">{sr.type.replace("_", " ")}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-sm">{sr.guestName}</TableCell>
                    <TableCell><Badge variant="outline">{sr.roomNumber}</Badge></TableCell>
                    <TableCell className="text-sm max-w-48 truncate">{sr.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${getPriorityColor(sr.priority)}`}>
                        {sr.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${getStatusColor(sr.status)}`}>
                        {sr.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{sr.assignedTo || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Select
                        value={sr.status}
                        onValueChange={(v) => handleStatusChange(sr.id, v)}
                      >
                        <SelectTrigger className="w-28 h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
