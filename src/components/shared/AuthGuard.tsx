"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store";
import type { UserRole } from "@/lib/types/enums";
import { Loader2, ShieldCheck, AlertTriangle } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  requireBranch?: boolean;
}

export default function AuthGuard({ children, allowedRoles, requireBranch = true }: AuthGuardProps) {
  const { user, isAuthenticated, requiresCredentialsChange } = useAuthStore();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setChecking(false), 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (checking) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (requiresCredentialsChange) {
      router.replace("/change-credentials");
      return;
    }
    if (requireBranch && user && !user.branchId) {
      router.replace("/login");
    }
  }, [checking, isAuthenticated, requiresCredentialsChange, requireBranch, user, router]);

  if (checking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-pearl/30 gap-4">
        <div className="h-16 w-16 bg-emerald rounded-2xl flex items-center justify-center shadow-xl">
          <ShieldCheck className="h-8 w-8 text-white" />
        </div>
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-emerald" />
          <p className="text-text-muted-custom font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-pearl/30 gap-4">
        <div className="h-16 w-16 bg-destructive/10 rounded-2xl flex items-center justify-center">
          <ShieldCheck className="h-8 w-8 text-destructive" />
        </div>
        <p className="text-charcoal font-heading font-semibold text-lg">Access Denied</p>
        <p className="text-text-muted-custom text-sm">Please log in to access the dashboard.</p>
      </div>
    );
  }

  if (requireBranch && user && !user.branchId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-pearl/30 gap-4">
        <div className="h-16 w-16 bg-orange-100 rounded-2xl flex items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-orange-600" />
        </div>
        <p className="text-charcoal font-heading font-semibold text-lg">No Branch Assigned</p>
        <p className="text-text-muted-custom text-sm">You must be assigned to a branch to access this dashboard.</p>
      </div>
    );
  }

  const hasAccess = user && (
    allowedRoles.includes(user.role) || 
    user.role === "super_admin" || 
    user.role === "super_manager" ||
    allowedRoles.some(role => role.toLowerCase() === user.role.toLowerCase())
  );
  
  if (user && !hasAccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-pearl/30 gap-4">
        <div className="h-16 w-16 bg-destructive/10 rounded-2xl flex items-center justify-center">
          <ShieldCheck className="h-8 w-8 text-destructive" />
        </div>
        <p className="text-charcoal font-heading font-semibold text-lg">Insufficient Permissions</p>
        <p className="text-text-muted-custom text-sm">
          You don&apos;t have permission to access this dashboard.
        </p>
        <p className="text-xs text-text-muted-custom mt-2">
          Your role: {user.role} | Required: {allowedRoles.join(", ")}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
