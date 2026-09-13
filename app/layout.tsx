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
      <body className="min-h-screen bg-[#0E0F11] pb-28 text-[#F5F5F5] antialiased">
        {children}
        <BottomNav />
      </body>
    </html>
  );
}