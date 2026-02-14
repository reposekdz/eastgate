import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BottomNav from "@/components/layout/BottomNav";
import LiveChatWidget from "@/components/chat/LiveChatWidget";
import { Toaster } from "@/components/ui/sonner";
import { CurrencyProvider } from "@/components/shared/CurrencySelector";
import { I18nProvider } from "@/lib/i18n/context";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <I18nProvider>
      <CurrencyProvider>
        <Navbar />
        <main className="min-h-screen pb-20 md:pb-0">{children}</main>
        <Footer />
        <BottomNav />
        <LiveChatWidget />
        <Toaster position="top-right" richColors closeButton />
      </CurrencyProvider>
    </I18nProvider>
  );
}
