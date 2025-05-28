import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

import { Providers } from './providers';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'TeleHealth AI - Your Personal Health Assistant',
  description: 'AI-powered telehealth platform providing personalized medical information from trusted sources',
  keywords: ['telehealth', 'ai', 'medical', 'health', 'assistant', 'doctor'],
  authors: [{ name: 'TeleHealth AI Team' }],
  openGraph: {
    title: 'TeleHealth AI - Your Personal Health Assistant',
    description: 'Get instant, personalized medical information from AI specialists',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TeleHealth AI Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TeleHealth AI - Your Personal Health Assistant',
    description: 'Get instant, personalized medical information from AI specialists',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
    other: {
      rel: 'mask-icon',
      url: '/safari-pinned-tab.svg',
    },
  },
  manifest: '/manifest.json',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} font-sans antialiased`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Providers>
              {children}
              <Toaster
                position="bottom-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'var(--background)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--border)',
                  },
                }}
              />
            </Providers>
          </ThemeProvider>
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
}