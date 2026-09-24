import type { Metadata } from "next";
import "./globals.css";
import BottomNav from "./components/BottomNav";
import { SportModeProvider } from "./context/SportModeContext";
import { Inter, Space_Grotesk } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

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
    <html
  lang="fr"
  className={`${inter.variable} ${spaceGrotesk.variable}`}
>
  <body className="min-h-screen pb-28 text-foreground antialiased">
    <SportModeProvider>
      {children}
    </SportModeProvider>

    <BottomNav />
  </body>
</html>
  );
}