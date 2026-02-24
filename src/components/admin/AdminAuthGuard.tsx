"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store";
import { useI18n } from "@/lib/i18n/context";
import { Loader2, ShieldCheck } from "lucide-react";

export default function AdminAuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, requiresCredentialsChange } = useAuthStore();
  const { t } = useI18n();
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
    }
  }, [checking, isAuthenticated, requiresCredentialsChange, router]);

  if (checking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-pearl/30 gap-4">
        <div className="h-16 w-16 bg-emerald rounded-2xl flex items-center justify-center shadow-xl">
          <ShieldCheck className="h-8 w-8 text-white" />
        </div>
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-emerald" />
          <p className="text-text-muted-custom font-medium">
            {t("auth", "verifyingAccess")}
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
          {t("auth", "accessDenied")}
        </p>
        <p className="text-text-muted-custom text-sm">
          {t("auth", "pleaseLogInDashboard")}
        </p>
      </div>
    );
  }

  // Check if user has admin/manager role
  const allowedRoles = [
    "super_admin",
    "super_manager",
    "branch_manager",
    "branch_admin",
    "accountant",
    "event_manager",
    "SUPER_ADMIN",
    "SUPER_MANAGER",
    "BRANCH_MANAGER",
    "BRANCH_ADMIN",
    "ACCOUNTANT",
    "EVENT_MANAGER",
  ];
  if (user && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-pearl/30 gap-4">
        <div className="h-16 w-16 bg-destructive/10 rounded-2xl flex items-center justify-center">
          <ShieldCheck className="h-8 w-8 text-destructive" />
        </div>
        <p className="text-charcoal font-heading font-semibold text-lg">
          {t("auth", "insufficientPermissionsTitle")}
        </p>
        <p className="text-text-muted-custom text-sm">
          {t("auth", "noPermissionAdmin")}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
