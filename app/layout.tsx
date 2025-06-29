import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider";
import { SWRProvider } from "@/components/swr-provider";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Customer Service Portal",
  description: "Manage your customer relationships efficiently",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
    <body
    className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
    <ThemeProvider
    attribute="class"
    defaultTheme="system"
    enableSystem
    disableTransitionOnChange
    >
    <SWRProvider>
    <AuthProvider>
    {children}
    </AuthProvider>
    </SWRProvider>
    </ThemeProvider>
    </body>
    </html>
  );
}
