import type { Metadata } from "next";
import "./globals.css";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="rw">
      <body className="antialiased">{children}</body>
    </html>
  );
}
