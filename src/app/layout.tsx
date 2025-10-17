import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import { ToastProvider } from '@/components/providers/ToastProvider'
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Pilkarzyki - Modern Fantasy Football",
  description: "Experience the ultimate fantasy football management platform with real-time stats and immersive gameplay",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className={`${inter.variable} font-sans antialiased`}>
          {children}
          <ToastProvider />
        </body>
      </html>
    </ClerkProvider>
  );
}
