import type { Metadata } from "next";
import "./globals.css";
import BottomNav from "./components/BottomNav";
import { SportModeProvider } from "./context/SportModeContext";

export const metadata: Metadata = {
  title: "SmashBreakPoint",
  description:
    "Classement et suivi de matchs de tennis et de padel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-background pb-28 text-foreground antialiased">
        <SportModeProvider>
          {children}
        </SportModeProvider>

        <BottomNav />
      </body>
    </html>
  );
}