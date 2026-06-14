import type { Metadata } from "next";
import { Courier_Prime } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { SupportWidget } from "@/components/widget/support-widget";

const courier = Courier_Prime({
  weight: ["400", "700"],
  variable: "--font-sans",
  subsets: ["latin"],
});

const mottingham = localFont({
  src: "../public/fonts/MottinghamScript.woff2",
  variable: "--font-brand",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ticketr — support tickets, receipt-style",
  description:
    "Self-hosted support ticketing with a retro receipt aesthetic.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${courier.variable} ${mottingham.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <AuthSessionProvider>
          {children}
          <SupportWidget />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
