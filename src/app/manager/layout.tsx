import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import ManagerSidebar from "@/components/manager/ManagerSidebar";
import ManagerTopbar from "@/components/manager/ManagerTopbar";
import AuthGuard from "@/components/shared/AuthGuard";
import { Toaster } from "@/components/ui/sonner";
import { StaffToolbar } from "@/components/staff/StaffToolbar";

export const metadata = {
  title: "Manager Dashboard | EastGate Hotel Rwanda",
  description: "Branch manager dashboard for EastGate Hotel",
};

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={["super_admin", "super_manager", "branch_manager"]}>
      <SidebarProvider>
        <ManagerSidebar />
        <SidebarInset>
          <ManagerTopbar />
          <main className="flex-1 overflow-auto bg-pearl/30 p-3 md:p-4">
            {children}
          </main>
        </SidebarInset>
        <Toaster position="top-right" richColors />
      </SidebarProvider>
    </AuthGuard>
  );
}
