import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import AdminAuthGuard from "@/components/admin/AdminAuthGuard";
import { Toaster } from "@/components/ui/sonner";

export const metadata = {
  title: "Admin Dashboard | EastGate Hotel Rwanda",
  description: "Enterprise hospitality management dashboard",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthGuard>
      <SidebarProvider>
        <AdminSidebar />
        <SidebarInset>
          <AdminTopbar />
          <main className="flex-1 overflow-auto bg-pearl/30 p-4 md:p-6">
            {children}
          </main>
        </SidebarInset>
        <Toaster position="top-right" richColors />
      </SidebarProvider>
    </AdminAuthGuard>
  );
}
