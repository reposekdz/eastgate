"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/lib/store/auth-store";
import { UserPlus, Users, Mail, Phone, Eye, EyeOff, Copy, Trash2, Search, Lock, AlertCircle, Package, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const roleColors: Record<string, string> = {
  RECEPTIONIST: "bg-blue-500",
  WAITER: "bg-emerald",
  KITCHEN_STAFF: "bg-orange-500",
  STOCK_MANAGER: "bg-purple-500",
  HOUSEKEEPING: "bg-pink-500",
  BRANCH_MANAGER: "bg-indigo-500",
};

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  department: string;
  shift?: string;
  status: string;
  branchId: string;
  salary?: number;
  createdAt: string;
}

export default function StaffManagementPage() {
  const { user } = useAuthStore();
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const branchId = user?.branchId || "";
  const token = typeof window !== "undefined" ? localStorage.getItem("eastgate-token") || "" : "";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "WAITER",
    department: "restaurant",
    shift: "morning",
    password: "",
    salary: 0,
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        branchId: branchId,
        _t: Date.now().toString(), // Cache busting
      });
      const response = await fetch(`/api/manager/staff?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const result = await response.json();
      console.log("Manager staff response:", result);
      if (result.success) {
        setStaffList(result.data.staff);
        console.log("Staff count:", result.data.staff.length);
      }
    } catch (error) {
      console.error("Fetch staff error:", error);
      toast.error("Failed to fetch staff");
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = staffList.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleStats = (role: string) => staffList.filter((s) => s.role === role).length;

  const generatePassword = () => {
    const password = Math.random().toString(36).slice(-8);
    setFormData({ ...formData, password });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      toast.error("Name, email, and password are required.");
      return;
    }
    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    try {
      const response = await fetch("/api/manager/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          branchId,
        }),
      });

      const result = await response.json();
      console.log("Create staff result:", result);
      if (result.success) {
        toast.success(`Staff member created! Email: ${result.data.staff.credentials.email}`);
        setFormData({ name: "", email: "", phone: "", role: "WAITER", department: "restaurant", shift: "morning", password: "", salary: 0 });
        setDialogOpen(false);
        // Delay refresh to ensure database is updated
        setTimeout(() => {
          fetchStaff();
        }, 500);
      } else {
        toast.error(result.error || "Failed to create staff");
      }
    } catch (error) {
      toast.error("Failed to create staff member");
    }
  };

  const handleRemove = async (memberId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from branch staff? They will be deactivated.`)) return;

    try {
      const response = await fetch(`/api/manager/staff?id=${memberId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();
      if (result.success) {
        toast.success(`${memberName} removed`);
        fetchStaff();
      } else {
        toast.error(result.error || "Failed to remove staff");
      }
    } catch (error) {
      toast.error("Failed to remove staff member");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <section className="bg-gradient-to-br from-charcoal to-surface-dark text-white py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-heading font-bold mb-2 flex items-center gap-3">
                <Users className="h-8 w-8" />
                Staff Management
              </h1>
              <p className="text-white/70">Manage branch staff · Add Waiters, Receptionists, Kitchen Staff & Stock Managers</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                <Input
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="RECEPTIONIST">Receptionist</SelectItem>
                  <SelectItem value="WAITER">Waiter</SelectItem>
                  <SelectItem value="KITCHEN_STAFF">Kitchen Staff</SelectItem>
                  <SelectItem value="STOCK_MANAGER">Stock Manager</SelectItem>
                  <SelectItem value="HOUSEKEEPING">Housekeeping</SelectItem>
                </SelectContent>
              </Select>
              {branchId && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-emerald hover:bg-emerald-dark text-white gap-2">
                      <UserPlus className="h-5 w-5" />
                      Add Staff
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-heading">Add Branch Staff</DialogTitle>
                    </DialogHeader>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2 mb-4">
                      <Lock className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                      <p className="text-amber-800 text-xs">
                        They will receive these credentials and must set a new email and password before accessing their dashboard.
                      </p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <Label>Full Name *</Label>
                          <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                        </div>
                        <div>
                          <Label>Email (login) *</Label>
                          <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                        </div>
                        <div>
                          <Label>Phone</Label>
                          <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                        </div>
                        <div>
                          <Label>Role *</Label>
                          <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="WAITER">Waiter</SelectItem>
                              <SelectItem value="RECEPTIONIST">Receptionist</SelectItem>
                              <SelectItem value="KITCHEN_STAFF">Kitchen Staff</SelectItem>
                              <SelectItem value="STOCK_MANAGER">Stock Manager</SelectItem>
                              <SelectItem value="HOUSEKEEPING">Housekeeping</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Department *</Label>
                          <Select value={formData.department} onValueChange={(v) => setFormData({ ...formData, department: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="restaurant">Restaurant</SelectItem>
                              <SelectItem value="reception">Reception</SelectItem>
                              <SelectItem value="kitchen">Kitchen</SelectItem>
                              <SelectItem value="stock">Stock/Inventory</SelectItem>
                              <SelectItem value="housekeeping">Housekeeping</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Shift</Label>
                          <Select value={formData.shift} onValueChange={(v) => setFormData({ ...formData, shift: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="morning">Morning</SelectItem>
                              <SelectItem value="afternoon">Afternoon</SelectItem>
                              <SelectItem value="night">Night</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Salary (RWF)</Label>
                          <Input type="number" value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: parseInt(e.target.value) || 0 })} />
                        </div>
                        <div className="col-span-2">
                          <Label>Initial Password (min 8) *</Label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Input
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                minLength={8}
                              />
                              <Button type="button" variant="ghost" size="sm" onClick={() => setShowPassword(!showPassword)} className="absolute right-1 top-1/2 -translate-y-1/2">
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                            <Button type="button" variant="outline" onClick={generatePassword}>Generate</Button>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">Cancel</Button>
                        <Button type="submit" className="flex-1 bg-emerald hover:bg-emerald-dark text-white">Add & Assign Credentials</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/30">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-charcoal">{getRoleStats("RECEPTIONIST")}</p>
              <p className="text-xs text-text-muted-custom">Receptionists</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald/20 to-emerald-dark/10 border-emerald/30">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-charcoal">{getRoleStats("WAITER")}</p>
              <p className="text-xs text-text-muted-custom">Waiters</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border-orange-500/30">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-charcoal">{getRoleStats("KITCHEN_STAFF")}</p>
              <p className="text-xs text-text-muted-custom">Kitchen Staff</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-500/30">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-charcoal">{getRoleStats("STOCK_MANAGER")}</p>
              <p className="text-xs text-text-muted-custom">Stock Managers</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-gray-500/20 to-gray-600/10 border-gray-500/30">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-charcoal">{staffList.length}</p>
              <p className="text-xs text-text-muted-custom">Total Staff</p>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map((member, idx) => (
            <motion.div key={member.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                      {member.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{member.name}</CardTitle>
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        <Badge className={cn("text-white", roleColors[member.role] || "bg-gray-500")}>
                          {member.role.replace("_", " ")}
                        </Badge>
                        {member.status === "inactive" && (
                          <Badge variant="outline" className="text-red-700 border-red-300">
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-text-muted-custom">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-2 text-sm text-text-muted-custom">
                      <Phone className="h-4 w-4" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-text-muted-custom">
                    <Package className="h-4 w-4" />
                    <span>{member.department} · {member.shift}</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(`Email: ${member.email}\nRole: ${member.role}`);
                        toast.success("Credentials copied");
                      }}
                      className="flex-1 text-xs"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                    {member.id !== user?.id && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemove(member.id, member.name)}
                        className="px-2"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
