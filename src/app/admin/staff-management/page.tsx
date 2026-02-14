"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
import { getStaffCredentials } from "@/lib/store/auth-store";
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
} from "lucide-react";

const roleColors: Record<string, string> = {
  super_admin: "bg-red-600",
  super_manager: "bg-purple-600",
  branch_manager: "bg-blue-600",
  receptionist: "bg-green-600",
  waiter: "bg-orange-600",
  accountant: "bg-yellow-600",
  restaurant_staff: "bg-teal-600",
};

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  super_manager: "Super Manager",
  branch_manager: "Branch Manager",
  receptionist: "Receptionist",
  waiter: "Waiter",
  accountant: "Accountant",
  restaurant_staff: "Restaurant Staff",
};

export default function StaffManagementPage() {
  const staffList = getStaffCredentials();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterBranch, setFilterBranch] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const filteredStaff = staffList.filter((staff) => {
    const matchesSearch =
      staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === "all" || staff.role === filterRole;
    const matchesBranch =
      filterBranch === "all" || staff.branchName.includes(filterBranch);
    return matchesSearch && matchesRole && matchesBranch;
  });

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
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-emerald hover:bg-emerald-dark gap-2">
              <UserPlus size={18} />
              Add New Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
              <DialogDescription>
                Create a new staff account. They will receive their credentials via email.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="john.doe@eastgate.rw" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="branch_manager">Branch Manager</SelectItem>
                    <SelectItem value="receptionist">Receptionist</SelectItem>
                    <SelectItem value="waiter">Waiter</SelectItem>
                    <SelectItem value="accountant">Accountant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch">Branch</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="br-001">Kigali Main</SelectItem>
                    <SelectItem value="br-002">Ngoma Branch</SelectItem>
                    <SelectItem value="br-003">Kirehe Branch</SelectItem>
                    <SelectItem value="br-004">Gatsibo Branch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <p className="font-semibold text-blue-900 mb-1">Auto-Generated Credentials</p>
                <p className="text-blue-700 text-xs">
                  A secure password will be automatically generated and sent to the staff member&apos;s email.
                </p>
              </div>
              <Button
                onClick={() => {
                  toast.success("Staff member added successfully!");
                  setShowAddDialog(false);
                }}
                className="w-full bg-emerald hover:bg-emerald-dark"
              >
                Create Account
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
                <SelectItem value="accountant">Accountant</SelectItem>
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
                  filteredStaff.map((staff, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{staff.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 text-text-muted-custom" />
                          {staff.email}
                        </div>
                      </TableCell>
                      <TableCell>
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
                            {showPasswords[staff.email] ? (
                              <EyeOff size={14} />
                            ) : (
                              <Eye size={14} />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={roleColors[staff.role]}>
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
