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
    <>
      {children}
      <Toaster position="top-right" richColors />
    </>
  );
}
