import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import { plPL } from '@clerk/localizations'
import { ToastProvider } from '@/components/providers/ToastProvider'
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Piłkarzyki",
  description: "Piłkarzyki — menedżer ligi fantasy football: składy, wyniki, tabele i puchar w jednym miejscu.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={plPL}>
      <html lang="pl" className="dark">
        {/* No `font-sans` here: it is a utility, so it outranked
            `body { font-family: var(--font-body) }` in @layer base and resolved to
            Tailwind's ui-sans-serif system stack. Body copy then rendered in the
            system font while headings (element rule, no competing utility) used
            Inter — two typefaces on every screen. The token now applies. */}
        <body className={`${inter.variable} antialiased`}>
          {children}
          <ToastProvider />
        </body>
      </html>
    </ClerkProvider>
  );
}
