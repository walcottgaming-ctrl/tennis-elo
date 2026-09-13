import type { Metadata } from "next";
import "./globals.css";
import BottomNav from "./components/BottomNav";

export const metadata: Metadata = {
  title: "SmashBreakPoint",
  description: "Classement et suivi de matchs de tennis et de padel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-gray-50 pb-24">
        {children}
        <BottomNav />
      </body>
    </html>
  );
}