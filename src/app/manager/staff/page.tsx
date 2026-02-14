"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/lib/store/auth-store";
import { useBranchStore } from "@/lib/store/branch-store";
import { getRoleLabel, getDepartmentLabel } from "@/lib/format";
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import type { UserRole, Department } from "@/lib/types/enums";

export default function StaffManagementPage() {
  const { user } = useAuthStore();
  const { getStaff, addStaffMember, updateStaffMember, removeStaffMember } = useBranchStore();
  const branchId = user?.branchId || "br-001";
  const userRole = user?.role || "branch_manager";
  const branchStaff = getStaff(branchId, userRole);

  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formRole, setFormRole] = useState<UserRole>("waiter");
  const [formDepartment, setFormDepartment] = useState<Department>("restaurant");
  const [formShift, setFormShift] = useState("Morning");

  const filteredStaff = branchStaff.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = departmentFilter === "all" || s.department === departmentFilter;
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const activeCount = branchStaff.filter((s) => s.status === "active").length;
  const onLeaveCount = branchStaff.filter((s) => s.status === "on_leave").length;
  const offDutyCount = branchStaff.filter((s) => s.status === "off_duty").length;

  const handleAddStaff = () => {
    if (!formName || !formEmail) {
      toast.error("Please fill in all required fields");
      return;
    }
    addStaffMember({
      name: formName,
      email: formEmail,
      phone: formPhone,
      role: formRole,
      department: formDepartment,
      shift: formShift,
      status: "active",
      avatar: `https://i.pravatar.cc/40?u=${formName.toLowerCase().replace(/ /g, "-")}`,
      branchId: branchId,
      joinDate: new Date().toISOString().split("T")[0],
    });
    toast.success(`${formName} added to the team`);
    resetForm();
    setAddDialogOpen(false);
  };

  const handleUpdateStatus = (memberId: string, status: "active" | "on_leave" | "off_duty") => {
    updateStaffMember(memberId, { status });
    toast.success("Staff status updated");
  };

  const handleRemoveStaff = (memberId: string, name: string) => {
    removeStaffMember(memberId);
    toast.success(`${name} has been removed`);
  };

  const resetForm = () => {
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setFormRole("waiter");
    setFormDepartment("restaurant");
    setFormShift("Morning");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="heading-md text-charcoal">Staff Management</h1>
          <p className="body-sm text-text-muted-custom mt-1">
            Manage your team members, shifts, and roles
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald hover:bg-emerald-dark text-white">
              <Plus className="mr-2 h-4 w-4" /> Add Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-charcoal block mb-1">Full Name *</label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Enter full name" />
              </div>
              <div>
                <label className="text-sm font-medium text-charcoal block mb-1">Email *</label>
                <Input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="email@eastgate.rw" />
              </div>
              <div>
                <label className="text-sm font-medium text-charcoal block mb-1">Phone</label>
                <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="+250 788-XXX" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-charcoal block mb-1">Role</label>
                  <Select value={formRole} onValueChange={(v) => setFormRole(v as UserRole)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="waiter">Waiter</SelectItem>
                      <SelectItem value="receptionist">Receptionist</SelectItem>
                      <SelectItem value="housekeeping">Housekeeping</SelectItem>
                      <SelectItem value="restaurant_staff">Restaurant Staff</SelectItem>
                      <SelectItem value="accountant">Accountant</SelectItem>
                      <SelectItem value="event_manager">Event Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-charcoal block mb-1">Department</label>
                  <Select value={formDepartment} onValueChange={(v) => setFormDepartment(v as Department)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
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
              </div>
              <div>
                <label className="text-sm font-medium text-charcoal block mb-1">Shift</label>
                <Select value={formShift} onValueChange={setFormShift}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Morning">Morning</SelectItem>
                    <SelectItem value="Evening">Evening</SelectItem>
                    <SelectItem value="Night">Night</SelectItem>
                    <SelectItem value="Day">Day</SelectItem>
                    <SelectItem value="Split">Split</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
              <Button className="bg-emerald hover:bg-emerald-dark text-white" onClick={handleAddStaff}>
                Add Member
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-charcoal">{branchStaff.length}</p>
              <p className="text-xs text-text-muted-custom">Total Staff</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-charcoal">{activeCount}</p>
              <p className="text-xs text-text-muted-custom">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-charcoal">{onLeaveCount}</p>
              <p className="text-xs text-text-muted-custom">On Leave</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <UserX className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-charcoal">{offDutyCount}</p>
              <p className="text-xs text-text-muted-custom">Off Duty</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base">Team Members</CardTitle>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted-custom" />
                <Input
                  placeholder="Search staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-60 h-9"
                />
              </div>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Department" /></SelectTrigger>
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                  <SelectItem value="off_duty">Off Duty</SelectItem>
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
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback className="bg-emerald text-white text-xs">
                            {member.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="font-medium text-sm">{member.name}</span>
                          <p className="text-xs text-text-muted-custom">{member.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{getRoleLabel(member.role)}</TableCell>
                    <TableCell className="text-sm">{getDepartmentLabel(member.department)}</TableCell>
                    <TableCell className="text-sm">{member.shift}</TableCell>
                    <TableCell>
                      <Select
                        value={member.status}
                        onValueChange={(v) => handleUpdateStatus(member.id, v as "active" | "on_leave" | "off_duty")}
                      >
                        <SelectTrigger className="w-28 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="on_leave">On Leave</SelectItem>
                          <SelectItem value="off_duty">Off Duty</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm">{member.phone}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-text-muted-custom hover:text-charcoal">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-text-muted-custom hover:text-destructive"
                          onClick={() => handleRemoveStaff(member.id, member.name)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredStaff.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-text-muted-custom">
                      No staff members found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
