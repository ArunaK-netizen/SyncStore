import { AuthProvider } from "@/lib/AuthContext";
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PartTime Admin — Dashboard",
  description: "Admin dashboard for managing your part-time business",
};

import { ParttimeProvider } from "@/lib/ParttimeContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${outfit.variable} font-outfit antialiased bg-background text-white`}>
        <AuthProvider>
          <ParttimeProvider>
            {children}
          </ParttimeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
