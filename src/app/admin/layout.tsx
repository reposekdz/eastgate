"use client";

import { Suspense } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import AdminAuthGuard from "@/components/admin/AdminAuthGuard";
import { Toaster } from "@/components/ui/sonner";

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-pearl/30">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald"></div>
    </div>
  );
}

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
            <Suspense fallback={<LoadingFallback />}>
              {children}
            </Suspense>
          </main>
        </SidebarInset>
        <Toaster position="top-right" richColors />
      </SidebarProvider>
    </AdminAuthGuard>
  );
}
