import { Toaster } from "@/components/ui/sonner";

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
    <>
      {children}
      <Toaster position="top-right" richColors />
    </>
  );
}
