"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store";
import { Loader2, ShieldCheck } from "lucide-react";

export default function AdminAuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Give Zustand persist time to rehydrate
    const timer = setTimeout(() => {
      setChecking(false);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!checking && !isAuthenticated) {
      router.replace("/login");
    }
  }, [checking, isAuthenticated, router]);

  if (checking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-pearl/30 gap-4">
        <div className="h-16 w-16 bg-emerald rounded-2xl flex items-center justify-center shadow-xl">
          <ShieldCheck className="h-8 w-8 text-white" />
        </div>
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-emerald" />
          <p className="text-text-muted-custom font-medium">
            Verifying access...
          </p>
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
        <p className="text-charcoal font-heading font-semibold text-lg">
          Access Denied
        </p>
        <p className="text-text-muted-custom text-sm">
          Please log in to access the dashboard.
        </p>
      </div>
    );
  }

  // Check if user has admin/manager role
  const allowedRoles = [
    "super_admin",
    "super_manager",
    "branch_manager",
    "accountant",
    "event_manager",
  ];
  if (user && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-pearl/30 gap-4">
        <div className="h-16 w-16 bg-destructive/10 rounded-2xl flex items-center justify-center">
          <ShieldCheck className="h-8 w-8 text-destructive" />
        </div>
        <p className="text-charcoal font-heading font-semibold text-lg">
          Insufficient Permissions
        </p>
        <p className="text-text-muted-custom text-sm">
          You don&apos;t have permission to access the admin dashboard.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
