import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import WaiterSidebar from "@/components/waiter/WaiterSidebar";
import WaiterTopbar from "@/components/waiter/WaiterTopbar";
import AuthGuard from "@/components/shared/AuthGuard";
import { Toaster } from "@/components/ui/sonner";

export const metadata = {
  title: "Waiter Dashboard | EastGate Hotel Rwanda",
  description: "Waiter service dashboard for EastGate Hotel",
};

export default function WaiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={["waiter", "restaurant_staff", "kitchen_staff", "branch_manager"]}>
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
