"use client";

import { useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/lib/store/auth-store";
import { useBranchStore } from "@/lib/store/branch-store";
import { getRoleLabel, getDepartmentLabel, formatDate } from "@/lib/format";
import type { StaffMember } from "@/lib/types/schema";
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
} from "lucide-react";

const statusStyles: Record<string, string> = {
  active: "bg-status-available/10 text-status-available border-status-available/20",
  on_leave: "bg-order-pending/10 text-order-pending border-order-pending/20",
  off_duty: "bg-slate-100 text-slate-custom border-slate-200",
};

export default function StaffPage() {
  const { user } = useAuthStore();
  const getStaff = useBranchStore((s) => s.getStaff);
  const [deptFilter, setDeptFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  const branchId = user?.role === "super_admin" || user?.role === "super_manager" ? "all" : (user?.branchId ?? "br-001");
  const role = user?.role ?? "guest";
  const staff = getStaff(branchId, role);

  const filtered = staff.filter((s) => {
    if (deptFilter !== "all" && s.department !== deptFilter) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const activeCount = staff.filter((s) => s.status === "active").length;

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
        <Button className="bg-emerald hover:bg-emerald-dark text-white rounded-[6px] gap-2 text-sm">
          <Plus className="h-4 w-4" /> Add Staff
        </Button>
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
              {filtered.map((member) => (
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
                          {member.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-charcoal">{member.name}</p>
                        <p className="text-[11px] text-text-muted-custom">{member.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-slate-custom">{getRoleLabel(member.role)}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline" className="text-[10px] rounded-[4px] font-medium">
                      {getDepartmentLabel(member.department)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-slate-custom">{member.shift}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className={`text-[10px] font-semibold uppercase tracking-wider rounded-[4px] ${statusStyles[member.status]}`}>
                      {member.status === "on_leave" ? "On Leave" : member.status === "off_duty" ? "Off Duty" : "Active"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Staff Detail Sheet */}
      <Sheet open={!!selectedStaff} onOpenChange={() => setSelectedStaff(null)}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Staff Profile</SheetTitle>
            <SheetDescription>Employee details and assignment</SheetDescription>
          </SheetHeader>
          {selectedStaff && (
            <div className="space-y-5 mt-4 px-1">
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={selectedStaff.avatar} alt={selectedStaff.name} />
                  <AvatarFallback className="bg-emerald/10 text-emerald text-lg">
                    {selectedStaff.name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold text-charcoal">{selectedStaff.name}</p>
                  <Badge variant="outline" className={`text-[10px] rounded-[4px] ${statusStyles[selectedStaff.status]}`}>
                    {selectedStaff.status === "on_leave" ? "On Leave" : selectedStaff.status === "off_duty" ? "Off Duty" : "Active"}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="h-4 w-4 text-text-muted-custom shrink-0" />
                  <span className="text-text-muted-custom">Role:</span>
                  <span className="text-charcoal font-medium">{getRoleLabel(selectedStaff.role)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="h-4 w-4 text-text-muted-custom shrink-0" />
                  <span className="text-text-muted-custom">Dept:</span>
                  <span className="text-charcoal font-medium">{getDepartmentLabel(selectedStaff.department)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-text-muted-custom shrink-0" />
                  <span className="text-slate-custom">{selectedStaff.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-text-muted-custom shrink-0" />
                  <span className="text-slate-custom">{selectedStaff.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-text-muted-custom shrink-0" />
                  <span className="text-text-muted-custom">Shift:</span>
                  <span className="text-charcoal font-medium">{selectedStaff.shift}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-text-muted-custom shrink-0" />
                  <span className="text-text-muted-custom">Joined:</span>
                  <span className="text-charcoal font-medium">{formatDate(selectedStaff.joinDate)}</span>
                </div>
              </div>

              <Separator />

              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 rounded-[6px] text-sm">Edit Profile</Button>
                  <Button className="flex-1 bg-emerald hover:bg-emerald-dark text-white rounded-[6px] text-sm">Assign Shift</Button>
                </div>
                <Button
                  variant="destructive"
                  className="w-full rounded-[6px] text-sm gap-2"
                  onClick={async () => {
                    const ok = confirm("Are you sure you want to force this user to change their password on next login?");
                    if (!ok) return;

                    try {
                      const res = await fetch("/api/admin/staff/force-password-reset", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId: selectedStaff.id }),
                      });
                      if (res.ok) {
                        toast.success("Security flag set! User will be forced to change password.");
                      } else {
                        toast.error("Failed to set security flag.");
                      }
                    } catch (e) {
                      toast.error("An error occurred.");
                    }
                  }}
                >
                  <Lock className="h-4 w-4" /> Force Password Reset
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
