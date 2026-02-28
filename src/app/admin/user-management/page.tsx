"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/lib/store/auth-store";
import { Users, Edit, Trash2, Save, X, Shield, UserCog, Mail, Phone, Lock, Building2 } from "lucide-react";
import { toast } from "sonner";

interface Manager {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  level: string;
  isActive: boolean;
  totalBranches: number;
  lastLogin: Date;
  assignments: Array<{ branch: { id: string; name: string } }>;
}

interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: string;
  department: string;
  status: string;
  branchId: string;
  branch: { id: string; name: string };
}

export default function UserManagementPage() {
  const { user } = useAuthStore();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    level: "",
    role: "",
    department: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("eastgate-token");
      const res = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setManagers(data.managers);
        setStaff(data.staff);
      }
    } catch (error) {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("eastgate-token");

    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingUser.id,
          userType: editingUser.userType,
          ...formData,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("User updated successfully");
        fetchUsers();
        setIsDialogOpen(false);
        resetForm();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error("Update failed");
    }
  };

  const handleDelete = async (id: string, userType: string) => {
    if (!confirm("Deactivate this user?")) return;

    const token = localStorage.getItem("eastgate-token");
    try {
      const res = await fetch(`/api/users?id=${id}&userType=${userType}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.success) {
        toast.success("User deactivated");
        fetchUsers();
      }
    } catch (error) {
      toast.error("Failed to deactivate");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "",
      level: "",
      role: "",
      department: "",
    });
    setEditingUser(null);
  };

  const openEditDialog = (userData: any, userType: string) => {
    setEditingUser({ ...userData, userType });
    setFormData({
      name: userData.name,
      email: userData.email,
      phone: userData.phone || "",
      password: "",
      level: userData.level || "",
      role: userData.role || "",
      department: userData.department || "",
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-md text-charcoal">User Management</h1>
          <p className="text-sm text-text-muted-custom">Manage all system users and permissions</p>
        </div>
      </div>

      <Tabs defaultValue="managers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="managers" className="gap-2">
            <Shield className="h-4 w-4" /> Managers ({managers.length})
          </TabsTrigger>
          <TabsTrigger value="staff" className="gap-2">
            <UserCog className="h-4 w-4" /> Staff ({staff.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="managers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {managers.map((manager) => (
              <Card key={manager.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={manager.avatar} />
                      <AvatarFallback className="bg-emerald text-white">
                        {manager.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-charcoal">{manager.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {manager.level.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-text-muted-custom">
                      <Mail className="h-3 w-3" />
                      {manager.email}
                    </div>
                    {manager.phone && (
                      <div className="flex items-center gap-2 text-text-muted-custom">
                        <Phone className="h-3 w-3" />
                        {manager.phone}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-text-muted-custom">
                      <Building2 className="h-3 w-3" />
                      {manager.totalBranches} branch(es)
                    </div>
                  </div>
                  {manager.assignments.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {manager.assignments.map((a, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {a.branch.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openEditDialog(manager, "manager")}>
                      <Edit className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    {user?.role === "super_admin" && (
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(manager.id, "manager")}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staff.map((member) => (
              <Card key={member.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback className="bg-blue-500 text-white">
                        {member.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-charcoal">{member.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {member.role}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-text-muted-custom">
                      <Mail className="h-3 w-3" />
                      {member.email}
                    </div>
                    {member.phone && (
                      <div className="flex items-center gap-2 text-text-muted-custom">
                        <Phone className="h-3 w-3" />
                        {member.phone}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{member.department}</Badge>
                      <Badge variant="secondary">{member.branch.name}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openEditDialog(member, "staff")}>
                      <Edit className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    {user?.role === "super_admin" && (
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(member.id, "staff")}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">New Password (leave empty to keep current)</label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            {editingUser?.userType === "manager" && (
              <div>
                <label className="text-sm font-medium">Level</label>
                <Select value={formData.level} onValueChange={(v) => setFormData({ ...formData, level: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="senior_manager">Senior Manager</SelectItem>
                    <SelectItem value="super_manager">Super Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {editingUser?.userType === "staff" && (
              <>
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="waiter">Waiter</SelectItem>
                      <SelectItem value="receptionist">Receptionist</SelectItem>
                      <SelectItem value="kitchen_staff">Kitchen Staff</SelectItem>
                      <SelectItem value="stock_manager">Stock Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Department</label>
                  <Select value={formData.department} onValueChange={(v) => setFormData({ ...formData, department: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                      <SelectItem value="reception">Reception</SelectItem>
                      <SelectItem value="kitchen">Kitchen</SelectItem>
                      <SelectItem value="housekeeping">Housekeeping</SelectItem>
                      <SelectItem value="stock">Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                <X className="h-4 w-4 mr-2" /> Cancel
              </Button>
              <Button type="submit" className="bg-emerald hover:bg-emerald-dark">
                <Save className="h-4 w-4 mr-2" /> Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
