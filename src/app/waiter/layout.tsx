"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import WaiterSidebar from "@/components/waiter/WaiterSidebar";
import WaiterTopbar from "@/components/waiter/WaiterTopbar";
import AuthGuard from "@/components/shared/AuthGuard";
import { Toaster } from "@/components/ui/sonner";
import { StaffToolbar } from "@/components/staff/StaffToolbar";

export default function WaiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={["waiter", "restaurant_staff", "branch_manager"]}>
      <SidebarProvider>
        <WaiterSidebar />
        <SidebarInset>
          <WaiterTopbar />
          <main className="flex-1 overflow-auto bg-pearl/30 p-4 md:p-6">
            {children}
          </main>
        </SidebarInset>
        <Toaster position="top-right" richColors />
      </SidebarProvider>
    </AuthGuard>
  );
}
