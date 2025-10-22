import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CustomApolloProvider } from "@/components/ApolloProvider";
import { PrivyProvider } from "@/components/PrivyProvider";
import { Navbar } from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "🌒 Eclipse Marketplace",
  description: "Private data marketplace powered by Nillion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PrivyProvider>
          <CustomApolloProvider>
            <Navbar />
            {children}
          </CustomApolloProvider>
        </PrivyProvider>
      </body>
    </html>
  );
}
