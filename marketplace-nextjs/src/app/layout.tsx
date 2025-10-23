import type { Metadata } from 'next';
import { Inter, Crimson_Pro } from 'next/font/google';
import './globals.css';
import { CustomApolloProvider } from '@/components/ApolloProvider';
import { PrivyProvider } from '@/components/PrivyProvider';
import { ParallaxBackground } from '@/components/ParallaxBackground';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const crimsonPro = Crimson_Pro({
  variable: '--font-crimson-pro',
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Eclipse - Private Data Marketplace',
  description:
    "Buy private data with confidence. A private AI agent answers your questions about encrypted content, so you know what you're buying before you commit.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${crimsonPro.variable}`}>
      <body className="antialiased">
        <PrivyProvider>
          <CustomApolloProvider>
            <ParallaxBackground />
            {children}
          </CustomApolloProvider>
        </PrivyProvider>
      </body>
    </html>
  );
}
