import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SmartStat AI · Admin",
    template: "%s · SmartStat AI",
  },
  description:
    "White-label indoor navigation for hospitals — admin dashboard.",
  applicationName: "SmartStat AI",
  authors: [{ name: "SmartStat AI" }],
  creator: "SmartStat AI",
  themeColor: "#0EA5E9",
  openGraph: {
    title: "SmartStat AI",
    description: "Find your way, faster.",
    siteName: "SmartStat AI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-gradient-to-br from-slate-100 via-slate-50 to-white text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-white">
        {children}
      </body>
    </html>
  );
}
