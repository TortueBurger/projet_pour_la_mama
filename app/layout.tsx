import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Délégués Manquants – Générateur Excel",
  description: "Transformez vos feuilles manuscrites en fichier Excel automatiquement.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
