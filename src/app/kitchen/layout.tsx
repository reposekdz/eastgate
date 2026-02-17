import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import KitchenSidebar from "@/components/kitchen/KitchenSidebar";
import KitchenTopbar from "@/components/kitchen/KitchenTopbar";
import AuthGuard from "@/components/shared/AuthGuard";
import { Toaster } from "@/components/ui/sonner";
import { StaffToolbar } from "@/components/staff/StaffToolbar";

export const metadata = {
  title: "Kitchen Dashboard | EastGate Hotel Rwanda",
  description: "Kitchen order queue and prep dashboard for EastGate Hotel",
};

export default function KitchenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={["kitchen_staff", "branch_manager"]}>
      <SidebarProvider>
        <KitchenSidebar />
        <SidebarInset>
          <KitchenTopbar />
          <main className="flex-1 overflow-auto bg-pearl/30 p-4 md:p-6">
            {children}
          </main>
        </SidebarInset>
        <Toaster position="top-right" richColors />
      </SidebarProvider>
    </AuthGuard>
  );
}
