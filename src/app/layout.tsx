import * as React from 'react';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import Loader from '@/components/ui/loader';
import { NavigationEvents } from '@/components/ui/navigation-events';
import { AcademyProvider } from '@/context/academy-context';
import { UserActivityTracker } from '@/components/UserActivityTracker';
import { GlobalAnnouncement } from '@/components/GlobalAnnouncement';
import InstallPrompt from '@/components/pwa/install-prompt';
import { TauriUpdater } from '@/components/TauriUpdater';
import { DesktopTitleBar } from '@/components/desktop/TitleBar';
import { DesktopLauncher } from '@/components/desktop/DesktopLauncher';
import { TauriLayoutWrapper } from '@/components/desktop/TauriWrapper';
import { ChunkErrorListener } from '@/components/shared/chunk-error-listener';
import { ClientSideInitializer } from '@/components/shared/client-initializer';
import { PWAProvider } from '@/context/pwa-context';
import { SplashScreen } from '@/components/shared/splash-screen';

import { ThemeProvider } from '@/components/theme-provider';

const siteUrl = 'https://pinnacle-academia.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Pinnacle Academia - Igniting Minds, Achieving Excellence',
    template: '%s | Pinnacle Academia'
  },
  description: 'Pinnacle Academia is a vibrant academic community driving excellence through online and physical tutorials, exam registration, and admission processing.',
  keywords: [
    'JAMB prep', 
    'WAEC tutorial', 
    'NECO classes', 
    'SAT coaching', 
    'IELTS tutorials', 
    'JUPEB direct entry', 
    'admission processing nigeria', 
    'Pinnacle Academia'
  ],
  applicationName: 'Pinnacle Academia',
  authors: [{ name: 'Pinnacle Academia Team' }],
  generator: 'Next.js',
  publisher: 'Pinnacle Academia',
  referrer: 'origin-when-cross-origin',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/pinlogo.png', type: 'image/png', sizes: '512x512' },
      { url: '/pinlogo.png', sizes: 'any' },
    ],
    apple: [
      { url: '/pinlogo.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Pinnacle Academia',
  },
  openGraph: {
    title: 'Pinnacle Academia - Igniting Minds, Achieving Excellence',
    description: 'Join Pinnacle Academia for top-tier tutorials (JAMB, WAEC, SAT, IELTS), exam registrations, and tertiary admission counseling.',
    url: siteUrl,
    siteName: 'Pinnacle Academia',
    images: [
      {
        url: `${siteUrl}/assets/pinlogo.jpg`,
        width: 512,
        height: 512,
        type: 'image/jpeg',
        alt: 'Pinnacle Academia Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pinnacle Academia - Igniting Minds, Achieving Excellence',
    description: 'Join Pinnacle Academia for top-tier tutorials (JAMB, WAEC, SAT, IELTS), exam registrations, and tertiary admission counseling.',
    images: [`${siteUrl}/assets/pinlogo.jpg`],
    creator: '@pinnacle_academia',
  },
  alternates: {
    canonical: siteUrl,
  }
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'EducationalOrganization',
      '@id': `${siteUrl}/#organization`,
      name: 'Pinnacle Academia',
      url: siteUrl,
      logo: `${siteUrl}/pinlogo.png`,
      sameAs: [
        'https://share.google/zSJOsFEcwRPpem4A2'
      ]
    },
    {
      '@type': 'WebSite',
      name: 'Pinnacle Academia',
      url: siteUrl,
      description: 'A vibrant academic community driving excellence through online and physical tutorials, exam registration, and admission processing.'
    },
    {
      '@type': 'BreadcrumbList',
      'itemListElement': [
        {
          '@type': 'ListItem',
          'position': 1,
          'name': 'Home',
          'item': siteUrl
        },
        {
          '@type': 'ListItem',
          'position': 2,
          'name': 'Pricing',
          'item': `${siteUrl}/pricing`
        },
        {
          '@type': 'ListItem',
          'position': 3,
          'name': 'Download',
          'item': `${siteUrl}/download`
        },
        {
          '@type': 'ListItem',
          'position': 4,
          'name': 'Blog',
          'item': `${siteUrl}/blog`
        },
        {
          '@type': 'ListItem',
          'position': 5,
          'name': 'Contact',
          'item': `${siteUrl}/contact`
        },
        {
          '@type': 'ListItem',
          'position': 6,
          'name': 'Help Center',
          'item': `${siteUrl}/help-center`
        },
        {
          '@type': 'ListItem',
          'position': 7,
          'name': 'Our Mission',
          'item': `${siteUrl}/about/our-mission`
        }
      ]
    }
  ]
};

import Script from 'next/script';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" prefix="og: http://ogp.me/ns#" suppressHydrationWarning>
      <head>
        <meta name="google-site-verification" content="QGYrHkSlC71065ymk6dZc6DFesm14JeSPw-myjzZVso" />
        <meta name="google-site-verification" content="h4KW6zLUY11SNW4vSDtKaEMH73RbwSHjSvEtv4PJsCo" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Instrument+Serif:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=Bricolage+Grotesque:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <Script src="https://code.iconify.design/iconify-icon/2.1.0/iconify-icon.min.js" strategy="afterInteractive" />
        
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}

        {/* Smartsupp Chat */}
        {process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SMARTSUPP_KEY && (
          <Script id="smartsupp-chat" strategy="lazyOnload">
            {`
              var _smartsupp = _smartsupp || {};
              _smartsupp.key = '${process.env.NEXT_PUBLIC_SMARTSUPP_KEY}';
              window.smartsupp||(function(d){
              var s=d.getElementsByTagName('script')[0],c=d.createElement('script');
              c.type='text/javascript';c.charset='utf-8';c.async=true;
              c.src='https://www.smartsuppchat.com/loader.js?';s.parentNode.insertBefore(c,s);
              })(document);
            `}
          </Script>
        )}

        {/* Meta Pixel */}
        {process.env.NODE_ENV === 'production' && (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '1777044610581'); // Reference ID
              fbq('track', 'PageView');
            `}
          </Script>
        )}

        {/* Tiktok Pixel */}
        {process.env.NODE_ENV === 'production' && (
          <Script id="tiktok-pixel" strategy="afterInteractive">
            {`
               !function (w, d, t) {
                 w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","detach","updateConfig"],ttq.setAndLog=function(t,e){return function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq[ttq.methods[i]]=ttq.setAndLog(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)e[ttq.methods[n]]=ttq.setAndLog(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=d.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
                ttq.load('D2GLT5BC77U9B02LVDL0');
                ttq.page();
              }(window, document, 'ttq');
            `}
          </Script>
        )}

        {/* Twitter Pixel */}
        {process.env.NODE_ENV === 'production' && (
          <Script id="twitter-pixel" strategy="afterInteractive">
            {`
              !function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);
              },s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',
              a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');
              twq('config','ohv59');
            `}
          </Script>
        )}
      </head>
      <body className={cn('font-body antialiased bg-background text-foreground')} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <SplashScreen />
          <ClientSideInitializer />
          <ChunkErrorListener />
          <FirebaseClientProvider>
            <PWAProvider>
              <UserActivityTracker />
              <GlobalAnnouncement />
              <Loader />
              <InstallPrompt />
              <TauriUpdater />
              <AcademyProvider>
                <TauriLayoutWrapper>
                   <DesktopTitleBar />
                   <DesktopLauncher />
                   <Suspense>
                     <NavigationEvents />
                   </Suspense>
                   {children}
                </TauriLayoutWrapper>
              </AcademyProvider>
            </PWAProvider>
          </FirebaseClientProvider>
        </ThemeProvider>
        <Toaster />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
