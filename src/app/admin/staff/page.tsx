"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/lib/store/auth-store";
import { formatDate } from "@/lib/format";
import {
  Search,
  Plus,
  UserCog,
  Users,
  Clock,
  Mail,
  Phone,
  Calendar,
  Building2,
  Shield,
  Lock,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import StaffProfileSheet from "@/components/admin/staff/StaffProfileSheet";
import { getUserDisplayInfo } from "@/lib/user-utils";

const statusStyles: Record<string, string> = {
  active: "bg-status-available/10 text-status-available border-status-available/20",
  on_leave: "bg-order-pending/10 text-order-pending border-order-pending/20",
  off_duty: "bg-slate-100 text-slate-custom border-slate-200",
};

export default function StaffPage() {
  const { user } = useAuthStore();
  const [staff, setStaff] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "",
    department: "",
    shift: "Morning",
    branchId: "",
  });

  const isSuperUser = (user?.role as string) === "SUPER_ADMIN" || (user?.role as string) === "SUPER_MANAGER";

  useEffect(() => {
    fetchStaff();
    fetchBranches();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const url = `/api/staff`;
      console.log("🔍 Fetching from:", url);
      
      const res = await fetch(url);
      console.log("📡 Response:", res.status, res.statusText);
      
      if (!res.ok) {
        console.error("❌ HTTP Error:", res.status);
        toast.error(`Server error: ${res.status}`);
        setStaff([]);
        setLoading(false);
        return;
      }
      
      const data = await res.json();
      console.log("📦 Full Response:", JSON.stringify(data, null, 2));
      
      // Handle different response structures
      let staffData = [];
      if (data.success && Array.isArray(data.staff)) {
        staffData = data.staff;
      } else if (data.data && Array.isArray(data.data.staff)) {
        staffData = data.data.staff;
      } else if (Array.isArray(data.staff)) {
        staffData = data.staff;
      } else if (Array.isArray(data)) {
        staffData = data;
      }
      
      console.log("👥 Staff array:", staffData);
      setStaff(staffData);
      
      if (staffData.length > 0) {
        console.log("✅ Loaded", staffData.length, "staff members");
      } else {
        console.warn("⚠️ No staff found in database");
      }
    } catch (error) {
      console.error("❌ Exception:", error);
      toast.error("Failed to fetch staff");
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await fetch("/api/branches");
      const data = await res.json();
      console.log("Branches API response:", data);
      if (data.success && data.branches) {
        setBranches(data.branches);
        console.log("✅ Branches loaded:", data.branches.length);
      } else if (data.branches) {
        setBranches(data.branches);
        console.log("✅ Branches loaded (alt):", data.branches.length);
      } else {
        console.error("❌ No branches in response");
      }
    } catch (error) {
      console.error("❌ Failed to fetch branches:", error);
      toast.error("Failed to load branches");
    }
  };

  const handleAddStaff = async () => {
    if (!newStaff.name || !newStaff.email || !newStaff.password || !newStaff.role || !newStaff.branchId || !newStaff.department) {
      toast.error("Please fill all required fields");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newStaff.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Phone validation (if provided)
    if (newStaff.phone) {
      const phoneRegex = /^\+?[0-9]{10,15}$/;
      if (!phoneRegex.test(newStaff.phone.replace(/\s/g, ""))) {
        toast.error("Please enter a valid phone number");
        return;
      }
    }

    if (newStaff.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    // Check for duplicate email
    const emailExists = staff.some(s => s.email.toLowerCase() === newStaff.email.toLowerCase());
    if (emailExists) {
      toast.error("This email is already registered");
      return;
    }

    // Check for duplicate phone
    if (newStaff.phone) {
      const phoneExists = staff.some(s => s.phone === newStaff.phone);
      if (phoneExists) {
        toast.error("This phone number is already registered");
        return;
      }
    }

    setAddLoading(true);
    try {
      const payload = {
        ...newStaff,
        role: newStaff.role.toUpperCase(),
      };
      
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(`✅ ${newStaff.name} added successfully!`);
        setShowAddDialog(false);
        setNewStaff({ name: "", email: "", phone: "", password: "", role: "", department: "", shift: "Morning", branchId: "" });
        setTimeout(() => fetchStaff(), 500);
      } else {
        const errorMsg = data.errors?.[0]?.message || data.error || "Failed to add staff";
        toast.error(errorMsg);
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteStaff = async (staffId: string, staffName: string) => {
    if (!confirm(`Permanently delete ${staffName}? This will remove them from the database and cannot be undone.`)) return;
    
    try {
      console.log("Permanently deleting staff:", staffId, staffName);
      const res = await fetch(`/api/staff?id=${staffId}&permanent=true`, { method: "DELETE" });
      const data = await res.json();
      console.log("Delete response:", data);
      
      if (data.success) {
        // Remove from local state immediately
        setStaff(prevStaff => prevStaff.filter(s => s.id !== staffId));
        toast.success(`${staffName} permanently deleted`);
        
        // Also fetch from server to ensure sync
        setTimeout(() => {
          fetchStaff();
        }, 500);
      } else {
        toast.error(data.error || "Failed to delete staff");
      }
    } catch (error) {
      console.error("Delete staff error:", error);
      toast.error("Failed to delete staff");
    }
  };

  const filtered = staff.filter((s) => {
    if (!s) return false;
    if (deptFilter !== "all" && s.department !== deptFilter) return false;
    if (search && !s.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const activeCount = staff.filter((s) => s?.status === "active").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-md text-charcoal">Staff Management</h1>
          <p className="body-sm text-text-muted-custom mt-1">
            Manage team members, roles, and schedules
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchStaff}
            variant="outline"
            size="sm"
            disabled={loading}
            className="gap-2"
          >
            <Clock className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddDialog(true)} className="bg-emerald hover:bg-emerald-dark text-white rounded-[6px] gap-2 text-sm">
            <Plus className="h-4 w-4" /> Add Staff
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="py-3 shadow-xs border-transparent">
          <CardContent className="px-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-emerald/10 shrink-0">
              <Users className="h-4 w-4 text-emerald" />
            </div>
            <div>
              <p className="text-lg font-bold text-charcoal">{staff.length}</p>
              <p className="text-[10px] text-text-muted-custom uppercase tracking-wider">Total Staff</p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-3 shadow-xs border-transparent">
          <CardContent className="px-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-status-available/10 shrink-0">
              <UserCog className="h-4 w-4 text-status-available" />
            </div>
            <div>
              <p className="text-lg font-bold text-charcoal">{activeCount}</p>
              <p className="text-[10px] text-text-muted-custom uppercase tracking-wider">On Duty</p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-3 shadow-xs border-transparent">
          <CardContent className="px-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-order-pending/10 shrink-0">
              <Clock className="h-4 w-4 text-order-pending" />
            </div>
            <div>
              <p className="text-lg font-bold text-charcoal">{staff.length - activeCount}</p>
              <p className="text-[10px] text-text-muted-custom uppercase tracking-wider">On Leave / Off</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="py-4 shadow-xs border-transparent">
        <CardContent className="px-5">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted-custom" />
              <Input
                placeholder="Search staff..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-sm"
              />
            </div>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-[160px] h-8 text-sm">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="front_desk">Front Desk</SelectItem>
                <SelectItem value="housekeeping">Housekeeping</SelectItem>
                <SelectItem value="restaurant">Restaurant</SelectItem>
                <SelectItem value="management">Management</SelectItem>
                <SelectItem value="spa">Spa</SelectItem>
                <SelectItem value="events">Events</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b-pearl">
                <TableHead className="text-[10px] uppercase tracking-wider text-text-muted-custom font-semibold">Name</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-text-muted-custom font-semibold hidden md:table-cell">Role</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-text-muted-custom font-semibold hidden sm:table-cell">Department</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-text-muted-custom font-semibold hidden lg:table-cell">Shift</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-text-muted-custom font-semibold text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-12 w-12 text-gray-300" />
                      <p className="text-sm text-text-muted-custom">No staff members found</p>
                      <Button
                        onClick={() => setShowAddDialog(true)}
                        size="sm"
                        className="mt-2 bg-emerald hover:bg-emerald-dark text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Staff Member
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((member) => (
                  <TableRow
                    key={member.id}
                    className="hover:bg-pearl/30 border-b-pearl/50 cursor-pointer"
                    onClick={() => setSelectedStaff(member)}
                  >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback className="text-[10px] bg-emerald/10 text-emerald">
                          {getUserDisplayInfo(member.email, member.name).initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-charcoal">{member.name}</p>
                        <p className="text-[11px] text-text-muted-custom">{member.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-slate-custom">{member.role}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline" className="text-[10px] rounded-[4px] font-medium">
                      {member.department}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-slate-custom">{member.shift}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Badge variant="outline" className={`text-[10px] font-semibold uppercase tracking-wider rounded-[4px] ${statusStyles[member.status]}`}>
                        {member.status === "on_leave" ? "On Leave" : member.status === "off_duty" ? "Off Duty" : "Active"}
                      </Badge>
                      {(isSuperUser || (user?.role as string) === "BRANCH_MANAGER") && member.role !== "SUPER_ADMIN" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteStaff(member.id, member.name);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Staff Detail Sheet */}
      <StaffProfileSheet
        staff={selectedStaff}
        open={!!selectedStaff}
        onClose={() => setSelectedStaff(null)}
        onUpdate={fetchStaff}
      />

      {/* Add Staff Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Staff Member</DialogTitle>
            <DialogDescription>Create credentials for new staff member</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} placeholder="john@eastgatehotel.rw" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={newStaff.phone} onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })} placeholder="+250 788 123 456" />
            </div>
            <div className="space-y-2">
              <Label>Password *</Label>
              <Input type="password" value={newStaff.password} onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })} placeholder="Minimum 6 characters" />
            </div>
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select value={newStaff.role} onValueChange={(v) => setNewStaff({ ...newStaff, role: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {isSuperUser && <SelectItem value="BRANCH_MANAGER">Branch Manager</SelectItem>}
                  <SelectItem value="RECEPTIONIST">Receptionist</SelectItem>
                  <SelectItem value="WAITER">Waiter</SelectItem>
                  <SelectItem value="CHEF">Chef</SelectItem>
                  <SelectItem value="KITCHEN_STAFF">Kitchen Staff</SelectItem>
                  <SelectItem value="STOCK_MANAGER">Stock Manager</SelectItem>
                  <SelectItem value="HOUSEKEEPING">Housekeeping</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department *</Label>
              <Input value={newStaff.department} onChange={(e) => setNewStaff({ ...newStaff, department: e.target.value })} placeholder="Front Desk, Kitchen, etc." />
            </div>
            <div className="space-y-2">
              <Label>Branch * ({branches.length} available)</Label>
              <Select value={newStaff.branchId} onValueChange={(v) => {
                console.log("Branch selected:", v);
                setNewStaff({ ...newStaff, branchId: v });
              }}>
                <SelectTrigger>
                  <SelectValue placeholder={branches.length > 0 ? "Select branch" : "Loading..."} />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name} - {b.location || b.city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Shift</Label>
              <Select value={newStaff.shift} onValueChange={(v) => setNewStaff({ ...newStaff, shift: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Morning">Morning</SelectItem>
                  <SelectItem value="Afternoon">Afternoon</SelectItem>
                  <SelectItem value="Night">Night</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleAddStaff} disabled={addLoading} className="flex-1 bg-emerald hover:bg-emerald-dark text-white">
              {addLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Staff"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
