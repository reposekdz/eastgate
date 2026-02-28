import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/context";
import { Providers } from "@/components/providers/index";

export const metadata: Metadata = {
  title: "EastGate Hotel Rwanda | Ihoteli y'Ubwiza mu Mutima wa Afurika",
  description:
    "Shakira ubunararibonye budashobora guhura n'ubundi mu gihugu cy'ibihumbi by'imisozi. EastGate Hotel Rwanda itanga uburyo bwo kuryama bw'isi yose, ibiryo byiza, spa n'ubuzima, n'ahantu h'ibirori.",
  keywords: [
    "ihoteli y'ubwiza Rwanda",
    "ihoteli Kigali",
    "EastGate Hotel",
    "ubwiza bw'Afurika",
    "kuryama mu Rwanda",
  ],
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="rw" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className="antialiased overflow-x-hidden">
        <Providers>
          <I18nProvider>{children}</I18nProvider>
        </Providers>
      </body>
    </html>
  );
}
