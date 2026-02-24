"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/format";
import { Shield, Building2, Mail, Phone, Clock, Calendar, Lock, Edit, UserCog, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

const statusStyles: Record<string, string> = {
  active: "bg-status-available/10 text-status-available border-status-available/20",
  on_leave: "bg-order-pending/10 text-order-pending border-order-pending/20",
  off_duty: "bg-slate-100 text-slate-custom border-slate-200",
};

interface StaffProfileSheetProps {
  staff: any;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function StaffProfileSheet({ staff, open, onClose, onUpdate }: StaffProfileSheetProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [shiftLoading, setShiftLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    status: "",
  });
  const [shiftForm, setShiftForm] = useState({
    shift: "",
    startDate: "",
  });

  const handleEditProfile = () => {
    setEditForm({
      name: staff.name,
      email: staff.email,
      phone: staff.phone || "",
      department: staff.department || "",
      status: staff.status || "active",
    });
    setShowEditDialog(true);
  };

  const handleAssignShift = () => {
    setShiftForm({
      shift: staff.shift || "Morning",
      startDate: new Date().toISOString().split("T")[0],
    });
    setShowShiftDialog(true);
  };

  const handleForcePasswordReset = async () => {
    const ok = confirm(`Force ${staff.name} to change password on next login?`);
    if (!ok) return;

    try {
      const res = await fetch(`/api/staff/${staff.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forcePasswordReset: true }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Password reset required on next login");
        onUpdate();
      } else {
        toast.error(data.error || "Failed to set password reset flag");
      }
    } catch (error) {
      toast.error("Failed to force password reset");
    }
  };

  const handleDeleteStaff = async () => {
    const ok = confirm(`Delete ${staff.name}? This action cannot be undone.`);
    if (!ok) return;

    try {
      const res = await fetch(`/api/staff/${staff.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success(`${staff.name} deleted successfully`);
        onClose();
        onUpdate();
      } else {
        toast.error(data.error || "Failed to delete staff");
      }
    } catch (error) {
      toast.error("Failed to delete staff");
    }
  };

  const submitEditProfile = async () => {
    if (!editForm.name || !editForm.email) {
      toast.error("Name and email are required");
      return;
    }

    setEditLoading(true);
    try {
      const res = await fetch(`/api/staff/${staff.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Profile updated successfully");
        setShowEditDialog(false);
        onUpdate();
      } else {
        toast.error(data.error || "Failed to update profile");
      }
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setEditLoading(false);
    }
  };

  const submitAssignShift = async () => {
    if (!shiftForm.shift) {
      toast.error("Please select a shift");
      return;
    }

    setShiftLoading(true);
    try {
      const res = await fetch(`/api/staff/${staff.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shift: shiftForm.shift }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Shift assigned: ${shiftForm.shift}`);
        setShowShiftDialog(false);
        onUpdate();
      } else {
        toast.error(data.error || "Failed to assign shift");
      }
    } catch (error) {
      toast.error("Failed to assign shift");
    } finally {
      setShiftLoading(false);
    }
  };

  if (!staff) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Staff Profile</SheetTitle>
            <SheetDescription>Employee details and assignment</SheetDescription>
          </SheetHeader>

          <div className="space-y-5 mt-6 px-1">
            {/* Profile Header */}
            <div className="flex items-center gap-3">
              <Avatar className="h-16 w-16">
                <AvatarImage src={staff.avatar} alt={staff.name} />
                <AvatarFallback className="bg-emerald/10 text-emerald text-lg font-semibold">
                  {staff.name.split(" ").map((n: string) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-lg font-semibold text-charcoal">{staff.name}</p>
                <Badge variant="outline" className={`text-[10px] rounded-[4px] mt-1 ${statusStyles[staff.status]}`}>
                  {staff.status === "on_leave" ? "On Leave" : staff.status === "off_duty" ? "Off Duty" : "Active"}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Details */}
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-sm">
                <Shield className="h-4 w-4 text-text-muted-custom shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-text-muted-custom text-xs uppercase tracking-wider mb-0.5">Role</p>
                  <p className="text-charcoal font-medium">{staff.role}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm">
                <Building2 className="h-4 w-4 text-text-muted-custom shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-text-muted-custom text-xs uppercase tracking-wider mb-0.5">Department</p>
                  <p className="text-charcoal font-medium">{staff.department || "Not assigned"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm">
                <Mail className="h-4 w-4 text-text-muted-custom shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-text-muted-custom text-xs uppercase tracking-wider mb-0.5">Email</p>
                  <p className="text-slate-custom break-all">{staff.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm">
                <Phone className="h-4 w-4 text-text-muted-custom shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-text-muted-custom text-xs uppercase tracking-wider mb-0.5">Phone</p>
                  <p className="text-slate-custom">{staff.phone || "Not provided"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm">
                <Clock className="h-4 w-4 text-text-muted-custom shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-text-muted-custom text-xs uppercase tracking-wider mb-0.5">Shift</p>
                  <p className="text-charcoal font-medium">{staff.shift || "Not assigned"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm">
                <Calendar className="h-4 w-4 text-text-muted-custom shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-text-muted-custom text-xs uppercase tracking-wider mb-0.5">Joined</p>
                  <p className="text-charcoal font-medium">{formatDate(staff.joinDate || staff.createdAt)}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="rounded-[6px] text-sm gap-2" onClick={handleEditProfile}>
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </Button>
                <Button className="bg-emerald hover:bg-emerald-dark text-white rounded-[6px] text-sm gap-2" onClick={handleAssignShift}>
                  <UserCog className="h-4 w-4" />
                  Assign Shift
                </Button>
              </div>
              <Button variant="destructive" className="w-full rounded-[6px] text-sm gap-2" onClick={handleForcePasswordReset}>
                <Lock className="h-4 w-4" />
                Force Password Reset
              </Button>
              {staff.role !== "SUPER_ADMIN" && (
                <Button variant="outline" className="w-full rounded-[6px] text-sm gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={handleDeleteStaff}>
                  <Trash2 className="h-4 w-4" />
                  Delete Staff Member
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Staff Profile</DialogTitle>
            <DialogDescription>Update employee information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="john@eastgate.rw"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="+250 788 123 456"
              />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Input
                value={editForm.department}
                onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                placeholder="Front Desk, Kitchen, etc."
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                  <SelectItem value="off_duty">Off Duty</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitEditProfile}
              disabled={editLoading}
              className="bg-emerald hover:bg-emerald-dark text-white"
            >
              {editLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Shift Dialog */}
      <Dialog open={showShiftDialog} onOpenChange={setShowShiftDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Shift</DialogTitle>
            <DialogDescription>Set work shift for {staff.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Shift *</Label>
              <Select value={shiftForm.shift} onValueChange={(v) => setShiftForm({ ...shiftForm, shift: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Morning">Morning (6:00 AM - 2:00 PM)</SelectItem>
                  <SelectItem value="Afternoon">Afternoon (2:00 PM - 10:00 PM)</SelectItem>
                  <SelectItem value="Night">Night (10:00 PM - 6:00 AM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={shiftForm.startDate}
                onChange={(e) => setShiftForm({ ...shiftForm, startDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowShiftDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitAssignShift}
              disabled={shiftLoading}
              className="bg-emerald hover:bg-emerald-dark text-white"
            >
              {shiftLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assign Shift"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
