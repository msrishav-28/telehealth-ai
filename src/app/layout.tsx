import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

import { Providers } from './providers';
import { ThemeProvider } from '@/components/theme-provider';
import { AccessibilityProvider } from '@/components/enhanced/AccessibilityProvider';
import { ErrorBoundary } from '@/components/enhanced/ErrorBoundary';
import { OfflineIndicator } from '@/components/enhanced/OfflineIndicator';
import { PWAInstallPrompt } from '@/components/enhanced/PWAInstallPrompt';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
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
    userScalable: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'TeleHealth AI',
    'application-name': 'TeleHealth AI',
    'msapplication-TileColor': '#3b82f6',
    'theme-color': '#3b82f6',
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
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="dns-prefetch" href="https://api.perplexity.ai" />
          <link rel="dns-prefetch" href="https://clerk.dev" />
          
          {/* Service Worker Registration */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js')
                      .then(function(registration) {
                        console.log('SW registered: ', registration);
                      })
                      .catch(function(registrationError) {
                        console.log('SW registration failed: ', registrationError);
                      });
                  });
                }
              `,
            }}
          />
        </head>
        <body className={`${inter.variable} font-sans antialiased mobile-optimized`}>
          <ErrorBoundary>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <AccessibilityProvider>
                <Providers>
                  <div id="main-content" className="min-h-screen">
                    {children}
                  </div>
                  
                  {/* Global UI Components */}
                  <OfflineIndicator />
                  <PWAInstallPrompt />
                  
                  <Toaster
                    position="bottom-right"
                    toastOptions={{
                      duration: 4000,
                      style: {
                        background: 'var(--background)',
                        color: 'var(--foreground)',
                        border: '1px solid var(--border)',
                      },
                      success: {
                        iconTheme: {
                          primary: 'var(--primary)',
                          secondary: 'var(--primary-foreground)',
                        },
                      },
                      error: {
                        iconTheme: {
                          primary: 'var(--destructive)',
                          secondary: 'var(--destructive-foreground)',
                        },
                      },
                    }}
                  />
                </Providers>
              </AccessibilityProvider>
            </ThemeProvider>
          </ErrorBoundary>
          
          {/* Analytics */}
          <Analytics />
          <SpeedInsights />
          
          {/* Performance Monitoring */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Web Vitals monitoring
                import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
                  function sendToAnalytics(metric) {
                    // Send to your analytics service
                    if (typeof gtag !== 'undefined') {
                      gtag('event', metric.name, {
                        event_category: 'Web Vitals',
                        event_label: metric.id,
                        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
                        non_interaction: true,
                      });
                    }
                  }
                  
                  getCLS(sendToAnalytics);
                  getFID(sendToAnalytics);
                  getFCP(sendToAnalytics);
                  getLCP(sendToAnalytics);
                  getTTFB(sendToAnalytics);
                });
              `,
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}