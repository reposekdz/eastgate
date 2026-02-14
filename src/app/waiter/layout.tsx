import { Toaster } from "@/components/ui/sonner";

export const metadata = {
  title: "Restaurant Service | EastGate Hotel Rwanda",
  description: "Waiter POS dashboard for EastGate Hotel",
};

export default function WaiterLayout({
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
