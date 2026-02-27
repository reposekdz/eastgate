"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store";
import { Loader2 } from "lucide-react";
import HousekeepingSidebar from "@/components/housekeeping/HousekeepingSidebar";
import HousekeepingHeader from "@/components/housekeeping/HousekeepingHeader";

export default function HousekeepingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
      return;
    }

    if (user?.role !== "housekeeping" && 
        user?.role !== "super_admin" && 
        user?.role !== "super_manager" && 
        user?.role !== "branch_manager") {
      router.push("/");
      return;
    }

    setLoading(false);
  }, [isAuthenticated, user, router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-pearl">
        <Loader2 className="h-8 w-8 animate-spin text-emerald" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-pearl overflow-hidden">
      <HousekeepingSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <HousekeepingHeader />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
