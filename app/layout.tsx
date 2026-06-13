import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { AuthSessionProvider } from "@/components/providers/session-provider";

const bricolage = Bricolage_Grotesque({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ticketr — Modern open-source support tickets",
  description:
    "A clean, self-hosted ticketing system for support teams and communities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bricolage.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
