"use client";

import { useState, useEffect } from "react";
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
import { useI18n } from "@/lib/i18n/context";
import {
  ClipboardList, Search, Wrench, Shirt, Phone, BedDouble, AlarmClock,
  Loader2, CheckCircle, XCircle, Clock,
} from "lucide-react";
import { toast } from "sonner";

interface ServiceRequest {
  id: string;
  type: string;
  description: string;
  status: string;
  priority: string;
  room?: { number: string };
  createdAt: string;
  guestName?: string;
}

export default function ServiceRequestsPage() {
  const { user } = useAuthStore();
  const { isRw } = useI18n();
  const branchId = user?.branchId || "";
  
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    async function fetchServices() {
      if (!branchId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/services?branchId=${branchId}`);
        const data = await res.json();
        
        if (Array.isArray(data)) {
          setRequests(data);
        }
      } catch (error) {
        console.error("Failed to fetch services:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchServices();
  }, [branchId]);

  const handleStatusChange = async (id: string, status: string) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        setRequests(requests.map(r => 
          r.id === id ? { ...r, status } : r
        ));
        toast.success(isRw ? "Serivise yahinduwe" : `Service request updated to ${status}`);
      }
    } catch (error) {
      console.error("Failed to update service:", error);
      toast.error("Failed to update service");
    } finally {
      setUpdating(null);
    }
  };

  const filteredRequests = requests.filter((sr) => {
    const matchesSearch =
      (sr.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       sr.room?.number.includes(searchTerm));
    const matchesStatus = statusFilter === "all" || sr.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || sr.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "ROOM_SERVICE": return <BedDouble className="h-4 w-4" />;
      case "MAINTENANCE": return <Wrench className="h-4 w-4" />;
      case "HOUSEKEEPING": return <ClipboardList className="h-4 w-4" />;
      case "TRANSPORT": return <Phone className="h-4 w-4" />;
      case "LAUNDRY": return <Shirt className="h-4 w-4" />;
      default: return <ClipboardList className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT": return "bg-red-100 text-red-700 border-red-300";
      case "HIGH": return "bg-orange-100 text-orange-700 border-orange-300";
      case "MEDIUM": return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "LOW": return "bg-green-100 text-green-700 border-green-300";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "REQUESTED": return "bg-orange-100 text-orange-700";
      case "ASSIGNED": return "bg-blue-100 text-blue-700";
      case "IN_PROGRESS": return "bg-blue-100 text-blue-700";
      case "COMPLETED": return "bg-emerald-100 text-emerald-700";
      case "CANCELLED": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const pendingCount = requests.filter((sr) => sr.status === "REQUESTED").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-gold rounded-xl flex items-center justify-center shadow-lg">
          <ClipboardList className="h-5 w-5 text-charcoal" />
        </div>
        <div>
          <h1 className="heading-md text-charcoal">
            {isRw ? "Serivise z'Abahishagi" : "Service Requests"}
          </h1>
          <p className="text-xs text-text-muted-custom">
            {isRw ? "Reba kandi uzamasome serivise" : "View and manage service requests"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-text-muted-custom">{isRw ? "Birate" : "Pending"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Loader2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {requests.filter((sr) => sr.status === "IN_PROGRESS").length}
                </p>
                <p className="text-xs text-text-muted-custom">{isRw ? "Ikigenda" : "In Progress"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {requests.filter((sr) => sr.status === "COMPLETED").length}
                </p>
                <p className="text-xs text-text-muted-custom">{isRw ? "Iradashize" : "Completed"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base">{isRw ? "Serivise" : "All Requests"}</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted-custom" />
                <Input
                  placeholder={isRw ? "Shakisha..." : "Search..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-8 w-40"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isRw ? "Byose" : "All"}</SelectItem>
                  <SelectItem value="REQUESTED">{isRw ? "Birate" : "Requested"}</SelectItem>
                  <SelectItem value="IN_PROGRESS">{isRw ? "Ikigenda" : "In Progress"}</SelectItem>
                  <SelectItem value="COMPLETED">{isRw ? "Iradashize" : "Completed"}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="h-8 w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isRw ? "Byose" : "All"}</SelectItem>
                  <SelectItem value="URGENT">{isRw ? "Ubufatse" : "Urgent"}</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-pearl/50">
                  <TableHead className="text-xs">{isRw ? "Icyiciado" : "Type"}</TableHead>
                  <TableHead className="text-xs">{isRw ? "Ibisobanuro" : "Description"}</TableHead>
                  <TableHead className="text-xs">{isRw ? "Icyumba" : "Room"}</TableHead>
                  <TableHead className="text-xs">{isRw ? "Imp绣" : "Priority"}</TableHead>
                  <TableHead className="text-xs">{isRw ? "Imimerere" : "Status"}</TableHead>
                  <TableHead className="text-xs">{isRw ? "Ibikorwa" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-text-muted-custom">
                      {isRw ? "Nta serivise zibonetse" : "No service requests found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request) => (
                    <TableRow key={request.id} className="hover:bg-pearl/30">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(request.type)}
                          <span className="text-sm">{request.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm max-w-xs truncate">
                        {request.description}
                      </TableCell>
                      <TableCell className="text-sm">
                        {request.room?.number || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${getPriorityColor(request.priority)}`}>
                          {request.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${getStatusColor(request.status)}`}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={request.status}
                          onValueChange={(status) => handleStatusChange(request.id, status)}
                          disabled={updating === request.id}
                        >
                          <SelectTrigger className="h-7 w-28 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDING">{isRw ? "Birate" : "Requested"}</SelectItem>
                            <SelectItem value="IN_PROGRESS">{isRw ? "Ikigenda" : "In Progress"}</SelectItem>
                            <SelectItem value="COMPLETED">{isRw ? "Iradashize" : "Completed"}</SelectItem>
                            <SelectItem value="CANCELLED">{isRw ? "Irakaye" : "Cancelled"}</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
