import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import ReceptionistSidebar from "@/components/receptionist/ReceptionistSidebar";
import ReceptionistTopbar from "@/components/receptionist/ReceptionistTopbar";
import AuthGuard from "@/components/shared/AuthGuard";
import { Toaster } from "@/components/ui/sonner";

export const metadata = {
  title: "Reception Desk | EastGate Hotel Rwanda",
  description: "Receptionist dashboard for EastGate Hotel",
};

export default function ReceptionistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={["receptionist", "branch_manager"]}>
      <SidebarProvider>
        <ReceptionistSidebar />
        <SidebarInset>
          <ReceptionistTopbar />
          <main className="flex-1 overflow-auto bg-pearl/30 p-4 md:p-6">
            {children}
          </main>
        </SidebarInset>
        <Toaster position="top-right" richColors />
      </SidebarProvider>
    </AuthGuard>
  );
}
