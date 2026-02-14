"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useBranchStore } from "@/lib/store/branch-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { Department } from "@/lib/types/enums";
import { UserPlus, Users, Mail, Phone, Eye, EyeOff, Copy, Check, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function StaffManagementPage() {
  const { user } = useAuthStore();
  const { getStaff, addStaffMember } = useBranchStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "receptionist" as "receptionist" | "waiter" | "kitchen_staff" | "housekeeping",
    shift: "Morning" as "Morning" | "Evening" | "Night" | "Split",
    password: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const branchStaff = getStaff(user?.branchId || "", user?.role || "guest");

  const filteredStaff = branchStaff.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const generatePassword = () => {
    const password = Math.random().toString(36).slice(-8);
    setFormData({ ...formData, password });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const deptMap: Record<string, Department> = {
      receptionist: "front_desk",
      waiter: "restaurant",
      kitchen_staff: "restaurant",
      housekeeping: "housekeeping",
    };

    addStaffMember({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
      department: deptMap[formData.role],
      shift: formData.shift,
      status: "active",
      avatar: `https://i.pravatar.cc/40?u=${formData.email}`,
      branchId: user?.branchId || "",
      joinDate: new Date().toISOString().split("T")[0],
    });
    
    toast.success(
      <div className="space-y-1">
        <p className="font-semibold">{formData.name} added!</p>
        <p className="text-xs">Email: {formData.email}</p>
        <p className="text-xs">Password: {formData.password}</p>
      </div>,
      { duration: 10000 }
    );
    setFormData({ name: "", email: "", phone: "", role: "receptionist", shift: "Morning", password: "" });
    setDialogOpen(false);
  };

  const removeStaff = (memberId: string, memberName: string) => {
    if (confirm(`Remove ${memberName} from staff?`)) {
      const { removeStaffMember } = useBranchStore.getState();
      removeStaffMember(memberId);
      toast.success(`${memberName} removed`);
    }
  };

  const roleColors: Record<string, string> = {
    receptionist: "bg-blue-500",
    waiter: "bg-emerald",
    kitchen_staff: "bg-orange-500",
    housekeeping: "bg-purple-500",
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <section className="bg-gradient-to-br from-charcoal to-surface-dark text-white py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-heading font-bold mb-2 flex items-center gap-3">
                <Users className="h-8 w-8" />
                Staff Management
              </h1>
              <p className="text-white/70">Manage {user?.branchName} staff</p>
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
                  <SelectItem value="receptionist">Receptionist</SelectItem>
                  <SelectItem value="waiter">Waiter</SelectItem>
                  <SelectItem value="kitchen_staff">Kitchen Staff</SelectItem>
                  <SelectItem value="housekeeping">Housekeeping</SelectItem>
                </SelectContent>
              </Select>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald hover:bg-emerald-dark text-white gap-2">
                    <UserPlus className="h-5 w-5" />
                    Add Staff
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-heading">Add Staff Member</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Full Name *</Label>
                      <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div>
                      <Label>Email *</Label>
                      <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                    </div>
                    <div>
                      <Label>Phone *</Label>
                      <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                    </div>
                    <div>
                      <Label>Role *</Label>
                      <Select value={formData.role} onValueChange={(v: typeof formData.role) => setFormData({ ...formData, role: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="receptionist">Receptionist</SelectItem>
                          <SelectItem value="waiter">Waiter</SelectItem>
                          <SelectItem value="kitchen_staff">Kitchen Staff</SelectItem>
                          <SelectItem value="housekeeping">Housekeeping</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Shift *</Label>
                      <Select value={formData.shift} onValueChange={(v: typeof formData.shift) => setFormData({ ...formData, shift: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Morning">Morning</SelectItem>
                          <SelectItem value="Evening">Evening</SelectItem>
                          <SelectItem value="Night">Night</SelectItem>
                          <SelectItem value="Split">Split</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label>Password *</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
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
                    <Button type="submit" className="flex-1 bg-emerald hover:bg-emerald-dark text-white">Add Staff</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/30">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-charcoal">{branchStaff.filter(s => s.role === "receptionist").length}</p>
              <p className="text-xs text-text-muted-custom">Receptionists</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald/20 to-emerald-dark/10 border-emerald/30">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-charcoal">{branchStaff.filter(s => s.role === "waiter").length}</p>
              <p className="text-xs text-text-muted-custom">Waiters</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border-orange-500/30">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-charcoal">{branchStaff.filter(s => s.role === "kitchen_staff").length}</p>
              <p className="text-xs text-text-muted-custom">Kitchen Staff</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-500/30">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-charcoal">{branchStaff.filter(s => s.role === "housekeeping").length}</p>
              <p className="text-xs text-text-muted-custom">Housekeeping</p>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map((member, idx) => (
            <motion.div key={member.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <img src={member.avatar} alt={member.name} className="h-12 w-12 rounded-full" />
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{member.name}</CardTitle>
                      <Badge className={cn("mt-1 text-white", roleColors[member.role] || "bg-gray-500")}>
                        {member.role.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-text-muted-custom">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-muted-custom">
                    <Phone className="h-4 w-4" />
                    <span>{member.phone}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">{member.shift} Shift</Badge>
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
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeStaff(member.id, member.name)}
                      className="px-2"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
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
