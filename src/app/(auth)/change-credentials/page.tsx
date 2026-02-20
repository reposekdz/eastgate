"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/lib/store/auth-store";
import { useI18n } from "@/lib/i18n/context";
import { Lock, Mail, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const dynamic = 'force-dynamic';

export default function ChangeCredentialsPage() {
  const { user, isAuthenticated, requiresCredentialsChange, updateStaffCredentials, setCredentialsChanged } = useAuthStore();
  const { t } = useI18n();
  const router = useRouter();
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }
    if (!requiresCredentialsChange) {
      const r = user.role;
      if (r === "guest") router.replace("/");
      else if (r === "super_admin" || r === "super_manager" || r === "accountant" || r === "event_manager" || r === "branch_admin") router.replace("/admin");
      else if (r === "branch_manager") router.replace("/manager");
      else if (r === "receptionist") router.replace("/receptionist");
      else if (r === "kitchen_staff") router.replace("/kitchen");
      else if (r === "waiter" || r === "restaurant_staff") router.replace("/waiter");
      else router.replace("/admin");
    }
  }, [isAuthenticated, user, requiresCredentialsChange, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    if (!newEmail.trim() || !newPassword || !confirmPassword) {
      toast.error("Please fill all fields.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    const result = updateStaffCredentials(user.id, newEmail.trim(), newPassword);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error ?? "Update failed.");
      return;
    }
    setCredentialsChanged(user.id);
    toast.success("Credentials updated. You can now use your new email and password.");
    if (user.role === "super_admin" || user.role === "super_manager" || user.role === "accountant" || user.role === "event_manager" || user.role === "branch_admin") router.push("/admin");
    else if (user.role === "branch_manager") router.push("/manager");
    else if (user.role === "receptionist") router.push("/receptionist");
    else if (user.role === "kitchen_staff") router.push("/kitchen");
    else if (user.role === "waiter" || user.role === "restaurant_staff") router.push("/waiter");
    else router.push("/admin");
  };

  if (!isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-charcoal via-charcoal to-emerald-dark p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-emerald/20 flex items-center justify-center">
            <ShieldCheck className="h-7 w-7 text-emerald" />
          </div>
          <CardTitle className="text-xl font-heading">Set New Credentials</CardTitle>
          <CardDescription>
            For security, you must set a new email and password before accessing your branch dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-charcoal mb-1.5 block">New Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="you@eastgate.rw"
                  className="pl-9"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-charcoal mb-1.5 block">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="pl-9 pr-9"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-charcoal"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-charcoal mb-1.5 block">Confirm Password</label>
              <Input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                minLength={6}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-emerald hover:bg-emerald-dark" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Update & Continue"}
            </Button>
          </form>
          <p className="text-xs text-center text-muted-foreground mt-4">
            Logged in as <span className="font-medium text-charcoal">{user.name}</span> · {user.branchName}
          </p>
          <Button variant="ghost" className="w-full mt-2" asChild>
            <Link href="/login">Sign out and use different account</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
