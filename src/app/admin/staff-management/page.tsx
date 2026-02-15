"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuthStore, getStaffCredentials } from "@/lib/store/auth-store";
import { branches } from "@/lib/mock-data";
import type { UserRole } from "@/lib/types/enums";
import { toast } from "sonner";
import {
  UserPlus,
  Search,
  Shield,
  Users,
  Building2,
  Mail,
  Key,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  AlertCircle,
} from "lucide-react";

const roleColors: Record<string, string> = {
  super_admin: "bg-red-600",
  super_manager: "bg-purple-600",
  branch_manager: "bg-blue-600",
  branch_admin: "bg-indigo-600",
  receptionist: "bg-green-600",
  waiter: "bg-orange-600",
  accountant: "bg-yellow-600",
  restaurant_staff: "bg-teal-600",
  kitchen_staff: "bg-amber-600",
  event_manager: "bg-indigo-600",
};

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  super_manager: "Super Manager",
  branch_manager: "Branch Manager",
  branch_admin: "Branch Admin",
  receptionist: "Receptionist",
  waiter: "Waiter",
  accountant: "Accountant",
  restaurant_staff: "Restaurant Staff",
  kitchen_staff: "Kitchen Staff",
  event_manager: "Event Manager",
};

const assignableRoles: UserRole[] = [
  "branch_manager",
  "branch_admin",
  "receptionist",
  "waiter",
  "kitchen_staff",
  "accountant",
  "event_manager",
  "restaurant_staff",
];

export default function StaffManagementPage() {
  const { user, addStaff, getAllStaff, hasAccess } = useAuthStore();
  const canAddStaff = hasAccess(["super_admin", "super_manager"]);
  const staticCreds = getStaffCredentials();
  const allStaff = getAllStaff("all", true);
  const staffList = allStaff.map(({ user: u, isDynamic, mustChangeCredentials }) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    password: isDynamic ? "(set by admin)" : staticCreds.find((s) => s.email === u.email)?.password ?? "—",
    role: u.role,
    branchName: u.branchName,
    isDynamic,
    mustChangeCredentials,
  }));
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterBranch, setFilterBranch] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addRole, setAddRole] = useState<UserRole>("waiter");
  const [addBranchId, setAddBranchId] = useState("br-001");
  const [addLoading, setAddLoading] = useState(false);

  const filteredStaff = staffList.filter((staff) => {
    const matchesSearch =
      staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === "all" || staff.role === filterRole;
    const matchesBranch =
      filterBranch === "all" || staff.branchName.includes(filterBranch);
    return matchesSearch && matchesRole && matchesBranch;
  });

  const handleAddStaff = () => {
    if (!addName.trim() || !addEmail.trim() || !addPassword.trim()) {
      toast.error("Name, email, and password are required.");
      return;
    }
    if (addPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setAddLoading(true);
    const branch = branches.find((b) => b.id === addBranchId);
    const result = addStaff({
      name: addName.trim(),
      email: addEmail.trim(),
      password: addPassword,
      role: addRole,
      branchId: addBranchId,
      branchName: branch?.name ?? addBranchId,
    });
    setAddLoading(false);
    if (result.success) {
      toast.success("Staff added. They must change email & password on first login.");
      setShowAddDialog(false);
      setAddName("");
      setAddEmail("");
      setAddPassword("");
      setAddRole("waiter");
      setAddBranchId("br-001");
    } else {
      toast.error(result.error);
    }
  };

  const togglePasswordVisibility = (email: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [email]: !prev[email],
    }));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-charcoal">
            Staff Management
          </h1>
          <p className="text-text-muted-custom mt-1">
            Manage hotel staff accounts and permissions
          </p>
        </div>
        
        {canAddStaff && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-emerald hover:bg-emerald-dark gap-2">
                <UserPlus size={18} />
                Add Staff & Assign Credentials
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Staff to Branch</DialogTitle>
                <DialogDescription>
                  Assign credentials. Staff must change email and password on first login.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input placeholder="John Doe" value={addName} onChange={(e) => setAddName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email (login)</Label>
                  <Input type="email" placeholder="john@eastgate.rw" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Initial Password (min 6 chars)</Label>
                  <Input type="password" placeholder="••••••••" value={addPassword} onChange={(e) => setAddPassword(e.target.value)} minLength={6} />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={addRole} onValueChange={(v) => setAddRole(v as UserRole)}>
                    <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      {assignableRoles.map((r) => (
                        <SelectItem key={r} value={r}>{roleLabels[r] || r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Select value={addBranchId} onValueChange={setAddBranchId}>
                    <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm flex gap-2">
                  <Lock className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                  <p className="text-amber-800 text-xs">
                    They will be required to set a new email and password on first sign-in to their branch.
                  </p>
                </div>
                <Button onClick={handleAddStaff} disabled={addLoading} className="w-full bg-emerald hover:bg-emerald-dark">
                  {addLoading ? "Adding…" : "Create & Assign Credentials"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-charcoal">{staffList.length}</p>
              <p className="text-xs text-text-muted-custom">Total Staff</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-charcoal">
                {staffList.filter((s) => s.role.includes("admin") || s.role.includes("manager")).length}
              </p>
              <p className="text-xs text-text-muted-custom">Admins/Managers</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-charcoal">4</p>
              <p className="text-xs text-text-muted-custom">Branches</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
              <Key className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-charcoal">{staffList.length}</p>
              <p className="text-xs text-text-muted-custom">Active Accounts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted-custom" />
              <Input
                placeholder="Search staff by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
                <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="super_manager">Super Manager</SelectItem>
                <SelectItem value="branch_manager">Branch Manager</SelectItem>
                <SelectItem value="receptionist">Receptionist</SelectItem>
                <SelectItem value="waiter">Waiter</SelectItem>
                <SelectItem value="kitchen_staff">Kitchen Staff</SelectItem>
                <SelectItem value="accountant">Accountant</SelectItem>
                <SelectItem value="event_manager">Event Manager</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterBranch} onValueChange={setFilterBranch}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                <SelectItem value="Kigali">Kigali Main</SelectItem>
                <SelectItem value="Ngoma">Ngoma Branch</SelectItem>
                <SelectItem value="Kirehe">Kirehe Branch</SelectItem>
                <SelectItem value="Gatsibo">Gatsibo Branch</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Directory ({filteredStaff.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Access Code</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-text-muted-custom">
                      No staff members found matching your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStaff.map((staff) => (
                    <TableRow key={staff.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {staff.name}
                          {staff.mustChangeCredentials && (
                            <Badge variant="outline" className="text-amber-700 border-amber-300 gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Must change login
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 text-text-muted-custom" />
                          {staff.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {staff.isDynamic ? (
                          <span className="text-xs text-muted-foreground">(assigned by admin)</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                              {showPasswords[staff.email] ? staff.password : "••••••"}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePasswordVisibility(staff.email)}
                              className="h-6 w-6 p-0"
                            >
                              {showPasswords[staff.email] ? <EyeOff size={14} /> : <Eye size={14} />}
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={roleColors[staff.role] ?? "bg-gray-600"}>
                          {roleLabels[staff.role] || staff.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{staff.branchName}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Edit size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={staff.role.includes("admin")}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Important Notice */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-yellow-700 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-yellow-900 mb-1">Security Notice</p>
              <p className="text-yellow-800">
                Only administrators can create, modify, or delete staff accounts. Staff members cannot change their own email or password - they must contact their branch manager for credential updates.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
