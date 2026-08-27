import * as React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { TauriLayoutWrapper } from '@/components/desktop/TauriWrapper';
import { DesktopTitleBar } from '@/components/desktop/TitleBar';
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'NetSentry - Windows Security & Bandwidth Monitor',
  description: 'Manage inbound/outbound process telemetry, socket inspection, and secure your Windows environment.',
  icons: {
    icon: [
      { url: '/pinlogo.png', sizes: 'any' },
    ]
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className="font-sans antialiased bg-background text-foreground" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <TauriLayoutWrapper>
            <DesktopTitleBar />
            {children}
          </TauriLayoutWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
